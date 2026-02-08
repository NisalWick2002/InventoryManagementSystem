import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { GRN, RawStock, StockMovement } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { unitSchema } from '../../utils/validation.js';
import { startDbSession } from '../../utils/transactions.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const grnItemSchema = z.object({
  rawMaterialId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  qty: z.number().positive(),
  unitCost: z.number().min(0.01),
  unit: unitSchema,
});

const createGRNSchema = z.object({
  supplierId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  date: z.string().datetime().optional(),
  items: z.array(grnItemSchema).min(1),
});

const updateGRNSchema = z.object({
  date: z.string().datetime().optional(),
  items: z.array(grnItemSchema).optional(),
});

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional(),
});

router.get('/grns', internalOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter = status ? { status } : {};
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      GRN.find(filter).populate('supplierId', 'name').sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      GRN.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/grns', internalOnly, validateBody(createGRNSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createGRNSchema>;
    const grn = await GRN.create({
      supplierId: body.supplierId,
      date: body.date ? new Date(body.date) : new Date(),
      items: body.items.map((i) => ({
        rawMaterialId: new mongoose.Types.ObjectId(i.rawMaterialId),
        qty: i.qty,
        unitCost: i.unitCost,
        unit: i.unit,
      })),
      status: 'DRAFT',
      createdBy: req.user!._id,
    });
    await logAudit({
      action: 'CREATE_GRN',
      resource: 'GRN',
      resourceId: grn._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created GRN ${grn._id}`,
      metadata: { supplierId: body.supplierId, items: body.items.length },
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: grn });
  } catch (e) {
    next(e);
  }
});

router.get('/grns/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('supplierId', 'name')
      .populate('items.rawMaterialId', 'name sku unit')
      .lean();
    if (!grn)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'GRN not found' } });
    res.json({ success: true, data: grn });
  } catch (e) {
    next(e);
  }
});

router.patch('/grns/:id', internalOnly, validateBody(updateGRNSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRN.findById(req.params.id);
    if (!grn)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'GRN not found' } });
    if (grn.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Only DRAFT GRN can be updated' },
      });
    }
    const body = req.body as z.infer<typeof updateGRNSchema>;
    if (body.date) grn.date = new Date(body.date);
    if (body.items) {
      grn.items = body.items.map((i) => ({
        rawMaterialId: new mongoose.Types.ObjectId(i.rawMaterialId),
        qty: i.qty,
        unitCost: i.unitCost,
        unit: i.unit,
      }));
    }
    await grn.save();
    await logAudit({
      action: 'UPDATE_GRN',
      resource: 'GRN',
      resourceId: grn._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated GRN ${grn._id}`,
      metadata: req.body,
      ip: req.ip,
    });
    res.json({ success: true, data: grn });
  } catch (e) {
    next(e);
  }
});

router.post('/grns/:id/confirm', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const grn = await GRN.findById(req.params.id);
    if (!grn)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'GRN not found' } });
    if (grn.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'GRN already confirmed' },
      });
    }
    const session = await startDbSession();
    if (!session) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTIONS_UNSUPPORTED', message: 'Transactions are not supported by the current MongoDB setup' },
      });
    }
    try {
      for (const item of grn.items) {
        let raw = await RawStock.findOne({ productId: item.rawMaterialId }).session(session);
        if (!raw) {
          [raw] = await RawStock.create(
            [{ productId: item.rawMaterialId, quantity: item.qty, unit: item.unit }],
            { session }
          );
        } else {
          raw.quantity += item.qty;
          await raw.save({ session });
        }
        await StockMovement.create(
          [
            {
              type: 'GRN_IN',
              productId: item.rawMaterialId,
              qty: item.qty,
              unit: item.unit,
              referenceId: grn._id,
              referenceType: 'GRN',
              userId: req.user!._id,
            },
          ],
          { session }
        );
      }
      const confirmedAt = new Date();
      const updated = await GRN.updateOne(
        { _id: grn._id, status: 'DRAFT' },
        { $set: { status: 'CONFIRMED', confirmedBy: req.user!._id, confirmedAt } },
        { session }
      );
      if (!updated.matchedCount) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'GRN was already confirmed' },
        });
      }
      grn.status = 'CONFIRMED';
      grn.confirmedBy = req.user!._id;
      grn.confirmedAt = confirmedAt;
      await session.commitTransaction();
    } finally {
      await session.endSession();
    }
    await logAudit({
      action: 'CONFIRM_GRN',
      resource: 'GRN',
      resourceId: grn._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Confirmed GRN ${grn._id}`,
      metadata: { grnId: grn._id.toString() },
      ip: req.ip,
    });
    res.json({ success: true, data: grn });
  } catch (e) {
    next(e);
  }
});

export default router;
