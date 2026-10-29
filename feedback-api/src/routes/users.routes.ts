import { Router } from 'express';
import { getAll } from '../controllers/users.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.get('/', authenticateToken, authorizeRole('director'), getAll);

export default router;
