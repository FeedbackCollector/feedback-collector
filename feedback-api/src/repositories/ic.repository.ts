import {Op, QueryTypes} from "sequelize"
import {sequelize} from "../db/connection.ts"
import {ICs} from "../models/ic.ts"
import type {IC, CreateICRecord, UpdateIC, ICFilters} from "../types/ic.ts"


export async function icFindAll(filters: ICFilters){

    const {name, title, manager_id, area_id, score, page, limit} = filters

    const where: {
      name?: object | string;
      title?: object | string;
      area_id?: number;
      manager_id?: number;
      score?: number;
    } = {};

    if(name){
        where.name = {[Op.iLike]: `%${name}%`}
    }
    if(title){
        where.title = {[Op.iLike]: `%${title}%`}
    }
    if(manager_id !== undefined){
        where.manager_id = manager_id
    }
    if (area_id !== undefined){
        where.area_id = area_id
    } 
    if (score !== undefined){
        where.score = score
    } 
    
    const result = await ICs.findAndCountAll({
        where, limit,
        offset: (page - 1) * limit,
        order: [["IC_id", "ASC"]]
    });

    return{
        data: result.rows.map(ic => ic.toJSON()),
        pagination: {
            page, limit, total: result.count, totalPages: Math.ceil(result.count / limit )
        }
    }
}

export async function icFindByID(id: number): Promise<IC | null> {
    const ic = await ICs.findByPk(id);
    return ic ? ic.toJSON() : null;
}

export async function icCreate(data: CreateICRecord): Promise<IC> {

    const ic = await ICs.create({
        name: data.name,
        title: data.title,
        manager_id: data.manager_id,
        area_id: data.area_id,
        entries: data.entries,
    });
    return ic.toJSON();
}

export async function icUpdate(data: UpdateIC & { area_id?: number | null }, id: number): Promise<IC | null> {
    await ICs.update(data, { where: { IC_id: id } });
    return icFindByID(id);
}

export async function icDelete(id: number): Promise<boolean> {
    const deleted = await ICs.destroy({ where: { IC_id: id } });
    return deleted > 0;
}

export async function recalculateICScore(icId: number): Promise<void> {
    await sequelize.query(
        `UPDATE ics SET
            score = (SELECT ROUND(AVG(score)::numeric, 2) FROM feedback WHERE ic_id = :icId),
            entries = (SELECT COUNT(*) FROM feedback WHERE ic_id = :icId)
         WHERE "IC_id" = :icId`,
        {replacements: {icId}}
    );
}

export async function managerAreaId(id: number): Promise<number | null> {
    const rows = await sequelize.query<{area_id: number | null}>(
        `SELECT area_id FROM users WHERE id = :id LIMIT 1`,
        {replacements: {id}, type: QueryTypes.SELECT}
    );
    return rows[0]?.area_id ?? null;
}

export async function managerExists(id: number){
    const rows = await sequelize.query(
        `SELECT 1 FROM users WHERE id = :id AND LOWER(role) = 'manager' LIMIT 1`,
        {replacements: {id}, type: QueryTypes.SELECT}
    );
    return rows.length > 0;
}
