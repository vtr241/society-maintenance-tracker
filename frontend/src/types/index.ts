export type Role = "RESIDENT" | "ADMIN";
export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  flatNumber?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface ComplaintHistory {
  id: string;
  complaintId: string;
  previousStatus: string;
  newStatus: string;
  changedById: string;
  changedBy: {
    id: string;
    name: string;
    role: string;
  };
  note?: string | null;
  timestamp: string;
}

export interface Complaint {
  id: string;
  ticketId: string;
  title: string;
  category: string;
  description: string;
  photoUrl?: string | null;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  residentId: string;
  resident: {
    id: string;
    name: string;
    email: string;
    flatNumber?: string | null;
    phone?: string | null;
  };
  history: ComplaintHistory[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  daysOpen?: number;
  overdueDays?: number;
  overdueThresholdDays?: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isImportant: boolean;
  authorId: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SocietyConfig {
  id: string;
  societyName: string;
  overdueThresholdDays: number;
  contactEmail?: string | null;
  contactPhone?: string | null;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  subject: string;
  content: string;
  type: string;
  status: string;
  error?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  summary: {
    totalComplaints: number;
    statusCounts: {
      OPEN: number;
      IN_PROGRESS: number;
      RESOLVED: number;
    };
    priorityCounts: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
    };
    overdueCount: number;
    overdueThresholdDays: number;
    residentsCount: number;
    noticesCount: number;
    avgResolutionHours: number;
  };
  categoryCounts: Record<string, number>;
  recentComplaints: Complaint[];
  recentActivity: Array<{
    id: string;
    complaintId: string;
    previousStatus: string;
    newStatus: string;
    note?: string | null;
    timestamp: string;
    changedBy: { name: string; role: string };
    complaint: { id: string; ticketId: string; title: string };
  }>;
}
