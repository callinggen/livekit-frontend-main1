"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import { FileText, Calendar, Download, Sparkles, Loader2, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function ReportPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    setIsGenerating(true);
    setReportGenerated(false);
    setDownloadMessage("");
    setReportContent("");
    setStats(null);

    try {
      const response = await api.generateReport(startDate, endDate);
      setReportContent(response.report);
      setStats(response.stats);
      setReportGenerated(true);
    } catch (err) {
      console.error(err);
      setDownloadMessage("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!reportGenerated || !reportContent) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 20;
    const contentWidth = pageWidth - marginX * 2;

    // Header gradient bar (simulated with a filled rect)
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, pageWidth, 18, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CallingGen AI Performance Report", marginX, 12);

    // Meta info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Report Period: ${startDate}  →  ${endDate}`, marginX, 28);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, marginX, 34);

    // Divider
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.4);
    doc.line(marginX, 38, pageWidth - marginX, 38);

    let y = 46;

    // Add stats if available
    if (stats) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Data Summary", marginX, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Calls: ${stats.total} | Completed: ${stats.completed} | Failed: ${stats.failed}`, marginX, y);
      y += 6;
      doc.text(`Leads - Hot: ${stats.hot} | Warm: ${stats.warm} | Cold: ${stats.cold}`, marginX, y);
      y += 10;
    }

    // Report Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);

    const splitText = doc.splitTextToSize(reportContent, contentWidth);
    
    // Simple pagination logic
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20;

    for (let i = 0; i < splitText.length; i++) {
      if (y > pageHeight - marginBottom) {
        doc.addPage();
        y = 20; // reset y
      }
      doc.text(splitText[i], marginX, y);
      y += 6;
    }

    doc.save(`callinggen-report-${startDate}-to-${endDate}.pdf`);
    setDownloadMessage("PDF report downloaded successfully.");
  };

  return (
    <DashboardShell title="Report">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Hero Section ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-12">
          {/* Title */}
          <h2 className="text-3xl font-bold sm:text-4xl">
            <span className="gradient-text">AI Report Generator</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Generate a comprehensive AI-driven performance report.
          </p>

          {/* Controls Bar */}
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 sm:flex-row">
            {/* Start Date */}
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
                id="report-start-date"
              />
            </div>

            <span className="text-xs font-medium text-zinc-400">to</span>

            {/* End Date */}
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
                id="report-end-date"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!startDate || !endDate || isGenerating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              id="generate-report-btn"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate AI Report"}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!reportGenerated}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              id="download-report-btn"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>

          {downloadMessage ? (
            <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
              {downloadMessage}
            </p>
          ) : null}

          {/* Status / Placeholder */}
          <div className="mt-12 flex flex-col items-center">
            {isGenerating ? (
              <>
                <div className="relative mb-4">
                  <Sparkles className="h-12 w-12 text-violet-400 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping" />
                </div>
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  Generating your AI report...
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Analyzing call data and preparing insights
                </p>
                {/* Progress Bar */}
                <div className="mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-progress" />
                </div>
              </>
            ) : reportGenerated ? (
              <>
                <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Report Generated Successfully!
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Your AI report is ready to read or download.
                </p>
              </>
            ) : (
              <>
                <Sparkles className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Select a date and click generate
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
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              {/* Report Meta */}
              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold">CallingGen AI Performance Report</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Period: {startDate} to {endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="h-3 w-3" />
                    Generated just now
                  </div>
                </div>
              </div>
              
              {stats && (
                <div className="border-b border-zinc-200 p-5 dark:border-zinc-800 flex justify-around text-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                   <div><span className="text-xs text-zinc-500">Total Calls</span><p className="font-bold">{stats.total}</p></div>
                   <div><span className="text-xs text-zinc-500">Completed</span><p className="font-bold text-emerald-600">{stats.completed}</p></div>
                   <div><span className="text-xs text-zinc-500">Failed</span><p className="font-bold text-red-600">{stats.failed}</p></div>
                   <div><span className="text-xs text-zinc-500">Hot Leads</span><p className="font-bold text-amber-600">{stats.hot}</p></div>
                </div>
              )}

              {/* Render AI Markdown Content */}
              <div className="p-6 md:p-8 prose prose-zinc dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>
                  {reportContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
