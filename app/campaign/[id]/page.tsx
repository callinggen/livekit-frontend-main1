"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import { 
  ArrowLeft, Calendar, User, FileText, CheckCircle2, 
  PhoneCall, Clock, Database
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

const formatTimeOnly = (dateString: string | undefined | null) => {
  if (!dateString) return "—";
  try {
    const cleanStr = dateString.replace(" UTC", "");
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return "—";
  }
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Enrich contacts with datetime and credits from matched call records
  const enrichedContacts = useMemo(() => {
    if (!campaign || !campaign.contacts) return [];
    return campaign.contacts.map(contact => {
      const matchingCall = calls.find(call => {
        const cleanCallPhone = (call.phone || "").replace(/\D/g, "");
        const cleanContactPhone = (contact.phone || "").replace(/\D/g, "");
        return cleanCallPhone === cleanContactPhone && cleanContactPhone !== "";
      });
      return {
        ...contact,
        datetime: matchingCall ? matchingCall.datetime : (contact.datetime || ""),
        credits: matchingCall ? (matchingCall.creditsDeducted ?? 0) : (contact.credits ?? 0)
      };
    });
  }, [campaign, calls]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn || !id) return;
    let active = true;

    const fetchDetail = async () => {
      try {
        const [data, callsData] = await Promise.all([
          api.getCampaign(Number(id)),
          api.getCalls().catch(() => [])
        ]);
        if (active) {
          setCampaign(data);
          setCalls(callsData || []);
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
        <div className="flex items-center justify-center h-64 text-zinc-500 font-medium">
          Loading campaign details...
        </div>
      </DashboardShell>
    );
  }

  if (!campaign) {
    return (
      <DashboardShell title="Campaign Details">
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4">
          <p className="font-semibold text-lg">Campaign not found.</p>
          <button 
            onClick={() => router.push("/campaign")}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg hover:bg-zinc-50 font-medium text-zinc-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </button>
        </div>
      </DashboardShell>
    );
  }


  // Calculate statistics
  const totalContacts = enrichedContacts.length || 0;
  const dialedCount = enrichedContacts.filter((c: any) => c.status !== "pending").length || 0;
  const connectedCount = enrichedContacts.filter((c: any) => c.status === "completed").length || 0;
  const disconnectedCount = dialedCount - connectedCount;
  
  const interestedCount = enrichedContacts.filter((c: any) => {
    const resp = (c.response || "").toLowerCase();
    return resp.includes("interested") && !resp.includes("not interested");
  }).length || 0;

  const notInterestedCount = enrichedContacts.filter((c: any) => {
    const resp = (c.response || "").toLowerCase();
    return resp.includes("not interested") || resp.includes("decline") || resp.includes("reject");
  }).length || 0;

  const hotLeadsCount = enrichedContacts.filter((c: any) => {
    const resp = (c.response || "").toLowerCase();
    return resp.includes("appointment") || resp.includes("booked") || c.appointment_date;
  }).length || 0;

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

  // Determine Data Source dynamic display - strictly map to the 4 categories
  let dataSourceTitle = "Excel File"; // default
  let dataSourceLabel = "From Upload Source";

  if (campaign.upload_source === "excel" || campaign.upload_source === "csv_excel") {
    dataSourceTitle = "Excel File";
    dataSourceLabel = campaign.sheet_name || campaign.sheetName || "Excel Upload";
  } else if (campaign.upload_source === "csv") {
    dataSourceTitle = "CSV File";
    dataSourceLabel = campaign.sheet_name || campaign.sheetName || "CSV Upload";
  } else if (campaign.upload_source === "google_sheet") {
    dataSourceTitle = "Google Sheet Link";
    dataSourceLabel = campaign.sheet_name || campaign.sheetName || "Google Sheets Link";
  } else if (campaign.upload_source === "single") {
    dataSourceTitle = "Single Contact";
    const contact = campaign.contacts && campaign.contacts[0];
    dataSourceLabel = contact ? `${contact.name} (${contact.phone})` : "Manual Entry";
  } else {
    // Legacy fallback based on name patterns
    const sName = (campaign.sheet_name || campaign.sheetName || "").toLowerCase();
    if (sName.endsWith(".csv")) {
      dataSourceTitle = "CSV File";
      dataSourceLabel = campaign.sheet_name || campaign.sheetName || "CSV Upload";
    } else if (sName.endsWith(".xlsx") || sName.endsWith(".xls")) {
      dataSourceTitle = "Excel File";
      dataSourceLabel = campaign.sheet_name || campaign.sheetName || "Excel Upload";
    } else if (sName.includes("sheet") || sName.includes("google")) {
      dataSourceTitle = "Google Sheet Link";
      dataSourceLabel = campaign.sheet_name || campaign.sheetName || "Google Sheets Link";
    } else if (campaign.contacts && campaign.contacts.length === 1) {
      dataSourceTitle = "Single Contact";
      const contact = campaign.contacts[0];
      dataSourceLabel = `${contact.name} (${contact.phone})`;
    } else {
      dataSourceTitle = "Excel File";
      dataSourceLabel = campaign.sheet_name || campaign.sheetName || "Bulk Upload";
    }
  }

  // Determine Duration runtime logs based on Campaign Schedule time and Contact call log durations
  let startedText = "—";
  let endedText = "—";

  const schedTime = campaign.schedule_date || campaign.schedule || campaign.date;
  if (schedTime) {
    try {
      const cleanStr = schedTime.replace(" UTC", "");
      const startDate = new Date(cleanStr);
      if (!isNaN(startDate.getTime())) {
        startedText = startDate.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Sum up the duration of all calls in the campaign from contacts (in seconds)
        const totalDurationSeconds = enrichedContacts.reduce((acc: number, c: any) => acc + Number(c.duration || 0), 0) || 0;

        if (campaign.status === "Running") {
          endedText = "In Progress";
        } else if (campaign.status === "Scheduled" || campaign.status === "pending") {
          endedText = "Scheduled";
        } else {
          // Campaign is Completed / Failed
          const endDate = new Date(startDate.getTime() + totalDurationSeconds * 1000);
          endedText = endDate.toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
    } catch (err) {
      console.error("Failed to calculate campaign duration:", err);
    }
  }

  const columns: Column<any>[] = [
    { key: "name", label: "CONTACT NAME", sortable: true, render: (c) => <span className="font-semibold text-zinc-900 dark:text-white">{c.name}</span> },
    { key: "phone", label: "PHONE NUMBER", sortable: true },
    { key: "type", label: "TYPE", render: () => <Badge variant="neutral">OUTBOUND</Badge> },
    { key: "duration", label: "DURATION", sortable: true, render: (c) => {
        const dur = Number(c.duration || 0);
        return <span>{dur ? `${Math.floor(dur / 60).toString().padStart(2, "0")}:${(dur % 60).toString().padStart(2, "0")}` : "00:00"}</span>;
      }
    },
    { key: "datetime", label: "TIME", sortable: true, render: (c) => <span>{c.datetime || "—"}</span> },
    { key: "credits", label: "CREDITS", sortable: true, render: (c) => <span>{c.credits !== undefined && c.credits !== null ? c.credits : "—"}</span> },
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
        const displayStatus = c.status === "pending" ? "scheduled" : c.status;
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 transition shadow-sm text-zinc-600 dark:text-zinc-400"
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

        {/* Top Info Cards (4 Cards Row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {/* Card 1: Total Contacts */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                <User className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Total Contacts</span>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{totalContacts}</h3>
          </div>

          {/* Card 2: Data Source */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Data Source</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate" title={dataSourceTitle}>{dataSourceTitle}</h3>
            <p className="text-xs text-zinc-400 mt-1.5">{dataSourceLabel}</p>
          </div>

          {/* Card 3: AI Agent */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <PhoneCall className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">AI Agent</span>
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white truncate" title={campaign.agent}>{campaign.agent}</h3>
          </div>

          {/* Card 4: Duration */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] transition hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Duration</span>
            </div>
            <div className="flex flex-col gap-1 mt-1 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Started:</span> {startedText}
              </div>
              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">Ended:</span> {endedText}
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics Box */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] shrink-0 transition hover:shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            <h4 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Performance Metrics</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 text-center lg:text-left">
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">DIALED</p>
              <h5 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{dialedCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">CONNECTED</p>
              <h5 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{connectedCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">DISCONNECTED</p>
              <h5 className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">{disconnectedCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">INTERESTED</p>
              <h5 className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{interestedCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">NOT INTERESTED</p>
              <h5 className="text-2xl font-black text-zinc-500 dark:text-zinc-400 mt-1">{notInterestedCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">HOT LEADS</p>
              <h5 className="text-2xl font-black text-orange-500 dark:text-orange-400 mt-1">{hotLeadsCount}</h5>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">CREDITS USED</p>
              <h5 className="text-2xl font-black text-zinc-950 dark:text-white mt-1">${Number(campaign.creditsUsed || 0).toFixed(2)}</h5>
            </div>
          </div>
        </div>

        {/* Campaign Call Logs Table Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Contact Details & Call Logs</h2>
          </div>
          <div>
            <DataTable 
              data={enrichedContacts}
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
