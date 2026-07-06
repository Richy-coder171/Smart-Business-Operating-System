import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useToast } from "../context/ToastContext";
import { exportLedgerCsv } from "../utils/csv";
import { formatDate, formatINR, statusText } from "../utils/format";

export function LedgerPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState("");
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { push } = useToast();
  const selectedCustomer = customers.find((customer) => customer._id === selected);

  async function loadCustomers() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/customers?status=all&limit=100");
      setCustomers(response.data.customers);
      if (response.data.customers[0] && !selected) {
        setSelected(response.data.customers[0]._id);
      }
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadLedger(customerId) {
    if (!customerId) return;
    setError("");
    try {
      const response = await api.get(`/transactions/customer/${customerId}`);
      setLedger(response.data);
    } catch (err) {
      setError(statusText(err));
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadLedger(selected);
  }, [selected]);

  function exportCsv() {
    const transactions = ledger?.transactions || [];
    if (transactions.length === 0) {
      push("No ledger entries to export yet.", "error");
      return;
    }
    exportLedgerCsv(ledger.customer, transactions);
    push("Ledger CSV exported");
  }

  if (loading) return <LoadingState label="Loading ledger" />;
  if (error) return <ErrorState message={error} onRetry={() => (selected ? loadLedger(selected) : loadCustomers())} />;

  return (
    <div>
      <PageHeader title="Ledger" description="Deterministic running balance per customer." />
      {customers.length === 0 ? (
        <EmptyState title="No customers" description="Add a customer before viewing a ledger." />
      ) : (
        <>
          <section className="panel mb-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="w-full max-w-md">
                <span className="label">Customer</span>
                <select className="field" value={selected} onChange={(event) => setSelected(event.target.value)}>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <Link to={`/customers/${selected}?transaction=credit#transaction-form`} className="btn-secondary">
                  Add Udhar
                </Link>
                <Link to={`/customers/${selected}?transaction=payment#transaction-form`} className="btn-secondary">
                  Record Payment
                </Link>
                <button type="button" className="btn-secondary" onClick={exportCsv} disabled={(ledger?.transactions || []).length === 0}>
                  <Download size={16} />
                  Export Ledger CSV
                </button>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">{ledger?.customer?.name || selectedCustomer?.name || "Customer ledger"}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Running balance updates after each credit or verified payment.</p>
              </div>
              <span className="text-sm font-semibold text-red-600">
                Current due {formatINR(ledger?.customer?.totalDue || 0)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">Running balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(ledger?.transactions || []).map((transaction) => (
                    <LedgerRow key={transaction._id} transaction={transaction} />
                  ))}
                </tbody>
              </table>
              {(ledger?.transactions || []).length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="No ledger entries for this customer"
                    description="Use Add Udhar for new credit, then Record Payment only after money is verified."
                  />
                </div>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LedgerRow({ transaction }) {
  const isCredit = transaction.type === "credit";

  return (
    <tr className={isCredit ? "bg-brand-50/40 dark:bg-brand-600/5" : "bg-emerald-50/50 dark:bg-emerald-600/5"}>
      <td className="py-3">{formatDate(transaction.date)}</td>
      <td className="py-3">{transaction.description || "-"}</td>
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
      <td className={`py-3 text-right font-semibold ${isCredit ? "text-red-600" : "text-emerald-600"}`}>
        {formatINR(transaction.amount)}
      </td>
      <td className="py-3 text-right font-semibold">{formatINR(transaction.runningBalance)}</td>
    </tr>
  );
}
