import React, { useState } from "react";
import { Complaint, ComplaintStatus, ComplaintPriority } from "../types";
import { StatusBadge, PriorityBadge, OverdueBadge } from "./StatusBadge";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  X,
  Clock,
  Image as ImageIcon,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";

interface ComplaintTimelineModalProps {
  complaint: Complaint;
  onClose: () => void;
  onUpdated?: (updated: Complaint) => void;
}

export const ComplaintTimelineModal: React.FC<ComplaintTimelineModalProps> = ({
  complaint: initialComplaint,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint>(initialComplaint);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint.status);
  const [newPriority, setNewPriority] = useState<ComplaintPriority>(complaint.priority);
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewImage, setPreviewImage] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (newStatus === complaint.status && newPriority === complaint.priority && !adminNote) {
      return;
    }

    setIsUpdating(true);
    setFeedbackMsg(null);

    try {
      let currentData = complaint;

      if (newPriority !== complaint.priority) {
        const pRes = await api.patch(`/complaints/${complaint.id}/priority`, {
          priority: newPriority,
        });
        if (pRes.data.success) {
          currentData = pRes.data.data.complaint;
        }
      }

      if (newStatus !== complaint.status || adminNote.trim()) {
        const sRes = await api.patch(`/complaints/${complaint.id}/status`, {
          status: newStatus,
          note: adminNote.trim() || undefined,
        });
        if (sRes.data.success) {
          currentData = sRes.data.data.complaint;
        }
      }

      setComplaint(currentData);
      setAdminNote("");
      setFeedbackMsg({
        type: "success",
        text: "Complaint updated & email notification dispatched to resident.",
      });

      if (onUpdated) {
        onUpdated(currentData);
      }
    } catch (err: any) {
      console.error("Failed to update complaint:", err);
      setFeedbackMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update complaint",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1120]">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
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
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1.5">
                {complaint.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {feedbackMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                  : "bg-rose-950/80 text-rose-300 border border-rose-800"
              }`}
            >
              {feedbackMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {feedbackMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#141d30] p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Status
              </span>
              <div className="mt-1.5">
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Resident Details
              </span>
              <p className="text-xs font-bold text-white mt-1">
                {complaint.resident.name}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {complaint.resident.flatNumber || "No flat assigned"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Logged Timestamp
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-1 font-mono">
                {format(new Date(complaint.createdAt), "MMM d, yyyy · p")}
              </p>
              <p className="text-[11px] text-slate-400">
                Age: {complaint.daysOpen || 0} day(s)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Issue Description
            </h4>
            <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 text-slate-300 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {complaint.photoUrl && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> Attached Photo Evidence
              </h4>
              <div className="relative group inline-block rounded-xl overflow-hidden border border-slate-800 shadow-md max-w-sm">
                <img
                  src={complaint.photoUrl}
                  alt="Complaint evidence"
                  className="max-h-52 w-auto object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                  onClick={() => setPreviewImage(true)}
                />
                <button
                  onClick={() => setPreviewImage(true)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 text-white text-[11px] font-semibold rounded-md backdrop-blur-xs border border-white/10"
                >
                  Expand Photo
                </button>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-[#131d33] p-5 rounded-xl border border-slate-700/80 space-y-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Admin Action: Update Status & Lifecycle
                </h4>
              </div>

              <form onSubmit={handleStatusChange} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Update Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                      className="w-full text-xs font-semibold rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Update Priority
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as ComplaintPriority)}
                      className="w-full text-xs font-semibold rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Action / Resolution Comment (Included in resident notification)
                  </label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Technician arrived, completed valve replacement, verified operating normal."
                    className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-slate-200 p-2.5 border focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isUpdating ? "Saving Changes..." : "Commit Update & Notify Resident"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Complete Status History Trail
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {complaint.history.map((h, index) => (
                <div key={h.id || index} className="relative group">
                  <div className="absolute -left-6 mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f172a] bg-amber-500 shadow-sm"></div>
                  <div className="bg-[#141d30] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {h.changedBy?.name || "System"}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {h.changedBy?.role || "USER"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {format(new Date(h.timestamp), "MMM d, yyyy · p")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {h.previousStatus !== "NONE" && (
                        <>
                          <span className="text-slate-400 text-[11px]">From:</span>
                          <StatusBadge status={h.previousStatus} className="text-[10px] py-0.5 px-2" />
                          <span className="text-slate-500">➔</span>
                        </>
                      )}
                      <span className="text-slate-400 text-[11px]">To:</span>
                      <StatusBadge status={h.newStatus} className="text-[10px] py-0.5 px-2" />
                    </div>

                    {h.note && (
                      <p className="text-xs text-slate-300 italic bg-[#090d16] p-2.5 rounded-lg border border-slate-800 mt-1">
                        "{h.note}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-[#0b1120] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>

      {previewImage && complaint.photoUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={complaint.photoUrl}
              alt="Expanded view"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
            />
            <button
              onClick={() => setPreviewImage(false)}
              className="absolute -top-3 -right-3 p-2 bg-slate-800 text-white rounded-full shadow-lg hover:bg-slate-700 border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
