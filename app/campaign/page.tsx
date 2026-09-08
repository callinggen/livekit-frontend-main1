"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import DetailsDrawer from "@/components/shared/DetailsDrawer";
import { Calendar, PhoneCall, CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { api, CampaignRow, CampaignDetail } from "@/lib/api";

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

interface Campaign extends CampaignRow {}

const getStatusBadge = (status: string) => {
  const norm = (status || "").toLowerCase();
  if (norm === "completed" || norm === "finished") {
    return <Badge variant="success">Completed</Badge>;
  }
  if (norm === "running" || norm === "in_progress") {
    return <Badge variant="info">Running</Badge>;
  }
  if (norm === "scheduled" || norm === "pending") {
    return <Badge variant="warning">Scheduled</Badge>;
  }
  if (norm === "paused") {
    return <Badge variant="warning">Paused</Badge>;
  }
  if (norm === "failed") {
    return <Badge variant="error">Failed</Badge>;
  }
  if (norm === "incomplete") {
    return <Badge variant="error">Incomplete</Badge>;
  }
  if (norm === "stopped") {
    return <Badge variant="neutral">Stopped</Badge>;
  }
  return <Badge variant="neutral">{status || "Draft"}</Badge>;
};

export default function CampaignsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = () => {
      api.getCampaigns("normal")
        .then((normalData) => {
          setCampaigns(normalData ? (normalData as Campaign[]) : []);
        })
        .catch(err => {
          console.warn("Failed to load campaigns:", err);
        })
        .finally(() => setLoading(false));
    };

    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const columns: Column<Campaign>[] = [
    { key: "name", label: "Campaign Name", sortable: true, render: (c) => <span className="font-semibold text-zinc-900 dark:text-white">{c.name}</span> },
    { key: "date", label: "Date", sortable: true, render: (c) => <span>{formatDateTime(c.date)}</span> },
    { key: "sheetName", label: "Data Source", sortable: true, render: (c) => <span className="text-xs text-zinc-500">{c.sheetName}</span> },
    { key: "totalCalls", label: "Total Calls", sortable: true, render: (c) => <span className="font-mono">{c.totalCalls}</span> },
    { key: "creditsUsed", label: "Credits", sortable: true, render: (c) => <span className="font-mono">{Number(c.creditsUsed || 0)}</span> },
    { key: "agent", label: "AI Agent", sortable: true },
    { key: "status", label: "Status", sortable: true, render: (c) => getStatusBadge(c.status) },
  ];

  const isCompletedCampaign = (status: string) => {
    const s = (status || "").toLowerCase();
    return ["completed", "failed", "incomplete", "stopped", "finished"].includes(s);
  };

  const isActiveCampaign = (status: string) => {
    const s = (status || "").toLowerCase();
    return ["running", "scheduled", "draft", "paused", "pending", "in_progress"].includes(s);
  };

  // Stats
  const totalCampaigns = campaigns.length;
  const running = campaigns.filter(c => (c.status || "").toLowerCase() === "running" || (c.status || "").toLowerCase() === "in_progress").length;
  const scheduled = campaigns.filter(c => ["scheduled", "pending"].includes((c.status || "").toLowerCase())).length;
  const completed = campaigns.filter(c => isCompletedCampaign(c.status)).length;
  const draft = campaigns.filter(c => ["draft", "paused"].includes((c.status || "").toLowerCase())).length;

  const activeCampaignsData = campaigns.filter(c => isActiveCampaign(c.status));
  const completedCampaignsData = campaigns.filter(c => !isActiveCampaign(c.status));

  if (loading) {
    return (
      <DashboardShell title="Campaigns">
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading campaigns...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Campaigns">
      <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4 overflow-y-auto">
        
        {/* Statistics Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 shrink-0">
          <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-violet-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalCampaigns}</h3>
          </div>
          <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-blue-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <PlayCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Running</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{running}</h3>
          </div>
          <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-amber-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Scheduled</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{scheduled}</h3>
          </div>
          <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-emerald-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Completed</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{completed}</h3>
          </div>
          <div className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-zinc-600">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Drafts</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{draft}</h3>
          </div>
        </div>

        {/* Active & Scheduled Campaigns Table Section */}
        <section className="flex flex-col gap-4 mb-8 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Active & Scheduled Campaigns</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage your upcoming and running call campaigns. Click on a campaign to view details.
            </p>
          </div>
          <div>
            <DataTable 
              data={activeCampaignsData}
              columns={columns}
              searchableKeys={["name", "agent", "sheetName"]}
              filters={[
                { key: "status", label: "Status", options: [{label: "Running", value: "Running"}, {label: "Scheduled", value: "Scheduled"}, {label: "Draft", value: "Draft"}, {label: "Paused", value: "Paused"}] },
                { key: "agent", label: "Agent", options: Array.from(new Set(activeCampaignsData.map(c => c.agent))).filter(Boolean).map(a => ({ label: a, value: a })) }
              ]}
              exportFileName="active_campaigns_export.xlsx"
              onRowClick={(c) => router.push(`/campaign/${c.id}`)}
            />
          </div>
        </section>

        {/* Completed Campaigns Table Section */}
        <section className="flex flex-col gap-4 mb-8 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Completed Campaigns</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Review performance and history of finished campaigns. Click on a campaign to view details.
            </p>
          </div>
          <div>
            <DataTable 
              data={completedCampaignsData}
              columns={columns}
              searchableKeys={["name", "agent", "sheetName"]}
              filters={[
                { key: "status", label: "Status", options: [{label: "Completed", value: "Completed"}, {label: "Incomplete", value: "Incomplete"}, {label: "Failed", value: "Failed"}, {label: "Stopped", value: "Stopped"}] },
                { key: "agent", label: "Agent", options: Array.from(new Set(completedCampaignsData.map(c => c.agent))).filter(Boolean).map(a => ({ label: a, value: a })) }
              ]}
              exportFileName="completed_campaigns_export.xlsx"
              onRowClick={(c) => router.push(`/campaign/${c.id}`)}
            />
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
