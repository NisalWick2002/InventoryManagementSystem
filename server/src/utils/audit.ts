import { AuditLog } from '../db/models/index.js';
import type { Types } from 'mongoose';

export async function logAudit(params: {
  action: string;
  resource: string;
  resourceId?: string;
  userId: Types.ObjectId;
  userEmail: string;
  actorRole?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  await AuditLog.create(params);
}
