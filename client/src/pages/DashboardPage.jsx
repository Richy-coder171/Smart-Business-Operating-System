import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
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
import { DemoFlowHelper } from "../components/demo/DemoFlowHelper";
import { EmptyState, ErrorState, Skeleton } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useFetch } from "../hooks/useFetch";
import { formatDate, formatDateTime, formatINR } from "../utils/format";

const pieColors = ["#2563eb", "#0f9f6e", "#d97706", "#e45757"];

export function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(null);
  const { data, loading, error, retry } = useFetch(async () => {
    const response = await api.get("/dashboard");
    setLastUpdated(new Date());
    return response.data;
  }, []);

  useEffect(() => {
    function handleMutation() {
      retry();
    }

    window.addEventListener("smeos:data-mutated", handleMutation);
    return () => window.removeEventListener("smeos:data-mutated", handleMutation);
  }, [retry]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  const summary = data.summary;
  const movement = mergeMonthly(data.monthlyCredit, data.monthlyCollections);
  const demoCustomer = data.topDebtors.find((customer) => customer.name?.toLowerCase() === "ramesh") || data.topDebtors[0];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live balances, collections, follow-ups, and ledger movement."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={retry}>
              <RefreshCw size={18} />
              Refresh
            </button>
            <Link to="/customers/new" className="btn-primary">
              Add Customer
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-md border border-brand-100 bg-brand-50 p-4 text-sm text-brand-950 dark:border-brand-600/30 dark:bg-brand-600/10 dark:text-brand-100 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          {"Try: Add Ramesh \u2192 \u20b95,000 udhar \u2192 Analyze 'Kal payment kar dunga' \u2192 Record \u20b92,000 payment"}
        </p>
        <span className="text-xs text-brand-700 dark:text-brand-100">
          Last updated: {formatDateTime(lastUpdated)}
        </span>
      </div>

      <DemoFlowHelper customer={demoCustomer} />

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total Customers" value={summary.totalCustomers} />
        <MetricCard label="Outstanding Amount" value={formatINR(summary.totalOutstanding)} tone="red" />
        <MetricCard label="Today Collected" value={formatINR(summary.todayCollections)} tone="green" />
        <MetricCard label="Overdue Customers" value={summary.overdueCustomers} tone="amber" />
        <MetricCard label="Pending Follow-ups" value={summary.pendingFollowUps} tone="blue" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Credit vs Payment</h2>
          {movement.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No monthly movement" description="Credit and payment trends appear after transactions." />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Bar dataKey="credit" fill="#2563eb" name="Monthly Credit" />
                  <Bar dataKey="collections" fill="#0f9f6e" name="Monthly Collections" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly Collections</h2>
          {data.monthlyCollections.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No collections yet" description="Recorded payments will create a collection chart." />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyCollections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Line type="monotone" dataKey="total" stroke="#0f9f6e" strokeWidth={2} name="Collections" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Monthly Credit</h2>
          {data.monthlyCredit.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No credit yet" description="Udhar entries will create a credit chart." />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyCredit}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Bar dataKey="total" fill="#2563eb" name="Credit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Top Debtors</h2>
          {data.topDebtors.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No pending dues" description="Outstanding balances will appear here." />
            </div>
          ) : (
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topDebtors.map((customer) => ({ ...customer, chartName: customer.name }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="chartName" width={90} />
                  <Tooltip formatter={(value) => formatINR(value)} />
                  <Bar dataKey="totalDue" fill="#e45757" name="Outstanding" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
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

        <section className="panel">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">Due trend</h2>
          {data.dueTrend.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No due trend yet" description="Customer balances will appear after ledger activity." />
            </div>
          ) : (
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
          )}
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
          {data.recentTransactions.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No recent transactions" description="Credits and verified payments will appear here." />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <Skeleton className="h-16" />
      <Skeleton className="h-32" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
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
