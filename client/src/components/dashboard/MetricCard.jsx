import { ArrowUpRight } from "lucide-react";

export function MetricCard({ label, value, tone = "blue" }) {
  const colors = {
    blue: "bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-100",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-600/20 dark:text-amber-100",
    red: "bg-red-50 text-red-700 dark:bg-red-600/20 dark:text-red-100"
  };

  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`rounded-md p-2 ${colors[tone]}`}>
          <ArrowUpRight size={16} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
