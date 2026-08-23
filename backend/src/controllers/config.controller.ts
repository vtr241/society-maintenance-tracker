import { Response } from "express";
import { prisma } from "../utils/prisma.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const getConfig = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let config = await prisma.societyConfig.findUnique({
      where: { id: "default_config" },
    });

    if (!config) {
      config = await prisma.societyConfig.create({
        data: {
          id: "default_config",
          societyName: "Palm Grove Residency",
          overdueThresholdDays: 3,
          contactEmail: "office@palmgrove.local",
          contactPhone: "+1 (555) 019-2834",
        },
      });
    }

    res.json({ success: true, data: { config } });
  } catch (error: any) {
    console.error("[ConfigController.getConfig] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

export const updateConfig = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { societyName, overdueThresholdDays, contactEmail, contactPhone } = req.body;

    const threshold = parseInt(overdueThresholdDays, 10);
    if (isNaN(threshold) || threshold < 1) {
      res.status(400).json({
        success: false,
        message: "Overdue threshold days must be a positive number",
      });
      return;
    }

    const config = await prisma.societyConfig.upsert({
      where: { id: "default_config" },
      update: {
        ...(societyName && { societyName: societyName.trim() }),
        overdueThresholdDays: threshold,
        ...(contactEmail && { contactEmail: contactEmail.trim() }),
        ...(contactPhone && { contactPhone: contactPhone.trim() }),
      },
      create: {
        id: "default_config",
        societyName: societyName ? societyName.trim() : "Palm Grove Residency",
        overdueThresholdDays: threshold,
        contactEmail: contactEmail ? contactEmail.trim() : "office@palmgrove.local",
        contactPhone: contactPhone ? contactPhone.trim() : "+1 (555) 019-2834",
      },
    });

    res.json({
      success: true,
      message: "Society configuration updated successfully",
      data: { config },
    });
  } catch (error: any) {
    console.error("[ConfigController.updateConfig] Error:", error);
    res.status(500).json({ success: false, message: "Failed to update configuration" });
  }
};

export const getNotificationLogs = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const logs = await prisma.notificationLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: { logs } });
  } catch (error: any) {
    console.error("[ConfigController.getNotificationLogs] Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notification logs" });
  }
};
