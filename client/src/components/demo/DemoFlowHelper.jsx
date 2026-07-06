import { ArrowRight, BarChart3, Brain, CheckCircle2, MessageCircle, Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

export function DemoFlowHelper({ customer }) {
  const customerPath = customer?._id ? `/customers/${customer._id}` : "";
  const steps = [
    {
      label: "Add Customer",
      hint: "Create Ramesh",
      to: "/customers/new",
      icon: UserPlus
    },
    {
      label: "Add Udhar",
      hint: "Record Rs 5,000 credit",
      to: customerPath ? `${customerPath}?transaction=credit#transaction-form` : "/transactions",
      icon: Plus
    },
    {
      label: "Generate Reminder",
      hint: "Use Hinglish reminder",
      to: customerPath ? `${customerPath}#reminder` : "/customers",
      icon: MessageCircle
    },
    {
      label: "Analyze Reply",
      hint: "Try Kal payment kar dunga",
      to: customerPath ? `${customerPath}#reply-analysis` : "/customers",
      icon: Brain
    },
    {
      label: "Record Payment",
      hint: "Record Rs 2,000 received",
      to: customerPath ? `${customerPath}?transaction=payment#transaction-form` : "/transactions",
      icon: CheckCircle2
    },
    {
      label: "View Insights",
      hint: "Check updated priorities",
      to: "/insights",
      icon: BarChart3
    }
  ];

  return (
    <section className="panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Demo Flow</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {"Try: Add Ramesh \u2192 \u20b95,000 udhar \u2192 Analyze 'Kal payment kar dunga' \u2192 Record \u20b92,000 payment"}
          </p>
        </div>
        {customer ? (
          <Link to={`${customerPath}#ledger`} className="btn-secondary">
            Open demo customer
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.label}
              to={step.to}
              className="group flex min-h-24 items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-brand-600/40 dark:hover:bg-brand-600/10"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-100">
                <Icon size={18} />
              </span>
              <span>
                <span className="text-xs font-semibold uppercase text-slate-500">Step {index + 1}</span>
                <span className="mt-1 block font-semibold text-slate-950 group-hover:text-brand-700 dark:text-white">
                  {step.label}
                </span>
                <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{step.hint}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
