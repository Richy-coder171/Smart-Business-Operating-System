import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  customerId: z.string().min(1),
  type: z.enum(["credit", "payment"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional()
});

export function TransactionForm({ customers, defaultCustomerId = "", onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: defaultCustomerId,
      type: "credit",
      amount: "",
      description: "",
      paymentMethod: "",
      referenceNumber: ""
    }
  });
  const type = watch("type");

  useEffect(() => {
    reset((current) => ({ ...current, customerId: defaultCustomerId || current.customerId }));
  }, [defaultCustomerId, reset]);

  async function submit(values) {
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
        <input id="amount" type="number" min="0" step="0.01" className="field" {...register("amount")} />
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
        <input id="description" className="field" {...register("description")} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          <Plus size={18} />
          Add transaction
        </button>
      </div>
    </form>
  );
}
