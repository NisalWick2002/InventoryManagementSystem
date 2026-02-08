import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { User, Wholesaler } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { nameSchema } from '../../utils/validation.js';

const router = Router();
const ownerOnly = [requireAuth, loadUser, requireRole(['OWNER'])];

const createUserSchema = z
  .object({
    firebaseUid: z.string().min(6).max(128),
    email: z.string().email(),
    displayName: nameSchema.optional(),
    role: z.enum(['OWNER', 'EMPLOYEE', 'WHOLESALER']),
    wholesalerId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === 'WHOLESALER' && !val.wholesalerId) {
      ctx.addIssue({ code: 'custom', path: ['wholesalerId'], message: 'wholesalerId is required for WHOLESALER' });
    }
  });

const updateUserSchema = z.object({
  displayName: nameSchema.optional(),
  role: z.enum(['OWNER', 'EMPLOYEE', 'WHOLESALER']).optional(),
  wholesalerId: z.string().optional().nullable(),
});

router.post('/users', ownerOnly, validateBody(createUserSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { firebaseUid, email, displayName, role, wholesalerId } = req.body;
    const existing = await User.findOne({ $or: [{ firebaseUid }, { email }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_USER', message: 'User with this UID or email already exists' },
      });
    }
    const wid = wholesalerId ? (await Wholesaler.findById(wholesalerId))?._id : undefined;
    const user = await User.create({
      firebaseUid,
      email,
      displayName,
      role,
      wholesalerId: role === 'WHOLESALER' ? wid : undefined,
    });
    await logAudit({
      action: 'CREATE_USER',
      resource: 'User',
      resourceId: user._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Created user ${email}`,
      metadata: { email, role },
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

router.get('/users', ownerOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);
    res.json({ success: true, data: { items: users, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.patch('/users/:id', ownerOnly, validateBody(updateUserSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.displayName !== undefined) user.displayName = req.body.displayName;
    if (req.body.wholesalerId !== undefined) {
      user.wholesalerId = req.body.wholesalerId ? (await Wholesaler.findById(req.body.wholesalerId))?._id : undefined;
    }
    await user.save();
    await logAudit({
      action: 'UPDATE_USER',
      resource: 'User',
      resourceId: user._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Updated user ${user.email}`,
      metadata: req.body,
      ip: req.ip,
    });
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

export default router;
