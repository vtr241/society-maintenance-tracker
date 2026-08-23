import { Router } from "express";
import {
  createComplaint,
  getResidentComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  updateComplaintPriority,
} from "../controllers/complaint.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { uploadComplaintPhoto } from "../middleware/upload.middleware.js";

const router = Router();

// Resident routes
router.post("/", authenticate, uploadComplaintPhoto.single("photo"), createComplaint);
router.get("/my", authenticate, getResidentComplaints);
router.get("/:id", authenticate, getComplaintById);

// Admin routes
router.get("/", authenticate, requireAdmin, getAllComplaints);
router.patch("/:id/status", authenticate, requireAdmin, updateComplaintStatus);
router.patch("/:id/priority", authenticate, requireAdmin, updateComplaintPriority);

export default router;
