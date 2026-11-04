import Joi from "joi";

const name = Joi.string().trim().min(1).max(200);
const title = Joi.string().trim().min(1).max(200);
const managerId = Joi.number().integer().positive();
const entries = Joi.number().integer().min(0);

export const createICScheme = Joi.object({
    name: name.required(),
    title: title.required(),
    manager_id: managerId.required(),
    entries: entries.required(),
});

export const updateICScheme = Joi.object({
    name,
    title,
    manager_id: managerId,
    entries,
}).min(1);

export const listICsQueryScheme = Joi.object({
    name: Joi.string().trim().min(1),
    title: Joi.string().trim().min(1),
    manager_id: managerId,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});
