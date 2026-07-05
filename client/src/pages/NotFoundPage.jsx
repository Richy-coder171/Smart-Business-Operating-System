import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="panel max-w-md text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The requested SMEOS page does not exist.</p>
        <Link to="/" className="btn-primary mt-5">
          Open dashboard
        </Link>
      </section>
    </main>
  );
}
