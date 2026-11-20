import Joi from "joi";

const name = Joi.string().trim().min(1).max(200);
const managerIds = Joi.array().items(Joi.number().integer().positive()).unique();

export const createProjectScheme = Joi.object({
    name: name.required(),
    manager_ids: managerIds,
});

export const updateProjectScheme = Joi.object({
    name,
    manager_ids: managerIds,
}).min(1);
