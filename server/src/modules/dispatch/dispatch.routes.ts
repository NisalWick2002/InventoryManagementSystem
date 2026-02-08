import { Router, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { requireAuth, loadUser, requireRole, type AppRequest } from '../../middleware/auth.js';
import {
  Order,
  Dispatch,
  FinishedStock,
  StockMovement,
} from '../../db/models/index.js';
import { allocateFEFO } from '../../utils/fefo.js';
import { generateDeliveryNotePDF } from '../../utils/pdf.js';
import { logAudit } from '../../utils/audit.js';
import { startDbSession } from '../../utils/transactions.js';

const router = Router();
const internalOnly = [requireAuth, loadUser, requireRole(['OWNER', 'EMPLOYEE'])];

// POST /api/dispatches - create dispatch for a CONFIRMED order (FEFO allocation)
router.post('/dispatches', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const orderId = req.body?.orderId;
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId is required and must be valid' },
      });
    }
    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Order must be CONFIRMED to dispatch' },
      });
    }
    const existingDispatch = await Dispatch.findOne({ orderId: order._id });
    if (existingDispatch) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_DISPATCHED', message: 'Order already has a dispatch' },
      });
    }

    const finishedStocks = await FinishedStock.find({ quantity: { $gt: 0 } }).lean();
    const allocations: Array<{ batchId: mongoose.Types.ObjectId; productId: mongoose.Types.ObjectId; qty: number; unit: string }> = [];

    for (const item of order.items) {
      const productId = item.finishedProductId as unknown as mongoose.Types.ObjectId;
      const allocated = allocateFEFO(productId, item.qty, item.unit, finishedStocks);
      const totalAllocated = allocated.reduce((s, a) => s + a.qty, 0);
      if (totalAllocated < item.qty) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient finished stock for product ${productId}. Requested: ${item.qty}, Allocated: ${totalAllocated}`,
          },
        });
      }
      allocations.push(...allocated);
    }

    const session = await startDbSession();
    if (!session) {
      return res.status(500).json({
        success: false,
        error: { code: 'TRANSACTIONS_UNSUPPORTED', message: 'Transactions are not supported by the current MongoDB setup' },
      });
    }
    try {
      for (const alloc of allocations) {
        const fs = await FinishedStock.findOne({
          productId: alloc.productId,
          batchId: alloc.batchId,
        }).session(session);
        if (!fs || fs.quantity < alloc.qty) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            error: { code: 'INSUFFICIENT_STOCK', message: 'Stock changed during allocation' },
          });
        }
        fs.quantity -= alloc.qty;
        await fs.save({ session });
        await StockMovement.create(
          [
            {
              type: 'DISPATCH_OUT',
              productId: alloc.productId,
              batchId: alloc.batchId,
              qty: -alloc.qty,
              unit: alloc.unit,
              referenceId: order._id,
              referenceType: 'Order',
              userId: req.user!._id,
            },
          ],
          { session }
        );
      }
      const dispatch = await Dispatch.create(
        [
          {
            orderId: order._id,
            allocations,
            dispatchedBy: req.user!._id,
            dispatchedAt: new Date(),
          },
        ],
        { session }
      );
      const orderUpdate = await Order.updateOne(
        { _id: order._id, status: 'CONFIRMED' },
        { $set: { status: 'DISPATCHED' } },
        { session }
      );
      if (!orderUpdate.matchedCount) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Order status changed during dispatch' },
        });
      }
      await session.commitTransaction();

      await logAudit({
        action: 'CREATE_DISPATCH',
        resource: 'Dispatch',
        resourceId: dispatch[0]._id.toString(),
        userId: req.user!._id,
        userEmail: req.user!.email,
        actorRole: req.user!.role,
        summary: `Created dispatch for order ${order._id}`,
        metadata: { orderId: order._id.toString(), allocations: allocations.length },
        ip: req.ip,
      });

      const populated = await Dispatch.findById(dispatch[0]._id)
        .populate('orderId')
        .populate('allocations.batchId', 'batchId')
        .populate('allocations.productId', 'name sku')
        .lean();
      res.status(201).json({ success: true, data: populated ?? dispatch[0] });
    } finally {
      await session.endSession();
    }
  } catch (e) {
    next(e);
  }
});

router.get('/dispatches', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Dispatch.find()
        .populate('orderId')
        .populate('allocations.batchId', 'batchId')
        .populate('allocations.productId', 'name sku')
        .sort({ dispatchedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Dispatch.countDocuments(),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (e) {
    next(e);
  }
});

router.get('/dispatches/:id', internalOnly, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('orderId')
      .populate('allocations.batchId', 'batchId expiryDate')
      .populate('allocations.productId', 'name sku unit')
      .lean();
    if (!dispatch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dispatch not found' } });
    res.json({ success: true, data: dispatch });
  } catch (e) {
    next(e);
  }
});

// GET /api/dispatches/:id/pdf - stream Delivery Note PDF
router.get('/dispatches/:id/pdf', requireAuth, loadUser, async (req: AppRequest, res: Response, next: NextFunction) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('orderId')
      .populate('allocations.batchId')
      .populate('allocations.productId')
      .lean();
    if (!dispatch)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dispatch not found' } });
    const order = await Order.findById(dispatch.orderId).populate('wholesalerId').lean();
    if (!order)
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    const user = req.user!;
    if (user.role === 'WHOLESALER') {
      const orderWid = (order.wholesalerId as { _id: unknown })._id?.toString();
      if (user.wholesalerId?.toString() !== orderWid) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your dispatch' } });
      }
    }
    const wholesaler = order.wholesalerId as unknown as { name?: string; address?: string };
    const allocations = dispatch.allocations as unknown as Array<{
      batchId?: { batchId?: string };
      productId?: { name?: string; sku?: string };
      qty: number;
      unit: string;
    }>;
    const allocationsWithDetails = (allocations ?? []).map((a) => ({
      allocation: { productId: a.productId, batchId: a.batchId, qty: a.qty, unit: a.unit },
      product: a.productId,
      batch: a.batchId,
    }));
    const ctx = {
      dispatch: { _id: dispatch._id, dispatchedAt: dispatch.dispatchedAt },
      order: { _id: order._id },
      wholesaler: { name: wholesaler.name ?? 'Unknown', address: wholesaler.address },
      allocationsWithDetails,
    };
    const pdfBuffer = await generateDeliveryNotePDF(ctx);
    await logAudit({
      action: 'DOWNLOAD_DELIVERY_NOTE',
      resource: 'Dispatch',
      resourceId: dispatch._id.toString(),
      userId: req.user!._id,
      userEmail: req.user!.email,
      actorRole: req.user!.role,
      summary: `Downloaded delivery note ${dispatch._id}`,
      metadata: { orderId: order._id.toString() },
      ip: req.ip,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="delivery-note-${dispatch._id}.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
});

export default router;
