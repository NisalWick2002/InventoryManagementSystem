import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDispatchAllocation {
  batchId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  qty: number;
  unit: string;
}

export interface IDispatch extends Document {
  orderId: mongoose.Types.ObjectId;
  allocations: IDispatchAllocation[];
  dispatchedBy?: mongoose.Types.ObjectId;
  dispatchedAt: Date;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispatchAllocationSchema = new Schema<IDispatchAllocation>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const DispatchSchema = new Schema<IDispatch>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    allocations: { type: [DispatchAllocationSchema], required: true, default: [] },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date, required: true, default: Date.now },
    pdfUrl: String,
  },
  { timestamps: true }
);

// Unique index for orderId is already created via schema field definition.

export const Dispatch: Model<IDispatch> = mongoose.model<IDispatch>('Dispatch', DispatchSchema);
