"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Users,
  Upload,
  Layers,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Plus,
  Trash2,
  CreditCard,
  Sparkles,
  ChevronDown,
  X,
  MessageSquare,
  RefreshCw,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
  History,
  Clock,
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import AddMaterialModal from "@/components/whatsapp/AddMaterialModal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ContactRow {
  id: string | number;
  name: string;
  phone: string;
  formatted_phone: string;
  is_valid_phone: boolean;
  call_type?: string;
  ai_classification?: string;
  response?: string;
  status?: string;
  appointment_date?: string;
  duration?: number;
}

interface CampaignItem {
  id: string;
  name: string;
  totalCalls: number;
  contactCount: number;
  status: string;
}

interface MaterialItem {
  id: number;
  title: string;
  type: "text" | "image" | "document";
  content?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  tags?: string;
}

interface MessageItemToSend {
  id: string;
  type: "text" | "image" | "document";
  title: string;
  text?: string;
  media_url?: string;
  file_name?: string;
  mime_type?: string;
  caption?: string;
  save_to_material?: boolean;
}

// Normalize phone
function normalizePhone(raw: string): { formatted: string; isValid: boolean } {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return { formatted: `+91${digits}`, isValid: true };
  } else if (digits.length === 12 && digits.startsWith("91")) {
    return { formatted: `+${digits}`, isValid: true };
  } else if (digits.length >= 10 && digits.length <= 15) {
    return { formatted: `+${digits}`, isValid: true };
  }
  return { formatted: raw, isValid: false };
}

export default function SendMessagePage() {
  const searchParams = useSearchParams();
  const preselectedMaterialId = searchParams.get("useMaterial");
  const preselectedCampaignId = searchParams.get("campaign_id");

  const { isLoggedIn, user } = useAuth();
  const token = user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const { credits, refreshCredits } = useCredits();

  // Mode: Campaign vs Upload
  const [sourceMode, setSourceMode] = useState<"campaign" | "upload">(
    preselectedCampaignId ? "campaign" : "campaign"
  );
  const [uploadSubMode, setUploadSubMode] = useState<"file" | "sheet">("file");

  // Google Sheets state
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [loadingGoogleSheet, setLoadingGoogleSheet] = useState(false);

  // Campaigns state
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(preselectedCampaignId || "");
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string | number>>(new Set());

  // Upload file state
  const [uploadedFileStats, setUploadedFileStats] = useState<{
    fileName: string;
    total: number;
    valid: number;
    invalid: number;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCallType, setFilterCallType] = useState("all");
  const [filterClassification, setFilterClassification] = useState("all");
  const [filterResponse, setFilterResponse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Materials & Message Selection
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<MessageItemToSend[]>([]);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [pickerTab, setPickerTab] = useState<"all" | "text" | "image" | "document">("all");

  // Custom Message Composer
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [saveToMaterial, setSaveToMaterial] = useState(false);
  const [showCustomComposer, setShowCustomComposer] = useState(false);

  // Confirmation & Sending State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{
    total: number;
    sent: number;
    failed: number;
    creditsDeducted: number;
    done: boolean;
  } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : "") || "";

  // 1. Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const res = await fetch(`${BASE_URL}/api/campaigns`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setCampaigns(list);
          if (preselectedCampaignId && list.some((c: any) => String(c.id) === String(preselectedCampaignId))) {
            setSelectedCampaignId(preselectedCampaignId);
            setSourceMode("campaign");
          } else if (list.length > 0 && !selectedCampaignId) {
            setSelectedCampaignId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [authToken, preselectedCampaignId]);

  // 2. Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/whatsapp/materials`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          const matList: MaterialItem[] = Array.isArray(data) ? data : [];
          setMaterials(matList);

          // If navigated with ?useMaterial=ID, automatically add it
          if (preselectedMaterialId) {
            const match = matList.find((m) => String(m.id) === String(preselectedMaterialId));
            if (match) {
              setSelectedItems([
                {
                  id: `mat_${match.id}`,
                  type: match.type,
                  title: match.title,
                  text: match.content,
                  media_url: match.file_url,
                  file_name: match.file_url ? match.file_url.split("/").pop() : undefined,
                  mime_type: match.mime_type,
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load materials:", err);
      }
    };

    fetchMaterials();
  }, [authToken, preselectedMaterialId]);

  // 3. Load contacts when Campaign changes
  useEffect(() => {
    if (sourceMode !== "campaign" || !selectedCampaignId) return;

    const fetchCampaignContacts = async () => {
      try {
        setLoadingContacts(true);
        const res = await fetch(
          `${BASE_URL}/api/whatsapp/campaign-contacts-filtered?campaign_id=${selectedCampaignId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const list: ContactRow[] = data.contacts || [];
          setContacts(list);
          // Select all valid by default
          const validIds = new Set(list.filter((c) => c.is_valid_phone).map((c) => c.id));
          setSelectedContactIds(validIds);
        }
      } catch (err) {
        console.error("Failed to load campaign contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchCampaignContacts();
  }, [selectedCampaignId, sourceMode, authToken]);

  // 4. Handle CSV / Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      showToast("Please upload a valid .xlsx, .xls, or .csv file", "error");
      return;
    }

    const reader = new FileReader();

    if (ext === "csv") {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processParsedData(results.data as any[], fileName);
          },
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processParsedData(json, fileName);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleLoadGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      showToast("Please enter a valid Google Sheets URL", "error");
      return;
    }
    try {
      setLoadingGoogleSheet(true);
      let exportUrl = googleSheetUrl.trim();
      const match = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }

      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error("Unable to fetch sheet. Make sure the Google Sheet sharing permission is set to 'Anyone with the link can view'.");
      }
      const csvText = await res.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            processParsedData(results.data as any[], "Google Sheet Import");
          } else {
            showToast("No contact rows found in Google Sheet", "error");
          }
        },
        error: (err: any) => {
          showToast(`Error parsing Google Sheet: ${err?.message || err}`, "error");
        },
      });
    } catch (err: any) {
      console.error("Google Sheets import error:", err);
      showToast(err.message || "Failed to load Google Sheet. Ensure public link sharing is enabled.", "error");
    } finally {
      setLoadingGoogleSheet(false);
    }
  };

  const processParsedData = (rows: any[], fileName: string) => {
    const parsedContacts: ContactRow[] = [];
    let validCount = 0;
    let invalidCount = 0;

    rows.forEach((row, index) => {
      // Find name field
      const nameKey = Object.keys(row).find((k) =>
        ["name", "customer_name", "full_name", "client_name", "contact"].includes(k.toLowerCase().trim())
      );
      const rawName = nameKey ? String(row[nameKey] || "") : `Lead ${index + 1}`;

      // Find phone field
      const phoneKey = Object.keys(row).find((k) =>
        ["phone", "phone_number", "mobile", "contact_number", "whatsapp"].includes(k.toLowerCase().trim())
      );
      const rawPhone = phoneKey ? String(row[phoneKey] || "") : "";

      const { formatted, isValid } = normalizePhone(rawPhone);

      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      parsedContacts.push({
        id: `upload_${index + 1}`,
        name: rawName.trim() || `Lead ${index + 1}`,
        phone: rawPhone,
        formatted_phone: formatted,
        is_valid_phone: isValid,
        call_type: "Outbound",
        ai_classification: "Other",
        response: "New Lead",
        status: "In Progress",
      });
    });

    setContacts(parsedContacts);
    setUploadedFileStats({
      fileName,
      total: parsedContacts.length,
      valid: validCount,
      invalid: invalidCount,
    });

    // Auto-select valid
    const validIds = new Set(parsedContacts.filter((c) => c.is_valid_phone).map((c) => c.id));
    setSelectedContactIds(validIds);

    showToast(`Loaded ${parsedContacts.length} contacts (${validCount} valid WhatsApp numbers)`);
  };

  // Filtered contacts based on search and dropdown filters
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);

      const matchCallType = filterCallType === "all" || (c.call_type || "").toLowerCase() === filterCallType.toLowerCase();

      const matchClassification =
        filterClassification === "all" ||
        (c.ai_classification || "").toLowerCase() === filterClassification.toLowerCase();

      const matchResponse =
        filterResponse === "all" || (c.response || "").toLowerCase().includes(filterResponse.toLowerCase());

      const matchStatus = filterStatus === "all" || (c.status || "").toLowerCase() === filterStatus.toLowerCase();

      return matchSearch && matchCallType && matchClassification && matchResponse && matchStatus;
    });
  }, [contacts, searchQuery, filterCallType, filterClassification, filterResponse, filterStatus]);

  // Bulk Selection Handlers
  const handleToggleSelectAllFiltered = () => {
    const validFiltered = filteredContacts.filter((c) => c.is_valid_phone);
    const allSelected = validFiltered.every((c) => selectedContactIds.has(c.id));

    const next = new Set(selectedContactIds);
    if (allSelected) {
      validFiltered.forEach((c) => next.delete(c.id));
    } else {
      validFiltered.forEach((c) => next.add(c.id));
    }
    setSelectedContactIds(next);
  };

  const handleToggleContact = (id: string | number) => {
    const next = new Set(selectedContactIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedContactIds(next);
  };

  // Add Material from Material Base Picker
  const handleSelectMaterial = (material: MaterialItem) => {
    const itemId = `mat_${material.id}`;
    if (selectedItems.some((item) => item.id === itemId)) {
      showToast("Material already added to selection", "error");
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        id: itemId,
        type: material.type,
        title: material.title,
        text: material.content,
        media_url: material.file_url,
        file_name: material.file_url ? material.file_url.split("/").pop() : undefined,
        mime_type: material.mime_type,
      },
    ]);
    setShowMaterialPicker(false);
    showToast(`Added "${material.title}" to message queue`);
  };

  // Add Custom Text Message
  const handleAddCustomMessage = () => {
    if (!customText.trim()) {
      showToast("Please enter message content", "error");
      return;
    }

    const title = customTitle.trim() || "Custom Text Message";
    const itemId = `custom_${Date.now()}`;

    setSelectedItems((prev) => [
      ...prev,
      {
        id: itemId,
        type: "text",
        title: title,
        text: customText.trim(),
        save_to_material: saveToMaterial,
      },
    ]);

    setCustomTitle("");
    setCustomText("");
    setSaveToMaterial(false);
    setShowCustomComposer(false);
    showToast("Added custom message");
  };

  const handleMaterialCreated = (newMaterial: MaterialItem) => {
    setMaterials((prev) => [newMaterial, ...prev]);
    setSelectedItems((prev) => [
      ...prev,
      {
        id: `mat_${newMaterial.id}`,
        type: newMaterial.type,
        title: newMaterial.title,
        text: newMaterial.content,
        media_url: newMaterial.file_url,
        file_name: newMaterial.file_url ? newMaterial.file_url.split("/").pop() : undefined,
        mime_type: newMaterial.mime_type,
      },
    ]);
    setShowAddMaterialModal(false);
    showToast("Material created and added to queue", "success");
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Centralized frontend credit estimation matching backend rules:
  // Text = 1 credit, Image = 2 credits, Document = 3 credits per recipient
  const selectedCount = selectedContactIds.size;
  const itemsCount = selectedItems.length;
  const creditsPerRecipient = selectedItems.reduce((acc, item) => {
    if (item.type === "text") return acc + 1;
    if (item.type === "image") return acc + 2;
    if (item.type === "document") return acc + 3;
    return acc + 1;
  }, 0);
  const totalRequiredCredits = selectedCount * creditsPerRecipient;
  const userCredits = credits ?? 0;
  const hasSufficientCredits = userCredits >= totalRequiredCredits;

  // Selected contacts objects
  const selectedContactsList = useMemo(() => {
    return contacts.filter((c) => selectedContactIds.has(c.id) && c.is_valid_phone);
  }, [contacts, selectedContactIds]);

  // Execute Send
  const handleExecuteSend = async () => {
    if (selectedCount === 0) {
      showToast("Please select at least one valid recipient", "error");
      return;
    }
    if (itemsCount === 0) {
      showToast("Please select or compose at least one message item", "error");
      return;
    }
    if (!hasSufficientCredits) {
      showToast("Insufficient WhatsApp credits to perform send", "error");
      return;
    }

    try {
      setIsSending(true);
      setShowConfirmModal(false);
      setSendProgress({
        total: selectedCount * itemsCount,
        sent: 0,
        failed: 0,
        creditsDeducted: 0,
        done: false,
      });

      const payload = {
        source_type: sourceMode === "campaign" ? "campaign_manual" : "excel_csv",
        source_name: sourceMode === "campaign"
          ? (campaigns.find((c) => String(c.id) === String(selectedCampaignId))?.name || "Campaign Send")
          : (uploadedFileStats?.fileName || "Uploaded Contacts File"),
        campaign_id: sourceMode === "campaign" && selectedCampaignId ? Number(selectedCampaignId) : undefined,
        recipients: selectedContactsList.map((c) => ({
          name: c.name,
          phone: c.formatted_phone,
          contact_id: typeof c.id === "number" ? c.id : undefined,
        })),
        items: selectedItems.map((item) => ({
          type: item.type,
          text: item.text,
          media_url: item.media_url,
          mime_type: item.mime_type,
          file_name: item.file_name,
          caption: item.caption,
          title: item.title,
          save_to_material: item.save_to_material || false,
        })),
      };

      const res = await fetch(`${BASE_URL}/api/whatsapp/send-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to send messages");
      }

      const result = await res.json();

      setSendProgress({
        total: selectedCount * itemsCount,
        sent: result.total_messages_sent || 0,
        failed: result.total_failed || 0,
        creditsDeducted: result.total_credits_deducted || 0,
        done: true,
      });

      // Refresh credits in context
      refreshCredits();

      showToast(
        `Successfully sent ${result.total_messages_sent} WhatsApp messages (${result.total_credits_deducted} credits deducted)`
      );
    } catch (err: any) {
      showToast(err.message || "An error occurred during send", "error");
      setSendProgress(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <DashboardShell title="Send WhatsApp Message">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
              : "border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/80 dark:text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ── Sub Navigation Header Tabs ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <Link
            href="/whatsapp"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat Inbox
          </Link>
          <Link
            href="/whatsapp/send"
            className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-white shadow-sm transition"
          >
            <Send className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            Send Message
          </Link>
          <Link
            href="/whatsapp/materials"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Layers className="h-3.5 w-3.5" />
            Material Base
          </Link>
          <Link
            href="/whatsapp/history"
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Clock className="h-3.5 w-3.5" />
            History
          </Link>
        </div>

        {/* Available Credits Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Credits: {userCredits}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ══════════════════════════════════════════════════════
            LEFT COLUMN (7 cols): CONTACT SELECTION & FILTERS
        ══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Select Source */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  1
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Select Recipients Source</h3>
              </div>

              {/* Source Toggle */}
              <div className="flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setSourceMode("campaign")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                    sourceMode === "campaign"
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" /> Calling Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode("upload")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition ${
                    sourceMode === "upload"
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Excel / CSV / Google Sheet
                </button>
              </div>
            </div>

            {/* Campaign Selector */}
            {sourceMode === "campaign" ? (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Existing Campaign
                </label>
                {loadingCampaigns ? (
                  <div className="flex h-10 items-center gap-2 text-xs text-zinc-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                    Loading campaigns...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-3.5 pr-10 text-xs font-medium text-zinc-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.contactCount || c.totalCalls} Contacts) • {c.status}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-zinc-400" />
                  </div>
                )}
              </div>
            ) : (
              /* Upload / Google Sheet Option */
              <div className="mt-4 space-y-3">
                {/* Submode toggle */}
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <button
                    type="button"
                    onClick={() => setUploadSubMode("file")}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      uploadSubMode === "file"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Upload File (.xlsx, .xls, .csv)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSubMode("sheet")}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      uploadSubMode === "sheet"
                        ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    Google Sheets Link
                  </button>
                </div>

                {uploadSubMode === "file" ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/70 p-6 text-center hover:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/40 transition"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="h-7 w-7 text-violet-500" />
                    <p className="mt-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Upload Contacts (.xlsx, .xls, .csv)
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      Drag and drop or click to browse. Phone numbers will automatically be normalized (+91 format).
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Google Sheets Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit..."
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        disabled={loadingGoogleSheet || !googleSheetUrl.trim()}
                        onClick={handleLoadGoogleSheet}
                        className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 transition"
                      >
                        {loadingGoogleSheet ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Fetching...
                          </>
                        ) : (
                          "Import Sheet"
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400">
                      Ensure your Google Sheet link is shared as <strong>&ldquo;Anyone with the link can view&rdquo;</strong> so the contact list can be fetched and imported.
                    </p>
                  </div>
                )}

                {uploadedFileStats && (
                  <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <div>
                      <span className="text-[10px] text-zinc-400">Source:</span>
                      <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {uploadedFileStats.fileName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400">Total Found:</span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {uploadedFileStats.total}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Valid:</span>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {uploadedFileStats.valid}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-red-500 font-medium">Invalid:</span>
                      <p className="text-xs font-bold text-red-500">
                        {uploadedFileStats.invalid}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Filter & Select Contacts */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  2
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Contacts Selection
                </h3>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {selectedCount} Selected
                </span>
              </div>

              {/* Bulk select button */}
              <button
                type="button"
                onClick={handleToggleSelectAllFiltered}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
              >
                {filteredContacts.filter((c) => c.is_valid_phone).every((c) => selectedContactIds.has(c.id)) &&
                filteredContacts.length > 0 ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" /> Deselect All Filtered
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5" /> Select All Filtered ({filteredContacts.filter((c) => c.is_valid_phone).length})
                  </>
                )}
              </button>
            </div>

            {/* Filter controls */}
            <div className="mt-4 space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search contacts by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Dropdown Filters (Only in campaign mode) */}
              {sourceMode === "campaign" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {/* Call Type */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                      Call Type
                    </label>
                    <select
                      value={filterCallType}
                      onChange={(e) => setFilterCallType(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <option value="all">All Types</option>
                      <option value="Outbound">Outbound</option>
                      <option value="Inbound">Inbound</option>
                    </select>
                  </div>

                  {/* AI Classification */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                      AI Class
                    </label>
                    <select
                      value={filterClassification}
                      onChange={(e) => setFilterClassification(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <option value="all">All Leads</option>
                      <option value="Hot Lead">Hot Lead</option>
                      <option value="Warm Lead">Warm Lead</option>
                      <option value="Cold Lead">Cold Lead</option>
                      <option value="Interested">Interested</option>
                      <option value="Callback">Callback</option>
                      <option value="Appointment">Appointment</option>
                    </select>
                  </div>

                  {/* Response */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                      Response
                    </label>
                    <select
                      value={filterResponse}
                      onChange={(e) => setFilterResponse(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <option value="all">All Responses</option>
                      <option value="Answered">Answered</option>
                      <option value="Not Answered">Not Answered</option>
                      <option value="Appointment Booked">Appointment Booked</option>
                      <option value="Callback">Callback</option>
                      <option value="Declined">Declined</option>
                      <option value="Cut">Cut/Disconnected</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      <option value="all">All Status</option>
                      <option value="Completed">Completed</option>
                      <option value="Failed">Failed</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Contacts List Table */}
            <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              {loadingContacts ? (
                <div className="flex h-36 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No contacts found matching the filters.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredContacts.filter((c) => c.is_valid_phone).length > 0 &&
                            filteredContacts
                              .filter((c) => c.is_valid_phone)
                              .every((c) => selectedContactIds.has(c.id))
                          }
                          onChange={handleToggleSelectAllFiltered}
                          className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                        />
                      </th>
                      <th className="p-2.5 font-semibold">Name</th>
                      <th className="p-2.5 font-semibold">Phone</th>
                      <th className="p-2.5 font-semibold">Classification</th>
                      <th className="p-2.5 font-semibold">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredContacts.map((contact) => {
                      const isSelected = selectedContactIds.has(contact.id);
                      return (
                        <tr
                          key={contact.id}
                          onClick={() => {
                            if (contact.is_valid_phone) handleToggleContact(contact.id);
                          }}
                          className={`cursor-pointer transition ${
                            !contact.is_valid_phone
                              ? "opacity-40 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900"
                              : isSelected
                              ? "bg-violet-50/70 dark:bg-violet-950/40"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          }`}
                        >
                          <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              disabled={!contact.is_valid_phone}
                              checked={isSelected}
                              onChange={() => handleToggleContact(contact.id)}
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                            {contact.name}
                          </td>
                          <td className="p-2.5 text-zinc-600 dark:text-zinc-400">
                            <span className={contact.is_valid_phone ? "font-mono" : "text-red-500"}>
                              {contact.formatted_phone || contact.phone}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                contact.ai_classification === "Hot Lead"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : contact.ai_classification === "Warm Lead"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : contact.ai_classification === "Interested"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {contact.ai_classification || "Other"}
                            </span>
                          </td>
                          <td className="p-2.5 text-zinc-600 dark:text-zinc-400">
                            {contact.response || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT COLUMN (5 cols): MESSAGE CONTENT & ESTIMATION
        ══════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">
          {/* STEP 3: Message & Attachments */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Message & Materials</h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMaterialPicker(true)}
                  className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 transition"
                >
                  <Layers className="h-3 w-3" />
                  Material Base
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(true)}
                  className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition"
                >
                  <Plus className="h-3 w-3" />
                  Create New
                </button>
              </div>
            </div>

            {/* Selected items list */}
            <div className="mt-4 space-y-2.5">
              {selectedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-800">
                  <FileText className="mx-auto h-7 w-7 text-zinc-400" />
                  <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No message content selected
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-400">
                    Choose materials from your Material Base or create a custom one-time message.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setShowMaterialPicker(true)}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                    >
                      Pick from Material Base
                    </button>
                  </div>
                </div>
              ) : (
                selectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                        {item.type === "text" ? (
                          <FileText className="h-3.5 w-3.5" />
                        ) : item.type === "image" ? (
                          <ImageIcon className="h-3.5 w-3.5" />
                        ) : (
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="rounded bg-zinc-200/80 px-1.5 py-0.2 text-[9px] uppercase font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {item.type}
                          </span>
                        </div>
                        {item.type === "text" && item.text && (
                          <p className="mt-1 text-[11px] text-zinc-600 line-clamp-2 dark:text-zinc-400 leading-relaxed">
                            {item.text}
                          </p>
                        )}
                        {item.type !== "text" && item.media_url && (
                          <p className="mt-0.5 text-[10px] text-zinc-400 font-mono truncate">
                            {item.file_name || item.media_url}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400 transition shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STEP 4: Credit Estimation & Confirmation */}
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-5 shadow-sm dark:border-violet-900/40 dark:from-zinc-900 dark:to-violet-950/20">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                4
              </span>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Credit Calculation</h3>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-violet-200/60 bg-white/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Selected Recipients:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                <span>Messages per Contact:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{itemsCount}</span>
              </div>
              <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-xs font-semibold dark:border-zinc-800">
                <span className="text-zinc-800 dark:text-zinc-200">Total WhatsApp Credits Needed:</span>
                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                  {totalRequiredCredits} Credits
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>Your Available Credits:</span>
                <span className={hasSufficientCredits ? "text-emerald-600 font-semibold" : "text-red-500 font-bold"}>
                  {userCredits} Credits
                </span>
              </div>
            </div>

            {/* Insufficient credits warning */}
            {!hasSufficientCredits && totalRequiredCredits > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Insufficient WhatsApp credits. Required: {totalRequiredCredits}, Available: {userCredits}.
                </span>
              </div>
            )}

            {/* Send Button */}
            <button
              type="button"
              disabled={selectedCount === 0 || itemsCount === 0 || !hasSufficientCredits || isSending}
              onClick={() => setShowConfirmModal(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              Confirm & Send ({selectedCount} Contacts • {totalRequiredCredits} Credits)
            </button>
          </div>

          {/* Send Progress Box */}
          {sendProgress && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Execution Status</h4>
                {sendProgress.done ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 animate-pulse">
                    <RefreshCw className="h-3 w-3 animate-spin" /> In Progress...
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                  <span className="text-[10px] text-zinc-400">Total Sent</span>
                  <p className="text-sm font-bold text-emerald-600">{sendProgress.sent}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                  <span className="text-[10px] text-zinc-400">Failed</span>
                  <p className="text-sm font-bold text-red-500">{sendProgress.failed}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                  <span className="text-[10px] text-zinc-400">Credits Deducted</span>
                  <p className="text-sm font-bold text-violet-600">{sendProgress.creditsDeducted}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL: PICK FROM MATERIAL BASE
      ══════════════════════════════════════════════════════ */}
      {showMaterialPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Select from Material Base</h3>
              </div>
              <button
                onClick={() => setShowMaterialPicker(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Picker Type Tabs */}
            <div className="mt-3 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 shrink-0">
              {(["all", "text", "image", "document"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPickerTab(tab)}
                  className={`flex-1 py-1 text-xs font-medium rounded-lg capitalize transition ${
                    pickerTab === tab
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {tab === "all" ? "All Items" : tab + "s"}
                </button>
              ))}
            </div>

            {/* Materials List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
              {materials.filter((m) => pickerTab === "all" || m.type === pickerTab).length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No materials found. You can add materials in the{" "}
                  <Link href="/whatsapp/materials" className="text-violet-600 underline">
                    Material Base
                  </Link>{" "}
                  section.
                </div>
              ) : (
                materials
                  .filter((m) => pickerTab === "all" || m.type === pickerTab)
                  .map((mat) => {
                    const isAlreadyAdded = selectedItems.some((item) => item.id === `mat_${mat.id}`);
                    return (
                      <div
                        key={mat.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 hover:border-violet-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-violet-800 transition"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                            {mat.type === "text" ? (
                              <FileText className="h-3.5 w-3.5" />
                            ) : mat.type === "image" ? (
                              <ImageIcon className="h-3.5 w-3.5" />
                            ) : (
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {mat.title}
                            </h5>
                            {mat.type === "text" && mat.content && (
                              <p className="mt-0.5 text-[10px] text-zinc-500 line-clamp-1">
                                {mat.content}
                              </p>
                            )}
                            {mat.type !== "text" && mat.file_url && (
                              <p className="mt-0.5 text-[10px] text-zinc-400 font-mono truncate">
                                {mat.file_url.split("/").pop()}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => handleSelectMaterial(mat)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition shrink-0 ${
                            isAlreadyAdded
                              ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed"
                              : "bg-violet-600 text-white hover:bg-violet-700"
                          }`}
                        >
                          {isAlreadyAdded ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: CREATE CUSTOM MESSAGE
      ══════════════════════════════════════════════════════ */}
      {showCustomComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Create Custom Message</h3>
              </div>
              <button
                onClick={() => setShowCustomComposer(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Message Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Follow-up"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Message Body <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomText((p) => p + "{{name}}")}
                      className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    >
                      + {"{{name}}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, thank you for speaking with us..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="saveMaterialCheck"
                  checked={saveToMaterial}
                  onChange={(e) => setSaveToMaterial(e.target.checked)}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="saveMaterialCheck" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Save to Material Base for future reuse
                </label>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCustomComposer(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomMessage}
                  className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
                >
                  Add to Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: CONFIRM SEND
      ══════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Confirm WhatsApp Message</h4>
                <p className="text-xs text-zinc-500">Please review before executing the send.</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Recipients:</span>
                <span className="font-bold text-zinc-900 dark:text-white">{selectedCount} Contacts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Source:</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {sourceMode === "campaign"
                    ? campaigns.find((c) => c.id === selectedCampaignId)?.name || "Selected Campaign"
                    : uploadedFileStats?.fileName || "Uploaded Contacts"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Attachments / Items:</span>
                <span className="font-medium text-zinc-900 dark:text-white">{itemsCount} Item(s)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 font-bold dark:border-zinc-800">
                <span className="text-zinc-700 dark:text-zinc-300">Estimated WhatsApp Credits:</span>
                <span className="text-sm text-violet-600 dark:text-violet-400">{totalRequiredCredits}</span>
              </div>
            </div>

            <p className="mt-3 text-[10px] text-zinc-400 text-center">
              Credit pricing: Text (1 credit), Image (2 credits), Document (3 credits) per recipient.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition"
              >
                <Check className="h-3.5 w-3.5" /> Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Add Material Modal */}
      <AddMaterialModal
        isOpen={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        onSuccess={handleMaterialCreated}
        initialType="text"
      />
    </DashboardShell>
  );
}
