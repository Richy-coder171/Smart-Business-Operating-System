import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
                : "border-emerald-200 bg-white text-ink dark:border-emerald-900 dark:bg-slate-900 dark:text-slate-100"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
