import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';


const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', time: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

export default router;
