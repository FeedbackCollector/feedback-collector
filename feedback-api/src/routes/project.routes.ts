import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/project.controller.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";

const router = Router();

router.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    next();
});

router.get("/", authenticateToken, getAll);
router.get("/:id", authenticateToken, getById);
router.post("/", authenticateToken, authorizeRole("director"), create);
router.put("/:id", authenticateToken, authorizeRole("director"), update);
router.delete("/:id", authenticateToken, authorizeRole("director"), remove);

export default router;
