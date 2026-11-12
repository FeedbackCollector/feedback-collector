import { Feedback as FeedbackModel, ICs } from "../models/Index.ts";
import { Feedback, FeedbackFilters, NewFeedback, UpdateFeedback } from "../types/feedback.ts";
import { Op, Sequelize, type WhereOptions, type Order } from 'sequelize';

const unaccentIlike = (column: string, value: string) =>
    Sequelize.where(
        Sequelize.fn('unaccent', Sequelize.col(column)),
        { [Op.iLike]: Sequelize.fn('unaccent', value) }
    );

export async function getFeedbackByID(id: number): Promise<Feedback | null> {
    const row = await FeedbackModel.findByPk(id);
    return row ? row.toJSON() : null;
}


export async function getAllFeedbacks(page: number, limit: number, filters: FeedbackFilters = {}) {
    const where: WhereOptions = {};
    for (const key of ['project_id', 'ic_id', 'score'] as const) {
        if (filters[key] !== undefined) where[key] = filters[key];
    }
    const contains = (value: string) => `%${value.replace(/[\\%_]/g, '\\$&')}%`;
    if (filters.text) where[Op.and] = [...((where[Op.and] as unknown[]) ?? []), unaccentIlike('Feedback.comment', contains(filters.text))];
    const order: Order = filters.sort
        ? [['date', filters.sort === 'newest' ? 'DESC' : 'ASC'], ['id', filters.sort === 'newest' ? 'DESC' : 'ASC']]
        : [['id', 'ASC']];
    if (filters.ic_name) {
        const matchedICs = await ICs.findAll({
            attributes: ['IC_id'],
            where: unaccentIlike('name', contains(filters.ic_name)),
        });
        where.ic_id = { [Op.in]: matchedICs.map((ic) => ic.IC_id) };
    }
    const result = await FeedbackModel.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order,
    });

    return {
        data: result.rows.map(row => row.toJSON()),
        pagination: {
            page,
            limit,
            total: result.count,
            totalPages: Math.ceil(result.count / limit),
        },
    };
}

export async function insertFeedback(feedbackData: NewFeedback): Promise<Feedback[]> {
    const row = await FeedbackModel.create({
        author_id: feedbackData.author_id,
        ic_id: feedbackData.ic_id,
        project_id: feedbackData.project_id,
        date: feedbackData.date,
        source_name: feedbackData.source_name,
        score: feedbackData.score,
        comment: feedbackData.comment,
        screenshot_url: feedbackData.screenshot_url
    });

    return [row.toJSON()];
}

export async function putFeedback(feedbackData: NewFeedback, feedbackId: number): Promise<Feedback[]> {
    await FeedbackModel.update(
        {
            author_id: feedbackData.author_id,
            ic_id: feedbackData.ic_id,
            project_id: feedbackData.project_id,
            date: feedbackData.date,
            source_name: feedbackData.source_name,
            score: feedbackData.score,
            comment: feedbackData.comment,
            screenshot_url: feedbackData.screenshot_url
        },
        { where: { id: feedbackId } }
    );

    const row = await FeedbackModel.findByPk(feedbackId);
    return row ? [row.toJSON()] : [];
}

export async function patchFeedback(feedbackData: UpdateFeedback, feedbackId: number): Promise<Feedback[]> {
    const updates: Record<string, unknown> = {};
    if (feedbackData.author_id !== undefined) updates.author_id = feedbackData.author_id;
    if (feedbackData.ic_id !== undefined) updates.ic_id = feedbackData.ic_id;
    if (feedbackData.project_id !== undefined) updates.project_id = feedbackData.project_id;
    if (feedbackData.date !== undefined) updates.date = feedbackData.date;
    if (feedbackData.source_name !== undefined) updates.source_name = feedbackData.source_name;
    if (feedbackData.score !== undefined) updates.score = feedbackData.score;
    if (feedbackData.comment !== undefined) updates.comment = feedbackData.comment;
    if (feedbackData.screenshot_url !== undefined) updates.screenshot_url = feedbackData.screenshot_url;

    await FeedbackModel.update(updates, { 
        where: { 
            id: feedbackId 
        } 
    });

    const row = await FeedbackModel.findByPk(feedbackId);
    return row ? [row.toJSON()] : [];
}

export async function deleteFeedback(feedbackId: number): Promise<boolean> {
    const deleted = await FeedbackModel.destroy({ 
        where: { id: feedbackId } 
    });
    return deleted > 0;
}

