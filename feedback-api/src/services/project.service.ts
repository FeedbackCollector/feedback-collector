import * as ProjectRepository from "../repositories/project.repository.ts";
import { Project, NewProject, UpdateProject } from "../types/project.ts";

export async function getAllProjectsService(): Promise<Project[]> {
    return ProjectRepository.getAllProjects();
}

export async function getProjectByIdService(id: number): Promise<Project | "PROJECT_NOT_FOUND"> {
    const project = await ProjectRepository.getProjectByID(id);
    if (!project) return "PROJECT_NOT_FOUND";
    return project;
}

export async function createProjectService(data: NewProject): Promise<Project | "NAME_TAKEN"> {
    if (await ProjectRepository.projectFindByName(data.name)) return "NAME_TAKEN";

    return ProjectRepository.insertProject(data);
}

export async function updateProjectService(data: UpdateProject, id: number): Promise<Project | "PROJECT_NOT_FOUND" | "NAME_TAKEN"> {
    if (!(await ProjectRepository.getProjectByID(id))) return "PROJECT_NOT_FOUND";

    if (data.name !== undefined) {
        const sameName = await ProjectRepository.projectFindByName(data.name);
        if (sameName && sameName.id !== id) return "NAME_TAKEN";
    }

    const updated = await ProjectRepository.updateProject(id, data);
    return updated as Project;
}

export async function deleteProjectService(id: number): Promise<"PROJECT_NOT_FOUND" | "PROJECT_HAS_FEEDBACK" | "DELETED"> {
    if (!(await ProjectRepository.getProjectByID(id))) return "PROJECT_NOT_FOUND";
    if (await ProjectRepository.projectHasFeedback(id)) return "PROJECT_HAS_FEEDBACK";

    await ProjectRepository.deleteProject(id);
    return "DELETED";
}
