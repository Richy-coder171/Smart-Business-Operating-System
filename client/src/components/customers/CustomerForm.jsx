import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine(isReadableIndianPhone, "Enter a valid Indian 10-digit phone number."),
  address: z.string().optional(),
  creditLimit: z.coerce.number().min(0),
  paymentTermsDays: z.coerce.number().min(0).max(365),
  nextFollowUpDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"])
});

export function CustomerForm({ initialValues, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      creditLimit: 0,
      paymentTermsDays: 7,
      nextFollowUpDate: "",
      notes: "",
      status: "active"
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        ...initialValues,
        nextFollowUpDate: initialValues.nextFollowUpDate
          ? new Date(initialValues.nextFollowUpDate).toISOString().slice(0, 10)
          : ""
      });
    }
  }, [initialValues, reset]);

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="label" htmlFor="name">
          Customer name
        </label>
        <input id="name" className="field" {...register("name")} />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="phone">
          Phone
        </label>
        <input id="phone" className="field" {...register("phone")} />
        {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="creditLimit">
          Credit limit
        </label>
        <input id="creditLimit" type="number" min="0" className="field" {...register("creditLimit")} />
      </div>
      <div>
        <label className="label" htmlFor="paymentTermsDays">
          Payment terms days
        </label>
        <input id="paymentTermsDays" type="number" min="0" className="field" {...register("paymentTermsDays")} />
      </div>
      <div>
        <label className="label" htmlFor="nextFollowUpDate">
          Next follow-up
        </label>
        <input id="nextFollowUpDate" type="date" className="field" {...register("nextFollowUpDate")} />
      </div>
      <div>
        <label className="label" htmlFor="status">
          Status
        </label>
        <select id="status" className="field" {...register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="address">
          Address (optional)
        </label>
        <input id="address" className="field" {...register("address")} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" className="field min-h-24" {...register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          <Save size={18} />
          Save customer
        </button>
      </div>
    </form>
  );
}

function isReadableIndianPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.replace(/^0+/, "");
  return local.length === 10 && /^[6-9]/.test(local);
}
