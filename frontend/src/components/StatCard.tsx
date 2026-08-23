import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  badge?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  badge,
  onClick,
}) => {
  const colorMap = {
    blue: "bg-sky-950/60 text-sky-400 border-sky-800/60",
    green: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    amber: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    red: "bg-rose-950/60 text-rose-400 border-rose-800/60",
    purple: "bg-purple-950/60 text-purple-400 border-purple-800/60",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#0f172a]/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-lg shadow-black/20 hover:border-slate-700 transition duration-200 flex flex-col justify-between relative overflow-hidden group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorMap[color]} group-hover:scale-105 transition`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};
