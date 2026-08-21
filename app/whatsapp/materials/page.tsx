"use client";

import { useState, useEffect, useRef } from "react";
import DashboardShell from "@/components/DashboardShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Edit3,
  Send,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Tag,
  Clock,
  ArrowRight,
  Filter,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useCredits } from "@/components/CreditsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface MaterialItem {
  id: number;
  title: string;
  type: "text" | "image" | "document";
  content?: string;
  file_path?: string;
  file_url?: string;
  mime_type?: string;
  file_size?: number;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export default function MaterialBasePage() {
  const { isLoggedIn, user } = useAuth();
  const token = user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");
  const { credits } = useCredits();
  const router = useRouter();

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "text" | "image" | "document">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<"text" | "image" | "document">("text");
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/whatsapp/materials`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load materials:", err);
      showToast("Failed to load Material Base items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [token]);

  // Format bytes
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchesTab = activeTab === "all" || m.type === activeTab;
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.tags && m.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const countByType = (type: string) => materials.filter((m) => m.type === type).length;

  // Insert placeholder pill into text content
  const insertPlaceholder = (ph: string) => {
    setFormContent((prev) => prev + ph);
  };

  // Reset form
  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setFormFile(null);
    setFilePreview(null);
    setEditingMaterial(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle open add modal
  const handleOpenAdd = (type: "text" | "image" | "document") => {
    resetForm();
    setModalType(type);
    setShowAddModal(true);
  };

  // Handle open edit
  const handleOpenEdit = (material: MaterialItem) => {
    setEditingMaterial(material);
    setFormTitle(material.title);
    setFormContent(material.content || "");
    setFormTags(material.tags || "");
    setModalType(material.type);
    setShowAddModal(true);
  };

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormFile(file);
      if (modalType === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      if (!formTitle.trim()) {
        setFormTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  // Handle form submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Please enter a title", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const authToken = token || localStorage.getItem("token") || "";

      if (editingMaterial) {
        // Update existing text material
        const res = await fetch(`${BASE_URL}/api/whatsapp/materials/${editingMaterial.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent,
            tags: formTags.trim(),
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to update material");
        }

        showToast("Material updated successfully");
      } else {
        // Create new material
        if (modalType === "text") {
          if (!formContent.trim()) {
            showToast("Message content cannot be empty", "error");
            setIsSubmitting(false);
            return;
          }

          const res = await fetch(`${BASE_URL}/api/whatsapp/materials`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              title: formTitle.trim(),
              content: formContent.trim(),
              tags: formTags.trim(),
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to create text template");
          }

          showToast("Text template created successfully");
        } else {
          // Upload Image / Document
          if (!formFile) {
            showToast(`Please select a ${modalType} file to upload`, "error");
            setIsSubmitting(false);
            return;
          }

          const formData = new FormData();
          formData.append("file", formFile);
          formData.append("title", formTitle.trim());
          formData.append("type", modalType);
          if (formTags.trim()) formData.append("tags", formTags.trim());

          const res = await fetch(`${BASE_URL}/api/whatsapp/materials/upload`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Failed to upload file");
          }

          showToast(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} uploaded successfully`);
        }
      }

      setShowAddModal(false);
      resetForm();
      fetchMaterials();
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    try {
      const authToken = token || localStorage.getItem("token") || "";
      const res = await fetch(`${BASE_URL}/api/whatsapp/materials/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        showToast("Material deleted successfully");
      } else {
        showToast("Failed to delete material", "error");
      }
    } catch (err) {
      showToast("Error deleting material", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Use material in Send Message
  const handleUseMaterial = (material: MaterialItem) => {
    router.push(`/whatsapp/send?useMaterial=${material.id}`);
  };

  return (
    <DashboardShell title="Material Base">
      {/* Toast Notification */}
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
            className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
          >
            <Send className="h-3.5 w-3.5" />
            Send Message
          </Link>
          <Link
            href="/whatsapp/materials"
            className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 dark:text-white shadow-sm transition"
          >
            <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            Material Base
          </Link>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition"
              onClick={() => handleOpenAdd("text")}
            >
              <Plus className="h-4 w-4" />
              Add Material
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Header / Intro ── */}
      <div className="mb-6 rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/30 p-5 dark:border-violet-900/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-violet-950/20 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-500/30">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Reusable Material Library</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Create and manage reusable text templates, high-res images, and business documents (PDFs, pricing brochures) for quick WhatsApp sending.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleOpenAdd("text")}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              <FileText className="h-3.5 w-3.5 text-violet-500" />
              + Text
            </button>
            <button
              onClick={() => handleOpenAdd("image")}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              + Image
            </button>
            <button
              onClick={() => handleOpenAdd("document")}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500" />
              + Document
            </button>
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Type tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "all"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            All Materials
            <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-semibold">
              {materials.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("text")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "text"
                ? "bg-violet-600 text-white shadow-sm shadow-violet-500/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Text
            <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-semibold">
              {countByType("text")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "image"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Images
            <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-semibold">
              {countByType("image")}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("document")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              activeTab === "document"
                ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Documents
            <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px] font-semibold">
              {countByType("document")}
            </span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-1.5 pl-9 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* ── Materials Grid ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            <p className="text-xs text-zinc-500">Loading Material Base...</p>
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">No materials found</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm">
            {searchQuery
              ? `No materials matching "${searchQuery}". Try adjusting your search or filter.`
              : "Your Material Base is empty. Create reusable text messages, images, or documents to get started."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd("text")}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Text Template
            </button>
            <button
              onClick={() => handleOpenAdd("document")}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload PDF
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4.5 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
            >
              <div>
                {/* Header: Type Badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.type === "text" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
                        <FileText className="h-3 w-3" /> Text
                      </span>
                    )}
                    {item.type === "image" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                        <ImageIcon className="h-3 w-3" /> Image
                      </span>
                    )}
                    {item.type === "document" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
                        <FileSpreadsheet className="h-3 w-3" /> Document
                      </span>
                    )}

                    {item.tags && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        <Tag className="h-2.5 w-2.5" /> {item.tags}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    {item.type === "text" && (
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
                        title="Edit Text"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition"
                      title="Delete Material"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">
                  {item.title}
                </h4>

                {/* Preview Content */}
                {item.type === "text" && item.content && (
                  <div className="mt-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800/80 dark:bg-zinc-950/50 dark:text-zinc-400">
                    <p className="line-clamp-4 whitespace-pre-wrap">{item.content}</p>
                  </div>
                )}

                {item.type === "image" && item.file_url && (
                  <div className="mt-2.5 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="relative aspect-video w-full">
                      <img
                        src={`${BASE_URL}${item.file_url}`}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/600x400/27272a/ffffff?text=Image+Preview";
                        }}
                      />
                    </div>
                  </div>
                )}

                {item.type === "document" && (
                  <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-amber-200/50 bg-amber-50/30 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.file_path ? item.file_path.split(/[\\/]/).pop() : "document.pdf"}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {formatFileSize(item.file_size)} • {item.mime_type || "PDF Document"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Meta & Action */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                  {item.file_size ? <span>• {formatFileSize(item.file_size)}</span> : null}
                </div>

                <button
                  onClick={() => handleUseMaterial(item)}
                  className="flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950/60 dark:text-violet-300 dark:hover:bg-violet-900/80 transition"
                >
                  Use <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          ADD / EDIT MATERIAL MODAL
      ══════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white">
                  {modalType === "text" ? (
                    <FileText className="h-4 w-4" />
                  ) : modalType === "image" ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {editingMaterial
                    ? "Edit Text Material"
                    : `Add New ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Material`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type selector tabs (if creating new) */}
            {!editingMaterial && (
              <div className="mt-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalType("text");
                    resetForm();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    modalType === "text"
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType("image");
                    resetForm();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    modalType === "image"
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType("document");
                    resetForm();
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                    modalType === "document"
                      ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Document
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={
                    modalType === "text"
                      ? "e.g. Interested Lead Follow-up"
                      : modalType === "image"
                      ? "e.g. Real Estate Project Brochure Banner"
                      : "e.g. 2026 Company Services Pricing.pdf"
                  }
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                />
              </div>

              {/* Text Content */}
              {modalType === "text" && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Message Content <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400">Placeholders:</span>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder("{{name}}")}
                        className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-200 transition"
                      >
                        + {"{{name}}"}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertPlaceholder("{{customer_name}}")}
                        className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-200 transition"
                      >
                        + {"{{customer_name}}"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Hi {{name}}, thank you for speaking with us today regarding our services..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    required
                  />
                  <p className="mt-1 text-[10px] text-zinc-400">
                    Placeholders like {"{{name}}"} will automatically be replaced with each contact's name when sending.
                  </p>
                </div>
              )}

              {/* File Upload for Image / Document */}
              {modalType !== "text" && !editingMaterial && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Select {modalType === "image" ? "Image File" : "Document File"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center hover:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/50 transition"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={
                        modalType === "image"
                          ? "image/png,image/jpeg,image/webp,image/gif"
                          : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      }
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {filePreview ? (
                      <div className="relative aspect-video w-48 overflow-hidden rounded-lg">
                        <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    ) : formFile ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {formFile.name} ({formatFileSize(formFile.size)})
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-zinc-400" />
                        <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Click to browse or drag & drop file
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          {modalType === "image"
                            ? "PNG, JPG, JPEG, WEBP up to 25MB"
                            : "PDF, DOCX, XLSX, PPTX up to 25MB"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tags / Category <span className="text-zinc-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Real Estate, Follow-up, Pricing"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : editingMaterial ? (
                    "Save Changes"
                  ) : (
                    "Create Material"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════ */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Delete Material</h4>
                <p className="text-xs text-zinc-500">Are you sure you want to delete this material?</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
