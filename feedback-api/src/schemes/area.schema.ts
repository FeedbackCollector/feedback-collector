import Joi from "joi";

const name = Joi.string().trim().min(2).max(200);

export const createAreaScheme = Joi.object({
    name: name.required(),
});

export const updateAreaScheme = Joi.object({
    name,
}).min(1);
