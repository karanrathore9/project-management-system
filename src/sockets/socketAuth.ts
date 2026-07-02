import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import env from '../config/env';
import User, { UserRole } from '../models/User';

export interface SocketUser {
  id: string;
  name: string;
  role: UserRole;
}

// Augment Socket with the authenticated user attached by this middleware.
export interface AuthedSocket extends Socket {
  user: SocketUser;
}

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export default async function socketAuth(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('AUTH_ERROR: No token provided'));
    }

    const decoded = jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
    const user = await User.findById(decoded.sub);

    if (!user) {
      return next(new Error('AUTH_ERROR: User no longer exists'));
    }

    (socket as AuthedSocket).user = { id: user._id.toString(), name: user.name, role: user.role };
    return next();
  } catch {
    return next(new Error('AUTH_ERROR: Invalid or expired token'));
  }
}
