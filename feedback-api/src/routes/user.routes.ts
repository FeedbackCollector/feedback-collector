import { Router } from 'express';
import { register, login } from '../controllers/users.controller.ts';
import { validate } from '../middleware/validate.ts';
import { registerScheme, loginScheme } from '../schemes/user.schema.ts';
const router = Router();

router.post('/register', validate(registerScheme), register);
router.post('/login', validate(loginScheme), login);

export default router;


