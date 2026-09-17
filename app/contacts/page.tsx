"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookUser,
  Users,
  Phone,
  Mail,
  Tag,
  Search,
  Plus,
  Upload,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Link2,
  CheckCircle2,
  X,
  Download,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreVertical,
  Check,
  Filter,
  Copy,
  AlertCircle,
  FolderPlus,
  Folder,
  ArrowRight,
  Send,
  MessageSquare,
  FileText,
  AlertTriangle,
  Layers,
  Clock,
  Settings2,
  CheckSquare,
  Square,
  UserCheck,
  ExternalLink,
  Globe,
  CheckCheck,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/components/AuthProvider";
import {
  api,
  SavedContactItem,
  SavedContactListSummary,
  SavedContactStats,
} from "@/lib/api";

type UploadTab = "file" | "sheet" | "manual";

interface ParsedContactPreview {
  id: string;
  name: string;
  phone: string;
  email: string;
  isValidPhone: boolean;
  isValidEmail: boolean;
  isDuplicate: boolean;
  rawPhone: string;
  notes?: string;
  metadata?: Record<string, any>;
}

function normalizePhoneNumber(raw: string): { formatted: string; isValid: boolean } {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return { formatted: `+91${digits}`, isValid: true };
  } else if (digits.length === 12 && digits.startsWith("91")) {
    return { formatted: `+${digits}`, isValid: true };
  } else if (digits.length >= 7 && digits.length <= 15) {
    return { formatted: `+${digits}`, isValid: true };
  }
  return { formatted: raw || "", isValid: false };
}

function isValidEmailAddress(email: string): boolean {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ContactsBookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTag = searchParams.get("tag");

  const { isLoggedIn } = useAuth();

  // ── Global Stats ──
  const [stats, setStats] = useState<SavedContactStats>({
    total_contacts: 0,
    valid_phones: 0,
    with_email: 0,
    total_tags: 0,
    recent_added_this_week: 0,
  });

  // ── Lists State (Card Grid) ──
  const [lists, setLists] = useState<SavedContactListSummary[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [listSortBy, setListSortBy] = useState<"updated" | "contacts" | "name">("updated");

  // ── Syncing State ──
  const [syncingTags, setSyncingTags] = useState<string[]>([]);

  // ── Drill-Down State (Detail View for a Selected List) ──
  const [activeListTag, setActiveListTag] = useState<string | null>(initialTag || null);
  const [listContacts, setListContacts] = useState<SavedContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [contactPage, setContactPage] = useState(1);
  const [contactPageSize, setContactPageSize] = useState(25);
  const [totalContactCount, setTotalContactCount] = useState(0);
  const [totalContactPages, setTotalContactPages] = useState(1);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // ── Toast Notification State ──
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Upload & Verification Modal State ──
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [wizardTab, setWizardTab] = useState<UploadTab>("file");
  const [wizardListName, setWizardListName] = useState("");
  const [wizardFileName, setWizardFileName] = useState("");
  const [wizardFileSize, setWizardFileSize] = useState("");
  const [wizardParsedRows, setWizardParsedRows] = useState<ParsedContactPreview[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSavingList, setIsSavingList] = useState(false);
  const [wizardManualText, setWizardManualText] = useState("");
  const [wizardGoogleSheetUrl, setWizardGoogleSheetUrl] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [wizardVerificationFilter, setWizardVerificationFilter] = useState<"all" | "valid" | "invalid">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Single Contact Add / Edit Modal State ──
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<SavedContactItem | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    tag: "",
    notes: "",
  });
  const [isSavingContact, setIsSavingContact] = useState(false);

  // ── Rename List Modal State ──
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTargetTag, setRenameTargetTag] = useState("");
  const [renameNewTag, setRenameNewTag] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // ── Delete List Modal State ──
  const [showDeleteListModal, setShowDeleteListModal] = useState(false);
  const [deleteTargetTag, setDeleteTargetTag] = useState("");
  const [isDeletingList, setIsDeletingList] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Fetch Summary Lists & Stats
  // ─────────────────────────────────────────────────────────────────────────────
  const loadListsAndStats = async () => {
    try {
      setLoadingLists(true);
      const [statsRes, listsRes] = await Promise.all([
        api.getSavedContactStats(),
        api.getContactListsSummary(),
      ]);
      setStats(statsRes);
      setLists(listsRes || []);
    } catch (err: any) {
      console.error("Failed to load contact lists:", err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    loadListsAndStats();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Load Contacts for Active List (Drill-Down)
  // ─────────────────────────────────────────────────────────────────────────────
  const loadActiveListContacts = async (tag: string, pageNum: number = 1) => {
    try {
      setLoadingContacts(true);
      const res = await api.getSavedContacts({
        tag: tag,
        q: contactSearchQuery,
        page: pageNum,
        page_size: contactPageSize,
      });
      setListContacts(res.items || []);
      setTotalContactCount(res.total || 0);
      setTotalContactPages(res.total_pages || 1);
      setContactPage(pageNum);
      setSelectedContactIds([]);
    } catch (err: any) {
      showToast(err.message || "Failed to load list contacts", "error");
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (activeListTag) {
      loadActiveListContacts(activeListTag, contactPage);
    }
  }, [activeListTag, contactPage, contactSearchQuery]);

  // Active list summary object
  const activeListSummary = useMemo(() => {
    if (!activeListTag) return null;
    return lists.find((l) => l.tag === activeListTag) || null;
  }, [lists, activeListTag]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Google Sheet Sync Handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSyncGoogleSheetList = async (tag: string, sheetUrl?: string | null) => {
    try {
      setSyncingTags((prev) => [...prev, tag]);
      showToast(`🔄 Auto-syncing "${tag}" from Google Sheet...`);
      const res = await api.syncContactList(tag, sheetUrl || undefined);
      showToast(
        `✓ Synced "${tag}": ${res.added} added, ${res.updated} updated (${res.total_contacts} total contacts)!`,
        "success"
      );
      await loadListsAndStats();
      if (activeListTag === tag) {
        await loadActiveListContacts(tag, contactPage);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to sync Google Sheet", "error");
    } finally {
      setSyncingTags((prev) => prev.filter((t) => t !== tag));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Filtered & Sorted Lists for Grid View
  // ─────────────────────────────────────────────────────────────────────────────
  const filteredLists = useMemo(() => {
    let result = [...lists];
    if (listSearchQuery.trim()) {
      const q = listSearchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.tag.toLowerCase().includes(q) ||
          l.sources.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (listSortBy === "updated") {
      result.sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return timeB - timeA;
      });
    } else if (listSortBy === "contacts") {
      result.sort((a, b) => b.total_contacts - a.total_contacts);
    } else if (listSortBy === "name") {
      result.sort((a, b) => a.tag.localeCompare(b.tag));
    }

    return result;
  }, [lists, listSearchQuery, listSortBy]);

  // ─────────────────────────────────────────────────────────────────────────────
  // File Parsing & Live Verification Engine
  // ─────────────────────────────────────────────────────────────────────────────
  const parseRawRows = (rawRows: any[], fallbackListName: string) => {
    setIsVerifying(true);
    const seenPhones = new Set<string>();
    const verified: ParsedContactPreview[] = [];

    rawRows.forEach((row, idx) => {
      // Intelligently find keys
      const keys = Object.keys(row);
      const nameKey = keys.find((k) => /name|contact|full.*name|person/i.test(k));
      const phoneKey = keys.find((k) => /phone|mobile|cell|num|tel|contact.*no/i.test(k));
      const emailKey = keys.find((k) => /email|mail|e-mail/i.test(k));

      const rawName = nameKey ? String(row[nameKey] || "").trim() : `Contact ${idx + 1}`;
      const rawPhone = phoneKey ? String(row[phoneKey] || "").trim() : "";
      const rawEmail = emailKey ? String(row[emailKey] || "").trim() : "";

      // Gather other fields as metadata
      const meta: Record<string, any> = {};
      keys.forEach((k) => {
        if (k !== nameKey && k !== phoneKey && k !== emailKey && row[k]) {
          meta[k] = row[k];
        }
      });

      const { formatted, isValid } = normalizePhoneNumber(rawPhone);
      const isEmailValid = isValidEmailAddress(rawEmail);
      const isDup = Boolean(formatted && seenPhones.has(formatted));
      if (formatted) seenPhones.add(formatted);

      verified.push({
        id: `row_${idx}_${Date.now()}`,
        name: rawName || `Contact ${idx + 1}`,
        phone: formatted,
        rawPhone: rawPhone,
        email: rawEmail,
        isValidPhone: isValid && !isDup,
        isValidEmail: isEmailValid,
        isDuplicate: isDup,
        metadata: meta,
      });
    });

    setWizardParsedRows(verified);
    if (!wizardListName.trim() && fallbackListName) {
      setWizardListName(fallbackListName);
    }
    setIsVerifying(false);
  };

  // Handle Excel / CSV File Selected
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setWizardFileName(file.name);
    setWizardFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const isCsv = file.name.endsWith(".csv");
    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parseRawRows(results.data, baseName);
        },
        error: (err) => {
          showToast(`CSV Parse Error: ${err.message}`, "error");
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          parseRawRows(jsonData, baseName);
        } catch (err: any) {
          showToast(`Excel Parse Error: ${err.message}`, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle Manual Text Parse
  const handleParseManualText = () => {
    if (!wizardManualText.trim()) {
      showToast("Please enter contact rows first.", "error");
      return;
    }

    const lines = wizardManualText.trim().split("\n");
    const rawRows = lines.map((line) => {
      const parts = line.split(/[,\t|]/).map((p) => p.trim());
      return {
        Name: parts[0] || "",
        Phone: parts[1] || "",
        Email: parts[2] || "",
      };
    });

    parseRawRows(rawRows, wizardListName || "Manual Paste List");
  };

  // Handle Google Sheet Load
  const handleLoadGoogleSheet = async () => {
    if (!wizardGoogleSheetUrl.trim()) {
      showToast("Please enter a Google Sheet URL.", "error");
      return;
    }

    const match = wizardGoogleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      showToast("Invalid Google Sheet link. Ensure it is a valid Google Docs link.", "error");
      return;
    }

    const sheetId = match[1];
    setSheetLoading(true);

    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) {
        throw new Error(
          "Could not fetch Google Sheet. Make sure 'General Access' is set to 'Anyone with the link can view'."
        );
      }
      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          parseRawRows(results.data, wizardListName || "Google Sheet Contacts");
          setSheetLoading(false);
        },
        error: (err: any) => {
          showToast(`Google Sheet Parse error: ${err.message}`, "error");
          setSheetLoading(false);
        },
      });
    } catch (err: any) {
      showToast(err.message || "Failed to load Google Sheet", "error");
      setSheetLoading(false);
    }
  };

  // Inline Verification Row Edit
  const handleUpdateVerificationRow = (id: string, field: "name" | "phone" | "email", val: string) => {
    setWizardParsedRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === "phone") {
          const { formatted, isValid } = normalizePhoneNumber(val);
          updated.phone = formatted;
          updated.isValidPhone = isValid;
        }
        if (field === "email") {
          updated.isValidEmail = isValidEmailAddress(val);
        }
        return updated;
      })
    );
  };

  // Delete Row from Verification Preview
  const handleDeleteVerificationRow = (id: string) => {
    setWizardParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Verification Stats
  const wizardStats = useMemo(() => {
    const total = wizardParsedRows.length;
    const validPhones = wizardParsedRows.filter((r) => r.isValidPhone).length;
    const validEmails = wizardParsedRows.filter((r) => r.isValidEmail).length;
    const invalidPhones = wizardParsedRows.filter((r) => !r.isValidPhone).length;
    const duplicates = wizardParsedRows.filter((r) => r.isDuplicate).length;
    return { total, validPhones, validEmails, invalidPhones, duplicates };
  }, [wizardParsedRows]);

  const filteredVerificationRows = useMemo(() => {
    if (wizardVerificationFilter === "valid") {
      return wizardParsedRows.filter((r) => r.isValidPhone);
    }
    if (wizardVerificationFilter === "invalid") {
      return wizardParsedRows.filter((r) => !r.isValidPhone);
    }
    return wizardParsedRows;
  }, [wizardParsedRows, wizardVerificationFilter]);

  // Save Verified List to Contact Book
  const handleSaveVerifiedList = async () => {
    const finalListName = (wizardListName || wizardFileName || "My Contact List").trim();
    if (!finalListName) {
      showToast("Please enter a list name", "error");
      return;
    }

    if (wizardParsedRows.length === 0) {
      showToast("No contacts to save. Please upload or enter contacts.", "error");
      return;
    }

    setIsSavingList(true);
    try {
      const payloadContacts = wizardParsedRows.map((r) => ({
        name: r.name,
        phone: r.phone || r.rawPhone,
        email: r.email || undefined,
        tag: finalListName,
        source:
          wizardTab === "file"
            ? "Excel/CSV Import"
            : wizardTab === "sheet"
            ? "Google Sheet"
            : "Manual Entry",
        metadata_fields: {
          ...(r.metadata || {}),
          ...(wizardTab === "sheet"
            ? {
                google_sheet_url: wizardGoogleSheetUrl.trim(),
                last_synced_at: new Date().toISOString(),
              }
            : {}),
        },
      }));

      const res = await api.batchCreateSavedContacts({
        contacts: payloadContacts,
        default_tag: finalListName,
        source:
          wizardTab === "file"
            ? "Excel/CSV Import"
            : wizardTab === "sheet"
            ? "Google Sheet"
            : "Manual Entry",
      });

      showToast(
        `✓ Saved "${finalListName}" with ${res.added} new and ${res.updated} updated contacts!`,
        "success"
      );

      // Close wizard & refresh
      setShowUploadWizard(false);
      setWizardParsedRows([]);
      setWizardListName("");
      setWizardFileName("");
      setWizardManualText("");
      setWizardGoogleSheetUrl("");
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to save list to Contact Book", "error");
    } finally {
      setIsSavingList(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Single Contact Add / Edit Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const openAddContactModal = (prefilledTag?: string) => {
    setEditingContact(null);
    setContactForm({
      name: "",
      phone: "",
      email: "",
      tag: prefilledTag || activeListTag || "General",
      notes: "",
    });
    setShowContactModal(true);
  };

  const openEditContactModal = (contact: SavedContactItem) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || "",
      tag: contact.tag || "General",
      notes: contact.notes || "",
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      showToast("Name and phone number are required.", "error");
      return;
    }

    setIsSavingContact(true);
    try {
      if (editingContact) {
        await api.updateSavedContact(editingContact.id, {
          name: contactForm.name.trim(),
          phone: contactForm.phone.trim(),
          email: contactForm.email.trim() || undefined,
          tag: contactForm.tag.trim() || "General",
          notes: contactForm.notes.trim() || undefined,
        });
        showToast("✓ Contact updated successfully");
      } else {
        await api.createSavedContact({
          name: contactForm.name.trim(),
          phone: contactForm.phone.trim(),
          email: contactForm.email.trim() || undefined,
          tag: contactForm.tag.trim() || "General",
          source: "Manual Entry",
          notes: contactForm.notes.trim() || undefined,
        });
        showToast("✓ Contact added to list");
      }

      setShowContactModal(false);
      if (activeListTag) {
        await loadActiveListContacts(activeListTag, contactPage);
      }
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to save contact", "error");
    } finally {
      setIsSavingContact(false);
    }
  };

  // Single Delete Contact
  const handleDeleteContact = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await api.deleteSavedContact(id);
      showToast("Contact deleted");
      if (activeListTag) {
        await loadActiveListContacts(activeListTag, contactPage);
      }
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to delete contact", "error");
    }
  };

  // Batch Delete Contacts
  const handleBatchDelete = async () => {
    if (selectedContactIds.length === 0) return;
    if (!confirm(`Delete ${selectedContactIds.length} selected contacts?`)) return;

    try {
      const res = await api.batchDeleteSavedContacts(selectedContactIds);
      showToast(`Deleted ${res.deleted_count} contacts`);
      setSelectedContactIds([]);
      if (activeListTag) {
        await loadActiveListContacts(activeListTag, contactPage);
      }
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to delete selected contacts", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Rename List Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const openRenameModal = (tag: string) => {
    setRenameTargetTag(tag);
    setRenameNewTag(tag);
    setShowRenameModal(true);
  };

  const handleExecuteRename = async () => {
    if (!renameNewTag.trim() || renameNewTag.trim() === renameTargetTag) {
      setShowRenameModal(false);
      return;
    }

    setIsRenaming(true);
    try {
      await api.renameContactList(renameTargetTag, renameNewTag.trim());
      showToast(`✓ Renamed "${renameTargetTag}" to "${renameNewTag.trim()}"`);
      setShowRenameModal(false);
      if (activeListTag === renameTargetTag) {
        setActiveListTag(renameNewTag.trim());
      }
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to rename list", "error");
    } finally {
      setIsRenaming(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Delete List Handlers
  // ─────────────────────────────────────────────────────────────────────────────
  const openDeleteListModal = (tag: string) => {
    setDeleteTargetTag(tag);
    setShowDeleteListModal(true);
  };

  const handleExecuteDeleteList = async () => {
    if (!deleteTargetTag) return;

    setIsDeletingList(true);
    try {
      await api.deleteContactList(deleteTargetTag);
      showToast(`Deleted list "${deleteTargetTag}" and its contacts.`);
      setShowDeleteListModal(false);
      if (activeListTag === deleteTargetTag) {
        setActiveListTag(null);
      }
      await loadListsAndStats();
    } catch (err: any) {
      showToast(err.message || "Failed to delete list", "error");
    } finally {
      setIsDeletingList(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Export List to CSV
  // ─────────────────────────────────────────────────────────────────────────────
  const handleExportListCSV = async (tag: string) => {
    try {
      showToast(`Exporting "${tag}"...`);
      const allContacts = await api.getAllSavedContacts(tag);
      if (allContacts.length === 0) {
        showToast("No contacts found in this list", "error");
        return;
      }

      const rows = allContacts.map((c) => ({
        Name: c.name,
        Phone: c.phone,
        Email: c.email || "",
        List_Name: c.tag || "",
        Source: c.source || "",
        Notes: c.notes || "",
        Created_At: c.created_at,
      }));

      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tag.replace(/[^a-zA-Z0-9_-]/g, "_")}_contacts.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Exported ${rows.length} contacts!`);
    } catch (err: any) {
      showToast(err.message || "Export failed", "error");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Cross-Channel Campaign Launch Navigation Helpers
  // ─────────────────────────────────────────────────────────────────────────────
  const launchCallCampaign = (tag: string) => {
    sessionStorage.setItem("callinggen_load_contact_tag", tag);
    router.push(`/call-manager?source=contacts_book&tag=${encodeURIComponent(tag)}`);
  };

  const launchWhatsAppBroadcast = (tag: string) => {
    router.push(`/whatsapp/send?source=contacts_book&tag=${encodeURIComponent(tag)}`);
  };

  const launchEmailCampaign = (tag: string) => {
    router.push(`/email-campaign/new?source=contacts_book&tag=${encodeURIComponent(tag)}`);
  };

  return (
    <DashboardShell title="Contacts Book">
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

      {/* ══════════════════════════════════════════════════════════════════════
          TOP STATS SUMMARY CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition hover:border-violet-300 dark:hover:border-violet-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Contact Lists
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
            {lists.length}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-400">Saved contact sets</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition hover:border-blue-300 dark:hover:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Contacts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
            {stats.total_contacts.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-400">Across all lists</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition hover:border-emerald-300 dark:hover:border-emerald-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Phone-Ready Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Phone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.valid_phones.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-400">Valid numbers for AI calls</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition hover:border-amber-300 dark:hover:border-amber-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Email-Ready Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {stats.with_email.toLocaleString()}
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-400">Ready for marketing campaigns</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: LIST CARDS GRID (PRIMARY VIEW)
      ══════════════════════════════════════════════════════════════════════ */}
      {!activeListTag && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BookUser className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Contact Lists & Audiences
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Click any list card to inspect contacts, edit details, or launch instant Voice, WhatsApp, and Email campaigns.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setWizardParsedRows([]);
                  setWizardListName("");
                  setWizardFileName("");
                  setWizardManualText("");
                  setWizardGoogleSheetUrl("");
                  setShowUploadWizard(true);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create / Import New List</span>
              </button>
            </div>
          </div>

          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                placeholder="Search contact lists by name or source..."
                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white font-medium"
              />
              {listSearchQuery && (
                <button
                  type="button"
                  onClick={() => setListSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={listSortBy}
                onChange={(e) => setListSortBy(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 outline-none focus:border-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
              >
                <option value="updated">Recently Updated</option>
                <option value="contacts">Most Contacts</option>
                <option value="name">List Name (A-Z)</option>
              </select>

              <button
                type="button"
                onClick={loadListsAndStats}
                disabled={loadingLists}
                className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition"
                title="Refresh Lists"
              >
                <RefreshCw className={`h-4 w-4 ${loadingLists ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loadingLists ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl border border-zinc-200 bg-white p-5 animate-pulse dark:border-zinc-800 dark:bg-zinc-900"
                />
              ))}
            </div>
          ) : filteredLists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <FolderPlus className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                No Contact Lists Found
              </h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                {listSearchQuery
                  ? "No contact lists match your search criteria. Try a different query."
                  : "You haven't saved any contact lists yet. Create your first list by uploading an Excel sheet, CSV, or pasting contacts!"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setWizardParsedRows([]);
                  setWizardListName("");
                  setWizardFileName("");
                  setWizardManualText("");
                  setWizardGoogleSheetUrl("");
                  setShowUploadWizard(true);
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 shadow-md transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create Your First Contact List</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLists.map((item) => {
                const isSyncing = syncingTags.includes(item.tag);
                return (
                  <div
                    key={item.tag}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-violet-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-600"
                  >
                    {/* Card Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                              item.is_google_sheet
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400"
                            } group-hover:scale-105`}
                          >
                            <Folder className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3
                              onClick={() => setActiveListTag(item.tag)}
                              className="text-sm font-bold text-zinc-900 dark:text-white truncate cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                              title={item.tag}
                            >
                              {item.tag}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {item.is_google_sheet && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Live Google Sheet
                                </span>
                              )}
                              {item.sources.map((s) => (
                                <span
                                  key={s}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card Options Menu */}
                        <div className="flex items-center gap-1">
                          {item.is_google_sheet && (
                            <button
                              type="button"
                              onClick={() => handleSyncGoogleSheetList(item.tag, item.source_url)}
                              disabled={isSyncing}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              title="Auto-sync from Google Sheet now"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openRenameModal(item.tag)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Rename list"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExportListCSV(item.tag)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Export list CSV"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteListModal(item.tag)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete list"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Stats in Card */}
                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50/80 p-2.5 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                        <div className="text-center">
                          <span className="block text-xs font-bold text-zinc-900 dark:text-white">
                            {item.total_contacts}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            Total
                          </span>
                        </div>
                        <div className="text-center border-x border-zinc-200/60 dark:border-zinc-700/60">
                          <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {item.valid_phones}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            Phones
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="block text-xs font-bold text-amber-600 dark:text-amber-400">
                            {item.with_email}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            Emails
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveListTag(item.tag)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 transition"
                      >
                        <span>View Contacts</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => launchCallCampaign(item.tag)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 transition"
                          title="Launch AI Voice Calls in Call Manager"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => launchWhatsAppBroadcast(item.tag)}
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/60 dark:text-green-400 transition"
                          title="Send WhatsApp Broadcast"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => launchEmailCampaign(item.tag)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 transition"
                          title="Send Email Campaign"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: LIST DRILL-DOWN / DETAIL VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeListTag && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Breadcrumb & List Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            <div>
              <button
                type="button"
                onClick={() => setActiveListTag(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition mb-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to All Contact Lists
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Folder className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  {activeListTag}
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                  {totalContactCount} Contacts
                </span>
                {activeListSummary?.is_google_sheet && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Google Sheet
                  </span>
                )}
              </div>
            </div>

            {/* Top Action Buttons for this List */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {activeListSummary?.is_google_sheet && (
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheetList(activeListTag, activeListSummary.source_url)}
                  disabled={syncingTags.includes(activeListTag)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncingTags.includes(activeListTag) ? "animate-spin" : ""}`} />
                  <span>Sync Google Sheet</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => openAddContactModal(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Contact</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportListCSV(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => openRenameModal(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 transition"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Rename</span>
              </button>

              <button
                type="button"
                onClick={() => openDeleteListModal(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete List</span>
              </button>
            </div>
          </div>

          {/* Live Google Sheet Linked Banner */}
          {activeListSummary?.is_google_sheet && activeListSummary?.source_url && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Globe className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Live Google Sheet Linked • Auto-Sync Active
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Any rows added or modified in your Google Sheet will auto-sync seamlessly into this list.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeListSummary.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-50 dark:bg-zinc-900 dark:text-emerald-300 dark:border-emerald-800 transition"
                >
                  <span>Open in Google Drive</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Quick Launch Call / WhatsApp / Email Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Launch Campaigns with this list:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => launchCallCampaign(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Start AI Voice Calls</span>
              </button>

              <button
                type="button"
                onClick={() => launchWhatsAppBroadcast(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Send WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => launchEmailCampaign(activeListTag)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>

          {/* Search, Batch Selection, and Contacts Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {/* Table Control Bar */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder={`Search within "${activeListTag}"...`}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pl-10 pr-4 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {selectedContactIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {selectedContactIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleBatchDelete}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={
                          listContacts.length > 0 &&
                          selectedContactIds.length === listContacts.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContactIds(listContacts.map((c) => c.id));
                          } else {
                            setSelectedContactIds([]);
                          }
                        }}
                        className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                      />
                    </th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Source</th>
                    <th className="p-3.5">Calls Made</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {loadingContacts ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-violet-500" />
                        Loading contacts...
                      </td>
                    </tr>
                  ) : listContacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-400">
                        No contacts found in this list.
                      </td>
                    </tr>
                  ) : (
                    listContacts.map((c) => {
                      const isSelected = selectedContactIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition ${
                            isSelected ? "bg-violet-50/40 dark:bg-violet-950/20" : ""
                          }`}
                        >
                          <td className="p-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedContactIds((prev) => [...prev, c.id]);
                                } else {
                                  setSelectedContactIds((prev) =>
                                    prev.filter((id) => id !== c.id)
                                  );
                                }
                              }}
                              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                          </td>
                          <td className="p-3.5 font-bold text-zinc-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {c.phone}
                            </span>
                          </td>
                          <td className="p-3.5 text-zinc-500 dark:text-zinc-400">
                            {c.email ? (
                              <span className="text-zinc-800 dark:text-zinc-200">
                                {c.email}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic">—</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {c.source || "Manual"}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {c.call_count}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditContactModal(c)}
                                className="p-1.5 text-zinc-400 hover:text-violet-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title="Edit contact"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(c.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                                title="Delete contact"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalContactPages > 1 && (
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Showing {listContacts.length} of {totalContactCount} contacts
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={contactPage <= 1}
                    onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-semibold text-zinc-800 dark:text-zinc-200">
                    {contactPage} / {totalContactPages}
                  </span>
                  <button
                    type="button"
                    disabled={contactPage >= totalContactPages}
                    onClick={() => setContactPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          UPLOAD & IN-LINE VERIFICATION MODAL WIZARD
      ══════════════════════════════════════════════════════════════════════ */}
      {showUploadWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Upload className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Create & Import Contact List (With Live Verification)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Upload contacts, verify numbers in the table preview below, and save as a reusable list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadWizard(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* Step 1: List Name & Import Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact List Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wizardListName}
                    onChange={(e) => setWizardListName(e.target.value)}
                    placeholder="e.g. Bangalore Real Estate Leads, VIP Buyers"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 font-semibold outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <p className="mt-1 text-[10px] text-zinc-400">
                    This will be the title shown on the List Card.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Import Method
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => setWizardTab("file")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        wizardTab === "file"
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      Excel / CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardTab("manual")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        wizardTab === "manual"
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardTab("sheet")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                        wizardTab === "sheet"
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      Google Sheet (Auto-Sync)
                    </button>
                  </div>
                </div>
              </div>

              {/* Source-specific Input */}
              {wizardTab === "file" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/60 transition cursor-pointer text-center"
                  >
                    <FileSpreadsheet className="h-8 w-8 text-violet-500 mb-2" />
                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {wizardFileName
                        ? `Selected: ${wizardFileName} (${wizardFileSize})`
                        : "Click to Browse or Drag & Drop Excel (.xlsx, .xls) / CSV"}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Columns automatically mapped: Name, Phone/Mobile, Email
                    </p>
                  </div>
                </div>
              )}

              {wizardTab === "manual" && (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={wizardManualText}
                    onChange={(e) => setWizardManualText(e.target.value)}
                    placeholder="Enter contacts (one per line): Name, Phone, Email&#10;e.g. John Doe, 9876543210, john@example.com&#10;Priya Sharma, 919876543210, priya@gmail.com"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 font-mono outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleParseManualText}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white px-3.5 py-1.5 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    <span>Parse Contacts</span>
                  </button>
                </div>
              )}

              {wizardTab === "sheet" && (
                <div className="space-y-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Automated Live Sync Enabled</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        When you connect a Google Sheet, our platform automatically syncs changes in the background. Whenever someone adds new rows or edits contact names in your Google Sheet, it updates here automatically!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={wizardGoogleSheetUrl}
                      onChange={(e) => setWizardGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleLoadGoogleSheet}
                      disabled={sheetLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50"
                    >
                      {sheetLoading ? "Loading..." : "Fetch & Verify"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: In-line Verification Table Section */}
              {wizardParsedRows.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Verification Preview
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {wizardStats.total} Rows
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ✓ {wizardStats.validPhones} Valid Phones
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                        ✉ {wizardStats.validEmails} With Email
                      </span>
                      {wizardStats.invalidPhones > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          ⚠ {wizardStats.invalidPhones} Invalid
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWizardVerificationFilter("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          wizardVerificationFilter === "all"
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        All ({wizardStats.total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardVerificationFilter("valid")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          wizardVerificationFilter === "valid"
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        Valid ({wizardStats.validPhones})
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardVerificationFilter("invalid")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          wizardVerificationFilter === "invalid"
                            ? "bg-red-600 text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        Invalid ({wizardStats.invalidPhones})
                      </button>
                    </div>
                  </div>

                  {/* Verification Scrollable Table */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700 text-zinc-500 font-semibold sticky top-0">
                        <tr>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Phone Number</th>
                          <th className="p-2.5">Email</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredVerificationRows.map((r) => (
                          <tr
                            key={r.id}
                            className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                              !r.isValidPhone ? "bg-red-50/40 dark:bg-red-950/20" : ""
                            }`}
                          >
                            <td className="p-2.5">
                              {r.isValidPhone ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Invalid Phone
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={r.name}
                                onChange={(e) =>
                                  handleUpdateVerificationRow(r.id, "name", e.target.value)
                                }
                                className="w-full rounded border border-transparent hover:border-zinc-300 focus:border-violet-500 px-1.5 py-0.5 bg-transparent font-medium"
                              />
                            </td>
                            <td className="p-2.5 font-mono">
                              <input
                                type="text"
                                value={r.phone}
                                onChange={(e) =>
                                  handleUpdateVerificationRow(r.id, "phone", e.target.value)
                                }
                                className="w-full rounded border border-transparent hover:border-zinc-300 focus:border-violet-500 px-1.5 py-0.5 bg-transparent"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={r.email}
                                onChange={(e) =>
                                  handleUpdateVerificationRow(r.id, "email", e.target.value)
                                }
                                placeholder="optional"
                                className="w-full rounded border border-transparent hover:border-zinc-300 focus:border-violet-500 px-1.5 py-0.5 bg-transparent"
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteVerificationRow(r.id)}
                                className="text-zinc-400 hover:text-red-600 p-1"
                                title="Remove row"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {wizardParsedRows.length > 0
                  ? `Ready to save ${wizardStats.total} contacts into "${
                      wizardListName || wizardFileName || "New List"
                    }"`
                  : "Please import contacts to verify."}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadWizard(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveVerifiedList}
                  disabled={wizardParsedRows.length === 0 || isSavingList}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isSavingList ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Verify & Save Contact List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SINGLE CONTACT ADD / EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 font-mono outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="e.g. rajesh@company.com"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Contact List / Tag
                </label>
                <input
                  type="text"
                  value={contactForm.tag}
                  onChange={(e) => setContactForm({ ...contactForm, tag: e.target.value })}
                  placeholder="e.g. VIP Clients"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="Additional context or notes..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContact}
                disabled={isSavingContact}
                className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-sm transition disabled:opacity-50"
              >
                {isSavingContact ? "Saving..." : editingContact ? "Update Contact" : "Add Contact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RENAME LIST MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-violet-600" />
              Rename Contact List
            </h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">
                New List Name
              </label>
              <input
                type="text"
                value={renameNewTag}
                onChange={(e) => setRenameNewTag(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 font-bold outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRename}
                disabled={isRenaming}
                className="rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-violet-700 shadow-sm"
              >
                {isRenaming ? "Renaming..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE LIST CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showDeleteListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Delete Contact List?
                </h3>
                <p className="text-xs text-zinc-500">
                  This will remove list <strong>&ldquo;{deleteTargetTag}&rdquo;</strong> and all contacts stored under it.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteListModal(false)}
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteList}
                disabled={isDeletingList}
                className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                {isDeletingList ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
