import { Bot, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { ErrorState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { statusText } from "../utils/format";

const examples = [
  "Who owes me the most?",
  "How much did I collect today?",
  "Which customers owe more than Rs 10,000?",
  "Who promised to pay this week?",
  "What should I focus on today?"
];

export function AssistantPage() {
  const [question, setQuestion] = useState(examples[0]);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setAnswer(null);
    try {
      const response = await api.post("/ai/assistant", { question });
      setAnswer(response.data);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="AI Assistant" description="Safe business questions backed by predefined ledger queries." />
      <section className="panel">
        <form onSubmit={ask} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Business question</span>
            <input
              className="field"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about collections, dues, promises, or follow-ups"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={18} />
            Ask
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button key={example} type="button" className="btn-secondary py-1 text-xs" onClick={() => setQuestion(example)}>
              {example}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="mt-5"><ErrorState message={error} /></div> : null}

      {answer ? (
        <section className="panel mt-5">
          <div className="flex items-start gap-3">
            <span className="rounded-md bg-brand-50 p-2 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100">
              <Bot size={20} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">{answer.answer}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{answer.suggestedAction}</p>
            </div>
          </div>
          {answer.customerLinks?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {answer.customerLinks.map((link) => (
                <Link key={link.id} className="btn-secondary py-1 text-xs" to={link.path}>
                  {link.name}
                </Link>
              ))}
            </div>
          ) : null}
          {answer.supportingData ? (
            <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(answer.supportingData, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
