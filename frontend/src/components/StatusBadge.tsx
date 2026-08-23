import React from "react";
import { ComplaintStatus, ComplaintPriority } from "../types";
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

export const StatusBadge: React.FC<{ status: ComplaintStatus | string; className?: string }> = ({
  status,
  className = "",
}) => {
  switch (status) {
    case "OPEN":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Open
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/60 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
          In Progress
        </span>
      );
    case "RESOLVED":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Resolved
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}
        >
          {status}
        </span>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: ComplaintPriority | string }> = ({
  priority,
}) => {
  switch (priority) {
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 tracking-wide uppercase">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-800/50 tracking-wide uppercase">
          Medium
        </span>
      );
    case "LOW":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/80 tracking-wide uppercase">
          Low
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">{priority}</span>;
  }
};

export const OverdueBadge: React.FC<{ daysOpen?: number; overdueDays?: number }> = ({
  daysOpen,
  overdueDays,
}) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-200 border border-rose-700 animate-pulse shadow-sm">
      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
      OVERDUE {overdueDays ? `(+${overdueDays}d)` : ""}
    </span>
  );
};
