import { Request, Response, NextFunction } from 'express';
import { getUserByID } from '../repositories/user.repositories.ts';
import { passwordVersion, verifyToken } from '../utils/token.ts';

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ message: "Token required" });
        return;
    }

    let payload: { id?: unknown; pv?: unknown };
    try {
        payload = verifyToken(token);
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    if (typeof payload.id !== 'number' || !Number.isInteger(payload.id)) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }


    const user = await getUserByID(payload.id);
    if (!user || user.status !== 'approved' || payload.pv !== passwordVersion(user.passwordHash)) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }

    res.locals.user = { id: user.id, email: user.email, role: user.role };
    next();
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
