import { Area as AreaModel } from "../models/Index.ts";
import { Area } from "../types/area.ts";

export async function getAllAreas(): Promise<Area[]> {
    const rows = await AreaModel.findAll({ order: [["id", "ASC"]] });
    return rows.map(row => row.toJSON());
}

export async function getAreaByID(id: number): Promise<Area | null> {
    const row = await AreaModel.findByPk(id);
    return row ? row.toJSON() : null;
}
