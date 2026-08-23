import { Response } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  getOverdueThresholdDays,
  enrichComplaintWithOverdue,
} from "../services/overdue.service.js";

export const getAdminStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const threshold = await getOverdueThresholdDays();

    const [
      totalComplaints,
      complaints,
      residentsCount,
      noticesCount,
      recentActivity,
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.findMany({
        include: {
          resident: {
            select: { id: true, name: true, flatNumber: true, email: true },
          },
          history: {
            include: {
              changedBy: { select: { name: true, role: true } },
            },
            orderBy: { timestamp: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: "RESIDENT" } }),
      prisma.notice.count(),
      prisma.complaintHistory.findMany({
        take: 8,
        orderBy: { timestamp: "desc" },
        include: {
          complaint: { select: { id: true, ticketId: true, title: true } },
          changedBy: { select: { name: true, role: true } },
        },
      }),
    ]);

    const enriched = complaints.map((c) =>
      enrichComplaintWithOverdue(c, threshold)
    );

    // Grouping by status
    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };

    // Grouping by priority
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    // Grouping by category
    const categoryCounts: Record<string, number> = {};

    let overdueCount = 0;
    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;

    enriched.forEach((c) => {
      if (statusCounts[c.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[c.status as keyof typeof statusCounts]++;
      }
      if (priorityCounts[c.priority as keyof typeof priorityCounts] !== undefined) {
        priorityCounts[c.priority as keyof typeof priorityCounts]++;
      }

      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;

      if (c.isOverdue) {
        overdueCount++;
      }

      if (c.status === "RESOLVED" && c.resolvedAt) {
        resolvedCount++;
        totalResolutionTimeMs +=
          new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
      }
    });

    const avgResolutionHours =
      resolvedCount > 0
        ? Math.round((totalResolutionTimeMs / resolvedCount / (1000 * 60 * 60)) * 10) / 10
        : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalComplaints,
          statusCounts,
          priorityCounts,
          overdueCount,
          overdueThresholdDays: threshold,
          residentsCount,
          noticesCount,
          avgResolutionHours,
        },
        categoryCounts,
        recentComplaints: enriched.slice(0, 5),
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error("[DashboardController.getAdminStats] Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard metrics" });
  }
};
