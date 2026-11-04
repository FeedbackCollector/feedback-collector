import { fn, col, where } from "sequelize";
import { Project as ProjectModel, Feedback as FeedbackModel } from "../models/Index.ts";
import { NewProject, UpdateProject } from "../types/project.ts";

export async function getProjectByID(id: number) {
    const row = await ProjectModel.findByPk(id);
    return row ? row.toJSON() : null;
}

export async function getAllProjects() {
    const rows = await ProjectModel.findAll({ order: [["id", "ASC"]] });
    return rows.map(row => row.toJSON());
}

export async function projectFindByName(name: string) {
    const row = await ProjectModel.findOne({ where: where(fn("lower", col("name")), name.trim().toLowerCase()) });
    return row ? row.toJSON() : null;
}

export async function insertProject(data: NewProject) {
    const row = await ProjectModel.create({ name: data.name });
    return row.toJSON();
}

export async function updateProject(id: number, data: UpdateProject) {
    const project = await ProjectModel.findByPk(id);
    if (!project) return null;

    if (data.name !== undefined) project.name = data.name;
    await project.save();
    return project.toJSON();
}

export async function projectHasFeedback(id: number): Promise<boolean> {
    return (await FeedbackModel.count({ where: { project_id: id } })) > 0;
}

export async function deleteProject(id: number): Promise<boolean> {
    const deleted = await ProjectModel.destroy({ where: { id } });
    return deleted > 0;
}
