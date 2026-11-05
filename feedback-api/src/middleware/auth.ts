import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ message: "Token required" });
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string; role: string; id: number };
        res.locals.user = { email: payload.email, role: payload.role, id: payload.id };
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export const authenticate = authenticateToken;

export function authorizeRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!res.locals.user || !roles.includes(res.locals.user.role)) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }
        next();
    };
}
