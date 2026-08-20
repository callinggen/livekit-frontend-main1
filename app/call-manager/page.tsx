"use client";

import { api } from "@/lib/api";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import DashboardShell from "@/components/DashboardShell";
import CampaignForm from "@/components/call-manager/CampaignForm";
import LiveTracking from "@/components/call-manager/LiveTracking";
import ContactsTable from "@/components/call-manager/ContactsTable";
import { CampaignFormData, Contact, LiveTrackingStats, UploadSourceType } from "@/components/call-manager/types";
import Papa from "papaparse";
import * as XLSX from "xlsx";

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

export default function CallManagerPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { refreshCredits } = useCredits();

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
      selectionType: "all",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  // File Upload State
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");

  const [liveStats, setLiveStats] = useState<LiveTrackingStats>({
    registry: 0,
    standby: 0,
    dialer: 0,
    analysis: 0,
    completed: 0,
    failed: 0,
  });
  const [launching, setLaunching] = useState(false);
  // BUG-007: Ref to store the polling interval so we can clear it
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Agent State
  const [fetchedAgents, setFetchedAgents] = useState<{ id: number; name: string; language: string; voice: string; script: string }[]>([]);

  useEffect(() => {
    async function loadAgents() {
      try {
        const agentsData = await api.getAgents();
        setFetchedAgents(agentsData);
        if (agentsData.length > 0) {
          setFormData(prev => {
            const exists = agentsData.some(a => a.name === prev.agent);
            if (!prev.agent || !exists) {
              const firstAgent = agentsData[0];
              return {
                ...prev,
                agent: firstAgent.name,
                script: prev.script && prev.script.trim() !== "" ? prev.script : (firstAgent.script || "")
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("Failed to fetch agents:", err);
      }
    }
    if (isLoggedIn) {
      loadAgents();
    }
  }, [isLoggedIn]);

  // Stop polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // BUG-007: Start polling /live endpoint every 5s after campaign launch
  const startLivePolling = (campaignId: number) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const live = await api.getCampaignLive(campaignId);
        setLiveStats(prev => {
          if (prev.completed !== live.completed) {
            refreshCredits();
          }
          return {
            registry: live.registry,
            standby: live.standby,
            dialer: live.dialer,
            analysis: live.analysis,
            completed: live.completed,
            failed: live.failed,
            campaign_status: live.campaign_status,
            schedule_date: live.schedule_date,
            schedule_time: live.schedule_time,
          };
        });

        // Map the backend lightweight contacts to the frontend Contact type
        if (live.contacts) {
          setContacts(prevContacts => {
            // We map over prevContacts to preserve any fields not returned by the lightweight endpoint,
            // while updating status and response.
            const updatedMap = new Map(live.contacts.map(c => [String(c.phone), c]));
            return prevContacts.map(pc => {
              const updated = updatedMap.get(String(pc.phone));
              if (updated) {
                return { ...pc, status: updated.status as any, response: updated.response };
              }
              return pc;
            });
          });
        }

        // Stop polling when campaign is no longer running
        if (live.campaign_status === "Completed" || live.campaign_status === "Failed") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 5000);
  };

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const handleChange = (updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => delete newErrors[key]);
    setErrors(newErrors);
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
            if (!rows.length) return reject(new Error("CSV is empty"));
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
      if (!formData.singleContactPhone?.trim()) newErrors.singleContactPhone = "Phone number is required.";
    } else if (!fileUploaded || contacts.length === 0) {
      newErrors.upload = "Please upload a contact list.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showExhaustedModal, setShowExhaustedModal] = useState(false);

  const handleSubmit = async () => {
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

    // Build contacts list from whichever source was used
    let contactList: { name: string; phone: string; metadata_fields?: Record<string, string>; original_row?: number }[] = [];

    if (formData.uploadSource === "single") {
      contactList = [{
        name: formData.singleContactName!.trim(),
        phone: formData.singleContactPhone!.trim(),
        metadata_fields: {},
        original_row: 1
      }];
    } else {
      // Excel / CSV / Google Sheet — contacts already parsed into state
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

    if (formData.uploadSource !== "single" && formData.selectionType === "range") {
      const start = formData.startRow ?? 0;
      const end = formData.endRow ?? 0;
      if (start < 1) {
        alert("Start Row must be 1 or greater.");
        return;
      }
      if (end > contactList.length) {
        alert(`End Row cannot exceed Total Contacts (${contactList.length}).`);
        return;
      }
      if (start > end) {
        alert("Start Row cannot be greater than End Row.");
        return;
      }
    }

    try {
      setLaunching(true);

      const localDate = new Date(`${formData.scheduleDate}T${formData.scheduleTime}:00`);
      const isoUtcStr = localDate.toISOString(); // e.g., 2026-07-22T08:30:00.000Z

      // 1. Create the campaign + contacts
      const { campaign_id } = await api.createCampaign({
        campaign_name: formData.campaignTitle.trim(),
        agent: formData.agent,
        script: formData.script.trim(),
        schedule_date: isoUtcStr,
        schedule_time: "UTC",
        selection_type: formData.selectionType,
        start_row: formData.startRow,
        end_row: formData.endRow,
        contacts: contactList,
      });

      // 2. Launch it (creates the job + starts the worker loop)
      const { total_contacts } = await api.launchCampaign(campaign_id);

      let successMsg = `Campaign launched! Dialling ${total_contacts} contact${total_contacts !== 1 ? "s" : ""}.`;
      if (formData.uploadSource !== "single" && formData.selectionType === "range") {
          const remaining = contactList.length - total_contacts;
          if (remaining > 0) {
              successMsg = `Campaign created successfully.\n\n${total_contacts} contacts have been added to the campaign.\n\n${remaining} remaining contacts have been saved under "${formData.campaignTitle.trim()} - Remaining" and can be used later.`;
          }
      }
      
      alert(successMsg);

      // Update live stats optimistically
      setLiveStats({
        registry: total_contacts,
        standby: total_contacts,
        dialer: 0,
        analysis: 0,
        completed: 0,
        failed: 0,
      });

      // BUG-007: Start real polling so Live Journey updates in real time
      startLivePolling(campaign_id);

      // Navigate to campaign list
      // router.push("/campaign");

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unable to start campaign.";
      console.warn(error);
      alert(msg);
    } finally {
      setLaunching(false);
    }
  };

  const isFormDisabled = launching || ["Scheduled", "Running", "Paused"].includes(liveStats.campaign_status as string);

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

  return (
    <DashboardShell title="Call Manager">
      <div className="flex flex-col gap-6 p-1 sm:p-4">
        {/* Top Section: Two Columns */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* Left Column: Form */}
          <div className="h-full">
            <CampaignForm
              agents={fetchedAgents}
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
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

          {/* Right Column: Live Tracking */}
          <div className="h-full">
            <LiveTracking stats={liveStats} />
          </div>
        </div>

        {/* Bottom Section: Contacts Table */}
        <div className="mt-2">
          <ContactsTable contacts={displayedContacts} onDeleteContact={handleDeleteContact} />
        </div>
      </div>

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
