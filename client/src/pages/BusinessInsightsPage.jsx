import { Brain, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { formatINR, statusText } from "../utils/format";

export function BusinessInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [meta, setMeta] = useState({ generatedBy: "", demoAiMode: false, gemini: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/ai/business-insights", {});
      setInsights(response.data.insights);
      setMeta({
        generatedBy: response.data.generatedBy,
        demoAiMode: response.data.demoAiMode,
        gemini: response.data.gemini
      });
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
      <div className="grid gap-6">
        {["high", "medium", "low"].map((priority) => {
          const group = insights.filter((insight) => insight.priority === priority);
          if (group.length === 0) return null;
          return (
            <section key={priority}>
              <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">{priority} priority</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {group.map((insight) => (
                  <InsightCard key={`${insight.title}-${insight.supportingMetric.name}`} insight={insight} meta={meta} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function InsightCard({ insight, meta }) {
  const isDemoInsight = meta.demoAiMode && meta.generatedBy === "template" && meta.gemini !== "configured";

  return (
    <section className="panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          {isDemoInsight ? (
            <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-600/20 dark:text-amber-100">
              Demo AI insight
            </span>
          ) : null}
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">{insight.title}</h3>
        </div>
        <span className="rounded-md bg-brand-50 p-2 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100">
          <Brain size={20} />
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{insight.description}</p>
      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
        <span className="text-slate-500">Supporting metric</span>
        <div className="mt-1 flex items-center justify-between gap-4">
          <span>{insight.supportingMetric.name}</span>
          <span className="font-semibold">{formatMetric(insight.supportingMetric)}</span>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-950">
        <span className="text-slate-500">Suggested action</span>
        <p className="mt-1 font-medium">{insight.suggestedAction}</p>
      </div>
      {insight.relatedCustomerId ? (
        <Link className="btn-secondary mt-4" to={`/customers/${insight.relatedCustomerId}`}>
          Open related customer
        </Link>
      ) : null}
    </section>
  );
}

function formatMetric(metric) {
  return metric.name.toLowerCase().includes("due") ||
    metric.name.toLowerCase().includes("outstanding") ||
    metric.name.toLowerCase().includes("collected")
    ? formatINR(metric.value)
    : metric.value;
}
