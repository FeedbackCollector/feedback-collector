import { Router } from 'express';
import { register, login, changePassword } from '../controllers/users.controller.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { registerScheme, loginScheme, changePasswordScheme } from '../schemes/user.schema.ts';
const router = Router();

router.post('/register', validate(registerScheme), register);
router.post('/login', validate(loginScheme), login);
router.patch('/password', authenticateToken, validate(changePasswordScheme), changePassword);

export default router;


