import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as HttpServer } from 'http';
import env from '../config/env';
import socketAuth, { AuthedSocket } from './socketAuth';
import { registerTaskHandlers, projectRoom } from './taskSocket';
import { getPubSubClients } from '../config/redis';

let ioInstance: Server | null = null;

// Called once from server.ts with the raw HTTP server.
// The Redis adapter is what lets task updates broadcast correctly even if
// the backend is scaled to multiple Node instances behind Nginx — without
// it, a user connected to instance B would never see an update made by a
// user connected to instance A.
export async function initSocket(httpServer: HttpServer): Promise<Server> {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  try {
    const { pubClient, subClient } = getPubSubClients();
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Socket.IO] Redis adapter attached');
  } catch (err) {
    console.warn(`[Socket.IO] Redis adapter failed, falling back to in-memory: ${(err as Error).message}`);
  }

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const authed = socket as AuthedSocket;
    console.log(`[Socket.IO] connected: ${authed.id} (user ${authed.user.id})`);
    registerTaskHandlers(io, authed);
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized yet — call initSocket() first');
  }
  return ioInstance;
}

// Central place every controller uses to broadcast task/project changes.
export function emitToProject(projectId: string, event: string, payload: unknown): void {
  try {
    getIO().to(projectRoom(projectId)).emit(event, payload);
  } catch (err) {
    console.warn(`emitToProject skipped (socket not ready): ${(err as Error).message}`);
  }
}
