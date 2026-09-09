"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  QrCode,
  Calendar,
  Smartphone,
  CalendarClock,
  Eye,
  ExternalLink,
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";
import AddMaterialModal from "@/components/whatsapp/AddMaterialModal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://127.0.0.1:8000");
const INSTANCE_NAME = "callinggen_default";

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
  id: number | string;
  name: string;
  date?: string;
  total_contacts?: number;
}

interface MaterialItem {
  id: number;
  title: string;
  type: "text" | "image" | "document";
  content?: string;
  file_url?: string;
  mime_type?: string;
}

interface MessageItemToSend {
  id: string;
  type: "text" | "image" | "document";
  title?: string;
  text?: string;
  media_url?: string;
  mime_type?: string;
  file_name?: string;
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
  return (
    <Suspense fallback={
      <DashboardShell title="Send WhatsApp Message">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </DashboardShell>
    }>
      <SendMessageContent />
    </Suspense>
  );
}

function SendMessageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedMaterialId = searchParams.get("useMaterial");
  const preselectedCampaignId = searchParams.get("campaign_id");

  const { isLoggedIn, user } = useAuth();
  const token = user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const { credits, refreshCredits } = useCredits();

  // WhatsApp Connection Guard
  const [connectionState, setConnectionState] = useState<"checking" | "connected" | "disconnected">("checking");
  const [checkingConnection, setCheckingConnection] = useState(false);

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
  const [previewMaterial, setPreviewMaterial] = useState<{ title: string; type: string; url?: string; content?: string; mime_type?: string } | null>(null);

  // Custom Message Composer
  const [customTitle, setCustomTitle] = useState("");
  const [customText, setCustomText] = useState("");
  const [saveToMaterial, setSaveToMaterial] = useState(false);
  const [showCustomComposer, setShowCustomComposer] = useState(false);

  // Scheduling State
  const [deliveryTiming, setDeliveryTiming] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

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

  const getAuthToken = useCallback(() => {
    if (user?.token) return user.token;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.token) return parsed.token;
        }
      } catch {}
      return localStorage.getItem("token") || "";
    }
    return "";
  }, [user]);

  const authToken = getAuthToken();

  // Check WhatsApp Connection Status
  const checkWhatsAppStatus = useCallback(async () => {
    setCheckingConnection(true);
    try {
      const res = await fetch(`${BASE_URL}/api/whatsapp/status?instance_name=${INSTANCE_NAME}`);
      if (res.ok) {
        const data = await res.json();
        const state = data?.data?.instance?.state || data?.data?.state || "disconnected";
        if (state === "open" || state === "connected") {
          setConnectionState("connected");
        } else {
          setConnectionState("disconnected");
        }
      } else {
        setConnectionState("disconnected");
      }
    } catch {
      setConnectionState("disconnected");
    } finally {
      setCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkWhatsAppStatus();
  }, [checkWhatsAppStatus]);

  // Set default schedule time (1 hour from now)
  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setScheduledDate(dateStr);
    setScheduledTime(timeStr);
  }, []);

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

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawRows(results.data as any[], fileName);
        },
        error: (err) => {
          showToast(`CSV parsing error: ${err.message}`, "error");
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processRawRows(data as any[], fileName);
        } catch (err: any) {
          showToast(`Excel parsing error: ${err.message}`, "error");
        }
      };
      reader.readAsBinaryString(file);
    } else {
      showToast("Unsupported file format. Please upload .csv, .xlsx, or .xls", "error");
    }
  };

  // 4b. Handle Google Sheet URL import
  const handleFetchGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      showToast("Please enter a Google Sheet URL", "error");
      return;
    }

    setLoadingGoogleSheet(true);
    try {
      // 1. Try backend server-side fetch first (handles CORS & parsing cleanly)
      const res = await fetch(`${BASE_URL}/api/whatsapp/import-google-sheet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ sheet_url: googleSheetUrl.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rows && data.rows.length > 0) {
          processRawRows(data.rows, "Google Sheet");
          showToast(`✓ Successfully imported ${data.rows.length} rows from Google Sheet!`, "success");
          return;
        }
      }

      // 2. Client-side fallback if backend route returned non-200
      const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error("Invalid Google Sheet link. Make sure it looks like: https://docs.google.com/spreadsheets/d/...");
      }
      const sheetId = match[1];
      const gidMatch = googleSheetUrl.match(/[#&]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : "0";
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

      const clientRes = await fetch(exportUrl);
      if (!clientRes.ok) {
        throw new Error("Could not access Google Sheet. Please verify link sharing is set to 'Anyone with the link can view'.");
      }
      const csvText = await clientRes.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            processRawRows(results.data as any[], "Google Sheet");
            showToast(`✓ Successfully imported ${results.data.length} contacts from Google Sheet!`, "success");
          } else {
            showToast("Google Sheet contained no rows", "error");
          }
        },
        error: (err: any) => {
          showToast(`Failed to parse sheet CSV: ${err?.message || "Unknown error"}`, "error");
        },
      });
    } catch (err: any) {
      console.error("Google Sheet Import Error:", err);
      showToast(err.message || "Failed to load Google Sheet contacts", "error");
    } finally {
      setLoadingGoogleSheet(false);
    }
  };

  const processRawRows = (rows: any[], fileName: string) => {
    if (!rows || rows.length === 0) {
      showToast("Uploaded file is empty", "error");
      return;
    }

    let validCount = 0;
    let invalidCount = 0;

    const parsedContacts: ContactRow[] = rows.map((row, idx) => {
      let rawPhone =
        row.phone ||
        row.Phone ||
        row.mobile ||
        row.Mobile ||
        row.contact ||
        row.Contact ||
        row.number ||
        row.Number ||
        row["Phone Number"] ||
        row["phone_number"] ||
        "";

      let rawName =
        row.name ||
        row.Name ||
        row.customer_name ||
        row["Customer Name"] ||
        row["Contact Name"] ||
        row.fullName ||
        row["Full Name"] ||
        "Contact " + (idx + 1);

      const { formatted, isValid } = normalizePhone(String(rawPhone));
      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      return {
        id: `file_${idx + 1}`,
        name: String(rawName).trim(),
        phone: String(rawPhone).trim(),
        formatted_phone: formatted,
        is_valid_phone: isValid,
        call_type: "Manual Upload",
        ai_classification: "Uncategorized",
        response: "-",
        status: isValid ? "valid" : "invalid",
      };
    });

    setContacts(parsedContacts);
    const validIds = new Set(parsedContacts.filter((c) => c.is_valid_phone).map((c) => c.id));
    setSelectedContactIds(validIds);

    setUploadedFileStats({
      fileName,
      total: rows.length,
      valid: validCount,
      invalid: invalidCount,
    });

    showToast(`Loaded ${rows.length} contacts (${validCount} valid WhatsApp numbers)`);
  };

  // 5. Classification Badge Styler
  const getClassificationBadge = (cls?: string) => {
    if (!cls || cls === "—" || cls === "-") return <span className="text-zinc-400 text-xs">—</span>;
    const lower = cls.toLowerCase();
    if (lower.includes("hot")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300">
          Hot Lead
        </span>
      );
    }
    if (lower.includes("warm")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
          Warm Lead
        </span>
      );
    }
    if (lower.includes("cold")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
          Cold Lead
        </span>
      );
    }
    if (lower.includes("interested") || lower.includes("appointment")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {cls}
        </span>
      );
    }
    if (lower.includes("callback")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
          Callback
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {cls}
      </span>
    );
  };

  // 6. Contact Selection Helpers
  const toggleSelectContact = (id: string | number) => {
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 7. Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.name || "").toLowerCase().includes(q);
        const matchPhone = (c.phone || "").includes(q) || (c.formatted_phone || "").includes(q);
        if (!matchName && !matchPhone) return false;
      }

      if (filterCallType !== "all" && (c.call_type || "Outbound").toLowerCase() !== filterCallType.toLowerCase()) {
        return false;
      }
      if (filterClassification !== "all") {
        const cClass = (c.ai_classification || "Other").toLowerCase();
        if (!cClass.includes(filterClassification.toLowerCase())) {
          return false;
        }
      }
      if (filterResponse !== "all") {
        const cResp = (c.response || "").toLowerCase();
        if (!cResp.includes(filterResponse.toLowerCase())) {
          return false;
        }
      }
      if (filterStatus !== "all") {
        if (filterStatus === "valid" && !c.is_valid_phone) return false;
        if (filterStatus === "invalid" && c.is_valid_phone) return false;
        if (filterStatus !== "valid" && filterStatus !== "invalid") {
          if ((c.status || "Completed").toLowerCase() !== filterStatus.toLowerCase()) return false;
        }
      }

      return true;
    });
  }, [contacts, searchQuery, filterCallType, filterClassification, filterResponse, filterStatus]);

  const validFilteredContacts = useMemo(() => {
    return filteredContacts.filter((c) => c.is_valid_phone);
  }, [filteredContacts]);

  const isAllFilteredSelected = useMemo(() => {
    return (
      validFilteredContacts.length > 0 &&
      validFilteredContacts.every((c) => selectedContactIds.has(c.id))
    );
  }, [validFilteredContacts, selectedContactIds]);

  const toggleSelectFiltered = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered contacts
      setSelectedContactIds((prev) => {
        const next = new Set(prev);
        validFilteredContacts.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      // Select all valid filtered contacts
      setSelectedContactIds((prev) => {
        const next = new Set(prev);
        validFilteredContacts.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  // 8. Message Queue Items Management
  const handleSelectMaterial = (mat: MaterialItem) => {
    if (selectedItems.some((item) => item.id === `mat_${mat.id}`)) {
      showToast("This material is already in your message queue", "error");
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        id: `mat_${mat.id}`,
        type: mat.type,
        title: mat.title,
        text: mat.content,
        media_url: mat.file_url,
        file_name: mat.file_url ? mat.file_url.split("/").pop() : undefined,
        mime_type: mat.mime_type,
      },
    ]);

    setShowMaterialPicker(false);
    showToast(`Added '${mat.title}' to message queue`);
  };

  const handleAddCustomMessage = () => {
    if (!customText.trim()) {
      showToast("Please enter message content", "error");
      return;
    }

    const newId = `custom_${Date.now()}`;
    const title = customTitle.trim() || `Custom Text #${selectedItems.length + 1}`;

    setSelectedItems((prev) => [
      ...prev,
      {
        id: newId,
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

  // Centralized frontend credit estimation matching backend rules
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

  // Execute Send or Schedule
  const handleExecuteSend = async () => {
    if (connectionState !== "connected") {
      showToast("Please connect your WhatsApp number first", "error");
      return;
    }
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

    let scheduledIso: string | undefined = undefined;
    if (deliveryTiming === "scheduled") {
      if (!scheduledDate || !scheduledTime) {
        showToast("Please select both a scheduled date and time", "error");
        return;
      }
      const schedDt = new Date(`${scheduledDate}T${scheduledTime}`);
      if (isNaN(schedDt.getTime()) || schedDt.getTime() <= Date.now() + 30000) {
        showToast("Scheduled time must be at least 1 minute in the future", "error");
        return;
      }
      scheduledIso = schedDt.toISOString();
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
        scheduled_for: scheduledIso,
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

      const token = getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/whatsapp/send-bulk`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = "Failed to execute send request";
        try {
          const err = await res.json();
          errMsg = err.detail || err.message || errMsg;
        } catch {
          errMsg = `Server error (${res.status}): ${res.statusText}`;
        }
        throw new Error(errMsg);
      }

      const result = await res.json();

      if (result.status === "scheduled") {
        showToast(result.message || "✓ Broadcast scheduled successfully!", "success");
        setSendProgress(null);
        router.push("/whatsapp/history?status=scheduled");
        return;
      }

      setSendProgress({
        total: selectedCount * itemsCount,
        sent: result.total_messages_sent || 0,
        failed: result.total_failed || 0,
        creditsDeducted: result.total_credits_deducted || 0,
        done: true,
      });

      // Refresh credits in context
      refreshCredits();

      const sentCount = result.total_messages_sent || 0;
      const failedCount = result.total_failed || 0;
      const firstError =
        result.details?.[0]?.items?.find((i: any) => i.status === "failed" && i.error)?.error ||
        result.details?.[0]?.error_message ||
        "";

      if (sentCount > 0 && failedCount === 0) {
        showToast(
          `✓ Successfully sent ${sentCount} WhatsApp messages (${result.total_credits_deducted} credits deducted)`,
          "success"
        );
      } else if (sentCount > 0 && failedCount > 0) {
        showToast(
          `Sent ${sentCount} messages, but ${failedCount} failed${firstError ? `: ${firstError}` : ""}`,
          "error"
        );
      } else {
        showToast(
          `Delivery failed for ${failedCount} recipient(s)${firstError ? `: ${firstError}` : ""}`,
          "error"
        );
      }
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
            History & Scheduled
          </Link>
        </div>

        {/* Available Credits Badge & Status */}
        <div className="flex items-center gap-2">
          {connectionState === "connected" ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              WhatsApp Connected
            </span>
          ) : (
            <Link
              href="/whatsapp"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 transition"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Not Connected
            </Link>
          )}

          <div className="flex items-center gap-1.5 rounded-xl border border-violet-200/80 bg-violet-50/60 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Credits: {userCredits}</span>
          </div>
        </div>
      </div>

      {/* ── Main Send Workspace (With Connection Guard Overlay) ── */}
      <div className="relative">
        {/* Connection Guard Blur Overlay */}
        {connectionState === "disconnected" && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-md dark:bg-zinc-950/80 p-6 min-h-[500px]">
            <div className="max-w-md w-full rounded-2xl border border-rose-200/80 bg-white p-7 text-center shadow-2xl dark:border-rose-900/60 dark:bg-zinc-900 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                <Smartphone className="h-7 w-7" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  WhatsApp Device Not Connected
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Connecting your WhatsApp number is <strong>required</strong> before sending or scheduling broadcasts. Link your device to deliver messages reliably.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Link
                  href="/whatsapp"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition"
                >
                  <QrCode className="h-4 w-4" /> Connect Number Now
                </Link>
                <button
                  type="button"
                  onClick={checkWhatsAppStatus}
                  disabled={checkingConnection}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${checkingConnection ? "animate-spin" : ""}`} /> Check Status
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ══════════════════════════════════════════════════════
              LEFT COLUMN: CONTACTS SELECTION (7 COLS)
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: Select Source Mode */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Choose Contacts Source</h3>
                </div>
              </div>

              {/* Source Mode Switcher */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceMode("campaign")}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                    sourceMode === "campaign"
                      ? "border-violet-600 bg-violet-50/50 dark:border-violet-500 dark:bg-violet-950/30 ring-1 ring-violet-600/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      sourceMode === "campaign"
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">Campaign</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      From call campaign
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceMode("upload")}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
                    sourceMode === "upload"
                      ? "border-violet-600 bg-violet-50/50 dark:border-violet-500 dark:bg-violet-950/30 ring-1 ring-violet-600/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      sourceMode === "upload"
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">File / Sheets</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      Excel, CSV or Google
                    </p>
                  </div>
                </button>
              </div>

              {/* Sub Mode Content */}
              <div className="mt-4">
                {sourceMode === "campaign" ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Select Campaign
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        disabled={loadingCampaigns}
                        className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-900 font-medium focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 cursor-pointer"
                      >
                        {campaigns.length === 0 ? (
                          <option value="">No campaigns available</option>
                        ) : (
                          campaigns.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.contactCount || c.total_contacts || 0} Contacts)
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Upload Sub Mode Tabs */}
                    <div className="flex gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setUploadSubMode("file")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          uploadSubMode === "file"
                            ? "bg-white text-violet-700 dark:bg-zinc-900 dark:text-violet-300 shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        Upload Excel / CSV
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadSubMode("sheet")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          uploadSubMode === "sheet"
                            ? "bg-white text-violet-700 dark:bg-zinc-900 dark:text-violet-300 shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        Google Sheet Link
                      </button>
                    </div>

                    {uploadSubMode === "file" ? (
                      <div>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer rounded-2xl border-2 border-dashed border-zinc-300 p-5 text-center hover:border-violet-500 dark:border-zinc-700 dark:hover:border-violet-400 transition"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <FileSpreadsheet className="mx-auto h-7 w-7 text-zinc-400" />
                          <p className="mt-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Click to upload CSV or Excel
                          </p>
                          <p className="text-[10px] text-zinc-400">Supports .csv, .xlsx, .xls with Phone column</p>
                        </div>

                        {uploadedFileStats && (
                          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-violet-50 p-2.5 text-xs text-violet-900 dark:bg-violet-950/40 dark:text-violet-200 border border-violet-200/60">
                            <span className="font-semibold truncate max-w-[150px]">{uploadedFileStats.fileName}</span>
                            <span className="text-[10px] font-bold">
                              {uploadedFileStats.valid} Valid • {uploadedFileStats.invalid} Invalid
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                            Google Sheets Public / Shared Link
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://docs.google.com/spreadsheets/d/..."
                              value={googleSheetUrl}
                              onChange={(e) => setGoogleSheetUrl(e.target.value)}
                              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            <button
                              type="button"
                              onClick={handleFetchGoogleSheet}
                              disabled={loadingGoogleSheet}
                              className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                            >
                              {loadingGoogleSheet ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                "Import"
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-tight">
                            Ensure sharing is set to <strong>&quot;Anyone with the link can view&quot;</strong> and has Name & Phone columns.
                          </p>
                        </div>

                        {uploadedFileStats && (
                          <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200/60">
                            <span className="font-semibold">{uploadedFileStats.fileName}</span>
                            <span className="text-[10px] font-bold">
                              {uploadedFileStats.valid} Valid Contacts
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: Contacts Selection Card (Rich Filter Bar & Table matching User Design) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Contacts Selection</h3>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {selectedCount} Selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleSelectFiltered}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition cursor-pointer"
                >
                  {isAllFilteredSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4" />
                      <span>Deselect All Filtered</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4" />
                      <span>Select All Filtered</span>
                    </>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search contacts by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-violet-500 focus:outline-none placeholder-zinc-400 text-zinc-900 dark:text-white"
                />
              </div>

              {/* 4 Filter Dropdowns: CALL TYPE | AI CLASS | RESPONSE | STATUS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. CALL TYPE */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    CALL TYPE
                  </label>
                  <div className="relative">
                    <select
                      value={filterCallType}
                      onChange={(e) => setFilterCallType(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <option value="all">All Types</option>
                      <option value="outbound">Outbound</option>
                      <option value="inbound">Inbound</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>

                {/* 2. AI CLASS */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    AI CLASS
                  </label>
                  <div className="relative">
                    <select
                      value={filterClassification}
                      onChange={(e) => setFilterClassification(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <option value="all">All Leads</option>
                      <option value="Hot Lead">Hot Lead</option>
                      <option value="Warm Lead">Warm Lead</option>
                      <option value="Cold Lead">Cold Lead</option>
                      <option value="Interested">Interested</option>
                      <option value="Callback">Callback</option>
                      <option value="Appointment">Appointment</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>

                {/* 3. RESPONSE */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    RESPONSE
                  </label>
                  <div className="relative">
                    <select
                      value={filterResponse}
                      onChange={(e) => setFilterResponse(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <option value="all">All Responses</option>
                      <option value="Answered">Answered</option>
                      <option value="Not Answered">Not Answered</option>
                      <option value="Appointment Booked">Appointment Booked</option>
                      <option value="Callback">Callback</option>
                      <option value="Declined">Declined</option>
                      <option value="Cut/Disconnected">Cut/Disconnected</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>

                {/* 4. STATUS */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    STATUS
                  </label>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-zinc-800 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                      <option value="valid">Valid Numbers</option>
                      <option value="invalid">Invalid Numbers</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>
              </div>

              {/* Table Box */}
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <button type="button" onClick={toggleSelectFiltered} className="text-violet-600">
                            {isAllFilteredSelected ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4 text-zinc-400" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Name</th>
                        <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Phone</th>
                        <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Classification</th>
                        <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-300">Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-900">
                      {loadingContacts ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-zinc-400">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-600" />
                            Loading contacts...
                          </td>
                        </tr>
                      ) : filteredContacts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-zinc-400">
                            No contacts match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredContacts.map((contact) => {
                          const isSelected = selectedContactIds.has(contact.id);
                          return (
                            <tr
                              key={contact.id}
                              onClick={() => contact.is_valid_phone && toggleSelectContact(contact.id)}
                              className={`cursor-pointer transition ${
                                isSelected ? "bg-violet-50/40 dark:bg-violet-950/20" : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                              } ${!contact.is_valid_phone ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                {contact.is_valid_phone ? (
                                  isSelected ? (
                                    <CheckSquare className="h-4 w-4 text-violet-600 inline" />
                                  ) : (
                                    <Square className="h-4 w-4 text-zinc-400 inline" />
                                  )
                                ) : (
                                  <X className="h-4 w-4 text-rose-400 inline" />
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                                {contact.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                                {contact.phone || contact.formatted_phone}
                              </td>
                              <td className="py-2.5 px-3">
                                {getClassificationBadge(contact.ai_classification)}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-medium">
                                {contact.response || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT COLUMN: MESSAGE COMPOSITION & TIMING (5 COLS)
          ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* STEP 3: Choose Message Content */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Message & Attachments</h3>
                </div>
              </div>

              {/* Message Items Queue */}
              <div className="mt-4 space-y-2.5">
                {selectedItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                    No message or materials added yet.
                  </div>
                ) : (
                  selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950"
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
                          <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {item.title}
                          </h5>
                          {item.text && (
                            <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                              {item.text}
                            </p>
                          )}
                          {item.file_name && (
                            <p className="mt-0.5 text-[10px] text-zinc-400 font-mono truncate">
                              {item.file_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.media_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewMaterial({
                              title: item.title || item.file_name || "Attachment",
                              type: item.type,
                              url: item.media_url,
                              mime_type: item.mime_type
                            })}
                            className="p-1 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                            title="Preview Attachment"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMaterialPicker(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition"
                >
                  <Layers className="h-3.5 w-3.5 text-violet-600" />
                  From Material Base
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomComposer(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 shadow-sm transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + Custom Text
                </button>
              </div>
            </div>

            {/* STEP 3: Delivery Timing & Scheduling */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  3
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Delivery Schedule</h3>
              </div>

              {/* Timing Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDeliveryTiming("immediate")}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    deliveryTiming === "immediate"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-violet-600" /> Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTiming("scheduled")}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    deliveryTiming === "scheduled"
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <CalendarClock className="w-3.5 h-3.5 text-indigo-600" /> Schedule Later
                </button>
              </div>

              {/* Schedule Date & Time Pickers */}
              {deliveryTiming === "scheduled" && (
                <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/60 space-y-3 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-violet-800 dark:text-violet-300 font-medium">
                    📅 Will be dispatched automatically on <strong>{scheduledDate} at {scheduledTime}</strong> (Local Time).
                  </p>
                </div>
              )}
            </div>

            {/* STEP 4: Credit Calculation & Send Button */}
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 p-5 shadow-sm dark:border-violet-900/40 dark:from-zinc-900 dark:to-violet-950/20">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white">
                  4
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Review & Execute</h3>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-violet-200/60 bg-white/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Recipients:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedCount} Contacts</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Messages per Contact:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{itemsCount} Item(s)</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-xs font-semibold dark:border-zinc-800">
                  <span className="text-zinc-800 dark:text-zinc-200">Required Credits:</span>
                  <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                    {totalRequiredCredits} Credits
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Available Credits:</span>
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

              {/* Send / Schedule Button */}
              <button
                type="button"
                disabled={selectedCount === 0 || itemsCount === 0 || !hasSufficientCredits || isSending || connectionState !== "connected"}
                onClick={() => setShowConfirmModal(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deliveryTiming === "scheduled" ? (
                  <>
                    <CalendarClock className="h-4 w-4" />
                    Confirm & Schedule Broadcast ({selectedCount} Contacts)
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Confirm & Send Broadcast ({selectedCount} Contacts)
                  </>
                )}
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
                  placeholder="Hello {{name}}, thank you for your time on our call..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveMaterial"
                  checked={saveToMaterial}
                  onChange={(e) => setSaveToMaterial(e.target.checked)}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                />
                <label htmlFor="saveMaterial" className="text-xs text-zinc-600 dark:text-zinc-400">
                  Save this message to Material Base for future reuse
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomComposer(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomMessage}
                className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: CONFIRM SEND / SCHEDULE
      ══════════════════════════════════════════════════════ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                {deliveryTiming === "scheduled" ? (
                  <CalendarClock className="h-5 w-5" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {deliveryTiming === "scheduled" ? "Confirm Scheduled Broadcast" : "Confirm WhatsApp Broadcast"}
                </h4>
                <p className="text-xs text-zinc-500">Please review before confirming execution.</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivery Timing:</span>
                <span className="font-bold text-violet-700 dark:text-violet-300">
                  {deliveryTiming === "scheduled" ? `📅 ${scheduledDate} at ${scheduledTime}` : "⚡ Send Immediately"}
                </span>
              </div>
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
                <span className="text-zinc-700 dark:text-zinc-300">Estimated Credits:</span>
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
                <Check className="h-3.5 w-3.5" />
                {deliveryTiming === "scheduled" ? "Confirm & Schedule" : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {previewMaterial.type === "image" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{previewMaterial.title}</h3>
                  <p className="text-[11px] text-zinc-500">
                    {previewMaterial.mime_type || previewMaterial.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {previewMaterial.url && (
                  <a
                    href={previewMaterial.url.startsWith("http") ? previewMaterial.url : `${BASE_URL}${previewMaterial.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 bg-zinc-100 dark:bg-zinc-950 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewMaterial.type === "image" && previewMaterial.url && (
                <div className="max-w-full max-h-[70vh] flex items-center justify-center">
                  <img
                    src={previewMaterial.url.startsWith("http") ? previewMaterial.url : `${BASE_URL}${previewMaterial.url}`}
                    alt={previewMaterial.title}
                    className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-lg"
                  />
                </div>
              )}

              {previewMaterial.type === "document" && previewMaterial.url && (
                <div className="w-full h-[68vh] rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-white shadow-inner">
                  <iframe
                    src={`${previewMaterial.url.startsWith("http") ? previewMaterial.url : `${BASE_URL}${previewMaterial.url}`}#toolbar=1`}
                    className="w-full h-full border-0"
                    title={previewMaterial.title}
                  />
                </div>
              )}

              {previewMaterial.type === "text" && (
                <div className="w-full max-w-xl p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 shadow-sm leading-relaxed">
                  {previewMaterial.content}
                </div>
              )}
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
