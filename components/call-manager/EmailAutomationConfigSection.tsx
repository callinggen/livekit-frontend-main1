"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse text-zinc-400 text-xs">
      Loading Studio Editor...
    </div>
  ),
});

import {
  Mail,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Filter,
  Loader2,
  FileText,
  Eye,
  AlertCircle,
  ExternalLink,
  Lock,
  Zap,
  Sparkles,
  LayoutTemplate,
  Smartphone,
  Laptop,
  Search,
  X,
  Palette,
  Image as ImageIcon,
  MousePointerClick,
  Share2,
  Minus,
  Heading,
  PenTool,
  Type,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { api, EmailMarketingTemplate } from "@/lib/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:8000");

// ── Types ──────────────────────────────────────────────────────────────────

export interface EmailAutomationRule {
  id: string;
  call_type_filters: string[];
  ai_class_filters: string[];
  response_filters: string[];
  status_filters: string[];
  template_id: string;
  custom_subject: string;
  custom_body: string;
  enabled: boolean;
}

export interface EmailAutomationConfig {
  enabled: boolean;
  rules: EmailAutomationRule[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
}

export interface EmailBrandingOptions {
  headerType: "logo" | "text" | "none";
  logoUrl: string;
  headerTitle: string;
  headerSubtitle: string;
  headerAlign?: "left" | "center" | "right";
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
    whatsapp?: string;
  };
  showSocial: boolean;
  companyFooter: string;
}

// ── Client-side Image Optimizer (Target 20KB - 100KB) ─────────────────────
function compressImageToSizeRange(
  file: File,
  minKB = 20,
  maxKB = 100
): Promise<{ dataUrl: string; sizeKB: number; originalKB: number; statusMsg: string }> {
  return new Promise((resolve) => {
    const originalKB = Math.round(file.size / 1024);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 900;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const rawKB = Math.round(((e.target?.result as string).length * 0.75) / 1024);
          resolve({
            dataUrl: e.target?.result as string,
            sizeKB: rawKB,
            originalKB,
            statusMsg: `${rawKB} KB`,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        let sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);

        if (sizeKB > maxKB) {
          quality = 0.65;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        }
        if (sizeKB > maxKB) {
          quality = 0.45;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
        }

        let statusMsg = `${sizeKB} KB (Optimized)`;
        resolve({ dataUrl, sizeKB, originalKB, statusMsg });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Plain text token resolver for preview ──────────────────────────────────
function resolveTextTokens(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{name\}\}/gi, "Alex Johnson")
    .replace(/\{\{customer_name\}\}/gi, "Alex Johnson")
    .replace(/\{\{company\}\}/gi, "GenX Reality")
    .replace(/\{\{campaign_name\}\}/gi, "Voice Support & Outreach")
    .replace(/\{\{phone\}\}/gi, "+1 (555) 349-2910")
    .replace(/\{\{appointment_date\}\}/gi, "Tomorrow")
    .replace(/\{\{appointment_time\}\}/gi, "3:00 PM EST");
}

// ── Full HTML Document Formatter ───────────────────────────────────────────
function formatEmailDocumentHtml(
  bodyHtml: string,
  branding?: Partial<EmailBrandingOptions>
): string {
  if (!bodyHtml) return "";
  const resolved = resolveTextTokens(bodyHtml);

  if (resolved.includes("<!DOCTYPE") || resolved.includes("<html")) {
    return resolved;
  }

  const logoUrl = branding?.logoUrl ?? "";
  const headerTitle = branding?.headerTitle || "GenX Reality";
  const headerSubtitle = branding?.headerSubtitle || "AI Voice & Automation Platform";
  const headerAlign = branding?.headerAlign || "center";
  const companyFooter = branding?.companyFooter || branding?.headerTitle || "GenX Reality";
  const social = branding?.socialLinks || {};

  const alignStyle =
    headerAlign === "left"
      ? "text-align: left;"
      : headerAlign === "right"
      ? "text-align: right;"
      : "text-align: center;";

  const socialIcons: string[] = [];
  if (social.website) {
    socialIcons.push(`<a href="${social.website}" target="_blank" style="display: inline-block; margin: 0 4px; padding: 4px 8px; border-radius: 6px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600;">Website</a>`);
  }
  if (social.linkedin) {
    socialIcons.push(`<a href="${social.linkedin}" target="_blank" style="display: inline-block; margin: 0 4px; padding: 4px 8px; border-radius: 6px; background: #0077b5; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600;">LinkedIn</a>`);
  }
  if (social.twitter) {
    socialIcons.push(`<a href="${social.twitter}" target="_blank" style="display: inline-block; margin: 0 4px; padding: 4px 8px; border-radius: 6px; background: #0f1419; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 600;">X (Twitter)</a>`);
  }

  const socialBarHtml =
    socialIcons.length > 0
      ? `<div style="margin-top: 14px; text-align: center;">${socialIcons.join(" ")}</div>`
      : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
      <!-- Header -->
      <div style="background: #ffffff; padding: 24px 28px 18px 28px; border-bottom: 2px solid #2563eb; ${alignStyle}">
        ${
          logoUrl
            ? `<img src="${logoUrl}" alt="${headerTitle}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: inline-block; margin-bottom: 6px;" />`
            : `<div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">${headerTitle}</div>`
        }
        ${
          headerSubtitle
            ? `<div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 2px;">${headerSubtitle}</div>`
            : ""
        }
      </div>

      <!-- Body Content -->
      <div style="padding: 28px 28px 22px 28px; font-size: 14px; color: #334155; line-height: 1.65;" class="email-body-content">
        ${resolved}
      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; padding: 18px 28px; border-top: 1px solid #f1f5f9; text-align: center;">
        <div style="font-size: 11.5px; color: #64748b; font-weight: 600;">
          &copy; 2026 ${companyFooter}. All rights reserved.
        </div>
        ${socialBarHtml}
        <div style="margin-top: 8px; font-size: 10px; color: #94a3b8;">
          Sent automatically following your recent call &bull; <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
        </div>
      </div>
    </div>
  `;
}

// ── Filter definitions ─────────────────────────────────────────────────────

const FILTER_DEFINITIONS = {
  call_type: {
    label: "CALL TYPE",
    allLabel: "All Types",
    options: [
      { label: "Outbound", value: "Outbound" },
      { label: "Inbound", value: "Inbound" },
    ],
  },
  ai_class: {
    label: "AI CLASS",
    allLabel: "All Classes",
    options: [
      { label: "Interested", value: "Interested" },
      { label: "Hot Lead", value: "Hot Lead" },
      { label: "Warm Lead", value: "Warm Lead" },
      { label: "Cold Lead", value: "Cold Lead" },
      { label: "Callback", value: "Callback" },
      { label: "Appointment", value: "Appointment" },
    ],
  },
  response: {
    label: "RESPONSE",
    allLabel: "All Responses",
    options: [
      { label: "Answered", value: "Answered" },
      { label: "Not Answered", value: "Not Answered" },
      { label: "Appointment Booked", value: "Appointment Booked" },
      { label: "Callback", value: "Callback" },
      { label: "Declined", value: "Declined" },
      { label: "Cut/Disconnected", value: "Cut/Disconnected" },
    ],
  },
  status: {
    label: "STATUS",
    allLabel: "All Status",
    options: [
      { label: "Completed", value: "Completed" },
      { label: "Failed", value: "Failed" },
      { label: "In Progress", value: "In Progress" },
    ],
  },
};

// ── MultiSelectDropdown ───────────────────────────────────────────────────

interface MultiSelectDropdownProps {
  label: string;
  allLabel: string;
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

function MultiSelectDropdown({
  label,
  allLabel,
  options,
  selectedValues,
  onChange,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isAllSelected =
    !selectedValues ||
    selectedValues.length === 0 ||
    selectedValues.includes("all") ||
    selectedValues.includes(allLabel);

  const displayLabel = useMemo(() => {
    if (isAllSelected) return allLabel;
    if (selectedValues.length === 1) {
      const match = options.find((o) => o.value === selectedValues[0]);
      return match ? match.label : selectedValues[0];
    }
    return `${selectedValues[0]} (+${selectedValues.length - 1})`;
  }, [isAllSelected, selectedValues, allLabel, options]);

  const toggleOption = (val: string) => {
    if (val === "all" || val === allLabel) {
      onChange([]);
      return;
    }
    const current = isAllSelected ? [] : [...selectedValues];
    const exists = current.includes(val);
    onChange(exists ? current.filter((v) => v !== val) : [...current, val]);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[120px] flex-1 relative" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:border-blue-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition disabled:opacity-50 shadow-2xs"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[100%] left-0 z-30 mt-1 w-full min-w-[160px] rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in-50 zoom-in-95 duration-150">
          <button
            type="button"
            onClick={() => toggleOption("all")}
            className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {}}
              className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
            />
            <span className="truncate font-semibold">{allLabel}</span>
          </button>
          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
          {options.map((opt) => {
            const isChecked = !isAllSelected && selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                  isChecked
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored =
    sessionStorage.getItem("callinggen-auth") ||
    localStorage.getItem("callinggen-auth");
  if (stored) {
    try {
      return JSON.parse(stored)?.token || null;
    } catch {
      return localStorage.getItem("token") || null;
    }
  }
  return localStorage.getItem("token") || null;
}

function makeDefaultRule(): EmailAutomationRule {
  return {
    id: `erule_${Date.now()}`,
    call_type_filters: [],
    ai_class_filters: [],
    response_filters: [],
    status_filters: [],
    template_id: "general_followup",
    custom_subject: "",
    custom_body: "",
    enabled: true,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────

interface Props {
  value?: EmailAutomationConfig;
  onChange: (config: EmailAutomationConfig) => void;
  disabled?: boolean;
}

export default function EmailAutomationConfigSection({
  value = { enabled: false, rules: [] },
  onChange,
  disabled = false,
}: Props) {
  // Built-in follow-up templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Marketing templates library
  const [marketingTemplates, setMarketingTemplates] = useState<EmailMarketingTemplate[]>([]);
  const [loadingMarketingTemplates, setLoadingMarketingTemplates] = useState(false);
  const [showTemplateLibraryModal, setShowTemplateLibraryModal] = useState(false);
  const [activeRuleIdxForTemplatePicker, setActiveRuleIdxForTemplatePicker] = useState<number | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("all");

  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    method: string | null;
    smtp_configured?: boolean;
    default_sender?: string;
    default_sender_name?: string;
    mailboxes?: Array<{
      id: number;
      email: string;
      display_name?: string;
      provider?: string;
      is_default?: boolean;
    }>;
    message?: string;
  } | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [showConnectWarningModal, setShowConnectWarningModal] = useState(false);

  // Branding state per rule or global
  const [branding, setBranding] = useState<EmailBrandingOptions>({
    headerType: "logo",
    logoUrl: "",
    headerTitle: "GenX Reality",
    headerSubtitle: "AI Voice & Automation Platform",
    headerAlign: "center",
    socialLinks: {
      website: "https://genxreality.in",
      linkedin: "",
      twitter: "",
      instagram: "",
    },
    showSocial: true,
    companyFooter: "GenX Reality",
  });
  const [showSocialDrawer, setShowSocialDrawer] = useState(false);

  // CTA Button Modal state
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [activeButtonRuleIdx, setActiveButtonRuleIdx] = useState<number | null>(null);
  const [buttonText, setButtonText] = useState("Learn More & Get Started →");
  const [buttonUrl, setButtonUrl] = useState("https://genxreality.in");
  const [buttonColor, setButtonColor] = useState("#2563eb");

  // Dedicated Live Preview Popup Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewModalRuleIdx, setPreviewModalRuleIdx] = useState<number | null>(null);

  // Popup Fullscreen Studio Modal state
  const [showFullscreenStudio, setShowFullscreenStudio] = useState(false);
  const [fullscreenRuleIdx, setFullscreenRuleIdx] = useState<number | null>(null);

  // Device viewport per modal ("desktop" | "mobile")
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

  // Hidden File Inputs
  const logoFileRef = useRef<HTMLInputElement | null>(null);
  const editorImageRef = useRef<HTMLInputElement | null>(null);
  const activeImageRuleIdx = useRef<number | null>(null);

  // Fetch connection status and templates on mount
  useEffect(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    // Connection status
    setLoadingConnection(true);
    fetch(`${BASE_URL}/api/email/automation/connection-status`, { headers })
      .then((r) => r.json())
      .then((d) => setConnectionStatus(d))
      .catch(() => setConnectionStatus({ connected: false, method: null }))
      .finally(() => setLoadingConnection(false));

    // Standard follow-up templates
    setLoadingTemplates(true);
    fetch(`${BASE_URL}/api/email/automation/templates`, { headers })
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));

    // Marketing templates library
    setLoadingMarketingTemplates(true);
    api.getEmailTemplates()
      .then((tpls) => setMarketingTemplates(tpls || []))
      .catch(() => setMarketingTemplates([]))
      .finally(() => setLoadingMarketingTemplates(false));
  }, []);

  const isConnected = connectionStatus?.connected ?? false;
  const isEnabled = value.enabled;

  const handleToggleEnabled = () => {
    if (disabled) return;
    if (!isConnected && !isEnabled) {
      setShowConnectWarningModal(true);
      return;
    }
    const nextEnabled = !isEnabled;
    let nextRules = value.rules || [];
    if (nextEnabled && nextRules.length === 0) {
      nextRules = [makeDefaultRule()];
    }
    onChange({ enabled: nextEnabled, rules: nextRules });
  };

  const handleAddRule = () => {
    const newRule = makeDefaultRule();
    const nextRules = [...(value.rules || []), newRule];
    onChange({ enabled: true, rules: nextRules });
  };

  const handleUpdateRule = (
    index: number,
    updates: Partial<EmailAutomationRule>
  ) => {
    const nextRules = [...(value.rules || [])];
    nextRules[index] = { ...nextRules[index], ...updates };
    onChange({ enabled: isEnabled, rules: nextRules });
  };

  const handleDeleteRule = (index: number) => {
    const nextRules = (value.rules || []).filter((_, i) => i !== index);
    onChange({ enabled: isEnabled, rules: nextRules });
  };

  const getTemplateById = (id: string) =>
    templates.find((t) => t.id === id) || null;

  const resolvedSubject = (rule: EmailAutomationRule) => {
    const tmpl = getTemplateById(rule.template_id);
    return rule.custom_subject || tmpl?.subject || "";
  };

  const resolvedBody = (rule: EmailAutomationRule) => {
    const tmpl = getTemplateById(rule.template_id);
    return rule.custom_body || tmpl?.body || "";
  };

  // Handle Logo Upload (Optimized 20KB - 100KB)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { dataUrl } = await compressImageToSizeRange(file, 20, 100);
    setBranding((prev) => ({
      ...prev,
      logoUrl: dataUrl,
      headerType: "logo",
    }));
    e.target.value = "";
  };

  // Handle Body Image Upload (Optimized 20KB - 100KB)
  const handleBodyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeImageRuleIdx.current === null) return;
    const ruleIdx = activeImageRuleIdx.current;
    const { dataUrl } = await compressImageToSizeRange(file, 20, 100);

    const currentRule = value.rules[ruleIdx];
    const tmpl = getTemplateById(currentRule.template_id);
    const curBody = currentRule.custom_body || tmpl?.body || "";

    const imageHtml = `<p style="text-align: center; margin: 16px 0;"><img src="${dataUrl}" alt="Email Content Image" style="max-width: 100%; height: auto; border-radius: 8px; display: inline-block;" /></p>`;
    handleUpdateRule(ruleIdx, { custom_body: curBody + imageHtml });
    e.target.value = "";
  };

  // Insert Pre-styled Blocks into Body
  const insertBlock = (ruleIdx: number, blockType: string) => {
    const currentRule = value.rules[ruleIdx];
    const tmpl = getTemplateById(currentRule.template_id);
    const curBody = currentRule.custom_body || tmpl?.body || "";

    let blockHtml = "";
    switch (blockType) {
      case "heading":
        blockHtml = `<h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0;">Special Announcement</h2>`;
        break;
      case "text":
        blockHtml = `<p style="margin: 0 0 14px 0;">Here are the key details from our conversation today...</p>`;
        break;
      case "button":
        setActiveButtonRuleIdx(ruleIdx);
        setShowButtonModal(true);
        return;
      case "divider":
        blockHtml = `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />`;
        break;
      case "social":
        blockHtml = `<p style="text-align: center; margin: 16px 0;"><a href="https://genxreality.in" style="color: #2563eb; text-decoration: underline; font-weight: 600;">Visit our Official Website &rarr;</a></p>`;
        break;
      case "signature":
        blockHtml = `<p style="margin-top: 20px; font-weight: 600; color: #0f172a;">Best regards,<br/><span style="color: #64748b; font-weight: normal;">The GenX Reality Team</span></p>`;
        break;
      case "image":
        activeImageRuleIdx.current = ruleIdx;
        editorImageRef.current?.click();
        return;
      default:
        break;
    }

    handleUpdateRule(ruleIdx, { custom_body: curBody + blockHtml });
  };

  // Insert Custom CTA Button
  const handleInsertButton = () => {
    if (activeButtonRuleIdx === null) return;
    const ruleIdx = activeButtonRuleIdx;
    const currentRule = value.rules[ruleIdx];
    const tmpl = getTemplateById(currentRule.template_id);
    const curBody = currentRule.custom_body || tmpl?.body || "";

    const btnHtml = `<div style="text-align: center; margin: 22px 0;"><a href="${buttonUrl}" target="_blank" style="display: inline-block; background-color: ${buttonColor}; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">${buttonText}</a></div>`;
    handleUpdateRule(ruleIdx, { custom_body: curBody + btnHtml });
    setShowButtonModal(false);
    setActiveButtonRuleIdx(null);
  };

  // Apply chosen marketing template to active rule
  const handleApplyMarketingTemplate = (mkt: EmailMarketingTemplate) => {
    if (activeRuleIdxForTemplatePicker === null) return;
    handleUpdateRule(activeRuleIdxForTemplatePicker, {
      template_id: `mkt_${mkt.id}`,
      custom_subject: mkt.subject,
      custom_body: mkt.html_body,
    });
    setShowTemplateLibraryModal(false);
    setActiveRuleIdxForTemplatePicker(null);
  };

  // Filtered marketing templates for modal
  const filteredMarketingTemplates = useMemo(() => {
    return marketingTemplates.filter((mkt) => {
      const matchCat =
        templateCategoryFilter === "all" ||
        mkt.category.toLowerCase() === templateCategoryFilter.toLowerCase();
      const matchSearch =
        !templateSearchQuery.trim() ||
        mkt.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        mkt.subject.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        mkt.description.toLowerCase().includes(templateSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [marketingTemplates, templateCategoryFilter, templateSearchQuery]);

  const templateCategories = useMemo(() => {
    const cats = new Set<string>();
    marketingTemplates.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [marketingTemplates]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoFileRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={editorImageRef}
        onChange={handleBodyImageUpload}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
      />

      {/* ── Header & Toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs">
            <Mail className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              Email Automation
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                Post-Call Follow-ups
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Automatically dispatch personalized follow-up emails from your connected SMTP mailbox based on call outcome.
            </p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-2">
          {loadingConnection ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : !isConnected ? (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-200/60 dark:border-amber-800/40">
              <Lock className="w-3 h-3" />
              Connect email first
            </div>
          ) : (
            <span
              className={`text-xs font-bold tracking-wider ${
                isEnabled
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-400"
              }`}
            >
              {isEnabled ? "ON" : "OFF"}
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleEnabled}
            disabled={disabled}
            title={
              !isConnected
                ? "Click to connect your SMTP email account first"
                : undefined
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              !isConnected
                ? "opacity-60 cursor-pointer bg-zinc-200 dark:bg-zinc-700"
                : isEnabled
                ? "cursor-pointer bg-blue-600"
                : "cursor-pointer bg-zinc-200 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Not connected banner ─────────────────────────────────────────── */}
      {!loadingConnection && !isConnected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
                No verified SMTP mailbox connected
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Connect your SMTP mailbox (Gmail, Outlook, Zoho, or Custom SMTP) to send automated emails directly from your own email.
              </p>
            </div>
          </div>
          <a
            href="/email-campaign"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-xs transition shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            Connect SMTP Mailbox
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* ── Connected badge ──────────────────────────────────────────────── */}
      {!loadingConnection && isConnected && (
        <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>
            Sending emails via connected mailbox:{" "}
            <strong className="text-blue-700 dark:text-blue-300 font-semibold">
              {connectionStatus?.default_sender || "Your Connected SMTP Mailbox"}
            </strong>
            {connectionStatus?.default_sender_name ? ` (${connectionStatus.default_sender_name})` : ""}
          </span>
        </div>
      )}

      {/* ── Rule Builder ─────────────────────────────────────────────────── */}
      {isEnabled && (
        <div className="space-y-6 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {(value.rules || []).map((rule, idx) => {
            const tmpl = getTemplateById(rule.template_id);

            return (
              <div
                key={rule.id || idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/30 p-5 space-y-4.5 shadow-2xs"
              >
                {/* Rule Header */}
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-700/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Email Rule #{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) =>
                          handleUpdateRule(idx, { enabled: e.target.checked })
                        }
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        Active
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(idx)}
                      className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 1. Match Filters */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-zinc-400" />
                    Match Filters (All Selected by Default)
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <MultiSelectDropdown
                      label={FILTER_DEFINITIONS.call_type.label}
                      allLabel={FILTER_DEFINITIONS.call_type.allLabel}
                      options={FILTER_DEFINITIONS.call_type.options}
                      selectedValues={rule.call_type_filters || []}
                      onChange={(vals) =>
                        handleUpdateRule(idx, { call_type_filters: vals })
                      }
                    />
                    <MultiSelectDropdown
                      label={FILTER_DEFINITIONS.ai_class.label}
                      allLabel={FILTER_DEFINITIONS.ai_class.allLabel}
                      options={FILTER_DEFINITIONS.ai_class.options}
                      selectedValues={rule.ai_class_filters || []}
                      onChange={(vals) =>
                        handleUpdateRule(idx, { ai_class_filters: vals })
                      }
                    />
                    <MultiSelectDropdown
                      label={FILTER_DEFINITIONS.response.label}
                      allLabel={FILTER_DEFINITIONS.response.allLabel}
                      options={FILTER_DEFINITIONS.response.options}
                      selectedValues={rule.response_filters || []}
                      onChange={(vals) =>
                        handleUpdateRule(idx, { response_filters: vals })
                      }
                    />
                    <MultiSelectDropdown
                      label={FILTER_DEFINITIONS.status.label}
                      allLabel={FILTER_DEFINITIONS.status.allLabel}
                      options={FILTER_DEFINITIONS.status.options}
                      selectedValues={rule.status_filters || []}
                      onChange={(vals) =>
                        handleUpdateRule(idx, { status_filters: vals })
                      }
                    />
                  </div>
                </div>

                {/* 2. Template Presets Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-zinc-400" />
                      Template Presets
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRuleIdxForTemplatePicker(idx);
                        setTemplateSearchQuery("");
                        setTemplateCategoryFilter("all");
                        setShowTemplateLibraryModal(true);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      Browse Template Library ({marketingTemplates.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {templates.map((tmplOpt) => {
                      const isSelected = rule.template_id === tmplOpt.id;
                      return (
                        <button
                          key={tmplOpt.id}
                          type="button"
                          onClick={() => {
                            handleUpdateRule(idx, {
                              template_id: tmplOpt.id,
                              custom_subject: "",
                              custom_body: tmplOpt.body,
                            });
                          }}
                          className={`flex flex-col gap-0.5 rounded-xl border p-2 text-left transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40 ring-1 ring-blue-500/30 font-semibold"
                              : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 hover:border-blue-300"
                          }`}
                        >
                          <span className="text-[11px] text-zinc-900 dark:text-zinc-100 truncate">
                            {tmplOpt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. FULL-WIDTH EMAIL CONTENT STUDIO (Matching Email Campaign Design) */}
                <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-700/80 p-4.5 shadow-sm space-y-4">
                  
                  {/* Header: Title + Action Buttons */}
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                        Email Content
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Live Preview Popup Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewModalRuleIdx(idx);
                          setShowPreviewModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl border border-blue-200/60 dark:border-blue-800/40 transition shadow-2xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Live Preview</span>
                      </button>

                      {/* Popup Studio Fullscreen Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setFullscreenRuleIdx(idx);
                          setShowFullscreenStudio(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition shadow-2xs cursor-pointer"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>Popup Studio</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Subject
                      </label>
                      <span className="text-[10px] text-zinc-400">
                        {(rule.custom_subject || tmpl?.subject || "").length}/200
                      </span>
                    </div>
                    <input
                      type="text"
                      value={rule.custom_subject}
                      maxLength={200}
                      onChange={(e) =>
                        handleUpdateRule(idx, { custom_subject: e.target.value })
                      }
                      placeholder={tmpl?.subject || "e.g. Q3 Growth Announcement"}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition dark:text-white shadow-2xs"
                    />
                  </div>

                  {/* DIRECT ACTION TOOLBAR: Logo, Image, Button, Links & Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = rule.custom_subject || tmpl?.subject || "";
                          handleUpdateRule(idx, { custom_subject: cur + " {{name}} " });
                        }}
                        className="px-2 py-0.8 text-[10.5px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 cursor-pointer shadow-2xs"
                      >
                        + {"{{name}}"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = rule.custom_subject || tmpl?.subject || "";
                          handleUpdateRule(idx, { custom_subject: cur + " {{company}} " });
                        }}
                        className="px-2 py-0.8 text-[10.5px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 cursor-pointer shadow-2xs"
                      >
                        + {"{{company}}"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Change / Upload Top Logo */}
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                      >
                        <Palette className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{branding.logoUrl ? "Change Top Logo" : "Upload Top Logo"}</span>
                      </button>

                      {/* Upload Body Image */}
                      <button
                        type="button"
                        onClick={() => {
                          activeImageRuleIdx.current = idx;
                          editorImageRef.current?.click();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition cursor-pointer shadow-2xs"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Upload Image</span>
                      </button>

                      {/* + Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveButtonRuleIdx(idx);
                          setShowButtonModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                      >
                        <MousePointerClick className="h-3.5 w-3.5 text-amber-600" />
                        <span>+ Button</span>
                      </button>

                      {/* Links & Footer */}
                      <button
                        type="button"
                        onClick={() => setShowSocialDrawer(!showSocialDrawer)}
                        className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                          showSocialDrawer
                            ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <Share2 className="h-3.5 w-3.5 text-purple-600" />
                        <span>Links &amp; Footer</span>
                      </button>
                    </div>
                  </div>

                  {/* Logo Active Banner Bar */}
                  {branding.logoUrl && (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={branding.logoUrl}
                          alt="Active Logo"
                          className="h-6 max-w-[80px] object-contain rounded bg-white p-0.5 border border-emerald-200"
                        />
                        <span className="font-semibold truncate">
                          Top Logo Active on Email Header (Optimized)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => logoFileRef.current?.click()}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Replace
                        </button>
                        <span className="text-emerald-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setBranding((p) => ({ ...p, logoUrl: "", headerType: "text" }))}
                          className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Links & Footer Drawer */}
                  {showSocialDrawer && (
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                          <Palette className="h-3.5 w-3.5 text-blue-600" />
                          <span>Header Alignment, Logo Subtitle &amp; Links</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSocialDrawer(false)}
                          className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 cursor-pointer"
                        >
                          Done ✓
                        </button>
                      </div>

                      {/* Align & Subtitle */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Header / Logo Align
                          </label>
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 p-0.5 rounded-lg">
                            {[
                              { id: "left", label: "Left", icon: AlignLeft },
                              { id: "center", label: "Center", icon: AlignCenter },
                              { id: "right", label: "Right", icon: AlignRight },
                            ].map((al) => {
                              const Icon = al.icon;
                              const active = (branding.headerAlign || "center") === al.id;
                              return (
                                <button
                                  key={al.id}
                                  type="button"
                                  onClick={() => setBranding((p) => ({ ...p, headerAlign: al.id as any }))}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                    active
                                      ? "bg-white dark:bg-zinc-800 text-blue-600 shadow-xs"
                                      : "text-zinc-500"
                                  }`}
                                >
                                  <Icon className="h-3 w-3" />
                                  <span>{al.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Brand Header Title
                          </label>
                          <input
                            type="text"
                            value={branding.headerTitle}
                            onChange={(e) => setBranding((p) => ({ ...p, headerTitle: e.target.value }))}
                            placeholder="e.g. GenX Reality"
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-600 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Text Under Logo / Subtitle
                          </label>
                          <input
                            type="text"
                            value={branding.headerSubtitle}
                            onChange={(e) => setBranding((p) => ({ ...p, headerSubtitle: e.target.value }))}
                            placeholder="e.g. AI Voice & Automation"
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-600 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Social Links */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                            Company Footer:
                          </label>
                          <input
                            type="text"
                            value={branding.companyFooter}
                            onChange={(e) => setBranding((p) => ({ ...p, companyFooter: e.target.value }))}
                            placeholder="e.g. GenX Reality"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
                            Website URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.website || ""}
                            onChange={(e) =>
                              setBranding((p) => ({
                                ...p,
                                socialLinks: { ...p.socialLinks, website: e.target.value },
                              }))
                            }
                            placeholder="https://yourcompany.com"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rich Text ReactQuill Studio Editor (Spanning Full Width) */}
                  <div className="w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-inner">
                    <ReactQuill
                      theme="snow"
                      value={rule.custom_body || tmpl?.body || ""}
                      onChange={(content) => handleUpdateRule(idx, { custom_body: content })}
                      className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[220px]"
                      placeholder="Write your email body here..."
                    />
                  </div>

                  {/* Pre-Styled Block Insertion Tray */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        <span>Add Pre-styled Blocks</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Click to append block</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {[
                        { id: "text", label: "Text", icon: Type },
                        { id: "image", label: "Image", icon: ImageIcon },
                        { id: "button", label: "Button", icon: MousePointerClick },
                        { id: "divider", label: "Divider", icon: Minus },
                        { id: "heading", label: "Heading", icon: Heading },
                        { id: "social", label: "Social", icon: Share2 },
                        { id: "signature", label: "Sign", icon: PenTool },
                      ].map((blk) => {
                        const Icon = blk.icon;
                        return (
                          <button
                            key={blk.id}
                            type="button"
                            onClick={() => insertBlock(idx, blk.id)}
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:bg-blue-50/50 transition group shadow-2xs cursor-pointer"
                          >
                            <Icon className="h-4 w-4 text-zinc-500 group-hover:text-blue-600 mb-0.5" />
                            <span className="text-[10.5px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600">
                              {blk.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Rule Button */}
          <button
            type="button"
            onClick={handleAddRule}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Another Email Rule
          </button>
        </div>
      )}

      {/* Disabled state */}
      {!isEnabled && isConnected && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700/50 text-xs text-zinc-400">
          <Zap className="w-3.5 h-3.5" />
          Email Automation is ready. Toggle ON to configure post-call email rules dispatched directly from your mailbox.
        </div>
      )}

      {/* ── DEDICATED LIVE PREVIEW POPUP MODAL ── */}
      {showPreviewModal && previewModalRuleIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Live Email Client Preview — Rule #{previewModalRuleIdx + 1}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Real-time preview of how recipients will see the automated follow-up email
                  </p>
                </div>
              </div>

              {/* Viewport switcher + Close */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-700 rounded-lg p-0.5 border border-zinc-300 dark:border-zinc-600">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      previewViewport === "desktop"
                        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      previewViewport === "mobile"
                        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body with Email Client Simulation */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-zinc-950/80">
              <div
                className={`mx-auto transition-all duration-200 ${
                  previewViewport === "mobile" ? "max-w-[360px]" : "max-w-[620px]"
                }`}
              >
                {/* Email Client Header Details */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-3 shadow-2xs space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase w-14 shrink-0">
                      From:
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {connectionStatus?.default_sender_name || branding.headerTitle}{" "}
                      <span className="text-zinc-400 font-normal">
                        &lt;{connectionStatus?.default_sender || "sender@domain.com"}&gt;
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase w-14 shrink-0">
                      To:
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Alex Johnson &lt;alex.johnson@example.com&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase w-14 shrink-0">
                      Subject:
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {resolveTextTokens(
                        value.rules[previewModalRuleIdx]?.custom_subject ||
                          templates.find(
                            (t) => t.id === value.rules[previewModalRuleIdx]?.template_id
                          )?.subject ||
                          "Special Announcement"
                      )}
                    </span>
                  </div>
                </div>

                {/* Rendered Email HTML Content */}
                <div
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: formatEmailDocumentHtml(
                      value.rules[previewModalRuleIdx]?.custom_body ||
                        templates.find(
                          (t) => t.id === value.rules[previewModalRuleIdx]?.template_id
                        )?.body ||
                        "",
                      branding
                    ),
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
              <span className="text-xs text-zinc-500">
                Preview renders real-time personalized variables
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POPUP FULLSCREEN STUDIO MODAL ── */}
      {showFullscreenStudio && fullscreenRuleIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-[90vh] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3.5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Maximize2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Email Automation Studio — Rule #{fullscreenRuleIdx + 1}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Full screen editor with real-time responsive preview
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFullscreenStudio(false)}
                  className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer"
                >
                  Done Editing
                </button>
              </div>
            </div>

            {/* Modal Body: 2-Pane Editor & Live Preview */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-5 overflow-y-auto">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={value.rules[fullscreenRuleIdx]?.custom_subject || ""}
                    onChange={(e) =>
                      handleUpdateRule(fullscreenRuleIdx, { custom_subject: e.target.value })
                    }
                    placeholder="e.g. Special Announcement"
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs font-semibold outline-none focus:border-blue-500"
                  />
                </div>

                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                  <ReactQuill
                    theme="snow"
                    value={value.rules[fullscreenRuleIdx]?.custom_body || ""}
                    onChange={(content) =>
                      handleUpdateRule(fullscreenRuleIdx, { custom_body: content })
                    }
                    className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[360px]"
                    placeholder="Write your email body here..."
                  />
                </div>
              </div>

              {/* Live Preview in Popup */}
              <div className="bg-slate-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-y-auto">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Live Preview
                </div>
                <div
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                  dangerouslySetInnerHTML={{
                    __html: formatEmailDocumentHtml(
                      value.rules[fullscreenRuleIdx]?.custom_body || "",
                      branding
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INSERT BUTTON MODAL ── */}
      {showButtonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <MousePointerClick className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Insert Call-To-Action Button
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Button Text:
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. Learn More & Get Started →"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Link URL:
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/offer"
                  className="w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Button Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer border border-zinc-200"
                  />
                  <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                    {buttonColor}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertButton}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                Insert Button
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATE LIBRARY MODAL ── */}
      {showTemplateLibraryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Email Marketing Template Library
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select any pre-designed template from your Email Campaign library
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateLibraryModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  placeholder="Search templates by title, subject, or description..."
                  className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateCategoryFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    templateCategoryFilter === "all"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400"
                  }`}
                >
                  All Templates ({marketingTemplates.length})
                </button>
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTemplateCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      templateCategoryFilter === cat
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingMarketingTemplates ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  Loading template library...
                </div>
              ) : filteredMarketingTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMarketingTemplates.map((mkt) => (
                    <div
                      key={mkt.id}
                      className="flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-4 space-y-3 hover:border-blue-400 hover:shadow-md transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                            {mkt.name}
                          </h4>
                          <span className="text-[9px] uppercase px-2 py-0.5 font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40 shrink-0">
                            {mkt.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {mkt.description || mkt.subject}
                        </p>
                        <div className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 truncate">
                          <strong className="text-zinc-600 dark:text-zinc-300">Subject:</strong> {mkt.subject}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyMarketingTemplate(mkt)}
                        className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Use This Template
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-zinc-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <p className="font-semibold text-zinc-600 dark:text-zinc-300">
                    No matching templates found
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3.5 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <span className="text-xs text-zinc-500">
                {filteredMarketingTemplates.length} templates available
              </span>
              <button
                type="button"
                onClick={() => setShowTemplateLibraryModal(false)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SMTP Mailbox Not Connected Warning Modal ── */}
      {showConnectWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  SMTP Mailbox Connection Required
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Connect your mailbox to activate automated emails
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              To send automated follow-up emails directly from your own email account, you need to connect and verify your SMTP mailbox (Gmail, Microsoft 365, Zoho, or Custom SMTP).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowConnectWarningModal(false)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 transition cursor-pointer"
              >
                Dismiss
              </button>
              <a
                href="/email-campaign"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-xs"
              >
                Connect SMTP Mailbox Now
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
