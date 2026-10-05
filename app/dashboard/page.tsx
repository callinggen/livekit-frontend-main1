"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import { ActivityTimeline } from "@/components/shared/dashboard/ActivityTimeline";
import { QuickActionCard } from "@/components/shared/dashboard/QuickActionCard";
import { StatCard } from "@/components/shared/dashboard/StatCard";
import TopUpModal from "@/components/billing/TopUpModal";
import { api } from "@/lib/api";
import {
  Plus,
  FileText,
  PhoneCall,
  CheckCircle2,
  Target,
  PhoneForwarded,
  Coins,
  Bot,
  TrendingUp,
  Activity,
  Zap,
  MessageSquare,
  Mail,
  ArrowRight,
  Wallet,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits, refreshCredits } = useCredits();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [usageSummary, setUsageSummary] = useState<any | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const token = typeof window !== "undefined"
      ? (JSON.parse(sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth") || "{}").token || localStorage.getItem("token") || "")
      : "";
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      api.getCampaigns().catch(() => []),
      api.getCalls({ page_size: 500 }).catch(() => ({ calls: [] })),
      fetch("/api/billing/usage-summary", { headers })
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([cData, callRes, uData]) => {
        setCampaigns(Array.isArray(cData) ? cData : []);
        const callList = Array.isArray(callRes) ? callRes : (callRes?.calls || []);
        setCalls(callList);
        if (uData) setUsageSummary(uData);
      })
      .catch((err) => {
        console.warn("Failed to load dashboard data:", err);
        setCampaigns([]);
        setCalls([]);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const safeCalls = Array.isArray(calls) ? calls : [];

  const totalCampaigns = safeCampaigns.length;
  const totalCalls = safeCampaigns.reduce((acc, c) => acc + (Number(c.totalCalls) || 0), 0);
  const completedCalls = safeCampaigns.reduce((acc, c) => acc + (Number(c.completedCalls) || 0), 0);
  const interestedLeads = safeCalls.filter(c => ["HOT", "WARM", "COLD"].includes((c.category || "").toUpperCase())).length;
  const callbacks = safeCampaigns.reduce((acc, c) => acc + (Number(c.callbacks) || 0), 0);
  const activeAgents = Array.from(new Set(safeCampaigns.filter(c => (c.status || "").toLowerCase() === "running").map(c => c.agent))).filter(Boolean).length;
  const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

  const stats = [
    {
      icon: FileText,
      value: String(totalCampaigns),
      label: "Total Campaigns",
      accentClassName: "bg-violet-100/50 dark:bg-violet-900/10",
      iconBackgroundClassName: "bg-violet-100",
      iconColorClassName: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: PhoneCall,
      value: totalCalls >= 1000 ? `${(totalCalls / 1000).toFixed(1)}k` : String(totalCalls),
      label: "Total Calls",
      accentClassName: "bg-blue-100/50 dark:bg-blue-900/10",
      iconBackgroundClassName: "bg-blue-100",
      iconColorClassName: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: CheckCircle2,
      value: completedCalls >= 1000 ? `${(completedCalls / 1000).toFixed(1)}k` : String(completedCalls),
      label: "Completed Calls",
      accentClassName: "bg-emerald-100/50 dark:bg-emerald-900/10",
      iconBackgroundClassName: "bg-emerald-100",
      iconColorClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Target,
      value: String(interestedLeads),
      label: "Interested Leads",
      accentClassName: "bg-rose-100/50 dark:bg-rose-900/10",
      iconBackgroundClassName: "bg-rose-100",
      iconColorClassName: "text-rose-600 dark:text-rose-400",
    },
    {
      icon: PhoneForwarded,
      value: String(callbacks),
      label: "Callbacks",
      accentClassName: "bg-amber-100/50 dark:bg-amber-900/10",
      iconBackgroundClassName: "bg-amber-100",
      iconColorClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Coins,
      value: credits !== null ? String(Number(credits).toLocaleString("en-IN", { maximumFractionDigits: 1 })) : "0",
      label: "Universal Credits",
      accentClassName: "bg-cyan-100/50 dark:bg-cyan-900/10",
      iconBackgroundClassName: "bg-cyan-100",
      iconColorClassName: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: Bot,
      value: String(activeAgents),
      label: "Active Agents",
      accentClassName: "bg-fuchsia-100/50 dark:bg-fuchsia-900/10",
      iconBackgroundClassName: "bg-fuchsia-100",
      iconColorClassName: "text-fuchsia-600 dark:text-fuchsia-400",
    },
    {
      icon: TrendingUp,
      value: `${successRate.toFixed(1)}%`,
      label: "Success Rate",
      accentClassName: "bg-emerald-100/50 dark:bg-emerald-900/10",
      iconBackgroundClassName: "bg-emerald-100",
      iconColorClassName: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const activityItems = safeCalls.slice(0, 4).map(c => {
    const isCompleted = (c?.status || "").toLowerCase() === "completed";
    const title = isCompleted ? "Call Completed" : "Call Attempt Failed";
    const description = isCompleted
      ? `"${c?.name || c?.phone || "Contact"}" call completed successfully in campaign "${c?.campaign || "Campaign"}".`
      : `Dialing "${c?.phone || "Contact"}" in campaign "${c?.campaign || "Campaign"}" failed or was busy.`;
    return {
      title,
      description,
      time: c?.datetime || "Just now",
      outerDotClassName: isCompleted ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-rose-100 dark:bg-rose-500/20",
      innerDotClassName: isCompleted ? "bg-emerald-500" : "bg-rose-500",
    };
  });

  const quickActions = [
    {
      href: "/call-manager",
      icon: Plus,
      title: "Create Campaign",
      hoverClassName: "hover:border-violet-400 hover:bg-violet-50 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10",
      iconWrapperClassName: "bg-violet-100 dark:bg-violet-900/30",
      iconColorClassName: "text-violet-600 dark:text-violet-400",
      arrowHoverClassName: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
    },
    {
      href: "/call-logs",
      icon: PhoneCall,
      title: "View Responses",
      hoverClassName: "hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10",
      iconWrapperClassName: "bg-blue-100 dark:bg-blue-900/30",
      iconColorClassName: "text-blue-600 dark:text-blue-400",
      arrowHoverClassName: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    },
    {
      href: "/report",
      icon: Target,
      title: "AI Report",
      hoverClassName: "hover:border-rose-400 hover:bg-rose-50 dark:hover:border-rose-500/50 dark:hover:bg-rose-500/10",
      iconWrapperClassName: "bg-rose-100 dark:bg-rose-900/30",
      iconColorClassName: "text-rose-600 dark:text-rose-400",
      arrowHoverClassName: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    },
    {
      href: "/campaign",
      icon: FileText,
      title: "All Campaigns",
      hoverClassName: "hover:border-amber-400 hover:bg-amber-50 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/10",
      iconWrapperClassName: "bg-amber-100 dark:bg-amber-900/30",
      iconColorClassName: "text-amber-600 dark:text-amber-400",
      arrowHoverClassName: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    },
  ];

  return (
    <DashboardShell title="Dashboard">
      <div className="flex flex-col gap-8 p-1 sm:p-4">
        
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Welcome back, {user?.name || "Admin"} 👋
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Here is what's happening with your multi-channel operations today.
            </p>
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{currentDate}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 px-4 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition shadow-sm cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Top Up Credits</span>
            </button>
            <button
              onClick={() => router.push("/call-manager")}
              className="flex w-max items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500 hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* ── Section: Clean Universal Credits & Usage Summary Widget ── */}
        <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm transition hover:shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Balance & Rates */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Universal Wallet</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Active
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-white">
                  {credits !== null ? Number(credits).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Available Credits</span>
              </div>
              
              {/* Clean Usage Rates Pill */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                  <PhoneCall className="w-3 h-3 text-violet-500" /> AI Calling: 15 cr / min
                </span>
                <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                  <MessageSquare className="w-3 h-3 text-emerald-500" /> WhatsApp: 0.1 cr / msg
                </span>
                <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                  <Mail className="w-3 h-3 text-sky-500" /> Email: 0.2 cr / email
                </span>
              </div>
            </div>

            {/* Usage Summary Breakdown Cards */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="flex-1 sm:flex-initial p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center min-w-[100px]">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">AI Calls</div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono mt-0.5">
                  {usageSummary?.usage?.calling?.duration_minutes ?? 0}m
                </div>
                <div className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                  {usageSummary?.usage?.calling?.credits_consumed ?? 0} cr
                </div>
              </div>

              <div className="flex-1 sm:flex-initial p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center min-w-[100px]">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">WhatsApp</div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono mt-0.5">
                  {usageSummary?.usage?.whatsapp?.messages_sent ?? 0}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  {usageSummary?.usage?.whatsapp?.credits_consumed ?? 0} cr
                </div>
              </div>

              <div className="flex-1 sm:flex-initial p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center min-w-[100px]">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Emails</div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono mt-0.5">
                  {usageSummary?.usage?.email?.emails_sent ?? 0}
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                  {usageSummary?.usage?.email?.credits_consumed ?? 0} cr
                </div>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Single universal balance for all channels.</span>
            <Link href="/billing" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1">
              <span>View Full Ledger</span> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Bottom Section: Activity & Quick Links */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* Recent Activity */}
          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Activity</h2>
              <Activity className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-zinc-100 pl-6 dark:border-zinc-800 space-y-8">
                {activityItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={`absolute -left-[33px] flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0B0F19] ${item.outerDotClassName}`}>
                      <div className={`h-2 w-2 rounded-full ${item.innerDotClassName}`}></div>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
                    <span className="mt-1 block text-xs text-zinc-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
              {quickActions.map((action) => (
                <QuickActionCard key={action.title} {...action} />
              ))}
            </div>
          </div>
          
        </div>
      </div>

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          refreshCredits();
        }}
      />
    </DashboardShell>
  );
}
