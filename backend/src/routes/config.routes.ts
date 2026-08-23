import { Router } from "express";
import {
  getConfig,
  updateConfig,
  getNotificationLogs,
} from "../controllers/config.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getConfig);
router.put("/", authenticate, requireAdmin, updateConfig);
router.get("/logs/notifications", authenticate, requireAdmin, getNotificationLogs);

export default router;
