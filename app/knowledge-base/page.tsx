"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  api,
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeStats,
} from "@/lib/api";
import {
  Brain,
  Upload,
  Globe,
  FileSpreadsheet,
  HelpCircle,
  FileText,
  Search,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Layers,
  X,
  Database,
  Eye,
  Info,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";

type IngestType = "file" | "url" | "sheet" | "faq" | "text";

export default function KnowledgeBasePage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Ingest Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<IngestType>("file");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form Fields
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetTitle, setSheetTitle] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("General");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textCategory, setTextCategory] = useState("Service Overview");

  // Document Detail / Content Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDocumentDetail | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [syncingDocId, setSyncingDocId] = useState<number | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await api.getKnowledgeStats();
      setStats(data);
    } catch (err: any) {
      console.warn("Error fetching knowledge stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledgeDocuments({
        source_type: selectedFilter === "all" ? undefined : selectedFilter,
        search: searchQuery,
        page,
        page_size: 20,
      });
      const items = Array.isArray(data) ? data : ((data as any)?.items || []);
      setDocuments(items);
      setTotalPages(Math.max(1, Math.ceil(items.length / 20)));
    } catch (err: any) {
      console.warn("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, searchQuery, page]);

  useEffect(() => {
    loadStats();
    loadDocuments();
  }, [loadStats, loadDocuments]);

  // Handle Ingest Submission
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (activeTab === "file") {
        if (!fileToUpload) {
          showToast("Please select a file to upload.", "error");
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", fileToUpload);
        if (fileTitle.trim()) formData.append("title", fileTitle.trim());
        await api.ingestKnowledgeFile(formData);
        showToast("File document processed and vector chunks indexed successfully!");
        setFileToUpload(null);
        setFileTitle("");
      } else if (activeTab === "url") {
        if (!urlInput.trim()) {
          showToast("Please enter a valid website URL.", "error");
          setSubmitting(false);
          return;
        }
        await api.ingestKnowledgeUrl({
          url: urlInput.trim(),
          title: urlTitle.trim() || undefined,
        });
        showToast("Webpage scraped and indexed into knowledge base!");
        setUrlInput("");
        setUrlTitle("");
      } else if (activeTab === "sheet") {
        if (!sheetUrl.trim()) {
          showToast("Please enter a Google Sheet URL.", "error");
          setSubmitting(false);
          return;
        }
        await api.ingestKnowledgeGoogleSheet({
          sheet_url: sheetUrl.trim(),
          title: sheetTitle.trim() || undefined,
        });
        showToast("Google Sheet connected and indexed! Auto-sync is enabled.");
        setSheetUrl("");
        setSheetTitle("");
      } else if (activeTab === "faq") {
        if (!faqQuestion.trim() || !faqAnswer.trim()) {
          showToast("Please provide both a Question and an Answer.", "error");
          setSubmitting(false);
          return;
        }
        await api.ingestKnowledgeFaq({
          question: faqQuestion.trim(),
          answer: faqAnswer.trim(),
          category: faqCategory.trim() || undefined,
        });
        showToast("FAQ knowledge pair saved and indexed!");
        setFaqQuestion("");
        setFaqAnswer("");
      } else if (activeTab === "text") {
        if (!textTitle.trim() || !textContent.trim()) {
          showToast("Please provide a Title and Content.", "error");
          setSubmitting(false);
          return;
        }
        await api.ingestKnowledgeText({
          title: textTitle.trim(),
          content: textContent.trim(),
          source_type: textCategory.toLowerCase().replace(/\s+/g, "_"),
        });
        showToast("Service knowledge text added and indexed!");
        setTextTitle("");
        setTextContent("");
      }

      setIsModalOpen(false);
      loadStats();
      loadDocuments();
    } catch (err: any) {
      console.error("Ingest error:", err);
      showToast(err.message || "Failed to process knowledge source.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Preview Modal with Full Text and Chunks
  const handleOpenPreview = async (doc: KnowledgeDocument) => {
    setLoadingPreview(true);
    setPreviewDoc(null);
    try {
      const detail = await api.getKnowledgeDocument(doc.id);
      setPreviewDoc(detail);
    } catch (err: any) {
      showToast(err.message || "Could not load document preview.", "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Sync document
  const handleSync = async (doc: KnowledgeDocument) => {
    setSyncingDocId(doc.id);
    try {
      await api.syncKnowledgeDocument(doc.id);
      showToast(`Successfully refreshed and synced "${doc.title}".`);
      loadStats();
      loadDocuments();
    } catch (err: any) {
      showToast(err.message || "Failed to sync document.", "error");
    } finally {
      setSyncingDocId(null);
    }
  };

  // Delete document
  const handleDelete = async (docId: number) => {
    if (!confirm("Are you sure you want to remove this document and its vector embeddings?")) return;
    setDeletingDocId(docId);
    try {
      await api.deleteKnowledgeDocument(docId);
      showToast("Knowledge document removed.");
      loadStats();
      loadDocuments();
    } catch (err: any) {
      showToast(err.message || "Failed to delete document.", "error");
    } finally {
      setDeletingDocId(null);
    }
  };

  const getSourceBadge = (type: string) => {
    switch (type) {
      case "pdf":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60">
            <FileText className="w-3.5 h-3.5 text-rose-500" /> PDF Document
          </span>
        );
      case "docx":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60">
            <FileText className="w-3.5 h-3.5 text-blue-500" /> Word DOCX
          </span>
        );
      case "csv":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> CSV Sheet
          </span>
        );
      case "sheet":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60">
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /> Google Sheet (Sync)
          </span>
        );
      case "url":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60">
            <Globe className="w-3.5 h-3.5 text-indigo-500" /> Web Link
          </span>
        );
      case "faq":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" /> FAQ / Q&A
          </span>
        );
      case "image":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60">
            <FileText className="w-3.5 h-3.5 text-purple-500" /> Image / Poster
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
            <BookOpen className="w-3.5 h-3.5 text-violet-500" /> {type.toUpperCase().replace(/_/g, " ")}
          </span>
        );
    }
  };

  return (
    <DashboardShell title="Knowledge Base">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-500/20"
              : "bg-rose-600 text-white shadow-rose-500/20"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Simple & Clean Dashboard Header Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-900">
                  <Brain className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Company Knowledge Base
                </h1>
                <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-100 dark:border-violet-900">
                  Voice AI Brain
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Manage company documents, services, FAQs, spreadsheets, and URLs for your AI voice agents.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-add-knowledge"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Knowledge Source
              </button>
            </div>
          </div>

          {/* Clean Metric Stats Cards */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-800">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Documents
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">
                {statsLoading ? "..." : stats?.total_documents ?? 0}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Indexed Chunks (RAG)
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400 mt-1">
                {statsLoading ? "..." : stats?.total_chunks ?? 0}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Active Sources
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {statsLoading ? "..." : Object.keys(stats?.source_breakdown || {}).length}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Auto-Sync Status
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live & Synced
              </div>
            </div>
          </div>
        </div>

        {/* Knowledge Sources Table Section */}
        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm overflow-hidden">
          {/* Filter / Search Bar */}
          <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All Sources" },
                { id: "sheet", label: "Google Sheets" },
                { id: "pdf", label: "PDFs" },
                { id: "docx", label: "Word Docs" },
                { id: "url", label: "Web Links" },
                { id: "faq", label: "FAQs" },
                { id: "raw", label: "Text / Services" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedFilter === tab.id
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge docs..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Document Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-100 dark:border-zinc-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Document / Material Title</th>
                  <th className="px-5 py-3.5">Source Type</th>
                  <th className="px-5 py-3.5">Chunks Indexed</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-500" />
                      Loading knowledge documents...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-zinc-400">
                      <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 flex items-center justify-center mx-auto mb-3">
                        <Database className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                        No knowledge items ingested yet
                      </p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                        Add website URLs, PDFs, Google Sheets, FAQs, or service policies to train your voice AI agent.
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Knowledge Source
                      </button>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span
                            onClick={() => handleOpenPreview(doc)}
                            className="hover:text-violet-600 cursor-pointer hover:underline transition-colors"
                          >
                            {doc.title}
                          </span>
                          {doc.source_url && (
                            <a
                              href={doc.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-violet-600 transition-colors"
                              title="Open original link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        {doc.source_url && (
                          <div className="text-[11px] text-zinc-400 truncate max-w-xs mt-0.5 font-mono">
                            {doc.source_url}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">{getSourceBadge(doc.source_type)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          <Layers className="w-3 h-3 text-violet-500" />
                          {doc.chunk_count}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {doc.status === "ready" || doc.status === "indexed" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ready
                          </span>
                        ) : doc.status === "syncing" ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <RefreshCw className="w-3 h-3 animate-spin" /> Syncing...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold" title={doc.error_message || ""}>
                            <AlertCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {doc.updated_at
                          ? new Date(doc.updated_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Content Button */}
                          <button
                            onClick={() => handleOpenPreview(doc)}
                            title="View full text and chunks"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Sync button for URL or Google Sheet */}
                          {(doc.source_type === "sheet" || doc.source_type === "url") && (
                            <button
                              onClick={() => handleSync(doc)}
                              disabled={syncingDocId === doc.id}
                              title="Re-sync latest data from source"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors disabled:opacity-40"
                            >
                              <RefreshCw className={`w-4 h-4 ${syncingDocId === doc.id ? "animate-spin text-violet-600" : ""}`} />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingDocId === doc.id}
                            title="Delete document and remove vector chunks"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CONTENT / TEXT PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {(previewDoc || loadingPreview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {loadingPreview ? "Loading Knowledge Material..." : previewDoc?.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    {previewDoc && getSourceBadge(previewDoc.source_type)}
                    {previewDoc?.chunks && (
                      <span>• {previewDoc.chunks.length} Chunks Indexed</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {loadingPreview ? (
                <div className="py-16 text-center text-zinc-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                  Loading document content and chunks...
                </div>
              ) : previewDoc ? (
                <>
                  {previewDoc.source_url && (
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs flex items-center justify-between">
                      <span className="text-zinc-500 font-medium">Source URL:</span>
                      <a
                        href={previewDoc.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 truncate max-w-md"
                      >
                        {previewDoc.source_url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Extracted Text Content */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-violet-500" /> Extracted Full Text Content
                    </h4>
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {previewDoc.extracted_text || "No plain text representation available."}
                    </div>
                  </div>

                  {/* Chunks Breakdown */}
                  {previewDoc.chunks && previewDoc.chunks.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-violet-500" /> Indexed Vector Chunks ({previewDoc.chunks.length})
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                        {previewDoc.chunks.map((chunk, cIdx) => (
                          <div
                            key={chunk.id || cIdx}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                              <span className="font-bold text-violet-700 dark:text-violet-300">
                                Chunk #{chunk.chunk_index + 1}
                              </span>
                              <span>{chunk.word_count} words</span>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] leading-relaxed">
                              {chunk.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ADD KNOWLEDGE SOURCE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-600">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Add Knowledge Source
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Ingest verified info for Voice AI agent call-time retrieval.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Type Tabs */}
            <div className="grid grid-cols-5 p-2 bg-zinc-100 dark:bg-zinc-800/80 gap-1 border-b border-zinc-200 dark:border-zinc-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === "file"
                    ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-sm font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Upload className="w-4 h-4" /> Files / PDFs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("sheet")}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === "sheet"
                    ? "bg-white dark:bg-zinc-900 text-green-600 dark:text-green-400 shadow-sm font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Google Sheet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === "url"
                    ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Globe className="w-4 h-4" /> Website Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faq")}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === "faq"
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <HelpCircle className="w-4 h-4" /> FAQ / Q&A
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                  activeTab === "text"
                    ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <FileText className="w-4 h-4" /> Custom Text
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleIngest} className="p-6 space-y-4">
              {/* File Upload Tab */}
              {activeTab === "file" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Document Title (Optional override)
                    </label>
                    <input
                      type="text"
                      value={fileTitle}
                      onChange={(e) => setFileTitle(e.target.value)}
                      placeholder="e.g. 2026 Product Catalog & Pricing"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl p-6 text-center hover:border-violet-500 transition-colors bg-zinc-50/50 dark:bg-zinc-800/30">
                    <input
                      type="file"
                      id="kb-file-upload"
                      accept=".pdf,.docx,.doc,.csv,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFileToUpload(e.target.files[0]);
                          if (!fileTitle) {
                            setFileTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="kb-file-upload" className="cursor-pointer block">
                      <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {fileToUpload ? fileToUpload.name : "Click or drag & drop documents"}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Supported: PDF, Word (DOCX), CSV, TXT, or Product Poster Images (up to 25MB)
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Google Sheet Tab */}
              {activeTab === "sheet" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Sheet / Catalog Name
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      placeholder="e.g. Live Inventory & Price List"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Google Sheet Public / Viewable URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-violet-500" />
                      Ensure the Google Sheet is shared with &quot;Anyone with the link can view&quot;. CallingGen will parse rows into knowledge embeddings.
                    </p>
                  </div>
                </div>
              )}

              {/* Web Link Tab */}
              {activeTab === "url" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Page Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="e.g. Official Services & Warranty Terms"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Webpage URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourcompany.com/about-us"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      CallingGen will extract clean text, remove headers/ads, chunk paragraphs, and generate vector embeddings.
                    </p>
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === "faq" && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Category (e.g. Billing, Returns, Timings)
                    </label>
                    <input
                      type="text"
                      value={faqCategory}
                      onChange={(e) => setFaqCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Customer Question *
                    </label>
                    <input
                      type="text"
                      required
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      placeholder="e.g. What is your return and refund policy?"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Accurate Company Answer *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      placeholder="e.g. We accept returns within 14 days of delivery in original condition. Refunds are processed within 3-5 business days."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>
              )}

              {/* Custom Text Tab */}
              {activeTab === "text" && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Topic / Service Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={textTitle}
                        onChange={(e) => setTextTitle(e.target.value)}
                        placeholder="e.g. Premium Consulting Service"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Category Tag
                      </label>
                      <input
                        type="text"
                        value={textCategory}
                        onChange={(e) => setTextCategory(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Full Text / Service Description *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Provide detailed descriptions of your offerings, packages, terms, contact details, or business background..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-knowledge-ingest"
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Ingesting & Embedding...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ingest into Knowledge Brain</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
