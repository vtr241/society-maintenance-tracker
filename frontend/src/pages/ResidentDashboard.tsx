import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Complaint } from "../types";
import { StatusBadge, PriorityBadge, OverdueBadge } from "../components/StatusBadge";
import { ComplaintTimelineModal } from "../components/ComplaintTimelineModal";
import { NewComplaintModal } from "../components/NewComplaintModal";
import {
  Plus,
  Clock,
  CheckCircle2,
  Image as ImageIcon,
  History,
  Building,
  RefreshCw,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";

export const ResidentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get("/complaints/my");
      if (res.data.success) {
        setComplaints(res.data.data.complaints);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreated = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
    setShowNewModal(false);
    setSelectedComplaint(newComplaint);
  };

  const handleUpdated = (updated: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedComplaint(updated);
  };

  const totalCount = complaints.length;
  const activeCount = complaints.filter((c) => c.status !== "RESOLVED").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "ACTIVE" && c.status === "RESOLVED") return false;
    if (activeTab === "RESOLVED" && c.status !== "RESOLVED") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.ticketId.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#162036] to-[#0f172a] rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full mb-2">
            Resident Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Unit: <strong className="text-amber-400 font-mono">{user?.flatNumber || "Assigned Unit"}</strong> · Palm Grove Residency Maintenance Operations
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="relative z-10 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/10 transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          File Maintenance Request
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`bg-[#0f172a] rounded-2xl p-5 border cursor-pointer transition ${
            activeTab === "ALL"
              ? "border-amber-500/80 shadow-md ring-1 ring-amber-500/20"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Filed</span>
            <History className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2 font-mono">{totalCount}</p>
          <span className="text-xs text-slate-400">All submitted maintenance tickets</span>
        </div>

        <div
          onClick={() => setActiveTab("ACTIVE")}
          className={`bg-[#0f172a] rounded-2xl p-5 border cursor-pointer transition ${
            activeTab === "ACTIVE"
              ? "border-sky-500/80 shadow-md ring-1 ring-sky-500/20"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center text-sky-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active / In Progress</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-sky-400 mt-2 font-mono">{activeCount}</p>
          <span className="text-xs text-slate-400">Pending or undergoing repair</span>
        </div>

        <div
          onClick={() => setActiveTab("RESOLVED")}
          className={`bg-[#0f172a] rounded-2xl p-5 border cursor-pointer transition ${
            activeTab === "RESOLVED"
              ? "border-emerald-500/80 shadow-md ring-1 ring-emerald-500/20"
              : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{resolvedCount}</p>
          <span className="text-xs text-slate-400">Completed and certified repairs</span>
        </div>
      </div>

      {/* Complaint List Section */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0b1120]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Maintenance Tickets
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
              {filteredComplaints.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search ticket, category, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-[#090d16] text-white focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              />
            </div>

            <button
              onClick={fetchComplaints}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 bg-[#090d16]"
              title="Refresh complaints"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
            Loading maintenance requests...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-slate-800/60 text-slate-500 mb-3 border border-slate-800">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No tickets recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "No complaints match your search query."
                : "No maintenance requests have been filed in this view."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 shadow-sm"
              >
                File First Request
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredComplaints.map((complaint) => (
              <div
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className="p-5 hover:bg-[#141d30]/70 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {complaint.ticketId}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                      {complaint.category}
                    </span>
                    <PriorityBadge priority={complaint.priority} />
                    {complaint.isOverdue && (
                      <OverdueBadge
                        daysOpen={complaint.daysOpen}
                        overdueDays={complaint.overdueDays}
                      />
                    )}
                    {complaint.photoUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                        <ImageIcon className="w-3 h-3 text-slate-400" /> Photo attached
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">
                    {complaint.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {complaint.description}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                    <span>
                      Logged {format(new Date(complaint.createdAt), "MMM d, yyyy · p")}
                    </span>
                    <span>•</span>
                    <span>
                      {complaint.history.length} update
                      {complaint.history.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                  <StatusBadge status={complaint.status} />
                  <span className="text-xs text-amber-400 font-semibold hover:underline flex items-center gap-1">
                    View Timeline ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewComplaintModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}

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
