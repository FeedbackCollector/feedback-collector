import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { getAll, getById, create, replace, update, remove } from '../controllers/feedback.controller.ts';
import { validate } from '../middleware/validate.ts';
import { createFeedbackScheme, updateFeedbackScheme } from '../schemes/feedback.schema.ts';
import { authenticateToken, authorizeRole } from '../middleware/auth.ts';

const router = Router();

export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const IMAGE_EXTENSIONS: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
};

const upload = multer({
    storage: multer.diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => cb(null, randomUUID() + IMAGE_EXTENSIONS[file.mimetype]),
    }),
    limits: { fileSize: 100 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => cb(null, file.mimetype in IMAGE_EXTENSIONS),
});

function uploadScreenshot(req: Request, res: Response, next: NextFunction) {
    upload.single('file')(req, res, (err: unknown) => {
        if (err instanceof multer.MulterError) {
            const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 100 MB)' : err.message });
            return;
        }
        if (err) return next(err);
        next();
    });
}

router.use(authenticateToken);

router.param('id', (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'Invalid id' });
        return;
    }
    next();
});


router.post('/screenshot', authorizeRole("director","manager"), uploadScreenshot, (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'A PNG, JPEG or WebP image is required (field "file")' });
        return;
    }
    const base = process.env.PUBLIC_API_URL ?? `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ url: `${base.replace(/\/$/, '')}/uploads/${req.file.filename}` });
});

router.get('/',  authorizeRole("director","manager"),getAll);

router.get('/:id',  authorizeRole("director","manager"),getById);

router.post('/', authorizeRole("director","manager"),validate(createFeedbackScheme), create);

router.put('/:id', authorizeRole("director","manager"), validate(createFeedbackScheme), replace);

router.patch('/:id', authorizeRole("director","manager"), validate(updateFeedbackScheme), update);

router.delete('/:id', authorizeRole("director","manager"), remove);

export default router;