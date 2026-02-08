import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { Supplier } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { nameSchema } from '../../utils/validation.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const createSupplierSchema = z.object({
  name: nameSchema,
  contactPerson: z.string().min(2).max(80).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).max(200).optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
});

router.get('/suppliers', internalOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Supplier.find().sort({ name: 1 }).skip(skip).limit(lim).lean(),
      Supplier.countDocuments(),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/suppliers', internalOnly, validateBody(createSupplierSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.create(req.body);
    await logAudit({
      action: 'CREATE_SUPPLIER',
      resource: 'Supplier',
      resourceId: supplier._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created supplier ${supplier.name}`,
      metadata: { name: supplier.name },
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (e) {
    next(e);
  }
});

router.get('/suppliers/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findById(req.params.id).lean();
    if (!supplier)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    res.json({ success: true, data: supplier });
  } catch (e) {
    next(e);
  }
});

router.patch('/suppliers/:id', internalOnly, validateBody(updateSupplierSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    await logAudit({
      action: 'UPDATE_SUPPLIER',
      resource: 'Supplier',
      resourceId: supplier._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated supplier ${supplier.name}`,
      metadata: req.body,
      ip: req.ip,
    });
    res.json({ success: true, data: supplier });
  } catch (e) {
    next(e);
  }
});

router.delete('/suppliers/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Supplier not found' } });
    await logAudit({
      action: 'DELETE_SUPPLIER',
      resource: 'Supplier',
      resourceId: supplier._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Deleted supplier ${supplier.name}`,
      metadata: { name: supplier.name },
      ip: req.ip,
    });
    res.json({ success: true, data: { id: supplier._id } });
  } catch (e) {
    next(e);
  }
});

export default router;
