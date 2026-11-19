import { Router } from 'express';
import { getAll, getById, create, replace, update, remove } from '../controllers/managerFeedback.controller.ts';
import { validate } from '../middleware/validate.ts';
import { createManagerFeedbackScheme, updateManagerFeedbackScheme } from '../schemes/managerFeedback.schema.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

// Feedback about managers is visible and editable by directors only.
router.use(authenticateToken, authorizeRole("director"));

router.param('id', (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    next();
});

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', validate(createManagerFeedbackScheme), create);
router.put('/:id', validate(createManagerFeedbackScheme), replace);
router.patch('/:id', validate(updateManagerFeedbackScheme), update);
router.delete('/:id', remove);

export default router;
