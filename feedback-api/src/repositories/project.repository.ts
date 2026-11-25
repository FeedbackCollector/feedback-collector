import { fn, col, where } from "sequelize";
import { Project as ProjectModel, Feedback as FeedbackModel, ManagerFeedback as ManagerFeedbackModel, ProjectManager, User } from "../models/Index.ts";
import { sequelize } from "../db/connection.ts";
import { NewProject, UpdateProject } from "../types/project.ts";

async function attachManagerIds<T extends { id: number }>(project: T): Promise<T & { manager_ids: number[] }> {
    const assignments = await ProjectManager.findAll({
        where: { project_id: project.id },
        attributes: ["manager_id"],
        order: [["manager_id", "ASC"]],
    });
    return { ...project, manager_ids: assignments.map(({ manager_id }) => manager_id) };
}

export async function getProjectByID(id: number) {
    const row = await ProjectModel.findByPk(id);
    return row ? attachManagerIds(row.toJSON()) : null;
}

async function attachManagerIdsToProjects<T extends { id: number }>(projects: T[]): Promise<Array<T & { manager_ids: number[] }>> {
    const assignments = projects.length > 0
        ? await ProjectManager.findAll({
            where: { project_id: projects.map(({ id }) => id) },
            attributes: ["project_id", "manager_id"],
            order: [["manager_id", "ASC"]],
        })
        : [];
    const managerIdsByProject = new Map<number, number[]>();
    for (const { project_id, manager_id } of assignments) {
        const managerIds = managerIdsByProject.get(project_id) ?? [];
        managerIds.push(manager_id);
        managerIdsByProject.set(project_id, managerIds);
    }
    return projects.map(project => ({ ...project, manager_ids: managerIdsByProject.get(project.id) ?? [] }));
}

export async function getAllProjects() {
    const rows = await ProjectModel.findAll({ order: [["id", "ASC"]] });
    return attachManagerIdsToProjects(rows.map(row => row.toJSON()));
}

export async function getProjectsForManager(managerId: number) {
    const projectIds = await getProjectIdsForManager(managerId);
    if (projectIds.length === 0) return [];

    const rows = await ProjectModel.findAll({
        where: { id: projectIds },
        order: [["id", "ASC"]],
    });
    return attachManagerIdsToProjects(rows.map(row => row.toJSON()));
}

export async function getProjectIdsForManager(managerId: number): Promise<number[]> {
    const assignments = await ProjectManager.findAll({
        where: { manager_id: managerId },
        attributes: ["project_id"],
        order: [["project_id", "ASC"]],
    });
    return assignments.map(({ project_id }) => project_id);
}

export async function managerHasProject(managerId: number, projectId: number): Promise<boolean> {
    return (await ProjectManager.count({ where: { manager_id: managerId, project_id: projectId } })) > 0;
}

export async function projectFindByName(name: string) {
    const row = await ProjectModel.findOne({ where: where(fn("lower", col("name")), name.trim().toLowerCase()) });
    return row ? row.toJSON() : null;
}

export async function insertProject(data: NewProject) {
    const row = await sequelize.transaction(async transaction => {
        const project = await ProjectModel.create({ name: data.name }, { transaction });
        if (data.manager_ids !== undefined) {
            await ProjectManager.bulkCreate(
                data.manager_ids.map(manager_id => ({ project_id: project.id, manager_id })),
                { transaction }
            );
        }
        return project;
    });
    return getProjectByID(row.id);
}

export async function updateProject(id: number, data: UpdateProject) {
    const updatedId = await sequelize.transaction(async transaction => {
        const project = await ProjectModel.findByPk(id, { transaction });
        if (!project) return null;

        if (data.name !== undefined) project.name = data.name;
        await project.save({ transaction });
        if (data.manager_ids !== undefined) {
            await ProjectManager.destroy({ where: { project_id: id }, transaction });
            await ProjectManager.bulkCreate(
                data.manager_ids.map(manager_id => ({ project_id: id, manager_id })),
                { transaction }
            );
        }
        return project.id;
    });
    return updatedId === null ? null : getProjectByID(updatedId);
}

export async function allManagerIdsExist(managerIds: number[]): Promise<boolean> {
    if (managerIds.length === 0) return true;
    const count = await User.count({
        where: { id: managerIds, role: "manager", status: "approved" },
    });
    return count === managerIds.length;
}

export async function projectHasFeedback(id: number): Promise<boolean> {
    return (await FeedbackModel.count({ where: { project_id: id } })) > 0
        || (await ManagerFeedbackModel.count({ where: { project_id: id } })) > 0;
}

export async function deleteProject(id: number): Promise<boolean> {
    const deleted = await ProjectModel.destroy({ where: { id } });
    return deleted > 0;
}
