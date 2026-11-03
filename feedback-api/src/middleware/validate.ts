import { Request, Response, NextFunction, RequestHandler } from "express";
import { ObjectSchema } from "joi";

export function validate(schema: ObjectSchema): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body ?? {}, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        res.status(400).json({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "The submitted data is invalid.",
        errors: error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message,
        })),
        });
        return;
    }

    req.body = value;
    next();
    };
}

// Express 5 makes req.query read-only, so the validated query goes to res.locals.query
export function validateQuery(schema: ObjectSchema): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            res.status(400).json({
                status: "error",
                code: "VALIDATION_ERROR",
                message: "The submitted query is invalid.",
                errors: error.details.map((d) => ({
                    field: d.path.join("."),
                    message: d.message,
                })),
            });
            return;
        }

        res.locals.query = value;
        next();
    };
}
