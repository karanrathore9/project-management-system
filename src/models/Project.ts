import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ProjectMemberRole = 'manager' | 'member';

export interface IProjectMember {
  user: Types.ObjectId;
  role: ProjectMemberRole;
}

export interface IProject extends Document {
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: IProjectMember[];
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['manager', 'member'], default: 'member' },
      },
    ],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ 'members.user': 1 });

const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema);
export default Project;
