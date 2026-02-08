import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFinishedStock extends Document {
  productId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  expiryDate: Date;
  updatedAt: Date;
}

const FinishedStockSchema = new Schema<IFinishedStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true },
    expiryDate: { type: Date, required: true },
  },
  { timestamps: true }
);

FinishedStockSchema.index({ productId: 1, batchId: 1 }, { unique: true });
FinishedStockSchema.index({ productId: 1, expiryDate: 1 });

export const FinishedStock: Model<IFinishedStock> = mongoose.model<IFinishedStock>(
  'FinishedStock',
  FinishedStockSchema
);
