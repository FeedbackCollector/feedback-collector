import * as ProjectRepository from "../repositories/project.repository.ts";
import { Project, NewProject, UpdateProject } from "../types/project.ts";

type Caller = { id: number; role: string };

export async function getAllProjectsService(user: Caller): Promise<Project[] | "FORBIDDEN"> {
    if (user.role === "director") return ProjectRepository.getAllProjects();
    if (user.role === "manager") return ProjectRepository.getProjectsForManager(user.id);
    return "FORBIDDEN";
}

export async function getProjectByIdService(id: number, user: Caller): Promise<Project | "PROJECT_NOT_FOUND" | "FORBIDDEN"> {
    if (user.role === "manager" && !(await ProjectRepository.managerHasProject(user.id, id))) return "PROJECT_NOT_FOUND";
    if (user.role !== "manager" && user.role !== "director") return "FORBIDDEN";

    const project = await ProjectRepository.getProjectByID(id);
    if (!project) return "PROJECT_NOT_FOUND";
    return project;
}

export async function createProjectService(data: NewProject): Promise<Project | "NAME_TAKEN" | "MANAGER_NOT_FOUND"> {
    if (await ProjectRepository.projectFindByName(data.name)) return "NAME_TAKEN";
    if (data.manager_ids && !(await ProjectRepository.allManagerIdsExist(data.manager_ids))) return "MANAGER_NOT_FOUND";

    return (await ProjectRepository.insertProject(data)) as Project;
}

export async function updateProjectService(data: UpdateProject, id: number): Promise<Project | "PROJECT_NOT_FOUND" | "NAME_TAKEN" | "MANAGER_NOT_FOUND"> {
    if (!(await ProjectRepository.getProjectByID(id))) return "PROJECT_NOT_FOUND";
    if (data.manager_ids && !(await ProjectRepository.allManagerIdsExist(data.manager_ids))) return "MANAGER_NOT_FOUND";

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
