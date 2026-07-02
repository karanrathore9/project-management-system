import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import * as userService from '../services/user.service';

export const search = asyncHandler(async (req: Request, res: Response) => {
  const users = await userService.searchUsers(req.validatedQuery!.q as string, req.user!.id);
  res.status(200).json({ success: true, data: users });
});