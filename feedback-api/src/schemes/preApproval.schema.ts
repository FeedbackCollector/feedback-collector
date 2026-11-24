import Joi from "joi";

export const preApprovalScheme = Joi.object({
    email: Joi.string().trim().lowercase().email().max(255).required(),
});
