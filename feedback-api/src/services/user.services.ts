import bcrypt from 'bcryptjs';
import { signToken, signPasswordResetToken, verifyPasswordResetToken, passwordVersion } from '../utils/token.ts';
import * as UsersRepository from '../repositories/user.repositories.ts';
import * as PreApprovalRepository from '../repositories/preApproval.repository.ts';
import { getAreaByID } from '../repositories/area.repository.ts';
import { sendPendingApprovalEmail, sendAccountApprovedEmail, sendPasswordResetEmail } from './mail.service.ts';
import { AccountStatus, User, CreateUser, UpdateUser, UserFilters, UsersPage } from '../types/user.ts';

// Directors list every user; a manager only gets their own record.
// Without `page`/`limit` the full list is returned (legacy behaviour); with either one the result is paginated.
export async function getAllUsersService(filters: UserFilters, requester: { id: number; role: string }): Promise<User[] | UsersPage> {
    const paginated = filters.page !== undefined || filters.limit !== undefined;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;

    if (requester.role === 'director') {
        return paginated ? UsersRepository.getUsersPage(filters, page, limit) : UsersRepository.getAllUsers(filters);
    }

    const self = await UsersRepository.getPublicUserByID(requester.id);
    const visible = self && !(filters.role && self.role !== filters.role) ? [self] : [];
    if (!paginated) return visible;

    const total = visible.length;
    return {
        data: visible.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}

export async function getUserByIdService(id: number): Promise<User | "USER_NOT_FOUND"> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    return user;
}

type ProfileReferenceError = "AREA_NOT_FOUND" | "EMAIL_TAKEN";
type ReferenceError = ProfileReferenceError | "DIRECTOR_NOT_FOUND" | "USER_NOT_MANAGER";

async function checkReferences(
    data: Pick<UpdateUser, "area_id" | "email">,
    id?: number,
): Promise<ProfileReferenceError | null> {
    if (data.area_id !== undefined && !(await getAreaByID(data.area_id))) return "AREA_NOT_FOUND";

    if (data.email !== undefined) {
        const sameEmail = await UsersRepository.getUserByEmail(data.email);
        if (sameEmail && sameEmail.id !== id) return "EMAIL_TAKEN";
    }
    return null;
}

export async function createUserService(data: CreateUser): Promise<User | ProfileReferenceError> {
    const invalid = await checkReferences(data);
    if (invalid) return invalid;

    const passwordHash = await bcrypt.hash(data.password, 10);
    const created = await UsersRepository.insertUser(data.email, passwordHash, data.role ?? 'manager', data.area_id as number, data.name);
    const { passwordHash: _hash, ...user } = created;
    return user;
}

export async function registerService(email: string, password: string , name: string , area_id: number): Promise<"EMAIL_TAKEN" | "AREA_NOT_FOUND" | "REGISTERED" | "APPROVED"> {
    const invalid = await checkReferences({ email, area_id });
    if (invalid) return invalid;

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    if (await PreApprovalRepository.findPreApprovedEmail(normalizedEmail)) {
        await UsersRepository.insertUser(email, passwordHash, "manager", area_id, name, "approved");
        await PreApprovalRepository.deletePreApprovedEmail(normalizedEmail);

        sendAccountApprovedEmail(normalizedEmail, name).catch((err: unknown) =>
            console.error('Could not send account approved email:', err instanceof Error ? err.message : err),
        );
        return "APPROVED";
    }

    await UsersRepository.insertUser(email, passwordHash, "manager", area_id, name, "pending");

    sendPendingApprovalEmail(email, name).catch((err: unknown) =>
        console.error('Could not send pending approval email:', err instanceof Error ? err.message : err),
    );
    return "REGISTERED";
}

export async function updateUserService(data: UpdateUser, id: number): Promise<User | "USER_NOT_FOUND" | ReferenceError> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    if (data.director_id !== undefined && (user.role !== "manager" || user.status !== "approved")) {
        return "USER_NOT_MANAGER";
    }

    const invalid = await checkReferences(data, id);
    if (invalid) return invalid;
    if (data.director_id !== undefined && data.director_id !== null) {
        const director = await UsersRepository.getPublicUserByID(data.director_id);
        if (director?.role !== "director" || director.status !== "approved") return "DIRECTOR_NOT_FOUND";
    }

    const updated = await UsersRepository.updateUser(id, data);
    return updated as User;
}

export async function deleteUserService(id: number, requesterId: number): Promise<"USER_NOT_FOUND" | "CANNOT_DELETE_SELF" | "MANAGER_HAS_NO_DIRECTOR" | "USER_HAS_ICS" | "USER_HAS_MANAGERS" | "DELETED"> {
    const user = await UsersRepository.getPublicUserByID(id);
    if (!user) return "USER_NOT_FOUND";
    if (user.id === requesterId) return "CANNOT_DELETE_SELF";
    if (user.role === "manager" && user.director_id == null) return "MANAGER_HAS_NO_DIRECTOR";
    if (user.role === "director") {
        if (await UsersRepository.directorHasManagers(id)) return "USER_HAS_MANAGERS";
        if (await UsersRepository.directorHasICs(id)) return "USER_HAS_ICS";
    }

    return UsersRepository.deleteUser(id);
}

export async function loginService(email: string, password: string): Promise<string | "INVALID_CREDENTIALS" | "ACCOUNT_NOT_APPROVED"> {
    const user = await UsersRepository.getUserByEmail(email);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";
    if (user.status !== "approved") return "ACCOUNT_NOT_APPROVED";

    return signToken(user);
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
    if (!approvedUser) return "USER_NOT_FOUND";

    sendAccountApprovedEmail(approvedUser.email, approvedUser.name).catch((err: unknown) =>
        console.error('Could not send account approved email:', err instanceof Error ? err.message : err),
    );
    return approvedUser;
}

export async function changePasswordService(userId: number, currentPassword: string, newPassword: string): Promise<"INVALID_CREDENTIALS" | { token: string }> {
    const user = await UsersRepository.getUserByID(userId);
    if (!user) return "INVALID_CREDENTIALS";

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) return "INVALID_CREDENTIALS";

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await UsersRepository.patchUserPassword(user.id, passwordHash);
    if (!updated) return "INVALID_CREDENTIALS";

    // Tokens issued before the change stop working, so the caller gets a fresh one.
    return { token: signToken({ ...user, passwordHash }) };
}

//esto es de prueba cambiar cuando el sender funcione
export async function forgotPasswordService(email: string): Promise<"SENT"> {
    const user = await UsersRepository.getUserByEmail(email);

    if (!user || user.status !== "approved") return "SENT";

    const resetToken = signPasswordResetToken(user);

    const appUrl = process.env.APP_URL ?? "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    if (process.env.NODE_ENV !== "production") {
        console.log("\n========== PASSWORD RESET ==========");
        console.log(`Usuario: ${user.email}`);
        console.log(`Enlace: ${resetUrl}`);
        console.log("====================================\n");
    } else {
        await sendPasswordResetEmail(user.email, user.name, resetToken);
    }

    return "SENT";
}


export async function resetPasswordService(
    token: string,
    newPassword: string
): Promise<"INVALID_TOKEN" | "RESET_OK"> {

    let payload: { id?: unknown; pv?: unknown; purpose?: unknown };

    try {
        payload = verifyPasswordResetToken(token);
    } catch {
        console.log("[RESET] Token inválido o expirado");
        return "INVALID_TOKEN";
    }

    if (
        typeof payload.id !== 'number' ||
        typeof payload.pv !== 'string' ||
        payload.purpose !== 'password-reset'
    ) {
        console.log("[RESET] Datos del token incorrectos");
        return "INVALID_TOKEN";
    }

    const user = await UsersRepository.getUserByID(payload.id);

    if (!user) {
        console.log("[RESET] Usuario no encontrado");
        return "INVALID_TOKEN";
    }

    console.log("\n========== RESET PASSWORD DEBUG ==========");
    console.log("Usuario encontrado:", user.id);


    if (passwordVersion(user.passwordHash) !== payload.pv) {
        console.log("[RESET] La versión de contraseña no coincide");
        console.log("==========================================\n");
        return "INVALID_TOKEN";
    }

    const oldHash = user.passwordHash;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await UsersRepository.patchUserPassword(
        user.id,
        passwordHash
    );

    console.log("¿Se actualizó?:", updated);

    const userAfterUpdate = await UsersRepository.getUserByID(user.id);

    console.log(
        "¿Cambió el hash?:",
        userAfterUpdate?.passwordHash !== oldHash
    );

    console.log("==========================================\n");

    if (!updated) return "INVALID_TOKEN";

    return "RESET_OK";
}
