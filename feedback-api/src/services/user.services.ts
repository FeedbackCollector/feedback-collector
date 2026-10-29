import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UsersRepository from '../repositories/user.repositories.ts';

export async function getAllUsersService() {
    return UsersRepository.getAllUsers();
}

export async function registerService(email: string, password: string , name: string , area_id: number): Promise<"EMAIL_TAKEN" | "REGISTERED"> {
    const existing = await UsersRepository.getUserByEmail(email);
    if (existing) return "EMAIL_TAKEN";

    const passwordHash = await bcrypt.hash(password, 10);
    await UsersRepository.insertUser(email, passwordHash, 'manager' , area_id , name);
    return "REGISTERED";
}

export async function loginService(email: string, password: string) {
    const user = await UsersRepository.getUserByEmail(email);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET as string, {expiresIn: '1h',
    });
}

export async function changePasswordService(email: string, currentPassword: string, newPassword: string): Promise<"INVALID_CREDENTIALS" | "UPDATED"> {
    const user = await UsersRepository.getUserByEmail(email);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await UsersRepository.patchUserPassword(user.id, passwordHash);
    return updated ? "UPDATED" : "INVALID_CREDENTIALS";
}
