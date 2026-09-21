"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-60 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse text-zinc-400 text-xs">
      Loading Studio Editor...
    </div>
  ),
});

import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import AIAssistantModal from "@/components/email/AIAssistantModal";
import {
  ArrowLeft,
  Upload,
  Mail,
  User,
  Send,
  Loader2,
  X,
  AlertCircle,
  LayoutTemplate,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp,
  Globe,
  CheckCircle2,
  Wand2,
  Calendar,
  Users,
  Clock,
  Edit2,
  ExternalLink,
  Laptop,
  Smartphone,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Minus,
  Heading,
  Share2,
  PenTool,
  Plus,
  Check,
  Trash2,
  Maximize2,
  Palette,
  Sliders,
  Sparkle,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import {
  api,
  EmailContactItem,
  EmailMarketingTemplate,
  VerifiedSenderOption,
  EmailAIGenerateResult,
  EmailAIGeneratePayload,
} from "@/lib/api";

// ── Plain text token resolver ──
function resolveTextTokens(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{name\}\}/gi, "{{Client Name}}")
    .replace(/\{\{company\}\}/gi, "{{Company Name}}")
    .replace(/\{\{email\}\}/gi, "{{client@email.com}}");
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

// ── Client-side Image Optimizer (Target 20KB - 100KB for fast inbox delivery) ──
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

        // Scale down if image is very large
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

        // Adjust quality to target 20KB - 95KB
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

        let statusMsg = "";
        if (sizeKB >= minKB && sizeKB <= maxKB) {
          statusMsg = `✅ ${sizeKB} KB (Optimized 20KB–100KB for email)`;
        } else if (sizeKB < minKB) {
          statusMsg = `ℹ️ ${sizeKB} KB (Ultra lightweight)`;
        } else {
          statusMsg = `⚡ ${sizeKB} KB (Compressed from ${originalKB} KB)`;
        }

        resolve({ dataUrl, sizeKB, originalKB, statusMsg });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Full HTML Document Formatter ──
function formatEmailDocumentHtml(
  bodyHtml: string,
  title?: string,
  branding?: Partial<EmailBrandingOptions>
): string {
  if (!bodyHtml) return "";
  const resolved = resolveTextTokens(bodyHtml);

  if (resolved.includes("<!DOCTYPE") || resolved.includes("<html")) {
    return resolved;
  }

  const headerType = branding?.headerType ?? (branding?.logoUrl ? "logo" : "text");
  const logoUrl = branding?.logoUrl ?? "";
  const headerTitle = branding?.headerTitle || "Company Name";
  const headerSubtitle = branding?.headerSubtitle || "";
  const showSocial = branding?.showSocial ?? true;
  const companyFooter = branding?.companyFooter || branding?.headerTitle || "Your Company";
  const social = branding?.socialLinks || {};

  // Build social buttons
  const socialIcons: string[] = [];
  if (social.linkedin) {
    socialIcons.push(`<a href="${social.linkedin}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #0077b5; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">in</a>`);
  }
  if (social.twitter) {
    socialIcons.push(`<a href="${social.twitter}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #000000; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">𝕏</a>`);
  }
  if (social.instagram) {
    socialIcons.push(`<a href="${social.instagram}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #e1306c; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">📸</a>`);
  }
  if (social.facebook) {
    socialIcons.push(`<a href="${social.facebook}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #1877f2; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">f</a>`);
  }
  if (social.youtube) {
    socialIcons.push(`<a href="${social.youtube}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #ff0000; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">▶</a>`);
  }
  if (social.whatsapp) {
    socialIcons.push(`<a href="${social.whatsapp}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #25d366; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">💬</a>`);
  }
  if (social.website) {
    socialIcons.push(`<a href="${social.website}" target="_blank" style="display: inline-block; margin: 0 4px; width: 28px; height: 28px; line-height: 28px; border-radius: 50%; background: #6366f1; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: bold; text-align: center;">🌐</a>`);
  }

  // Header HTML builder with alignment
  const headerAlign = branding?.headerAlign || "center";
  const alignStyle =
    headerAlign === "left"
      ? "text-align: left;"
      : headerAlign === "right"
      ? "text-align: right;"
      : "text-align: center;";
  const marginStyle =
    headerAlign === "left"
      ? "margin: 0;"
      : headerAlign === "right"
      ? "margin: 0 0 0 auto;"
      : "margin: 0 auto;";

  let headerHtml = "";
  if (headerType === "logo" && logoUrl) {
    headerHtml = `
    <tr>
      <td style="background-color: #ffffff; padding: 22px 24px 18px 24px; ${alignStyle} border-bottom: 2px solid #6366f1;">
        <img src="${logoUrl}" alt="${headerTitle}" style="max-height: 54px; max-width: 240px; width: auto; height: auto; object-fit: contain; ${marginStyle} display: inline-block; border: 0;" />
        ${headerSubtitle ? `<div style="font-size: 11px; color: #6366f1; margin-top: 6px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 700;">${headerSubtitle}</div>` : ""}
      </td>
    </tr>`;
  } else if (headerType === "text" && headerTitle) {
    headerHtml = `
    <tr>
      <td style="background-color: #ffffff; padding: 20px 24px 16px 24px; ${alignStyle} border-bottom: 2px solid #6366f1;">
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
          ${headerTitle}
        </div>
        ${headerSubtitle ? `<div style="font-size: 11px; color: #6366f1; margin-top: 4px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 700;">${headerSubtitle}</div>` : ""}
      </td>
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    body {
      margin: 0;
      padding: 14px 8px;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
      line-height: 1.55;
      word-break: break-word;
    }
    p { margin: 0 0 12px 0; }
    ul { margin: 0 0 12px 0; padding-left: 22px; }
    li { margin-bottom: 5px; }
    h1, h2, h3 { color: #0f172a; margin: 0 0 12px 0; font-weight: 700; }
    h1 { font-size: 19px; }
    h2 { font-size: 16px; }
    a { color: #6366f1; }
    .email-btn {
      background-color: #6366f1;
      color: #ffffff !important;
      padding: 11px 26px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06); text-align: left;">
    ${headerHtml}
    <tr>
      <td style="padding: 22px 24px 16px 24px; font-size: 14px; color: #334155; line-height: 1.6;">
        ${title ? `<h2 style="color: #0f172a; font-size: 17px; font-weight: 700; margin: 0 0 14px 0;">${title}</h2>` : ""}
        ${resolved}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #f1f5f9; text-align: center;">
        ${
          showSocial && socialIcons.length > 0
            ? `<div style="margin-bottom: 12px;">${socialIcons.join("")}</div>`
            : ""
        }
        <p style="margin: 0 0 4px 0; font-size: 11.5px; color: #64748b; font-weight: 500;">
          &copy; ${new Date().getFullYear()} ${companyFooter}. All rights reserved.
        </p>
        <p style="margin: 0; font-size: 10.5px; color: #94a3b8;">
          You received this email as a registered client &bull; <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── CSV parser ──
function parseCSV(text: string): EmailContactItem[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = header.findIndex((h) => h.includes("name"));
  const emailIdx = header.findIndex((h) => h.includes("email"));
  if (nameIdx === -1 || emailIdx === -1) return [];

  return lines.slice(1).reduce<EmailContactItem[]>((acc, line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[nameIdx] || "";
    const email = cols[emailIdx] || "";
    if (name && email && email.includes("@")) {
      acc.push({ name, email });
    }
    return acc;
  }, []);
}

function NewEmailCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const editorImageRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Template query param & library picker
  const templateIdParam = searchParams.get("template_id");
  const tagParam = searchParams.get("tag");
  const [templateLibrary, setTemplateLibrary] = useState<EmailMarketingTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Active template metadata for AI context
  const [activeTemplateName, setActiveTemplateName] = useState<string>("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string>("");

  // AI Assistant Modal State & Inline Prompt State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(
    "Create a professional promotional email for our Q3 campaign. Make it persuasive and include a strong CTA."
  );
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedLength, setSelectedLength] = useState("Medium");

  // Campaign Setup Card Expansion State
  const [setupExpanded, setSetupExpanded] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [verifiedSenders, setVerifiedSenders] = useState<VerifiedSenderOption[]>([]);
  const [replyTo, setReplyTo] = useState("");
  const [htmlBody, setHtmlBody] = useState(DEFAULT_TEMPLATE);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("2026-09-22");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  // Branding & Logo Settings State (Persisted in localStorage)
  const [branding, setBranding] = useState<EmailBrandingOptions>({
    headerType: "text",
    logoUrl: "",
    headerTitle: user?.company_name || "GenX Reality",
    headerSubtitle: "",
    headerAlign: "center",
    socialLinks: {
      website: "https://genxreality.com",
      linkedin: "https://linkedin.com",
      twitter: "https://x.com",
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      youtube: "https://youtube.com",
    },
    showSocial: true,
    companyFooter: user?.company_name || "GenX Reality",
  });

  // Drawer / Accordion toggles inside left editor pane
  const [showBrandDrawer, setShowBrandDrawer] = useState(false);
  const [showSocialDrawer, setShowSocialDrawer] = useState(false);

  // Modal Dialog States
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [buttonModalText, setButtonModalText] = useState("Learn More & Get Started →");
  const [buttonModalUrl, setButtonModalUrl] = useState("https://genxreality.com");
  const [buttonModalColor, setButtonModalColor] = useState("#6366f1");
  const [showFullscreenStudio, setShowFullscreenStudio] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Image Upload Inserter Modal State
  const [imageModalUrl, setImageModalUrl] = useState("");
  const [imageModalAlt, setImageModalAlt] = useState("");
  const [imageModalAlign, setImageModalAlign] = useState<"center" | "left" | "right">("center");
  const [imageModalWidth, setImageModalWidth] = useState<"100%" | "75%" | "50%" | "300px">("100%");
  const [imageModalLink, setImageModalLink] = useState("");
  const [imageSizeStatus, setImageSizeStatus] = useState("");

  // Contact Book Lists state
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [selectedContactListTag, setSelectedContactListTag] = useState(tagParam || "");
  const [loadingContactLists, setLoadingContactLists] = useState(false);

  // Tab State inside Expanded Campaign Setup
  const [activeSetupTab, setActiveSetupTab] = useState<"recipients" | "sender" | "schedule">("recipients");

  // Contacts - Start clean with NO default mock contacts
  const [contacts, setContacts] = useState<EmailContactItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [csvUploadedName, setCsvUploadedName] = useState("");

  // Preview viewport mode: "desktop" | "mobile"
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

  // UI state
  const [csvError, setCsvError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Load saved branding from localStorage on mount
  useEffect(() => {
    try {
      const savedBranding =
        localStorage.getItem("genx_email_branding") ||
        localStorage.getItem("callinggen_email_branding");
      if (savedBranding) {
        const parsed = JSON.parse(savedBranding);
        setBranding((prev) => ({ ...prev, ...parsed }));
      } else if (user?.company_name) {
        setBranding((prev) => ({
          ...prev,
          headerTitle: user.company_name || prev.headerTitle,
          companyFooter: user.company_name || prev.companyFooter,
        }));
      }
    } catch {
      // ignore
    }
  }, [user]);

  // Guarded Editor Change to avoid infinite render loops
  const handleHtmlChange = (content: string) => {
    setHtmlBody((prev) => (prev === content ? prev : content));
  };

  // Save branding updates to localStorage
  const updateBranding = (updates: Partial<EmailBrandingOptions>) => {
    setBranding((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("genx_email_branding", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Load templates, senders & contact lists
  useEffect(() => {
    api.getEmailTemplates().then((tpls) => setTemplateLibrary(tpls)).catch(() => {});
    api.getVerifiedSenders().then((senders) => {
      setVerifiedSenders(senders);
      const defaultSender = senders.find((s) => s.is_default) || senders[0];
      if (defaultSender) {
        setFromEmail(defaultSender.email);
        if (defaultSender.display_name && !fromName) {
          setFromName(defaultSender.display_name);
        }
      }
    }).catch(() => {});

    api.getContactListsSummary().then((lists) => {
      setContactLists(lists || []);
    }).catch(() => {});
  }, []);

  const loadContactsFromTag = async (tag: string) => {
    if (!tag) return;
    try {
      setLoadingContactLists(true);
      const allSaved = await api.getAllSavedContacts(tag);
      const emailContacts = allSaved
        .filter((c) => c.email && c.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
        .map((c) => ({
          name: c.name || "Customer",
          email: c.email!.trim(),
        }));

      if (emailContacts.length > 0) {
        setContacts(emailContacts);
        setCsvUploadedName(`${emailContacts.length} contacts • From "${tag}"`);
        setCsvError("");
      } else {
        setCsvError(`No valid email addresses found in "${tag}".`);
      }
    } catch {
      setCsvError("Failed to load contacts from Contact Book list.");
    } finally {
      setLoadingContactLists(false);
    }
  };

  // If tagParam exists in URL, auto-load contacts
  useEffect(() => {
    if (tagParam) {
      setSelectedContactListTag(tagParam);
      loadContactsFromTag(tagParam);
    }
  }, [tagParam]);

  // Load template if template_id in query string
  useEffect(() => {
    if (!templateIdParam) return;
    const tid = Number(templateIdParam);
    if (!tid) return;

    setLoadingTemplate(true);
    api.getEmailTemplate(tid)
      .then((tpl) => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
        setName(`${tpl.name} Campaign - ${today}`);
        setSubject(tpl.subject);
        setHtmlBody(tpl.html_body);
        setActiveTemplateName(tpl.name);
        setActiveTemplateCategory(tpl.category);
        if (user?.company_name) {
          setFromName(user.company_name);
        }
      })
      .catch((err) => {
        console.warn("Failed to load initial template:", err);
      })
      .finally(() => setLoadingTemplate(false));
  }, [templateIdParam, user]);

  const handleSelectTemplate = (tpl: EmailMarketingTemplate) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setName(`${tpl.name} Campaign - ${today}`);
    setSubject(tpl.subject);
    setHtmlBody(tpl.html_body);
    setActiveTemplateName(tpl.name);
    setActiveTemplateCategory(tpl.category);
    setShowTemplatePicker(false);
  };

  // Handle AI Generated Content Application
  const handleApplyAIGenerated = (result: EmailAIGenerateResult) => {
    setSubject(result.subject);
    setHtmlBody(result.body);
    if (!name.trim()) {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      setName(`AI Campaign - ${today}`);
    }
    if (!fromName.trim() && user?.company_name) {
      setFromName(user.company_name);
    }
    setAiSuccessBadge(true);
    setTimeout(() => setAiSuccessBadge(false), 5000);
  };

  // ── Inline AI Generation Handler ──
  const handleInlineAIGenerate = async (customPrompt?: string, actionType: string = "generate") => {
    const promptToUse = customPrompt || aiPrompt;
    if (!promptToUse.trim()) return;

    setAiGenerating(true);
    setError("");

    try {
      const payload: EmailAIGeneratePayload = {
        prompt: promptToUse.trim(),
        template_name: activeTemplateName || "Promotional Announcement",
        tone: selectedTone,
        category: selectedLength === "Short" ? "Quick Note" : selectedLength === "Detailed" ? "Detailed Newsletter" : "Sales",
        action: actionType,
        current_subject: subject,
        current_body: htmlBody,
      };

      const result = await api.generateEmailWithAI(payload);
      handleApplyAIGenerated(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate email content. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  // ── CSV Upload ──
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setCsvError("Could not parse contacts. Ensure CSV has 'name' and 'email' columns.");
        return;
      }
      setCsvError("");
      setContacts((prev) => {
        const existing = new Set(prev.map((c) => c.email));
        const combined = [...prev, ...parsed.filter((c) => !existing.has(c.email))];
        setCsvUploadedName(`${combined.length.toLocaleString()} contacts • ${file.name}`);
        return combined;
      });
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Logo Upload Handler with 20KB-100KB Optimizer ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImageToSizeRange(file, 20, 100);
      updateBranding({
        headerType: "logo",
        logoUrl: res.dataUrl,
      });
    } catch (err) {
      console.warn("Logo processing failed:", err);
    }
    if (logoFileRef.current) logoFileRef.current.value = "";
  };

  // ── Editor Image Upload Handler with 20KB-100KB Optimizer ──
  const handleEditorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImageToSizeRange(file, 20, 100);
      setImageModalUrl(res.dataUrl);
      setImageModalAlt(file.name.replace(/\.[^/.]+$/, ""));
      setImageSizeStatus(res.statusMsg);
      setShowImageUploadModal(true);
    } catch (err) {
      console.warn("Image processing failed:", err);
    }
    if (editorImageRef.current) editorImageRef.current.value = "";
  };

  const handleConfirmInsertImage = () => {
    if (!imageModalUrl.trim()) return;
    const alignStyle =
      imageModalAlign === "center"
        ? "text-align: center; margin: 16px auto;"
        : imageModalAlign === "right"
        ? "text-align: right; margin: 16px 0;"
        : "text-align: left; margin: 16px 0;";

    const imgTag = `<img src="${imageModalUrl.trim()}" alt="${imageModalAlt || "Image"}" style="max-width: ${imageModalWidth}; width: auto; height: auto; border-radius: 8px; display: inline-block;" />`;
    const wrapped = imageModalLink.trim()
      ? `<a href="${imageModalLink.trim()}" target="_blank">${imgTag}</a>`
      : imgTag;

    const blockHtml = `<p style="${alignStyle}">${wrapped}</p>`;
    setHtmlBody((prev) => prev + blockHtml);
    setShowImageUploadModal(false);
    setImageModalUrl("");
    setImageModalAlt("");
    setImageModalLink("");
    setImageSizeStatus("");
  };

  // ── Manual add ──
  const addManual = () => {
    if (!manualName.trim() || !manualEmail.trim()) return;
    if (!manualEmail.includes("@")) {
      setCsvError("Invalid email address.");
      return;
    }
    if (contacts.some((c) => c.email === manualEmail.trim())) {
      setCsvError("This email is already in the list.");
      return;
    }
    setCsvError("");
    const updated = [...contacts, { name: manualName.trim(), email: manualEmail.trim() }];
    setContacts(updated);
    setCsvUploadedName(`${updated.length.toLocaleString()} contacts • Custom list`);
    setManualName("");
    setManualEmail("");
  };

  const removeContact = (email: string) => {
    const updated = contacts.filter((c) => c.email !== email);
    setContacts(updated);
    setCsvUploadedName(updated.length > 0 ? `${updated.length.toLocaleString()} contacts` : "");
  };

  // ── Insert Custom Button Handler ──
  const handleInsertCustomButton = () => {
    const url = buttonModalUrl.trim() || branding.socialLinks.website || "#";
    const text = buttonModalText.trim() || "Learn More & Get Started →";
    const color = buttonModalColor || "#6366f1";
    const blockHtml = `<p style="text-align: center; margin: 18px 0;"><a href="${url}" target="_blank" class="email-btn" style="background-color: ${color}; color: #ffffff !important; padding: 11px 26px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${text}</a></p>`;
    setHtmlBody((prev) => prev + blockHtml);
    setShowButtonModal(false);
  };

  // ── Insert Pre-styled HTML Block into Editor ──
  const insertBlock = (blockType: string) => {
    let blockHtml = "";
    switch (blockType) {
      case "text":
        blockHtml = `<p>Write your paragraph message here with personalized value for {{name}}.</p>`;
        break;
      case "image":
        editorImageRef.current?.click();
        return;
      case "button":
        setShowButtonModal(true);
        return;
      case "divider":
        blockHtml = `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />`;
        break;
      case "heading":
        blockHtml = `<h2 style="color: #0f172a; font-size: 17px; font-weight: 700; margin: 16px 0 8px 0;">Special Announcement</h2>`;
        break;
      case "social":
        setShowSocialDrawer(true);
        return;
      case "signature":
        blockHtml = `<p style="margin-top: 20px;">Best regards,<br><strong>${fromName || branding.headerTitle || "The Team"}</strong><br><span style="color: #64748b; font-size: 12px;">The {{company}} Team</span></p>`;
        break;
      default:
        break;
    }
    if (blockHtml) {
      setHtmlBody((prev) => prev + blockHtml);
    }
  };

  // ── Open in New Tab ──
  const handleOpenInNewTab = () => {
    const formattedHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(formattedHtml);
      win.document.close();
    }
  };

  // ── Handle Save Draft ──
  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // ── Submit & Launch Campaign ──
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please provide a Campaign Name.");
      return;
    }
    if (!subject.trim()) {
      setError("Please provide an Email Subject.");
      return;
    }
    if (!htmlBody.trim()) {
      setError("Email content cannot be empty.");
      return;
    }
    if (contacts.length === 0) {
      setError("Please add at least one recipient contact.");
      setSetupExpanded(true);
      setActiveSetupTab("recipients");
      return;
    }
    if (scheduleMode === "later" && (!scheduleDate || !scheduleTime)) {
      setError("Please specify both date and time for scheduled send.");
      setSetupExpanded(true);
      setActiveSetupTab("schedule");
      return;
    }

    setSubmitting(true);
    try {
      const finalHtml = formatEmailDocumentHtml(htmlBody, subject, branding);

      const { campaign_id } = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        from_name: fromName.trim() || undefined,
        from_email: fromEmail ? fromEmail.trim() : undefined,
        reply_to: replyTo.trim() || undefined,
        html_body: finalHtml,
        schedule_date: scheduleMode === "later" ? scheduleDate : undefined,
        schedule_time: scheduleMode === "later" ? scheduleTime : undefined,
        contacts,
      });

      if (scheduleMode === "now") {
        await api.launchEmailCampaign(campaign_id);
      }

      router.push(`/email-campaign/${campaign_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create/launch email campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Email Marketing Studio">
      <div className="flex flex-col gap-3.5 max-w-[1760px] mx-auto w-full px-1 sm:px-2 py-0.5">

        {/* Hidden inputs for uploading images with 20KB-100KB validation */}
        <input
          type="file"
          ref={editorImageRef}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
          onChange={handleEditorImageUpload}
          className="hidden"
        />
        <input
          type="file"
          ref={logoFileRef}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={handleLogoUpload}
          className="hidden"
        />

        {/* ══════════════════════════════════════════════════════════════════════
            1. TOP NAVBAR / STUDIO HEADER
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0E131F] px-4 py-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          
          {/* Left: Back Link + Title + Subtitle */}
          <div className="flex items-center gap-3 min-w-[260px]">
            <button
              onClick={() => router.push("/email-campaign")}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition px-2 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <h1 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                Email Marketing Studio
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Create, customize and send beautiful emails with AI
              </p>
            </div>
          </div>

          {/* Right: Templates, AI Assistant, Save Draft, Send Now */}
          <div className="flex items-center gap-2">

            {/* Template Library Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-indigo-500" />
                <span>{activeTemplateName ? activeTemplateName : "Templates"}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {showTemplatePicker && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-50 p-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-1 px-2">
                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Select Template
                    </span>
                    <button
                      onClick={() => setShowTemplatePicker(false)}
                      className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {templateLibrary.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition group flex flex-col gap-0.5 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                            {t.category}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {t.subject}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ✨ Primary AI Assistant Pill */}
            <button
              type="button"
              id="ai-assistant-header-btn"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>AI Assistant</span>
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <span>{draftSaved ? "✓ Saved" : "Save Draft"}</span>
            </button>

            {/* Send / Schedule Main Action */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-bold shadow-md shadow-indigo-500/25 transition disabled:opacity-60 cursor-pointer active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. TOP INTERACTIVE CARD: CAMPAIGN SETUP
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden transition-all">
          
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight">
                  Campaign Setup
                </h2>
                <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                  Configure your recipients, sender details and schedule
                </p>
              </div>
            </div>

            {/* Edit Toggle Button */}
            <button
              type="button"
              onClick={() => setSetupExpanded(!setupExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Edit2 className="h-3 w-3" />
              <span>{setupExpanded ? "Hide Details" : "Edit Details"}</span>
              {setupExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-0.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-0.5" />}
            </button>
          </div>

          {/* 3 Summary Interactive Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800 p-1.5 bg-zinc-50/20 dark:bg-zinc-900/10">
            
            {/* 1. Recipients Tile */}
            <div
              onClick={() => {
                setActiveSetupTab("recipients");
                setSetupExpanded(true);
              }}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeSetupTab === "recipients" && setupExpanded
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                activeSetupTab === "recipients" && setupExpanded
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
              }`}>
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Recipients ({contacts.length})</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Fill / Edit &rarr;</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {contacts.length > 0 ? `${contacts.length.toLocaleString()} contacts` : "0 contacts added"}
                </div>
                <div className={`text-[10.5px] flex items-center gap-1 font-medium truncate ${
                  contacts.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                }`}>
                  {contacts.length > 0 ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>{csvUploadedName || `${contacts.length} recipients ready`}</span>
                    </>
                  ) : (
                    <span>Click to add contacts or upload CSV</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Sender Details Tile */}
            <div
              onClick={() => {
                setActiveSetupTab("sender");
                setSetupExpanded(true);
              }}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeSetupTab === "sender" && setupExpanded
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                activeSetupTab === "sender" && setupExpanded
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
              }`}>
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Sender Details</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Fill / Edit &rarr;</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {fromName || branding.headerTitle || "GenX Reality"} &lt;{fromEmail || "noreply@genxreality.com"}&gt;
                </div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                  Reply-to: {replyTo || "support@genxreality.com"}
                </div>
              </div>
            </div>

            {/* 3. Schedule Timing Tile */}
            <div
              onClick={() => {
                setActiveSetupTab("schedule");
                setSetupExpanded(true);
              }}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                activeSetupTab === "schedule" && setupExpanded
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent"
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                activeSetupTab === "schedule" && setupExpanded
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
              }`}>
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Schedule Timing</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Fill / Edit &rarr;</span>
                </div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {scheduleMode === "later" ? `${scheduleDate} • ${scheduleTime}` : "Immediate Send"}
                </div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                  Asia/Kolkata • {scheduleMode === "later" ? "Send later" : "Send immediately"}
                </div>
              </div>
            </div>

          </div>

          {/* Directly Fillable Form Section */}
          {setupExpanded && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0A0D14] p-4 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              
              {/* 1. Recipients Form */}
              {activeSetupTab === "recipients" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Add &amp; Manage Recipients ({contacts.length} added)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Upload CSV, pick from Contact Book, or enter email addresses
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      ref={fileRef}
                      accept=".csv,text/csv"
                      onChange={handleCSVUpload}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 dark:border-indigo-800 dark:bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 transition cursor-pointer shrink-0 w-full sm:w-auto"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload CSV</span>
                    </button>

                    {/* Contact Book Lists Dropdown Selector */}
                    {contactLists.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                        <select
                          value={selectedContactListTag}
                          onChange={(e) => {
                            const t = e.target.value;
                            setSelectedContactListTag(t);
                            if (t) loadContactsFromTag(t);
                          }}
                          disabled={loadingContactLists}
                          className="rounded-xl border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-xs font-semibold text-indigo-700 outline-none focus:border-indigo-500 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 cursor-pointer"
                        >
                          <option value="">Choose Contact List...</option>
                          {contactLists.map((l: any) => (
                            <option key={l.tag} value={l.tag}>
                              {l.tag} ({l.with_email || l.total_contacts} emails)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-1 w-full">
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="Name (e.g. John Doe)"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                        className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-white font-medium"
                      />
                      <input
                        type="email"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="Email (e.g. john@company.com)"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                        className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={addManual}
                        className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition shrink-0 cursor-pointer shadow-xs"
                      >
                        Add Contact
                      </button>
                    </div>
                  </div>

                  {csvError && <p className="text-xs text-red-500">{csvError}</p>}

                  {/* Contacts Table */}
                  {contacts.length > 0 ? (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-40 overflow-y-auto bg-white dark:bg-zinc-900">
                      <table className="w-full text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/70 sticky top-0">
                          <tr>
                            <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">#</th>
                            <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">Name</th>
                            <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">Email</th>
                            <th className="px-3 py-1.5 text-right font-semibold text-zinc-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {contacts.map((c, i) => (
                            <tr key={`${c.email}-${i}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="px-3 py-1.5 text-zinc-400">{i + 1}</td>
                              <td className="px-3 py-1.5 font-medium text-zinc-800 dark:text-zinc-200">{c.name}</td>
                              <td className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeContact(c.email)}
                                  className="text-zinc-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                  title="Remove contact"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center">
                      <Users className="h-5 w-5 text-zinc-400 mx-auto mb-1 opacity-70" />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        No recipients added yet.
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Upload a CSV file or add email addresses above to build your campaign audience.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Sender Details Form */}
              {activeSetupTab === "sender" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Sender &amp; Mailbox Details
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push("/email-campaign")}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      + Connect Custom Mailbox (Method 2)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-500">From Sending Account</label>
                      <select
                        value={fromEmail}
                        onChange={(e) => {
                          setFromEmail(e.target.value);
                          const chosen = verifiedSenders.find((s) => s.email === e.target.value);
                          if (chosen && chosen.display_name && !fromName) {
                            setFromName(chosen.display_name);
                          }
                        }}
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      >
                        {verifiedSenders.length === 0 ? (
                          <option value="">Default Verified Mailbox (noreply@genxreality.com)</option>
                        ) : (
                          verifiedSenders.map((s) => (
                            <option key={s.email} value={s.email}>
                              {s.is_smtp
                                ? `⭐ ${s.email} (${(s.provider || "Connected Mailbox").toUpperCase()})`
                                : s.is_default
                                ? `Primary Sender (${s.email})`
                                : `🌐 info@${s.domain} (Verified Domain)`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-500">Sender Display Name</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Sai Sathwik"
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-500">Reply-To Address</label>
                      <input
                        type="email"
                        value={replyTo}
                        onChange={(e) => setReplyTo(e.target.value)}
                        placeholder="e.g. support@genxreality.com"
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Schedule Timing Form */}
              {activeSetupTab === "schedule" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Schedule Dispatch Timing
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Timezone: Asia/Kolkata (IST)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["now", "later"] as const).map((mode) => (
                      <label
                        key={mode}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition ${
                          scheduleMode === mode
                            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="scheduleMode"
                          value={mode}
                          checked={scheduleMode === mode}
                          onChange={() => setScheduleMode(mode)}
                          className="accent-indigo-600"
                        />
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {mode === "now" ? "Send immediately upon launch" : "Schedule for future date/time"}
                        </span>
                      </label>
                    ))}
                  </div>

                  {scheduleMode === "later" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10.5px] font-bold uppercase text-zinc-500">Send Date</label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-white font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10.5px] font-bold uppercase text-zinc-500">Send Time (IST)</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            3. MIDDLE CARD: AI ASSISTANT PROMPT BAR & CONTROLS
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#FAF5FF] dark:bg-[#131126] rounded-2xl border border-purple-100 dark:border-purple-900/40 p-3.5 shadow-sm space-y-2.5">
          
          {/* AI Header */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/25">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight">
                AI Assistant
              </h2>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                Tell us what you want and let AI craft the perfect email for you
              </p>
            </div>
          </div>

          {/* Main Prompt Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-zinc-900 border border-purple-200/80 dark:border-purple-900/60 rounded-xl p-1.5 shadow-sm">
            <div className="flex items-center flex-1 px-2 gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Create a professional promotional email for our Q3 campaign. Make it persuasive and include a strong CTA."
                className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none font-medium"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleInlineAIGenerate())}
              />
              {aiPrompt && (
                <button
                  type="button"
                  onClick={() => setAiPrompt("")}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={aiGenerating || !aiPrompt.trim()}
              onClick={() => handleInlineAIGenerate()}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-purple-500/25 transition disabled:opacity-60 cursor-pointer shrink-0 active:scale-95"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Email</span>
                </>
              )}
            </button>
          </div>

          {/* Tone & Length Selectors + Try These Prompts */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            
            {/* Left: Tone & Length */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Tone */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[10.5px]">Tone:</span>
                {["Professional", "Friendly", "Persuasive", "Corporate", "Exciting"].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition cursor-pointer ${
                      selectedTone === tone
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold"
                        : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="px-1.5 py-0.5 text-[10.5px] text-purple-600 dark:text-purple-400 font-medium hover:underline cursor-pointer"
                >
                  + Add Tone
                </button>
              </div>

              {/* Length */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 text-[10.5px]">Length:</span>
                {["Short", "Medium", "Detailed"].map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSelectedLength(len)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition cursor-pointer ${
                      selectedLength === len
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold"
                        : "bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-50"
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>

            </div>

            {/* Right: Quick Action Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-semibold text-zinc-500 dark:text-zinc-400">
                💡 Try these:
              </span>
              {[
                { label: "! Make it shorter", prompt: "Make this email more concise, punchy, and under 100 words." },
                { label: "+ Add a strong CTA", prompt: "Add a compelling call-to-action button and urgency." },
                { label: "! Make it more professional", prompt: "Refine tone to be executive, polished, and corporate." },
                { label: "Translate to Hindi", prompt: "Translate this email into professional Hindi with English tech terms." },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setAiPrompt(item.prompt);
                    handleInlineAIGenerate(item.prompt, "refine");
                  }}
                  className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-900/60 text-zinc-700 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* AI Success Notification Toast */}
        {aiSuccessBadge && (
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>AI Copy Applied!</strong> Subject line and email body content have been automatically updated.
              </span>
            </div>
            <button
              onClick={() => setAiSuccessBadge(false)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            4. EMAIL CONTENT STUDIO (FULL-WIDTH WORKSPACE)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3.5">
          
          {/* Header with Live Preview & Fullscreen Studio Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Email Content &amp; Design Studio
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Craft rich email copy with custom branding, blocks, CTA buttons, and tokens
                </p>
              </div>
            </div>

            {/* Action Buttons: Live Preview Popup + Popup Studio */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100/70 transition cursor-pointer shadow-2xs"
                title="Check Live Email Client Preview in a Popup Modal"
              >
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFullscreenStudio(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100/70 transition cursor-pointer shadow-2xs"
                title="Open Rich Editor in Fullscreen Modal Popup"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Popup Studio</span>
              </button>
            </div>
          </div>

          {/* Subject Input Row */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                Subject
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                {subject.length}/200
              </span>
            </div>
            <input
              id="email-subject-input"
              type="text"
              value={subject}
              maxLength={200}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Q3 Growth Announcement"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white"
            />
          </div>

          {/* DIRECT ACTION TOOLBAR: Upload Logo (Header) + Upload Image (Body) + Tokens + AI */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
            
            {/* Left group: Name token + Company token */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSubject((p) => p + " {{name}} ")}
                className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
                title="Insert recipient name token"
              >
                + {"{{name}}"}
              </button>
              <button
                type="button"
                onClick={() => setSubject((p) => p + " {{company}} ")}
                className="px-2 py-0.5 text-[10.5px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
                title="Insert company name token"
              >
                + {"{{company}}"}
              </button>
            </div>

            {/* Center/Right group: Upload Logo + Upload Image + Edit Social Links */}
            <div className="flex items-center gap-1.5 flex-wrap">
              
              {/* 🖼️ Upload Logo (Direct Header Uploader) */}
              <button
                type="button"
                onClick={() => logoFileRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80 transition cursor-pointer shadow-2xs"
                title="Upload top brand logo image (20KB - 100KB, PNG/JPG/SVG/WebP)"
              >
                <Palette className="h-3.5 w-3.5 text-emerald-600" />
                <span>{branding.logoUrl ? "Change Top Logo" : "Upload Top Logo"}</span>
              </button>

              {/* 📷 Upload Body Image */}
              <button
                type="button"
                onClick={() => editorImageRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
                title="Insert an image into email body (20KB - 100KB, PNG/JPG/WebP/GIF)"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Upload Image</span>
              </button>

              {/* 🔗 Insert CTA Button */}
              <button
                type="button"
                onClick={() => setShowButtonModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                title="Insert a customizable CTA button with link into email body"
              >
                <MousePointerClick className="h-3.5 w-3.5 text-amber-600" />
                <span>+ Button</span>
              </button>

              {/* 🌐 Social Links Drawer Toggle */}
              <button
                type="button"
                onClick={() => setShowSocialDrawer(!showSocialDrawer)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                  showSocialDrawer
                    ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300"
                    : "bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                }`}
                title="Edit custom social links and footer brand"
              >
                <Share2 className="h-3.5 w-3.5 text-purple-600" />
                <span>Links &amp; Footer</span>
              </button>
            </div>
          </div>

          {/* Direct Logo Status Pill Bar (If logo is active, show quick remove/change) */}
          {branding.logoUrl && (
            <div className="flex items-center justify-between p-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
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
                  onClick={() => updateBranding({ logoUrl: "", headerType: "text" })}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* INLINE DRAWER: Edit Header Alignment, Under-Logo Text, Social Links & Footer Brand */}
          {showSocialDrawer && (
            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                  <Palette className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Header Alignment, Logo Subtitle &amp; Social Links</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSocialDrawer(false)}
                  className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                >
                  Done ✓
                </button>
              </div>

              {/* 1. Header Alignment & Text Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                {/* Alignment Selector */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    Header / Logo Align
                  </label>
                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-600">
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
                          onClick={() => updateBranding({ headerAlign: al.id as any })}
                          className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                            active
                              ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{al.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Header Title */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    Brand / Header Title
                  </label>
                  <input
                    type="text"
                    value={branding.headerTitle}
                    onChange={(e) => updateBranding({ headerTitle: e.target.value })}
                    placeholder="e.g. GenX Reality"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                  />
                </div>

                {/* Under-Logo Text / Subtitle */}
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                    Text Under Logo / Subtitle
                  </label>
                  <input
                    type="text"
                    value={branding.headerSubtitle}
                    onChange={(e) => updateBranding({ headerSubtitle: e.target.value })}
                    placeholder="e.g. AI Voice Calling & Automation Platform"
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* 2. Social Links & Footer Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Company Footer Name:
                  </label>
                  <input
                    type="text"
                    value={branding.companyFooter}
                    onChange={(e) => updateBranding({ companyFooter: e.target.value })}
                    placeholder="e.g. GenX Reality"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Official Website URL:
                  </label>
                  <input
                    type="url"
                    value={branding.socialLinks.website || ""}
                    onChange={(e) =>
                      updateBranding({
                        socialLinks: { ...branding.socialLinks, website: e.target.value },
                      })
                    }
                    placeholder="https://yourcompany.com"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    LinkedIn URL:
                  </label>
                  <input
                    type="url"
                    value={branding.socialLinks.linkedin || ""}
                    onChange={(e) =>
                      updateBranding({
                        socialLinks: { ...branding.socialLinks, linkedin: e.target.value },
                      })
                    }
                    placeholder="https://linkedin.com/company/..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    X / Twitter URL:
                  </label>
                  <input
                    type="url"
                    value={branding.socialLinks.twitter || ""}
                    onChange={(e) =>
                      updateBranding({
                        socialLinks: { ...branding.socialLinks, twitter: e.target.value },
                      })
                    }
                    placeholder="https://x.com/your_handle"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Instagram URL:
                  </label>
                  <input
                    type="url"
                    value={branding.socialLinks.instagram || ""}
                    onChange={(e) =>
                      updateBranding({
                        socialLinks: { ...branding.socialLinks, instagram: e.target.value },
                      })
                    }
                    placeholder="https://instagram.com/..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                    YouTube URL:
                  </label>
                  <input
                    type="url"
                    value={branding.socialLinks.youtube || ""}
                    onChange={(e) =>
                      updateBranding({
                        socialLinks: { ...branding.socialLinks, youtube: e.target.value },
                      })
                    }
                    placeholder="https://youtube.com/@..."
                    className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rich Editor */}
          {!showFullscreenStudio && (
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
              <ReactQuill
                theme="snow"
                value={htmlBody}
                onChange={handleHtmlChange}
                className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[260px]"
                placeholder="Write your email body here..."
              />
            </div>
          )}

          {/* Bottom Block Insertion Tray */}
          <div className="bg-zinc-50/70 dark:bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Plus className="h-3 w-3" />
                <span>Add Pre-styled Blocks</span>
              </div>
              <span className="text-[10px] text-zinc-400">Click to append block</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
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
                    onClick={() => insertBlock(blk.id)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition group cursor-pointer"
                  >
                    <Icon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 mb-0.5" />
                    <span className="text-[10.5px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {blk.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            5. MODAL: LIVE CLIENT PREVIEW POPUP (DESKTOP & MOBILE VIEWPORT)
        ══════════════════════════════════════════════════════════════════════ */}
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0E131F] w-full max-w-5xl h-[88vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Preview Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                      Live Email Preview
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Real-time client rendering across desktop and mobile devices
                    </p>
                  </div>
                </div>

                {/* Viewport switch & Actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        previewViewport === "desktop"
                          ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        previewViewport === "mobile"
                          ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-zinc-500 hover:text-zinc-700"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 transition cursor-pointer"
                  >
                    <span>New Tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Preview Canvas */}
              <div className="flex-1 bg-zinc-100/90 dark:bg-zinc-950/90 p-4 overflow-y-auto flex items-center justify-center">
                {previewViewport === "mobile" ? (
                  <div className="w-[375px] max-w-full bg-zinc-900 rounded-[40px] p-3 shadow-2xl border-4 border-zinc-700/80 my-auto">
                    <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-2 flex items-center justify-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                      <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
                    </div>
                    <div className="w-full bg-white dark:bg-[#0A0D14] rounded-[28px] overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-inner">
                      <iframe
                        srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                        className="w-full border-0 bg-transparent block"
                        style={{ height: "540px" }}
                        title="Email Studio Mobile Live Preview"
                        sandbox="allow-same-origin allow-popups"
                      />
                    </div>
                    <div className="w-28 h-1 bg-zinc-600 rounded-full mx-auto mt-2" />
                  </div>
                ) : (
                  <div className="w-full max-w-3xl bg-white dark:bg-[#0A0D14] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-lg my-auto">
                    <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <span className="font-mono text-[11px] truncate">Subject: {subject || "No subject specified"}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">● Live Sync Active</span>
                    </div>
                    <iframe
                      srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                      className="w-full border-0 bg-transparent block"
                      style={{ height: "560px" }}
                      title="Email Studio Desktop Live Preview"
                      sandbox="allow-same-origin allow-popups"
                    />
                  </div>
                )}
              </div>

              {/* Preview Modal Footer */}
              <div className="px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time email rendering preview</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            5. FULLSCREEN / POPUP MODAL STUDIO EDITOR
        ══════════════════════════════════════════════════════════════════════ */}
        {showFullscreenStudio && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0E131F] w-full max-w-7xl h-[92vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                      Fullscreen Email Studio
                    </h2>
                    <p className="text-[11px] text-zinc-500">
                      Distraction-free editing with real-time responsive preview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Palette className="h-3.5 w-3.5" />
                    <span>{branding.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFullscreenStudio(false)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>Done Editing</span>
                  </button>
                </div>
              </div>

              {/* 2-Pane Editor Content */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                
                {/* Left: Full Editor */}
                <div className="lg:col-span-6 p-4 overflow-y-auto space-y-3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0E131F]">
                  
                  {/* Subject Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Q3 Growth Announcement"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>

                  {/* Quick Action Helpers */}
                  <div className="flex items-center justify-between p-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSubject((p) => p + " {{name}} ")}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
                      >
                        + {"{{name}}"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubject((p) => p + " {{company}} ")}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 cursor-pointer"
                      >
                        + {"{{company}}"}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                        title="Upload top brand logo image (20KB - 100KB)"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>{branding.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editorImageRef.current?.click()}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer"
                        title="Insert body image (20KB - 100KB)"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Upload Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowButtonModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                        title="Insert customizable CTA button"
                      >
                        <MousePointerClick className="h-3.5 w-3.5" />
                        <span>+ Button</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSocialDrawer(!showSocialDrawer)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer"
                        title="Edit custom social links and footer brand"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Links</span>
                      </button>
                    </div>
                  </div>

                  {/* Logo Status Bar in Studio Modal */}
                  {branding.logoUrl && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
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
                          onClick={() => updateBranding({ logoUrl: "", headerType: "text" })}
                          className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Social Links Drawer in Studio Modal */}
                  {showSocialDrawer && (
                    <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 shadow-xs">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                          <Palette className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Header Alignment, Logo Subtitle &amp; Social Links</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSocialDrawer(false)}
                          className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                        >
                          Done ✓
                        </button>
                      </div>

                      {/* 1. Header Alignment & Text Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                        {/* Alignment Selector */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Header / Logo Align
                          </label>
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-700 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-600">
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
                                  onClick={() => updateBranding({ headerAlign: al.id as any })}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                    active
                                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                  }`}
                                >
                                  <Icon className="h-3 w-3" />
                                  <span>{al.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Header Title */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Brand / Header Title
                          </label>
                          <input
                            type="text"
                            value={branding.headerTitle}
                            onChange={(e) => updateBranding({ headerTitle: e.target.value })}
                            placeholder="e.g. GenX Reality"
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                          />
                        </div>

                        {/* Under-Logo Text / Subtitle */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">
                            Text Under Logo / Subtitle
                          </label>
                          <input
                            type="text"
                            value={branding.headerSubtitle}
                            onChange={(e) => updateBranding({ headerSubtitle: e.target.value })}
                            placeholder="e.g. AI Voice Calling & Automation Platform"
                            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                          />
                        </div>
                      </div>

                      {/* 2. Social Links & Footer Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            Company Footer Name:
                          </label>
                          <input
                            type="text"
                            value={branding.companyFooter}
                            onChange={(e) => updateBranding({ companyFooter: e.target.value })}
                            placeholder="e.g. GenX Reality"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            Official Website URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.website || ""}
                            onChange={(e) =>
                              updateBranding({
                                socialLinks: { ...branding.socialLinks, website: e.target.value },
                              })
                            }
                            placeholder="https://yourcompany.com"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            LinkedIn URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.linkedin || ""}
                            onChange={(e) =>
                              updateBranding({
                                socialLinks: { ...branding.socialLinks, linkedin: e.target.value },
                              })
                            }
                            placeholder="https://linkedin.com/company/..."
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            X / Twitter URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.twitter || ""}
                            onChange={(e) =>
                              updateBranding({
                                socialLinks: { ...branding.socialLinks, twitter: e.target.value },
                              })
                            }
                            placeholder="https://x.com/your_handle"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            Instagram URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.instagram || ""}
                            onChange={(e) =>
                              updateBranding({
                                socialLinks: { ...branding.socialLinks, instagram: e.target.value },
                              })
                            }
                            placeholder="https://instagram.com/..."
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-300">
                            YouTube URL:
                          </label>
                          <input
                            type="url"
                            value={branding.socialLinks.youtube || ""}
                            onChange={(e) =>
                              updateBranding({
                                socialLinks: { ...branding.socialLinks, youtube: e.target.value },
                              })
                            }
                            placeholder="https://youtube.com/@..."
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ReactQuill Editor */}
                  <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 min-h-[340px]">
                    <ReactQuill
                      theme="snow"
                      value={htmlBody}
                      onChange={handleHtmlChange}
                      className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[300px]"
                      placeholder="Write your email body here..."
                    />
                  </div>

                  {/* Block Tray */}
                  <div className="grid grid-cols-7 gap-1 pt-1">
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
                          onClick={() => insertBlock(blk.id)}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-50/50 transition cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300 mb-0.5" />
                          <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">
                            {blk.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Live Synced Preview */}
                <div className="lg:col-span-6 p-4 bg-zinc-50 dark:bg-[#0A0D14] overflow-y-auto flex flex-col items-center justify-start gap-3">
                  
                  {/* Viewport switch */}
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        previewViewport === "desktop"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      <Laptop className="h-3.5 w-3.5" />
                      <span>Desktop View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        previewViewport === "mobile"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Mobile View</span>
                    </button>
                  </div>

                  {/* Frame */}
                  {previewViewport === "mobile" ? (
                    <div className="w-[360px] bg-zinc-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-zinc-700 relative">
                      <div className="w-20 h-3.5 bg-zinc-800 rounded-full mx-auto mb-2" />
                      <div className="w-full bg-white dark:bg-[#0A0D14] rounded-[24px] overflow-hidden">
                        <iframe
                          srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                          className="w-full border-0 bg-transparent block"
                          style={{ height: "460px" }}
                          title="Fullscreen Mobile Preview"
                          sandbox="allow-same-origin allow-popups"
                        />
                      </div>
                      <div className="w-24 h-1 bg-zinc-600 rounded-full mx-auto mt-2" />
                    </div>
                  ) : (
                    <div className="w-full max-w-[620px] bg-white dark:bg-[#0A0D14] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg">
                      <iframe
                        srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                        className="w-full border-0 bg-transparent block"
                        style={{ height: "540px" }}
                        title="Fullscreen Desktop Preview"
                        sandbox="allow-same-origin allow-popups"
                      />
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            6. MODAL: IMAGE INSERTER MODAL WITH 20KB - 100KB VALIDATION
        ══════════════════════════════════════════════════════════════════════ */}
        {showImageUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Insert Image into Email
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageUploadModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Image Preview & Optimization Status */}
              {imageModalUrl && (
                <div className="space-y-2">
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex items-center justify-center max-h-48 overflow-hidden">
                    <img
                      src={imageModalUrl}
                      alt={imageModalAlt || "Preview"}
                      className="max-h-44 object-contain rounded-lg"
                    />
                  </div>
                  {imageSizeStatus && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-center">
                      {imageSizeStatus}
                    </p>
                  )}
                </div>
              )}

              {/* Image Alt Text & Link */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Alt Text / Description
                  </label>
                  <input
                    type="text"
                    value={imageModalAlt}
                    onChange={(e) => setImageModalAlt(e.target.value)}
                    placeholder="e.g. Promotional Banner"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Click-Through Link URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageModalLink}
                    onChange={(e) => setImageModalLink(e.target.value)}
                    placeholder="e.g. https://yourcompany.com/special-offer"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                {/* Alignment & Width */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Alignment
                    </label>
                    <select
                      value={imageModalAlign}
                      onChange={(e) => setImageModalAlign(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    >
                      <option value="center">Center</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Image Size / Width
                    </label>
                    <select
                      value={imageModalWidth}
                      onChange={(e) => setImageModalWidth(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    >
                      <option value="100%">100% (Full Width)</option>
                      <option value="75%">75% (Medium)</option>
                      <option value="50%">50% (Compact)</option>
                      <option value="300px">300px (Fixed)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowImageUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmInsertImage}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Insert Image
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            7. MODAL: CTA BUTTON INSERTER WITH CUSTOM LINK & TEXT
        ══════════════════════════════════════════════════════════════════════ */}
        {showButtonModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
              
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Insert Action Button
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowButtonModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Button Label / Text
                  </label>
                  <input
                    type="text"
                    value={buttonModalText}
                    onChange={(e) => setButtonModalText(e.target.value)}
                    placeholder="e.g. Learn More & Get Started →"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Destination Link URL
                  </label>
                  <input
                    type="url"
                    value={buttonModalUrl}
                    onChange={(e) => setButtonModalUrl(e.target.value)}
                    placeholder="e.g. https://genxreality.com"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Button Theme Color
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: "Indigo", color: "#6366f1" },
                      { name: "Emerald", color: "#10b981" },
                      { name: "Blue", color: "#2563eb" },
                      { name: "Dark", color: "#0f172a" },
                      { name: "Rose", color: "#e11d48" },
                    ].map((theme) => (
                      <button
                        key={theme.color}
                        type="button"
                        onClick={() => setButtonModalColor(theme.color)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                          buttonModalColor === theme.color
                            ? "ring-2 ring-indigo-500 border-transparent shadow-xs text-white"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                        }`}
                        style={{ backgroundColor: buttonModalColor === theme.color ? theme.color : undefined }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Button Preview in Modal */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-center border border-zinc-200/80 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block mb-1.5">Button Preview:</span>
                  <span
                    className="email-btn inline-block text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-sm"
                    style={{ backgroundColor: buttonModalColor }}
                  >
                    {buttonModalText || "Button Label"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowButtonModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertCustomButton}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Insert Button
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── AI Assistant Interactive Modal (Full Assistant Mode) ── */}
        <AIAssistantModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onApplyGenerated={handleApplyAIGenerated}
          templateName={activeTemplateName}
          templateCategory={activeTemplateCategory}
          currentSubject={subject}
          currentBody={htmlBody}
        />

      </div>
    </DashboardShell>
  );
}

export default function NewEmailCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading campaign studio…</div>}>
      <NewEmailCampaignContent />
    </Suspense>
  );
}

// ── Default HTML fallback template ──
const DEFAULT_TEMPLATE = `<h2><strong>Special Announcement</strong></h2><p>Hi {{name}},</p><p>We are excited to share our latest updates and solutions with you from {{company}}.</p><p>Our team has been working hard to bring you innovative solutions that help your business grow faster and smarter. This quarter, we're introducing new features, better support, and exclusive offers designed just for you.</p><p style="text-align: center; margin: 18px 0;"><a href="https://genxreality.com" target="_blank" class="email-btn" style="background-color: #6366f1; color: #ffffff !important; padding: 11px 26px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Learn More &amp; Get Started &rarr;</a></p><p>Best regards,<br><strong>The {{company}} Team</strong></p>`;
