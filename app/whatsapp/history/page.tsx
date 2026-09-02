"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface HistoryJob {
  id: number;
  date: string;
  created_at_raw: string;
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

export default function WhatsAppHistoryPage() {
  const { isLoggedIn, user } = useAuth();
  const token = user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const { credits } = useCredits();
  const router = useRouter();

  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Job for Detail View Modal
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      let url = `${BASE_URL}/api/whatsapp/history?limit=100`;
      if (sourceFilter !== "all") url += `&source=${sourceFilter}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchHistory();
    }
  }, [isLoggedIn, sourceFilter, statusFilter]);

  const handleOpenDetail = async (jobId: number) => {
    setSelectedJobId(jobId);
    setLoadingDetail(true);
    setRecipientSearch("");
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/history/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setJobDetail(data.job || null);
      }
    } catch (err) {
      console.error("Failed to load job detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredRecipients = (jobDetail?.recipients || []).filter((r) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q) || r.status.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
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
            Campaign Automation
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
          Excel / CSV
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
      {/* ── Sub Navigation Header Tabs ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
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
            History
          </Link>
        </div>

        {/* Available Credits Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
            <Coins className="h-3.5 w-3.5" />
            <span>Credits: {credits ?? 2000}</span>
          </div>
        </div>
      </div>

      {/* ── Page Header / Banner ── */}
      <div className="mb-6 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/30 p-5 dark:border-violet-900/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-violet-950/20 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-500/30">
                <HistoryIcon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">WhatsApp Send History</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Audit log of all manual sends, campaign blasts, and automated post-call follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchHistory();
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-zinc-900 dark:text-zinc-100 font-medium"
              />
            </div>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">All Sources</option>
              <option value="campaign_manual">Campaigns</option>
              <option value="campaign_automation">Automations</option>
              <option value="excel_csv">Excel / CSV</option>
              <option value="manual">Manual</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none text-zinc-700 dark:text-zinc-200"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={fetchHistory}
              className="p-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      {/* History Table Content */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Campaign / Source</th>
                <th className="py-3.5 px-4 text-center">Contacts</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4 text-center">Credits</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                        Loading send history...
                      </td>
                    </tr>
                  ) : jobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-zinc-400">
                        <HistoryIcon className="w-10 h-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          No WhatsApp Send Records Found
                        </p>
                        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                          When you send messages via Send Message or trigger Campaign WhatsApp Automation, detailed records will appear here.
                        </p>
                        <div className="mt-4">
                          <Link
                            href="/whatsapp/send"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-sm transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send First Message
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => handleOpenDetail(job.id)}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                      >
                        <td className="py-4 px-4 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {job.date}
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-zinc-900 dark:text-white">
                              {job.source_name}
                            </p>
                            {getSourceBadge(job.source_type, job.trigger_event)}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {job.total_contacts}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                            {job.content_type === "Text" ? (
                              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                            ) : job.content_type === "Image" ? (
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-purple-500" />
                            )}
                            {job.content_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-zinc-900 dark:text-white">
                            <Coins className="w-3.5 h-3.5 text-amber-500" />
                            {job.credits_deducted}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(job.id);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── DETAIL VIEW MODAL ────────────────────────────────────────── */}
        {selectedJobId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-800/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                    <HistoryIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      WhatsApp Send Details
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Send Job #{selectedJobId} • Snapshot & Recipient Audit Log
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedJobId(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {loadingDetail || !jobDetail ? (
                  <div className="py-12 text-center text-zinc-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                    Loading job details...
                  </div>
                ) : (
                  <>
                    {/* Summary Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Campaign / Source</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                          {jobDetail.source_name}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Date & Time</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate mt-0.5">
                          {jobDetail.date}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Total Contacts</p>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">
                          {jobDetail.total_contacts} ({jobDetail.sent_count} sent, {jobDetail.failed_count} failed)
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Credits Deducted</p>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {jobDetail.credits_deducted} Credits
                        </p>
                      </div>
                    </div>

                    {/* Automation Trigger Badge if applicable */}
                    {jobDetail.trigger_event && (
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                          Trigger Condition: {jobDetail.trigger_event}
                        </span>
                      </div>
                    )}

                    {/* Message & Attachment Snapshot */}
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-zinc-50/40 dark:bg-zinc-800/20">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                        Message Content Snapshot
                      </h4>

                      {jobDetail.message_text ? (
                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-medium p-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {jobDetail.message_text}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No text body (media message)</p>
                      )}

                      {/* Attachments */}
                      {jobDetail.attachments && jobDetail.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            Attachments ({jobDetail.attachments.length})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {jobDetail.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {att.type === "image" ? (
                                    <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                                  )}
                                  <span className="truncate font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
                                    {att.title || att.file_name || "Attachment"}
                                  </span>
                                </div>
                                {att.url && (
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-violet-600 hover:text-violet-500 shrink-0"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recipient-Level Results */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-violet-600" />
                          Recipient Delivery Audit ({jobDetail.recipients.length})
                        </h4>

                        <input
                          type="text"
                          placeholder="Filter recipients..."
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none w-44"
                        />
                      </div>

                      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-bold">
                            <tr>
                              <th className="py-2.5 px-3.5">Recipient</th>
                              <th className="py-2.5 px-3.5">Phone</th>
                              <th className="py-2.5 px-3.5">Status</th>
                              <th className="py-2.5 px-3.5">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {filteredRecipients.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-6 text-center text-zinc-400 text-xs">
                                  No recipients found.
                                </td>
                              </tr>
                            ) : (
                              filteredRecipients.map((rec) => (
                                <tr key={rec.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                    {rec.name}
                                  </td>
                                  <td className="py-2.5 px-3.5 font-mono text-zinc-600 dark:text-zinc-400">
                                    {rec.phone}
                                  </td>
                                  <td className="py-2.5 px-3.5">
                                    {rec.status === "Sent" || rec.status === "Delivered" ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                        <Check className="w-3 h-3" />
                                        {rec.status}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                        <AlertCircle className="w-3 h-3" />
                                        {rec.error_message || rec.status}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-zinc-400 text-[11px]">
                                    {rec.sent_at}
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
