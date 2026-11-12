import { Router } from 'express';
import { getAll, getById, create, replace, update, remove } from '../controllers/feedback.controller.ts';
import { validate } from '../middleware/validate.ts';
import { createFeedbackScheme, updateFeedbackScheme } from '../schemes/feedback.schema.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

router.param('id', (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    next();
});



router.get('/',  authorizeRole("director","manager"),getAll);

router.get('/:id',  authorizeRole("director","manager"),getById);

router.post('/', authorizeRole("director","manager"),validate(createFeedbackScheme), create);

router.put('/:id', authorizeRole("director","manager"), validate(createFeedbackScheme), replace);

router.patch('/:id', authorizeRole("director","manager"), validate(updateFeedbackScheme), update);

router.delete('/:id', authorizeRole("director","manager"), remove);

export default router;
