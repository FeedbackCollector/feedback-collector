import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';

const MIN_SECRET_LENGTH = 32;
const ALGORITHM = 'HS256';

export function assertJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < MIN_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET must be set and have at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -hex 32`);
    }
    return secret;
}

export function passwordVersion(passwordHash: string): string {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export function signToken(user: { id: number; email: string; role: string; passwordHash: string }): string {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, pv: passwordVersion(user.passwordHash) },
        assertJwtSecret(),
        { algorithm: ALGORITHM, expiresIn: '1h' },
    );
}

export function verifyToken(token: string): { id?: unknown; pv?: unknown } {
    return jwt.verify(token, assertJwtSecret(), { algorithms: [ALGORITHM] }) as { id?: unknown; pv?: unknown };
}
