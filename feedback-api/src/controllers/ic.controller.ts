import { Request, Response } from "express";
import { getAllICsService, getICByIdService, createICService, updateICService, deleteICService } from "../services/ic.service.ts";

export async function getAll(req: Request, res: Response) {
    const result = await getAllICsService(res.locals.query, res.locals.user);
    if (result === "FORBIDDEN") return res.status(401).json({ error: "UNAUTHORIZED" });
    return res.json(result);
}

export async function getById(req: Request, res: Response) {
    const result = await getICByIdService(Number(req.params.id), res.locals.user);
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "FORBIDDEN") return res.status(401).json({ error: "UNAUTHORIZED" });
    return res.json({ data: result });
}

export async function create(req: Request, res: Response) {
    const result = await createICService(req.body);
    if (result === "MANAGER_NOT_FOUND") return res.status(404).json({ error: "Manager not found" });
    return res.status(201).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateICService(req.body, Number(req.params.id));
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    if (result === "MANAGER_NOT_FOUND") return res.status(404).json({ error: "Manager not found" });
    return res.json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteICService(Number(req.params.id));
    if (result === "IC_NOT_FOUND") return res.status(404).json({ error: "IC not found" });
    return res.status(204).send();
}
