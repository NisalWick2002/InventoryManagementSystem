import mongoose, { Schema, Document, Model } from 'mongoose';

export type GRNStatus = 'DRAFT' | 'CONFIRMED';

export interface IGRNItem {
  rawMaterialId: mongoose.Types.ObjectId;
  qty: number;
  unitCost: number;
  unit: string;
}

export interface IGRN extends Document {
  supplierId: mongoose.Types.ObjectId;
  date: Date;
  items: IGRNItem[];
  status: GRNStatus;
  createdBy?: mongoose.Types.ObjectId;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    rawMaterialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const GRNSchema = new Schema<IGRN>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    date: { type: Date, required: true, default: Date.now },
    items: { type: [GRNItemSchema], required: true, default: [] },
    status: { type: String, enum: ['DRAFT', 'CONFIRMED'], default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    confirmedAt: Date,
  },
  { timestamps: true }
);

GRNSchema.index({ status: 1 });
GRNSchema.index({ supplierId: 1, date: -1 });

export const GRN: Model<IGRN> = mongoose.model<IGRN>('GRN', GRNSchema);
