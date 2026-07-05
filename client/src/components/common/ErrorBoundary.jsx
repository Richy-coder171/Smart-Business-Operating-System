import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <section className="max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              The app recovered instead of showing a blank page. Refresh to try again.
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
