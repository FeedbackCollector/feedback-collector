import { Router } from 'express';
import { add, list, remove } from '../controllers/preApprovals.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { preApprovalScheme } from '../schemes/preApproval.schema.ts';

const router = Router();

router.get('/', authenticateToken, authorizeRole('director'), list);
router.post('/', authenticateToken, authorizeRole('director'), validate(preApprovalScheme), add);
router.delete('/:email', authenticateToken, authorizeRole('director'), remove);

export default router;
