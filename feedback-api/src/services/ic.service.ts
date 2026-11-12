import { User } from "../models/User.ts";
import * as ICRepository from "../repositories/ic.repository.ts";
import { IC, NewIC, UpdateIC, ICFilters } from "../types/ic.ts";



// manager_id must match a user with the manager role.
async function checkReferences(data: UpdateIC): Promise<"MANAGER_NOT_FOUND" | null> {
    if (data.manager_id !== undefined && !(await ICRepository.managerExists(data.manager_id))) return "MANAGER_NOT_FOUND";
    return null;
}

export async function getAllICsService(filters: ICFilters, user: User) {
    if (user.role === 'manager'){
        console.log ({...filters, manager_id: user.id});
        return (ICRepository.icFindAll({ ...filters, manager_id: user.id }));
    }
        if (user.role === "director") {
        return ICRepository.icFindAll(filters); // puede filtrar opcionalmente por manager_id
    }
    return "FORBIDDEN";
}

export async function getICByIdService(id: number, user: User): Promise<IC | "IC_NOT_FOUND" | "FORBIDDEN"> {
    const ic = await ICRepository.icFindByID(id);
    
    if (!ic) return "IC_NOT_FOUND";
    if (user.role === 'director'){
        return ic;
    } else if (ic?.manager_id === user.id){
        return ic;
    }
    return "FORBIDDEN";
}

export async function createICService(icData: NewIC): Promise<IC | "MANAGER_NOT_FOUND"> {
    const invalid = await checkReferences(icData);
    if (invalid) return invalid;

    const area_id = await ICRepository.managerAreaId(icData.manager_id);
    return ICRepository.icCreate({ ...icData, area_id });
}

export async function updateICService(icData: UpdateIC, id: number): Promise<IC  | "IC_NOT_FOUND" | "MANAGER_NOT_FOUND"> {
    const ic = await ICRepository.icFindByID(id);
    if (!ic) return "IC_NOT_FOUND";

    const invalid = await checkReferences(icData);
    if (invalid) return invalid;

    // Moving an IC to another manager moves it to that manager's area.
    const data: UpdateIC & { area_id?: number | null } = { ...icData };
    if (icData.manager_id !== undefined) data.area_id = await ICRepository.managerAreaId(icData.manager_id);

    const updated = await ICRepository.icUpdate(data, id);
    return updated as IC;
}

export async function deleteICService(id: number): Promise<"IC_NOT_FOUND" | "DELETED"> {
    const ic = await ICRepository.icFindByID(id);
    if (!ic) return "IC_NOT_FOUND";

    await ICRepository.icDelete(id);
    return "DELETED";
}
