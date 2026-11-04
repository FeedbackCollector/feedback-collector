import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/area.controller.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validate } from "../middleware/validate.ts";
import { createAreaScheme, updateAreaScheme } from "../schemes/area.schema.ts";

const router = Router();

router.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    next();
});

router.get("/", getAll);
router.get("/:id", authenticateToken, getById);
router.post("/", authenticateToken, authorizeRole("director"), validate(createAreaScheme), create);
router.patch("/:id", authenticateToken, authorizeRole("director"), validate(updateAreaScheme), update);
router.delete("/:id", authenticateToken, authorizeRole("director"), remove);

export default router;
