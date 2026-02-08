import mongoose, { Schema, Document, Model } from 'mongoose';

export type MovementType = 'GRN_IN' | 'PROD_CONSUME' | 'PROD_OUTPUT' | 'DISPATCH_OUT' | 'ADJUSTMENT';

export interface IStockMovement extends Document {
  type: MovementType;
  productId: mongoose.Types.ObjectId;
  batchId?: mongoose.Types.ObjectId;
  qty: number;
  unit: string;
  referenceId?: mongoose.Types.ObjectId;
  referenceType?: string;
  userId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    type: { type: String, enum: ['GRN_IN', 'PROD_CONSUME', 'PROD_OUTPUT', 'DISPATCH_OUT', 'ADJUSTMENT'], required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    qty: { type: Number, required: true },
    unit: { type: String, required: true },
    referenceId: Schema.Types.ObjectId,
    referenceType: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
  },
  { timestamps: true }
);

StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ type: 1, createdAt: -1 });
StockMovementSchema.index({ referenceId: 1 });

export const StockMovement: Model<IStockMovement> = mongoose.model<IStockMovement>(
  'StockMovement',
  StockMovementSchema
);
