import { useEffect, useState } from "react";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { formatDate, formatINR, statusText } from "../utils/format";

export function LedgerPage() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState("");
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
            <label>
              <span className="label">Customer</span>
              <select className="field max-w-md" value={selected} onChange={(event) => setSelected(event.target.value)}>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">{ledger?.customer?.name || "Customer ledger"}</h2>
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
                    <tr key={transaction._id}>
                      <td className="py-3">{formatDate(transaction.date)}</td>
                      <td className="py-3">{transaction.description || "-"}</td>
                      <td className="py-3 capitalize">{transaction.type}</td>
                      <td className="py-3 text-right">{formatINR(transaction.amount)}</td>
                      <td className="py-3 text-right font-semibold">{formatINR(transaction.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(ledger?.transactions || []).length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No transactions for this customer.</p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
