import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";
import { CustomerForm } from "../components/customers/CustomerForm";
import { ErrorState, LoadingState } from "../components/common/States";
import { PageHeader } from "../components/common/PageHeader";
import { useToast } from "../context/ToastContext";
import { statusText } from "../utils/format";

export function AddCustomerPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function submit(values) {
    setSubmitting(true);
    try {
      const response = await api.post("/customers", cleanPayload(values));
      push("Customer created");
      navigate(`/customers/${response.data.customer._id}`);
    } catch (error) {
      push(statusText(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add Customer" description="Create a customer before adding credit or payments." />
      <section className="panel">
        <CustomerForm onSubmit={submit} submitting={submitting} />
      </section>
    </div>
  );
}

export function EditCustomerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data.customer);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submit(values) {
    setSubmitting(true);
    try {
      await api.put(`/customers/${id}`, cleanPayload(values));
      push("Customer updated");
      navigate(`/customers/${id}`);
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
        title="Edit Customer"
        description={customer.name}
        action={
          <Link to={`/customers/${id}`} className="btn-secondary">
            Back
          </Link>
        }
      />
      <section className="panel">
        <CustomerForm initialValues={customer} onSubmit={submit} submitting={submitting} />
      </section>
    </div>
  );
}

function cleanPayload(values) {
  return {
    ...values,
    phone: values.phone || undefined,
    address: values.address || undefined,
    nextFollowUpDate: values.nextFollowUpDate || undefined,
    notes: values.notes || undefined
  };
}
