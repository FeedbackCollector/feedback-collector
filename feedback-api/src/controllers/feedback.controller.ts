import { Request, Response } from 'express';
import type { FeedbackFilters } from '../types/feedback.ts';
import { getAllFeedbacksService, createFeedbackService, deleteFeedbackService, getFeedbackByIdService, replaceFeedbackService, updateFeedbackService } from '../services/feedback.service.ts';

const positiveInt = (value: unknown): number | undefined => {
    if (typeof value !== 'string' || !/^[0-9]+$/.test(value)) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export async function getAll(req: Request, res: Response) {
    try {
        const page = req.query.page === undefined ? 1 : positiveInt(req.query.page);
        const limit = req.query.limit === undefined ? 10 : positiveInt(req.query.limit);

        if (page === undefined || limit === undefined || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
            res.status(400).json({ message: "Invalid search parameters" });
            return;
        }

        const filters: FeedbackFilters = {};
        for (const key of ['project_id', 'ic_id', 'score'] as const) {
            if (req.query[key] === undefined) continue;
            const value = positiveInt(req.query[key]);
            if (value === undefined || (key === 'score' && value > 5)) {
                return res.status(400).json({ message: 'Invalid search parameters' });
            }
            filters[key] = value;
        }
        for (const key of ['ic_name', 'text'] as const) {
            const value = req.query[key];
            if (value === undefined) continue;
            if (typeof value !== 'string') {
                return res.status(400).json({ message: 'Invalid search parameters' });
            }
            if (value !== '') filters[key] = value;
        }
        const sort = req.query.sort;
        if (sort !== undefined && sort !== 'newest' && sort !== 'oldest') {
            return res.status(400).json({ message: 'Invalid search parameters' });
        }
        filters.sort = sort;

        const result = await getAllFeedbacksService(page, limit, filters, res.locals.user);
        if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
        res.status(200).json(result);
    } catch {
        res.status(500).json({ message: "Error retrieving feedback" });
    }
}

export async function getById(req: Request, res: Response) {
    const result = await getFeedbackByIdService(Number(req.params.id), res.locals.user);
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    return res.json({ data: result });
}


export async function create(req: Request, res: Response) {
    const result = await createFeedbackService(req.body, res.locals.user);
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(201).json({ data: result });
}

export async function replace(req: Request, res: Response) {
    const result = await replaceFeedbackService(req.body, Number(req.params.id), res.locals.user);
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateFeedbackService(req.body, Number(req.params.id), res.locals.user);
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteFeedbackService(Number(req.params.id), res.locals.user);
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    res.status(204).send();
}
