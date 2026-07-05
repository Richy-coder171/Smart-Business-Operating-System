import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../api/client";
import { MetricCard } from "../components/dashboard/MetricCard";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { formatDate, formatINR } from "../utils/format";

const pieColors = ["#2563eb", "#0f9f6e", "#d97706", "#e45757"];

export function DashboardPage() {
  const { data, loading, error, retry } = useFetch(async () => {
    const response = await api.get("/dashboard");
    return response.data;
  }, []);

  if (loading) return <LoadingState label="Loading dashboard" />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  const summary = data.summary;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live balances, collections, follow-ups, and ledger movement."
        action={
          <Link to="/customers/new" className="btn-primary">
            Add Customer
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Customers" value={summary.totalCustomers} />
        <MetricCard label="Outstanding" value={formatINR(summary.totalOutstanding)} tone="red" />
        <MetricCard label="Today Collected" value={formatINR(summary.todayCollections)} tone="green" />
        <MetricCard label="Overdue" value={summary.overdueCustomers} tone="amber" />
        <MetricCard label="Follow-ups" value={summary.pendingFollowUps} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="panel xl:col-span-2">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly movement</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergeMonthly(data.monthlyCredit, data.monthlyCollections)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatINR(value)} />
                <Bar dataKey="credit" fill="#2563eb" name="Credit" />
                <Bar dataKey="collections" fill="#0f9f6e" name="Collections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Customer distribution</h2>
          {data.customerDistribution.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No customers yet" description="Create customers to see distribution." />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.customerDistribution} dataKey="count" nameKey="status" outerRadius={90} label>
                    {data.customerDistribution.map((entry, index) => (
                      <Cell key={entry.status} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Due trend</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatINR(value)} />
                <Line type="monotone" dataKey="amount" stroke="#e45757" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Top debtors</h2>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {data.topDebtors.length === 0 ? (
              <EmptyState title="No pending dues" description="Outstanding balances will appear here." />
            ) : (
              data.topDebtors.map((customer) => (
                <Link
                  key={customer._id}
                  to={`/customers/${customer._id}`}
                  className="flex items-center justify-between py-3 text-sm hover:text-brand-600"
                >
                  <span>
                    <span className="font-medium">{customer.name}</span>
                    <span className="ml-2 text-slate-500">{formatDate(customer.nextFollowUpDate)}</span>
                  </span>
                  <span className="font-semibold">{formatINR(customer.totalDue)}</span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="panel mt-6">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">Recent transactions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Type</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.recentTransactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td className="py-3">{formatDate(transaction.date)}</td>
                  <td className="py-3">{transaction.customerId?.name || "Customer"}</td>
                  <td className="py-3 capitalize">{transaction.type}</td>
                  <td className="py-3 text-right font-medium">{formatINR(transaction.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function mergeMonthly(credit, collections) {
  const map = new Map();
  for (const item of credit) {
    map.set(item.month, { month: item.month, credit: item.total, collections: 0 });
  }
  for (const item of collections) {
    const current = map.get(item.month) || { month: item.month, credit: 0, collections: 0 };
    current.collections = item.total;
    map.set(item.month, current);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}
