import { Feedback as FeedbackModel, ICs } from "../models/Index.ts";
import { Feedback,NewFeedback, UpdateFeedback } from "../types/feedback.ts";

export async function getFeedbackByID(id: number): Promise<Feedback | null> {
    const row = await FeedbackModel.findByPk(id);
    return row ? row.toJSON() : null;
}


export async function getAllFeedbacks(filter?: { managerId: number }): Promise<Feedback[]> {
    let where = {};
    if (filter) {
        const ics = await ICs.findAll({ where: { manager_id: filter.managerId }, attributes: ["IC_id"] });
        where = { ic_id: ics.map(ic => ic.IC_id) }; 
    }
    const rows = await FeedbackModel.findAll({ where });
    return rows.map(row => row.toJSON());
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

