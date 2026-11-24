import { fn, col, where } from "sequelize";
import {
    User as UserModel,
    ICs as ICModel,
    Feedback as FeedbackModel,
    ManagerFeedback as ManagerFeedbackModel,
    ProjectManager as ProjectManagerModel,
} from "../models/Index.ts";
import { sequelize } from "../db/connection.ts";
import { AccountStatus, User, UpdateUser, UserFilters, UsersPage } from "../types/user.ts";

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

export async function getUsersPage(filters: UserFilters, page: number, limit: number): Promise<UsersPage> {
    const result = await UserModel.findAndCountAll({
        where: filters.role ? { role: filters.role } : {},
        attributes: { exclude: ["passwordHash"] },
        order: [["id", "ASC"]],
        limit,
        offset: (page - 1) * limit,
    });

    return {
        data: result.rows.map(row => row.toJSON()),
        pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) },
    };
}

export async function insertUser(
    email: string,
    passwordHash: string,
    role: string,
    area_id: number,
    name: string,
    status: AccountStatus = "approved",
) {
    const row = await UserModel.create({ name, email: email.trim().toLowerCase(), passwordHash, role, area_id, status });
    return row.toJSON();
}

export async function approvePendingUser(id: number): Promise<boolean> {
    const [affected] = await UserModel.update(
        { status: "approved" },
        { where: { id, status: "pending" } },
    );
    return affected > 0;
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
    if (data.director_id !== undefined) user.director_id = data.director_id;

    await sequelize.transaction(async (transaction) => {
        await user.save({ transaction });
        if (data.area_id !== undefined) {
            await ICModel.update({ area_id: data.area_id }, { where: { manager_id: id }, transaction });
        }
    });

    const { passwordHash, ...updated } = user.toJSON();
    return updated;
}

export async function directorHasICs(id: number): Promise<boolean> {
    return (await ICModel.count({ where: { director_id: id } })) > 0;
}

export async function directorHasManagers(id: number): Promise<boolean> {
    return (await UserModel.count({ where: { role: "manager", director_id: id } })) > 0;
}

export async function userHasFeedback(id: number): Promise<boolean> {
    return (await FeedbackModel.count({ where: { author_id: id } })) > 0
        || (await ManagerFeedbackModel.count({ where: { author_id: id } })) > 0;
}

export async function deleteUser(
    id: number,
): Promise<"USER_NOT_FOUND" | "MANAGER_HAS_NO_DIRECTOR" | "DELETED"> {
    return sequelize.transaction(async (transaction) => {
        const user = await UserModel.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!user) return "USER_NOT_FOUND";

        if (user.role === "manager") {
            if (user.director_id === null) return "MANAGER_HAS_NO_DIRECTOR";
            await FeedbackModel.update(
                { author_id: user.director_id },
                { where: { author_id: id }, transaction },
            );
            await ManagerFeedbackModel.update(
                { author_id: user.director_id },
                { where: { author_id: id }, transaction },
            );
            await ICModel.update(
                {
                    manager_id: null,
                    director_id: user.director_id,
                },
                { where: { manager_id: id }, transaction },
            );
            await ProjectManagerModel.destroy({
                where: { manager_id: id },
                transaction,
            });
            await ManagerFeedbackModel.destroy({
                where: { manager_id: id },
                transaction,
            });
        }
        if (user.role === "director") {
            await FeedbackModel.destroy({
                where: { author_id: id },
                transaction,
            });
            await ManagerFeedbackModel.destroy({
                where: { author_id: id },
                transaction,
            });
        }

        return (await UserModel.destroy({ where: { id }, transaction })) > 0 ? "DELETED" : "USER_NOT_FOUND";
    });
}
