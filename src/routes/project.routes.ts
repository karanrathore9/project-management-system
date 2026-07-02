import { Router } from 'express';
import * as projectController from '../controllers/project.controller'
import * as taskController from '../controllers/task.controller';
import * as projectValidation from '../validations/project.validation';
import * as taskValidation from '../validations/task.validation';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

router.post('/', validate(projectValidation.create), projectController.createProject);
router.get('/', projectController.listProjects);
router.get('/:projectId', projectController.getProject);
router.patch('/:projectId', validate(projectValidation.update), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/members', validate(projectValidation.addMember), projectController.addMember);
router.get('/:projectId/members', projectController.listMembers);

router.get('/:projectId/tasks', taskController.listTasks);
router.post('/:projectId/tasks', validate(taskValidation.create), taskController.createTask);

export default router;
