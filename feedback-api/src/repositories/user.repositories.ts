import { fn, col, where } from "sequelize";
import { User as UserModel, ICs as ICModel, Feedback as FeedbackModel } from "../models/Index.ts";
import { User, UpdateUser, UserFilters } from "../types/user.ts";

export async function getUserByEmail(email: string) {
    const row = await UserModel.findOne({ where: where(fn("lower", col("email")), email.trim().toLowerCase()) });
    return row ? row.toJSON() : null;
}

export async function getUserByID(id: number) {
    const row = await UserModel.findByPk(id);
    return row ? row.toJSON() : null;
}

export async function getAllUsers(filters: UserFilters = {}): Promise<User[]> {
    const rows = await UserModel.findAll({
        where: filters.role ? { role: filters.role } : {},
        attributes: { exclude: ["passwordHash"] },
        order: [["id", "ASC"]],
    });
    return rows.map(row => row.toJSON());
}

export async function insertUser(email: string, passwordHash: string, role: string , area_id: number, name:string) {
    const row = await UserModel.create({ name , email: email.trim().toLowerCase(), passwordHash, role , area_id});
    return row.toJSON();
}


export async function patchUserPassword(id: number, passwordHash: string) {
    const [affected] = await UserModel.update({ passwordHash }, { where: { id } });
    return affected > 0;
}


export async function getPublicUserByID(id: number): Promise<User | null> {
    const row = await UserModel.findByPk(id, { attributes: { exclude: ["passwordHash"] } });
    return row ? row.toJSON() : null;
}

export async function updateUser(id: number, data: UpdateUser): Promise<User | null> {
    const user = await UserModel.findByPk(id);
    if (!user) return null;

    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email.trim().toLowerCase();
    if (data.area_id !== undefined) user.area_id = data.area_id;
    await user.save();

    const { passwordHash, ...updated } = user.toJSON();
    return updated;
}

export async function userHasICs(id: number): Promise<boolean> {
    return (await ICModel.count({ where: { manager_id: id } })) > 0;
}
export async function userHasFeedback(id: number): Promise<boolean> {
    return (await FeedbackModel.count({ where: { author_id: id } })) > 0;
}

export async function deleteUser(id: number): Promise<boolean> {
    return (await UserModel.destroy({ where: { id } })) > 0;
}
