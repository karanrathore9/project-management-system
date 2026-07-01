import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';
import env from '../config/env';

// Normalizes known Mongoose/JWT errors into ApiError so the response shape
// is always consistent, regardless of what threw.
function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest('Validation failed', details);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  const anyErr = err as { code?: number; keyValue?: Record<string, unknown>; name?: string };
  if (anyErr?.code === 11000) {
    const field = Object.keys(anyErr.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`);
  }

  if (anyErr?.name === 'JsonWebTokenError' || anyErr?.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired token');
  }

  const message = err instanceof Error ? err.message : 'Something went wrong';
  return ApiError.internal(message);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const apiErr = normalizeError(err);

  if (apiErr.statusCode >= 500) {
    console.error(`${req.method} ${req.originalUrl} -`, err);
  } else {
    console.warn(`${req.method} ${req.originalUrl} - ${apiErr.statusCode} ${apiErr.message}`);
  }

  res.status(apiErr.statusCode).json({
    success: false,
    message: apiErr.message,
    details: apiErr.details || undefined,
    stack: env.nodeEnv === 'development' && err instanceof Error ? err.stack : undefined,
  });
};

export default errorHandler;
