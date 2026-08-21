"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Mail,
  User,
  Loader2,
  Play,
  Eye,
  X,
} from "lucide-react";
import { api, EmailCampaignDetail } from "@/lib/api";

// ── Preview modal ────────────────────────────────────────────────────────────
function PreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Email Body Preview</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[70vh] p-4">
          <iframe
            srcDoc={html}
            className="w-full min-h-[400px] border-0 rounded-lg"
            title="Email Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}

const statusBadge = (status: string) => {
  const map: Record<string, BadgeVariant> = {
    completed: "success",
    running: "info",
    scheduled: "warning",
    draft: "neutral",
    failed: "error",
    sent: "success",
    pending: "warning",
  };
  return (
    <Badge variant={map[status.toLowerCase()] || "neutral"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function EmailCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [campaign, setCampaign] = useState<EmailCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const loadCampaign = async () => {
    try {
      const data = await api.getEmailCampaign(Number(id));
      setCampaign(data);
    } catch (e) {
      console.warn("Failed to load email campaign:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !id) return;
    loadCampaign();

    // Poll every 5 seconds while running
    intervalRef.current = setInterval(async () => {
      try {
        const status = await api.getEmailCampaignStatus(Number(id));
        if (status.status === "running") {
          // Refresh full data for contact updates
          await loadCampaign();
        } else {
          // Campaign done — do one final load then stop polling
          await loadCampaign();
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (e) {
        console.warn("Status poll error:", e);
      }
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoggedIn, id]);

  const handleLaunch = async () => {
    if (!campaign) return;
    if (!confirm(`Launch "${campaign.name}" and send emails to ${campaign.stats.total} contacts now?`)) return;
    setLaunching(true);
    setError("");
    try {
      await api.launchEmailCampaign(campaign.id);
      await loadCampaign();
    } catch (e: any) {
      setError(e.message || "Failed to launch campaign");
    } finally {
      setLaunching(false);
    }
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <DashboardShell title="Email Campaign">
        <div className="flex h-64 items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading campaign…
        </div>
      </DashboardShell>
    );
  }

  if (!campaign) {
    return (
      <DashboardShell title="Email Campaign">
        <div className="flex h-64 items-center justify-center text-zinc-500">
          Campaign not found.
        </div>
      </DashboardShell>
    );
  }

  const { stats } = campaign;
  const sentPct = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  const failPct = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  return (
    <DashboardShell title="Email Campaign Detail">
      {showPreview && campaign.html_body && (
        <PreviewModal html={campaign.html_body} onClose={() => setShowPreview(false)} />
      )}

      <div className="flex flex-col gap-6 px-1 sm:px-4 py-2">
        {/* Back */}
        <button
          onClick={() => router.push("/email-campaign")}
          className="flex w-fit items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Email Campaigns
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{campaign.name}</h1>
              {statusBadge(campaign.status)}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Subject: <span className="font-medium text-zinc-700 dark:text-zinc-300">{campaign.subject}</span>
            </p>
            {campaign.from_name && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                From: {campaign.from_name}
                {campaign.reply_to && ` · Reply-to: ${campaign.reply_to}`}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {campaign.html_body && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <Eye className="h-4 w-4" />
                Preview Email
              </button>
            )}
            {campaign.status === "draft" && (
              <button
                id="launch-email-campaign-btn"
                onClick={handleLaunch}
                disabled={launching}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-60"
              >
                {launching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {launching ? "Launching…" : "Launch Now"}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Contacts", value: stats.total, icon: User, color: "violet" },
            { label: "Sent", value: stats.sent, icon: CheckCircle2, color: "emerald" },
            { label: "Failed", value: stats.failed, icon: XCircle, color: "red" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "amber" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]"
            >
              <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</h3>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Delivery Progress</h3>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{sentPct}% sent</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              {/* Sent */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${sentPct}%` }}
              />
              {/* Failed overlay at right of sent */}
              <div
                className="absolute inset-y-0 rounded-full bg-red-400 transition-all duration-500"
                style={{ left: `${sentPct}%`, width: `${failPct}%` }}
              />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Sent</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-400" /> Failed</span>
              <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" /> Pending</span>
            </div>
          </div>
        )}

        {/* Contact table */}
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <Mail className="h-4 w-4 text-violet-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              Recipients <span className="ml-2 text-xs font-normal text-zinc-400">({campaign.contacts.length})</span>
            </h3>
            {campaign.status === "running" && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending in progress…
              </span>
            )}
          </div>
          {campaign.contacts.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400">No contacts.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    {["#", "Name", "Email", "Status", "Sent At", "Error"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {campaign.contacts.map((c, i) => (
                    <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-zinc-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{c.name}</td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                      <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {c.sent_at
                          ? new Date(c.sent_at).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {c.error_message ? (
                          <span className="text-xs text-red-500 dark:text-red-400 truncate block" title={c.error_message}>
                            {c.error_message}
                          </span>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">—</span>
                        )}
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
