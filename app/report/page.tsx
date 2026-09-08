"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import { 
  FileText, Calendar, Download, Sparkles, Loader2, 
  CheckCircle2, Clock, Eye, X, Trash2, AlertTriangle, 
  Coins, Check 
} from "lucide-react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

function getLocalDateAndTimeString(dateString?: string) {
  if (!dateString) {
    const now = new Date();
    return {
      date: now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
      full: now.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  }

  let str = dateString.trim();
  // Ensure UTC indicator if no timezone offset present
  if (!str.endsWith("Z") && !str.includes("+") && !str.includes("-", 10)) {
    str += "Z";
  }

  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) {
    return { date: dateString, time: "", full: dateString };
  }

  return {
    date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: dateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }),
    full: dateObj.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

export default function ReportPage() {
  const router = useRouter();
  const { isLoggedIn, user, refreshUser } = useAuth();

  // Date selection state
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [activeReportRange, setActiveReportRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  
  // History state
  const [history, setHistory] = useState<{ id: number; title: string; start_date: string; end_date: string; generated_at: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Modal states
  const [selectedReportModal, setSelectedReportModal] = useState<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    content: string;
    stats: any;
    generated_at: string;
  } | null>(null);

  // Delete modal state
  const [reportToDelete, setReportToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Download confirmation modal state
  const [downloadConfirmData, setDownloadConfirmData] = useState<{
    startDate: string;
    endDate: string;
    content: string;
    stats: any;
    title?: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const reports = await api.getReports();
      setHistory(reports);
    } catch (err) {
      console.error("Failed to fetch report history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Set today as default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSingleDate(today);
    setStartDate(today);
    setEndDate(today);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    } else {
      fetchHistory();
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  // Preset date helpers
  const applyPreset = (type: "today" | "yesterday" | "last7" | "last30") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (type === "today") {
      const d = formatDate(today);
      setDateMode("single");
      setSingleDate(d);
      setStartDate(d);
      setEndDate(d);
    } else if (type === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatDate(y);
      setDateMode("single");
      setSingleDate(d);
      setStartDate(d);
      setEndDate(d);
    } else if (type === "last7") {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      setDateMode("range");
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (type === "last30") {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      setDateMode("range");
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    }
  };

  const handleGenerate = async () => {
    const effectiveStart = dateMode === "single" ? singleDate : startDate;
    const effectiveEnd = dateMode === "single" ? singleDate : endDate;

    if (!effectiveStart || !effectiveEnd) {
      alert("Please select a valid date or date range.");
      return;
    }

    if ((user?.credits ?? 0) < 1) {
      alert("Insufficient credits. Generating an AI report requires 1 credit. Please top up your credits.");
      return;
    }

    setIsGenerating(true);
    setReportGenerated(false);
    setDownloadMessage("");
    setReportContent("");
    setStats(null);

    try {
      const response = await api.generateReport(effectiveStart, effectiveEnd);
      setReportContent(response.report);
      setStats(response.stats);
      setActiveReportRange({ start: effectiveStart, end: effectiveEnd });
      setReportGenerated(true);
      await fetchHistory(); // Refresh history list
      if (refreshUser) {
        await refreshUser(); // Update credit count in navbar immediately
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to generate report. Please try again.";
      setDownloadMessage(msg);
      alert(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadReport = async (id: number) => {
    try {
      const report = await api.getReport(id);
      setSelectedReportModal(report);
    } catch (err) {
      console.error("Failed to load report", err);
      alert("Failed to load report. Please try again.");
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    try {
      setIsDeleting(true);
      await api.deleteReport(reportToDelete.id);
      setHistory(prev => prev.filter(r => r.id !== reportToDelete.id));
      if (selectedReportModal?.id === reportToDelete.id) {
        setSelectedReportModal(null);
      }
      setReportToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete report:", err);
      alert(err.message || "Failed to delete report. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const generatePDF = async (pdfStartDate: string, pdfEndDate: string, pdfContent: string, pdfStats: any) => {
    try {
      setIsDownloading(true);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 16;
      const contentWidth = pageWidth - marginX * 2;
      let y = 20;

      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > 275) {
          doc.addPage();
          y = 20;
        }
      };

      // 1. Header (Simple Black Text on White)
      doc.setTextColor(17, 24, 39); // Deep Black #111827
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CallingGen AI Performance Report", marginX, y);
      y += 6;

      // Metadata
      doc.setTextColor(75, 85, 99); // Dark Gray #4B5563
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const periodText = pdfStartDate === pdfEndDate ? pdfStartDate : `${pdfStartDate} to ${pdfEndDate}`;
      doc.text(`Report Period: ${periodText}    |    Generated: ${getLocalDateAndTimeString().full}`, marginX, y);
      y += 5;

      // Top Divider Line
      doc.setDrawColor(31, 41, 55); // #1F2937
      doc.setLineWidth(0.4);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 7;

      // 2. Data Summary Box (Clean Minimalist Outlined Box)
      if (pdfStats) {
        const boxStartY = y;
        const compRate = pdfStats.total > 0 ? Math.round((pdfStats.completed / pdfStats.total) * 100) : 0;
        const campaignsList = Array.isArray(pdfStats.campaign_names) && pdfStats.campaign_names.length > 0 
          ? pdfStats.campaign_names.join(", ") 
          : "Active Campaign";
        const agentsList = Array.isArray(pdfStats.agent_names) && pdfStats.agent_names.length > 0
          ? pdfStats.agent_names.join(", ")
          : "CallingGen Voice SDR";

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(17, 24, 39);
        doc.text("EXECUTIVE DATA SUMMARY", marginX + 3, y + 4.5);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(55, 65, 81);

        doc.text(`Campaign: ${campaignsList}    |    Agent: ${agentsList}`, marginX + 3, y);
        y += 4.5;
        doc.text(
          `Total Dials: ${pdfStats.total ?? 0}    |    Connected: ${pdfStats.completed ?? 0} (${compRate}%)    |    Failed/Busy: ${pdfStats.failed ?? 0}    |    Avg Duration: ${pdfStats.avg_duration ?? 0}s`,
          marginX + 3,
          y
        );
        y += 4.5;
        doc.text(
          `Leads: Hot (${pdfStats.hot ?? 0})  ·  Warm (${pdfStats.warm ?? 0})  ·  Cold (${pdfStats.cold ?? 0})    |    Credits Used: ${pdfStats.credits_consumed ?? 1} (Bal: ${pdfStats.remaining_credits ?? 0})`,
          marginX + 3,
          y
        );
        y += 3;

        // Draw Box Border
        doc.setDrawColor(209, 213, 219); // #D1D5DB
        doc.setLineWidth(0.3);
        doc.rect(marginX, boxStartY, contentWidth, y - boxStartY);
        y += 6;
      }

      // 3. Parse & Render Markdown Sections
      const sections = pdfContent.split(/\n(?=## )/).filter(Boolean);

      if (sections.length > 0) {
        sections.forEach((section) => {
          const lines = section.trim().split("\n");
          const heading = lines[0].replace(/^##\s*/, "").trim();
          const bodyLines = lines.slice(1);

          checkPageBreak(16);

          // Section Title (Bold Black)
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(17, 24, 39);
          doc.text(heading, marginX, y);
          y += 2.5;

          // Subtle section underline
          doc.setDrawColor(229, 231, 235); // #E5E7EB
          doc.setLineWidth(0.2);
          doc.line(marginX, y, pageWidth - marginX, y);
          y += 4;

          // Body Text & Bullet Points
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(55, 65, 81);

          bodyLines.forEach((line) => {
            const cleanLine = line.trim();
            if (!cleanLine) {
              y += 1.5;
              return;
            }

            if (cleanLine.startsWith("### ")) {
              checkPageBreak(10);
              y += 2.5;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(17, 24, 39);
              doc.text(cleanLine.replace(/^###\s*/, ""), marginX, y);
              y += 4.5;
              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(55, 65, 81);
              return;
            }

            const formattedLine = cleanLine
              .replace(/^\*\s+/, "• ")
              .replace(/^-\s+/, "• ")
              .replace(/\*\*(.*?)\*\*/g, "$1");

            const wrappedText = doc.splitTextToSize(formattedLine, contentWidth);
            checkPageBreak(wrappedText.length * 4.2);

            doc.text(wrappedText, marginX, y);
            y += wrappedText.length * 4.2 + 1;
          });

          y += 4;
        });
      } else {
        const lines = pdfContent.split("\n");
        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (!cleanLine) {
            y += 1.5;
            return;
          }
          const formattedLine = cleanLine
            .replace(/^\*\s+/, "• ")
            .replace(/^-\s+/, "• ")
            .replace(/\*\*(.*?)\*\*/g, "$1");
          const wrappedText = doc.splitTextToSize(formattedLine, contentWidth);
          checkPageBreak(wrappedText.length * 4.2);
          doc.text(wrappedText, marginX, y);
          y += wrappedText.length * 4.2 + 1;
        });
      }

      // 4. Footer with clean page numbering on all pages
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        
        // Footer divider line
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.line(marginX, 284, pageWidth - marginX, 284);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); // #6B7280
        doc.text(
          `CallingGen AI  •  Performance Report  •  Page ${p} of ${totalPages}`,
          pageWidth / 2,
          289,
          { align: "center" }
        );
      }

      const fileSuffix = pdfStartDate === pdfEndDate ? pdfStartDate : `${pdfStartDate}_to_${pdfEndDate}`;
      doc.save(`Performance_Report_${fileSuffix}.pdf`);
      setDownloadMessage("PDF report downloaded successfully.");
      setDownloadConfirmData(null);
    } catch (err) {
      console.error(err);
      setDownloadMessage("Failed to generate PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerDownloadConfirmation = (pStartDate: string, pEndDate: string, pContent: string, pStats: any, pTitle?: string) => {
    setDownloadConfirmData({
      startDate: pStartDate,
      endDate: pEndDate,
      content: pContent,
      stats: pStats,
      title: pTitle,
    });
  };

  const handleDownloadFromPreview = () => {
    if (!reportGenerated || !reportContent) return;
    triggerDownloadConfirmation(
      activeReportRange.start, 
      activeReportRange.end, 
      reportContent, 
      stats, 
      `AI Performance Report (${activeReportRange.start === activeReportRange.end ? activeReportRange.start : `${activeReportRange.start} to ${activeReportRange.end}`})`
    );
  };

  const handleDownloadFromHistoryCard = async (id: number) => {
    try {
      const report = await api.getReport(id);
      triggerDownloadConfirmation(report.start_date, report.end_date, report.content, report.stats, report.title);
    } catch (err) {
      console.error("Failed to load report for download", err);
      alert("Failed to load report. Please try again.");
    }
  };

  return (
    <DashboardShell title="Report">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Hero Section ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          
          {/* Title & Badge */}
          <div className="flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600 dark:bg-violet-950/50 dark:text-violet-400 mb-3 border border-violet-100 dark:border-violet-900/40">
              <Coins className="h-3.5 w-3.5" />
              <span>1 Credit per Generation</span>
            </div>
            
            <h2 className="text-3xl font-bold sm:text-4xl">
              <span className="gradient-text">AI Report Generator</span>
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Generate actionable, AI-driven performance summaries for a single day or custom date range.
            </p>
          </div>

          {/* Mode Switcher & Quick Presets */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => {
                  setDateMode("single");
                  if (!singleDate) {
                    const today = new Date().toISOString().split("T")[0];
                    setSingleDate(today);
                    setStartDate(today);
                    setEndDate(today);
                  }
                }}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  dateMode === "single"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Single Day
              </button>
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  dateMode === "range"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Date Range
              </button>
            </div>

            <div className="hidden sm:block h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset("today")}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-violet-600 transition"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset("yesterday")}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-violet-600 transition"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => applyPreset("last7")}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-violet-600 transition"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => applyPreset("last30")}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50 hover:text-violet-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-violet-600 transition"
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="mx-auto mt-6 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row">
            {dateMode === "single" ? (
              /* Single Date Input */
              <div className="flex w-full flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="text-xs font-semibold text-zinc-400">Date:</span>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    setSingleDate(e.target.value);
                    setStartDate(e.target.value);
                    setEndDate(e.target.value);
                  }}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none dark:text-white"
                  id="report-single-date"
                />
              </div>
            ) : (
              /* Range Date Inputs */
              <div className="flex w-full flex-1 flex-col sm:flex-row items-center gap-2">
                <div className="flex w-full flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                  <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-400">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium focus:outline-none dark:text-white"
                    id="report-start-date"
                  />
                </div>

                <span className="text-xs font-medium text-zinc-400">to</span>

                <div className="flex w-full flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
                  <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="text-xs font-semibold text-zinc-400">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium focus:outline-none dark:text-white"
                    id="report-end-date"
                  />
                </div>
              </div>
            )}

            {/* Generate Button Only */}
            <button
              onClick={handleGenerate}
              disabled={
                (dateMode === "single" && !singleDate) ||
                (dateMode === "range" && (!startDate || !endDate)) ||
                isGenerating
              }
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              id="generate-report-btn"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isGenerating ? "Generating..." : "Generate AI Report"}</span>
            </button>
          </div>

          {downloadMessage ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              {downloadMessage}
            </p>
          ) : null}

          {/* Status / Placeholder */}
          <div className="mt-8 flex flex-col items-center">
            {isGenerating ? (
              <>
                <div className="relative mb-3">
                  <Sparkles className="h-10 w-10 text-violet-500 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping" />
                </div>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  Analyzing call data & generating AI report...
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Deducting 1 credit upon completion
                </p>
                {/* Progress Bar */}
                <div className="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-progress" />
                </div>
              </>
            ) : reportGenerated ? (
              <>
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Report Generated Successfully!
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Your report for {activeReportRange.start === activeReportRange.end ? activeReportRange.start : `${activeReportRange.start} to ${activeReportRange.end}`} is ready.
                </p>
              </>
            ) : (
              <>
                <Sparkles className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Select a day or date range and click Generate AI Report
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Report Preview (shown after generation) ── */}
        {reportGenerated && (
          <div className="space-y-4 animate-fade-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Report Preview</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadFromPreview}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </div>
              </div>
            </div>

            <div id="report-pdf-content" className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              {/* Report Meta */}
              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">CallingGen AI Performance Report</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Period: {activeReportRange.start === activeReportRange.end ? activeReportRange.start : `${activeReportRange.start} to ${activeReportRange.end}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    <span>Generated: {getLocalDateAndTimeString().date} at {getLocalDateAndTimeString().time}</span>
                  </div>
                </div>
              </div>
              
              {stats && (
                <div className="border-b border-zinc-200 p-5 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Total Dials</span>
                      <p className="font-bold text-base text-zinc-900 dark:text-white mt-0.5">{stats.total ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Connected</span>
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {stats.completed ?? 0} {stats.total > 0 ? `(${Math.round((stats.completed / stats.total) * 100)}%)` : ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Hot Leads</span>
                      <p className="font-bold text-base text-amber-500 mt-0.5">{stats.hot ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Warm Leads</span>
                      <p className="font-bold text-base text-blue-500 mt-0.5">{stats.warm ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Avg Length</span>
                      <p className="font-bold text-base text-violet-600 dark:text-violet-400 mt-0.5">{stats.avg_duration ?? 0}s</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Credits Used</span>
                      <p className="font-bold text-base text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.credits_consumed ?? 1}</p>
                    </div>
                  </div>

                  {(stats.campaign_names?.length > 0 || stats.agent_names?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500">
                      {stats.campaign_names?.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Campaigns: <strong className="text-zinc-900 dark:text-white font-semibold">{stats.campaign_names.join(", ")}</strong>
                        </span>
                      )}
                      {stats.agent_names?.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Agent: <strong className="text-violet-600 dark:text-violet-400 font-semibold">{stats.agent_names.join(", ")}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Individual Campaign Breakdown Cards */}
                  {stats.campaign_breakdown?.length > 0 && (
                    <div className="mt-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-800 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Campaign Performance Breakdown</span>
                        <span className="text-[11px] text-zinc-400">{stats.campaign_breakdown.length} active</span>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {stats.campaign_breakdown.map((cb: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-700/60 dark:bg-zinc-800/90 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-700/60">
                              <span className="font-semibold text-xs text-zinc-900 dark:text-white line-clamp-1">{cb.name}</span>
                              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full whitespace-nowrap border border-violet-100 dark:border-violet-900/30">
                                {cb.agent}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Dials (Conn)</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{cb.total} ({cb.comp_rate}%)</span>
                              </div>
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Hot / Warm</span>
                                <span className="font-bold text-amber-500">{cb.hot} <span className="text-zinc-400 font-normal">/</span> <span className="text-blue-500">{cb.warm}</span></span>
                              </div>
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Avg Duration</span>
                                <span className="font-bold text-violet-600 dark:text-violet-400">{cb.avg_duration}s</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Render AI Markdown Content */}
              <div className="p-6 md:p-8 max-w-none text-sm space-y-4">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => (
                      <div className="mt-6 mb-3 border-b border-violet-100 pb-2 dark:border-violet-900/40">
                        <h2 className="text-base font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2" {...props} />
                      </div>
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="mt-4 mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-100" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="my-2 space-y-2 pl-4 list-disc marker:text-violet-500" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="my-2 space-y-2 pl-4 list-decimal marker:text-violet-500 font-medium text-violet-600 dark:text-violet-400" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="my-2 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed" {...props} />
                    )
                  }}
                >
                  {reportContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* ── Previous Reports Section ── */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Previous Reports</h3>
            <span className="text-xs text-zinc-400">{history.length} saved reports</span>
          </div>
          
          {isLoadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <FileText className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">No previous reports found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((report) => {
                const { date: formattedDate, time: formattedTime } = getLocalDateAndTimeString(report.generated_at);
                const periodDisplay = report.start_date === report.end_date 
                  ? report.start_date 
                  : `${report.start_date} → ${report.end_date}`;
                
                return (
                  <div
                    key={report.id}
                    className="flex flex-col items-start justify-between rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 group relative"
                  >
                    <div className="w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                          <FileText className="h-5 w-5 text-violet-500 shrink-0" />
                          <span className="font-semibold text-sm line-clamp-1">{report.title}</span>
                        </div>
                        
                        {/* Quick Delete Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportToDelete({ id: report.id, title: report.title });
                          }}
                          className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                          title="Delete Report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                          Period: <span className="font-mono text-[11px] text-violet-600 dark:text-violet-400">{periodDisplay}</span>
                        </p>
                        <div className="text-[11px] text-zinc-400">
                          {formattedDate} at {formattedTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex w-full gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <button
                        onClick={() => handleLoadReport(report.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadFromHistoryCard(report.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal for Viewing Report ── */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 sm:p-6 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">{selectedReportModal.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Period: <strong className="text-zinc-700 dark:text-zinc-300">{selectedReportModal.start_date === selectedReportModal.end_date ? selectedReportModal.start_date : `${selectedReportModal.start_date} to ${selectedReportModal.end_date}`}</strong></span>
                  <span className="mx-2 text-zinc-300 dark:text-zinc-700">•</span>
                  <span>Generated: <strong className="text-zinc-700 dark:text-zinc-300">{getLocalDateAndTimeString(selectedReportModal.generated_at).date} at {getLocalDateAndTimeString(selectedReportModal.generated_at).time}</strong></span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    triggerDownloadConfirmation(
                      selectedReportModal.start_date,
                      selectedReportModal.end_date,
                      selectedReportModal.content,
                      selectedReportModal.stats,
                      selectedReportModal.title
                    );
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
                <button
                  onClick={() => {
                    setReportToDelete({ id: selectedReportModal.id, title: selectedReportModal.title });
                  }}
                  className="rounded-lg p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete Report"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setSelectedReportModal(null)}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-4 sm:p-6 bg-white dark:bg-zinc-900">
              {selectedReportModal.stats && (
                <div className="mb-6 border border-zinc-200 rounded-xl p-5 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center">
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Total Dials</span>
                      <p className="font-bold text-base text-zinc-900 dark:text-white mt-0.5">{selectedReportModal.stats.total ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Connected</span>
                      <p className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {selectedReportModal.stats.completed ?? 0} {selectedReportModal.stats.total > 0 ? `(${Math.round((selectedReportModal.stats.completed / selectedReportModal.stats.total) * 100)}%)` : ""}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Hot Leads</span>
                      <p className="font-bold text-base text-amber-500 mt-0.5">{selectedReportModal.stats.hot ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Warm Leads</span>
                      <p className="font-bold text-base text-blue-500 mt-0.5">{selectedReportModal.stats.warm ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Avg Length</span>
                      <p className="font-bold text-base text-violet-600 dark:text-violet-400 mt-0.5">{selectedReportModal.stats.avg_duration ?? 0}s</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5 border border-zinc-200/80 dark:bg-zinc-800/80 dark:border-zinc-700/60">
                      <span className="text-[11px] text-zinc-500 font-medium">Credits Used</span>
                      <p className="font-bold text-base text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedReportModal.stats.credits_consumed ?? 1}</p>
                    </div>
                  </div>

                  {(selectedReportModal.stats.campaign_names?.length > 0 || selectedReportModal.stats.agent_names?.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-zinc-500">
                      {selectedReportModal.stats.campaign_names?.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Campaigns: <strong className="text-zinc-900 dark:text-white font-semibold">{selectedReportModal.stats.campaign_names.join(", ")}</strong>
                        </span>
                      )}
                      {selectedReportModal.stats.agent_names?.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          Agent: <strong className="text-violet-600 dark:text-violet-400 font-semibold">{selectedReportModal.stats.agent_names.join(", ")}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Individual Campaign Breakdown Cards */}
                  {selectedReportModal.stats.campaign_breakdown?.length > 0 && (
                    <div className="mt-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-800 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Campaign Performance Breakdown</span>
                        <span className="text-[11px] text-zinc-400">{selectedReportModal.stats.campaign_breakdown.length} active</span>
                      </div>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {selectedReportModal.stats.campaign_breakdown.map((cb: any, idx: number) => (
                          <div key={idx} className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-700/60 dark:bg-zinc-800/90 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-700/60">
                              <span className="font-semibold text-xs text-zinc-900 dark:text-white line-clamp-1">{cb.name}</span>
                              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full whitespace-nowrap border border-violet-100 dark:border-violet-900/30">
                                {cb.agent}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Dials (Conn)</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">{cb.total} ({cb.comp_rate}%)</span>
                              </div>
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Hot / Warm</span>
                                <span className="font-bold text-amber-500">{cb.hot} <span className="text-zinc-400 font-normal">/</span> <span className="text-blue-500">{cb.warm}</span></span>
                              </div>
                              <div className="rounded-lg bg-zinc-50 p-1.5 dark:bg-zinc-900/40">
                                <span className="text-zinc-400 block text-[10px]">Avg Duration</span>
                                <span className="font-bold text-violet-600 dark:text-violet-400">{cb.avg_duration}s</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="max-w-none text-sm space-y-4">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => (
                      <div className="mt-6 mb-3 border-b border-violet-100 pb-2 dark:border-violet-900/40">
                        <h2 className="text-base font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2" {...props} />
                      </div>
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="mt-4 mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-100" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="my-2 space-y-2 pl-4 list-disc marker:text-violet-500" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="my-2 space-y-2 pl-4 list-decimal marker:text-violet-500 font-medium text-violet-600 dark:text-violet-400" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-semibold text-zinc-900 dark:text-white" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="my-2 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed" {...props} />
                    )
                  }}
                >
                  {selectedReportModal.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal: Download Report ── */}
      {downloadConfirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Confirm Report Download</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Review the details before downloading.</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Report Range:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {downloadConfirmData.startDate === downloadConfirmData.endDate 
                    ? downloadConfirmData.startDate 
                    : `${downloadConfirmData.startDate} to ${downloadConfirmData.endDate}`}
                </span>
              </div>
              {downloadConfirmData.stats && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Total Calls Analyzed:</span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">{downloadConfirmData.stats.total ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Lead Conversion:</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Hot: <span className="font-semibold text-amber-500">{downloadConfirmData.stats.hot ?? 0}</span> | 
                      Warm: <span className="font-semibold text-blue-500">{downloadConfirmData.stats.warm ?? 0}</span>
                    </span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Format:</span>
                <span className="font-medium text-violet-600 dark:text-violet-400">PDF Document (.pdf)</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDownloadConfirmData(null)}
                disabled={isDownloading}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  generatePDF(
                    downloadConfirmData.startDate,
                    downloadConfirmData.endDate,
                    downloadConfirmData.content,
                    downloadConfirmData.stats
                  );
                }}
                disabled={isDownloading}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-700 transition disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{isDownloading ? "Generating PDF..." : "Confirm & Download"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal: Delete Report ── */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Report?</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-300">
              Are you sure you want to delete <span className="font-semibold text-zinc-900 dark:text-white">"{reportToDelete.title}"</span>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isDeleting ? "Deleting..." : "Delete Report"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
