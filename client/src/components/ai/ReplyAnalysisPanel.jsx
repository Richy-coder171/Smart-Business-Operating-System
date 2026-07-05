import { Brain } from "lucide-react";
import { useState } from "react";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatDate, statusText } from "../../utils/format";

export function ReplyAnalysisPanel({ customer, onAnalyzed }) {
  const [message, setMessage] = useState("Kal payment kar dunga");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function analyze() {
    setLoading(true);
    try {
      const response = await api.post("/ai/analyze-reply", {
        customerId: customer._id,
        message
      });
      setAnalysis(response.data.analysis);
      push("Reply analyzed");
      onAnalyzed?.();
    } catch (error) {
      push(statusText(error), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2 className="text-base font-semibold text-slate-950 dark:text-white">Reply analysis</h2>
      <label className="mt-4 block">
        <span className="label">Customer reply</span>
        <textarea className="field min-h-24" value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <button type="button" className="btn-primary mt-3" onClick={analyze} disabled={loading || !message.trim()}>
        <Brain size={18} />
        Analyze reply
      </button>
      {analysis ? (
        <div className="mt-4 rounded-md border border-slate-200 p-4 text-sm dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <p>
              <span className="text-slate-500">Intent</span>
              <span className="block font-semibold">{analysis.intent}</span>
            </p>
            <p>
              <span className="text-slate-500">Confidence</span>
              <span className="block font-semibold">{Math.round(analysis.confidence * 100)}%</span>
            </p>
            <p>
              <span className="text-slate-500">Promised date</span>
              <span className="block font-semibold">{analysis.promisedPaymentDate || "Not detected"}</span>
            </p>
            <p>
              <span className="text-slate-500">Manual review</span>
              <span className="block font-semibold">{analysis.requiresManualReview ? "Required" : "Not required"}</span>
            </p>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{analysis.summary}</p>
          <p className="mt-2 font-medium">{analysis.suggestedAction}</p>
          {analysis.promisedPaymentDate ? (
            <p className="mt-2 text-xs text-slate-500">Next follow-up updated to {formatDate(analysis.promisedPaymentDate)}.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
