import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { EmptyState, ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useToast } from "../context/ToastContext";
import { formatDate, formatINR, statusText } from "../utils/format";

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [outstanding, setOutstanding] = useState("all");
  const { push } = useToast();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search, status });
      if (outstanding !== "all") params.set("outstanding", outstanding);
      const response = await api.get(`/customers?${params.toString()}`);
      setCustomers(response.data.customers);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [search, status, outstanding]);

  async function removeCustomer(customer) {
    const confirmed = window.confirm(`Remove ${customer.name}? Customers with transactions will be marked inactive.`);
    if (!confirmed) return;
    try {
      const response = await api.delete(`/customers/${customer._id}`);
      push(response.data.message || "Customer updated");
      load();
    } catch (err) {
      push(statusText(err), "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search, filter, and manage customer balances."
        action={
          <Link className="btn-primary" to="/customers/new">
            <Plus size={18} />
            Add customer
          </Link>
        }
      />

      <section className="panel mb-5">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <label className="relative">
            <span className="sr-only">Search customers</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              className="field pl-10"
              placeholder="Search by name or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status filter">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All</option>
          </select>
          <select
            className="field"
            value={outstanding}
            onChange={(event) => setOutstanding(event.target.value)}
            aria-label="Outstanding filter"
          >
            <option value="all">All balances</option>
            <option value="true">Outstanding</option>
            <option value="false">Settled</option>
          </select>
        </div>
      </section>

      {loading ? <LoadingState label="Loading customers" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && customers.length === 0 ? (
        <EmptyState title="No customers found" description="Add a customer or change your filters." />
      ) : null}

      {!loading && !error && customers.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="px-4 py-3">
                      <Link to={`/customers/${customer._id}`} className="font-medium hover:text-brand-600">
                        {customer.name}
                      </Link>
                      <p className="text-xs capitalize text-slate-500">{customer.status}</p>
                    </td>
                    <td className="px-4 py-3">{customer.phone || "-"}</td>
                    <td className="px-4 py-3">{formatDate(customer.nextFollowUpDate)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatINR(customer.totalDue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="btn-secondary px-3" to={`/customers/${customer._id}`} title="View customer">
                          <Eye size={16} />
                        </Link>
                        <Link className="btn-secondary px-3" to={`/customers/${customer._id}/edit`} title="Edit customer">
                          <Edit size={16} />
                        </Link>
                        <button
                          type="button"
                          className="btn-secondary px-3"
                          onClick={() => removeCustomer(customer)}
                          title="Delete or deactivate customer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
