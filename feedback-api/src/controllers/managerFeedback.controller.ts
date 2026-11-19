import { Request, Response } from 'express';
import type { ManagerFeedbackFilters } from '../types/managerFeedback.ts';
import {
    getManagerFeedbackPageService,
    getManagerFeedbackByIdService,
    createManagerFeedbackService,
    replaceManagerFeedbackService,
    updateManagerFeedbackService,
    deleteManagerFeedbackService,
} from '../services/managerFeedback.service.ts';

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

        const filters: ManagerFeedbackFilters = {};
        for (const key of ['manager_id', 'project_id', 'score'] as const) {
            if (req.query[key] === undefined) continue;
            const value = positiveInt(req.query[key]);
            if (value === undefined || (key === 'score' && value > 5)) {
                return res.status(400).json({ message: "Invalid search parameters" });
            }
            filters[key] = value;
        }
        const sort = req.query.sort;
        if (sort !== undefined && sort !== 'newest' && sort !== 'oldest') {
            return res.status(400).json({ message: "Invalid search parameters" });
        }
        filters.sort = sort;

        const result = await getManagerFeedbackPageService(page, limit, filters, res.locals.user);
        if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
        res.status(200).json(result);
    } catch {
        res.status(500).json({ message: "Error retrieving manager feedback" });
    }
}

export async function getById(req: Request, res: Response) {
    const result = await getManagerFeedbackByIdService(Number(req.params.id), res.locals.user);
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    return res.json({ data: result });
}

export async function create(req: Request, res: Response) {
    const result = await createManagerFeedbackService(req.body, res.locals.user);
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (result === "MANAGER_NOT_FOUND") return res.status(404).json({ error: "Manager not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(201).json({ data: result });
}

export async function replace(req: Request, res: Response) {
    const result = await replaceManagerFeedbackService(req.body, Number(req.params.id), res.locals.user);
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "MANAGER_NOT_FOUND") return res.status(404).json({ error: "Manager not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateManagerFeedbackService(req.body, Number(req.params.id), res.locals.user);
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "MANAGER_NOT_FOUND") return res.status(404).json({ error: "Manager not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteManagerFeedbackService(Number(req.params.id), res.locals.user);
    if (result === "FORBIDDEN") return res.status(403).json({ message: "Forbidden" });
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    res.status(204).send();
}
