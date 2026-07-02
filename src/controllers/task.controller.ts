import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as taskService from '../services/task.service';
import { emitToProject } from '../sockets';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const task = await taskService.createTask(projectId, req.user!.id, req.body);

  emitToProject(projectId, 'task:created', { task });

  res.status(201).json({ success: true, data: task });
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;

  const tasks = await taskService.listTasksForProject(projectId, req.user!.id);
  res.status(200).json({ success: true, data: tasks });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const task = await taskService.getTaskById(taskId, req.user!.id);
  res.status(200).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const task = await taskService.updateTask(taskId, req.user!.id, req.body);

  emitToProject(task.project.toString(), 'task:updated', { task });

  res.status(200).json({ success: true, data: task });
});

// The hot path — fires when a user drags a card between columns.
export const updateTaskStatus = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const task = await taskService.updateTaskStatus(taskId, req.user!.id, req.body);

  emitToProject(task.project.toString(), 'task:statusChanged', {
    taskId: task._id,
    status: task.status,
    order: task.order,
    updatedBy: req.user!.id,
    task,
  });

  res.status(200).json({ success: true, data: task });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;

  const task = await taskService.deleteTask(taskId, req.user!.id);

  emitToProject(task.project.toString(), 'task:deleted', { taskId: task._id });

  res.status(200).json({ success: true, message: 'Task deleted' });
});