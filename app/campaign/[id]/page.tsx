"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import { 
  ArrowLeft, Calendar, User, FileText, CheckCircle2, 
  XCircle, HelpCircle, PhoneCall, Zap, Award
} from "lucide-react";
import { api, CampaignDetail } from "@/lib/api";

const formatDateTime = (dateString: string | undefined | null) => {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
    return dateString;
  }
  try {
    const cleanStr = dateString.replace(" UTC", "");
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  } catch {
    return dateString;
  }
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !id) return;
    let active = true;

    const fetchDetail = async () => {
      try {
        const data = await api.getCampaign(Number(id));
        if (active) {
          setCampaign(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load campaign details:", err);
        if (active) setLoading(false);
      }
    };

    fetchDetail();

    const interval = setInterval(() => {
      fetchDetail();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, id]);

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <DashboardShell title="Campaign Details">
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Loading campaign details...
        </div>
      </DashboardShell>
    );
  }

  if (!campaign) {
    return (
      <DashboardShell title="Campaign Details">
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4">
          <p>Campaign not found.</p>
          <button 
            onClick={() => router.push("/campaign")}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>
        </div>
      </DashboardShell>
    );
  }

  // Calculate stats
  const totalContacts = campaign.contacts?.length || 0;
  const completedCount = campaign.contacts?.filter(c => c.status === "completed").length || 0;
  const failedCount = campaign.contacts?.filter(c => ["failed", "incomplete", "busy", "no_answer"].includes(c.status)).length || 0;
  
  const interestedCount = campaign.contacts?.filter(c => {
    const resp = (c.response || "").toLowerCase();
    return resp.includes("interested") || resp.includes("appointment") || resp.includes("booked") || c.appointment_date;
  }).length || 0;

  const callbacksCount = campaign.contacts?.filter(c => {
    const status = (c.status || "").toLowerCase();
    const resp = (c.response || "").toLowerCase();
    return status.includes("callback") || resp.includes("callback") || resp.includes("call back");
  }).length || 0;

  // Live Stats calculations (DIALER accumulates)
  const registry = totalContacts;
  const standby = campaign.contacts?.filter(c => c.status === "pending").length || 0;
  const dialer = registry - standby;
  const analysis = campaign.contacts?.filter(c => ["completed", "failed", "busy", "no_answer", "incomplete"].includes(c.status)).length || 0;

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, BadgeVariant> = {
      Completed: "success",
      Running: "info",
      Scheduled: "warning",
      Draft: "neutral",
      Paused: "warning",
      Failed: "error",
    };
    return <Badge variant={variantMap[status] || "neutral"}>{status}</Badge>;
  };

  const columns: Column<any>[] = [
    { key: "name", label: "CONTACT NAME", sortable: true, render: (c) => <span className="font-semibold text-zinc-900 dark:text-white">{c.name}</span> },
    { key: "phone", label: "PHONE NUMBER", sortable: true },
    { key: "type", label: "TYPE", render: () => <Badge variant="neutral">OUTBOUND</Badge> },
    { key: "duration", label: "DURATION", sortable: true, render: (c) => <span>{c.duration ? `${Math.floor(c.duration / 60).toString().padStart(2, "0")}:${(c.duration % 60).toString().padStart(2, "0")}` : "00:00"}</span> },
    { key: "datetime", label: "TIME", sortable: true },
    { key: "credits", label: "CREDITS", sortable: true },
    { key: "response", label: "RESPONSE", sortable: true, render: (c) => {
        const resp = c.response || "—";
        const isInvalid = resp.toLowerCase().includes("invalid") || resp.toLowerCase().includes("fail");
        const isNotInterested = resp.toLowerCase().includes("not interested");
        const isInterested = resp.toLowerCase().includes("interested") || resp.toLowerCase().includes("appointment") || resp.toLowerCase().includes("booked");
        return (
          <Badge variant={isInvalid ? "error" : isInterested ? "success" : "neutral"}>
            {resp}
          </Badge>
        );
      }
    },
    { key: "status", label: "STATUS", sortable: true, render: (c) => {
        const statusMap: Record<string, BadgeVariant> = {
          completed: "success",
          failed: "error",
          busy: "error",
          no_answer: "neutral",
          incomplete: "error",
          pending: "warning",
          calling: "info"
        };
        const displayStatus = c.status === "pending" ? "scheduled" : c.status === "no_answer" ? "no answer" : c.status;
        return <Badge variant={statusMap[c.status] || "neutral"}>{displayStatus}</Badge>;
      }
    }
  ];

  return (
    <DashboardShell title="Campaign Details">
      <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4 overflow-y-auto gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push("/campaign")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 transition shadow-sm"
              title="Back to campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
              {campaign.name}
              {getStatusBadge(campaign.status)}
            </h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 pl-12">
            <Calendar className="h-4 w-4 text-zinc-400" />
            Scheduled for: {formatDateTime(campaign.schedule_date || campaign.schedule)}
          </p>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          {/* Card 1: Total Contacts */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                <User className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Total Contacts</span>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{totalContacts}</h3>
            <p className="text-xs text-zinc-400 mt-1">From: {campaign.sheetName !== "—" ? campaign.sheetName : "CSV Upload"}</p>
          </div>

          {/* Card 2: AI Agent */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <PhoneCall className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">AI Agent</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1.5">{campaign.agent}</h3>
            <p className="text-xs text-zinc-400 mt-2">Active Agent Voice</p>
          </div>

          {/* Card 3: Agent Script */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <FileText className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Agent Script</span>
            </div>
            <div className="rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800 italic line-clamp-2" title={campaign.script}>
              "{campaign.script || "No script configured."}"
            </div>
          </div>
        </div>

        {/* Performance Metrics Box */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] shrink-0">
          <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider mb-6">Performance Metrics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 text-center">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Completed</p>
              <h5 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</h5>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Failed</p>
              <h5 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{failedCount}</h5>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Interested</p>
              <h5 className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{interestedCount}</h5>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Callbacks</p>
              <h5 className="text-2xl font-black text-amber-500 mt-1">{callbacksCount}</h5>
            </div>
            <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Credits Used</p>
              <h5 className="text-2xl font-black text-zinc-950 dark:text-white mt-1">${Number(campaign.creditsUsed || 0).toFixed(2)}</h5>
            </div>
          </div>
        </div>

        {/* Live Journey Panel */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:bg-gradient-to-r dark:from-[#09090b] dark:to-[#130f1c] dark:border-zinc-800/60 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[10px] font-extrabold tracking-widest text-rose-600 dark:text-rose-400 uppercase">Live Journey</span>
            </div>
            <div className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
              Mission Control /
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch justify-between w-full">
            {/* Steps Row */}
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 flex-1">
              {/* Step 1: Registry */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 ring-rose-200 text-rose-500 dark:bg-rose-500/10 dark:ring-rose-500/30">
                  <User className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Registry</p>
                <p className="mt-0.5 text-2xl font-black text-rose-500">{registry}</p>
                <p className="text-[8px] font-medium text-zinc-400">Input detected</p>
              </div>

              <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-rose-400 to-amber-400 self-center opacity-40 dark:opacity-80" />

              {/* Step 2: Standby */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 ring-amber-200 text-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/30">
                  <Calendar className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Standby</p>
                <p className="mt-0.5 text-2xl font-black text-amber-500">{standby}</p>
                <p className="text-[8px] font-medium text-zinc-400">Waiting in queue</p>
              </div>

              <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-amber-400 to-cyan-400 self-center opacity-40 dark:opacity-80" />

              {/* Step 3: Dialer */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 ring-cyan-200 text-cyan-500 dark:bg-cyan-500/10 dark:ring-cyan-500/30">
                  <Zap className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Dialer</p>
                <p className="mt-0.5 text-2xl font-black text-cyan-500">{dialer}</p>
                <p className="text-[8px] font-medium text-zinc-400">Active dialing</p>
              </div>

              <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-400 self-center opacity-40 dark:opacity-80" />

              {/* Step 4: Analysis */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 ring-purple-200 text-purple-500 dark:bg-purple-500/10 dark:ring-purple-500/30">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Analysis</p>
                <p className="mt-0.5 text-2xl font-black text-purple-500">{analysis}</p>
                <p className="text-[8px] font-medium text-zinc-400">Finished calls</p>
              </div>
            </div>

            {/* Vertical connector line (screens >= lg) */}
            <div className="hidden lg:flex w-[2px] bg-gradient-to-b from-purple-400 to-emerald-400 self-stretch my-2 opacity-50" />

            {/* Outcomes stacked column */}
            <div className="flex flex-row lg:flex-col gap-3 justify-center items-center shrink-0 w-full lg:w-[150px]">
              {/* Completed outcome */}
              <div className="relative flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-white py-3 px-4 shadow-sm dark:border-emerald-500/30 dark:bg-[#121217] w-full max-w-[150px]">
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-full bg-emerald-500" />
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
                <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase mt-0.5">Completed</p>
              </div>

              {/* No Answer outcome */}
              <div className="relative flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-white py-3 px-4 shadow-sm dark:border-blue-500/30 dark:bg-[#121217] w-full max-w-[150px]">
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-full bg-blue-500" />
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{failedCount}</p>
                <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase mt-0.5">No Answer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Call Logs Table Section */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Campaign Call Logs</h2>
          </div>
          <div>
            <DataTable 
              data={campaign.contacts || []}
              columns={columns}
              searchableKeys={["name", "phone", "response", "status"]}
              exportFileName={`${campaign.name}_call_logs.xlsx`}
            />
          </div>
        </section>

      </div>
    </DashboardShell>
  );
}
