import React, { useState } from "react";
import { api } from "../services/api";
import { Notice } from "../types";
import { X, Pin, Bell, AlertCircle } from "lucide-react";

interface NoticeModalProps {
  notice?: Notice | null;
  onClose: () => void;
  onSaved: (notice: Notice) => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  notice,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(notice?.title || "");
  const [content, setContent] = useState(notice?.content || "");
  const [isImportant, setIsImportant] = useState(notice?.isImportant || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please provide a notice title and description.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (notice) {
        const res = await api.put(`/notices/${notice.id}`, {
          title: title.trim(),
          content: content.trim(),
          isImportant,
        });
        if (res.data.success) {
          onSaved(res.data.data.notice);
        }
      } else {
        const res = await api.post("/notices", {
          title: title.trim(),
          content: content.trim(),
          isImportant,
        });
        if (res.data.success) {
          onSaved(res.data.data.notice);
        }
      }
    } catch (err: any) {
      console.error("Failed to save notice:", err);
      setError(err.response?.data?.message || "Failed to publish notice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1120]">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {notice ? "Edit Society Circular" : "Publish Society Circular"}
            </h2>
            <p className="text-xs text-slate-400">
              Broadcast announcements to all registered residents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-xs bg-rose-950/80 border border-rose-800 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Notice Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Power Substation Maintenance"
              className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Announcement Content <span className="text-amber-400">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full announcement details, timings, and instructions..."
              className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-slate-200 p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              required
            />
          </div>

          <div className="bg-[#141d30] p-4 rounded-xl border border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="mt-0.5 h-4 w-4 text-amber-500 bg-slate-900 border-slate-700 rounded focus:ring-amber-400"
              />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
                  Mark as High Priority (Pin to top & Dispatch Email Alert)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pinned notices remain anchored to the top of the resident board and broadcast an instant email notification to all residents.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              {saving ? "Publishing..." : notice ? "Update Circular" : "Publish Circular"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
