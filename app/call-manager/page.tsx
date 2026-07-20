"use client";

import { api } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import CampaignForm from "@/components/call-manager/CampaignForm";
import LiveTracking from "@/components/call-manager/LiveTracking";
import ContactsTable from "@/components/call-manager/ContactsTable";
import { CampaignFormData, Contact, LiveTrackingStats, UploadSourceType } from "@/components/call-manager/types";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function CallManagerPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const [formData, setFormData] = useState<CampaignFormData>({
    campaignTitle: "",
    agent: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    scheduleTime: "09:00",
    script: "",
    uploadSource: "excel",
    googleSheetUrl: "",
    singleContactName: "",
    singleContactPhone: "",
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
        setLiveStats({
          registry: live.registry,
          standby: live.standby,
          dialer: live.dialer,
          analysis: live.analysis,
          completed: live.completed,
          failed: live.failed,
        });
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
              const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name")) ?? "";
              const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes("phone")) ?? "";
              return { id: Date.now() + i, name: row[nameKey] || "Unknown", phone: row[phoneKey] || "Unknown", status: "pending", response: "—" };
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
              const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name")) ?? "";
              const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes("phone")) ?? "";
              return { id: Date.now() + i, name: String(row[nameKey] || "Unknown"), phone: String(row[phoneKey] || "Unknown"), status: "pending", response: "—" };
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Build contacts list from whichever source was used
    let contactList: { name: string; phone: string }[] = [];

    if (formData.uploadSource === "single") {
      contactList = [{
        name: formData.singleContactName!.trim(),
        phone: formData.singleContactPhone!.trim(),
      }];
    } else {
      // Excel / CSV / Google Sheet — contacts already parsed into state
      contactList = contacts.map(c => ({ name: c.name, phone: c.phone }));
    }

    if (contactList.length === 0) {
      alert("No contacts to dial.");
      return;
    }

    try {
      setLaunching(true);

      // 1. Create the campaign + contacts
      const { campaign_id } = await api.createCampaign({
        campaign_name: formData.campaignTitle.trim(),
        agent: formData.agent,
        script: formData.script.trim(),
        schedule_date: formData.scheduleDate,
        schedule_time: formData.scheduleTime,
        contacts: contactList,
      });

      // 2. Launch it (creates the job + starts the worker loop)
      const { total_contacts } = await api.launchCampaign(campaign_id);

      alert(`Campaign launched! Dialling ${total_contacts} contact${total_contacts !== 1 ? "s" : ""}.`);

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
      router.push("/campaign");

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unable to start campaign.";
      console.warn(error);
      alert(msg);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <DashboardShell title="Call Manager">
      <div className="flex flex-col gap-6 p-1 sm:p-4">
        {/* Top Section: Two Columns */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          {/* Left Column: Form */}
          <div className="h-full">
            <CampaignForm
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
            />
          </div>

          {/* Right Column: Live Tracking */}
          <div className="h-full">
            <LiveTracking stats={liveStats} />
          </div>
        </div>

        {/* Bottom Section: Contacts Table */}
        <div className="mt-2">
          <ContactsTable contacts={contacts} onDeleteContact={handleDeleteContact} />
        </div>
      </div>
    </DashboardShell>
  );
}
