import Joi from "joi";

export const registerScheme = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(72).required(),
    area_id: Joi.number().integer().positive().required(),
});

export const loginScheme = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
});

export const changePasswordScheme = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(72).invalid(Joi.ref("currentPassword")).required(),
});
