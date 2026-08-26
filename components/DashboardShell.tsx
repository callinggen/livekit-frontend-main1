"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Crown,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  Phone,
  PhoneCall,
  Sun,
  UserCircle2,
  X,
  Zap,
  CreditCard,
  ArrowUpCircle,
  Settings,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";


const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Call Manager", icon: PhoneCall, href: "/call-manager" },
  { label: "Call Logs", icon: ClipboardList, href: "/call-logs" },
  { label: "Campaign", icon: Megaphone, href: "/campaign" },
  { label: "Email Marketing", icon: Mail, href: "/email-campaign" },
  { label: "Report", icon: FileText, href: "/report" },
  { label: "Buy Credits", icon: CreditCard, href: "/pricing" },
];


export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on wide screens on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Force first-login password change redirect
  useEffect(() => {
    if (user?.isFirstLogin) {
      router.replace("/change-password");
    }
  }, [user, router]);

  // Theme toggle — BUG-022/027: persist to localStorage
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Read saved preference (anti-flash script in layout.tsx already set the class)
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || (saved === null && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  // Lock scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r
          bg-white dark:bg-zinc-900 dark:border-zinc-800 border-zinc-200
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight">CallingGen</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4 px-3">
          {/* Main Navigation */}
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Navigation
          </p>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${active
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Pro tip banner */}
          {/* <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Demo Mode
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
              Using dummy data. All metrics are for demonstration only.
            </p>
          </div> */}
        </div>

        {/* User section at bottom */}
        <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <div
            onClick={() => router.push("/profile")}
            className="mb-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            title="View Profile Overview"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                <UserCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{user?.name ?? "Admin User"}</p>
                <p className="truncate text-[10px] text-zinc-500">{user?.email ?? "admin@callinggen.com"}</p>
              </div>
            </div>
            <button 
              type="button" 
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
              title="Settings"
            >
              <Settings className="h-4 w-4 shrink-0" />
            </button>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Top Navbar ── */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {/* Hamburger — 3 lines toggle */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white lg:hidden"
              aria-label="Toggle sidebar"
              id="sidebar-toggle"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Overview
              </p>
              <h1 className="text-sm font-semibold leading-tight">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Subscription Plan badge */}
            <div
              className="hidden items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 dark:border-violet-800/50 dark:bg-violet-950/40 sm:flex"
              title="Current Plan"
            >
              <Crown className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">{user?.subscription_plan || "Starter"} Plan</span>
            </div>

            {/* Credits Display */}
            {credits !== null && (
              <div 
                title="Current Credits"
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 sm:flex transition ${credits < 100
                  ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/40"
                  : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
              >
                <CreditCard className={`h-3.5 w-3.5 ${credits < 100
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-600 dark:text-zinc-400"
                  }`} />
                <span className={`text-xs font-semibold ${credits < 100
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-700 dark:text-zinc-300"
                  }`}>
                  {credits}
                </span>
              </div>
            )}

            {/* Top-Up Credits Button */}
            <button
              onClick={() => router.push("/pricing")}
              className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-[0.98] sm:flex"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Top-Up Credits
            </button>


            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white"
              aria-label="Toggle theme"
              id="theme-toggle-dashboard"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User avatar pill */}
            <div 
              onClick={() => router.push("/profile")}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/80"
              title="View Profile Overview"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500">
                <span className="text-[10px] font-bold text-white">
                  {(user?.name ?? "A")[0].toUpperCase()}
                </span>
              </div>
              <span className="hidden text-xs font-medium sm:block">
                {user?.name ?? "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
