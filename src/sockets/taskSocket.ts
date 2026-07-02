import { Server } from 'socket.io';
import Project from '../models/Project';
import { AuthedSocket } from './socketAuth';
import { isMember } from '../services/project.service';

export const projectRoom = (projectId: string) => `project:${projectId}`;

interface JoinAck {
  ok: boolean;
  error?: string;
}

export function registerTaskHandlers(_io: Server, socket: AuthedSocket): void {
  
  socket.on('project:join', async (projectId: string, callback?: (ack: JoinAck) => void) => {
    try {
      const project = await Project.findById(projectId);
      if (!project || !isMember(project, socket.user.id)) {
        return callback?.({ ok: false, error: 'Not authorized for this project' });
      }

      socket.join(projectRoom(projectId));

      socket.to(projectRoom(projectId)).emit('presence:userJoined', {
        userId: socket.user.id,
        name: socket.user.name,
      });

      callback?.({ ok: true });
    } catch (err) {
      console.error(`project:join failed: ${(err as Error).message}`);
      callback?.({ ok: false, error: 'Failed to join project room' });
    }
  });

  socket.on('project:leave', (projectId: string, callback?: (ack: JoinAck) => void) => {
    socket.leave(projectRoom(projectId));
    socket.to(projectRoom(projectId)).emit('presence:userLeft', {
      userId: socket.user.id,
      name: socket.user.name,
    });
    callback?.({ ok: true });
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} (${socket.user?.id}) disconnected`);
  });
}
