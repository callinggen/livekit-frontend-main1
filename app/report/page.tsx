"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import { FileText, Calendar, Download, Sparkles, Loader2, CheckCircle2, Clock, Eye, X } from "lucide-react";
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
  
  // History state
  const [history, setHistory] = useState<{ id: number; title: string; start_date: string; end_date: string; generated_at: string }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedReportModal, setSelectedReportModal] = useState<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    content: string;
    stats: any;
    generated_at: string;
  } | null>(null);

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

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    } else {
      fetchHistory();
    }
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
      fetchHistory(); // Refresh history list
    } catch (err) {
      console.error(err);
      setDownloadMessage("Failed to generate report. Please try again.");
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

  const generatePDF = async (pdfStartDate: string, pdfEndDate: string, pdfContent: string, pdfStats: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 20;
      const contentWidth = pageWidth - marginX * 2;

      // Header gradient bar
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.rect(0, 0, pageWidth, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CallingGen AI Performance Report", marginX, 12);

      // Meta info
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Report Period: ${pdfStartDate}  to  ${pdfEndDate}`, marginX, 28);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, marginX, 34);

      // Divider
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.5);
      doc.line(marginX, 38, pageWidth - marginX, 38);

      let y = 46;

      // Stats block
      if (pdfStats) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text("Data Summary", marginX, y);
        y += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        doc.text(`Total Calls: ${pdfStats.total}   |   Completed: ${pdfStats.completed}   |   Failed: ${pdfStats.failed}`, marginX, y);
        y += 6;
        doc.text(`Leads: Hot (${pdfStats.hot})  ·  Warm (${pdfStats.warm})  ·  Cold (${pdfStats.cold})`, marginX, y);
        
        y += 8;
        doc.setDrawColor(240, 240, 245);
        doc.line(marginX, y, pageWidth - marginX, y);
        y += 8;
      }

      // Parse Markdown
      const lines = pdfContent.split('\n');

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (y > 275) { 
          doc.addPage(); 
          y = 20; 
        }

        if (line.trim() === '') {
          y += 3;
          continue;
        }

        if (line.startsWith('### ')) {
          y += 4;
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(40, 40, 40);
          doc.text(line.replace('### ', ''), marginX, y);
          y += 6;
        } else if (line.startsWith('## ')) {
          y += 5;
          doc.setFontSize(15);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text(line.replace('## ', ''), marginX, y);
          y += 7;
        } else if (line.startsWith('# ')) {
          y += 6;
          doc.setFontSize(17);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(20, 20, 20);
          doc.text(line.replace('# ', ''), marginX, y);
          y += 8;
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          
          let text = line.substring(2).replace(/\*\*(.*?)\*\*/g, '$1');
          const split = doc.splitTextToSize("•  " + text, contentWidth - 4);
          for (let j = 0; j < split.length; j++) {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(split[j], marginX + 4, y);
            y += 5;
          }
        } else {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          
          let text = line.replace(/\*\*(.*?)\*\*/g, '$1');
          const split = doc.splitTextToSize(text, contentWidth);
          for (let j = 0; j < split.length; j++) {
            if (y > 275) { doc.addPage(); y = 20; }
            doc.text(split[j], marginX, y);
            y += 5;
          }
        }
      }

      doc.save(`callinggen-report-${pdfStartDate}-to-${pdfEndDate}.pdf`);
      setDownloadMessage("PDF report downloaded successfully.");
    } catch (err) {
      console.error(err);
      setDownloadMessage("Failed to generate PDF.");
    }
  };

  const handleDownload = async () => {
    if (!reportGenerated || !reportContent) return;
    await generatePDF(startDate, endDate, reportContent, stats);
  };

  const handleDirectDownload = async (id: number) => {
    try {
      const report = await api.getReport(id);
      await generatePDF(report.start_date, report.end_date, report.content, report.stats);
    } catch (err) {
      console.error("Failed to load report for download", err);
      alert("Failed to download report. Please try again.");
    }
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

            <div id="report-pdf-content" className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
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

        {/* ── Previous Reports Section ── */}
        <div className="mt-12 space-y-4">
          <h3 className="text-xl font-bold">Previous Reports</h3>
          
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
                const dateObj = new Date(report.generated_at);
                const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                
                return (
                  <div
                    key={report.id}
                    className="flex flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 group"
                  >
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                      <FileText className="h-5 w-5 text-violet-500" />
                      <span className="font-semibold">{report.title}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formattedDate} • {formattedTime}
                    </div>
                    
                    <div className="mt-2 flex w-full gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      <button
                        onClick={() => handleLoadReport(report.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-violet-50 hover:text-violet-600 dark:bg-zinc-800/50 dark:text-zinc-300 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleDirectDownload(report.id)}
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

      {/* Modal for Viewing Report */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 animate-in fade-in duration-200 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 sm:p-6 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h3 className="font-bold text-lg sm:text-xl">{selectedReportModal.title}</h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Period: {selectedReportModal.start_date} to {selectedReportModal.end_date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    generatePDF(selectedReportModal.start_date, selectedReportModal.end_date, selectedReportModal.content, selectedReportModal.stats);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:bg-violet-900/50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
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
                <div className="mb-6 border border-zinc-200 rounded-xl p-5 dark:border-zinc-800 flex flex-wrap justify-around text-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                   <div className="flex flex-col items-center"><span className="text-xs text-zinc-500 font-medium">Total Calls</span><p className="mt-1 text-xl font-bold">{selectedReportModal.stats.total}</p></div>
                   <div className="flex flex-col items-center"><span className="text-xs text-zinc-500 font-medium">Completed</span><p className="mt-1 text-xl font-bold text-emerald-600">{selectedReportModal.stats.completed}</p></div>
                   <div className="flex flex-col items-center"><span className="text-xs text-zinc-500 font-medium">Failed</span><p className="mt-1 text-xl font-bold text-red-600">{selectedReportModal.stats.failed}</p></div>
                   <div className="flex flex-col items-center"><span className="text-xs text-zinc-500 font-medium">Hot Leads</span><p className="mt-1 text-xl font-bold text-amber-600">{selectedReportModal.stats.hot}</p></div>
                </div>
              )}
              <div className="prose prose-zinc dark:prose-invert max-w-none text-sm">
                <ReactMarkdown>
                  {selectedReportModal.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
