import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import { AuditLog } from '../../db/models/index.js';

const router = Router();
const ownerOnly = [requireAuth, loadUser, requireRole(['OWNER'])];

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 50)),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  actorRole: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

router.get('/audit', ownerOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, resource, resourceId, action, userId, actorRole, from, to } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (resource) filter.resource = resource;
    if (resourceId) filter.resourceId = resourceId;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (actorRole) filter.actorRole = actorRole;
    if (from) filter.createdAt = { $gte: new Date(from) };
    if (to) filter.createdAt = { ...(filter.createdAt as object), $lte: new Date(to) };
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'email displayName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

export default router;
