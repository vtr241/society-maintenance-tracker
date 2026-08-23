import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { DashboardStats, Complaint } from "../types";
import { StatCard } from "../components/StatCard";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/StatusBadge";
import { ComplaintTimelineModal } from "../components/ComplaintTimelineModal";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";

const CATEGORY_COLORS = [
  "#f59e0b",
  "#0ea5e9",
  "#10b981",
  "#f43f5e",
  "#a855f7",
  "#06b6d4",
  "#64748b",
  "#e2e8f0",
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
        <p className="text-xs font-semibold uppercase tracking-wider">Loading society analytics...</p>
      </div>
    );
  }

  const { summary, categoryCounts, recentComplaints, recentActivity } = stats;

  const categoryChartData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const statusChartData = [
    { name: "Open", count: summary.statusCounts.OPEN, fill: "#f59e0b" },
    { name: "In Progress", count: summary.statusCounts.IN_PROGRESS, fill: "#38bdf8" },
    { name: "Resolved", count: summary.statusCounts.RESOLVED, fill: "#10b981" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-800 px-2.5 py-0.5 rounded-full">
            Operations & Triage Center
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            Maintenance Analytics & SLA Oversight
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configured SLA Overdue Threshold: <strong className="text-amber-400 font-mono">{summary.overdueThresholdDays} days</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/complaints"
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" /> Manage Complaints
          </Link>
          <Link
            to="/admin/settings"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition"
            title="Configure Thresholds"
          >
            <Sliders className="w-4 h-4" />
          </Link>
          <button
            onClick={fetchStats}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Complaints"
          value={summary.totalComplaints}
          subtitle="All recorded society tickets"
          icon={FileSpreadsheet}
          color="blue"
        />

        <StatCard
          title="Overdue Complaints"
          value={summary.overdueCount}
          subtitle={`Exceeded ${summary.overdueThresholdDays}-day SLA threshold`}
          icon={AlertTriangle}
          color="red"
          badge={summary.overdueCount > 0 ? "Immediate Action" : "Within SLA"}
        />

        <StatCard
          title="Active Tickets"
          value={summary.statusCounts.OPEN + summary.statusCounts.IN_PROGRESS}
          subtitle={`${summary.statusCounts.OPEN} Open, ${summary.statusCounts.IN_PROGRESS} In Progress`}
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Resolved Tickets"
          value={summary.statusCounts.RESOLVED}
          subtitle={
            summary.avgResolutionHours > 0
              ? `Avg ${summary.avgResolutionHours} hrs turnaround`
              : "Closed & verified"
          }
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Complaints by Maintenance Category
            </h3>
            <p className="text-xs text-slate-400">
              Distribution across domain specialties
            </p>
          </div>

          <div className="h-64 mt-4">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b1120", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    itemStyle={{ color: "#f8fafc" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Complaints Status Lifecycle
            </h3>
            <p className="text-xs text-slate-400">
              Breakdown of Open vs In-Progress vs Resolved
            </p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b1120", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "#f8fafc" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Overdue Queue & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#0f172a] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0b1120]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Priority & Overdue Queue
              </h3>
              <p className="text-xs text-slate-400">
                Surfaced items requiring administrator triage
              </p>
            </div>
            <Link
              to="/admin/complaints"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Full Queue ➔
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {recentComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-4 hover:bg-[#141d30]/70 transition cursor-pointer flex items-center justify-between gap-3 ${
                  c.isOverdue ? "bg-rose-950/20 border-l-4 border-l-rose-500" : ""
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {c.ticketId}
                    </span>
                    <PriorityBadge priority={c.priority} />
                    {c.isOverdue && (
                      <OverdueBadge
                        daysOpen={c.daysOpen}
                        overdueDays={c.overdueDays}
                      />
                    )}
                  </div>
                  <p className="text-xs font-bold text-white truncate">
                    {c.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    By {c.resident.name} ({c.resident.flatNumber || "No unit"}) ·{" "}
                    {format(new Date(c.createdAt), "MMM d, HH:mm")}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#0f172a] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-800 bg-[#0b1120]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Status Transition Audit Trail
            </h3>
            <p className="text-xs text-slate-400">
              Recent workflow changes recorded across the society
            </p>
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.map((act) => (
              <div
                key={act.id}
                className="text-xs p-3 rounded-xl bg-[#141d30] border border-slate-800 space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-amber-400">
                    {act.complaint.ticketId}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {format(new Date(act.timestamp), "MMM d, HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span>{act.changedBy?.name || "System"}</span>
                  <span className="text-slate-500">➔</span>
                  <StatusBadge status={act.newStatus} className="text-[10px] py-0.2 px-1.5" />
                </div>
                {act.note && (
                  <p className="text-[11px] text-slate-400 italic bg-[#090d16] p-1.5 rounded border border-slate-800">
                    "{act.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedComplaint && (
        <ComplaintTimelineModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={fetchStats}
        />
      )}
    </div>
  );
};
