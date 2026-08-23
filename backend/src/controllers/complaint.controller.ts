import { Response } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getOverdueThresholdDays,
  enrichComplaintWithOverdue,
} from "../services/overdue.service.js";
import { sendStatusChangeEmail } from "../services/email.service.js";

const generateNextTicketId = async (): Promise<string> => {
  const count = await prisma.complaint.count();
  return `CMP-${String(count + 1001).padStart(4, "0")}`;
};

export const createComplaint = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { title, category, description } = req.body;

    if (!title || !category || !description) {
      res.status(400).json({
        success: false,
        message: "Title, category, and description are required",
      });
      return;
    }

    let photoUrl: string | null = null;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    const ticketId = await generateNextTicketId();

    // Create complaint and initial history in transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const newComplaint = await tx.complaint.create({
        data: {
          ticketId,
          title: title.trim(),
          category: category.trim(),
          description: description.trim(),
          photoUrl,
          status: "OPEN",
          priority: "MEDIUM",
          residentId: req.user!.id,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: newComplaint.id,
          previousStatus: "NONE",
          newStatus: "OPEN",
          changedById: req.user!.id,
          note: "Complaint submitted by resident.",
        },
      });

      return newComplaint;
    });

    const fullComplaint = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const threshold = await getOverdueThresholdDays();
    const enriched = enrichComplaintWithOverdue(fullComplaint, threshold);

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      data: { complaint: enriched },
    });
  } catch (error: any) {
    console.error("[ComplaintController.createComplaint] Error:", error);
    res.status(500).json({ success: false, message: "Failed to create complaint" });
  }
};

export const getResidentComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const threshold = await getOverdueThresholdDays();

    const complaints = await prisma.complaint.findMany({
      where: { residentId: req.user.id },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedComplaints = complaints.map((c) =>
      enrichComplaintWithOverdue(c, threshold)
    );

    res.json({
      success: true,
      data: {
        complaints: enrichedComplaints,
        count: enrichedComplaints.length,
      },
    });
  } catch (error: any) {
    console.error("[ComplaintController.getResidentComplaints] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch resident complaints" });
  }
};

export const getAllComplaints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      category,
      priority,
      search,
      overdueOnly,
      startDate,
      endDate,
    } = req.query;

    const threshold = await getOverdueThresholdDays();

    const whereClause: any = {};

    if (status && typeof status === "string" && status !== "ALL") {
      whereClause.status = status;
    }

    if (category && typeof category === "string" && category !== "ALL") {
      whereClause.category = category;
    }

    if (priority && typeof priority === "string" && priority !== "ALL") {
      whereClause.priority = priority;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && typeof startDate === "string") {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { ticketId: { contains: q } },
        { resident: { name: { contains: q } } },
        { resident: { flatNumber: { contains: q } } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let enrichedComplaints = complaints.map((c) =>
      enrichComplaintWithOverdue(c, threshold)
    );

    if (overdueOnly === "true") {
      enrichedComplaints = enrichedComplaints.filter((c) => c.isOverdue);
    }

    // Surface overdue complaints to the top as required by spec
    enrichedComplaints.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({
      success: true,
      data: {
        complaints: enrichedComplaints,
        count: enrichedComplaints.length,
        overdueCount: enrichedComplaints.filter((c) => c.isOverdue).length,
        overdueThresholdDays: threshold,
      },
    });
  } catch (error: any) {
    console.error("[ComplaintController.getAllComplaints] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
};

export const getComplaintById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const threshold = await getOverdueThresholdDays();

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!complaint) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    // Role check: resident can only view their own
    if (req.user?.role === "RESIDENT" && complaint.residentId !== req.user.id) {
      res.status(403).json({ success: false, message: "Access forbidden" });
      return;
    }

    const enriched = enrichComplaintWithOverdue(complaint, threshold);

    res.json({ success: true, data: { complaint: enriched } });
  } catch (error: any) {
    console.error("[ComplaintController.getComplaintById] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch complaint details" });
  }
};

export const updateComplaintStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
      return;
    }

    const currentComplaint = await prisma.complaint.findUnique({
      where: { id },
      include: { resident: true },
    });

    if (!currentComplaint) {
      res.status(404).json({ success: false, message: "Complaint not found" });
      return;
    }

    const previousStatus = currentComplaint.status;
    const resolvedAt = status === "RESOLVED" ? new Date() : null;

    const updatedComplaint = await prisma.$transaction(async (tx) => {
      const updated = await tx.complaint.update({
        where: { id },
        data: {
          status,
          resolvedAt: status === "RESOLVED" ? resolvedAt : currentComplaint.resolvedAt,
        },
      });

      await tx.complaintHistory.create({
        data: {
          complaintId: id,
          previousStatus,
          newStatus: status,
          changedById: req.user!.id,
          note: note ? note.trim() : `Status updated to ${status} by admin.`,
        },
      });

      return updated;
    });

    // Send email notification to resident on status change
    sendStatusChangeEmail(
      currentComplaint.resident.email,
      currentComplaint.resident.name,
      currentComplaint.ticketId,
      currentComplaint.title,
      previousStatus,
      status,
      note
    ).catch((err) => console.error("[ComplaintController] Email trigger failed:", err));

    const fullComplaint = await prisma.complaint.findUnique({
      where: { id: updatedComplaint.id },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const threshold = await getOverdueThresholdDays();
    const enriched = enrichComplaintWithOverdue(fullComplaint, threshold);

    res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: { complaint: enriched },
    });
  } catch (error: any) {
    console.error("[ComplaintController.updateComplaintStatus] Error:", error);
    res.status(500).json({ success: false, message: "Failed to update complaint status" });
  }
};

export const updateComplaintPriority = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!priority || !validPriorities.includes(priority)) {
      res.status(400).json({
        success: false,
        message: `Invalid priority. Allowed values: ${validPriorities.join(", ")}`,
      });
      return;
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { priority },
      include: {
        resident: {
          select: { id: true, name: true, email: true, flatNumber: true, phone: true },
        },
        history: {
          include: {
            changedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { timestamp: "asc" },
        },
      },
    });

    const threshold = await getOverdueThresholdDays();
    const enriched = enrichComplaintWithOverdue(updated, threshold);

    res.json({
      success: true,
      message: `Priority updated to ${priority}`,
      data: { complaint: enriched },
    });
  } catch (error: any) {
    console.error("[ComplaintController.updateComplaintPriority] Error:", error);
    res.status(500).json({ success: false, message: "Failed to update complaint priority" });
  }
};
