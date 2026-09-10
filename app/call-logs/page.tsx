"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  Search, Download, PlayCircle, FileText, ChevronDown, X,
  CheckCircle2, PhoneCall, Phone, Mic, User, Zap,
  ArrowUpDown, ArrowUp, ArrowDown, Edit3, Trash2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import React from "react";
import { api } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");
const PAGE_SIZE = 100;

export default function CallLogsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // Server-side paginated data
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters (applied server-side when possible, client-side for the rest)
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");   // debounced
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDirection, setFilterDirection] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterResponse, setFilterResponse] = useState("All");
  const [filterAgent, setFilterAgent] = useState("All");

  // Sorting (client-side within page)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null });

  // Selection
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Modals
  const [selectedCall, setSelectedCall] = useState<any | null>(null);

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const fetchCalls = useCallback(async (currentPage: number, currentSearch: string, currentStatus: string, currentDirection: string) => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, page_size: PAGE_SIZE };
      if (currentSearch) params.search = currentSearch;
      if (currentStatus !== "All") params.status = currentStatus;
      if (currentDirection !== "All") params.direction = currentDirection;

      const res = await api.getCalls(params);
      const mapped = res.calls.map((r: any, i: number) => ({
        id: r.id ? Number(r.id) : i,
        name: r.name || r.customer_name || "Unknown",
        phone: r.phone || "N/A",
        type: r.direction ? r.direction.toUpperCase() : "OUTBOUND",
        duration: r.duration || "00:00",
        datetime: r.datetime,
        credits: r.creditsDeducted ?? 0,
        response: (r.response || "NO ANSWER").toUpperCase(),
        status: (r.status || "COMPLETED").toUpperCase(),
        humanResponse: r.human_response || "",
        aiClass: r.summary || "Pending",
        agent: r.agent_name || "Sales Agent",
        campaign: r.campaign || "General",
        category: (r.category || "UNCATEGORIZED").toUpperCase(),
        sentiment: r.sentiment || "Neutral",
        transcript: r.transcript || [],
        recording_url: r.recording_url || "",
        caller_number: r.caller_number || "",
        called_number: r.called_number || "",
      }));
      setData(mapped);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load calls:", err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    fetchCalls(page, search, filterStatus, filterDirection);
  }, [isLoggedIn, router, page, search, filterStatus, filterDirection, fetchCalls]);

  if (!isLoggedIn) return null;

  // Client-side filter (category, response, agent) on the current page
  const clientFiltered = data.filter((r) => {
    if (filterCategory !== "All" && r.category !== filterCategory) return false;
    if (filterResponse !== "All" && r.response !== filterResponse) return false;
    if (filterAgent !== "All" && r.agent !== filterAgent) return false;
    return true;
  });

  // Sort within page
  const processedData = (() => {
    if (!sortConfig.key || !sortConfig.direction) return clientFiltered;
    return [...clientFiltered].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortConfig.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  })();

  // Unique options (from current page data)
  const uniqueCategories = ["All", ...Array.from(new Set(data.map((d) => d.category)))];
  const uniqueAgents = ["All", ...Array.from(new Set(data.map((d) => d.agent)))];
  const uniqueResponses = ["All", ...Array.from(new Set(data.map((d) => d.response)))];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    else if (sortConfig.key === key && sortConfig.direction === "desc") direction = null;
    setSortConfig({ key: direction ? key : "", direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />;
    if (sortConfig.direction === "asc") return <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-primary" />;
    return <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-primary" />;
  };

  const toggleRow = (id: number) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedRows.length === processedData.length && processedData.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(processedData.map((r) => r.id));
    }
  };

  const startEdit = (id: number, currentVal: string) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const saveEdit = async (id: number) => {
    const callRow = data.find((r) => r.id === id);
    const prevValue = callRow?.humanResponse || "";
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, humanResponse: editValue } : r)));
    setEditingId(null);
    try {
      await api.updateHumanResponse(id.toString(), editValue);
    } catch (error) {
      console.error("Failed to save human response:", error);
      setData((prev) => prev.map((r) => (r.id === id ? { ...r, humanResponse: prevValue } : r)));
      alert("Failed to save your response. Please try again.");
    }
  };

  const handleExportCSV = () => {
    const rowsToExport = selectedRows.length > 0
      ? processedData.filter((r) => selectedRows.includes(r.id))
      : processedData;

    if (rowsToExport.length === 0) {
      alert("No call logs available to export.");
      return;
    }

    const headers = [
      "Call ID", "Name", "Phone", "Direction", "Duration", "Credits",
      "AI Classification", "Response", "Status", "Human Response",
      "Category", "Date & Time", "Campaign", "Agent", "Sentiment", "Recording URL"
    ];
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.map((h) => escapeCSV(h)).join(","),
      ...rowsToExport.map((r) => [
        escapeCSV(r.id), escapeCSV(r.name), escapeCSV(r.phone), escapeCSV(r.type),
        escapeCSV(r.duration), escapeCSV(r.credits ?? 0), escapeCSV(r.aiClass), escapeCSV(r.response), escapeCSV(r.status),
        escapeCSV(r.humanResponse || "Not Called"), escapeCSV(r.category), escapeCSV(r.datetime),
        escapeCSV(r.campaign || "General"), escapeCSV(r.agent || "Sales Agent"), escapeCSV(r.sentiment || "Neutral"), escapeCSV(r.recording_url || ""),
      ].join(",")),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `call_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPillColor = (val: string, type: "response" | "status" | "category" | "type") => {
    if (type === "type") return val === "INBOUND" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200";
    const v = (val || "").toUpperCase();
    if (v.includes("DO NOT CALL") || v.includes("REFUSAL") || v === "NOT INTERESTED" || v === "INVALID" || v === "FAILED" || v.includes("CUT")) return "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200";
    if (v === "INTERESTED" || v === "HOT" || v === "COMPLETED" || v.includes("BOOKED")) return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200";
    if (v === "CALLBACK" || v === "WARM" || v === "RUNNING") return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200";
    if (v === "VOICEMAIL" || v === "INCOMPLETE") return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200";
    if (v === "COLD" || v === "NO ANSWER" || v === "MISSED CALL") return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  const pageStart = (page - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <DashboardShell title="Call Logs">
      <div className="flex-1 p-4 lg:p-6 max-w-full overflow-hidden flex flex-col h-full bg-background relative w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Call Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time inbound and outbound call logs, transcripts, and AI analysis.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setRefreshing(true); fetchCalls(page, search, filterStatus, filterDirection); }}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh current page"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-2 border-b border-border/50">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, phone, AI class, campaign…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {[
              {
                val: filterDirection, set: (v: string) => { setFilterDirection(v); setPage(1); },
                options: ["All", "OUTBOUND", "INBOUND"], label: "Direction"
              },
              {
                val: filterStatus, set: (v: string) => { setFilterStatus(v); setPage(1); },
                options: ["All", "completed", "failed", "in_progress", "dialing", "incomplete"], label: "Status"
              },
              {
                val: filterResponse, set: setFilterResponse,
                options: uniqueResponses, label: "Response"
              },
              {
                val: filterCategory, set: setFilterCategory,
                options: uniqueCategories, label: "Category"
              },
              {
                val: filterAgent, set: setFilterAgent,
                options: uniqueAgents, label: "Agent"
              },
            ].map((f) => (
              <div key={f.label} className="relative group shrink-0">
                <select
                  value={f.val}
                  onChange={(e) => f.set(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt === "All" ? `All ${f.label}s` : opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="ml-auto shrink-0 pl-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm cursor-pointer active:scale-95"
              title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected row(s)` : "Export this page to CSV"}
            >
              <Download className="w-4 h-4" /> Export{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-card shadow-sm w-full">
          <div className="w-full min-w-max">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground sticky top-0 z-10 border-b border-border/50 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === processedData.length && processedData.length > 0}
                      onChange={toggleAll}
                      className="rounded border-border accent-primary w-4 h-4 cursor-pointer"
                    />
                  </th>
                  {[
                    { key: "name", label: "Name" },
                    { key: "phone", label: "Phone" },
                    { key: "type", label: "Direction" },
                    { key: "duration", label: "Duration" },
                    { key: "credits", label: "Credits" },
                    { key: "aiClass", label: "AI Classification" },
                    { key: "response", label: "Response" },
                    { key: "status", label: "Status" },
                    { key: "humanResponse", label: "Human Response" },
                    { key: "category", label: "Category" },
                    { key: null, label: "Recording / Script" },
                    { key: "datetime", label: "Date & Time" },
                    { key: "campaign", label: "Campaign" },
                    { key: "agent", label: "Agent" },
                  ].map((col, idx) => (
                    <th
                      key={idx}
                      className={`px-3 py-3 font-semibold ${col.key ? "cursor-pointer hover:bg-accent/50 group select-none transition-colors" : ""}`}
                      onClick={() => col.key && handleSort(col.key)}
                    >
                      {col.label}
                      {col.key && getSortIcon(col.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={15} className="text-center py-16 text-muted-foreground">
                      <div className="flex items-center justify-center gap-3">
                        <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-base">Loading call logs…</span>
                      </div>
                    </td>
                  </tr>
                ) : processedData.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <PhoneCall className="w-10 h-10 opacity-30" />
                        <p className="text-base font-medium">No call logs found</p>
                        <p className="text-sm">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedData.map((row) => {
                    const isSelected = selectedRows.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-accent/40 transition-all cursor-pointer ${isSelected ? "bg-primary/5 hover:bg-primary/10" : ""}`}
                        onClick={() => setSelectedCall(row)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(row.id)}
                            className="rounded border-border accent-primary w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium whitespace-nowrap">{row.name}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-foreground font-medium font-mono text-[13px] bg-accent/50 px-2 py-0.5 rounded-md w-fit border border-border/50">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {row.phone}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.type, "type")}`}>{row.type}</span>
                        </td>
                        <td className="px-3 py-3 text-foreground/80 font-medium whitespace-nowrap">{row.duration}</td>
                        <td className="px-3 py-3 font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap">{row.credits ?? 0}</td>
                        <td className="px-3 py-3 text-foreground/80 whitespace-nowrap max-w-[180px] truncate" title={row.aiClass}>{row.aiClass}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.response, "response")}`}>{row.response}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.status, "status")}`}>{row.status}</span>
                        </td>
                        <td className="px-3 py-3 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                          {editingId === row.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="px-2 py-1 text-sm border border-primary/50 rounded-md bg-background w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(row.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <button onClick={() => saveEdit(row.id)} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded-md transition-colors" title="Done">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/edit border border-transparent hover:border-border/60 hover:bg-accent/30 rounded-md px-2 py-1 cursor-text transition-all" onClick={() => startEdit(row.id, row.humanResponse)}>
                              <span className="text-sm truncate mr-2">{row.humanResponse || <span className="text-muted-foreground italic">Not Called</span>}</span>
                              <span className="text-[10px] text-primary font-medium opacity-0 group-hover/edit:opacity-100 transition-opacity whitespace-nowrap bg-primary/10 px-1.5 py-0.5 rounded">Edit</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.category, "category")}`}>{row.category}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex gap-2 text-indigo-500/80">
                            <button className="hover:text-indigo-600 hover:scale-110 transition-all" onClick={(e) => { e.stopPropagation(); setSelectedCall(row); }}><PlayCircle className="w-4 h-4" /></button>
                            <button className="hover:text-indigo-600 hover:scale-110 transition-all" onClick={(e) => { e.stopPropagation(); setSelectedCall(row); }}><FileText className="w-4 h-4" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">{row.datetime}</td>
                        <td className="px-3 py-3 font-medium text-foreground text-xs whitespace-nowrap">{row.campaign}</td>
                        <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap flex items-center gap-1.5"><User className="w-3 h-3" /> {row.agent}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination bar */}
        {!loading && total > 0 && (
          <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{pageStart.toLocaleString()}</span>–<span className="font-semibold text-foreground">{pageEnd.toLocaleString()}</span> of <span className="font-semibold text-foreground">{total.toLocaleString()}</span> calls
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page number pills */}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number;
                if (totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-foreground"}`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* --- Detail Modal --- */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedCall(null)} />
          <div className="relative bg-card w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="bg-card z-10 border-b border-border p-5 flex flex-col md:flex-row md:justify-between md:items-start shrink-0 gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCall.name}</h2>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm font-medium">
                      <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {selectedCall.phone}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>{selectedCall.datetime}</span>
                    </div>
                  </div>
                </div>

                <div className="h-full w-px bg-border hidden md:block mx-2" />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Status</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.status, "status")}`}>{selectedCall.status}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Direction</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.type, "type")}`}>{selectedCall.type}</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Campaign</p>
                    <p className="font-semibold text-foreground truncate max-w-[120px]" title={selectedCall.campaign}>{selectedCall.campaign}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Agent</p>
                    <p className="font-semibold text-foreground truncate max-w-[120px]" title={selectedCall.agent}>{selectedCall.agent}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Credits</p>
                    <p className="font-semibold text-foreground flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> {selectedCall.credits}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCall(null)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors self-end md:self-auto cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-muted/10">
              {/* Audio Player */}
              <div className="bg-background border border-border/50 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Call Audio Recording
                  </span>
                  <span className="text-xs font-mono font-medium text-primary">Duration: {selectedCall.duration}</span>
                </div>
                {selectedCall.recording_url ? (
                  <audio controls className="w-full h-10 accent-primary" src={selectedCall.recording_url.startsWith("http") ? selectedCall.recording_url : `${BASE}${selectedCall.recording_url}`}>
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div className="text-xs text-muted-foreground/60 italic py-2 text-center bg-muted/20 rounded-lg">
                    No audio recording available for this call
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div className="bg-background border border-border/50 rounded-xl p-5 shadow-xs">
                <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> Full Call Transcript
                </h3>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript.map((msg: any, i: number) => {
                      const isUser = msg.sender?.toLowerCase() === "user" || msg.role === "user";
                      return (
                        <div key={i} className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}>
                          <div className="flex items-center gap-1.5 mb-1 px-1">
                            <span className="text-[11px] font-bold text-muted-foreground">{isUser ? "Contact" : "AI Agent"}</span>
                            {msg.time && <span className="text-[10px] text-muted-foreground/50">{msg.time}</span>}
                          </div>
                          <div className={`p-3 rounded-2xl max-w-[80%] text-sm shadow-2xs ${isUser ? "bg-muted text-foreground rounded-tl-xs" : "bg-primary text-primary-foreground rounded-tr-xs"}`}>
                            {msg.message || msg.text || msg.content}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No transcript recorded for this call.
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis & Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-3 text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Call Information
                  </h4>
                  <div className="bg-background border border-border/50 rounded-xl p-4 shadow-xs flex-1">
                    <ul className="space-y-3 text-xs">
                      <li className="flex justify-between items-center border-b border-border/50 pb-3">
                        <span className="text-muted-foreground">AI Classification</span>
                        <span className="font-medium text-foreground">{selectedCall.aiClass}</span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border/50 pb-3">
                        <span className="text-muted-foreground">Category</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.category, "category")}`}>
                          {selectedCall.category}
                        </span>
                      </li>
                      <li className="flex justify-between items-center border-b border-border/50 pb-3">
                        <span className="text-muted-foreground">Response</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.response, "response")}`}>
                          {selectedCall.response}
                        </span>
                      </li>
                      {selectedCall.caller_number && (
                        <li className="flex justify-between items-center border-b border-border/50 pb-3">
                          <span className="text-muted-foreground">Caller Number</span>
                          <span className="font-mono text-foreground font-medium">{selectedCall.caller_number}</span>
                        </li>
                      )}
                      {selectedCall.called_number && (
                        <li className="flex justify-between items-center border-b border-border/50 pb-3">
                          <span className="text-muted-foreground">Called Number</span>
                          <span className="font-mono text-foreground font-medium">{selectedCall.called_number}</span>
                        </li>
                      )}
                      <li className="flex justify-between items-center pb-1">
                        <span className="text-muted-foreground">Sentiment</span>
                        {(() => {
                          const s = selectedCall.sentiment || "Neutral";
                          if (s === "Negative") return <span className="text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Negative</span>;
                          if (s === "Positive") return <span className="text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Positive</span>;
                          return <span className="text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Neutral</span>;
                        })()}
                      </li>
                    </ul>
                  </div>
                </div>

                {/* WhatsApp Automation Activity */}
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-3 text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" /> WhatsApp Actions
                  </h4>
                  <div className="bg-background border border-border/50 rounded-xl p-4 shadow-xs space-y-2 flex-1">
                    {selectedCall.response === "NO ANSWER" || selectedCall.status === "FAILED" ? (
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Missed call follow-up sent
                        </span>
                        <span className="text-[10px] text-muted-foreground">{selectedCall.datetime}</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Digital asset & summary ready
                        </span>
                        <span className="text-[10px] text-muted-foreground">{selectedCall.datetime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
