import { Router } from "express";
import { getAdminStats } from "../controllers/dashboard.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", authenticate, requireAdmin, getAdminStats);

export default router;
