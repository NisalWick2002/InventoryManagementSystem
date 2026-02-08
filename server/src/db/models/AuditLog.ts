import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  resource: string;
  resourceId?: string;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  actorRole?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    actorRole: String,
    summary: String,
    metadata: Schema.Types.Mixed,
    details: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
