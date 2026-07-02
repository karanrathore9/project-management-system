import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as projectService from '../services/project.service';
import { emitToProject } from '../sockets';

const getProjectId = (projectId: string | string[]) =>
  Array.isArray(projectId) ? projectId[0] : projectId;

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.user!.id, req.body);
  res.status(201).json({ success: true, data: project });
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.listProjectsForUser(req.user!.id);
  res.status(200).json({ success: true, data: projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getProjectId(req.params.projectId);
  const project = await projectService.getProjectById(projectId, req.user!.id);
  res.status(200).json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getProjectId(req.params.projectId);
  const project = await projectService.updateProject(projectId, req.user!.id, req.body);

  emitToProject(projectId, 'project:updated', { project });

  res.status(200).json({ success: true, data: project });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getProjectId(req.params.projectId);
  await projectService.deleteProject(projectId, req.user!.id);

  emitToProject(projectId, 'project:deleted', { projectId });

  res.status(200).json({ success: true, message: 'Project deleted' });
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getProjectId(req.params.projectId);
  const project = await projectService.addMember(projectId, req.user!.id, req.body);

  emitToProject(projectId, 'project:memberAdded', {
    projectId,
    members: project.members,
  });

  res.status(200).json({ success: true, data: project });
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const projectId = getProjectId(req.params.projectId);
  const members = await projectService.getProjectMembers(projectId, req.user!.id);
  res.status(200).json({ success: true, data: members });
});
