import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import * as authValidation from '../validations/auth.validation';
import validate from '../middleware/validate.middleware';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh', validate(authValidation.refresh), authController.refresh);
router.get('/me', protect, authController.me);

export default router;
