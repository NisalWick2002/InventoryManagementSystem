import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { Wholesaler } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { nameSchema } from '../../utils/validation.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const createWholesalerSchema = z.object({
  name: nameSchema,
  contactPerson: z.string().min(2).max(80).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().min(5).max(200).optional(),
});

const updateWholesalerSchema = createWholesalerSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
});

router.get('/wholesalers', internalOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Wholesaler.find().sort({ name: 1 }).skip(skip).limit(lim).lean(),
      Wholesaler.countDocuments(),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.post('/wholesalers', internalOnly, validateBody(createWholesalerSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const wholesaler = await Wholesaler.create(req.body);
    await logAudit({
      action: 'CREATE_WHOLESALER',
      resource: 'Wholesaler',
      resourceId: wholesaler._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created wholesaler ${wholesaler.name}`,
      metadata: { name: wholesaler.name },
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: wholesaler });
  } catch (e) {
    next(e);
  }
});

router.get('/wholesalers/:id', requireAuth, loadUser, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const wholesaler = await Wholesaler.findById(req.params.id).lean();
    if (!wholesaler)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Wholesaler not found' } });
    res.json({ success: true, data: wholesaler });
  } catch (e) {
    next(e);
  }
});

router.patch('/wholesalers/:id', internalOnly, validateBody(updateWholesalerSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const wholesaler = await Wholesaler.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!wholesaler)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Wholesaler not found' } });
    await logAudit({
      action: 'UPDATE_WHOLESALER',
      resource: 'Wholesaler',
      resourceId: wholesaler._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated wholesaler ${wholesaler.name}`,
      metadata: req.body,
      ip: req.ip,
    });
    res.json({ success: true, data: wholesaler });
  } catch (e) {
    next(e);
  }
});

router.delete('/wholesalers/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const wholesaler = await Wholesaler.findByIdAndDelete(req.params.id);
    if (!wholesaler)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Wholesaler not found' } });
    await logAudit({
      action: 'DELETE_WHOLESALER',
      resource: 'Wholesaler',
      resourceId: wholesaler._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Deleted wholesaler ${wholesaler.name}`,
      metadata: { name: wholesaler.name },
      ip: req.ip,
    });
    res.json({ success: true, data: { id: wholesaler._id } });
  } catch (e) {
    next(e);
  }
});

export default router;
