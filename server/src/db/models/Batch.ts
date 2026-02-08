import mongoose, { Schema, Document, Model } from 'mongoose';

export type BatchStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'RELEASED';

export interface IBatchConsumption {
  rawMaterialId: mongoose.Types.ObjectId;
  qtyPlanned: number;
  qtyActual: number;
  unit: string;
  reasonOverride?: string;
}

export interface IBatch extends Document {
  batchId: string;
  finishedProductId: mongoose.Types.ObjectId;
  plannedQty: number;
  actualQtyProduced: number;
  manufactureDate: Date;
  expiryDate: Date;
  status: BatchStatus;
  consumption: IBatchConsumption[];
  wastageQty: number;
  wastageReason?: string;
  createdBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BatchConsumptionSchema = new Schema<IBatchConsumption>(
  {
    rawMaterialId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qtyPlanned: { type: Number, required: true, min: 0 },
    qtyActual: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    reasonOverride: String,
  },
  { _id: false }
);

const BatchSchema = new Schema<IBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    finishedProductId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    plannedQty: { type: Number, required: true, min: 0 },
    actualQtyProduced: { type: Number, default: 0, min: 0 },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'RELEASED'], default: 'DRAFT' },
    consumption: { type: [BatchConsumptionSchema], default: [] },
    wastageQty: { type: Number, default: 0, min: 0 },
    wastageReason: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
  },
  { timestamps: true }
);

// Unique index for batchId is already created via schema field definition.
BatchSchema.index({ finishedProductId: 1, expiryDate: 1 });
BatchSchema.index({ status: 1 });

export const Batch: Model<IBatch> = mongoose.model<IBatch>('Batch', BatchSchema);
