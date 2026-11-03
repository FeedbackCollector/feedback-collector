import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: { email: string; role: string };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET as string, (err, payload) => {
        if (err) return res.sendStatus(403);
        req.user = payload as { email: string; role: string };
        next();
    });
}

export function authorizeRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) return res.sendStatus(403);
        next();
    };
}