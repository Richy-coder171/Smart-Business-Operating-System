import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatINR } from "../../utils/format";

const schema = z.object({
  customerId: z.string().min(1, "Customer must be selected"),
  type: z.enum(["credit", "payment"], { errorMap: () => ({ message: "Transaction type must be credit or payment." }) }),
  amount: z
    .union([z.string().trim().min(1, "Amount is required"), z.number()])
    .pipe(z.coerce.number().positive("Amount must be positive")),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional()
});

export function TransactionForm({ customers, defaultCustomerId = "", defaultType = "credit", onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: defaultCustomerId,
      type: defaultType,
      amount: "",
      description: "",
      paymentMethod: "",
      referenceNumber: ""
    }
  });
  const type = watch("type");
  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customers.find((customer) => customer._id === selectedCustomerId);

  useEffect(() => {
    reset((current) => ({
      ...current,
      customerId: defaultCustomerId || current.customerId,
      type: defaultType === "payment" ? "payment" : "credit"
    }));
  }, [defaultCustomerId, defaultType, reset]);

  async function submit(values) {
    if (values.type === "payment" && selectedCustomer && Number(values.amount) > Number(selectedCustomer.totalDue || 0)) {
      setError("amount", {
        type: "manual",
        message: `Payment cannot exceed due (${formatINR(selectedCustomer.totalDue)}).`
      });
      return;
    }

    await onSubmit({
      ...values,
      description: values.description || undefined,
      paymentMethod: values.paymentMethod || undefined,
      referenceNumber: values.referenceNumber || undefined
    });
    reset({
      customerId: defaultCustomerId,
      type: values.type,
      amount: "",
      description: "",
      paymentMethod: "",
      referenceNumber: ""
    });
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <div>
        <label className="label" htmlFor="customerId">
          Customer
        </label>
        <select id="customerId" className="field" {...register("customerId")}>
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>
        {errors.customerId ? <p className="mt-1 text-xs text-red-600">{errors.customerId.message}</p> : null}
        {selectedCustomer ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current due: {formatINR(selectedCustomer.totalDue)}</p>
        ) : null}
      </div>
      <div>
        <label className="label" htmlFor="type">
          Type
        </label>
        <select id="type" className="field" {...register("type")}>
          <option value="credit">Credit / udhar</option>
          <option value="payment">Payment</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="amount">
          Amount
        </label>
        <input id="amount" type="number" min="0" step="0.01" className="field" placeholder="Enter amount" {...register("amount")} />
        {errors.amount ? <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="paymentMethod">
          Payment method
        </label>
        <input
          id="paymentMethod"
          className="field"
          placeholder={type === "payment" ? "Cash, UPI, bank" : "Optional"}
          {...register("paymentMethod")}
        />
      </div>
      <div>
        <label className="label" htmlFor="referenceNumber">
          Reference
        </label>
        <input id="referenceNumber" className="field" {...register("referenceNumber")} />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <input id="description" className="field" placeholder="Optional, but useful for ledger review" {...register("description")} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          <Plus size={18} />
          {type === "payment" ? "Record Payment" : "Add Udhar"}
        </button>
      </div>
    </form>
  );
}
