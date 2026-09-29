"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse text-zinc-400 text-xs">
      Loading Email Studio Editor...
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
  RefreshCw,
  SendHorizontal,
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
    .replace(/\{\{name\}\}/gi, "John Doe")
    .replace(/\{\{company\}\}/gi, "Acme Corp")
    .replace(/\{\{email\}\}/gi, "john@company.com");
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
  branding?: EmailBrandingOptions
): string {
  const brand = branding || {
    headerType: "text",
    logoUrl: "",
    headerTitle: "GenX Reality",
    headerSubtitle: "AI Voice Calling & Outreach",
    headerAlign: "center",
    socialLinks: {},
    showSocial: true,
    companyFooter: "GenX Reality",
  };

  const align = brand.headerAlign || "center";
  const alignStyle = align === "left" ? "text-align: left;" : align === "right" ? "text-align: right;" : "text-align: center;";

  // Social Links Builder
  const socialIcons: string[] = [];
  if (brand.socialLinks?.website) {
    socialIcons.push(
      `<a href="${brand.socialLinks.website}" target="_blank" style="display: inline-block; margin: 0 6px; color: #6366f1; text-decoration: none; font-size: 12px; font-weight: 600;">Website &rarr;</a>`
    );
  }
  if (brand.socialLinks?.linkedin) {
    socialIcons.push(
      `<a href="${brand.socialLinks.linkedin}" target="_blank" style="display: inline-block; margin: 0 6px; color: #0a66c2; text-decoration: none; font-size: 12px; font-weight: 600;">LinkedIn</a>`
    );
  }
  if (brand.socialLinks?.twitter) {
    socialIcons.push(
      `<a href="${brand.socialLinks.twitter}" target="_blank" style="display: inline-block; margin: 0 6px; color: #1da1f2; text-decoration: none; font-size: 12px; font-weight: 600;">Twitter/X</a>`
    );
  }
  if (brand.socialLinks?.instagram) {
    socialIcons.push(
      `<a href="${brand.socialLinks.instagram}" target="_blank" style="display: inline-block; margin: 0 6px; color: #e1306c; text-decoration: none; font-size: 12px; font-weight: 600;">Instagram</a>`
    );
  }
  if (brand.socialLinks?.youtube) {
    socialIcons.push(
      `<a href="${brand.socialLinks.youtube}" target="_blank" style="display: inline-block; margin: 0 6px; color: #ff0000; text-decoration: none; font-size: 12px; font-weight: 600;">YouTube</a>`
    );
  }

  const socialBlockHtml =
    socialIcons.length > 0
      ? `<div style="text-align: center; margin: 20px 0 10px; padding-top: 15px; border-top: 1px solid #e2e8f0;">${socialIcons.join(
        " &bull; "
      )}</div>`
      : "";

  let headerHtml = "";
  if (brand.headerType === "logo" && brand.logoUrl) {
    headerHtml = `
      <div style="${alignStyle} padding: 18px 24px; background: #fafafa; border-bottom: 1px solid #f1f5f9;">
        <img src="${brand.logoUrl}" alt="Brand Logo" style="max-height: 48px; max-width: 180px; height: auto; display: inline-block;" />
        ${brand.headerSubtitle ? `<p style="margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 500;">${brand.headerSubtitle}</p>` : ""}
      </div>
    `;
  } else if (brand.headerType === "text" || brand.headerTitle) {
    headerHtml = `
      <div style="${alignStyle} padding: 18px 24px; background: #fafafa; border-bottom: 1px solid #f1f5f9;">
        <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">${brand.headerTitle || "GenX Reality"}</h1>
        ${brand.headerSubtitle ? `<p style="margin: 4px 0 0; font-size: 11px; color: #64748b;">${brand.headerSubtitle}</p>` : ""}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Email Preview"}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b; line-height: 1.6; }
    .email-wrapper { width: 100%; background-color: #f8fafc; padding: 24px 12px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .email-body { padding: 28px 28px 20px; font-size: 14.5px; color: #334155; }
    .email-body h1, .email-body h2, .email-body h3 { color: #0f172a; margin-top: 0; }
    .email-body h2 { font-size: 19px; margin-bottom: 12px; }
    .email-body p { margin: 0 0 14px; }
    .email-body ul, .email-body ol { margin: 0 0 14px; padding-left: 20px; }
    .email-body li { margin-bottom: 6px; }
    .email-body a { color: #6366f1; text-decoration: underline; font-weight: 500; }
    .email-footer { padding: 18px 24px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; background-color: #fafbfc; border-top: 1px solid #f1f5f9; }
    .email-footer p { margin: 4px 0; }
    .email-btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; font-weight: 600; padding: 11px 24px; border-radius: 8px; text-decoration: none !important; margin: 12px 0; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      ${headerHtml}
      <div class="email-body">
        ${bodyHtml || "<p style='color:#94a3b8; font-style:italic;'>Start writing your email content in the editor...</p>"}
      </div>
      <div class="email-footer">
        ${socialBlockHtml}
        <p>Sent by <strong>${brand.companyFooter || "GenX Reality"}</strong></p>
        <p style="color: #cbd5e1; font-size: 10.5px;">You received this email because you are a registered client. <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ── Simple CSV Parser ──
function parseCSV(text: string): EmailContactItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = headers.findIndex((h) => h === "name" || h === "fullname" || h === "full_name" || h === "contact");
  const emailIdx = headers.findIndex((h) => h === "email" || h === "e-mail" || h === "email_address" || h === "mail");

  if (emailIdx === -1) return [];

  const result: EmailContactItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const email = cols[emailIdx];
    if (email && email.includes("@") && email.includes(".")) {
      const name = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : "Valued Customer";
      result.push({ name, email });
    }
  }
  return result;
}

function NewEmailCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template_id");
  const tagParam = searchParams.get("tag");
  const { user } = useAuth();

  // Campaign Meta State
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [contacts, setContacts] = useState<EmailContactItem[]>([]);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");

  // Scheduling State
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState("10:00");

  // Verified Sending Accounts & Contact Lists
  const [verifiedSenders, setVerifiedSenders] = useState<VerifiedSenderOption[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [selectedContactListTag, setSelectedContactListTag] = useState("");
  const [loadingContactLists, setLoadingContactLists] = useState(false);

  // CSV State
  const [csvUploadedName, setCsvUploadedName] = useState("");
  const [csvError, setCsvError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual Contact Add State
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // Branding & Logo State
  const [branding, setBranding] = useState<EmailBrandingOptions>({
    headerType: "logo",
    logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    headerTitle: "GenX Reality",
    headerSubtitle: "AI Voice Calling & Marketing Platform",
    headerAlign: "center",
    socialLinks: {
      website: "https://genxreality.com",
    },
    showSocial: true,
    companyFooter: "GenX Reality AI Solutions",
  });
  const [showSocialDrawer, setShowSocialDrawer] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const editorImageRef = useRef<HTMLInputElement>(null);

  // Image Inserter Modal State (20KB - 100KB Optimizer)
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState("");
  const [imageModalAlt, setImageModalAlt] = useState("");
  const [imageModalLink, setImageModalLink] = useState("");
  const [imageModalAlign, setImageModalAlign] = useState<"left" | "center" | "right">("center");
  const [imageModalWidth, setImageModalWidth] = useState<"100%" | "75%" | "50%" | "300px">("100%");
  const [imageSizeStatus, setImageSizeStatus] = useState("");

  // CTA Button Inserter Modal State
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [buttonModalText, setButtonModalText] = useState("Learn More & Get Started →");
  const [buttonModalUrl, setButtonModalUrl] = useState("https://genxreality.com");
  const [buttonModalColor, setButtonModalColor] = useState("#6366f1");

  // AI Assistant Modal & Inline Generation State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedLength, setSelectedLength] = useState("Medium");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);

  // Template Picker State
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<EmailMarketingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState("");

  // Setup Ribbon Expandable State
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [activeSetupTab, setActiveSetupTab] = useState<"recipients" | "sender" | "schedule">("recipients");

  // Right-side Preview Viewport State
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");

  // Test Email State
  const [testEmailInput, setTestEmailInput] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [testEmailError, setTestEmailError] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Helper to update branding
  const updateBranding = (partial: Partial<EmailBrandingOptions>) => {
    setBranding((prev) => ({ ...prev, ...partial }));
  };

  // Pre-fill user details & fetch senders/contact lists
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setName(`Email Campaign - ${today}`);
    setSubject("Exciting Update from GenX Reality");
    setHtmlBody(DEFAULT_TEMPLATE);

    if (user?.email) {
      setFromEmail(user.email);
      setTestEmailInput(user.email);
    }
    if (user?.company_name) {
      setFromName(user.company_name);
      updateBranding({
        headerTitle: user.company_name,
        companyFooter: user.company_name,
      });
    }

    // Fetch verified senders & contact lists
    api.getVerifiedSenders().then((senders) => {
      setVerifiedSenders(senders);
      const defaultSender = senders.find((s) => s.is_default) || senders[0];
      if (defaultSender) {
        setFromEmail(defaultSender.email);
        if (defaultSender.display_name && !fromName) {
          setFromName(defaultSender.display_name);
        }
      }
    }).catch(() => { });

    api.getContactListsSummary().then((lists) => {
      setContactLists(lists || []);
    }).catch(() => { });
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
        blockHtml = `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`;
        break;
      case "heading":
        blockHtml = `<h2><strong>Catchy Section Headline</strong></h2>`;
        break;
      case "social":
        setShowSocialDrawer(true);
        return;
      case "signature":
        blockHtml = `<p>Warm regards,<br><strong>${fromName || user?.name || "The Team"}</strong><br><span style="color: #64748b; font-size: 12px;">${branding.headerTitle || "GenX Reality"}</span></p>`;
        break;
      default:
        return;
    }
    setHtmlBody((prev) => prev + blockHtml);
  };

  const handleHtmlChange = (content: string) => {
    setHtmlBody(content);
  };

  const handleOpenInNewTab = () => {
    const fullHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  // ── Send Instant Test Email Handler ──
  const handleSendTestEmail = async () => {
    if (!testEmailInput.trim() || !testEmailInput.includes("@")) {
      setTestEmailError("Please enter a valid recipient email address for testing.");
      return;
    }

    setSendingTestEmail(true);
    setTestEmailError("");
    setTestEmailSuccess(false);

    try {
      const formattedHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
      const res = await api.createEmailCampaign({
        name: `[Test] ${subject || "Email Preview"} - ${new Date().toLocaleTimeString()}`,
        subject: `[Test Preview] ${subject || "No Subject"}`,
        html_body: formattedHtml,
        from_email: fromEmail || user?.email,
        from_name: fromName || user?.company_name || user?.name,
        reply_to: replyTo || undefined,
        contacts: [{ name: "Test User", email: testEmailInput.trim() }],
      });

      await api.launchEmailCampaign(res.campaign_id);
      setTestEmailSuccess(true);
      setTimeout(() => setTestEmailSuccess(false), 5000);
    } catch (err: any) {
      setTestEmailError(err.message || "Failed to deliver test email. Check your sending mailbox.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  // ── Submit Campaign Handler ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please give your email campaign a descriptive name.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter an email subject line.");
      return;
    }
    if (!htmlBody.trim()) {
      setError("Please compose your email content in the editor.");
      return;
    }
    if (contacts.length === 0) {
      setError("Please add at least one recipient (Upload CSV or pick a contact list).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const fullDocumentHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
      let scheduledAtIso: string | undefined;
      if (scheduleMode === "later" && scheduleDate && scheduleTime) {
        scheduledAtIso = new Date(`${scheduleDate}T${scheduleTime}:00+05:30`).toISOString();
      }

      const res = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        html_body: fullDocumentHtml,
        from_email: fromEmail.trim() || user?.email,
        from_name: fromName.trim() || undefined,
        reply_to: replyTo.trim() || undefined,
        schedule_date: scheduleMode === "later" ? scheduleDate : undefined,
        schedule_time: scheduleMode === "later" ? scheduleTime : undefined,
        contacts,
      });

      if (scheduleMode === "now") {
        await api.launchEmailCampaign(res.campaign_id);
      }

      router.push(`/email-campaign/${res.campaign_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create campaign. Please verify your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Email Campaign Studio">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoFileRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
        className="hidden"
        id="logo-file-input"
      />
      <input
        type="file"
        ref={editorImageRef}
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleEditorImageUpload}
        className="hidden"
        id="editor-image-file-input"
      />
      <input
        type="file"
        ref={fileRef}
        accept=".csv,text/csv"
        onChange={handleCSVUpload}
        className="hidden"
        id="csv-file-input"
      />

      <div className="max-w-[1680px] mx-auto space-y-4 pb-12">

        {/* ══════════════════════════════════════════════════════════════════════
            1. TOP ACTION & NAVIGATION BAR
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-[#0E131F]/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm sticky top-0 z-30">

          {/* Left: Back button & Inline Campaign Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => router.push("/email-campaign")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer shrink-0"
              title="Back to Campaigns"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campaign Name (e.g. Q3 Growth Announcement)"
                className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 outline-none transition px-1 py-0.5 w-full max-w-md truncate"
              />
              {activeTemplateName && (
                <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {activeTemplateName}
                </span>
              )}
            </div>
          </div>

          {/* Right: Template picker, Full AI Assistant, and Send CTA */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Template Library Button */}
            <button
              type="button"
              onClick={() => {
                setShowTemplatePicker(true);
                if (templates.length === 0) {
                  setLoadingTemplates(true);
                  api.getEmailTemplates().then((tpls) => {
                    setTemplates(tpls);
                  }).finally(() => setLoadingTemplates(false));
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <LayoutTemplate className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Templates</span>
            </button>

            {/* AI Assistant Full Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 hover:opacity-95 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Assistant</span>
            </button>

            {/* Launch / Schedule Campaign Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Launching…</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{scheduleMode === "later" ? "Schedule Campaign" : "Send Campaign"}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. CAMPAIGN SETUP ACCORDION RIBBON (Recipients, Sender Mailbox, Schedule)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">

          {/* Summary Strip (3 Tiles) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800/80 p-1.5">

            {/* Tile 1: Recipients */}
            <div
              onClick={() => {
                setActiveSetupTab("recipients");
                setSetupExpanded(activeSetupTab === "recipients" ? !setupExpanded : true);
              }}
              className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer ${setupExpanded && activeSetupTab === "recipients"
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Recipients</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {contacts.length > 0 ? `${contacts.length.toLocaleString()} Contacts Selected` : "No Recipients Added"}
                  </div>
                  <div className="text-[10.5px] text-zinc-400 truncate">
                    {csvUploadedName || "Click to upload CSV or select Contact List"}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-2 shrink-0">
                {setupExpanded && activeSetupTab === "recipients" ? "Hide ▲" : "Manage ▼"}
              </span>
            </div>

            {/* Tile 2: Sender Mailbox */}
            <div
              onClick={() => {
                setActiveSetupTab("sender");
                setSetupExpanded(activeSetupTab === "sender" ? !setupExpanded : true);
              }}
              className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer ${setupExpanded && activeSetupTab === "sender"
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Sending From</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {fromName || "Company"} &lt;{fromEmail || "noreply@genxreality.com"}&gt;
                  </div>
                  <div className="text-[10.5px] text-zinc-400 truncate">
                    Verified sender mailbox configured
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-2 shrink-0">
                {setupExpanded && activeSetupTab === "sender" ? "Hide ▲" : "Change ▼"}
              </span>
            </div>

            {/* Tile 3: Schedule */}
            <div
              onClick={() => {
                setActiveSetupTab("schedule");
                setSetupExpanded(activeSetupTab === "schedule" ? !setupExpanded : true);
              }}
              className={`flex items-center justify-between p-3 rounded-xl transition cursor-pointer ${setupExpanded && activeSetupTab === "schedule"
                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Dispatch Timing</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {scheduleMode === "later" ? `${scheduleDate} at ${scheduleTime}` : "Immediate Send upon Launch"}
                  </div>
                  <div className="text-[10.5px] text-zinc-400 truncate">
                    Timezone: Asia/Kolkata (IST)
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 pl-2 shrink-0">
                {setupExpanded && activeSetupTab === "schedule" ? "Hide ▲" : "Schedule ▼"}
              </span>
            </div>

          </div>

          {/* Expandable Form Tray */}
          {setupExpanded && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/60 dark:bg-[#0A0D14] animate-in fade-in slide-in-from-top-2 duration-150">

              {/* 1. Recipients Form */}
              {activeSetupTab === "recipients" && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Manage Recipients ({contacts.length} loaded)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/70 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload CSV</span>
                      </button>

                      {contactLists.length > 0 && (
                        <select
                          value={selectedContactListTag}
                          onChange={(e) => {
                            const t = e.target.value;
                            setSelectedContactListTag(t);
                            if (t) loadContactsFromTag(t);
                          }}
                          disabled={loadingContactLists}
                          className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">Load Contact Book List...</option>
                          {contactLists.map((l: any) => (
                            <option key={l.tag} value={l.tag}>
                              {l.tag} ({l.with_email || l.total_contacts} emails)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Manual Single Add */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Name (e.g. John Doe)"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                      className="flex-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Email (e.g. john@company.com)"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                      className="flex-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addManual}
                      className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition cursor-pointer shrink-0 w-full sm:w-auto"
                    >
                      + Add Single
                    </button>
                  </div>

                  {csvError && <p className="text-xs text-red-500">{csvError}</p>}

                  {/* Recipient Table Preview */}
                  {contacts.length > 0 && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-36 overflow-y-auto bg-white dark:bg-zinc-900">
                      <table className="w-full text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/80 sticky top-0">
                          <tr>
                            <th className="px-3 py-1 text-left text-zinc-500 font-semibold">#</th>
                            <th className="px-3 py-1 text-left text-zinc-500 font-semibold">Name</th>
                            <th className="px-3 py-1 text-left text-zinc-500 font-semibold">Email</th>
                            <th className="px-3 py-1 text-right text-zinc-500 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {contacts.slice(0, 100).map((c, i) => (
                            <tr key={`${c.email}-${i}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="px-3 py-1 text-zinc-400">{i + 1}</td>
                              <td className="px-3 py-1 font-medium text-zinc-800 dark:text-zinc-200">{c.name}</td>
                              <td className="px-3 py-1 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                              <td className="px-3 py-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeContact(c.email)}
                                  className="text-zinc-400 hover:text-red-500 cursor-pointer p-0.5"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Sender Details Form */}
              {activeSetupTab === "sender" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">From Sending Account</label>
                      <select
                        value={fromEmail}
                        onChange={(e) => {
                          setFromEmail(e.target.value);
                          const chosen = verifiedSenders.find((s) => s.email === e.target.value);
                          if (chosen && chosen.display_name && !fromName) {
                            setFromName(chosen.display_name);
                          }
                        }}
                        className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                      >
                        {verifiedSenders.length === 0 ? (
                          <option value="">Default Mailbox (noreply@genxreality.com)</option>
                        ) : (
                          verifiedSenders.map((s) => (
                            <option key={s.email} value={s.email}>
                              {s.is_smtp
                                ? `⭐ ${s.email} (${(s.provider || "SMTP").toUpperCase()})`
                                : `🌐 ${s.email} (Verified Domain)`}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">Sender Display Name</label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="e.g. Sai Sathwik"
                        className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">Reply-To Address</label>
                      <input
                        type="email"
                        value={replyTo}
                        onChange={(e) => setReplyTo(e.target.value)}
                        placeholder="e.g. support@genxreality.com"
                        className="rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Schedule Form */}
              {activeSetupTab === "schedule" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["now", "later"] as const).map((mode) => (
                      <label
                        key={mode}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 transition ${scheduleMode === mode
                          ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50"
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
                          {mode === "now" ? "Send immediately upon launch" : "Schedule for future date & time"}
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
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10.5px] font-bold uppercase text-zinc-500">Send Time (IST)</label>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* AI Success Toast */}
        {aiSuccessBadge && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span><strong>AI Copy Applied!</strong> Subject line and email body content have been automatically updated.</span>
            </div>
            <button onClick={() => setAiSuccessBadge(false)} className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            3. MAIN WORKSPACE: SPLIT SCREEN (LEFT: EDITOR & AI | RIGHT: LIVE VIEW)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ──────────────────────────────────────────────────────────────────
              LEFT COLUMN: STUDIO EDITOR & AI ASSISTANT CONTROLS (col-span-7)
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-4">

            {/* 1. INLINE AI EMAIL WRITER CARD */}
            <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-transparent rounded-2xl border border-purple-200/80 dark:border-purple-900/50 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-500/25">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight">
                      AI Email Writer &amp; Assistant
                    </h3>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                      Type your goal or select a high-converting intent below
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Full Assistant Modal</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Prompt Input Box */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/80 rounded-xl p-1.5 shadow-2xs">
                <div className="flex items-center flex-1 px-2.5 gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Write a persuasive announcement for our new feature with a 20% discount code..."
                    className="w-full bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none font-medium"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleInlineAIGenerate())}
                  />
                  {aiPrompt && (
                    <button
                      type="button"
                      onClick={() => setAiPrompt("")}
                      className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={aiGenerating || !aiPrompt.trim()}
                  onClick={() => handleInlineAIGenerate()}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold shadow-sm shadow-purple-500/25 transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Writing…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tone Pills & Fast Intent Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">

                {/* Tone Selector */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-zinc-500 text-[10.5px]">Tone:</span>
                  {["Professional", "Friendly", "Persuasive", "Urgent"].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setSelectedTone(tone)}
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition cursor-pointer ${selectedTone === tone
                        ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 font-bold"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50"
                        }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                {/* 1-Click Refine Chips */}
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { label: "✂️ Shorter", prompt: "Make this email more concise, punchy, and under 90 words." },
                    { label: "🎯 Strong CTA", prompt: "Add high-urgency call-to-action button and clear benefits." },
                    { label: "👔 Polish Tone", prompt: "Refine tone to be executive, polished, and authoritative." },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setAiPrompt(item.prompt);
                        handleInlineAIGenerate(item.prompt, "refine");
                      }}
                      className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-900/60 text-zinc-700 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-600 transition cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* 2. EMAIL CONTENT & SUBJECT CARD */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3.5">

              {/* Subject Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Subject Line *
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
                  placeholder="e.g. Special Announcement from GenX Reality"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-900 placeholder-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-white"
                />
              </div>

              {/* ACTION TOOLBAR: Personalization Tokens + Direct Insert Tools */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">

                {/* Left: Token helper pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">Tags:</span>
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

                {/* Right: Direct Inserters (Logo, Image, CTA Button, Social/Branding) */}
                <div className="flex items-center gap-1.5 flex-wrap">

                  {/* Top Logo */}
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                    title="Upload or change top header logo (Optimized 20KB - 100KB)"
                  >
                    <Palette className="h-3 w-3 text-emerald-600" />
                    <span>{branding.logoUrl ? "Change Logo" : "Upload Logo"}</span>
                  </button>

                  {/* Body Image */}
                  <button
                    type="button"
                    onClick={() => editorImageRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                    title="Insert body image with smart compression"
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>Add Image</span>
                  </button>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => setShowButtonModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer"
                    title="Insert customizable CTA button"
                  >
                    <MousePointerClick className="h-3 w-3 text-amber-600" />
                    <span>+ CTA Button</span>
                  </button>

                  {/* Social & Branding Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowSocialDrawer(!showSocialDrawer)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${showSocialDrawer
                      ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300"
                      : "bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                      }`}
                    title="Edit custom social links and branding"
                  >
                    <Share2 className="h-3 w-3 text-purple-600" />
                    <span>Brand &amp; Links</span>
                  </button>

                </div>
              </div>

              {/* Logo Active Status Bar */}
              {branding.logoUrl && (
                <div className="flex items-center justify-between p-2 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={branding.logoUrl}
                      alt="Active Logo"
                      className="h-6 max-w-[80px] object-contain rounded bg-white p-0.5 border border-emerald-200"
                    />
                    <span className="font-semibold truncate">
                      Header Logo Active (Auto-scaled for desktop &amp; mobile)
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

              {/* Social Links & Branding Drawer */}
              {showSocialDrawer && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                      <Palette className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Header Alignment &amp; Social Footer Links</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSocialDrawer(false)}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                    >
                      Done ✓
                    </button>
                  </div>

                  {/* Alignment & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Header Align</label>
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
                              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${active
                                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                                : "text-zinc-500 hover:text-zinc-800"
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
                      <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Company Brand Name</label>
                      <input
                        type="text"
                        value={branding.headerTitle}
                        onChange={(e) => updateBranding({ headerTitle: e.target.value })}
                        placeholder="e.g. GenX Reality"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Header Tagline</label>
                      <input
                        type="text"
                        value={branding.headerSubtitle}
                        onChange={(e) => updateBranding({ headerSubtitle: e.target.value })}
                        placeholder="e.g. AI Automation Platform"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="url"
                      value={branding.socialLinks.website || ""}
                      onChange={(e) => updateBranding({ socialLinks: { ...branding.socialLinks, website: e.target.value } })}
                      placeholder="Website: https://yourcompany.com"
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                    <input
                      type="url"
                      value={branding.socialLinks.linkedin || ""}
                      onChange={(e) => updateBranding({ socialLinks: { ...branding.socialLinks, linkedin: e.target.value } })}
                      placeholder="LinkedIn: https://linkedin.com/in/..."
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                    <input
                      type="url"
                      value={branding.socialLinks.twitter || ""}
                      onChange={(e) => updateBranding({ socialLinks: { ...branding.socialLinks, twitter: e.target.value } })}
                      placeholder="Twitter / X: https://x.com/..."
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                    <input
                      type="url"
                      value={branding.socialLinks.instagram || ""}
                      onChange={(e) => updateBranding({ socialLinks: { ...branding.socialLinks, instagram: e.target.value } })}
                      placeholder="Instagram: https://instagram.com/..."
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Rich Visual WYSIWYG Editor */}
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
                <ReactQuill
                  theme="snow"
                  value={htmlBody}
                  onChange={handleHtmlChange}
                  className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[300px]"
                  placeholder="Write your email body here..."
                />
              </div>

              {/* Bottom Quick Block Inserter Bar */}
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    <span>Add Pre-Styled Layout Blocks</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Click to append block</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                  {[
                    { id: "text", label: "Paragraph", icon: Type },
                    { id: "image", label: "Image", icon: ImageIcon },
                    { id: "button", label: "CTA Button", icon: MousePointerClick },
                    { id: "divider", label: "Divider Line", icon: Minus },
                    { id: "heading", label: "Heading", icon: Heading },
                    { id: "social", label: "Socials", icon: Share2 },
                    { id: "signature", label: "Signature", icon: PenTool },
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
                        <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {blk.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT COLUMN: LIVE EMAIL CLIENT VIEW (PERSISTENT SPLIT SCREEN) (col-span-5)
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-3.5">

            {/* Live Preview Container Card */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-sm space-y-3">

              {/* Preview Header & Device Switcher */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Eye className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white leading-tight">
                      Live Email View
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Real-time synched</span>
                    </div>
                  </div>
                </div>

                {/* Desktop / Mobile Switcher & New Tab */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${previewViewport === "desktop"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      <Laptop className="h-3 w-3" />
                      <span className="hidden sm:inline">Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${previewViewport === "mobile"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-800"
                        }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span className="hidden sm:inline">Mobile</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 transition cursor-pointer"
                    title="Open in full browser window tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulated Email Client Frame */}
              <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50 dark:bg-[#070A10] overflow-hidden shadow-sm">

                {/* Simulated Inbox Header Bar */}
                <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Subject: <span className="font-bold text-zinc-900 dark:text-white">{resolveTextTokens(subject) || "No subject"}</span>
                    </span>
                    <span>Just now</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <div className="truncate">
                      <strong>From:</strong> {fromName || "Company"} &lt;{fromEmail || "noreply@genxreality.com"}&gt;
                    </div>
                    <div className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                      To: John Doe
                    </div>
                  </div>
                </div>

                {/* Rendered Email Frame: Desktop or Mobile bezel */}
                <div className="p-2 sm:p-3 overflow-y-auto flex items-center justify-center bg-zinc-100/60 dark:bg-zinc-950/60">
                  {previewViewport === "mobile" ? (
                    <div className="w-[330px] max-w-full bg-zinc-900 rounded-[36px] p-2.5 shadow-xl border-4 border-zinc-700 relative my-2">
                      <div className="w-16 h-3 bg-zinc-800 rounded-full mx-auto mb-2" />
                      <div className="w-full bg-white dark:bg-[#0A0D14] rounded-[24px] overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        <iframe
                          srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                          className="w-full border-0 bg-transparent block"
                          style={{ height: "460px" }}
                          title="Email Studio Mobile Live View"
                          sandbox="allow-same-origin allow-popups"
                        />
                      </div>
                      <div className="w-20 h-1 bg-zinc-600 rounded-full mx-auto mt-2" />
                    </div>
                  ) : (
                    <div className="w-full bg-white dark:bg-[#0A0D14] rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
                      <iframe
                        srcDoc={formatEmailDocumentHtml(htmlBody, subject, branding)}
                        className="w-full border-0 bg-transparent block"
                        style={{ height: "500px" }}
                        title="Email Studio Desktop Live View"
                        sandbox="allow-same-origin allow-popups"
                      />
                    </div>
                  )}
                </div>

              </div>

              {/* 1-Click Send Test Email Tool */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <SendHorizontal className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Send Test Email</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Preview in your real inbox</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="Enter your email (e.g. you@company.com)"
                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                  <button
                    type="button"
                    disabled={sendingTestEmail || !testEmailInput.trim()}
                    onClick={handleSendTestEmail}
                    className="flex items-center gap-1 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingTestEmail ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <span>Send Test</span>
                    )}
                  </button>
                </div>

                {testEmailSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Test email sent successfully! Check your inbox.</span>
                  </p>
                )}
                {testEmailError && (
                  <p className="text-[11px] text-red-500">{testEmailError}</p>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: TEMPLATE LIBRARY PICKER
        ══════════════════════════════════════════════════════════════════════ */}
        {showTemplatePicker && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#0E131F] w-full max-w-4xl max-h-[85vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">

              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Marketing Email Templates</h3>
                    <p className="text-[11px] text-zinc-500">Pick a high-converting layout to load into the studio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplatePicker(false)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingTemplates ? (
                  <div className="p-12 text-center text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="text-xs">Loading template designs…</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="p-12 text-center text-zinc-400 text-xs">No templates found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 space-y-2.5 hover:border-indigo-500 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            {tpl.category}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white group-hover:text-indigo-600 transition">
                            {tpl.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-2">{tpl.subject}</p>
                        </div>
                        <button
                          type="button"
                          className="w-full mt-2 py-1.5 text-xs font-semibold rounded-xl bg-zinc-50 group-hover:bg-indigo-600 text-zinc-700 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 transition"
                        >
                          Use This Template &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: BODY IMAGE INSERT WITH 20KB - 100KB COMPRESSION
        ══════════════════════════════════════════════════════════════════════ */}
        {showImageUploadModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Insert Image into Email Body</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImageUploadModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {imageModalUrl && (
                <div className="space-y-2">
                  <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl flex items-center justify-center max-h-48 overflow-hidden">
                    <img src={imageModalUrl} alt={imageModalAlt || "Preview"} className="max-h-44 object-contain rounded-lg" />
                  </div>
                  {imageSizeStatus && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 text-center">
                      {imageSizeStatus}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Alt Text / Description</label>
                  <input
                    type="text"
                    value={imageModalAlt}
                    onChange={(e) => setImageModalAlt(e.target.value)}
                    placeholder="e.g. Product Feature Announcement Banner"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Link URL (Optional)</label>
                  <input
                    type="url"
                    value={imageModalLink}
                    onChange={(e) => setImageModalLink(e.target.value)}
                    placeholder="e.g. https://yourcompany.com/product"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Alignment</label>
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
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Size / Width</label>
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
            MODAL: CTA BUTTON INSERTER
        ══════════════════════════════════════════════════════════════════════ */}
        {showButtonModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Insert Call-to-Action Button</h3>
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
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Button Text</label>
                  <input
                    type="text"
                    value={buttonModalText}
                    onChange={(e) => setButtonModalText(e.target.value)}
                    placeholder="e.g. Learn More & Get Started →"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Destination Link URL</label>
                  <input
                    type="url"
                    value={buttonModalUrl}
                    onChange={(e) => setButtonModalUrl(e.target.value)}
                    placeholder="e.g. https://genxreality.com"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Theme Color</label>
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
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${buttonModalColor === theme.color
                          ? "ring-2 ring-indigo-500 border-transparent text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                          }`}
                        style={{ backgroundColor: buttonModalColor === theme.color ? theme.color : undefined }}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.color }} />
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-center border border-zinc-200/80 dark:border-zinc-700">
                  <span className="text-[10px] text-zinc-400 block mb-1">Preview:</span>
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

        {/* ── AI Assistant Interactive Full Modal ── */}
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
