import { Router } from "express";
import {
  getAllNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} from "../controllers/notice.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getAllNotices);
router.post("/", authenticate, requireAdmin, createNotice);
router.put("/:id", authenticate, requireAdmin, updateNotice);
router.delete("/:id", authenticate, requireAdmin, deleteNotice);

export default router;
