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
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { id?: number; email: string; role: string };
        // Tokens issued before the id was added cannot be tied to a user: ask for a new login.
        if (!Number.isInteger(payload.id)) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }
        res.locals.user = { id: payload.id, email: payload.email, role: payload.role };
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
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
