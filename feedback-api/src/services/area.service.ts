import * as AreaRepository from "../repositories/area.repository.ts";
import { Area, NewArea, UpdateArea } from "../types/area.ts";

export async function getAllAreasService(): Promise<Area[]> {
    return AreaRepository.getAllAreas();
}

export async function getAreaByIdService(id: number): Promise<Area | "AREA_NOT_FOUND"> {
    const area = await AreaRepository.getAreaByID(id);
    if (!area) return "AREA_NOT_FOUND";
    return area;
}

export async function createAreaService(data: NewArea): Promise<Area | "NAME_TAKEN"> {
    if (await AreaRepository.areaFindByName(data.name)) return "NAME_TAKEN";

    return AreaRepository.areaCreate(data);
}

export async function updateAreaService(data: UpdateArea, id: number): Promise<Area | "AREA_NOT_FOUND" | "NAME_TAKEN"> {
    if (!(await AreaRepository.getAreaByID(id))) return "AREA_NOT_FOUND";

    if (data.name !== undefined) {
        const sameName = await AreaRepository.areaFindByName(data.name);
        if (sameName && sameName.id !== id) return "NAME_TAKEN";
    }

    const updated = await AreaRepository.areaUpdate(data, id);
    return updated as Area;
}

export async function deleteAreaService(id: number): Promise<"AREA_NOT_FOUND" | "AREA_HAS_USERS" | "DELETED"> {
    if (!(await AreaRepository.getAreaByID(id))) return "AREA_NOT_FOUND";
    if (await AreaRepository.areaHasUsers(id)) return "AREA_HAS_USERS";

    await AreaRepository.areaDelete(id);
    return "DELETED";
}
