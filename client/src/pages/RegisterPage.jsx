import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { statusText } from "../utils/format";

const schema = z.object({
  name: z.string().min(2),
  businessName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  preferredLanguage: z.enum(["en", "hi"]),
  password: z.string().min(8)
});

export function RegisterPage() {
  const { user, loading, register: registerUser } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { preferredLanguage: "hi" }
  });

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values) {
    try {
      await registerUser(values);
      push("Account created");
      navigate("/", { replace: true });
    } catch (error) {
      push(statusText(error), "error");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <section className="w-full max-w-xl panel">
        <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">Create owner account</h1>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" className="field" {...register("name")} />
            {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="businessName">
              Business name
            </label>
            <input id="businessName" className="field" {...register("businessName")} />
            {errors.businessName ? <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className="field" {...register("email")} />
            {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone
            </label>
            <input id="phone" className="field" {...register("phone")} />
          </div>
          <div>
            <label className="label" htmlFor="preferredLanguage">
              Preferred language
            </label>
            <select id="preferredLanguage" className="field" {...register("preferredLanguage")}>
              <option value="hi">Hindi / Hinglish</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" type="password" className="field" {...register("password")} />
            {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
          </div>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <UserPlus size={18} />
              Register
            </button>
            <Link to="/login" className="btn-secondary">
              Back to login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
