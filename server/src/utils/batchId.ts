import { Batch } from '../db/models/index.js';

export async function generateBatchId(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `BATCH-${today}-`;
  const last = await Batch.findOne({ batchId: new RegExp(`^${prefix}`) })
    .sort({ batchId: -1 })
    .select('batchId')
    .lean();
  let seq = 1;
  if (last?.batchId) {
    const match = last.batchId.match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}
