import { Router } from 'express';
import { getAll } from '../controllers/users.controller.ts';

const router = Router();

router.get('/', getAll);

export default router;
