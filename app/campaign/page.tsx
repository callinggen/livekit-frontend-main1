"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import DetailsDrawer from "@/components/shared/DetailsDrawer";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { Calendar, PhoneCall, CheckCircle2, FileText, PauseCircle, PlayCircle, StopCircle, AlertTriangle } from "lucide-react";
import { api, CampaignRow, CampaignDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";

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

interface Campaign extends CampaignRow {
  pause_reason?: string;
}

const getStatusBadge = (status: string) => {
  const variantMap: Record<string, BadgeVariant> = {
    Completed: "success",
    Running: "info",
    Scheduled: "warning",
    Draft: "neutral",
    Paused: "warning",
    Stopped: "error",
    Failed: "error",
  };
  return <Badge variant={variantMap[status] || "neutral"}>{status}</Badge>;
};

export default function CampaignsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<CampaignDetail | null>(null);

  // Pagination for contacts in details drawer
  const [contactPage, setContactPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");

  const loadCampaigns = () =>
    api.getCampaigns()
      .then(data => {
        setCampaigns(data ? (data as Campaign[]) : []);
      })
      .catch(err => {
        console.warn("Failed to load campaigns:", err);
        setCampaigns([]);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    if (selectedCampaign) {
      api.getCampaign(Number(selectedCampaign.id), contactPage, 50, contactSearch)
        .then(data => setSelectedCampaignDetail(data))
        .catch(err => console.error("Failed to load campaign details:", err));
    } else {
      setSelectedCampaignDetail(null);
    }
  }, [selectedCampaign, contactPage, contactSearch]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handlePause = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(id);
      await api.pauseCampaign(id);
      await loadCampaigns();
      if (selectedCampaign && Number(selectedCampaign.id) === id) {
        const updated = await api.getCampaign(id, contactPage, 50, contactSearch);
        setSelectedCampaignDetail(updated);
      }
    } catch (err) {
      alert("Failed to pause campaign: " + err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setActionLoading(id);
      await api.resumeCampaign(id);
      await loadCampaigns();
      if (selectedCampaign && Number(selectedCampaign.id) === id) {
        const updated = await api.getCampaign(id, contactPage, 50, contactSearch);
        setSelectedCampaignDetail(updated);
      }
    } catch (err) {
      alert("Failed to resume campaign: " + err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to stop this campaign? Any uncalled contacts will be cancelled.")) return;
    try {
      setActionLoading(id);
      await api.stopCampaign(id);
      await loadCampaigns();
      if (selectedCampaign && Number(selectedCampaign.id) === id) {
        const updated = await api.getCampaign(id, contactPage, 50, contactSearch);
        setSelectedCampaignDetail(updated);
      }
    } catch (err) {
      alert("Failed to stop campaign: " + err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isLoggedIn) return null;

  const columns: Column<Campaign>[] = [
    { key: "name", label: "Campaign Name", sortable: true, render: (c) => <span className="font-semibold text-zinc-900 dark:text-white">{c.name}</span> },
    { key: "date", label: "Date", sortable: true, render: (c) => <span>{formatDateTime(c.date)}</span> },
    { key: "totalCalls", label: "Total Calls", sortable: true, render: (c) => <span className="font-mono">{c.totalCalls}</span> },
    { key: "completedCalls", label: "Completed", sortable: true, render: (c) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{c.completedCalls}</span> },
    { key: "creditsUsed", label: "Credits", sortable: true, render: (c) => <span className="font-mono">{c.creditsUsed}</span> },
    { key: "agent", label: "AI Agent", sortable: true },
    { key: "status", label: "Status", sortable: true, render: (c) => getStatusBadge(c.status) },
    {
      key: "actions",
      label: "Controls",
      render: (c) => {
        const idNum = Number(c.id);
        const isBusy = actionLoading === idNum;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {c.status === "Running" && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={(e) => handlePause(idNum, e)}
                className="h-8 gap-1 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}

            {(c.status === "Paused" || c.status === "Scheduled") && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={(e) => handleResume(idNum, e)}
                className="h-8 gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}

            {(c.status === "Running" || c.status === "Paused") && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={(e) => handleStop(idNum, e)}
                className="h-8 gap-1 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <StopCircle className="h-3.5 w-3.5" />
                Stop
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // Stats
  const totalCampaigns = campaigns.length;
  const running = campaigns.filter(c => c.status === "Running").length;
  const scheduled = campaigns.filter(c => c.status === "Scheduled").length;
  const completed = campaigns.filter(c => c.status === "Completed").length;
  const paused = campaigns.filter(c => c.status === "Paused").length;

  if (loading) {
    return (
      <DashboardShell title="Campaigns">
        <div className="flex items-center justify-center h-64 text-zinc-500">Loading campaigns...</div>
      </DashboardShell>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Error loading campaign page">
      <DashboardShell title="Campaigns">
        <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4 overflow-y-auto">
          
          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4 shrink-0">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Total Campaigns</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{totalCampaigns}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <PhoneCall className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Running</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{running}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Paused / Scheduled</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{paused + scheduled}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500">Completed</p>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{completed}</h3>
              </div>
            </div>

            <div className="flex items-center justify-end col-span-2 sm:col-span-1">
              <Button
                onClick={() => router.push("/dashboard/call-manager")}
                className="w-full sm:w-auto h-12 gap-2 rounded-xl bg-violet-600 font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700"
              >
                <PlayCircle className="h-5 w-5" />
                Launch Campaign
              </Button>
            </div>
          </div>

          {/* Main Data Table */}
          <div className="flex-1 min-h-[400px]">
            <DataTable
              data={campaigns}
              columns={columns}
              searchableKeys={["name", "agent", "status"]}
              filters={[
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { label: "Running", value: "Running" },
                    { label: "Paused", value: "Paused" },
                    { label: "Completed", value: "Completed" },
                    { label: "Scheduled", value: "Scheduled" },
                    { label: "Stopped", value: "Stopped" },
                  ],
                },
              ]}
              exportFileName="campaigns.xlsx"
              onRowClick={(campaign) => {
                setSelectedCampaign(campaign);
                setContactPage(1);
                setContactSearch("");
              }}
              emptyStateMessage="No campaigns found"
              emptyStateSubMessage="Create your first campaign from Call Manager to get started."
            />
          </div>
        </div>

        {/* Campaign Detail Drawer */}
        <DetailsDrawer
          isOpen={!!selectedCampaign}
          onClose={() => {
            setSelectedCampaign(null);
            setSelectedCampaignDetail(null);
          }}
          title={selectedCampaign?.name || "Campaign Details"}
        >
          {selectedCampaign && (
            <div className="space-y-6">
              
              {/* Header Info & Control Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedCampaign.status)}
                  <span className="text-sm font-medium text-zinc-500">ID: #{selectedCampaign.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCampaign.status === "Running" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(Number(selectedCampaign.id))}
                      className="gap-1 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <PauseCircle className="h-4 w-4" />
                      Pause Campaign
                    </Button>
                  )}

                  {(selectedCampaign.status === "Paused" || selectedCampaign.status === "Scheduled") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResume(Number(selectedCampaign.id))}
                      className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Resume Campaign
                    </Button>
                  )}

                  {(selectedCampaign.status === "Running" || selectedCampaign.status === "Paused") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStop(Number(selectedCampaign.id))}
                      className="gap-1 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                    >
                      <StopCircle className="h-4 w-4" />
                      Stop Campaign
                    </Button>
                  )}
                </div>
              </div>

              {/* Auto-Pause Warning Alert Banner */}
              {selectedCampaignDetail?.pause_reason && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">Campaign Auto-Paused Failsafe Triggered</h4>
                    <p className="text-xs mt-1 text-amber-800 dark:text-amber-300">{selectedCampaignDetail.pause_reason}</p>
                  </div>
                </div>
              )}

              {/* Overview & Config */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Overview</h3>
                  <div className="space-y-3 text-sm">
                    <div><span className="text-zinc-500 text-xs">Created Date</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{formatDateTime(selectedCampaign.date)}</p></div>
                    <div><span className="text-zinc-500 text-xs">Schedule</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{formatDateTime(selectedCampaign.schedule)}</p></div>
                    <div><span className="text-zinc-500 text-xs">AI Agent</span><p className="font-semibold text-zinc-900 dark:text-white mt-1">{selectedCampaign.agent}</p></div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Configuration</h3>
                  <div className="mb-4">
                    <span className="text-zinc-500 text-xs">Agent Script</span>
                    <div className="mt-2 rounded-lg bg-white p-3 text-sm text-zinc-700 shadow-sm dark:bg-[#121622] dark:text-zinc-300 italic border border-zinc-100 dark:border-zinc-800 max-h-32 overflow-y-auto">
                      "{selectedCampaign.script}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                  <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Total Contacts</span><p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{selectedCampaignDetail?.job?.total_contacts ?? selectedCampaign.totalCalls}</p></div>
                  <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Completed</span><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedCampaignDetail?.job?.completed_contacts ?? selectedCampaign.completedCalls}</p></div>
                  <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Failed / Unreached</span><p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{selectedCampaignDetail?.job?.failed_contacts ?? selectedCampaign.failedCalls}</p></div>
                  <div className="rounded-lg bg-white border border-zinc-100 p-3 shadow-sm dark:bg-[#121622] dark:border-zinc-800"><span className="text-zinc-500 text-xs">Credits Used</span><p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{selectedCampaignDetail?.creditsUsed ?? selectedCampaign.creditsUsed}</p></div>
                </div>
              </div>

              {/* Call Logs Table */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Campaign Call Logs</h3>
                  
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setContactPage(1);
                      }}
                      placeholder="Search contacts..."
                      className="block w-full px-3 py-1.5 border border-zinc-200 rounded-lg bg-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-[#121622] dark:border-zinc-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121622]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Contact Name</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Phone Number</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Response</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-transparent">
                        {selectedCampaignDetail?.contacts?.map((contact) => (
                          <tr key={contact.id}>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{contact.name || (contact as any).customer_name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono text-xs">{contact.phone}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(contact.status === "pending" ? "Scheduled" : contact.status.charAt(0).toUpperCase() + contact.status.slice(1))}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-300">{contact.response || "—"}</td>
                          </tr>
                        ))}
                        {(!selectedCampaignDetail?.contacts || selectedCampaignDetail.contacts.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                              {selectedCampaignDetail ? "No contacts found matching filter." : "Loading contacts..."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Drawer Contacts Pagination Controls */}
                  {selectedCampaignDetail && (selectedCampaignDetail.pages ?? 1) > 1 && (
                    <div className="flex items-center justify-between p-3 border-t border-zinc-100 dark:border-zinc-800 text-xs bg-zinc-50 dark:bg-zinc-900/30">
                      <span className="text-zinc-500">
                        Page {contactPage} of {selectedCampaignDetail.pages} ({selectedCampaignDetail.total} total)
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={contactPage <= 1}
                          onClick={() => setContactPage(p => Math.max(1, p - 1))}
                          className="h-7 text-xs px-2"
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={contactPage >= (selectedCampaignDetail.pages ?? 1)}
                          onClick={() => setContactPage(p => p + 1)}
                          className="h-7 text-xs px-2"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </DetailsDrawer>
      </DashboardShell>
    </ErrorBoundary>
  );
}
