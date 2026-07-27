"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import { ActivityTimeline } from "@/components/shared/dashboard/ActivityTimeline";
import { QuickActionCard } from "@/components/shared/dashboard/QuickActionCard";
import { StatCard } from "@/components/shared/dashboard/StatCard";
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
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([api.getCampaigns(), api.getCalls()])
      .then(([cData, callData]) => {
        setCampaigns(cData);
        setCalls(callData);
      })
      .catch((err) => console.warn("Failed to load dashboard data:", err))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const totalCampaigns = campaigns.length;
  const totalCalls = campaigns.reduce((acc, c) => acc + c.totalCalls, 0);
  const completedCalls = campaigns.reduce((acc, c) => acc + c.completedCalls, 0);
  const interestedLeads = campaigns.reduce((acc, c) => acc + (c.interested || 0), 0);
  const callbacks = campaigns.reduce((acc, c) => acc + (c.callbacks || 0), 0);
  const activeAgents = Array.from(new Set(campaigns.filter(c => c.status === "Running").map(c => c.agent))).filter(Boolean).length;
  const successRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

  const stats = campaigns.length > 0 ? [
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
      value: credits !== null ? String(credits) : "...",
      label: "Credits",
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
  ] : [
    {
      icon: FileText,
      value: "12",
      label: "Total Campaigns",
      accentClassName: "bg-violet-100/50 dark:bg-violet-900/10",
      iconBackgroundClassName: "bg-violet-100",
      iconColorClassName: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: PhoneCall,
      value: "5.2k",
      label: "Total Calls",
      accentClassName: "bg-blue-100/50 dark:bg-blue-900/10",
      iconBackgroundClassName: "bg-blue-100",
      iconColorClassName: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: CheckCircle2,
      value: "4.8k",
      label: "Completed Calls",
      accentClassName: "bg-emerald-100/50 dark:bg-emerald-900/10",
      iconBackgroundClassName: "bg-emerald-100",
      iconColorClassName: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Target,
      value: "342",
      label: "Interested Leads",
      accentClassName: "bg-rose-100/50 dark:bg-rose-900/10",
      iconBackgroundClassName: "bg-rose-100",
      iconColorClassName: "text-rose-600 dark:text-rose-400",
    },
    {
      icon: PhoneForwarded,
      value: "156",
      label: "Callbacks",
      accentClassName: "bg-amber-100/50 dark:bg-amber-900/10",
      iconBackgroundClassName: "bg-amber-100",
      iconColorClassName: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Coins,
      value: "2000",
      label: "Credits",
      accentClassName: "bg-cyan-100/50 dark:bg-cyan-900/10",
      iconBackgroundClassName: "bg-cyan-100",
      iconColorClassName: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: Bot,
      value: "4",
      label: "Active Agents",
      accentClassName: "bg-fuchsia-100/50 dark:bg-fuchsia-900/10",
      iconBackgroundClassName: "bg-fuchsia-100",
      iconColorClassName: "text-fuchsia-600 dark:text-fuchsia-400",
    },
    {
      icon: TrendingUp,
      value: "92.4%",
      label: "Success Rate",
      accentClassName: "bg-emerald-100/50 dark:bg-emerald-900/10",
      iconBackgroundClassName: "bg-emerald-100",
      iconColorClassName: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const activityItems = calls.length > 0 ? calls.slice(0, 4).map(c => {
    const isCompleted = c.status.toLowerCase() === "completed";
    const title = isCompleted ? "Call Completed" : "Call Attempt Failed";
    const description = isCompleted
      ? `"${c.name || c.phone}" call completed successfully in campaign "${c.campaign}".`
      : `Dialing "${c.phone}" in campaign "${c.campaign}" failed or was busy.`;
    return {
      title,
      description,
      time: c.datetime || "Just now",
      outerDotClassName: isCompleted ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-rose-100 dark:bg-rose-500/20",
      innerDotClassName: isCompleted ? "bg-emerald-500" : "bg-rose-500",
    };
  }) : [
    {
      title: "Campaign Scheduled",
      description: '"Holiday Special" was scheduled for Nov 20.',
      time: "10 mins ago",
      outerDotClassName: "bg-emerald-100 dark:bg-emerald-500/20",
      innerDotClassName: "bg-emerald-500",
    },
    {
      title: "Lead Generated",
      description: "Diana Evans expressed high interest.",
      time: "2 hours ago",
      outerDotClassName: "bg-rose-100 dark:bg-rose-500/20",
      innerDotClassName: "bg-rose-500",
    },
    {
      title: "Calls Completed",
      description: '"Q4 Outreach" completed 450/1200 calls.',
      time: "Yesterday",
      outerDotClassName: "bg-blue-100 dark:bg-blue-500/20",
      innerDotClassName: "bg-blue-500",
    },
    {
      title: "Campaign Created",
      description: '"New Feature Announcement" drafted by Admin.',
      time: "Oct 12",
      outerDotClassName: "bg-violet-100 dark:bg-violet-500/20",
      innerDotClassName: "bg-violet-500",
    },
  ];

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
      href: "/responses",
      icon: PhoneCall,
      title: "View Responses",
      hoverClassName: "hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10",
      iconWrapperClassName: "bg-blue-100 dark:bg-blue-900/30",
      iconColorClassName: "text-blue-600 dark:text-blue-400",
      arrowHoverClassName: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
    },
    {
      href: "/leads",
      icon: Target,
      title: "Manage Leads",
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Welcome back, {user?.name || "Admin"} 👋</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Here is what's happening with your campaigns today.
            </p>
            <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{currentDate}</p>
          </div>
          <button 
            onClick={() => router.push("/dashboard/call-manager")}
            className="flex w-max items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-500 hover:shadow-lg dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
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
    </DashboardShell>
  );
}
