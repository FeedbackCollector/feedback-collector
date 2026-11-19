import * as ManagerFeedbackRepository from '../repositories/managerFeedback.repository.ts';
import { getUserByID } from '../repositories/user.repositories.ts';
import { getProjectByID } from '../repositories/project.repository.ts';
import type { ManagerFeedback, ManagerFeedbackFilters, NewManagerFeedback, UpdateManagerFeedback } from '../types/managerFeedback.ts';

type Caller = { id: number; email: string; role: string };

type ReferenceError = "MANAGER_NOT_FOUND" | "PROJECT_NOT_FOUND";

// Only directors reach these services (the routes enforce it); this check is a second line of defence.
const isDirector = (user: Caller) => user.role === "director";

async function checkReferences(data: UpdateManagerFeedback): Promise<ReferenceError | null> {
    if (data.manager_id !== undefined) {
        const manager = await getUserByID(data.manager_id);
        if (!manager || manager.role !== "manager") return "MANAGER_NOT_FOUND";
    }
    if (data.project_id !== undefined && !(await getProjectByID(data.project_id))) return "PROJECT_NOT_FOUND";
    return null;
}

export async function getManagerFeedbackPageService(page: number, limit: number, filters: ManagerFeedbackFilters, user: Caller) {
    if (!isDirector(user)) return "FORBIDDEN" as const;
    return ManagerFeedbackRepository.getManagerFeedbackPage(page, limit, filters);
}

export async function getManagerFeedbackByIdService(id: number, user: Caller): Promise<ManagerFeedback | "FEEDBACK_NOT_FOUND" | "FORBIDDEN"> {
    if (!isDirector(user)) return "FORBIDDEN";
    const feedback = await ManagerFeedbackRepository.getManagerFeedbackByID(id);
    return feedback ?? "FEEDBACK_NOT_FOUND";
}

export async function createManagerFeedbackService(data: Omit<NewManagerFeedback, 'author_id'>, user: Caller): Promise<ManagerFeedback | ReferenceError | "FORBIDDEN"> {
    if (!isDirector(user)) return "FORBIDDEN";

    const invalid = await checkReferences(data);
    if (invalid) return invalid;

    return ManagerFeedbackRepository.insertManagerFeedback({ ...data, author_id: user.id });
}

export async function replaceManagerFeedbackService(data: Omit<NewManagerFeedback, 'author_id'>, id: number, user: Caller): Promise<ManagerFeedback | ReferenceError | "FEEDBACK_NOT_FOUND" | "FORBIDDEN"> {
    if (!isDirector(user)) return "FORBIDDEN";
    if (!(await ManagerFeedbackRepository.getManagerFeedbackByID(id))) return "FEEDBACK_NOT_FOUND";

    const invalid = await checkReferences(data);
    if (invalid) return invalid;

    return (await ManagerFeedbackRepository.putManagerFeedback({ ...data, author_id: user.id }, id)) ?? "FEEDBACK_NOT_FOUND";
}

export async function updateManagerFeedbackService(data: Omit<UpdateManagerFeedback, 'author_id'>, id: number, user: Caller): Promise<ManagerFeedback | ReferenceError | "FEEDBACK_NOT_FOUND" | "FORBIDDEN"> {
    if (!isDirector(user)) return "FORBIDDEN";
    if (!(await ManagerFeedbackRepository.getManagerFeedbackByID(id))) return "FEEDBACK_NOT_FOUND";

    const invalid = await checkReferences(data);
    if (invalid) return invalid;

    return (await ManagerFeedbackRepository.patchManagerFeedback(data, id)) ?? "FEEDBACK_NOT_FOUND";
}

export async function deleteManagerFeedbackService(id: number, user: Caller): Promise<"FEEDBACK_NOT_FOUND" | "FORBIDDEN" | "DELETED"> {
    if (!isDirector(user)) return "FORBIDDEN";
    return (await ManagerFeedbackRepository.deleteManagerFeedback(id)) ? "DELETED" : "FEEDBACK_NOT_FOUND";
}
