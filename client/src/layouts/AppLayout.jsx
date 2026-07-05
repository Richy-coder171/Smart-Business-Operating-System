import {
  BarChart3,
  Bot,
  Brain,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/ledger", label: "Ledger", icon: BarChart3 },
  { to: "/transactions", label: "Transactions", icon: CircleDollarSign },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/insights", label: "Insights", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings }
];

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { push } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    push("Logged out");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">S</div>
          <div>
            <p className="font-semibold text-slate-950 dark:text-white">SMEOS</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.businessName || "Business OS"}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-100"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="mb-3 rounded-md bg-slate-50 p-3 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
          <p className="break-all text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            Theme
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">
        <Sidebar />
      </div>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-sm font-bold text-white">S</div>
          <span className="font-semibold">SMEOS</span>
        </div>
        <button
          type="button"
          aria-label="Open navigation"
          className="rounded-md border border-slate-200 p-2 dark:border-slate-700"
          onClick={() => setOpen(true)}
        >
          <Menu size={20} />
        </button>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden">
          <div className="h-full w-72 bg-white dark:bg-slate-950">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Close navigation"
                className="rounded-md p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
