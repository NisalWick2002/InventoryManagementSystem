import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRawStock extends Document {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unit: string;
  updatedAt: Date;
}

const RawStockSchema = new Schema<IRawStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true },
  },
  { timestamps: true }
);

// Unique index for productId is already created via schema field definition.

export const RawStock: Model<IRawStock> = mongoose.model<IRawStock>('RawStock', RawStockSchema);
