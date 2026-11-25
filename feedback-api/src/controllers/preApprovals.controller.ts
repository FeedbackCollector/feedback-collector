import { Request, Response } from 'express';
import { addPreApprovedService, listPreApprovedService, removePreApprovedService } from '../services/preApproval.service.ts';

export async function list(req: Request, res: Response) {
    const data = await listPreApprovedService();
    res.json({ data });
}

export async function add(req: Request, res: Response) {
    const result = await addPreApprovedService(req.body.email);
    if (result === "EMAIL_TAKEN") return res.status(409).json({ error: "Email already registered" });
    if (result === "ALREADY_PRE_APPROVED") return res.status(409).json({ error: "Email already pre-approved" });
    res.status(201).json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await removePreApprovedService(String(req.params.email));
    if (result === "NOT_FOUND") return res.status(404).json({ error: "Pre-approval not found" });
    res.status(204).send();
}
