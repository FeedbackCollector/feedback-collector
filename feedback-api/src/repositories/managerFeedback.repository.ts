import type { WhereOptions } from 'sequelize';
import { ManagerFeedback as ManagerFeedbackModel } from '../models/Index.ts';
import type { ManagerFeedback, ManagerFeedbackFilters, NewManagerFeedback, UpdateManagerFeedback } from '../types/managerFeedback.ts';

export async function getManagerFeedbackPage(page: number, limit: number, filters: ManagerFeedbackFilters = {}) {
    const where: WhereOptions = {};
    for (const key of ['manager_id', 'project_id', 'score'] as const) {
        if (filters[key] !== undefined) where[key] = filters[key];
    }
    const direction = filters.sort === 'oldest' ? 'ASC' : 'DESC';
    const order: [string, string][] = filters.sort
        ? [['date', direction], ['id', direction]]
        : [['id', 'ASC']];

    const result = await ManagerFeedbackModel.findAndCountAll({ where, limit, offset: (page - 1) * limit, order });

    return {
        data: result.rows.map(row => row.toJSON()),
        pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit) },
    };
}

export async function getManagerFeedbackByID(id: number): Promise<ManagerFeedback | null> {
    const row = await ManagerFeedbackModel.findByPk(id);
    return row ? row.toJSON() : null;
}

export async function insertManagerFeedback(data: NewManagerFeedback): Promise<ManagerFeedback> {
    const row = await ManagerFeedbackModel.create({
        author_id: data.author_id,
        manager_id: data.manager_id,
        project_id: data.project_id,
        date: data.date,
        source_name: data.source_name,
        source_title: data.source_title ?? null,
        score: data.score,
        comment: data.comment,
        screenshot_url: data.screenshot_url,
    });
    return row.toJSON();
}

export async function putManagerFeedback(data: NewManagerFeedback, id: number): Promise<ManagerFeedback | null> {
    await ManagerFeedbackModel.update(
        {
            author_id: data.author_id,
            manager_id: data.manager_id,
            project_id: data.project_id,
            date: data.date,
            source_name: data.source_name,
            source_title: data.source_title ?? null,
            score: data.score,
            comment: data.comment,
            screenshot_url: data.screenshot_url,
        },
        { where: { id } },
    );
    return getManagerFeedbackByID(id);
}

export async function patchManagerFeedback(data: UpdateManagerFeedback, id: number): Promise<ManagerFeedback | null> {
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) updates[key] = value;
    }
    await ManagerFeedbackModel.update(updates, { where: { id } });
    return getManagerFeedbackByID(id);
}

export async function deleteManagerFeedback(id: number): Promise<boolean> {
    return (await ManagerFeedbackModel.destroy({ where: { id } })) > 0;
}
