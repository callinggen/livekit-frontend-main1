"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import { ChevronLeft, ChevronRight, Clock, Plus, Target, User, Bot, PhoneCall, Calendar as CalendarIcon, X, Save, CheckCircle, XCircle } from "lucide-react";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import DetailsDrawer from "@/components/shared/DetailsDrawer";
import { api } from "@/lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type EventType = "campaign" | "followup" | "meeting" | "success" | "failed";

interface CalEvent {
  id: string;
  title: string;
  time: string;
  type: EventType;
  contactOrCampaign: string;
  agent?: string;
  notes: string;
  date?: string;
}

// Helper to format Date to YYYY-MM-DD
function toKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  const today = new Date();
  
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toKey(today.getFullYear(), today.getMonth(), today.getDate()));
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  // BUG-003: Schedule Event modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalEvent>>({
    title: "", type: "meeting", time: "09:00 AM", contactOrCampaign: "", agent: "", notes: "",
  });

  // BUG-005: Edit Event modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalEvent | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Dynamically generate dummy events relative to the current month
  const [dummyEvents, setDummyEvents] = useState<Record<string, CalEvent[]>>({});

  useEffect(() => {
    if (!isLoggedIn) return;

    Promise.all([api.getCampaigns(), api.getCalls()])
      .then(([cData, callData]) => {
        const events: Record<string, CalEvent[]> = {};

        const pushEvent = (dateKey: string, event: CalEvent) => {
          if (!events[dateKey]) events[dateKey] = [];
          events[dateKey].push(event);
        };

        // 1. Map Campaigns from backend schedule
        cData.forEach(c => {
          if (c.schedule) {
            // c.schedule is like "2026-07-22T08:30:00.000Z UTC"
            // We need to parse it to a local date string to get YYYY-MM-DD
            const isoString = c.schedule.split(" ")[0]; // "2026-07-22T08:30:00.000Z"
            let dateKey = isoString;
            let timeStr = "09:00 AM";
            try {
              if (isoString.includes("T")) {
                const d = new Date(isoString);
                dateKey = toKey(d.getFullYear(), d.getMonth(), d.getDate());
                timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } else {
                dateKey = isoString;
                timeStr = c.schedule.split(" ").slice(1).join(" ") || "09:00 AM";
              }
            } catch (e) {
              // fallback
            }

            // Determine if this campaign is upcoming, success, or failed based on its calls
            let type: EventType = "campaign";
            let notes = c.script || "AI Campaign run.";
            if (c.status === "Completed") {
               type = "success";
               notes = `Completed: ${c.completedCalls} Success, ${c.failedCalls} Failed out of ${c.totalCalls} calls.`;
            } else if (c.status === "Failed") {
               type = "failed";
               notes = `Failed: ${c.completedCalls} Success, ${c.failedCalls} Failed out of ${c.totalCalls} calls.`;
            } else if (c.status === "Running") {
               type = "campaign";
               notes = `Running: ${c.completedCalls} Success, ${c.failedCalls} Failed out of ${c.totalCalls} calls.`;
            }

            pushEvent(dateKey, {
              id: `campaign-${c.id}`,
              title: `Launch: ${c.name}`,
              time: timeStr,
              type: type,
              contactOrCampaign: c.name,
              agent: c.agent,
              notes: notes,
              date: dateKey,
            });
          }
        });

        // 2. Map Booked Appointments from Calls
        callData.forEach(call => {
          // A. If an appointment was booked
          if (call.appointment_date) {
            const dateKey = call.appointment_date;
            pushEvent(dateKey, {
              id: `appt-${call.id}`,
              title: `Appt: ${call.name}`,
              time: call.appointment_time || "12:00 PM",
              type: "meeting",
              contactOrCampaign: call.name,
              agent: "AI Agent",
              notes: call.notes || "Booked appointment follow-up.",
              date: dateKey,
            });
          }
        });

        setDummyEvents(events);
      })
      .catch(err => {
        console.warn("Failed to fetch calendar events:", err);
      });
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  /* ── Calendar grid helpers ── */
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { day: number; current: boolean; key: string }[] = [];
  
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, current: false, key: toKey(viewMonth === 0 ? viewYear - 1 : viewYear, viewMonth === 0 ? 11 : viewMonth - 1, prevMonthDays - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true, key: toKey(viewYear, viewMonth, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, key: toKey(viewMonth === 11 ? viewYear + 1 : viewYear, viewMonth === 11 ? 0 : viewMonth + 1, d) });
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const jumpToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(toKey(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const selectedEvents = dummyEvents[selectedDateKey] || [];

  const getEventVariant = (type: EventType): BadgeVariant => {
    switch (type) {
      case "campaign": return "primary";
      case "followup": return "warning";
      case "meeting": return "neutral";
      case "success": return "success";
      case "failed": return "error";
    }
  };

  const getEventColors = (type: EventType) => {
    switch (type) {
      case "campaign": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30";
      case "followup": return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-200 dark:border-amber-500/30";
      case "meeting": return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
      case "success": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30";
      case "failed": return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-200 dark:border-rose-500/30";
    }
  };

  // BUG-003: Save new scheduled event
  const handleSaveNewEvent = () => {
    if (!newEvent.title?.trim()) return;
    const id = `new-${Date.now()}`;
    const event: CalEvent = {
      id,
      title: newEvent.title!,
      time: newEvent.time || "09:00 AM",
      type: (newEvent.type as EventType) || "meeting",
      contactOrCampaign: newEvent.contactOrCampaign || "",
      agent: newEvent.agent || "",
      notes: newEvent.notes || "",
      date: selectedDateKey,
    };
    setDummyEvents(prev => ({
      ...prev,
      [selectedDateKey]: [...(prev[selectedDateKey] || []), event],
    }));
    setShowScheduleModal(false);
    setNewEvent({ title: "", type: "meeting", time: "09:00 AM", contactOrCampaign: "", agent: "", notes: "" });
  };

  // BUG-005: Save edited event
  const handleSaveEdit = () => {
    if (!editEvent) return;
    setDummyEvents(prev => {
      const dateKey = editEvent.date!;
      const updated = (prev[dateKey] || []).map(e => e.id === editEvent.id ? editEvent : e);
      return { ...prev, [dateKey]: updated };
    });
    setSelectedEvent(editEvent);
    setShowEditModal(false);
    setEditEvent(null);
  };

  return (
    <DashboardShell title="Calendar">
      <div className="flex flex-col h-[calc(100vh-80px)] p-1 sm:p-4">
        
        {/* Top Header */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Calendar</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage your scheduled campaigns and follow-up calls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* BUG-003: Opens real modal instead of browser alert */}
            <button 
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Schedule Event
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex flex-1 gap-6 overflow-hidden flex-col lg:flex-row">
          
          {/* Calendar Grid (Left) */}
          <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800 shrink-0">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={jumpToToday} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 mx-1">
                  Today
                </button>
                <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20 shrink-0">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">{d}</div>
              ))}
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-zinc-100 gap-[1px] dark:bg-zinc-800/50">
              {cells.map((cell, idx) => {
                const isToday = cell.key === toKey(today.getFullYear(), today.getMonth(), today.getDate());
                const isSelected = cell.key === selectedDateKey;
                const events = dummyEvents[cell.key] || [];
                
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDateKey(cell.key);
                      const d = new Date(cell.key + "T00:00:00");
                      if (d.getMonth() !== viewMonth) {
                        setViewMonth(d.getMonth());
                        setViewYear(d.getFullYear());
                      }
                    }}
                    className={`relative flex min-h-[100px] flex-col bg-white p-2 transition cursor-pointer hover:bg-zinc-50 dark:bg-[#0B0F19] dark:hover:bg-zinc-900 ${
                      !cell.current ? "opacity-50" : ""
                    } ${isSelected ? "ring-2 ring-inset ring-indigo-500/50 dark:ring-indigo-400/50 bg-indigo-50/10 dark:bg-indigo-900/10" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                        isToday ? "bg-indigo-600 text-white shadow-md"
                          : isSelected ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}>
                        {cell.day}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 overflow-y-auto no-scrollbar">
                      {events.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                          className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold border sm:text-xs transition hover:brightness-95 ${getEventColors(ev.type)}`}
                        >
                          {ev.time} - {ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <p className="text-[10px] font-semibold text-zinc-500 pl-1">+{events.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="flex w-full flex-col lg:w-80 shrink-0 gap-4 overflow-y-auto">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19]">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Schedule For</p>
              <h3 className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-white">
                {new Date(selectedDateKey + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedEvents.length === 0 ? "No events scheduled" : `${selectedEvents.length} event${selectedEvents.length > 1 ? "s" : ""} scheduled`}
              </p>
            </div>

            <div className="flex flex-col gap-3 pb-4">
              {selectedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
                  <CalendarIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Your day is clear.</p>
                </div>
              ) : (
                selectedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="group flex flex-col items-start gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <Badge variant={getEventVariant(ev.type)}>{ev.type}</Badge>
                      <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                        <Clock className="h-3 w-3" />{ev.time}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{ev.title}</h4>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      {ev.type === "campaign" ? <Target className="h-3 w-3" /> : ev.type === "success" ? <CheckCircle className="h-3 w-3" /> : ev.type === "failed" ? <XCircle className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {ev.contactOrCampaign}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Drawer */}
      <DetailsDrawer isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Event Details">
        {selectedEvent && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#121622]">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${getEventColors(selectedEvent.type)}`}>
                  {selectedEvent.type === "campaign" ? <PhoneCall className="h-6 w-6" /> 
                   : selectedEvent.type === "success" ? <CheckCircle className="h-6 w-6" />
                   : selectedEvent.type === "failed" ? <XCircle className="h-6 w-6" />
                   : selectedEvent.type === "followup" ? <User className="h-6 w-6" /> 
                   : <CalendarIcon className="h-6 w-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{selectedEvent.title}</h2>
                  <p className="text-sm text-zinc-500">{new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at {selectedEvent.time}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Information</h3>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="flex items-center gap-1.5 text-zinc-500 mb-1"><Target className="h-3.5 w-3.5" /> Target</span>
                  <p className="font-semibold dark:text-white">{selectedEvent.contactOrCampaign}</p>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-zinc-500 mb-1"><Bot className="h-3.5 w-3.5" /> Assigned Agent</span>
                  <p className="font-semibold dark:text-white">{selectedEvent.agent || "N/A"}</p>
                </div>
                <div className="sm:col-span-2 mt-2">
                  <span className="text-zinc-500">Notes</span>
                  <p className="mt-1 font-medium text-zinc-700 dark:text-zinc-300">{selectedEvent.notes}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-[#121622] dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              {/* BUG-005/006: Wire action button */}
              <button 
                onClick={() => {
                  if (selectedEvent.type === "campaign") {
                    // BUG-006: View Campaign navigates to campaigns list
                    router.push("/campaign");
                  } else {
                    // BUG-005: Edit Event opens edit modal
                    setEditEvent({ ...selectedEvent });
                    setShowEditModal(true);
                    setSelectedEvent(null);
                  }
                }}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                {selectedEvent.type === "campaign" ? "View Campaign" : "Edit Event"}
              </button>
            </div>
          </div>
        )}
      </DetailsDrawer>

      {/* BUG-003: Schedule Event Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-[#121622]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Schedule Event</h3>
              <button onClick={() => setShowScheduleModal(false)} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Event Title *</label>
                <input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Q4 Campaign Launch"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Type</label>
                  <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as EventType }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value="campaign">Campaign</option>
                    <option value="followup">Follow-up</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Time</label>
                  <input type="time" value={newEvent.time?.replace(" AM","").replace(" PM","")}
                    onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Contact / Campaign</label>
                <input value={newEvent.contactOrCampaign} onChange={e => setNewEvent(p => ({ ...p, contactOrCampaign: e.target.value }))}
                  placeholder="e.g. Alice Johnson"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Notes</label>
                <textarea value={newEvent.notes} onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Optional notes..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">Cancel</button>
              <button onClick={handleSaveNewEvent} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                <Save className="h-4 w-4" /> Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUG-005: Edit Event Modal */}
      {showEditModal && editEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-zinc-800 dark:bg-[#121622]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Edit Event</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Event Title</label>
                <input value={editEvent.title} onChange={e => setEditEvent(p => p ? { ...p, title: e.target.value } : p)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Type</label>
                  <select value={editEvent.type} onChange={e => setEditEvent(p => p ? { ...p, type: e.target.value as EventType } : p)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                    <option value="campaign">Campaign</option>
                    <option value="followup">Follow-up</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Time</label>
                  <input type="time" value={editEvent.time?.replace(" AM","").replace(" PM","")}
                    onChange={e => setEditEvent(p => p ? { ...p, time: e.target.value } : p)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">Notes</label>
                <textarea value={editEvent.notes} onChange={e => setEditEvent(p => p ? { ...p, notes: e.target.value } : p)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
