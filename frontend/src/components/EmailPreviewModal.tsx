import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { NotificationLog } from "../types";
import { X, Mail, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export const EmailPreviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/config/logs/notifications");
      if (res.data.success) {
        setLogs(res.data.data.logs);
        if (res.data.data.logs.length > 0 && !selectedLog) {
          setSelectedLog(res.data.data.logs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load email logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1120]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Notification Dispatch Log
              </h3>
              <p className="text-xs text-slate-400">
                Audited email dispatches for ticket status transitions and society circulars
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto divide-y divide-slate-800/60 bg-[#090d16]">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {loading ? "Loading logs..." : "No notification logs recorded yet."}
              </div>
            ) : (
              logs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left p-4 transition flex flex-col gap-1 ${
                    selectedLog?.id === log.id
                      ? "bg-slate-800/80 border-l-4 border-amber-500"
                      : "hover:bg-slate-850/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {log.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {format(new Date(log.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {log.subject}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                      To: {log.recipientEmail}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        log.status === "SENT"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : log.status === "SIMULATED"
                          ? "bg-sky-950 text-sky-300 border-sky-800"
                          : "bg-rose-950 text-rose-300 border-rose-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="md:col-span-7 p-6 overflow-y-auto bg-[#0b1120]">
            {selectedLog ? (
              <div className="space-y-4">
                <div className="bg-[#141d30] rounded-xl p-4 border border-slate-800 shadow-sm space-y-2">
                  <div className="grid grid-cols-3 text-xs gap-y-1.5">
                    <span className="text-slate-400 font-medium">To:</span>
                    <span className="col-span-2 font-semibold text-slate-100 font-mono">
                      {selectedLog.recipientEmail}
                    </span>

                    <span className="text-slate-400 font-medium">Subject:</span>
                    <span className="col-span-2 font-semibold text-slate-100">
                      {selectedLog.subject}
                    </span>

                    <span className="text-slate-400 font-medium">Status:</span>
                    <span className="col-span-2 font-bold text-amber-400">
                      {selectedLog.status} (In-App Dispatch Record)
                    </span>

                    <span className="text-slate-400 font-medium">Timestamp:</span>
                    <span className="col-span-2 text-slate-400 font-mono">
                      {format(new Date(selectedLog.createdAt), "PPPP, HH:mm:ss")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Rendered Email Body
                  </label>
                  <div
                    className="bg-[#090d16] rounded-xl p-4 border border-slate-800 shadow-inner max-w-none text-slate-200"
                    dangerouslySetInnerHTML={{ __html: selectedLog.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Select a notification entry from the left to inspect content
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-[#090d16] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
