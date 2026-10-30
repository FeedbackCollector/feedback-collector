import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { id: number; email: string; role: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthRequest['user'];
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export function authorizeRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
