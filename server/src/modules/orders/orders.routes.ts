import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { Order } from '../../db/models/index.js';
import { logAudit } from '../../utils/audit.js';
import { unitSchema } from '../../utils/validation.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const orderItemSchema = z.object({
  finishedProductId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)),
  qty: z.number().positive(),
  unit: unitSchema,
});

const createOrderSchema = z.object({
  wholesalerId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v)).optional(),
  items: z.array(orderItemSchema).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
});

const listQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 20)),
  status: z.enum(['DRAFT', 'CONFIRMED', 'DISPATCHED', 'CANCELLED']).optional(),
  wholesalerId: z.string().optional(),
});

// Wholesaler: create order + get my orders
router.post('/orders', requireAuth, loadUser, validateBody(createOrderSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const body = req.body as z.infer<typeof createOrderSchema>;
    let wholesalerId = body.wholesalerId;
    if (user.role === 'WHOLESALER') {
      if (!user.wholesalerId) {
        return res.status(403).json({
          success: false,
          error: { code: 'NO_WHOLESALER', message: 'Your account is not linked to a wholesaler' },
        });
      }
      wholesalerId = user.wholesalerId.toString();
    } else if (!wholesalerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'wholesalerId is required' },
      });
    }
    const order = await Order.create({
      wholesalerId,
      items: body.items.map((i) => ({ finishedProductId: i.finishedProductId, qty: i.qty, unit: i.unit })),
      status: 'DRAFT',
      createdBy: user._id,
    });
    await logAudit({
      action: 'CREATE_ORDER',
      resource: 'Order',
      resourceId: order._id.toString(),
      userId: user._id,
      userEmail: user.email,
      actorRole: user.role,
      summary: `Created order ${order._id}`,
      metadata: { wholesalerId, items: body.items.length },
      ip: req.ip,
    });
    const populated = await Order.findById(order._id)
      .populate('wholesalerId', 'name')
      .populate('items.finishedProductId', 'name sku unit')
      .lean();
    res.status(201).json({ success: true, data: populated ?? order });
  } catch (e) {
    next(e);
  }
});

router.get('/orders/my', requireAuth, loadUser, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    if (user.role !== 'WHOLESALER' || !user.wholesalerId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only wholesalers can access my orders' },
      });
    }
    const { page = 1, limit = 20 } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Order.find({ wholesalerId: user.wholesalerId })
        .populate('items.finishedProductId', 'name sku unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Order.countDocuments({ wholesalerId: user.wholesalerId }),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

// Internal: list all orders, patch status
router.get('/orders', internalOnly, validateQuery(listQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, wholesalerId } = req.query as unknown as z.infer<typeof listQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (wholesalerId) filter.wholesalerId = wholesalerId;
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('wholesalerId', 'name')
        .populate('items.finishedProductId', 'name sku unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.get('/orders/:id', requireAuth, loadUser, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('wholesalerId', 'name')
      .populate('items.finishedProductId', 'name sku unit')
      .lean();
    if (!order)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    const user = req.user!;
    if (user.role === 'WHOLESALER' && user.wholesalerId?.toString() !== (order.wholesalerId as { _id: unknown })._id?.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your order' } });
    }
    res.json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
});

router.patch('/orders/:id/status', internalOnly, validateBody(updateOrderStatusSchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    const { status } = req.body as z.infer<typeof updateOrderStatusSchema>;
    if (status === 'CONFIRMED') {
      if (order.status !== 'DRAFT') {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Only DRAFT orders can be confirmed' },
        });
      }
      order.confirmedBy = req.user!._id;
      order.confirmedAt = new Date();
      order.status = 'CONFIRMED';
    }
    if (status === 'CANCELLED') {
      if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATE', message: 'Only DRAFT or CONFIRMED orders can be cancelled' },
        });
      }
      order.status = 'CANCELLED';
    }
    if (status === 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Orders cannot be reverted to DRAFT' },
      });
    }
    await order.save();
    await logAudit({
      action: 'UPDATE_ORDER_STATUS',
      resource: 'Order',
      resourceId: order._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Order ${order._id} status -> ${order.status}`,
      metadata: { status: order.status },
      ip: req.ip,
    });
    const populated = await Order.findById(order._id)
      .populate('wholesalerId', 'name')
      .populate('items.finishedProductId', 'name sku unit')
      .lean();
    res.json({ success: true, data: populated ?? order });
  } catch (e) {
    next(e);
  }
});

export default router;
