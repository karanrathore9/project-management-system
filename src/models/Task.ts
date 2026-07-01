import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];

export interface ITask extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  status: TaskStatus;
  assignee: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  priority: TaskPriority;
  order: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    status: { type: String, enum: TASK_STATUSES, default: 'todo', index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    order: { type: Number, default: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, order: 1 });

const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
export default Task;
