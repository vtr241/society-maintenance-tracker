import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Notice } from "../types";
import { NoticeModal } from "../components/NoticeModal";
import {
  Pin,
  Plus,
  Bell,
  Trash2,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

export const NoticeBoardPage: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const isAdmin = user?.role === "ADMIN";

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notices");
      if (res.data.success) {
        setNotices(res.data.data.notices);
      }
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSaved = (savedNotice: Notice) => {
    setShowModal(false);
    setEditingNotice(null);
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await api.delete(`/notices/${id}`);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notice:", err);
    }
  };

  const pinnedNotices = notices.filter((n) => n.isImportant);
  const regularNotices = notices.filter((n) => !n.isImportant);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1a253c] to-[#0f172a] rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Bell className="w-3 h-3 text-amber-400" /> Society Notice Board
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Official Circulars & Community Notices
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Official announcements, scheduled utility maintenance, and community notices issued by Palm Grove Residency Management.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingNotice(null);
              setShowModal(true);
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/10 transition flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Publish Notice
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
          Loading announcements...
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-12 text-center">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No circulars posted</h3>
          <p className="text-xs text-slate-500 mt-1">
            Check back later for society announcements.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pinned / High Priority Notices */}
          {pinnedNotices.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Pinned Announcements ({pinnedNotices.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pinnedNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-[#141d30] border-2 border-amber-500/60 rounded-2xl p-6 shadow-md relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                          <Pin className="w-3 h-3 rotate-45 text-amber-400" /> Pinned Notice
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingNotice(notice);
                                setShowModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                              title="Edit notice"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40"
                              title="Delete notice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mt-3">
                        {notice.title}
                      </h3>

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>By {notice.author?.name || "Society Admin"}</span>
                      <span>{format(new Date(notice.createdAt), "MMM d, yyyy · p")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Notices */}
          {regularNotices.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                General Circulars ({regularNotices.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {regularNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                          Announcement
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingNotice(notice);
                                setShowModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white mt-2">
                        {notice.title}
                      </h3>

                      <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>By {notice.author?.name || "Admin"}</span>
                      <span>{format(new Date(notice.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NoticeModal
          notice={editingNotice}
          onClose={() => {
            setShowModal(false);
            setEditingNotice(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
