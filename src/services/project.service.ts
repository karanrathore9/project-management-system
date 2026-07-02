import Project, { IProject } from '../models/Project';
import ApiError from '../utils/ApiError';
import { redisClient } from '../config/redis';

const CACHE_TTL_SECONDS = 60;
const cacheKey = (projectId: string) => `project:${projectId}`;

async function invalidateCache(projectId: string) {
  try {
    await redisClient.del(cacheKey(projectId));
  } catch (err) {
    console.warn(`[Redis] cache invalidation failed: ${(err as Error).message}`);
  }
}


function extractId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  const asObj = value as { _id?: unknown };
  if (asObj._id) return asObj._id.toString();
  return (value as { toString(): string }).toString();
}

export function isMember(
  project: Pick<IProject, 'owner' | 'members'>,
  userId: string
): boolean {
  if (extractId(project.owner) === userId) return true;
  return project.members.some((m) => extractId(m.user) === userId);
}

export async function createProject(
  userId: string,
  data: { name: string; description?: string }
) {
  return Project.create({
    ...data,
    owner: userId,
    members: [{ user: userId, role: 'manager' }],
  });
}

export async function listProjectsForUser(userId: string) {
  return Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email');
}

export async function getProjectById(projectId: string, userId: string) {
  try {
    const cached = await redisClient.get(cacheKey(projectId));
    if (cached) {
      const parsed = JSON.parse(cached);
      if (!isMember(parsed, userId)) {
        throw ApiError.forbidden('You do not have access to this project');
      }
      return parsed;
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.warn(`[Redis] read failed, falling back to DB: ${(err as Error).message}`);
  }

  const project = await Project.findById(projectId)
    .populate('owner', 'name email')
    .populate('members.user', 'name email');

  if (!project) throw ApiError.notFound('Project not found');
  if (!isMember(project, userId)) {
    throw ApiError.forbidden('You do not have access to this project');
  }

  redisClient
    .set(cacheKey(projectId), JSON.stringify(project), 'EX', CACHE_TTL_SECONDS)
    .catch((err) => console.warn(`[Redis] cache write failed: ${(err as Error).message}`));

  return project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: Partial<Pick<IProject, 'name' | 'description' | 'status'>>
) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  if (project.owner.toString() !== userId) {
    throw ApiError.forbidden('Only the project owner can update this project');
  }

  Object.assign(project, updates);
  await project.save();
  await invalidateCache(projectId);
  return project;
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  if (project.owner.toString() !== userId) {
    throw ApiError.forbidden('Only the project owner can delete this project');
  }

  await project.deleteOne();
  await invalidateCache(projectId);
}

export async function addMember(
  projectId: string,
  userId: string,
  input: { userId: string; role: 'manager' | 'member' }
) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound('Project not found');

  if (project.owner.toString() !== userId) {
    throw ApiError.forbidden('Only the project owner can add members');
  }

  const alreadyMember = project.members.some((m) => m.user.toString() === input.userId);
  if (alreadyMember) throw ApiError.conflict('User is already a member of this project');

  project.members.push({ user: input.userId as unknown as IProject['owner'], role: input.role });
  await project.save();
  await invalidateCache(projectId);
  return project;
}
