"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { 
  Search, Download, PlayCircle, FileText, ChevronDown, X, 
  CheckCircle2, PhoneCall, Phone, Mic, User, Zap,
  ArrowUpDown, ArrowUp, ArrowDown, Edit3, Trash2
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import React from "react";
import { api } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");

// Dummy Data matching the screenshot
const INITIAL_DATA = [
  { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", type: "OUTBOUND", duration: "04:15", datetime: "10/27/2023 04:30 PM", credits: 12, response: "INTERESTED", status: "COMPLETED", humanResponse: "Follow up needed", aiClass: "High Intent Buyer", agent: "Sales AI Agent", category: "HOT" },
  { id: 2, name: "Ananya Iyer", phone: "+91 91234 56789", type: "INBOUND", duration: "08:42", datetime: "10/27/2023 04:45 PM", credits: 24, response: "CALLBACK", status: "COMPLETED", humanResponse: "Meeting scheduled", aiClass: "Needs Information", agent: "Support AI Agent", category: "WARM" },
  { id: 3, name: "Vikram Malhotra", phone: "+91 99887 76555", type: "OUTBOUND", duration: "01:10", datetime: "10/27/2023 07:30 PM", credits: 4, response: "NO ANSWER", status: "COMPLETED", humanResponse: "Unreachable", aiClass: "Unresponsive", agent: "Outreach Bot", category: "COLD" },
  { id: 4, name: "Karan Singh", phone: "+91 98712 34567", type: "OUTBOUND", duration: "00:45", datetime: "10/27/2023 08:05 PM", credits: 2, response: "NOT INTERESTED", status: "COMPLETED", humanResponse: "Do not call", aiClass: "Opt out", agent: "Sales AI Agent", category: "COLD" },
  { id: 5, name: "Marcus Holloway", phone: "+1 415 555 0198", type: "INBOUND", duration: "12:30", datetime: "10/28/2023 02:00 PM", credits: 35, response: "INTERESTED", status: "COMPLETED", humanResponse: "Send Proposal", aiClass: "Ready to Buy", agent: "Premium Sales Agent", category: "HOT" },
  { id: 6, name: "Sarah Jenkins", phone: "+1 212 555 0123", type: "OUTBOUND", duration: "00:00", datetime: "10/28/2023 04:00 PM", credits: 0, response: "INVALID", status: "FAILED", humanResponse: "Wrong number", aiClass: "Failed Connection", agent: "Outreach Bot", category: "UNCATEGORIZED" },
  { id: 7, name: "Robert Chen", phone: "+1 650 555 0155", type: "OUTBOUND", duration: "03:20", datetime: "10/28/2023 05:15 PM", credits: 8, response: "BUSY", status: "RUNNING", humanResponse: "Try again later", aiClass: "Pending Follow-up", agent: "Sales AI Agent", category: "WARM" },
  { id: 8, name: "Priya Patel", phone: "+91 90011 22334", type: "INBOUND", duration: "06:15", datetime: "10/28/2023 06:30 PM", credits: 18, response: "INTERESTED", status: "COMPLETED", humanResponse: "Demo requested", aiClass: "Product Inquiry", agent: "Support AI Agent", category: "HOT" },
  { id: 9, name: "David Smith", phone: "+44 20 7123 4567", type: "OUTBOUND", duration: "03:50", datetime: "10/28/2023 08:45 PM", credits: 11, response: "CALLBACK", status: "COMPLETED", humanResponse: "Call back tomorrow", aiClass: "Scheduling conflict", agent: "Sales AI Agent", category: "WARM" },
  { id: 10, name: "Elena Rodriguez", phone: "+34 91 123 45 67", type: "OUTBOUND", duration: "01:50", datetime: "10/28/2023 10:10 PM", credits: 5, response: "NOT INTERESTED", status: "COMPLETED", humanResponse: "Too expensive", aiClass: "Price objection", agent: "Outreach Bot", category: "COLD" },
];

export default function CallLogsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Filtering
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAgent, setFilterAgent] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterResponse, setFilterResponse] = useState("All");
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  
  // Selection
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  
  // Modals/Popups
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  
  // Edit mode tracking
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    api.getCalls().then((res: any[]) => {
      const mappedData = res.map((r, i) => ({
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
        agent: r.agent_name || r.campaign || "System Agent",
        category: (r.category || "UNCATEGORIZED").toUpperCase(),
        sentiment: r.sentiment || "Neutral",
        transcript: r.transcript || [],
        recording_url: r.recording_url || "",
        caller_number: r.caller_number || "",
        called_number: r.called_number || "",
      }));
      setData(mappedData);
    }).catch(err => {
      console.error("Failed to load calls:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [isLoggedIn, router]);

  if (!isLoggedIn) {
    return null;
  }

  // Filter options
  const uniqueTypes = ["All", ...Array.from(new Set(data.map(d => d.type)))];
  const uniqueCategories = ["All", ...Array.from(new Set(data.map(d => d.category)))];
  const uniqueAgents = ["All", ...Array.from(new Set(data.map(d => d.agent)))];
  const uniqueStatuses = ["All", ...Array.from(new Set(data.map(d => d.status)))];
  const uniqueResponses = ["All", ...Array.from(new Set(data.map(d => d.response)))];

  const processedData = useMemo(() => {
    // Filter
    let filtered = data.filter(r => {
      const matchesSearch = 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        r.phone.includes(search) || 
        r.agent.toLowerCase().includes(search.toLowerCase()) ||
        r.aiClass.toLowerCase().includes(search.toLowerCase());
        
      const matchesType = filterType === "All" || r.type === filterType;
      const matchesCategory = filterCategory === "All" || r.category === filterCategory;
      const matchesAgent = filterAgent === "All" || r.agent === filterAgent;
      const matchesStatus = filterStatus === "All" || r.status === filterStatus;
      const matchesResponse = filterResponse === "All" || r.response === filterResponse;
      
      return matchesSearch && matchesType && matchesCategory && matchesAgent && matchesStatus && matchesResponse;
    });

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const key = sortConfig.key as keyof typeof INITIAL_DATA[0];
        let valA = a[key];
        let valB = b[key];

        // Handle string comparison
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' 
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        
        // Handle number comparison
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return filtered;
  }, [data, search, filterType, filterCategory, filterAgent, filterStatus, filterResponse, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : '', direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-primary" />;
    return <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-primary" />;
  };

  const toggleRow = (id: number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };
  
  const toggleAll = () => {
    if (selectedRows.length === processedData.length && processedData.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(processedData.map(r => r.id));
    }
  };

  const startEdit = (id: number, currentVal: string) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const saveEdit = async (id: number) => {
    // 1. Get current value to restore if API fails
    const callRow = data.find(r => r.id === id);
    const prevValue = callRow?.humanResponse || "";

    // 2. Optimistic local update
    setData(prev => prev.map(r => r.id === id ? { ...r, humanResponse: editValue } : r));
    setEditingId(null);

    // 3. API Call
    try {
      await api.updateHumanResponse(id.toString(), editValue);
    } catch (error) {
      console.error("Failed to save human response:", error);
      // Revert state on failure
      setData(prev => prev.map(r => r.id === id ? { ...r, humanResponse: prevValue } : r));
      alert("Failed to save your response. Please try again.");
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
    if (v === "VOICEMAIL" || v === "INCOMPLETE") {
      return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200";
    }
    if (v === "COLD" || v === "NO ANSWER" || v === "MISSED CALL") {
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300";
    }
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <DashboardShell title="Call Logs">
      <div className="flex-1 p-4 lg:p-6 max-w-full overflow-hidden flex flex-col h-full bg-background relative w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Call Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">A comprehensive view of all inbound and outbound calls with detailed metrics.</p>
          </div>
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <span className="text-sm font-medium"><span className="text-primary font-bold">{selectedRows.length}</span> rows selected</span>
              <div className="w-px h-4 bg-border"></div>
              <button className="flex items-center gap-2 text-primary text-sm font-medium hover:text-primary/80 transition-all">
                <PhoneCall className="w-4 h-4" /> Make Call
              </button>
              <div className="w-px h-4 bg-border"></div>
              <button 
                onClick={() => setSelectedRows([])}
                className="flex items-center gap-1.5 text-muted-foreground text-sm font-medium hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Toolbar - Expanded with more filters and horizontally scrollable if needed */}
        <div className="flex items-center gap-3 mb-6 bg-card p-2 rounded-xl border border-border/50 shadow-sm overflow-x-auto w-full">
          <div className="relative min-w-[200px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          
          <div className="w-px h-6 bg-border shrink-0"></div>
          
          {/* Filter Dropdowns */}
          <div className="flex gap-2 shrink-0">
            {[
              { val: filterType, set: setFilterType, options: uniqueTypes, label: "Direction" },
              { val: filterStatus, set: setFilterStatus, options: uniqueStatuses, label: "Status" },
              { val: filterResponse, set: setFilterResponse, options: uniqueResponses, label: "Response" },
              { val: filterCategory, set: setFilterCategory, options: uniqueCategories, label: "Category" },
              { val: filterAgent, set: setFilterAgent, options: uniqueAgents, label: "Campaign" },
            ].map((f) => (
              <div key={f.label} className="relative group shrink-0">
                <select 
                  value={f.val} 
                  onChange={(e) => f.set(e.target.value)}
                  className="appearance-none flex items-center gap-2 pl-3 pr-8 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent bg-background transition-colors outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {f.options.map(opt => <option key={opt} value={opt}>{opt === "All" ? `All ${f.label}s` : opt}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="ml-auto shrink-0 pl-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        {/* Table Container - Optimized for width */}
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
                    { key: "aiClass", label: "AI Classification" }, // Swapped from Date & Time
                    { key: "response", label: "Response" },
                    { key: "status", label: "Status" },
                    { key: "humanResponse", label: "Human Response" },
                    { key: "category", label: "Category" }, // Moved here
                    { key: null, label: "Recording / Script" }, // Unsortable
                    { key: "datetime", label: "Date & Time" }, // Swapped from AI Classification
                    { key: "agent", label: "Campaign" },
                  ].map((col, idx) => (
                    <th 
                      key={idx} 
                      className={`px-3 py-3 font-semibold ${col.key ? 'cursor-pointer hover:bg-accent/50 group select-none transition-colors' : ''}`}
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
                    <td colSpan={13} className="text-center py-10 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        Loading call logs...
                      </div>
                    </td>
                  </tr>
                ) : processedData.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-10 text-muted-foreground">
                      No call logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  processedData.map((row) => {
                    const isSelected = selectedRows.includes(row.id);
                    return (
                      <tr 
                        key={row.id}
                        className={`hover:bg-accent/40 transition-all cursor-pointer ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
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
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.type, "type")}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-foreground/80 font-medium whitespace-nowrap">{row.duration}</td>
                        <td className="px-3 py-3 text-foreground/80 whitespace-nowrap">{row.aiClass}</td>
                        
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.response, "response")}`}>
                            {row.response}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.status, "status")}`}>
                            {row.status}
                          </span>
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
                                  if(e.key === 'Enter') saveEdit(row.id);
                                  if(e.key === 'Escape') setEditingId(null);
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
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(row.category, "category")}`}>
                            {row.category}
                          </span>
                        </td>
                        
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex gap-2 text-indigo-500/80">
                            <button className="hover:text-indigo-600 hover:scale-110 transition-all"><PlayCircle className="w-4 h-4" /></button>
                            <button className="hover:text-indigo-600 hover:scale-110 transition-all"><FileText className="w-4 h-4" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground text-xs whitespace-nowrap">{row.datetime}</td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap flex items-center gap-1.5"><User className="w-3 h-3"/> {row.agent}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Popup Modal for Details Redesign --- */}
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedCall(null)}></div>
            <div className="relative bg-card w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Modal Header & Actions */}
              <div className="bg-card z-10 border-b border-border p-5 flex flex-col md:flex-row md:justify-between md:items-start shrink-0 gap-4">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Detailed Call Info First */}
                  <div className="flex gap-4 items-center">
                     <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <User className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-3">
                        {selectedCall.name} 
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> {selectedCall.phone}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span>{selectedCall.datetime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-full w-px bg-border hidden md:block mx-2"></div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-sm">
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Status</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.status, "status")}`}>
                        {selectedCall.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Direction</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getPillColor(selectedCall.type, "type")}`}>
                        {selectedCall.type}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Campaign</p>
                      <p className="font-semibold text-foreground truncate max-w-[120px]">{selectedCall.agent}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Credits</p>
                      <p className="font-semibold text-foreground flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> {selectedCall.credits}</p>
                    </div>
                  </div>
                </div>

                {/* Edit / Delete / Close Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => {
                      setData(prev => prev.filter(c => c.id !== selectedCall.id));
                      setSelectedCall(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <div className="w-px h-6 bg-border mx-1"></div>
                  <button onClick={() => setSelectedCall(null)} className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground">
                    <X className="w-5 h-5"/>
                  </button>
                </div>
              </div>
              
              {/* Modal Body: Transcript & Recording Side-by-Side */}
              <div className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto bg-muted/10">
                
                {/* Transcript Section */}
                <div className="flex flex-col h-full">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-primary" /> Call Transcript</h4>
                  <div className="bg-background border border-border/50 rounded-xl p-5 flex-1 min-h-[300px] overflow-y-auto space-y-6 text-sm shadow-sm">
                    {!selectedCall.transcript || selectedCall.transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic">
                        No transcript available.
                      </div>
                    ) : (
                      selectedCall.transcript.map((msg: any, i: number) => {
                        const isAgent = msg.speaker.toLowerCase() === "assistant" || msg.speaker.toLowerCase() === "agent";
                        return (
                          <div key={i} className="flex gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                              isAgent 
                                ? "bg-primary/20 text-primary" 
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {isAgent ? "A" : "C"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-foreground">{isAgent ? "Agent" : "Customer"}</p>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Player & Insights Section */}
                <div className="flex flex-col gap-6 h-full">
                  
                  {/* Player */}
                  <div className="flex flex-col">
                    <h4 className="font-semibold flex items-center gap-2 mb-3"><PlayCircle className="w-4 h-4 text-primary" /> Recording</h4>
                    <div className="bg-background border border-border/50 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[140px]">
                      {!selectedCall.recording_url ? (
                        <div className="text-muted-foreground italic">
                          No recording available for this call.
                        </div>
                      ) : (
                        <audio 
                          src={selectedCall.recording_url.startsWith('http') ? selectedCall.recording_url : BASE + selectedCall.recording_url}
                          controls 
                          className="w-full outline-none"
                          preload="metadata"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Extracted Data */}
                  <div className="flex flex-col flex-1">
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground flex items-center gap-2">Key Insights</h4>
                    <div className="bg-background border border-border/50 rounded-xl p-5 shadow-sm flex-1">
                      <ul className="space-y-4 text-sm">
                        <li className="flex justify-between items-center border-b border-border/50 pb-3">
                          <span className="text-muted-foreground">AI Classification</span>
                          <span className="font-semibold text-foreground bg-accent px-2 py-0.5 rounded-md">{selectedCall.aiClass}</span>
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
                            const cat = (selectedCall.category || "").toUpperCase();
                            const resp = (selectedCall.response || "").toLowerCase();
                            const ai = (selectedCall.aiClass || "").toLowerCase();
                            const isNeg = cat === "COLD" || resp.includes("do not call") || resp.includes("refusal") || resp.includes("not interested") || resp.includes("no answer") || ai.includes("do not call") || ai.includes("refusal");
                            const isPos = !isNeg && (cat === "HOT" || resp.includes("appointment") || resp.includes("interested"));
                            const s = selectedCall.sentiment || (isNeg ? "Negative" : isPos ? "Positive" : "Neutral");

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

                  {/* WhatsApp Automation Activity */}
                  <div className="flex flex-col">
                    <h4 className="font-semibold text-sm mb-3 text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" /> WhatsApp Actions
                    </h4>
                    <div className="bg-background border border-border/50 rounded-xl p-4 shadow-sm space-y-2">
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
      </div>
    </DashboardShell>
  );
}
