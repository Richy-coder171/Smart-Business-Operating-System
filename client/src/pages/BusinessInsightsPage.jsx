import { Brain, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { formatINR, statusText } from "../utils/format";

export function BusinessInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/ai/business-insights", {});
      setInsights(response.data.insights);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        title="Business Insights"
        description="Backend-calculated metrics explained as actionable priorities."
        action={
          <button type="button" className="btn-secondary" onClick={load}>
            <RefreshCw size={18} />
            Refresh
          </button>
        }
      />
      {loading ? <LoadingState label="Loading insights" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && insights.length === 0 ? (
        <EmptyState title="No insights yet" description="Add customers and ledger entries to generate real insights." />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <section key={`${insight.title}-${insight.supportingMetric.name}`} className="panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-slate-500">{insight.priority} priority</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{insight.title}</h2>
              </div>
              <span className="rounded-md bg-brand-50 p-2 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100">
                <Brain size={20} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>
            <p className="mt-3 text-sm font-medium">{insight.suggestedAction}</p>
            <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
              <span>{insight.supportingMetric.name}</span>
              <span className="font-semibold">{formatMetric(insight.supportingMetric)}</span>
            </div>
            {insight.relatedCustomerId ? (
              <Link className="btn-secondary mt-4" to={`/customers/${insight.relatedCustomerId}`}>
                Open customer
              </Link>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function formatMetric(metric) {
  return metric.name.toLowerCase().includes("due") ||
    metric.name.toLowerCase().includes("outstanding") ||
    metric.name.toLowerCase().includes("collected")
    ? formatINR(metric.value)
    : metric.value;
}
