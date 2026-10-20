import { User as UserModel } from "../models/Index.ts";

export async function getUserByEmail(email: string) {
    const row = await UserModel.findOne({ where: { email } });
    return row ? row.toJSON() : null;
}

export async function insertUser(email: string, passwordHash: string, role: string , area_id: number, name:string) {
    const row = await UserModel.create({ name , email, passwordHash, role , area_id});
    return row.toJSON();
}

