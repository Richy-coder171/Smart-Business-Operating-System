import { Edit, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client";
import { ReminderPanel } from "../components/ai/ReminderPanel";
import { ReplyAnalysisPanel } from "../components/ai/ReplyAnalysisPanel";
import { ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { TransactionForm } from "../components/ledger/TransactionForm";
import { useToast } from "../context/ToastContext";
import { formatDate, formatINR, statusText } from "../utils/format";

export function CustomerDetailsPage() {
  const { id } = useParams();
  const { push } = useToast();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [customerResponse, ledgerResponse] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/transactions/customer/${id}`)
      ]);
      setCustomer(customerResponse.data.customer);
      setLedger(ledgerResponse.data.transactions);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addTransaction(values) {
    setSubmitting(true);
    try {
      const response = await api.post("/transactions", values);
      setCustomer(response.data.customer);
      push("Transaction recorded");
      await load();
    } catch (err) {
      push(statusText(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState label="Loading customer" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.phone || "No phone"} | ${customer.status}`}
        action={
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={load}>
              <RefreshCw size={18} />
              Refresh
            </button>
            <Link to={`/customers/${customer._id}/edit`} className="btn-secondary">
              <Edit size={18} />
              Edit
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel">
          <p className="text-sm text-slate-500">Current due</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{formatINR(customer.totalDue)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-slate-500">Total paid</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatINR(customer.totalPaid)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-slate-500">Credit limit</p>
          <p className="mt-2 text-2xl font-semibold">{formatINR(customer.creditLimit)}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-slate-500">Next follow-up</p>
          <p className="mt-2 text-lg font-semibold">{formatDate(customer.nextFollowUpDate)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Add credit or payment</h2>
          <div className="mt-4">
            <TransactionForm
              customers={[customer]}
              defaultCustomerId={customer._id}
              onSubmit={addTransaction}
              submitting={submitting}
            />
          </div>
        </section>
        <ReminderPanel customer={customer} />
        <ReplyAnalysisPanel customer={customer} onAnalyzed={load} />
        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Ledger</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledger.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="py-3">{formatDate(transaction.date)}</td>
                    <td className="py-3 capitalize">{transaction.type}</td>
                    <td className="py-3 text-right">{formatINR(transaction.amount)}</td>
                    <td className="py-3 text-right font-semibold">{formatINR(transaction.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ledger.length === 0 ? <p className="py-4 text-sm text-slate-500">No transactions yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
