import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as taskValidation from '../validations/task.validation';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

router.get('/:taskId', taskController.getTask);
router.patch('/:taskId', validate(taskValidation.update), taskController.updateTask);
router.patch('/:taskId/status', validate(taskValidation.updateStatus), taskController.updateTaskStatus);
router.delete('/:taskId', taskController.deleteTask);

export default router;
