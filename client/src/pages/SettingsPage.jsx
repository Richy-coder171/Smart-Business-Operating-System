import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/client";
import { ErrorState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { statusText } from "../utils/format";

export function SettingsPage() {
  const { user, authError, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const apiBaseUrl = api.defaults.baseURL || "http://localhost:5000/api";

  async function loadHealth() {
    setError("");
    try {
      const response = await api.get("/health");
      setHealth(response.data);
    } catch (err) {
      if (err.response?.data) {
        setHealth(err.response.data);
      } else {
        setError(statusText(err));
      }
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div>
      <PageHeader title="Settings" description="Owner profile, theme, and backend health." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <h2 className="text-base font-semibold">Owner</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Business owner name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Business name</dt>
              <dd className="font-medium">{user?.businessName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all font-medium">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Preferred language</dt>
              <dd className="font-medium">{user?.preferredLanguage}</dd>
            </div>
          </dl>
          {authError ? <div className="mt-4"><ErrorState message={authError} /></div> : null}
          <button type="button" className="btn-secondary mt-4" onClick={refreshUser}>
            <RefreshCw size={18} />
            Refresh profile
          </button>
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold">Preferences</h2>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
            <span className="text-sm">Theme</span>
            <button type="button" className="btn-secondary" onClick={toggleTheme}>
              {theme === "dark" ? "Dark" : "Light"}
            </button>
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <StatusRow
              label="Demo AI mode"
              value={health ? (health.demoAiMode ? "Enabled" : "Disabled") : "Unknown"}
              tone={health?.demoAiMode ? "amber" : "slate"}
            />
            <StatusRow label="Backend API URL" value={apiBaseUrl} />
            <StatusRow label="Gemini status" value={health?.gemini || "Unknown"} tone={health?.gemini === "configured" ? "green" : "amber"} />
          </dl>
        </section>

        <section className="panel lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Backend health</h2>
            <button type="button" className="btn-secondary" onClick={loadHealth}>
              <RefreshCw size={18} />
              Check
            </button>
          </div>
          {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
          {health ? (
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-semibold">{health.status}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Database health status</dt>
                <dd className="mt-1 font-semibold">{health.database}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Gemini status</dt>
                <dd className="mt-1 font-semibold">{health.gemini}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Timestamp</dt>
                <dd className="mt-1 font-semibold">{health.timestamp}</dd>
              </div>
            </dl>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function StatusRow({ label, value, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-100",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-600/20 dark:text-amber-100",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
  };

  return (
    <div className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 dark:bg-slate-950">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`w-fit max-w-full break-all rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{value}</dd>
    </div>
  );
}
