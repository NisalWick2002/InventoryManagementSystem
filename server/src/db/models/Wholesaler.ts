import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWholesaler extends Document {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WholesalerSchema = new Schema<IWholesaler>(
  {
    name: { type: String, required: true },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
  },
  { timestamps: true }
);

export const Wholesaler: Model<IWholesaler> = mongoose.model<IWholesaler>('Wholesaler', WholesalerSchema);
