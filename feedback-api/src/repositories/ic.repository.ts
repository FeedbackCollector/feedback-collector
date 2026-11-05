import {Op, QueryTypes} from "sequelize"
import {sequelize} from "../db/connection.ts"
import {ICs} from "../models/ic.ts"
import type {IC, NewIC, UpdateIC, ICFilters} from "../types/ic.ts"


export async function icFindAll(filters: ICFilters){

    const {name, title, manager_id, page, limit} = filters

    const where: {
      name?: object | string;
      title?: object | string;
      manager_id?: number;
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

export async function icCreate(data: NewIC): Promise<IC> {
    const ic = await ICs.create({
        name: data.name,
        title: data.title,
        manager_id: data.manager_id,
        entries: data.entries,
    });
    return ic.toJSON();
}

export async function icUpdate(data: UpdateIC, id: number): Promise<IC | null> {
    await ICs.update(data, { where: { IC_id: id } });
    return icFindByID(id);
}

export async function icDelete(id: number): Promise<boolean> {
    const deleted = await ICs.destroy({ where: { IC_id: id } });
    return deleted > 0;
}

export async function managerExists(id: number){
    const rows = await sequelize.query(
        `SELECT 1 FROM users WHERE id = :id AND LOWER(role) = 'manager' LIMIT 1`,
        {replacements: {id}, type: QueryTypes.SELECT}
    );
    return rows.length > 0;
}
