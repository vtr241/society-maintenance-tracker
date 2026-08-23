import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Complaint, ComplaintStatus, ComplaintPriority } from "../types";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/StatusBadge";
import { ComplaintTimelineModal } from "../components/ComplaintTimelineModal";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = [
  "ALL",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Water Supply",
  "Lift/Elevator",
  "Common Area",
  "Security",
  "Other",
];

const STATUSES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"];
const PRIORITIES = ["ALL", "LOW", "MEDIUM", "HIGH"];

export const AdminComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [overdueThreshold, setOverdueThreshold] = useState(3);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (overdueOnly) params.append("overdueOnly", "true");
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await api.get(`/complaints?${params.toString()}`);
      if (res.data.success) {
        setComplaints(res.data.data.complaints);
        setOverdueThreshold(res.data.data.overdueThresholdDays || 3);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, priorityFilter, overdueOnly, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  const handleUpdated = (updated: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedComplaint(updated);
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPriorityFilter("ALL");
    setSearchQuery("");
    setOverdueOnly(false);
    setStartDate("");
    setEndDate("");
  };

  const overdueComplaintsCount = complaints.filter((c) => c.isOverdue).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-800 px-2.5 py-0.5 rounded-full">
            Admin Workspace
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            Complaints Management & SLA Triage
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Surfacing overdue complaints (threshold: {overdueThreshold} days) to top · Full audit history & resident notification flow
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 border shadow-sm ${
              overdueOnly
                ? "bg-rose-950 text-rose-200 border-rose-700"
                : "bg-slate-800/80 text-rose-300 border-slate-700 hover:bg-slate-700/80"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdueOnly ? "Showing Overdue Only" : `Filter Overdue (${overdueComplaintsCount})`}
          </button>

          <button
            onClick={fetchComplaints}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Ticket, resident, flat, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-[#090d16] text-white focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-700 bg-[#090d16] text-white font-medium"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-700 bg-[#090d16] text-white font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-700 bg-[#090d16] text-white font-medium"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs py-2 px-2 rounded-lg border border-slate-700 bg-[#090d16] text-white"
            />
          </div>
        </form>

        <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span>
              Showing <strong className="text-white">{complaints.length}</strong> complaints
            </span>
            {overdueComplaintsCount > 0 && (
              <span className="text-rose-400 font-bold bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded text-[11px]">
                {overdueComplaintsCount} overdue tickets prioritized at top
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-slate-400 hover:text-white underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Complaints List Table / Cards */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            Loading complaint records...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No complaints match filters</h4>
            <p className="text-xs text-slate-500 mt-1">
              Adjust search parameters or clear filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {complaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className={`p-5 hover:bg-[#141d30]/70 transition cursor-pointer flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
                  c.isOverdue ? "bg-rose-950/20 border-l-4 border-l-rose-500" : ""
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {c.ticketId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                      {c.category}
                    </span>
                    <PriorityBadge priority={c.priority} />
                    {c.isOverdue && (
                      <OverdueBadge
                        daysOpen={c.daysOpen}
                        overdueDays={c.overdueDays}
                      />
                    )}
                    {c.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                        <ImageIcon className="w-3 h-3 text-slate-400" /> Photo attached
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                    <span className="text-slate-300">
                      Resident: {c.resident.name} ({c.resident.flatNumber || "No unit"})
                    </span>
                    <span>•</span>
                    <span>
                      Logged: {format(new Date(c.createdAt), "MMM d, yyyy · p")}
                    </span>
                    <span>•</span>
                    <span>
                      {c.history.length} timeline record{c.history.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                  <span className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    Review & Triage ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedComplaint && (
        <ComplaintTimelineModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
};
