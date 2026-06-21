import React from "react";

interface HeaderCardProps {
  label: string;
  value: string | number;
  note?: string;
  trend?: "up" | "down" | "flat";
}

export const HeaderCard: React.FC<HeaderCardProps> = ({ label, value, note, trend }) => {
  const trendColor =
    trend === "up"
      ? "bg-emerald-50 text-emerald-600"
      : trend === "down"
      ? "bg-rose-50 text-rose-600"
      : "bg-indigo-50 text-indigo-600";
  const trendIcon = trend === "up" ? "↗" : trend === "down" ? "↘" : "•";

  return (
    <div className="rounded-3xl border border-slate-200/50 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {note && <p className="text-[10px] text-slate-400 mt-0.5">{note}</p>}
        {trend && (
          <div className={`grid h-10 w-10 place-items-center rounded-xl text-sm ${trendColor}`}>
            {trendIcon}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderCard;
