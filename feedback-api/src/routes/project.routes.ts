import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/project.controller.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validate } from "../middleware/validate.ts";
import { createProjectScheme, updateProjectScheme } from "../schemes/project.schema.ts";

const router = Router();

router.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    next();
});

router.get("/", authenticateToken, getAll);
router.get("/:id", authenticateToken, getById);
router.post("/", authenticateToken, authorizeRole("director"), validate(createProjectScheme), create);
router.patch("/:id", authenticateToken, authorizeRole("director"), validate(updateProjectScheme), update);
router.delete("/:id", authenticateToken, authorizeRole("director"), remove);

export default router;
