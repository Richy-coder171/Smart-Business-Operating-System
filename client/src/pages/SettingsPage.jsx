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
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Business</dt>
              <dd className="font-medium">{user?.businessName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all font-medium">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Language</dt>
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
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Status</dt>
                <dd className="mt-1 font-semibold">{health.status}</dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
                <dt className="text-slate-500">Database</dt>
                <dd className="mt-1 font-semibold">{health.database}</dd>
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
