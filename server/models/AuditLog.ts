import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId: string;
  userId: mongoose.Types.ObjectId;
  changes?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  description?: string;
  metadata?: string;
  riskScore?: number;
  successful?: boolean;
  errorMessage?: string;
  affectedRecords?: number;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changes: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    sessionId: {
      type: String,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    category: {
      type: String,
    },
    description: {
      type: String,
    },
    metadata: {
      type: String,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    successful: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
    affectedRecords: {
      type: Number,
    },
    dataClassification: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted'],
      default: 'internal',
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);