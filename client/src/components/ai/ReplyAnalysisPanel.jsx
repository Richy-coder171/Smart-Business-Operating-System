import { Brain } from "lucide-react";
import { useState } from "react";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatIntent, statusText } from "../../utils/format";

export function ReplyAnalysisPanel({ customer, onAnalyzed }) {
  const [message, setMessage] = useState("Kal payment kar dunga");
  const [analysis, setAnalysis] = useState(null);
  const [originalReply, setOriginalReply] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function analyze() {
    if (!message.trim()) {
      push("Reply message cannot be empty.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/ai/analyze-reply", {
        customerId: customer._id,
        message
      });
      setAnalysis({
        ...response.data.analysis,
        nextFollowUpUpdated: response.data.nextFollowUpUpdated
      });
      setOriginalReply(message.trim());
      push("Reply analyzed");
      onAnalyzed?.();
    } catch (error) {
      push(statusText(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="reply-analysis" className="panel scroll-mt-24">
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">Reply analysis</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Review customer intent before taking action. SMEOS never auto-records a payment from reply text.
      </p>
      <label className="mt-4 block">
        <span className="label">Customer reply</span>
        <textarea className="field min-h-24" value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <button type="button" className="btn-primary mt-3" onClick={analyze} disabled={loading || !message.trim()}>
        <Brain size={18} />
        Analyze reply
      </button>
      {analysis ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4">
            <span className="text-slate-500">Original reply</span>
            <p className="mt-1 rounded-md bg-white p-3 font-medium text-slate-950 dark:bg-slate-900 dark:text-white">{originalReply}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultItem label="Detected intent" value={formatIntent(analysis.intent)} />
            <ResultItem label="Confidence" value={`${Math.round(analysis.confidence * 100)}%`} />
            <ResultItem
              label="Promised payment date"
              value={analysis.promisedPaymentDate ? formatDate(analysis.promisedPaymentDate) : "Not detected"}
            />
            <ResultItem
              label="Next follow-up updated"
              value={analysis.nextFollowUpUpdated ? "Yes" : "No"}
            />
          </div>
          <div className="mt-4 rounded-md bg-white p-3 dark:bg-slate-900">
            <span className="text-slate-500">Suggested action</span>
            <p className="mt-1 font-medium">{analysis.suggestedAction}</p>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{analysis.summary}</p>
          {analysis.intent === "payment_completed" ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              Customer says payment is done. Please verify before recording payment.
            </p>
          ) : null}
          {analysis.requiresManualReview ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
              Confidence is low. Review this reply manually before changing follow-up plans.
            </p>
          ) : null}
          <div className="sr-only">
            <p>
              <span className="text-slate-500">Intent</span>
              <span className="block font-semibold">{analysis.intent}</span>
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ResultItem({ label, value }) {
  return (
    <p className="rounded-md bg-white p-3 dark:bg-slate-900">
      <span className="text-slate-500">{label}</span>
      <span className="mt-1 block font-semibold text-slate-950 dark:text-white">{value}</span>
    </p>
  );
}
