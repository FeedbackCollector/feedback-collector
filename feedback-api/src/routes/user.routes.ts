import { Router } from 'express';
import { register, login, changePassword, forgotPassword, resetPassword } from '../controllers/users.controller.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { registerScheme, loginScheme, changePasswordScheme, forgotPasswordScheme, resetPasswordScheme } from '../schemes/user.schema.ts';

const router = Router();

router.post('/register', validate(registerScheme), register);
router.post('/login', validate(loginScheme), login);
router.post('/forgot-password', validate(forgotPasswordScheme), forgotPassword);
router.post('/reset-password', validate(resetPasswordScheme), resetPassword);
router.patch('/password', authenticateToken, validate(changePasswordScheme), changePassword);

export default router;