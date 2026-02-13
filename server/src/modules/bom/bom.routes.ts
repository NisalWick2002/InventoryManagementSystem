import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { BOM, Product } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { unitSchema } from '../../utils/validation.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const componentSchema = z.object({
  rawMaterialId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  qtyPerUnit: z.number().positive(),
  unit: unitSchema,
});

const createBOMSchema = z.object({
  finishedProductId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  components: z.array(componentSchema).min(1),
});

const updateBOMSchema = z.object({
  components: z.array(componentSchema).min(1),
});

router.get('/boms', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      BOM.find()
        .populate('finishedProductId', 'name sku unit')
        .populate('components.rawMaterialId', 'name sku unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BOM.countDocuments(),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/boms', internalOnly, validateBody(createBOMSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body as z.infer<typeof createBOMSchema>;
    const fp = await Product.findById(body.finishedProductId);
    if (!fp || fp.type !== 'FINISHED_GOOD') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PRODUCT', message: 'finishedProductId must be a FINISHED_GOOD' },
      });
    }
    const existing = await BOM.findOne({ finishedProductId: body.finishedProductId });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_BOM', message: 'BOM already exists for this product' },
      });
    }
    const bom = await BOM.create({
      finishedProductId: body.finishedProductId,
      components: body.components.map((c) => ({
        rawMaterialId: c.rawMaterialId,
        qtyPerUnit: c.qtyPerUnit,
        unit: c.unit,
      })),
    });
    await logAudit({
      action: 'CREATE_BOM',
      resource: 'BOM',
      resourceId: bom._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created BOM for ${body.finishedProductId}`,
      metadata: { finishedProductId: body.finishedProductId, components: body.components.length },
      ip: req.ip,
    });
    const populated = await BOM.findById(bom._id)
      .populate('finishedProductId', 'name sku unit')
      .populate('components.rawMaterialId', 'name sku unit')
      .lean();
    res.status(201).json({ success: true, data: populated ?? bom });
  } catch (e) {
    next(e);
  }
});

router.get('/boms/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const bom = await BOM.findById(req.params.id)
      .populate('finishedProductId', 'name sku unit')
      .populate('components.rawMaterialId', 'name sku unit')
      .lean();
    if (!bom)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'BOM not found' } });
    res.json({ success: true, data: bom });
  } catch (e) {
    next(e);
  }
});

router.get('/boms/product/:productId', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const bom = await BOM.findOne({ finishedProductId: req.params.productId })
      .populate('finishedProductId', 'name sku unit')
      .populate('components.rawMaterialId', 'name sku unit')
      .lean();
    if (!bom)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'BOM not found' } });
    res.json({ success: true, data: bom });
  } catch (e) {
    next(e);
  }
});

router.patch('/boms/:id', internalOnly, validateBody(updateBOMSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const bom = await BOM.findByIdAndUpdate(
      req.params.id,
      { components: (req.body as z.infer<typeof updateBOMSchema>).components.map((c) => ({ rawMaterialId: c.rawMaterialId, qtyPerUnit: c.qtyPerUnit, unit: c.unit })) },
      { new: true }
    )
      .populate('finishedProductId', 'name sku unit')
      .populate('components.rawMaterialId', 'name sku unit')
      .lean();
    if (!bom)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'BOM not found' } });
    await logAudit({
      action: 'UPDATE_BOM',
      resource: 'BOM',
      resourceId: bom._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated BOM ${bom._id}`,
      metadata: { components: bom.components?.length ?? 0 },
      ip: req.ip,
    });
    res.json({ success: true, data: bom });
  } catch (e) {
    next(e);
  }
});

router.delete('/boms/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const bom = await BOM.findByIdAndDelete(req.params.id);
    if (!bom)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'BOM not found' } });
    await logAudit({
      action: 'DELETE_BOM',
      resource: 'BOM',
      resourceId: bom._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Deleted BOM ${bom._id}`,
      metadata: { finishedProductId: bom.finishedProductId?.toString() },
      ip: req.ip,
    });
    res.json({ success: true, data: { id: bom._id } });
  } catch (e) {
    next(e);
  }
});

export default router;

