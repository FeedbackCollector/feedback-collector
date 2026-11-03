import * as ICRepository from "../repositories/ic.repository.ts";
import { IC, NewIC, UpdateIC, ICFilters } from "../types/ic.ts";



// manager_id must match a user with the manager role.
async function checkReferences(data: UpdateIC): Promise<"MANAGER_NOT_FOUND" | null> {
    if (data.manager_id !== undefined && !(await ICRepository.managerExists(data.manager_id))) return "MANAGER_NOT_FOUND";
    return null;
}

export async function getAllICsService(filters: ICFilters) {
    return ICRepository.icFindAll(filters);
}

export async function getICByIdService(id: number): Promise<IC | "IC_NOT_FOUND"> {
    const ic = await ICRepository.icFindByID(id);
    if (!ic) return "IC_NOT_FOUND";
    return ic;
}

export async function createICService(icData: NewIC): Promise<IC | "MANAGER_NOT_FOUND"> {
    const invalid = await checkReferences(icData);
    if (invalid) return invalid;

    return ICRepository.icCreate(icData);
}

export async function updateICService(icData: UpdateIC, id: number): Promise<IC  | "IC_NOT_FOUND" | "MANAGER_NOT_FOUND"> {
    const ic = await ICRepository.icFindByID(id);
    if (!ic) return "IC_NOT_FOUND";

    const invalid = await checkReferences(icData);
    if (invalid) return invalid;

    const updated = await ICRepository.icUpdate(icData, id);
    return updated as IC;
}

export async function deleteICService(id: number): Promise<"IC_NOT_FOUND" | "DELETED"> {
    const ic = await ICRepository.icFindByID(id);
    if (!ic) return "IC_NOT_FOUND";

    await ICRepository.icDelete(id);
    return "DELETED";
}
