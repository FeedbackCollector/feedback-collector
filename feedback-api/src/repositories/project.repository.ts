import { Project as ProjectModel } from "../models/Index.ts";

export async function getProjectByID(id: number) {
    const row = await ProjectModel.findByPk(id);
    return row ? row.toJSON() : null;
}
