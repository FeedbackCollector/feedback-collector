import { Router } from "express";
import {
  deleteIC,
  getICs,
  getICsByID,
  patchIC,
  postIC,
} from "../controllers/ic.controller.js";

const router = Router();

router.get("/", getICs);
router.get("/:id", getICsByID);
router.post("/", postIC);
router.patch("/:id", patchIC);
router.delete("/:id", deleteIC);

export default router;
