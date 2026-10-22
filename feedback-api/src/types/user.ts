export interface NewUser {
    email: string;
    password: string;
    role?: string;
    area_id?: number
}

export interface User {
    id: number;
    email: string;
    role: string;
    area_id: number | null
}