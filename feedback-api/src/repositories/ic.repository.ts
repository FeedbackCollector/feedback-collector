import {Op, QueryTypes} from "sequelize"
import {sequelize} from "../db/connection.js"
import {ICs} from "../models/ic.js"
import type {IC, NewIC} from "../types/ic.js"

interface ICsFilters{
    name?: string
    title?: string
    manager_id?: number
    page: number
    limit: number
}

function toIC(ic: ICs): IC {
    return {
        IC_id: ic.IC_id,
        name: ic.name,
        title: ic.title,
        manager_id: ic.manager_id,
        entries: ic.entries
    }
}

export async function icFindAll(filters: ICsFilters){

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
        data: result.rows.map(toIC),
        pagination: {
            page, limit, total: result.count, totalPages: Math.ceil(result.count / limit )
        }
    }
}

export async function icFindByID(id: number){
    const ic = await ICs.findByPk(id);
    if(!ic) return null;
    return toIC(ic);
}

export async function icCreate(data: NewIC){
    const ic = await ICs.create({
      name: data.name,
      title: data.title,
      manager_id: data.manager_id,
      entries: data.entries,
    });
    return toIC(ic);
}

export async function icUpdate(
    id: number,
    data: Partial<NewIC>
){
    const ic = await ICs.findByPk(id);

    if (!ic) return null;

    if (data.name !== undefined) ic.name = data.name;
    if (data.title !== undefined) ic.title = data.title;
    if (data.manager_id !== undefined) ic.manager_id = data.manager_id;
    if (data.entries !== undefined) ic.entries = data.entries;

    await ic.save();

    return toIC(ic);
}

export async function icDelete(id: number){
    const ic = await ICs.findByPk(id);

    if (!ic) return false;
    await ic.destroy();
    return true;
}

// Queries the users table directly so this branch doesn't need the User model
// that lives on the Users-BE branch.
export async function managerExists(id: number){
    const rows = await sequelize.query(
        `SELECT 1 FROM users WHERE id = :id AND LOWER(role) = 'manager' LIMIT 1`,
        {replacements: {id}, type: QueryTypes.SELECT}
    );
    return rows.length > 0;
}
