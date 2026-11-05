import { fn, col, where } from "sequelize";
import { Area as AreaModel, User as UserModel } from "../models/Index.ts";
import { Area, NewArea, UpdateArea } from "../types/area.ts";

export async function getAllAreas(): Promise<Area[]> {
    const rows = await AreaModel.findAll({ order: [["id", "ASC"]] });
    return rows.map(row => row.toJSON());
}

export async function getAreaByID(id: number): Promise<Area | null> {
    const row = await AreaModel.findByPk(id);
    return row ? row.toJSON() : null;
}
export async function areaFindByName(name: string): Promise<Area | null> {
    const row = await AreaModel.findOne({ where: where(fn("lower", col("name")), name.trim().toLowerCase()) });
    return row ? row.toJSON() : null;
}

export async function areaCreate(data: NewArea): Promise<Area> {
    const row = await AreaModel.create({ name: data.name });
    return row.toJSON();
}

export async function areaUpdate(data: UpdateArea, id: number): Promise<Area | null> {
    const area = await AreaModel.findByPk(id);
    if (!area) return null;

    if (data.name !== undefined) area.name = data.name;
    await area.save();
    return area.toJSON();
}

export async function areaHasUsers(id: number): Promise<boolean> {
    return (await UserModel.count({ where: { area_id: id } })) > 0;
}

export async function areaDelete(id: number): Promise<boolean> {
    return (await AreaModel.destroy({ where: { id } })) > 0;
}
