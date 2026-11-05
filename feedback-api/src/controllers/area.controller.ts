import { Request, Response } from "express";
import { getAllAreasService, getAreaByIdService, createAreaService, updateAreaService, deleteAreaService } from "../services/area.service.ts";

export async function getAll(req: Request, res: Response) {
    const result = await getAllAreasService();
    return res.json({ data: result });
}

export async function getById(req: Request, res: Response) {
    const result = await getAreaByIdService(Number(req.params.id));
    if (result === "AREA_NOT_FOUND") return res.status(404).json({ error: "Area not found" });
    return res.json({ data: result });
}

export async function create(req: Request, res: Response) {
    const result = await createAreaService(req.body);
    if (result === "NAME_TAKEN") return res.status(409).json({ error: "Area name already exists" });
    return res.status(201).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateAreaService(req.body, Number(req.params.id));
    if (result === "AREA_NOT_FOUND") return res.status(404).json({ error: "Area not found" });
    if (result === "NAME_TAKEN") return res.status(409).json({ error: "Area name already exists" });
    return res.json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteAreaService(Number(req.params.id));
    if (result === "AREA_NOT_FOUND") return res.status(404).json({ error: "Area not found" });
    if (result === "AREA_HAS_USERS") return res.status(409).json({ error: "Area has users assigned" });
    return res.status(204).send();
}
