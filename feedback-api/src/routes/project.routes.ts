import { Router } from "express";
import { getAll, getById, create, update, remove } from "../controllers/project.controller.ts";
import { authenticate, authorizeRole } from "../middleware/auth.ts";

const router = Router();

router.param("id", (req, res, next, value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    next();
});

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);
router.post("/", authenticate, authorizeRole("director"), create);
router.put("/:id", authenticate, authorizeRole("director"), update);
router.delete("/:id", authenticate, authorizeRole("director"), remove);

export default router;
