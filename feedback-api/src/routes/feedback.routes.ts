import { Router } from 'express';
import { getAll, getById, create, replace, update, remove } from '../controllers/feedback.controller.ts';
import { authenticateToken } from '../middleware/auth.ts';
import { validate } from '../middleware/validate.ts';
import { createFeedbackScheme, updateFeedbackScheme } from '../schemes/feedback.schema.ts';

const router = Router();

router.param('id', (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    next();
});



router.get('/', authenticateToken, getAll);

router.get('/:id', authenticateToken, getById);

router.post('/', validate(createFeedbackScheme), create);

router.put('/:id', validate(createFeedbackScheme), replace);

router.patch('/:id', validate(updateFeedbackScheme), update);

router.delete('/:id', remove);

export default router;
