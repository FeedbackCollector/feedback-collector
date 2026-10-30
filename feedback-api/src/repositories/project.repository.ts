import { Project as ProjectModel } from "../models/Index.ts";
import { NewProject } from "../types/project.ts";

export async function getProjectByID(id: number) {
    const row = await ProjectModel.findByPk(id);
    return row ? row.toJSON() : null;
}

export async function getAllProjects() {
    const rows = await ProjectModel.findAll({ order: [["id", "ASC"]] });
    return rows.map(row => row.toJSON());
}

export async function insertProject(data: NewProject) {
    const row = await ProjectModel.create({ name: data.name });
    return row.toJSON();
}

export async function updateProject(id: number, data: NewProject) {
    const project = await ProjectModel.findByPk(id);
    if (!project) return null;
    
    project.name = data.name;
    await project.save();
    return project.toJSON();
}

export async function deleteProject(id: number): Promise<boolean> {
    const deleted = await ProjectModel.destroy({ where: { id } });
    return deleted > 0;
}