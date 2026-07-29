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

export default function CampaignsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<CampaignDetail | null>(null);

  useEffect(() => {
    if (selectedCampaign) {
      api.getCampaign(Number(selectedCampaign.id))
        .then(data => setSelectedCampaignDetail(data))
        .catch(err => console.error("Failed to load campaign details:", err));
    } else {
      setSelectedCampaignDetail(null);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    // BUG-024: Poll every 10s while any campaign is Running
    const load = () =>
      api.getCampaigns()
        .then(data => {
          setCampaigns(data ? (data as Campaign[]) : []);
        })
        .catch(err => {
          console.warn("Failed to load campaigns:", err);
          setCampaigns([]);
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
    { key: "date", label: "Date", sortable: true, render: (c) => <span>{formatDateTime(c.date)}</span> },
    { key: "sheetName", label: "Data Source", sortable: true, render: (c) => <span className="text-xs text-zinc-500">{c.sheetName}</span> },
    { key: "totalCalls", label: "Total Calls", sortable: true, render: (c) => <span className="font-mono">{c.totalCalls}</span> },
    { key: "creditsUsed", label: "Credits", sortable: true, render: (c) => <span className="font-mono">{c.creditsUsed}</span> },
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overview */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50 relative">
                <div className="absolute top-5 right-5">
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Overview</h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                  <div><span className="text-zinc-500 text-xs">Name</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{selectedCampaign.name}</p></div>
                  <div><span className="text-zinc-500 text-xs">Created Date</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{formatDateTime(selectedCampaign.date)}</p></div>
                  <div><span className="text-zinc-500 text-xs">Schedule</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{formatDateTime(selectedCampaign.schedule)}</p></div>
                  <div><span className="text-zinc-500 text-xs">AI Agent</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{selectedCampaign.agent}</p></div>
                </div>
              </div>

              {/* Configuration */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Configuration</h3>
                <div className="mb-4">
                  <span className="text-zinc-500 text-xs">Upload Source</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-300 mt-1">{selectedCampaign.uploadSource} ({selectedCampaign.sheetName})</p>
                </div>
                <div className="mb-4">
                  <span className="text-zinc-500 text-xs">Agent Script</span>
                  <div className="mt-2 rounded-lg bg-white p-3 text-sm text-zinc-700 shadow-sm dark:bg-[#121622] dark:text-zinc-300 italic border border-zinc-100 dark:border-zinc-800">
                    "{selectedCampaign.script}"
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Notes</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-300 mt-1">{selectedCampaign.notes}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-6 text-sm">
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Total Contacts</span><p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{selectedCampaign.totalCalls}</p></div>
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Completed</span><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedCampaign.completedCalls}</p></div>
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Failed</span><p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{selectedCampaign.failedCalls}</p></div>
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Interested</span><p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{selectedCampaign.interested}</p></div>
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Callbacks</span><p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{selectedCampaign.callbacks}</p></div>
                <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Credits Used</span><p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{selectedCampaign.creditsUsed}</p></div>
              </div>
            </div>

            {/* Call Logs */}
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Call Logs</h3>
              
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-zinc-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                  </div>
                  <input type="text" placeholder="Search..." className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 dark:bg-[#121622] dark:border-zinc-800" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-zinc-200 rounded-lg bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-[#121622] dark:hover:bg-zinc-800">
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Export
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121622]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact Name</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone Number</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Duration</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-transparent">
                      {selectedCampaignDetail?.contacts?.map((contact) => (
                        <tr key={contact.id}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{contact.name || (contact as any).customer_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">{contact.phone}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(contact.status === "pending" ? "Scheduled" : contact.status.charAt(0).toUpperCase() + contact.status.slice(1))}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                            {contact.duration ? `${Math.floor(contact.duration / 60).toString().padStart(2, "0")}:${(contact.duration % 60).toString().padStart(2, "0")}` : "00:00"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">{formatDateTime(contact.datetime || selectedCampaign.schedule)}</td>
                        </tr>
                      ))}
                      {(!selectedCampaignDetail?.contacts || selectedCampaignDetail.contacts.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                            {selectedCampaignDetail ? "No contacts found." : "Loading contacts..."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </DetailsDrawer>
    </DashboardShell>
  );
}
