"use client";

import { api, ApiContact } from "@/lib/api";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import CampaignForm from "@/components/call-manager/CampaignForm";
import ContactsTable from "@/components/call-manager/ContactsTable";
import { CampaignFormData, Contact, UploadSourceType } from "@/components/call-manager/types";
import { CheckCircle2, X, ArrowRight, Bot, Clock, Users, Sparkles, Layers, Zap, Phone, ShieldCheck, Paperclip, FileText, Image as ImageIcon, Rocket, AlertCircle, Calendar, Edit3, Loader2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface LaunchSuccessModalData {
  campaignId: number;
  campaignName: string;
  agentName: string;
  totalContacts: number;
  remainingContacts?: number;
  scheduleDate: string;
  scheduleTime: string;
  selectionType: "all" | "range";
  startRow?: number;
  endRow?: number;
  uploadSource: string;
}

/** Returns current date/time in IST as { date: "YYYY-MM-DD", time: "HH:MM" } */
function getISTNow() {
  const now = new Date();
  // IST is UTC+5:30
  const istOffset = 5 * 60 + 30; // minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + istOffset * 60000;
  const ist = new Date(istMs);
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, "0");
  const dd = String(ist.getDate()).padStart(2, "0");
  const hh = String(ist.getHours()).padStart(2, "0");
  const min = String(ist.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

const TAXES_AGENT_DEFAULT_SCRIPT = "Hello, this is your AI assistant.";

export default function CallManagerPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { credits, refreshCredits } = useCredits();

  const [formData, setFormData] = useState<CampaignFormData>(() => {
    const { date, time } = getISTNow();
    return {
      campaignTitle: "",
      agent: "",
      scheduleDate: date,
      scheduleTime: time,
      script: "",
      uploadSource: "excel",
      googleSheetUrl: "",
      singleContactName: "",
      singleContactPhone: "",
      outboundPhoneNumber: "",
      selectionType: "all",
      startRow: 1,
      endRow: 1,
      whatsappAutomation: {
        enabled: false,
        rules: [],
      },
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  // File Upload State
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  const [launchSuccessData, setLaunchSuccessData] = useState<LaunchSuccessModalData | null>(null);
  const [launching, setLaunching] = useState(false);
  const [showPreLaunchModal, setShowPreLaunchModal] = useState(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);

  // Agent State
  const [fetchedAgents, setFetchedAgents] = useState<{ id: number; name: string; language: string; voice: string; script: string }[]>([]);

  useEffect(() => {
    async function loadAgents() {
      try {
        const data = await api.getAgents();
        if (data && data.length > 0) {
          setFetchedAgents(data);
          // Set default agent if none selected
          if (!formData.agent) {
            setFormData(prev => ({
              ...prev,
              agent: data[0].name,
              script: prev.script || data[0].script || TAXES_AGENT_DEFAULT_SCRIPT,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not fetch agents:", err);
      }
    }
    if (isLoggedIn) {
      loadAgents();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleChange = (updates: Partial<CampaignFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...updates };

      // Auto-populate script when agent changes (if user hasn't heavily customized or if script matches a known agent script)
      if (updates.agent && updates.agent !== prev.agent) {
        const matchedAgent = fetchedAgents.find(a => a.name === updates.agent);
        if (matchedAgent && matchedAgent.script) {
          next.script = matchedAgent.script;
        }
      }

      return next;
    });

    // Clear error for field being updated
    if (Object.keys(updates).length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        Object.keys(updates).forEach((k) => delete next[k]);
        return next;
      });
    }
  };

  /** Parse a File (CSV or Excel) → Contact[] using PapaParse / SheetJS */
  const parseFileToContacts = (file: File): Promise<Contact[]> => {
    return new Promise((resolve, reject) => {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data as Record<string, string>[];
            if (!rows.length) return reject(new Error("CSV file is empty"));
            const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
            if (!headers.some(h => h.includes("name")) || !headers.some(h => h.includes("phone"))) {
              return reject(new Error("CSV must have 'Name' and 'Phone' columns"));
            }
            const mapped: Contact[] = rows.map((row, i) => {
              const nameKey = (Object.keys(row).find(k => k.toLowerCase().trim() === "name") || Object.keys(row).find(k => k.toLowerCase().includes("name"))) ?? "";
              const phoneKey = (Object.keys(row).find(k => k.toLowerCase().trim() === "phone") || Object.keys(row).find(k => k.toLowerCase().includes("phone"))) ?? "";

              const metadata_fields: Record<string, string> = {};
              Object.keys(row).forEach(key => {
                if (key !== nameKey && key !== phoneKey) {
                  metadata_fields[key.trim()] = row[key];
                }
              });

              return {
                id: Date.now() + i,
                name: row[nameKey] || "Unknown",
                phone: row[phoneKey] || "Unknown",
                status: "pending",
                response: "—",
                metadata_fields
              };
            });
            resolve(mapped);
          },
          error: (err: { message: string }) => reject(new Error(err.message)),
        });
      } else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target!.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
            if (!rows.length) return reject(new Error("Excel file is empty"));
            const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
            if (!headers.some(h => h.includes("name")) || !headers.some(h => h.includes("phone"))) {
              return reject(new Error("Excel must have 'Name' and 'Phone' columns"));
            }
            const mapped: Contact[] = rows.map((row, i) => {
              const nameKey = (Object.keys(row).find(k => k.toLowerCase().trim() === "name") || Object.keys(row).find(k => k.toLowerCase().includes("name"))) ?? "";
              const phoneKey = (Object.keys(row).find(k => k.toLowerCase().trim() === "phone") || Object.keys(row).find(k => k.toLowerCase().includes("phone"))) ?? "";

              const metadata_fields: Record<string, string> = {};
              Object.keys(row).forEach(key => {
                if (key !== nameKey && key !== phoneKey) {
                  metadata_fields[key.trim()] = String(row[key]);
                }
              });

              return {
                id: Date.now() + i,
                name: String(row[nameKey] || "Unknown"),
                phone: String(row[phoneKey] || "Unknown"),
                status: "pending",
                response: "—",
                metadata_fields
              };
            });
            resolve(mapped);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error("Unsupported file type. Use .csv, .xlsx, or .xls"));
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      const parsed = await parseFileToContacts(file);
      setContacts(parsed);
      setFileUploaded(true);
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(1) + " KB");
      setFormData(prev => ({
        ...prev,
        startRow: 1,
        endRow: parsed.length,
      }));
      setErrors(prev => { const e = { ...prev }; delete e.upload; return e; });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse file";
      alert(msg);
    }
  };

  const handleGoogleSheetLoaded = (loadedContacts: Contact[], sheetId: string) => {
    setContacts(loadedContacts);
    setFileUploaded(true);
    setFileName(`Google Sheet (${sheetId.substring(0, 8)}...)`);
    setFileSize("");
    setFormData(prev => ({
      ...prev,
      startRow: 1,
      endRow: loadedContacts.length,
    }));
    setErrors(prev => { const e = { ...prev }; delete e.googleSheetUrl; delete e.upload; return e; });
  };

  const handleDeleteContact = (id: number) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.campaignTitle.trim()) newErrors.campaignTitle = "Campaign Name is required.";
    if (!formData.agent) newErrors.agent = "Please select an AI Agent.";
    if (!formData.scheduleDate) newErrors.scheduleDate = "Schedule Date is required.";
    if (!formData.scheduleTime) newErrors.scheduleTime = "Schedule Time is required.";
    if (formData.scheduleDate && formData.scheduleTime) {
      const scheduleDt = new Date(`${formData.scheduleDate}T${formData.scheduleTime}:00`);
      // Allow a 5-minute grace period for "now"
      if (scheduleDt.getTime() < Date.now() - 5 * 60 * 1000) {
        newErrors.scheduleTime = "Scheduled time cannot be in the past.";
      }
    }
    if (!formData.script.trim()) newErrors.script = "Agent Script is required.";

    if (formData.uploadSource === "google_sheet") {
      if (!formData.googleSheetUrl?.trim()) {
        newErrors.googleSheetUrl = "Google Sheet URL is required.";
      } else {
        const sheetRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
        if (!sheetRegex.test(formData.googleSheetUrl.trim())) {
          newErrors.googleSheetUrl = "Must be a valid Google Sheets URL.";
        }
      }
    } else if (formData.uploadSource === "single") {
      if (!formData.singleContactName?.trim()) newErrors.singleContactName = "Name is required.";
      if (!formData.singleContactPhone?.trim()) {
        newErrors.singleContactPhone = "Phone number is required.";
      } else {
        const digits = formData.singleContactPhone.replace(/\D/g, "");
        if (digits.length < 10) {
          newErrors.singleContactPhone = "Please enter a valid 10-digit phone number (e.g. 9876543210).";
        }
      }
    } else if (!fileUploaded || contacts.length === 0) {
      newErrors.upload = "Please upload a contact list.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1: Pre-Launch Check & Modal Trigger
  const handleRequestLaunch = async () => {
    if (!validateForm()) return;

    // Check credits before launching
    try {
      const userMe = await api.getCredits();
      if (userMe && userMe.credits <= 0) {
        setShowExhaustedModal(true);
        return;
      }
    } catch (err) {
      console.warn("Could not fetch credits:", err);
    }

    const isSingle = formData.uploadSource === "single";
    const totalAvailable = isSingle ? (formData.singleContactPhone ? 1 : 0) : contacts.length;
    if (totalAvailable === 0) {
      alert("No contacts to dial.");
      return;
    }

    const selectionType = isSingle ? "all" : formData.selectionType;
    const startRow = isSingle ? undefined : formData.startRow;
    const endRow = isSingle ? undefined : formData.endRow;

    if (!isSingle && selectionType === "range") {
      const start = startRow ?? 0;
      const end = endRow ?? 0;
      if (start < 1) {
        alert("Start Row must be 1 or greater.");
        return;
      }
      if (end > totalAvailable) {
        alert(`End Row cannot exceed Total Contacts (${totalAvailable}).`);
        return;
      }
      if (start > end) {
        alert("Start Row cannot be greater than End Row.");
        return;
      }
    }

    // Open the comprehensive pre-launch confirmation modal
    setShowPreLaunchModal(true);
  };

  // Step 2: Confirmed Execution of Campaign Launch
  const handleExecuteLaunch = async () => {
    setShowPreLaunchModal(false);

    // Build contacts list from whichever source was used
    let contactList: ApiContact[] = [];

    if (formData.uploadSource === "single") {
      contactList = [{
        name: formData.singleContactName!.trim(),
        phone: formData.singleContactPhone!.trim(),
        metadata_fields: {},
        original_row: 1
      }];
    } else {
      contactList = contacts.map((c, i) => ({
        name: c.name,
        phone: c.phone,
        metadata_fields: c.metadata_fields,
        original_row: i + 2 // Assumes Row 1 was header
      }));
    }

    if (contactList.length === 0) {
      alert("No contacts to dial.");
      return;
    }

    const isSingle = formData.uploadSource === "single";
    const selectionType = isSingle ? "all" : formData.selectionType;
    const startRow = isSingle ? undefined : formData.startRow;
    const endRow = isSingle ? undefined : formData.endRow;

    try {
      setLaunching(true);

      let isoUtcStr = new Date().toISOString();
      if (formData.scheduleDate && formData.scheduleTime) {
        try {
          const [yyyy, mm, dd] = formData.scheduleDate.split("-").map(Number);
          const [hh, min] = formData.scheduleTime.split(":").map(Number);
          // IST is UTC+5:30 -> UTC = IST - 5h 30m
          const scheduledUtcDate = new Date(Date.UTC(yyyy, mm - 1, dd, hh - 5, min - 30));
          if (!isNaN(scheduledUtcDate.getTime())) {
            isoUtcStr = scheduledUtcDate.toISOString();
          }
        } catch {
          isoUtcStr = new Date().toISOString();
        }
      }

      // 1. Create the campaign + contacts
      const { campaign_id } = await api.createCampaign({
        campaign_name: formData.campaignTitle.trim(),
        agent: formData.agent,
        script: formData.script.trim(),
        schedule_date: isoUtcStr,
        schedule_time: "UTC",
        outbound_phone_number: formData.outboundPhoneNumber,
        selection_type: selectionType,
        start_row: startRow,
        end_row: endRow,
        whatsapp_automation: formData.whatsappAutomation,
        contacts: contactList,
        upload_source: formData.uploadSource,
        sheet_name: isSingle
          ? "Single Call Input"
          : formData.uploadSource === "google_sheet"
          ? "Google Sheet"
          : fileName || "File Upload",
      });

      // 2. Launch it (creates the job + starts the worker loop)
      const { total_contacts } = await api.launchCampaign(campaign_id);

      // Refresh credits after launching
      refreshCredits();

      // Show in-app launch confirmation modal
      setLaunchSuccessData({
        campaignId: campaign_id,
        campaignName: formData.campaignTitle.trim(),
        agentName: formData.agent,
        totalContacts: total_contacts,
        remainingContacts: formData.uploadSource !== "single" && formData.selectionType === "range"
          ? Math.max(0, contactList.length - total_contacts)
          : 0,
        scheduleDate: formData.scheduleDate,
        scheduleTime: formData.scheduleTime,
        selectionType: formData.selectionType,
        startRow: formData.startRow,
        endRow: formData.endRow,
        uploadSource: formData.uploadSource,
      });

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unable to start campaign.";
      console.warn(error);
      alert(msg);
    } finally {
      setLaunching(false);
    }
  };

  const isFormDisabled = launching;

  // Compute the displayed contacts based on selection
  const displayedContacts = useMemo(() => {
    if (formData.uploadSource === "single") {
      return contacts;
    }
    
    if (formData.selectionType === "range" && formData.startRow && formData.endRow) {
      const start = Math.max(0, formData.startRow - 1);
      const end = Math.min(contacts.length, formData.endRow);
      return contacts.slice(start, end);
    }
    
    return contacts;
  }, [contacts, formData.selectionType, formData.startRow, formData.endRow, formData.uploadSource]);

  // Computed summary values for confirmation modal
  const confirmedDialCount = useMemo(() => {
    if (formData.uploadSource === "single") return 1;
    if (formData.selectionType === "range" && formData.startRow && formData.endRow) {
      return Math.max(0, Math.min(contacts.length, formData.endRow) - Math.max(1, formData.startRow) + 1);
    }
    return contacts.length;
  }, [formData.uploadSource, formData.selectionType, formData.startRow, formData.endRow, contacts.length]);

  const activeWhatsAppRules = useMemo(() => {
    if (!formData.whatsappAutomation?.enabled) return [];
    return (formData.whatsappAutomation.rules || []).filter(r => r.enabled);
  }, [formData.whatsappAutomation]);

  return (
    <DashboardShell title="Call Manager">
      <div className="flex flex-col gap-6 p-1 sm:p-4 max-w-5xl mx-auto w-full">
        {/* Top Section: Form (Spacious full width layout) */}
        <div className="w-full">
          <CampaignForm
            agents={fetchedAgents}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleRequestLaunch}
            errors={errors}
            onFileUpload={handleFileUpload}
            fileUploaded={fileUploaded}
            fileName={fileName}
            fileSize={fileSize}
            totalContacts={contacts.length}
            onGoogleSheetLoaded={handleGoogleSheetLoaded}
            disabled={isFormDisabled}
          />
        </div>

        {/* Bottom Section: Contacts Preview Table */}
        <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-600" />
                Contacts Table Preview
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {displayedContacts.length === 0
                  ? "Upload contacts or enter a single contact above to view the preview."
                  : formData.selectionType === "range" && formData.startRow && formData.endRow
                  ? `Showing rows ${formData.startRow} to ${formData.endRow} (${displayedContacts.length} contacts selected for dialing)`
                  : `Showing all ${displayedContacts.length} contacts`}
              </p>
            </div>
            {displayedContacts.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-100 dark:border-violet-900/40">
                {displayedContacts.length} Contacts to Dial
              </span>
            )}
          </div>
          <ContactsTable contacts={displayedContacts} onDeleteContact={handleDeleteContact} />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRE-LAUNCH CONFIRMATION MODAL (Call + WhatsApp Details)
      ───────────────────────────────────────────────────────────── */}
      {showPreLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl my-6 rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 space-y-4.5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    Confirm Campaign Launch
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Review your voice calling settings & automated WhatsApp follow-ups before launch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreLaunchModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Card 1: Voice Calling Campaign Details */}
              <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20 space-y-3">
                <div className="flex items-center justify-between border-b border-violet-200/60 dark:border-violet-900/40 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    1. Voice Call Configuration
                  </div>
                  <span className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/60 px-2.5 py-0.5 rounded-full">
                    {confirmedDialCount} {confirmedDialCount === 1 ? "Contact" : "Contacts"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-medium">Campaign Name</span>
                    <span className="font-bold text-zinc-900 dark:text-white truncate block">
                      {formData.campaignTitle}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-medium">AI Voice Agent</span>
                    <span className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" />
                      {formData.agent || "Default Agent"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-medium">Outbound Caller ID</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {formData.outboundPhoneNumber || "Default Outbound Trunk"}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[11px] font-medium">Scheduled Time</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formData.scheduleDate} at {formData.scheduleTime} (IST)
                    </span>
                  </div>
                </div>

                {formData.uploadSource !== "single" && formData.selectionType === "range" && (
                  <div className="text-[11px] bg-white/70 dark:bg-zinc-800/80 p-2 rounded-lg border border-violet-100 dark:border-violet-900/30 text-violet-800 dark:text-violet-300">
                    Dialing rows <strong>{formData.startRow || 1}</strong> to <strong>{formData.endRow || contacts.length}</strong> ({confirmedDialCount} contacts from {fileName || "Uploaded File"}).
                  </div>
                )}
              </div>

              {/* Card 2: WhatsApp Automation Configuration */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    2. WhatsApp Post-Call Follow-ups
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      formData.whatsappAutomation?.enabled && activeWhatsAppRules.length > 0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {formData.whatsappAutomation?.enabled && activeWhatsAppRules.length > 0
                      ? `ENABLED (${activeWhatsAppRules.length} ${activeWhatsAppRules.length === 1 ? "Rule" : "Rules"})`
                      : "DISABLED"}
                  </span>
                </div>

                {formData.whatsappAutomation?.enabled && activeWhatsAppRules.length > 0 ? (
                  <div className="space-y-3">
                    {activeWhatsAppRules.map((rule, rIdx) => {
                      const ctLabel = !rule.call_type_filters || rule.call_type_filters.length === 0 ? "All Types" : rule.call_type_filters.join(", ");
                      const aiLabel = !rule.ai_class_filters || rule.ai_class_filters.length === 0 ? "All Classes" : rule.ai_class_filters.join(", ");
                      const respLabel = !rule.response_filters || rule.response_filters.length === 0 ? "All Responses" : rule.response_filters.join(", ");
                      const stLabel = !rule.status_filters || rule.status_filters.length === 0 ? "All Status" : rule.status_filters.join(", ");

                      return (
                        <div
                          key={rule.id || rIdx}
                          className="rounded-lg bg-white dark:bg-zinc-800/90 p-3 border border-emerald-100 dark:border-zinc-700 space-y-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                                {rIdx + 1}
                              </span>
                              Automation Rule #{rIdx + 1}
                            </span>
                            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded">
                              {rule.source_mode === "material_base" ? "From Material Base" : "Custom Template"}
                            </span>
                          </div>

                          {/* Trigger Filters */}
                          <div className="flex flex-wrap gap-1.5 text-[10px]">
                            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-medium">
                              Call: {ctLabel}
                            </span>
                            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-medium">
                              AI: {aiLabel}
                            </span>
                            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-medium">
                              Resp: {respLabel}
                            </span>
                            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded font-medium">
                              Status: {stLabel}
                            </span>
                            <span className="bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded font-bold">
                              Consent: {rule.require_permission !== false ? "Required ✓" : "Optional"}
                            </span>
                          </div>

                          {/* Message Text Preview */}
                          {rule.message_text && (
                            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 text-[11px] text-zinc-700 dark:text-zinc-300 font-mono italic line-clamp-2 border border-zinc-100 dark:border-zinc-800">
                              "{rule.message_text}"
                            </div>
                          )}

                          {/* Attached Media */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] font-bold text-zinc-400">Attached Media:</span>
                            {rule.attachments && rule.attachments.length > 0 ? (
                              rule.attachments.map((att, aIdx) => (
                                <span
                                  key={aIdx}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                >
                                  {att.type === "image" ? (
                                    <ImageIcon className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <FileText className="w-3 h-3 text-purple-600" />
                                  )}
                                  {att.title}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-400 italic">Text message only (no file attachments)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                    WhatsApp Automation is disabled. No post-call WhatsApp messages will be triggered.
                  </p>
                )}
              </div>

              {/* Ready to launch note */}
              <div className="flex items-start gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 p-3 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                <AlertCircle className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <span>
                  Once confirmed, the voice dialer worker will initiate outbound calls according to the schedule. WhatsApp follow-ups will dispatch automatically upon live call completion.
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreLaunchModal(false)}
                disabled={launching}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Go Back & Edit
              </button>

              <button
                type="button"
                onClick={handleExecuteLaunch}
                disabled={launching}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50"
              >
                {launching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Launching Campaign...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    <span>Confirm & Launch Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Launch Success Modal (Post-Launch View) */}
      {launchSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-violet-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            {/* Header with Icon */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                    Campaign Launched Successfully!
                  </h3>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    AI Dialing Job Initiated & Active
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLaunchSuccessData(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Campaign Summary Card */}
            <div className="mt-5 space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Campaign Name</span>
                <span className="font-bold text-zinc-900 dark:text-white">{launchSuccessData.campaignName}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">AI Agent</span>
                <span className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  {launchSuccessData.agentName}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Contacts Dialing</span>
                <div className="text-right">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    {launchSuccessData.totalContacts} Contacts
                  </span>
                  {launchSuccessData.selectionType === "range" && launchSuccessData.startRow && launchSuccessData.endRow && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      (Rows {launchSuccessData.startRow} to {launchSuccessData.endRow})
                    </div>
                  )}
                </div>
              </div>

              {launchSuccessData.remainingContacts !== undefined && launchSuccessData.remainingContacts > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-lg">
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Remaining Contacts</span>
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {launchSuccessData.remainingContacts} saved as "{launchSuccessData.campaignName} - Remaining"
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Scheduled Time</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  {launchSuccessData.scheduleDate} at {launchSuccessData.scheduleTime}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  setLaunchSuccessData(null);
                  router.push(`/campaign/${launchSuccessData.campaignId}`);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition-all"
              >
                <span>View Live Campaign</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setLaunchSuccessData(null);
                  router.push("/campaign");
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all"
              >
                Campaigns List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credits Exhausted Modal */}
      {showExhaustedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">Credits Exhausted</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Your credits have exhausted. Please recharge in order to continue.
              </p>
              <button
                onClick={() => setShowExhaustedModal(false)}
                className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-md shadow-red-600/20"
              >
                OK, Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
