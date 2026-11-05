import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/ic.controller.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validate, validateQuery } from "../middleware/validate.ts";
import { createICScheme, updateICScheme, listICsQueryScheme } from "../schemes/ic.schema.ts";

const router = Router();

router.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    next();
});

router.get("/", authenticateToken, validateQuery(listICsQueryScheme), getAll);
router.get("/:id", authenticateToken, getById);
router.post("/", authenticateToken, authorizeRole("director"), validate(createICScheme), create);
router.patch("/:id", authenticateToken, authorizeRole("director"), validate(updateICScheme), update);
router.delete("/:id", authenticateToken, authorizeRole("director"), remove);

export default router;
