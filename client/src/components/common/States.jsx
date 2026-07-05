import { RefreshCw } from "lucide-react";

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="grid gap-3">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <Skeleton className="h-28" />
      <Skeleton className="h-20" />
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-5 text-red-950 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
      <p className="text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      ) : null}
    </div>
  );
}
