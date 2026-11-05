import { Request, Response } from 'express';
import { getAllFeedbacksService, createFeedbackService, deleteFeedbackService, getFeedbackByIdService, replaceFeedbackService, updateFeedbackService } from '../services/feedback.service.ts';

const isPositiveInt = (v: unknown) => Number.isInteger(v) && Number(v) >= 1;

export async function getAll(req: Request, res: Response) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);

        if (!isPositiveInt(page) || !isPositiveInt(limit) || limit > 100) {
            res.status(400).json({ message: "Invalid search parameters" });
            return;
        }

        const result = await getAllFeedbacksService(page, limit);
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
    const result = await createFeedbackService(req.body);
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(201).json({ data: result });
}

export async function replace(req: Request, res: Response) {
    const result = await replaceFeedbackService(req.body, Number(req.params.id));
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateFeedbackService(req.body, Number(req.params.id));
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    res.status(200).json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteFeedbackService(Number(req.params.id));
    if (result === "FEEDBACK_NOT_FOUND") return res.status(404).json({ error: "Feedback not found" });
    res.status(204).send();
}
