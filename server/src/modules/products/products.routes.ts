import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { Product } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { nameSchema, skuSchema, unitSchema } from '../../utils/validation.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const createProductSchema = z.object({
  type: z.enum(['RAW_MATERIAL', 'FINISHED_GOOD']),
  sku: skuSchema,
  name: nameSchema,
  unit: unitSchema,
  category: z.string().min(2).max(80).optional(),
  reorderLevel: z.number().min(0).max(1_000_000).optional(),
  cost: z.number().min(0).max(1_000_000).optional(),
  sellingPrice: z.number().min(0).max(1_000_000).optional(),
});

const updateProductSchema = createProductSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
  type: z.enum(['RAW_MATERIAL', 'FINISHED_GOOD']).optional(),
});

router.get('/products', requireAuth, loadUser, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, type } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter = type ? { type } : {};
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ type: 1, sku: 1 }).skip(skip).limit(lim).lean(),
      Product.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/products', internalOnly, validateBody(createProductSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await Product.findOne({ sku: req.body.sku });
    if (existing)
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_SKU', message: 'SKU already exists' } });
    const product = await Product.create(req.body);
    await logAudit({
      action: 'CREATE_PRODUCT',
      resource: 'Product',
      resourceId: product._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created product ${product.sku}`,
      metadata: { sku: product.sku, name: product.name, type: product.type },
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

router.get('/products/:id', requireAuth, loadUser, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

router.patch('/products/:id', internalOnly, validateBody(updateProductSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    await logAudit({
      action: 'UPDATE_PRODUCT',
      resource: 'Product',
      resourceId: product._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated product ${product.sku}`,
      metadata: req.body,
      ip: req.ip,
    });
    res.json({ success: true, data: product });
  } catch (e) {
    next(e);
  }
});

router.delete('/products/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    await logAudit({
      action: 'DELETE_PRODUCT',
      resource: 'Product',
      resourceId: product._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Deleted product ${product.sku}`,
      metadata: { sku: product.sku, name: product.name },
      ip: req.ip,
    });
    res.json({ success: true, data: { id: product._id } });
  } catch (e) {
    next(e);
  }
});

export default router;
