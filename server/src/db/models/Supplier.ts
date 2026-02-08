import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

export const Supplier: Model<ISupplier> = mongoose.model<ISupplier>('Supplier', SupplierSchema);
