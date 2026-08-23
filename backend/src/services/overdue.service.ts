import { prisma } from "../utils/prisma.js";

export const getOverdueThresholdDays = async (): Promise<number> => {
  try {
    const config = await prisma.societyConfig.findUnique({
      where: { id: "default_config" },
    });
    if (config && config.overdueThresholdDays > 0) {
      return config.overdueThresholdDays;
    }
  } catch (err) {
    console.error("[OverdueService] Failed to load config, using env fallback:", err);
  }
  return parseInt(process.env.DEFAULT_OVERDUE_DAYS || "3", 10);
};

export interface ComplaintWithOverdueMeta<T = any> {
  complaint: T;
  isOverdue: boolean;
  daysOpen: number;
  overdueDays: number;
}

export const enrichComplaintWithOverdue = (
  complaint: any,
  thresholdDays: number
) => {
  const createdAt = new Date(complaint.createdAt).getTime();
  const endTime = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).getTime()
    : Date.now();

  const diffMs = endTime - createdAt;
  const daysOpen = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const isOverdue =
    complaint.status !== "RESOLVED" && daysOpen >= thresholdDays;
  const overdueDays = isOverdue ? daysOpen - thresholdDays + 1 : 0;

  return {
    ...complaint,
    isOverdue,
    daysOpen,
    overdueDays,
    overdueThresholdDays: thresholdDays,
  };
};
