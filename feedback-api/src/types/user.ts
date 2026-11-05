export interface NewUser {
    email: string;
    password: string;
    role?: string;
    area_id?: number
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    area_id: number | null
}

export type UserRole = "manager" | "director";

export interface CreateUser {
    name: string;
    email: string;
    password: string;
    area_id?: number;
    role?: UserRole;
}

export interface UpdateUser {
    name?: string;
    email?: string;
    area_id?: number;
}

export interface UserFilters {
    role?: UserRole;
}
