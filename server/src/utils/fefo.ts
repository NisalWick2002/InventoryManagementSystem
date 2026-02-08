import type { Types } from 'mongoose';

export interface FinishedStockRow {
  productId: Types.ObjectId;
  batchId: Types.ObjectId;
  quantity: number;
  unit: string;
  expiryDate: Date;
}

export interface AllocationLine {
  batchId: Types.ObjectId;
  productId: Types.ObjectId;
  qty: number;
  unit: string;
}

/**
 * FEFO: First-Expire-First-Out. Allocate requested qty for a product from batches
 * in order of expiry (earliest first).
 */
export function allocateFEFO(
  productId: Types.ObjectId,
  requestedQty: number,
  unit: string,
  batches: FinishedStockRow[]
): AllocationLine[] {
  const byProduct = batches.filter(
    (b) => b.productId.toString() === productId.toString() && b.quantity > 0
  );
  byProduct.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const allocations: AllocationLine[] = [];
  let remaining = requestedQty;

  for (const row of byProduct) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, row.quantity);
    if (take > 0) {
      allocations.push({
        batchId: row.batchId,
        productId: row.productId,
        qty: take,
        unit: row.unit,
      });
      remaining -= take;
    }
  }

  return allocations;
}
