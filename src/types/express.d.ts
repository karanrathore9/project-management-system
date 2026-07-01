import 'express';

// Minimal identity shape attached by the auth middleware after verifying a JWT.
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
    }
  }
}
