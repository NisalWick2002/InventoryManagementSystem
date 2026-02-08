import { describe, it, expect } from 'vitest';
import { allocateFEFO } from '../src/utils/fefo.js';
import type { Types } from 'mongoose';

function oid(s: string): Types.ObjectId {
  return s as unknown as Types.ObjectId;
}

describe('FEFO allocation', () => {
  const productId = oid('507f1f77bcf86cd799439011');
  const batch1 = oid('507f1f77bcf86cd799439012');
  const batch2 = oid('507f1f77bcf86cd799439013');
  const batch3 = oid('507f1f77bcf86cd799439014');

  it('allocates from earliest-expiry batch first', () => {
    const batches = [
      { productId, batchId: batch2, quantity: 20, unit: 'units', expiryDate: new Date('2025-03-01') },
      { productId, batchId: batch1, quantity: 30, unit: 'units', expiryDate: new Date('2025-02-01') },
      { productId, batchId: batch3, quantity: 15, unit: 'units', expiryDate: new Date('2025-04-01') },
    ];
    const result = allocateFEFO(productId, 25, 'units', batches);
    expect(result).toHaveLength(1);
    expect(result[0].batchId).toEqual(batch1);
    expect(result[0].qty).toBe(25);
  });

  it('allocates across multiple batches when needed', () => {
    const batches = [
      { productId, batchId: batch1, quantity: 10, unit: 'units', expiryDate: new Date('2025-02-01') },
      { productId, batchId: batch2, quantity: 20, unit: 'units', expiryDate: new Date('2025-03-01') },
    ];
    const result = allocateFEFO(productId, 25, 'units', batches);
    expect(result).toHaveLength(2);
    expect(result[0].qty).toBe(10);
    expect(result[1].qty).toBe(15);
    expect(result.reduce((s, a) => s + a.qty, 0)).toBe(25);
  });

  it('returns empty when no stock', () => {
    const batches: Array<{ productId: Types.ObjectId; batchId: Types.ObjectId; quantity: number; unit: string; expiryDate: Date }> = [];
    const result = allocateFEFO(productId, 5, 'units', batches);
    expect(result).toHaveLength(0);
  });

  it('returns partial when insufficient stock', () => {
    const batches = [
      { productId, batchId: batch1, quantity: 3, unit: 'units', expiryDate: new Date('2025-02-01') },
    ];
    const result = allocateFEFO(productId, 10, 'units', batches);
    expect(result).toHaveLength(1);
    expect(result[0].qty).toBe(3);
  });

  it('ignores batches for other products', () => {
    const otherProductId = oid('507f1f77bcf86cd799439099');
    const batches = [
      { productId: otherProductId, batchId: batch1, quantity: 100, unit: 'units', expiryDate: new Date('2025-02-01') },
    ];
    const result = allocateFEFO(productId, 10, 'units', batches);
    expect(result).toHaveLength(0);
  });
});
