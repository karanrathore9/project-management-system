import Task, { ITask, TaskStatus, TaskPriority } from '../models/Task';
import Project, { IProject } from '../models/Project';
import ApiError from '../utils/ApiError';
import { isMember } from './project.service';

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');
  if (!isMember(project, userId)) {
    throw ApiError.forbidden('You do not have access to this project');
  }
  return project;
}

function assertValidAssignee(project: Pick<IProject, 'owner' | 'members'>, assigneeId?: string | null) {
  if (!assigneeId) return;
  if (!isMember(project, assigneeId)) {
    throw ApiError.badRequest('Assignee must be a member of this project');
  }
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignee?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export async function createTask(projectId: string, userId: string, data: CreateTaskInput) {
  const project = await assertProjectAccess(projectId, userId);
  assertValidAssignee(project, data.assignee);

  const lastTask = await Task.findOne({ project: projectId, status: data.status || 'todo' }).sort(
    { order: -1 }
  );
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    ...data,
    project: projectId,
    createdBy: userId,
    order,
  });

  return task.populate('assignee', 'name email');
}

export async function listTasksForProject(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);
  return Task.find({ project: projectId })
    .sort({ status: 1, order: 1 })
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email');
}

export async function getTaskById(taskId: string, userId: string) {
  const task = await Task.findById(taskId).populate('assignee', 'name email');
  if (!task) throw ApiError.notFound('Task not found');
  await assertProjectAccess(task.project.toString(), userId);
  return task;
}

export async function updateTask(
  taskId: string,
  userId: string,
  updates: Partial<Pick<ITask, 'title' | 'description' | 'assignee' | 'priority' | 'dueDate'>>
) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const project = await assertProjectAccess(task.project.toString(), userId);

  if (updates.assignee !== undefined) {
    assertValidAssignee(project, updates.assignee as unknown as string | null);
  }

  Object.assign(task, updates);
  await task.save();
  return task.populate('assignee', 'name email');
}

// Dedicated path for drag-and-drop status changes — the hot path that
// drives the real-time board updates.
export async function updateTaskStatus(
  taskId: string,
  userId: string,
  input: { status: TaskStatus; order?: number }
) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  await assertProjectAccess(task.project.toString(), userId);

  task.status = input.status;
  if (typeof input.order === 'number') task.order = input.order;
  await task.save();

  return task.populate('assignee', 'name email');
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  await assertProjectAccess(task.project.toString(), userId);

  await task.deleteOne();
  return task;
}