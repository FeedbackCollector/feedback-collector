import Joi from "joi";

const id = Joi.number().integer().positive();

const dateOnly = Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
        const parsed = new Date(`${value}T00:00:00Z`);
        if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
            return helpers.error("any.invalid");
        }
        return value;
    })
    .messages({
        "string.pattern.base": '"date" must be in YYYY-MM-DD format',
        "any.invalid": '"date" is not a valid date',
    });

const sourceName = Joi.string().trim().min(1).max(200);
const score = Joi.number().integer().min(1).max(5);
const comment = Joi.string().trim().max(5000).allow(null);
const screenshotUrl = Joi.string().trim().uri({ scheme: ["http", "https"] }).max(500).allow(null);

export const createFeedbackScheme = Joi.object({
    author_id: id.required(),
    ic_id: id.default(null),
    project_id: id.required(),
    date: dateOnly.required(),
    source_name: sourceName.required(),
    score: score.required(),
    comment: comment.default(null),
    screenshot_url: screenshotUrl.default(null),
});

export const updateFeedbackScheme = Joi.object({
    author_id: id,
    ic_id: id,
    project_id: id,
    date: dateOnly,
    source_name: sourceName,
    score,
    comment,
    screenshot_url: screenshotUrl,
}).min(1);
