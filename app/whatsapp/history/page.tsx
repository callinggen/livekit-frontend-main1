"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  History as HistoryIcon,
  Search,
  Filter,
  RefreshCw,
  Send,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Coins,
  ShieldCheck,
  Check,
  Calendar,
  Zap,
  Trash2,
  Ban,
  PlusCircle,
  PlayCircle,
  CalendarClock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");

interface HistoryJob {
  id: number;
  date: string;
  created_at_raw: string;
  scheduled_for?: string | null;
  scheduled_for_raw?: string | null;
  source_type: string;
  source_name: string;
  campaign_id?: number;
  trigger_event?: string;
  content_type: string;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  credits_deducted: number;
  status: string;
  message_preview?: string;
  attachments_count?: number;
}

interface RecipientDetail {
  id: number;
  name: string;
  phone: string;
  status: string;
  error_message?: string;
  sent_at: string;
  details?: any;
}

interface JobDetail extends HistoryJob {
  message_text: string;
  attachments: Array<{
    title?: string;
    type?: string;
    url?: string;
    file_name?: string;
    mime_type?: string;
  }>;
  completed_at?: string;
  recipients: RecipientDetail[];
}

function formatLocalTime(isoString?: string | null, fallback?: string): string {
  if (!isoString) return fallback || "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return fallback || isoString;
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return fallback || isoString;
  }
}

export default function WhatsAppHistoryPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell title="WhatsApp History">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        </DashboardShell>
      }
    >
      <WhatsAppHistoryContent />
    </Suspense>
  );
}

function WhatsAppHistoryContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const { isLoggedIn, user } = useAuth();
  const { credits } = useCredits();
  const router = useRouter();

  const getAuthToken = useCallback(() => {
    if (user?.token) return user.token;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) return parsed.token;
        }
      } catch {}
      return localStorage.getItem("token") || "";
    }
    return "";
  }, [user]);

  const [allJobs, setAllJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [completedTab, setCompletedTab] = useState<"all" | "campaign" | "automation" | "excel" | "manual">("all");

  // Selected Job for Detail View Modal
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cancellingJobId, setCancellingJobId] = useState<number | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/whatsapp/history?limit=150`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAllJobs(data.jobs || []);
      } else {
        console.warn("WhatsApp history request returned status:", res.status);
      }
    } catch (err) {
      console.warn("Could not load WhatsApp history:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchHistory();
    }
  }, [isLoggedIn, fetchHistory]);

  const handleOpenDetail = async (jobId: number) => {
    setSelectedJobId(jobId);
    setLoadingDetail(true);
    setRecipientSearch("");
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/whatsapp/history/${jobId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setJobDetail(data.job || null);
      }
    } catch (err) {
      console.warn("Could not load job detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelScheduledJob = async (jobId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this scheduled WhatsApp broadcast?")) {
      return;
    }
    setCancellingJobId(jobId);
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/whatsapp/history/${jobId}/cancel`, {
        method: "POST",
        headers,
      });
      if (res.ok) {
        fetchHistory();
        if (selectedJobId === jobId) {
          handleOpenDetail(jobId);
        }
      }
    } catch (err) {
      console.warn("Could not cancel scheduled job:", err);
    } finally {
      setCancellingJobId(null);
    }
  };

  // Active & Scheduled vs Completed separation
  const scheduledJobs = useMemo(() => {
    return allJobs.filter((j) => {
      const s = (j.status || "").toLowerCase();
      return s === "scheduled" || s === "in_progress";
    });
  }, [allJobs]);

  const completedJobs = useMemo(() => {
    return allJobs.filter((j) => {
      const s = (j.status || "").toLowerCase();
      return s !== "scheduled" && s !== "in_progress";
    });
  }, [allJobs]);

  // Filter completed jobs by tab and search
  const filteredCompletedJobs = useMemo(() => {
    return completedJobs.filter((j) => {
      // Tab filter
      if (completedTab === "campaign") {
        if (j.source_type !== "campaign" && j.source_type !== "campaign_manual") return false;
      } else if (completedTab === "automation") {
        if (j.source_type !== "campaign_automation") return false;
      } else if (completedTab === "excel") {
        if (j.source_type !== "excel_csv") return false;
      } else if (completedTab === "manual") {
        if (j.source_type !== "manual") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = j.source_name?.toLowerCase().includes(q);
        const matchMsg = j.message_preview?.toLowerCase().includes(q);
        const matchType = j.content_type?.toLowerCase().includes(q);
        if (!matchName && !matchMsg && !matchType) return false;
      }

      return true;
    });
  }, [completedJobs, completedTab, searchQuery]);

  // Summary statistics
  const statsTotal = allJobs.length;
  const statsScheduled = scheduledJobs.length;
  const statsCompleted = completedJobs.filter((j) => {
    const s = (j.status || "").toLowerCase();
    return s === "completed" || s === "sent" || s === "delivered";
  }).length;
  const statsFailedOrCancelled = completedJobs.filter((j) => {
    const s = (j.status || "").toLowerCase();
    return s === "failed" || s === "cancelled";
  }).length;
  const statsCreditsUsed = allJobs.reduce((acc, j) => acc + (j.credits_deducted || 0), 0);

  const filteredRecipients = (jobDetail?.recipients || []).filter((r) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "scheduled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800">
          <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          Scheduled
        </span>
      );
    }
    if (s === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
          <PlayCircle className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          In Progress
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
          <Ban className="w-3.5 h-3.5 text-zinc-500" />
          Cancelled
        </span>
      );
    }
    if (s === "completed" || s === "sent" || s === "delivered") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Completed
        </span>
      );
    }
    if (s === "partial") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Failed
      </span>
    );
  };

  const getSourceBadge = (sourceType: string, trigger?: string) => {
    if (sourceType === "campaign_automation") {
      return (
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            Automation
          </span>
          {trigger && <span className="text-[10px] text-zinc-500">{trigger}</span>}
        </div>
      );
    }
    if (sourceType === "campaign" || sourceType === "campaign_manual") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          Campaign
        </span>
      );
    }
    if (sourceType === "excel_csv") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
          <FileText className="w-3.5 h-3.5 text-teal-600" />
          File Upload
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        <Send className="w-3.5 h-3.5 text-zinc-500" />
        Manual Send
      </span>
    );
  };

  return (
    <DashboardShell title="WhatsApp Integration">
      <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4 overflow-y-auto">
        {/* ── Sub Navigation Header Tabs ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <Link
              href="/whatsapp"
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat Inbox
            </Link>
            <Link
              href="/whatsapp/send"
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
            >
              <Send className="h-3.5 w-3.5" />
              Send Message
            </Link>
            <Link
              href="/whatsapp/materials"
              className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
            >
              <Layers className="h-3.5 w-3.5" />
              Material Base
            </Link>
            <Link
              href="/whatsapp/history"
              className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-white shadow-sm transition"
            >
              <HistoryIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              History & Scheduled
            </Link>
          </div>

          {/* Available Credits & New Send button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
              <Coins className="h-3.5 w-3.5" />
              <span>Credits: {credits ?? 2000}</span>
            </div>
            <Link
              href="/whatsapp/send"
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Broadcast</span>
            </Link>
          </div>
        </div>

        {/* ── Statistics Cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 shrink-0">
          <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Broadcasts</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{statsTotal}</h3>
          </div>

          <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active & Scheduled</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{statsScheduled}</h3>
          </div>

          <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{statsCompleted}</h3>
          </div>

          <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Failed / Cancelled</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{statsFailedOrCancelled}</h3>
          </div>

          <div className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Coins className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Credits Deducted</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{statsCreditsUsed}</h3>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            TOP SECTION: ACTIVE & SCHEDULED BROADCASTS
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-3 mb-8 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarClock className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Active & Scheduled Broadcasts</h2>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                {scheduledJobs.length} upcoming
              </span>
            </div>
          </div>

          {scheduledJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-2">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No active or scheduled broadcasts</h4>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                Schedule your next WhatsApp campaign or automated follow-up to be delivered at a designated future time.
              </p>
              <div className="mt-3">
                <Link
                  href="/whatsapp/send"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/50 transition border border-violet-200 dark:border-violet-800"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Schedule a Broadcast
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-amber-50/50 dark:bg-amber-950/20 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Scheduled Execution Time</th>
                      <th className="py-3 px-4">Source / Audience</th>
                      <th className="py-3 px-4 text-center">Recipients</th>
                      <th className="py-3 px-4">Content Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                    {scheduledJobs.map((job) => (
                      <tr
                        key={`sched-job-${job.id}`}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                        onClick={() => handleOpenDetail(job.id)}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {formatLocalTime(job.scheduled_for_raw, job.scheduled_for || job.date)}
                              </p>
                              <span className="text-[10px] text-zinc-400">Created: {formatLocalTime(job.created_at_raw, job.date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{job.source_name}</span>
                            <div>{getSourceBadge(job.source_type, job.trigger_event)}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                            {job.total_contacts}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {job.content_type}
                            {job.attachments_count && job.attachments_count > 0 ? (
                              <span className="ml-1 text-[11px] text-violet-600 font-bold">
                                (+{job.attachments_count} media)
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {job.status?.toLowerCase() === "scheduled" && (
                              <button
                                onClick={(e) => handleCancelScheduledJob(job.id, e)}
                                disabled={cancellingJobId === job.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
                                title="Cancel Scheduled Broadcast"
                              >
                                <Ban className="w-3 h-3" />
                                {cancellingJobId === job.id ? "Cancelling..." : "Cancel"}
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenDetail(job.id)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            BOTTOM SECTION: COMPLETED BROADCAST HISTORY
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">Completed Broadcast History</h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Comprehensive delivery and audit logs of all past WhatsApp campaigns and messages.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search completed logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-900 dark:text-zinc-100 font-medium"
                />
              </div>

              <button
                onClick={fetchHistory}
                className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition"
                title="Refresh History"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Sub Filters for Completed History */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "All Completed" },
              { id: "campaign", label: "Campaign Blasts" },
              { id: "automation", label: "Automations" },
              { id: "excel", label: "File Uploads" },
              { id: "manual", label: "Manual" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCompletedTab(tab.id as any)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  completedTab === tab.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Completed History Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Campaign / Source</th>
                    <th className="py-3.5 px-4 text-center">Delivered / Total</th>
                    <th className="py-3.5 px-4">Content Type</th>
                    <th className="py-3.5 px-4 text-center">Credits</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
                          <span>Loading broadcast history...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCompletedJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <HistoryIcon className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">No completed broadcast records</p>
                          <p className="text-[11px] text-zinc-400">
                            Sent WhatsApp broadcasts will appear here once executed.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCompletedJobs.map((job) => (
                      <tr
                        key={`job-${job.id}`}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition cursor-pointer"
                        onClick={() => handleOpenDetail(job.id)}
                      >
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300 font-medium">
                          {formatLocalTime(job.created_at_raw, job.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{job.source_name}</span>
                            <div>{getSourceBadge(job.source_type, job.trigger_event)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {job.sent_count}
                            </span>
                            <span className="text-zinc-400">/</span>
                            <span className="font-mono text-zinc-500">{job.total_contacts}</span>
                            {job.failed_count > 0 && (
                              <span className="text-[10px] font-bold text-rose-500">
                                ({job.failed_count} failed)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            {job.content_type}
                            {job.attachments_count && job.attachments_count > 0 ? (
                              <span className="ml-1 text-[11px] text-violet-600 font-bold">
                                (+{job.attachments_count} media)
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {job.credits_deducted}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetail(job.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
                          >
                            Details
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DETAIL MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600 text-white">
                  <HistoryIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Broadcast Run #{selectedJobId}: {jobDetail?.source_name || "Details"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatLocalTime(jobDetail?.created_at_raw, jobDetail?.date || "Loading...")} • {jobDetail?.source_type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {jobDetail?.status?.toLowerCase() === "scheduled" && (
                  <button
                    onClick={() => handleCancelScheduledJob(selectedJobId)}
                    disabled={cancellingJobId === selectedJobId}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {cancellingJobId === selectedJobId ? "Cancelling..." : "Cancel Schedule"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedJobId(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {loadingDetail ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                  <p className="text-xs">Loading broadcast audit details...</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500">Total Recipients</span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                        {jobDetail?.total_contacts ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Delivered</span>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {jobDetail?.sent_count ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                      <span className="text-[11px] text-rose-700 dark:text-rose-400">Failed</span>
                      <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                        {jobDetail?.failed_count ?? 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                      <span className="text-[11px] text-indigo-700 dark:text-indigo-400">Credits Deducted</span>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                        {jobDetail?.credits_deducted ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled For Banner */}
                  {jobDetail?.scheduled_for && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                            Scheduled for: {formatLocalTime(jobDetail.scheduled_for_raw, jobDetail.scheduled_for)}
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400">
                            Will automatically dispatch to all {jobDetail.total_contacts} contacts at the designated time.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                        {jobDetail.status}
                      </span>
                    </div>
                  )}

                  {/* Message Content Preview */}
                  {jobDetail?.message_text && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Message Text</label>
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                        {jobDetail.message_text}
                      </div>
                    </div>
                  )}

                  {/* Attachments Preview */}
                  {jobDetail?.attachments && jobDetail.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Attachments</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {jobDetail.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {att.type === "image" ? (
                                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              )}
                              <span className="text-xs font-medium truncate text-zinc-800 dark:text-zinc-200">
                                {att.title || att.file_name || "Attachment"}
                              </span>
                            </div>
                            {att.url && (
                              <a
                                href={att.url.startsWith("http") ? att.url : `${BASE_URL}${att.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-violet-600 dark:text-violet-400 font-bold flex items-center gap-0.5 hover:underline shrink-0"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipient Delivery Log */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Recipient Logs ({jobDetail?.recipients?.length || 0})
                      </label>
                      <div className="relative w-48">
                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Filter recipients..."
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="py-2 px-3.5">Name</th>
                            <th className="py-2 px-3.5">Phone</th>
                            <th className="py-2 px-3.5">Delivery Status / Failure Reason</th>
                            <th className="py-2 px-3.5">Sent At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {filteredRecipients.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-zinc-400 text-xs">
                                No recipients found matching search.
                              </td>
                            </tr>
                          ) : (
                            filteredRecipients.map((rec) => (
                              <tr key={rec.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                <td className="py-2.5 px-3.5 font-medium text-zinc-800 dark:text-zinc-200">
                                  {rec.name || "—"}
                                </td>
                                <td className="py-2.5 px-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                                  {rec.phone}
                                </td>
                                <td className="py-2.5 px-3.5">
                                  {rec.status.toLowerCase() === "scheduled" ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600">
                                      <Clock className="w-3 h-3" />
                                      Scheduled
                                    </span>
                                  ) : rec.status.toLowerCase() === "cancelled" ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500">
                                      <Ban className="w-3 h-3" />
                                      Cancelled
                                    </span>
                                  ) : rec.status.toLowerCase() === "sent" || rec.status.toLowerCase() === "delivered" ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                      <Check className="w-3 h-3" />
                                      Sent
                                    </span>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        Failed
                                      </span>
                                      {rec.error_message && (
                                        <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/40 px-1.5 py-0.5 rounded font-medium max-w-xs break-words">
                                          {rec.error_message}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 text-zinc-400 text-[11px] whitespace-nowrap">
                                  {formatLocalTime((rec as any).sent_at_raw, rec.sent_at || "Pending Schedule")}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex justify-end">
              <button
                onClick={() => setSelectedJobId(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
