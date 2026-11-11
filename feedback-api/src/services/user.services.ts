import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as UsersRepository from '../repositories/user.repositories.ts';
import { getAreaByID } from '../repositories/area.repository.ts';
import { AccountStatus, User, CreateUser, UpdateUser, UserFilters } from '../types/user.ts';

export async function getAllUsersService(filters: UserFilters = {}) {
    return UsersRepository.getAllUsers(filters);
}

export async function getUserByIdService(id: number): Promise<User | "USER_NOT_FOUND"> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    return user;
}

type ReferenceError = "AREA_NOT_FOUND" | "EMAIL_TAKEN";

async function checkReferences(data: UpdateUser, id?: number): Promise<ReferenceError | null> {
    if (data.area_id !== undefined && !(await getAreaByID(data.area_id))) return "AREA_NOT_FOUND";

    if (data.email !== undefined) {
        const sameEmail = await UsersRepository.getUserByEmail(data.email);
        if (sameEmail && sameEmail.id !== id) return "EMAIL_TAKEN";
    }
    return null;
}

export async function createUserService(data: CreateUser): Promise<User | ReferenceError> {
    const invalid = await checkReferences(data);
    if (invalid) return invalid;

    const passwordHash = await bcrypt.hash(data.password, 10);
    const created = await UsersRepository.insertUser(data.email, passwordHash, data.role ?? 'manager', data.area_id as number, data.name);
    const { passwordHash: _hash, ...user } = created;
    return user;
}

export async function registerService(email: string, password: string , name: string , area_id: number): Promise<"EMAIL_TAKEN" | "AREA_NOT_FOUND" | "REGISTERED"> {
    const invalid = await checkReferences({ email, area_id });
    if (invalid) return invalid;

    const passwordHash = await bcrypt.hash(password, 10);
    await UsersRepository.insertUser(email, passwordHash, "manager", area_id, name, "pending");
    return "REGISTERED";
}

export async function updateUserService(data: UpdateUser, id: number): Promise<User | "USER_NOT_FOUND" | ReferenceError> {
    if (!(await UsersRepository.getPublicUserByID(id))) return "USER_NOT_FOUND";

    const invalid = await checkReferences(data, id);
    if (invalid) return invalid;

    const updated = await UsersRepository.updateUser(id, data);
    return updated as User;
}

export async function deleteUserService(id: number, requesterId: number): Promise<"USER_NOT_FOUND" | "CANNOT_DELETE_SELF" | "USER_HAS_ICS" | "USER_HAS_FEEDBACK" | "DELETED"> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    if (user.id === requesterId) return "CANNOT_DELETE_SELF";
    if (await UsersRepository.userHasICs(id)) return "USER_HAS_ICS";
    if (await UsersRepository.userHasFeedback(id)) return "USER_HAS_FEEDBACK";

    await UsersRepository.deleteUser(id);
    return "DELETED";
}

export async function loginService(email: string, password: string): Promise<string | "INVALID_CREDENTIALS"> {
    const user = await UsersRepository.getUserByEmail(email);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk || user.status !== "approved") return "INVALID_CREDENTIALS";

    return jwt.sign({ email: user.email, role: user.role, id: user.id }, process.env.JWT_SECRET as string, {expiresIn: '1h',
    });
}

export async function approveUserService(id: number): Promise<User | "USER_NOT_FOUND" | "ACCOUNT_NOT_PENDING"> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    if (user.status !== "pending") return "ACCOUNT_NOT_PENDING";

    const approved = await UsersRepository.approvePendingUser(id);
    if (!approved) {
        const currentUser = await UsersRepository.getPublicUserByID(id);
        if (!currentUser) return "USER_NOT_FOUND";
        return "ACCOUNT_NOT_PENDING";
    }

    const approvedUser = await UsersRepository.getPublicUserByID(id);
    return approvedUser ?? "USER_NOT_FOUND";
}

export async function changePasswordService(userId: number, currentPassword: string, newPassword: string): Promise<"INVALID_CREDENTIALS" | "UPDATED"> {
    const user = await UsersRepository.getUserByID(userId);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await UsersRepository.patchUserPassword(user.id, passwordHash);
    return updated ? "UPDATED" : "INVALID_CREDENTIALS";
}
