import { Request, Response } from "express";
import * as ProjectRepository from "../repositories/project.repository.ts";
import { NewProject } from "../types/project.ts";

export async function getAll(req: Request, res: Response) {
    try {
        const projects = await ProjectRepository.getAllProjects();
        return res.json({ data: projects });
    } catch (error) {
        return res.status(500).json({ error: "Error retrieving projects" });
    }
}

export async function getById(req: Request, res: Response) {
    try {
        const project = await ProjectRepository.getProjectByID(Number(req.params.id));
        if (!project) return res.status(404).json({ error: "Project not found" });
        return res.json({ data: project });
    } catch (error) {
        return res.status(500).json({ error: "Error retrieving the project" });
    }
}

export async function create(req: Request, res: Response) {
    try {
        if (!req.body.name || typeof req.body.name !== "string" || req.body.name.trim() === "") {
            return res.status(400).json({ error: "Invalid project name" });
        }

        const projectData: NewProject = {
            name: req.body.name.trim()
        };

        const newProject = await ProjectRepository.insertProject(projectData);
        return res.status(201).json({ data: newProject });
    } catch (error) {
        return res.status(500).json({ error: "Error creating the project" });
    }
}

export async function update(req: Request, res: Response) {
    try {
        if (!req.body.name || typeof req.body.name !== "string" || req.body.name.trim() === "") {
            return res.status(400).json({ error: "Invalid project name" });
        }

        const projectData: NewProject = {
            name: req.body.name.trim()
        };

        const updated = await ProjectRepository.updateProject(Number(req.params.id), projectData);
        if (!updated) return res.status(404).json({ error: "Project not found" });
        return res.json({ data: updated });
    } catch (error) {
        return res.status(500).json({ error: "Error updating the project" });
    }
}

export async function remove(req: Request, res: Response) {
    try {
        const deleted = await ProjectRepository.deleteProject(Number(req.params.id));
        if (!deleted) return res.status(404).json({ error: "Project not found" });
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: "Error deleting the project. It might be linked to existing feedback." });
    }
}
