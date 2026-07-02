import 'express';

export interface AuthUser {
  id: string;
  role: 'admin' | 'manager' | 'member';
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      validatedQuery?: Record<string, unknown>;
    }
  }
}