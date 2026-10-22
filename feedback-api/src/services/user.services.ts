import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UsersRepository from '../repositories/user.repositories.ts';

export async function registerService(email: string, password: string , name: string , area_id: number): Promise<"EMAIL_TAKEN" | "REGISTERED"> {
    const existing = await UsersRepository.getUserByEmail(email);
    if (existing) return "EMAIL_TAKEN";

    const passwordHash = await bcrypt.hash(password, 10);
    await UsersRepository.insertUser(email, passwordHash, 'manager' , area_id , name);
    return "REGISTERED";
}

export async function loginService(email: string, password: string): Promise<string | "INVALID_CREDENTIALS"> {
    const user = await UsersRepository.getUserByEmail(email);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";

    return jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET as string, {expiresIn: '1h',
    });
}