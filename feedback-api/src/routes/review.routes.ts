import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createReview,
  deleteReview,
  getICReview,
  getProjects,
  getScreenshot,
  updateReview,
} from "../controllers/review.controller.js";

const router = Router();
const manager = [requireAuth, requireRole("manager")];

router.get("/ics/:id/reviews", ...manager, getICReview);
router.post("/ics/:id/reviews", ...manager, createReview);
router.patch("/reviews/:id", ...manager, updateReview);
router.delete("/reviews/:id", ...manager, deleteReview);
router.get("/reviews/:id/screenshot", ...manager, getScreenshot);
router.get("/projects", ...manager, getProjects);

export default router;