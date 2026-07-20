"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import DetailsDrawer from "@/components/shared/DetailsDrawer";
import { Calendar, PhoneCall, CheckCircle2, FileText, PlayCircle } from "lucide-react";
import { api, CampaignRow } from "@/lib/api";

interface Campaign extends CampaignRow {}

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

const DUMMY_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Q3 Marketing Outreach",
    date: "2026-07-10",
    schedule: "2026-07-10 09:00 AM",
    sheetName: "q3_leads.xlsx",
    totalCalls: 15,
    completedCalls: 12,
    failedCalls: 3,
    interested: 4,
    callbacks: 2,
    creditsUsed: 14.50,
    agent: "Voice-A (Sales)",
    status: "Completed",
    script: "Introduce CallingGen to businesses...",
    uploadSource: "Excel Upload",
    notes: "Follow up with interested leads next week."
  },
  {
    id: "2",
    name: "Summer Feedback Campaign",
    date: "2026-07-12",
    schedule: "2026-07-12 02:30 PM",
    sheetName: "summer_customers.csv",
    totalCalls: 30,
    completedCalls: 28,
    failedCalls: 2,
    interested: 18,
    callbacks: 4,
    creditsUsed: 29.10,
    agent: "Voice-B (Support)",
    status: "Running",
    script: "Ask about product satisfaction...",
    uploadSource: "CSV Upload",
    notes: "Ongoing polling."
  }
];

export default function CampaignsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    // BUG-024: Poll every 10s while any campaign is Running
    const load = () =>
      api.getCampaigns()
        .then(data => {
          if (data && data.length > 0) {
            setCampaigns(data as Campaign[]);
          } else {
            setCampaigns(DUMMY_CAMPAIGNS);
          }
        })
        .catch(err => {
          console.warn("Failed to load campaigns:", err);
          setCampaigns(DUMMY_CAMPAIGNS);
        })
        .finally(() => setLoading(false));

    load();
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  const columns: Column<Campaign>[] = [
    { key: "name", label: "Campaign Name", sortable: true, render: (c) => <span className="font-semibold text-zinc-900 dark:text-white">{c.name}</span> },
    { key: "date", label: "Date", sortable: true },
    { key: "sheetName", label: "Data Source", sortable: true, render: (c) => <span className="text-xs text-zinc-500">{c.sheetName}</span> },
    { key: "totalCalls", label: "Total Calls", sortable: true, render: (c) => <span className="font-mono">{c.totalCalls}</span> },
    { key: "creditsUsed", label: "Credits", sortable: true, render: (c) => <span className="font-mono">${c.creditsUsed.toFixed(2)}</span> },
    { key: "agent", label: "AI Agent", sortable: true },
    { key: "status", label: "Status", sortable: true, render: (c) => getStatusBadge(c.status) },
  ];

  // Stats
  const totalCampaigns = campaigns.length;
  const running = campaigns.filter(c => c.status === "Running").length;
  const scheduled = campaigns.filter(c => c.status === "Scheduled").length;
  const completed = campaigns.filter(c => c.status === "Completed").length;
  const draft = campaigns.filter(c => c.status === "Draft").length;

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

        {/* Table Section */}
        <section className="flex flex-col flex-1 gap-4 min-h-[500px]">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">All Campaigns</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage your call campaigns, track live progress, and review past performance.
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <DataTable 
              data={campaigns}
              columns={columns}
              searchableKeys={["name", "agent", "sheetName"]}
              filters={[
                { key: "status", label: "Status", options: [{label: "Running", value: "Running"}, {label: "Scheduled", value: "Scheduled"}, {label: "Completed", value: "Completed"}, {label: "Draft", value: "Draft"}] },
                // BUG-025: derive agent options dynamically from actual loaded campaigns
                { key: "agent", label: "Agent", options: Array.from(new Set(campaigns.map(c => c.agent))).filter(Boolean).map(a => ({ label: a, value: a })) }
              ]}
              exportFileName="campaigns_export.xlsx"
              onRowClick={setSelectedCampaign}
            />
          </div>
        </section>
      </div>

      <DetailsDrawer
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        title="Campaign Details"
      >
        {selectedCampaign && (
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Overview</h3>
                {getStatusBadge(selectedCampaign.status)}
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                <div><span className="text-zinc-500">Name</span><p className="font-semibold dark:text-white">{selectedCampaign.name}</p></div>
                <div><span className="text-zinc-500">Created Date</span><p className="font-semibold dark:text-white">{selectedCampaign.date}</p></div>
                <div><span className="text-zinc-500">Schedule</span><p className="font-semibold dark:text-white">{selectedCampaign.schedule}</p></div>
                <div><span className="text-zinc-500">AI Agent</span><p className="font-semibold dark:text-white">{selectedCampaign.agent}</p></div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Total Contacts</span><p className="text-lg font-bold dark:text-white">{selectedCampaign.totalCalls}</p></div>
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Completed</span><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedCampaign.completedCalls}</p></div>
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Failed</span><p className="text-lg font-bold text-red-600 dark:text-red-400">{selectedCampaign.failedCalls}</p></div>
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Interested</span><p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedCampaign.interested}</p></div>
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Callbacks</span><p className="text-lg font-bold text-amber-600 dark:text-amber-400">{selectedCampaign.callbacks}</p></div>
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#121622]"><span className="text-zinc-500 text-xs">Credits Used</span><p className="text-lg font-bold text-zinc-900 dark:text-white">${selectedCampaign.creditsUsed.toFixed(2)}</p></div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Configuration</h3>
              <div className="mb-4">
                <span className="text-zinc-500 text-sm">Upload Source</span>
                <p className="font-medium dark:text-zinc-300 mt-1">{selectedCampaign.uploadSource} ({selectedCampaign.sheetName})</p>
              </div>
              <div className="mb-4">
                <span className="text-zinc-500 text-sm">Agent Script</span>
                <div className="mt-2 rounded-lg bg-white p-3 text-sm text-zinc-700 shadow-sm dark:bg-[#121622] dark:text-zinc-300 italic">
                  "{selectedCampaign.script}"
                </div>
              </div>
              <div>
                <span className="text-zinc-500 text-sm">Notes</span>
                <p className="font-medium dark:text-zinc-300 mt-1">{selectedCampaign.notes}</p>
              </div>
            </div>
          </div>
        )}
      </DetailsDrawer>
    </DashboardShell>
  );
}
