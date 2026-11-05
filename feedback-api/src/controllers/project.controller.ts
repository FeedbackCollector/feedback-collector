import { Request, Response } from "express";
import { getAllProjectsService, getProjectByIdService, createProjectService, updateProjectService, deleteProjectService } from "../services/project.service.ts";

export async function getAll(req: Request, res: Response) {
    const result = await getAllProjectsService();
    return res.json({ data: result });
}

export async function getById(req: Request, res: Response) {
    const result = await getProjectByIdService(Number(req.params.id));
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    return res.json({ data: result });
}

export async function create(req: Request, res: Response) {
    const result = await createProjectService(req.body);
    if (result === "NAME_TAKEN") return res.status(409).json({ error: "Project name already exists" });
    return res.status(201).json({ data: result });
}

export async function update(req: Request, res: Response) {
    const result = await updateProjectService(req.body, Number(req.params.id));
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    if (result === "NAME_TAKEN") return res.status(409).json({ error: "Project name already exists" });
    return res.json({ data: result });
}

export async function remove(req: Request, res: Response) {
    const result = await deleteProjectService(Number(req.params.id));
    if (result === "PROJECT_NOT_FOUND") return res.status(404).json({ error: "Project not found" });
    if (result === "PROJECT_HAS_FEEDBACK") return res.status(409).json({ error: "Project has feedback linked to it" });
    return res.status(204).send();
}
