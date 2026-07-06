import { Download, Edit, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import api from "../api/client";
import { ReminderPanel } from "../components/ai/ReminderPanel";
import { ReplyAnalysisPanel } from "../components/ai/ReplyAnalysisPanel";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { TransactionForm } from "../components/ledger/TransactionForm";
import { useToast } from "../context/ToastContext";
import { exportLedgerCsv } from "../utils/csv";
import { formatDate, formatINR, formatIntent, statusText } from "../utils/format";

export function CustomerDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { push } = useToast();
  const [customer, setCustomer] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const requestedType = new URLSearchParams(location.search).get("transaction") === "payment" ? "payment" : "credit";

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
      const message = statusText(err);
      push(
        message.toLowerCase().includes("payment cannot exceed")
          ? `Payment cannot exceed current due (${formatINR(customer?.totalDue)}). Verify the amount and try again.`
          : message,
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function exportCsv() {
    if (ledger.length === 0) {
      push("No ledger entries to export yet.", "error");
      return;
    }
    exportLedgerCsv(customer, ledger);
    push("Ledger CSV exported");
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
            <button type="button" className="btn-secondary" onClick={exportCsv} disabled={ledger.length === 0}>
              <Download size={18} />
              Export Ledger CSV
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

      <section className="panel mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Customer details</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The key facts a shop owner checks before follow-up.</p>
          </div>
          <span
            className={`inline-flex w-fit items-center rounded-md px-3 py-1 text-xs font-semibold uppercase ${
              customer.status === "active"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-100"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {customer.status}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Customer name" value={customer.name} />
          <Detail label="Phone number" value={customer.phone || "Not set"} />
          <Detail label="Address" value={customer.address || "Not set"} />
          <Detail label="Status" value={customer.status} />
          <Detail label="Current due" value={formatINR(customer.totalDue)} emphasis="red" />
          <Detail label="Total paid" value={formatINR(customer.totalPaid)} emphasis="green" />
          <Detail label="Last payment date" value={formatDate(customer.lastPaymentDate)} />
          <Detail label="Next follow-up date" value={formatDate(customer.nextFollowUpDate)} />
          <Detail label="Last reply intent" value={formatIntent(customer.lastReplyIntent)} />
        </dl>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section id="transaction-form" className="panel scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Add udhar or record payment</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Payments are recorded only after the owner verifies money was received.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/customers/${customer._id}?transaction=credit#transaction-form`} className="btn-secondary">
                Add Udhar
              </Link>
              <Link to={`/customers/${customer._id}?transaction=payment#transaction-form`} className="btn-secondary">
                Record Payment
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <TransactionForm
              customers={[customer]}
              defaultCustomerId={customer._id}
              defaultType={requestedType}
              onSubmit={addTransaction}
              submitting={submitting}
            />
          </div>
        </section>
        <ReminderPanel customer={customer} />
        <ReplyAnalysisPanel customer={customer} onAnalyzed={load} />
        <section id="ledger" className="panel scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Ledger</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Credit and payment entries keep a deterministic running balance.</p>
            </div>
            <button type="button" className="btn-secondary" onClick={exportCsv} disabled={ledger.length === 0}>
              <Download size={16} />
              Export Ledger CSV
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Payment method</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledger.map((transaction) => {
                  const isCredit = transaction.type === "credit";
                  return (
                    <tr
                      key={transaction._id}
                      className={isCredit ? "bg-brand-50/40 dark:bg-brand-600/5" : "bg-emerald-50/50 dark:bg-emerald-600/5"}
                    >
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                            isCredit
                              ? "bg-brand-100 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/20 dark:text-emerald-100"
                          }`}
                        >
                          {isCredit ? "Credit / udhar" : "Payment"}
                        </span>
                      </td>
                      <td className="py-3">{transaction.description || "-"}</td>
                      <td className="py-3">{transaction.paymentMethod || "-"}</td>
                      <td className={`py-3 text-right font-semibold ${isCredit ? "text-red-600" : "text-emerald-600"}`}>
                        {formatINR(transaction.amount)}
                      </td>
                      <td className="py-3 text-right font-semibold">{formatINR(transaction.runningBalance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ledger.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No ledger entries yet"
                  description="Add udhar first, then record verified payments to see the running balance."
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value, emphasis }) {
  const colors = {
    red: "text-red-600",
    green: "text-emerald-600"
  };

  return (
    <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-950">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`mt-1 font-semibold ${colors[emphasis] || "text-slate-950 dark:text-white"}`}>{value}</dd>
    </div>
  );
}
