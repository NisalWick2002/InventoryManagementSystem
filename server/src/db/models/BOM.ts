import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBOMComponent {
  rawMaterialId: mongoose.Types.ObjectId;
  qtyPerUnit: number;
  unit: string;
}

export interface IBOM extends Document {
  finishedProductId: mongoose.Types.ObjectId;
  components: IBOMComponent[];
  createdAt: Date;
  updatedAt: Date;
}

const BOMComponentSchema = new Schema<IBOMComponent>(
  {
    rawMaterialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qtyPerUnit: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
  },
  { _id: false }
);

const BOMSchema = new Schema<IBOM>(
  {
    finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    components: { type: [BOMComponentSchema], required: true, default: [] },
  },
  { timestamps: true }
);

// Unique index for finishedProductId is already created via schema field definition.

export const BOM: Model<IBOM> = mongoose.model<IBOM>('BOM', BOMSchema);
