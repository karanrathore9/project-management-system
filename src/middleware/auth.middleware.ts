import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';
import User, { UserRole } from '../models/User';

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

// Verifies the Bearer access token and attaches req.user
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No auth token provided');
  }

  const token = header.split(' ')[1];

  let decoded: AccessTokenPayload;
  try {
    decoded = jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw ApiError.unauthorized('User for this token no longer exists');
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name,
  };
  next();
});

// Restricts to specific roles, e.g. restrictTo('admin', 'manager')
export const restrictTo =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
