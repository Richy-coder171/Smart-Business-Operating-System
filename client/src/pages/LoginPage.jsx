import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { statusText } from "../utils/format";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export function LoginPage() {
  const { user, loading, authError, login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "demo@smeos.local",
      password: "Demo@12345"
    }
  });

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values) {
    try {
      await login(values);
      push("Welcome back");
      navigate(from, { replace: true });
    } catch (error) {
      push(statusText(error), "error");
    }
  }

  function fillDemo() {
    setValue("email", "demo@smeos.local");
    setValue("password", "Demo@12345");
  }

  return (
    <main className="grid min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[1fr_480px]">
      <section className="hidden flex-col justify-between rounded-md bg-slate-950 p-10 text-white lg:flex">
        <div>
          <div className="grid h-12 w-12 place-items-center rounded-md bg-brand-600 text-lg font-bold">S</div>
          <h1 className="mt-10 max-w-xl text-5xl font-semibold tracking-normal">SMEOS</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Smart Business Operating System for customer credit, payments, reminders, and business insights.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
          <span>Ledger</span>
          <span>Reminders</span>
          <span>Insights</span>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 lg:hidden">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-brand-600 font-bold text-white">S</div>
          <h1 className="mt-4 text-3xl font-semibold">SMEOS</h1>
        </div>
        <div className="panel">
          <h2 className="text-2xl font-semibold">Login</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use the demo owner or your registered account.</p>
          {authError ? (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {authError}
            </p>
          ) : null}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input id="email" className="field" type="email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="field"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password.message}</p> : null}
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              <LogIn size={18} />
              Login
            </button>
          </form>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn-secondary" onClick={fillDemo}>
              Demo account
            </button>
            <Link to="/register" className="btn-secondary">
              Register
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
