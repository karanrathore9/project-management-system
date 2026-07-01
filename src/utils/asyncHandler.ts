import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps an async route handler so rejected promises are forwarded to
// next(err) automatically -> caught by the centralized error middleware.
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
