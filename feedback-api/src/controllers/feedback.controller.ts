import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { getAllFeedbacksService, createFeedbackService, deleteFeedbackService, getFeedbackByIdService, replaceFeedbackService, updateFeedbackService } from '../services/feedback.service.ts';

export async function getAll(req: AuthRequest, res: Response) {
    const result = await getAllFeedbacksService(req.user!);
    return res.json({ data: result });
}

export async function getById(req: AuthRequest, res: Response) {
    const result = await getFeedbackByIdService(Number(req.params.id), req.user!);
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
