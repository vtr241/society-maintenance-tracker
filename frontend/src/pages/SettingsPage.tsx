import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { SocietyConfig } from "../types";
import {
  Building,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const [societyName, setSocietyName] = useState("");
  const [overdueThresholdDays, setOverdueThresholdDays] = useState(3);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get("/config");
      if (res.data.success && res.data.data.config) {
        const c: SocietyConfig = res.data.data.config;
        setSocietyName(c.societyName);
        setOverdueThresholdDays(c.overdueThresholdDays);
        setContactEmail(c.contactEmail || "");
        setContactPhone(c.contactPhone || "");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put("/config", {
        societyName,
        overdueThresholdDays: Number(overdueThresholdDays),
        contactEmail,
        contactPhone,
      });

      if (res.data.success) {
        setMessage({
          type: "success",
          text: "Society configuration and overdue threshold updated successfully.",
        });
      }
    } catch (err: any) {
      console.error("Failed to save config:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update configuration",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-100">
      <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/80 border border-purple-800 px-2.5 py-0.5 rounded-full">
          System Configuration
        </span>
        <h1 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
          Society & SLA Threshold Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure society details and dynamic overdue detection rules
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-rose-950/80 text-rose-300 border border-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Overdue Threshold Configuration Card */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Configurable Overdue Detection Threshold
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Specify how many days a complaint may remain in <code className="bg-slate-800 text-amber-400 px-1 py-0.5 rounded text-[11px]">OPEN</code> or <code className="bg-slate-800 text-amber-400 px-1 py-0.5 rounded text-[11px]">IN_PROGRESS</code> status before the engine flags it as <strong>OVERDUE</strong> and automatically prioritizes it to the top of the admin triage queue.
          </p>

          <div className="max-w-xs">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              Threshold in Days
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="30"
                value={overdueThresholdDays}
                onChange={(e) => setOverdueThresholdDays(parseInt(e.target.value, 10) || 1)}
                className="w-24 text-sm font-bold text-center rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 font-mono"
                required
              />
              <span className="text-xs text-slate-400 font-medium">
                Days from ticket creation
              </span>
            </div>
          </div>
        </div>

        {/* General Society Profile */}
        <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Building className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Society Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Society Name
              </label>
              <input
                type="text"
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                placeholder="e.g. Palm Grove Residency"
                className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Office Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="office@society.com"
                className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Office Phone / Helpline
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full text-xs rounded-lg border-slate-700 bg-[#090d16] text-white p-2.5 border focus:ring-1 focus:ring-amber-500 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
};
