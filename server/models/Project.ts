import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  company?: string;
  description?: string;
  status: 'open' | 'closed';
  expectedRevenueGBP: string;
  startDate?: Date;
  endDate?: Date;
  isArchived?: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      required: true,
    },
    expectedRevenueGBP: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ isArchived: 1 });
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ company: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);