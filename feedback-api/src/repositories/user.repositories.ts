import { User as UserModel } from "../models/Index.ts";
import { User } from "../types/user.ts";

export async function getUserByEmail(email: string) {
    const row = await UserModel.findOne({ where: { email } });
    return row ? row.toJSON() : null;
}

export async function getUserByID(id: number) {
    const row = await UserModel.findByPk(id);
    return row ? row.toJSON() : null;
}

export async function getAllUsers(): Promise<User[]> {
    const rows = await UserModel.findAll({ attributes: { exclude: ["passwordHash"] } });
    return rows.map(row => row.toJSON());
}

export async function insertUser(email: string, passwordHash: string, role: string , area_id: number, name:string) {
    const row = await UserModel.create({ name , email, passwordHash, role , area_id});
    return row.toJSON();
}

