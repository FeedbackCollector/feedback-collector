import { Router } from 'express';
import { getAll, getById, create, update, remove, approve } from '../controllers/users.controller.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';
import { validate, validateQuery } from '../middleware/validate.ts';
import { createUserScheme, updateUserScheme, listUsersQueryScheme } from '../schemes/user.schema.ts';

const router = Router();

router.param('id', (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    next();
});

router.get('/', authenticateToken, validateQuery(listUsersQueryScheme), getAll);
router.get('/:id', authenticateToken, authorizeRole('director'), getById);
router.post('/', authenticateToken, authorizeRole('director'), validate(createUserScheme), create);
router.patch('/:id', authenticateToken, authorizeRole('director'), validate(updateUserScheme), update);
router.patch('/:id/approve', authenticateToken, authorizeRole('director'), approve);
router.delete('/:id', authenticateToken, authorizeRole('director'), remove);

export default router;
