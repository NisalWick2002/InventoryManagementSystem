import { Router, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import { validateQuery } from '../../middleware/validate.js';
import {
  RawStock,
  FinishedStock,
  StockMovement,
  Batch,
  Order,
  Dispatch
} from '../../db/models/index.js';
import mongoose from 'mongoose';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

const movementsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.string().optional().transform((v) => (v ? Number(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Number(v) : 50)),
});

const dateRangeQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const expiryQuerySchema = z.object({
  days: z.string().optional().transform((v) => (v ? Number(v) : 30)),
});

const traceabilityQuerySchema = z.object({
  wholesalerId: z.string().optional(),
});

// GET /api/reports/stock-on-hand
router.get('/reports/stock-on-hand', internalOnly, async (_req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const raw = await RawStock.find()
      .populate('productId', 'name sku unit')
      .lean();
    const finished = await FinishedStock.find({ quantity: { $gt: 0 } })
      .populate('productId', 'name sku unit')
      .populate('batchId', 'batchId expiryDate')
      .lean();
    res.json({
      success: true,
      data: {
        rawMaterials: raw,
        finishedGoods: finished,
      },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/movements
router.get('/reports/movements', internalOnly, validateQuery(movementsQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, page = 1, limit = 50 } = req.query as unknown as z.infer<typeof movementsQuerySchema>;
    const filter: Record<string, unknown> = {};
    if (from) filter.createdAt = { $gte: new Date(from) };
    if (to) filter.createdAt = { ...(filter.createdAt as object), $lte: new Date(to) };
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const lim = Math.min(100, Math.max(1, limit));
    const [items, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('productId', 'name sku unit')
        .populate('batchId', 'batchId')
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/expiry
router.get('/reports/expiry', internalOnly, validateQuery(expiryQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { days = 30 } = req.query as unknown as z.infer<typeof expiryQuerySchema>;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const items = await FinishedStock.find({
      quantity: { $gt: 0 },
      expiryDate: { $lte: cutoff },
    })
      .populate('productId', 'name sku unit')
      .populate('batchId', 'batchId manufactureDate')
      .sort({ expiryDate: 1 })
      .lean();
    res.json({ success: true, data: { items, days } });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/production
router.get('/reports/production', internalOnly, validateQuery(dateRangeQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as unknown as z.infer<typeof dateRangeQuerySchema>;
    const filter: Record<string, unknown> = { status: 'COMPLETED' };
    if (from) filter.completedAt = { $gte: new Date(from) };
    if (to) filter.completedAt = { ...(filter.completedAt as object), $lte: new Date(to) };
    const items = await Batch.find(filter)
      .populate('finishedProductId', 'name sku unit')
      .sort({ completedAt: -1 })
      .lean();
    res.json({ success: true, data: { items } });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/wastage
router.get('/reports/wastage', internalOnly, validateQuery(dateRangeQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as unknown as z.infer<typeof dateRangeQuerySchema>;
    const filter: Record<string, unknown> = { status: 'COMPLETED', wastageQty: { $gt: 0 } };
    if (from) filter.completedAt = { $gte: new Date(from) };
    if (to) filter.completedAt = { ...(filter.completedAt as object), $lte: new Date(to) };
    const items = await Batch.find(filter)
      .populate('finishedProductId', 'name sku unit')
      .sort({ completedAt: -1 })
      .lean();
    const totalWastage = items.reduce((s, b) => s + (b.wastageQty ?? 0), 0);
    res.json({ success: true, data: { items, totalWastage } });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/sales-by-wholesaler (dispatches = sales)
router.get('/reports/sales-by-wholesaler', internalOnly, validateQuery(dateRangeQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as unknown as z.infer<typeof dateRangeQuerySchema>;
    const orderFilter: Record<string, unknown> = { status: 'DISPATCHED' };
    if (from) orderFilter.updatedAt = { $gte: new Date(from) };
    if (to) orderFilter.updatedAt = { ...(orderFilter.updatedAt as object), $lte: new Date(to) };
    const orders = await Order.find(orderFilter)
      .populate('wholesalerId', 'name')
      .populate('items.finishedProductId', 'name sku')
      .lean();
    const byWholesaler: Record<string, { name: string; orderCount: number; totalQty: number }> = {};
    for (const o of orders) {
      const wholesaler = o.wholesalerId as unknown as { _id?: mongoose.Types.ObjectId; name?: string };
      const wid = wholesaler?._id?.toString() ?? 'unknown';
      if (!byWholesaler[wid]) {
        byWholesaler[wid] = {
          name: wholesaler?.name ?? 'Unknown',
          orderCount: 0,
          totalQty: 0,
        };
      }
      byWholesaler[wid].orderCount += 1;
      for (const item of o.items ?? []) {
        byWholesaler[wid].totalQty += (item as { qty: number }).qty ?? 0;
      }
    }
    res.json({ success: true, data: { byWholesaler: Object.values(byWholesaler) } });
  } catch (e) {
    next(e);
  }
});

// GET /api/reports/traceability
router.get('/reports/traceability', internalOnly, validateQuery(traceabilityQuerySchema), async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const { wholesalerId } = req.query as unknown as z.infer<typeof traceabilityQuerySchema>;
    const orderFilter: Record<string, unknown> = { status: 'DISPATCHED' };
    if (wholesalerId) orderFilter.wholesalerId = wholesalerId;
    const orders = await Order.find(orderFilter).select('_id wholesalerId items').lean();
    const orderIds = orders.map((o) => o._id);
    const dispatches = await Dispatch.find({ orderId: { $in: orderIds } })
      .populate('allocations.batchId', 'batchId finishedProductId manufactureDate expiryDate')
      .populate('allocations.productId', 'name sku')
      .lean();
    const trace = dispatches.map((d) => ({
      dispatchId: d._id,
      orderId: d.orderId,
      allocations: d.allocations,
      dispatchedAt: d.dispatchedAt,
    }));
    res.json({ success: true, data: { trace } });
  } catch (e) {
    next(e);
  }
});

export default router;

