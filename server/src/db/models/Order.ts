import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED';

export interface IOrderItem {
  finishedProductId: mongoose.Types.ObjectId;
  qty: number;
  unit: string;
}

export interface IOrder extends Document {
  wholesalerId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  createdBy?: mongoose.Types.ObjectId;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    wholesalerId: { type: Schema.Types.ObjectId, ref: 'Wholesaler', required: true },
    items: { type: [OrderItemSchema], required: true, default: [] },
    status: { type: String, enum: ['DRAFT', 'CONFIRMED', 'DISPATCHED', 'CANCELLED'], default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,
  },
  { timestamps: true }
);

OrderSchema.index({ wholesalerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);
