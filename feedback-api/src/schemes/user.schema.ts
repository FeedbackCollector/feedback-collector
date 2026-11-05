import Joi from "joi";

export const registerScheme = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(8).max(72).required(),
    area_id: Joi.number().integer().positive().required(),
});

export const loginScheme = Joi.object({
    email: Joi.string().trim().lowercase().required(),
    password: Joi.string().required(),
});

export const changePasswordScheme = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(72).invalid(Joi.ref("currentPassword")).required(),
});

const userName = Joi.string().trim().min(2).max(100);
const userEmail = Joi.string().trim().lowercase().email();
const areaId = Joi.number().integer().positive();

export const createUserScheme = Joi.object({
    name: userName.required(),
    email: userEmail.required(),
    password: Joi.string().min(8).max(72).required(),
    role: Joi.string().valid("manager", "director").default("manager"),
    area_id: areaId.when("role", { is: "manager", then: Joi.required(), otherwise: Joi.optional() }),
});

export const updateUserScheme = Joi.object({
    name: userName,
    email: userEmail,
    area_id: areaId,
}).min(1);

export const listUsersQueryScheme = Joi.object({
    role: Joi.string().valid("manager", "director"),
});
