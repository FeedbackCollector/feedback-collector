import Joi from "joi";

const name = Joi.string().trim().min(1).max(200);

export const createProjectScheme = Joi.object({
    name: name.required(),
});

export const updateProjectScheme = Joi.object({
    name,
}).min(1);
