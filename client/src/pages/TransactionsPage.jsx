import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { TransactionForm } from "../components/ledger/TransactionForm";
import { useToast } from "../context/ToastContext";
import { formatDate, formatINR, statusText } from "../utils/format";

export function TransactionsPage() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { push } = useToast();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [customerResponse, transactionResponse] = await Promise.all([
        api.get("/customers?status=active&limit=100"),
        api.get("/transactions?limit=100")
      ]);
      setCustomers(customerResponse.data.customers);
      setTransactions(transactionResponse.data.transactions);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTransaction(values) {
    setSubmitting(true);
    try {
      await api.post("/transactions", values);
      push("Transaction recorded");
      await load();
    } catch (err) {
      push(statusText(err), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteTransaction(transaction) {
    const confirmed = window.confirm("Delete this transaction and recalculate the customer balance?");
    if (!confirmed) return;
    try {
      await api.delete(`/transactions/${transaction._id}`);
      push("Transaction deleted");
      await load();
    } catch (err) {
      push(statusText(err), "error");
    }
  }

  if (loading) return <LoadingState label="Loading transactions" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Transactions" description="Add credits and verified payments. Balances are calculated on the backend." />
      <section className="panel">
        <TransactionForm customers={customers} onSubmit={addTransaction} submitting={submitting} />
      </section>

      <section className="panel mt-6">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent transactions</h2>
        {transactions.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No transactions" description="Record a credit or payment to build the ledger." />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="py-3">{formatDate(transaction.date)}</td>
                    <td className="py-3">{transaction.customerId?.name || "Customer"}</td>
                    <td className="py-3 capitalize">{transaction.type}</td>
                    <td className="py-3 text-right font-semibold">{formatINR(transaction.amount)}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="btn-secondary px-3"
                        onClick={() => deleteTransaction(transaction)}
                        title="Delete transaction"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
