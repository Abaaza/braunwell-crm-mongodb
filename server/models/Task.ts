import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
  projectId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isRecurring?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  recurringEndDate?: Date;
  parentTaskId?: mongoose.Types.ObjectId;
  dependencies?: mongoose.Types.ObjectId[];
  blockedBy?: mongoose.Types.ObjectId[];
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    },
    recurringEndDate: {
      type: Date,
    },
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    dependencies: [{
      type: Schema.Types.ObjectId,
      ref: 'Task',
    }],
    blockedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'Task',
    }],
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ createdBy: 1 });

export default mongoose.model<ITask>('Task', TaskSchema);