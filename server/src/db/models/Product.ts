import mongoose, { Schema, Document, Model } from 'mongoose';

export type ProductType = 'RAW_MATERIAL' | 'FINISHED_GOOD';

export interface IProduct extends Document {
  type: ProductType;
  sku: string;
  name: string;
  unit: string;
  category?: string;
  reorderLevel?: number;
  cost?: number;
  sellingPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    type: { type: String, enum: ['RAW_MATERIAL', 'FINISHED_GOOD'], required: true },
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    category: String,
    reorderLevel: Number,
    cost: Number,
    sellingPrice: Number,
  },
  { timestamps: true }
);

ProductSchema.index({ type: 1 });
// Unique index for sku is already created via schema field definition.

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', ProductSchema);
