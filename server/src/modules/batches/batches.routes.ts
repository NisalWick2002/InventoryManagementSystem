import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import {
  Batch,
  RawStock,
  FinishedStock,
  StockMovement,
  Product,
} from '../../db/models/index.js';
import { generateBatchId } from '../../utils/batchId.js';
import { logAudit } from '../../utils/audit.js';
import { unitSchema } from '../../utils/validation.js';
import { startDbSession } from '../../utils/transactions.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const consumptionSchema = z.object({
  rawMaterialId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  qtyPlanned: z.number().nonnegative(),
  qtyActual: z.number().nonnegative(),
  unit: unitSchema,
  reasonOverride: z.string().max(500).optional(),
});

const createBatchSchema = z.object({
  finishedProductId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  plannedQty: z.number().positive(),
  manufactureDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
});

const updateBatchSchema = z.object({
  plannedQty: z.number().positive().optional(),
  manufactureDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  consumption: z.array(consumptionSchema).optional(),
  wastageQty: z.number().min(0).optional(),
  wastageReason: z.string().optional(),
});

const completeBatchSchema = z.object({
  actualQtyProduced: z.number().positive(),
  consumption: z.array(consumptionSchema),
  wastageQty: z.number().min(0).default(0),
  wastageReason: z.string().max(500).optional(),
});

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'RELEASED']).optional(),
  finishedProductId: z.string().optional(),
});

router.get('/batches', internalOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, finishedProductId } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (finishedProductId) filter.finishedProductId = finishedProductId;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Batch.find(filter)
        .populate('finishedProductId', 'name sku unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Batch.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/batches', internalOnly, validateBody(createBatchSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createBatchSchema>;
    const fp = await Product.findById(body.finishedProductId);
    if (!fp || fp.type !== 'FINISHED_GOOD') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PRODUCT', message: 'finishedProductId must be a FINISHED_GOOD' },
      });
    }
    const batchId = await generateBatchId();
    const manufactureDate = body.manufactureDate ? new Date(body.manufactureDate) : new Date();
    const expiryDate = body.expiryDate ? new Date(body.expiryDate) : new Date(manufactureDate.getTime() + 180 * 24 * 60 * 60 * 1000);
    if (expiryDate <= manufactureDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'expiryDate must be after manufactureDate' },
      });
    }
    const batch = await Batch.create({
      batchId,
      finishedProductId: body.finishedProductId,
      plannedQty: body.plannedQty,
      manufactureDate,
      expiryDate,
      status: 'DRAFT',
      createdBy: req.user!._id,
    });
    await logAudit({
      action: 'CREATE_BATCH',
      resource: 'Batch',
      resourceId: batch._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created batch ${batch.batchId}`,
      metadata: { batchId: batch.batchId, finishedProductId: body.finishedProductId },
      ip: req.ip,
    });
    const populated = await Batch.findById(batch._id).populate('finishedProductId', 'name sku unit').lean();
    res.status(201).json({ success: true, data: populated ?? batch });
  } catch (e) {
    next(e);
  }
});

router.get('/batches/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('finishedProductId', 'name sku unit')
      .populate('consumption.rawMaterialId', 'name sku unit')
      .lean();
    if (!batch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    res.json({ success: true, data: batch });
  } catch (e) {
    next(e);
  }
});

router.patch('/batches/:id', internalOnly, validateBody(updateBatchSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    if (batch.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only DRAFT batch can be updated' },
      });
    }
    const body = req.body as z.infer<typeof updateBatchSchema>;
    if (body.plannedQty !== undefined) batch.plannedQty = body.plannedQty;
    if (body.manufactureDate !== undefined) batch.manufactureDate = new Date(body.manufactureDate);
    if (body.expiryDate !== undefined) batch.expiryDate = new Date(body.expiryDate);
    if (body.consumption !== undefined) {
      batch.consumption = body.consumption.map((c) => ({
        rawMaterialId: new mongoose.Types.ObjectId(c.rawMaterialId),
        qtyPlanned: c.qtyPlanned,
        qtyActual: c.qtyActual,
        unit: c.unit,
        reasonOverride: c.reasonOverride,
      }));
    }
    if (body.wastageQty !== undefined) batch.wastageQty = body.wastageQty;
    if (body.wastageReason !== undefined) batch.wastageReason = body.wastageReason;
    if (batch.expiryDate <= batch.manufactureDate) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DATE', message: 'expiryDate must be after manufactureDate' },
      });
    }
    await batch.save();
    await logAudit({
      action: 'UPDATE_BATCH',
      resource: 'Batch',
      resourceId: batch._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated batch ${batch.batchId}`,
      metadata: req.body,
      ip: req.ip,
    });
    const populated = await Batch.findById(batch._id)
      .populate('finishedProductId', 'name sku unit')
      .populate('consumption.rawMaterialId', 'name sku unit')
      .lean();
    res.json({ success: true, data: populated ?? batch });
  } catch (e) {
    next(e);
  }
});

router.post('/batches/:id/start', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    if (batch.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only DRAFT batch can be started' },
      });
    }
    batch.status = 'IN_PROGRESS';
    await batch.save();
    await logAudit({
      action: 'START_BATCH',
      resource: 'Batch',
      resourceId: batch._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Started batch ${batch.batchId}`,
      metadata: { batchId: batch.batchId },
      ip: req.ip,
    });
    const populated = await Batch.findById(batch._id).populate('finishedProductId', 'name sku unit').lean();
    res.json({ success: true, data: populated ?? batch });
  } catch (e) {
    next(e);
  }
});

router.post('/batches/:id/complete', internalOnly, validateBody(completeBatchSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const batch = await Batch.findById(req.params.id).populate('finishedProductId', 'unit');
    if (!batch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Batch not found' } });
    if (batch.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only IN_PROGRESS batch can be completed' },
      });
    }
    const body = req.body as z.infer<typeof completeBatchSchema>;
    const session = await startDbSession();
    if (!session) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTIONS_UNSUPPORTED', message: 'Transactions are not supported by the current MongoDB setup' },
      });
    }
    try {
      for (const line of body.consumption) {
        const raw = await RawStock.findOne({ productId: line.rawMaterialId }).session(session);
        if (!raw || raw.quantity < line.qtyActual) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_STOCK',
              message: `Insufficient raw material stock for ${line.rawMaterialId}`,
            },
          });
        }
        raw.quantity -= line.qtyActual;
        await raw.save({ session });
        await StockMovement.create(
          [
            {
              type: 'PROD_CONSUME',
              productId: line.rawMaterialId,
              batchId: batch._id,
              qty: -line.qtyActual,
              unit: line.unit,
              referenceId: batch._id,
              referenceType: 'Batch',
              userId: req.user!._id,
              notes: line.reasonOverride,
            },
          ],
          { session }
        );
      }
      const completedAt = new Date();
      const updated = await Batch.updateOne(
        { _id: batch._id, status: 'IN_PROGRESS' },
        {
          $set: {
            consumption: body.consumption.map((c) => ({
              rawMaterialId: new mongoose.Types.ObjectId(c.rawMaterialId),
              qtyPlanned: c.qtyPlanned,
              qtyActual: c.qtyActual,
              unit: c.unit,
              reasonOverride: c.reasonOverride,
            })),
            actualQtyProduced: body.actualQtyProduced,
            wastageQty: body.wastageQty ?? 0,
            wastageReason: body.wastageReason,
            status: 'COMPLETED',
            completedAt,
          },
        },
        { session }
      );
      if (!updated.matchedCount) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Batch was already completed' },
        });
      }
      batch.status = 'COMPLETED';
      batch.completedAt = completedAt;
      batch.actualQtyProduced = body.actualQtyProduced;
      batch.wastageQty = body.wastageQty ?? 0;
      batch.wastageReason = body.wastageReason;

      const unit = (batch.finishedProductId as unknown as { unit?: string }).unit ?? 'units';
      const existingFS = await FinishedStock.findOne({
        productId: batch.finishedProductId,
        batchId: batch._id,
      }).session(session);
      if (existingFS) {
        existingFS.quantity += body.actualQtyProduced;
        await existingFS.save({ session });
      } else {
        await FinishedStock.create(
          [
            {
              productId: batch.finishedProductId,
              batchId: batch._id,
              quantity: body.actualQtyProduced,
              unit,
              expiryDate: batch.expiryDate,
            },
          ],
          { session }
        );
      }
      await StockMovement.create(
        [
          {
            type: 'PROD_OUTPUT',
            productId: batch.finishedProductId,
            batchId: batch._id,
            qty: body.actualQtyProduced,
            unit,
            referenceId: batch._id,
            referenceType: 'Batch',
            userId: req.user!._id,
          },
        ],
        { session }
      );
      await session.commitTransaction();
    } finally {
      await session.endSession();
    }
    await logAudit({
      action: 'COMPLETE_BATCH',
      resource: 'Batch',
      resourceId: batch._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Completed batch ${batch.batchId}`,
      metadata: { batchId: batch.batchId, actualQty: body.actualQtyProduced },
      ip: req.ip,
    });
    const populated = await Batch.findById(batch._id)
      .populate('finishedProductId', 'name sku unit')
      .populate('consumption.rawMaterialId', 'name sku unit')
      .lean();
    res.json({ success: true, data: populated ?? batch });
  } catch (e) {
    next(e);
  }
});

export default router;
