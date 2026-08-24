"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  Tag,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface MaterialItem {
  id: number;
  title: string;
  type: "text" | "image" | "document";
  content?: string;
  file_path?: string;
  file_url?: string;
  mime_type?: string;
  file_size?: number;
  tags?: string;
  created_at?: string;
  updated_at?: string;
}

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (material: MaterialItem) => void;
  initialType?: "text" | "image" | "document";
  editingMaterial?: MaterialItem | null;
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = "text",
  editingMaterial = null,
}: AddMaterialModalProps) {
  const { user } = useAuth();
  const token = user?.token || (typeof window !== "undefined" ? localStorage.getItem("token") || "" : "");

  const [modalType, setModalType] = useState<"text" | "image" | "document">(
    editingMaterial ? editingMaterial.type : initialType
  );
  const [formTitle, setFormTitle] = useState(editingMaterial?.title || "");
  const [formContent, setFormContent] = useState(editingMaterial?.content || "");
  const [formTags, setFormTags] = useState(editingMaterial?.tags || "");
  const [saveToBase, setSaveToBase] = useState(true);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(editingMaterial?.file_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (25MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`File size exceeds 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      return;
    }

    // Validate extension
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const allowedImages = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const allowedDocs = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"];

    if (modalType === "image" && !allowedImages.includes(ext)) {
      setErrorMsg("Please upload a valid image (.png, .jpg, .jpeg, .webp, .gif)");
      return;
    }

    if (modalType === "document" && !allowedDocs.includes(ext)) {
      setErrorMsg("Please upload a valid document (.pdf, .doc, .docx, .xls, .xlsx, .csv)");
      return;
    }

    setFormFile(file);
    if (modalType === "image") {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formTitle.trim()) {
      setErrorMsg("Please enter a title for the material.");
      return;
    }

    if (modalType === "text" && !formContent.trim()) {
      setErrorMsg("Please provide text content or placeholders (e.g. {{name}}).");
      return;
    }

    if (!editingMaterial && modalType !== "text" && !formFile) {
      setErrorMsg(`Please select a ${modalType} file to upload.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const authToken = `Bearer ${token || localStorage.getItem("token") || ""}`;

      if (modalType === "text") {
        if (editingMaterial) {
          const res = await fetch(`${BASE_URL}/api/whatsapp/materials/${editingMaterial.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken,
            },
            body: JSON.stringify({
              title: formTitle.trim(),
              content: formContent.trim(),
              tags: formTags.trim() || undefined,
            }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          onSuccess(data);
        } else {
          const res = await fetch(`${BASE_URL}/api/whatsapp/materials`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken,
            },
            body: JSON.stringify({
              title: formTitle.trim(),
              content: formContent.trim(),
              tags: formTags.trim() || undefined,
              save_to_base: saveToBase,
            }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          onSuccess(data?.material || data);
        }
      } else {
        // Upload File (Image or Document)
        const formData = new FormData();
        formData.append("title", formTitle.trim());
        formData.append("type", modalType);
        formData.append("save_to_base", String(saveToBase));
        if (formFile) {
          formData.append("file", formFile);
        }
        if (formTags.trim()) {
          formData.append("tags", formTags.trim());
        }

        const res = await fetch(`${BASE_URL}/api/whatsapp/materials/upload`, {
          method: "POST",
          headers: {
            Authorization: authToken,
          },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: "Upload failed" }));
          throw new Error(errData.detail || "Failed to upload file");
        }

        const data = await res.json();
        onSuccess(data?.material || data);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to save material:", err);
      setErrorMsg(err.message || "Failed to save material. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
                ? "Edit Material"
                : `Add New ${modalType.charAt(0).toUpperCase() + modalType.slice(1)} Material`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Type Selector (if creating new) */}
        {!editingMaterial && (
          <div className="mt-4 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setModalType("text");
                setErrorMsg(null);
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
                setErrorMsg(null);
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
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition ${
                modalType === "document"
                  ? "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Document / PDF
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
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
                  ? "e.g. Product Banner Flyer"
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
                <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 font-medium">
                  <Sparkles className="h-3 w-3" /> Variables Supported
                </div>
              </div>
              <textarea
                rows={5}
                placeholder="Hi {{name}}, thank you for taking the call! Here is the information regarding {{campaign_name}} you requested..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-sans"
                required
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["{{name}}", "{{phone}}", "{{campaign_name}}", "{{appointment_date}}", "{{appointment_time}}"].map(
                  (placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => setFormContent((prev) => `${prev} ${placeholder}`)}
                      className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 hover:bg-violet-50 hover:text-violet-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition"
                    >
                      +{placeholder}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* File Upload (Image or Document) */}
          {modalType !== "text" && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {modalType === "image" ? "Upload Image (Max 25 MB)" : "Upload Document / PDF / Excel (Max 25 MB)"}{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={
                  modalType === "image"
                    ? "image/png,image/jpeg,image/webp,image/gif"
                    : ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                }
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-5 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-50/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-violet-500 transition"
              >
                {formFile ? (
                  <div className="flex flex-col items-center gap-1.5">
                    {modalType === "image" && filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="h-20 w-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                    )}
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate max-w-xs">
                      {formFile.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {(formFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      <Upload className="h-4 w-4" />
                    </div>
                    <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Click to browse or drop file here
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {modalType === "image"
                        ? "PNG, JPG, JPEG, WEBP, GIF (Up to 25 MB)"
                        : "PDF, Word, Excel, CSV, PPT (Up to 25 MB)"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tags / Category (Optional)
            </label>
            <div className="relative mt-1">
              <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="e.g. Sales, Real Estate, Pricing, Follow-up"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Save to Material Base Toggle */}
          {!editingMaterial && (
            <div className="flex items-center justify-between rounded-xl bg-violet-50/70 p-3 border border-violet-200/80 dark:bg-violet-950/30 dark:border-violet-900/50">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                  Save to Material Base
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {saveToBase
                    ? "Material will be saved to your reusable library."
                    : "Attach only to this campaign without saving to library."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSaveToBase(!saveToBase)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  saveToBase ? "bg-violet-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    saveToBase ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          {/* Submit Actions */}
          <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {saveToBase ? "Saving to Material Base..." : "Uploading Material..."}
                </>
              ) : editingMaterial ? (
                "Save Changes"
              ) : saveToBase ? (
                "Save & Attach Material"
              ) : (
                "Attach Material (Single Use)"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
