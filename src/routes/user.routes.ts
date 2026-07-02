import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import * as userValidation from '../validations/user.validation';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate.middleware';

const router = Router();

router.use(protect);

router.get('/search', validate(userValidation.search, 'query'), userController.search);

export default router;