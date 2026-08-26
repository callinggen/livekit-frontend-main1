"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import DataTable, { Column } from "@/components/shared/DataTable";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import { 
  ArrowLeft, Calendar, User, FileText, CheckCircle2, 
  XCircle, HelpCircle, PhoneCall, Zap, Award, MessageSquare, Send,
  Clock, Database, PlayCircle, X, Phone
} from "lucide-react";
import { api, CampaignDetail } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

const getPillColor = (val: string, type: "response" | "status" | "category" | "type") => {
  if (type === "type") return val === "INBOUND" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200";
  
  const v = (val || "").toUpperCase();
  if (v.includes("DO NOT CALL") || v.includes("REFUSAL") || v === "NOT INTERESTED" || v === "INVALID" || v === "FAILED" || v.includes("CUT")) {
    return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200";
  }
  if (v === "INTERESTED" || v === "HOT" || v === "COMPLETED" || v.includes("BOOKED")) {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200";
  }
  if (v === "CALLBACK" || v === "WARM" || v === "RUNNING") {
    return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200";
  }
  if (v === "COLD" || v === "NO ANSWER") {
    return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200";
  }
  return "bg-gray-50 text-gray-600 border-gray-200";
};

const renderTranscript = (transcriptData: any) => {
  if (!transcriptData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
        <p className="text-sm text-zinc-500 italic">No transcript available for this call.</p>
      </div>
    );
  }

  // Case 1: transcriptData is a string
  if (typeof transcriptData === "string") {
    const lines = transcriptData.split("\n").filter(line => line.trim() !== "");
    if (lines.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500 italic">No transcript available for this call.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto p-4 rounded-xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-800/50 dark:bg-zinc-950/10">
        {lines.map((line, index) => {
          const isAgent = line.toLowerCase().startsWith("assistant:") || line.toLowerCase().startsWith("agent:");
          const isUser = line.toLowerCase().startsWith("user:") || line.toLowerCase().startsWith("customer:");
          
          let speakerName = "System";
          let content = line;
          let bubbleStyle = "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 self-start";

          if (isAgent) {
            speakerName = "AI Agent";
            content = line.substring(line.indexOf(":") + 1).trim();
            bubbleStyle = "bg-violet-50 border border-violet-100 text-violet-900 dark:bg-violet-950/20 dark:border-violet-900/50 dark:text-violet-300 self-start";
          } else if (isUser) {
            speakerName = "Customer";
            content = line.substring(line.indexOf(":") + 1).trim();
            bubbleStyle = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 self-end shadow-sm";
          }

          return (
            <div key={index} className={`flex flex-col max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 text-zinc-400 dark:text-zinc-500 ${isUser ? 'text-right' : 'text-left'}`}>
                {speakerName}
              </span>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${bubbleStyle}`}>
                {content}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Case 2: transcriptData is an array of messages
  if (Array.isArray(transcriptData)) {
    if (transcriptData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500 italic">No transcript available for this call.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto p-4 rounded-xl border border-zinc-100 bg-zinc-50/30 dark:border-zinc-800/50 dark:bg-zinc-950/10">
        {transcriptData.map((msg: any, index: number) => {
          const isAgent = msg.speaker.toLowerCase() === "assistant" || msg.speaker.toLowerCase() === "agent";
          const speakerName = isAgent ? "AI Agent" : "Customer";
          const bubbleStyle = isAgent
            ? "bg-violet-50 border border-violet-100 text-violet-900 dark:bg-violet-950/20 dark:border-violet-900/50 dark:text-violet-300 self-start"
            : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 self-end shadow-sm";

          return (
            <div key={index} className={`flex flex-col max-w-[80%] ${!isAgent ? 'self-end' : 'self-start'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 text-zinc-400 dark:text-zinc-500 ${!isAgent ? 'text-right' : 'text-left'}`}>
                {speakerName}
              </span>
              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${bubbleStyle}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
      <p className="text-sm text-zinc-500 italic">No transcript available for this call.</p>
    </div>
  );
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

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
        credits: matchingCall ? (matchingCall.creditsDeducted ?? 0) : (contact.credits ?? 0),
        transcript: matchingCall ? matchingCall.transcript : (contact.transcript || null)
      };
    });
  }, [campaign, calls]);

  // Keep selected contact updated with polling refreshes
  const activeSelectedContact = useMemo(() => {
    if (!selectedContact) return null;
    return enrichedContacts.find((c: any) => c.id === selectedContact.id) || selectedContact;
  }, [selectedContact, enrichedContacts]);

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
  const cStatus = (campaign.status || "").toLowerCase();
  const startTimeVal = campaign.created_at || campaign.schedule_date || campaign.date;
  if (startTimeVal) {
    try {
      const cleanStr = String(startTimeVal).replace(" UTC", "");
      const startDate = new Date(cleanStr);
      if (!isNaN(startDate.getTime())) {
        const formattedTime = startDate.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        if (cStatus === "scheduled" || cStatus === "pending") {
          startedText = `Scheduled for ${formattedTime}`;
          endedText = "Scheduled";
        } else {
          startedText = formattedTime;
          const totalDurationSeconds = enrichedContacts.reduce((acc: number, c: any) => acc + Number(c.duration || 0), 0) || 0;
          if (cStatus === "running") {
            endedText = "In Progress";
          } else {
            const endDate = new Date(startDate.getTime() + totalDurationSeconds * 1000);
            endedText = endDate.toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
          }
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
        const displayStatus = c.status === "pending" ? "scheduled" : c.status === "no_answer" ? "no answer" : c.status;
        return <Badge variant={statusMap[c.status] || "neutral"}>{displayStatus}</Badge>;
      }
    }
  ];

  if (loading || !campaign) {
    return (
      <DashboardShell title="Campaign Details">
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Campaign Details">
      <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4 overflow-y-auto gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          <div className="flex flex-col gap-2">
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

          {/* Top Right Action: Send Message via WhatsApp */}
          <div className="flex items-center gap-2 pl-12 sm:pl-0">
            <button
              onClick={() => router.push(`/whatsapp/send?campaign_id=${campaign.id}`)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition"
              title="Send WhatsApp follow-up to contacts of this campaign"
            >
              <MessageSquare className="h-4 w-4" />
              Send Message
            </button>
          </div>
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

        {/* Live Journey Panel (Only for Running campaigns) */}
        {campaign.status.toLowerCase() === "running" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:bg-gradient-to-r dark:from-[#09090b] dark:to-[#130f1c] dark:border-zinc-800/60 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-extrabold tracking-widest text-rose-600 dark:text-rose-400 uppercase">Live Journey</span>
              </div>
              <div className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                Mission Control
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
                  <p className="mt-0.5 text-2xl font-black text-rose-500">{totalContacts}</p>
                  <p className="text-[8px] font-medium text-zinc-400">Input detected</p>
                </div>

                <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-rose-400 to-amber-400 self-center opacity-40 dark:opacity-80" />

                {/* Step 2: Standby */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 ring-amber-200 text-amber-500 dark:bg-amber-500/10 dark:ring-amber-500/30">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Standby</p>
                  <p className="mt-0.5 text-2xl font-black text-amber-500">{enrichedContacts.filter((c: any) => c.status === "pending").length}</p>
                  <p className="text-[8px] font-medium text-zinc-400">Waiting in queue</p>
                </div>

                <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-amber-400 to-cyan-400 self-center opacity-40 dark:opacity-80" />

                {/* Step 3: Dialer */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 ring-cyan-200 text-cyan-500 dark:bg-cyan-500/10 dark:ring-cyan-500/30">
                    <Zap className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Dialer</p>
                  <p className="mt-0.5 text-2xl font-black text-cyan-500">
                    {totalContacts - enrichedContacts.filter((c: any) => c.status === "pending").length}
                  </p>
                  <p className="text-[8px] font-medium text-zinc-400">Active dialing</p>
                </div>

                <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-400 self-center opacity-40 dark:opacity-80" />

                {/* Step 4: Analysis */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md dark:border-zinc-700/50 dark:bg-[#16161e]/95 flex-1 max-w-full md:max-w-[160px] text-center transition hover:scale-105">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 ring-purple-200 text-purple-500 dark:bg-rose-500/10 dark:ring-rose-500/30">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Analysis</p>
                  <p className="mt-0.5 text-2xl font-black text-purple-500">
                    {enrichedContacts.filter((c: any) => ["completed", "failed", "busy", "no_answer", "incomplete"].includes(c.status)).length}
                  </p>
                  <p className="text-[8px] font-medium text-zinc-400">Finished calls</p>
                </div>
              </div>

              {/* Vertical connector line (screens >= lg) */}
              <div className="hidden lg:flex w-[2px] bg-gradient-to-b from-rose-400 to-emerald-400 self-stretch my-2 opacity-50" />

              {/* Outcomes stacked column */}
              <div className="flex flex-row lg:flex-col gap-3 justify-center items-center shrink-0 w-full lg:w-[150px]">
                {/* Completed outcome */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-white py-3 px-4 shadow-sm dark:border-emerald-500/30 dark:bg-[#121217] w-full max-w-[150px]">
                  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-full bg-emerald-500" />
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{connectedCount}</p>
                  <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase mt-0.5">Completed</p>
                </div>

                {/* No Answer outcome */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-white py-3 px-4 shadow-sm dark:border-blue-500/30 dark:bg-[#121217] w-full max-w-[150px]">
                  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-full bg-blue-500" />
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{dialedCount - connectedCount}</p>
                  <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase mt-0.5">No Answer</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
              onRowClick={(item) => setSelectedContact(item)}
            />
          </div>
        </section>

        {/* --- Popup Modal for Details Redesign --- */}
        {activeSelectedContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedContact(null)}></div>
            <div className="relative bg-white dark:bg-[#0B0F19] w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header & Actions */}
              <div className="bg-white dark:bg-[#0B0F19] z-10 border-b border-zinc-200 dark:border-zinc-800 p-5 flex flex-col md:flex-row md:justify-between md:items-start shrink-0 gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Detailed Call Info First */}
                  <div className="flex gap-4 items-center">
                     <div className="w-14 h-14 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 shrink-0 flex items-center justify-center">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white">
                        {activeSelectedContact.name} 
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> {activeSelectedContact.phone}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span>{activeSelectedContact.datetime || "—"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-full w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block mx-2"></div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-sm">
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Status</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(activeSelectedContact.status, "status")}`}>
                        {activeSelectedContact.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Type</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(activeSelectedContact.type, "type")}`}>
                        {activeSelectedContact.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Campaign</p>
                      <p className="font-semibold text-zinc-900 dark:text-white truncate max-w-[120px]">{activeSelectedContact.agent}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Credits</p>
                      <p className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> {activeSelectedContact.credits}</p>
                    </div>
                  </div>
                </div>

                {/* Close Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setSelectedContact(null)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
              </div>
              
              {/* Modal Body: Transcript & Recording Side-by-Side */}
              <div className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950/10">
                
                {/* Transcript Section */}
                <div className="flex flex-col h-full">
                  <h4 className="font-semibold flex items-center gap-2 mb-3 text-zinc-900 dark:text-white"><FileText className="w-4 h-4 text-violet-600" /> Call Transcript</h4>
                  <div className="bg-white dark:bg-[#0B0F19] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex-1 min-h-[300px] overflow-y-auto space-y-6 text-sm shadow-sm">
                    {renderTranscript(activeSelectedContact.transcript)}
                  </div>
                </div>

                {/* Player & Insights Section */}
                <div className="flex flex-col gap-6 h-full">
                  
                  {/* Player */}
                  <div className="flex flex-col">
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-zinc-900 dark:text-white"><PlayCircle className="w-4 h-4 text-violet-600" /> Recording</h4>
                    <div className="bg-white dark:bg-[#0B0F19] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[140px]">
                      {!activeSelectedContact.recording_url ? (
                        <div className="text-zinc-400 dark:text-zinc-500 italic text-sm">
                          No recording available for this call.
                        </div>
                      ) : (
                        <audio 
                          src={activeSelectedContact.recording_url.startsWith('http') ? activeSelectedContact.recording_url : BASE + activeSelectedContact.recording_url}
                          controls 
                          className="w-full outline-none"
                          preload="metadata"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Data */}
                  <div className="flex flex-col flex-1">
                    <h4 className="font-semibold text-sm mb-3 text-zinc-400 dark:text-zinc-500 flex items-center gap-2">Key Insights</h4>
                    <div className="bg-white dark:bg-[#0B0F19] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex-1">
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                          <span className="text-zinc-500 dark:text-zinc-400">AI Classification</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{activeSelectedContact.aiClass}</span>
                        </li>
                        <li className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                          <span className="text-zinc-500 dark:text-zinc-400">Category</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(activeSelectedContact.category, "category")}`}>
                            {activeSelectedContact.category}
                          </span>
                        </li>
                        <li className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                          <span className="text-zinc-500 dark:text-zinc-400">Response</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(activeSelectedContact.response, "response")}`}>
                            {activeSelectedContact.response}
                          </span>
                        </li>
                        <li className="flex justify-between items-center pb-1">
                          <span className="text-zinc-500 dark:text-zinc-400">Sentiment</span>
                          {(() => {
                            const cat = (activeSelectedContact.category || "").toUpperCase();
                            const resp = (activeSelectedContact.response || "").toLowerCase();
                            const ai = (activeSelectedContact.aiClass || "").toLowerCase();
                            const isNeg = cat === "COLD" || resp.includes("do not call") || resp.includes("refusal") || resp.includes("not interested") || resp.includes("no answer") || ai.includes("do not call") || ai.includes("refusal");
                            const isPos = !isNeg && (cat === "HOT" || resp.includes("appointment") || resp.includes("interested"));
                            const s = activeSelectedContact.sentiment || (isNeg ? "Negative" : isPos ? "Positive" : "Neutral");

                            if (s === "Negative" || isNeg) {
                              return <span className="text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Negative</span>;
                            } else if (s === "Positive" && !isNeg) {
                              return <span className="text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Positive</span>;
                            } else {
                              return <span className="text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Neutral</span>;
                            }
                          })()}
                        </li>
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
