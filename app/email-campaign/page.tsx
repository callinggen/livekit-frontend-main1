"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
  Loader2,
} from "lucide-react";
import { api, EmailCampaignRow } from "@/lib/api";

const getStatusBadge = (status: string) => {
  const map: Record<string, BadgeVariant> = {
    completed: "success",
    running: "info",
    scheduled: "warning",
    draft: "neutral",
    failed: "error",
  };
  return (
    <Badge variant={map[status.toLowerCase()] || "neutral"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function EmailCampaignPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const load = async () => {
    try {
      const data = await api.getEmailCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.warn("Failed to load email campaigns:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this email campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteEmailCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isLoggedIn) return null;

  // Stats
  const total = campaigns.length;
  const running = campaigns.filter((c) => c.status === "running").length;
  const completed = campaigns.filter((c) => c.status === "completed").length;
  const draft = campaigns.filter((c) => c.status === "draft").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);

  if (loading) {
    return (
      <DashboardShell title="Email Marketing">
        <div className="flex items-center justify-center h-64 gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading campaigns…
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Email Marketing">
      <div className="flex flex-col gap-6 p-1 sm:p-4">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Campaigns</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Create and manage bulk email marketing campaigns.
            </p>
          </div>
          <button
            id="new-email-campaign-btn"
            onClick={() => router.push("/email-campaign/new")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Email Campaign
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {[
            { label: "Total", value: total, icon: Mail, color: "violet" },
            { label: "Running", value: running, icon: Loader2, color: "blue" },
            { label: "Completed", value: completed, icon: CheckCircle2, color: "emerald" },
            { label: "Drafts", value: draft, icon: Clock, color: "amber" },
            { label: "Emails Sent", value: totalSent, icon: Send, color: "indigo" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className={`group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-${color}-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-${color}-700`}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</h3>
            </div>
          ))}
        </div>

        {/* Campaigns table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">All Campaigns</h3>
          </div>

          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/20">
                <Mail className="h-8 w-8 text-violet-400" />
              </div>
              <p className="text-sm">No email campaigns yet.</p>
              <button
                onClick={() => router.push("/email-campaign/new")}
                className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    {["Campaign Name", "Subject", "Status", "Contacts", "Sent", "Failed", "Created", "Actions"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {campaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/email-campaign/${c.id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-zinc-600 dark:text-zinc-400">
                        {c.subject}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                      <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                        {c.total}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {c.sent}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-mono">
                          <XCircle className="h-3.5 w-3.5" />
                          {c.failed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                        {c.created_at}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="View"
                            onClick={() => router.push(`/email-campaign/${c.id}`)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-white transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
