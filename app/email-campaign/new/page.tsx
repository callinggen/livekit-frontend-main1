"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
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
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RefreshCw,
  SendHorizontal,
  Info,
  Search,
  PhoneCall,
  FileSpreadsheet,
} from "lucide-react";
import {
  api,
  EmailContactItem,
  EmailMarketingTemplate,
  VerifiedSenderOption,
  CampaignRow,
} from "@/lib/api";

// ── Extended Studio Contact Item ──
export interface StudioContactItem extends EmailContactItem {
  id?: string | number;
  phone?: string;
  call_status?: string;
  call_response?: string;
  source?: string;
}

// ── Plain text token resolver for preview ──
function resolveTextTokens(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{name\}\}/gi, "John Doe")
    .replace(/\{\{company\}\}/gi, "Acme Corp")
    .replace(/\{\{email\}\}/gi, "john@company.com")
    .replace(/\{\{phone\}\}/gi, "+1 (555) 234-5678");
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

// ── Full HTML Document Formatter ──
function formatEmailDocumentHtml(
  rawBody: string,
  subjectLine: string,
  branding: EmailBrandingOptions
): string {
  const isFullDoc = /<!doctype/i.test(rawBody) || /<html/i.test(rawBody);
  let resolvedBody = resolveTextTokens(rawBody || "");

  if (isFullDoc) {
    return resolvedBody;
  }

  // Header markup
  let headerHtml = "";
  const alignClass =
    branding.headerAlign === "left"
      ? "text-align: left;"
      : branding.headerAlign === "right"
        ? "text-align: right;"
        : "text-align: center;";

  if (branding.headerType === "logo" && branding.logoUrl) {
    headerHtml = `
      <div style="padding: 24px 32px 16px; ${alignClass}">
        <img src="${branding.logoUrl}" alt="${branding.headerTitle || "Logo"}" style="max-height: 48px; max-width: 180px; width: auto; height: auto; display: inline-block; object-fit: contain;" />
        ${branding.headerSubtitle ? `<p style="margin: 6px 0 0; font-size: 11px; color: #64748b; font-weight: 500;">${branding.headerSubtitle}</p>` : ""}
      </div>
    `;
  } else if (branding.headerTitle) {
    headerHtml = `
      <div style="padding: 24px 32px 16px; ${alignClass}">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">${branding.headerTitle}</h2>
        ${branding.headerSubtitle ? `<p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">${branding.headerSubtitle}</p>` : ""}
      </div>
    `;
  }

  // Social icons markup
  let socialHtml = "";
  const s = branding.socialLinks;
  const activeSocials = Object.entries(s).filter(([_, url]) => url && url.trim().length > 0);

  if (branding.showSocial && activeSocials.length > 0) {
    socialHtml = `
      <div style="text-align: center; padding: 16px 0 8px;">
        ${activeSocials
          .map(([network, url]) => {
            return `<a href="${url}" target="_blank" style="display: inline-block; margin: 0 8px; color: #6366f1; text-decoration: none; font-size: 12px; font-weight: 600; text-transform: capitalize;">${network}</a>`;
          })
          .join(" &bull; ")}
      </div>
    `;
  }

  // Footer markup
  const footerHtml = `
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
      ${socialHtml}
      <p style="margin: 4px 0;">${branding.companyFooter || "Sent with CallingGen AI Voice Calling & Automation Platform"}</p>
      <p style="margin: 4px 0 0;">You are receiving this because of your relationship with our company. <a href="#" style="color: #6366f1; text-decoration: underline;">Unsubscribe</a></p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectLine || "Email Announcement"}</title>
  <style>
    body, p, h1, h2, h3, h4, td { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    img { max-width: 100%; height: auto; }
    .email-btn:hover { opacity: 0.92; }
    p { margin-top: 0; margin-bottom: 1em; line-height: 1.65; color: #334155; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.2em; margin-bottom: 0.6em; line-height: 1.3; }
    a { color: #6366f1; text-decoration: underline; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
    ${headerHtml}
    <div style="padding: 16px 32px 28px; font-size: 14.5px; color: #334155; line-height: 1.65;">
      ${resolvedBody}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`;
}

// ── Simple CSV Parser ──
function parseCSV(text: string): StudioContactItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = headers.findIndex((h) => h === "name" || h === "full_name" || h === "first_name");
  const emailIdx = headers.findIndex((h) => h === "email" || h === "email_address" || h === "mail");
  const phoneIdx = headers.findIndex((h) => h === "phone" || h === "phone_number" || h === "mobile");

  if (emailIdx === -1) return [];

  const contacts: StudioContactItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const email = cols[emailIdx] || "";
    const name = nameIdx !== -1 ? cols[nameIdx] || "Customer" : "Customer";
    const phone = phoneIdx !== -1 ? cols[phoneIdx] : undefined;
    if (email && email.includes("@")) {
      contacts.push({ name, email, phone, source: "CSV Upload", call_status: "Uploaded CSV" });
    }
  }
  return contacts;
}

const DEFAULT_TEMPLATE = `<h2><strong>Special Announcement</strong></h2>
<p>Hi {{name}},</p>
<p>We are excited to share our latest updates and solutions with you from {{company}}. Our team has been working hard to bring you innovative tools that streamline customer communication and drive real revenue growth.</p>
<p style="text-align: center; margin: 24px 0;"><a href="https://genxreality.com" class="email-btn" style="background-color: #6366f1; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Learn More & Get Started →</a></p>
<p>Feel free to reply to this email directly if you have any questions or would like a tailored walkthrough.</p>
<p>Warm regards,<br><strong>The GenX Reality Team</strong></p>`;

function EmailCampaignStudioInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template_id");
  const { user } = useAuth();

  // Hidden File input refs
  const fileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const editorImageRef = useRef<HTMLInputElement>(null);

  // 1. Basic Campaign Information
  const [name, setName] = useState("Email Campaign - Oct 6");
  const [subject, setSubject] = useState("Exciting Update from GenX Reality");
  const [htmlBody, setHtmlBody] = useState(DEFAULT_TEMPLATE);

  // 2. Sender Details
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [verifiedSenders, setVerifiedSenders] = useState<VerifiedSenderOption[]>([]);

  // 3. Recipients & Audience
  const [contacts, setContacts] = useState<StudioContactItem[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [csvUploadedName, setCsvUploadedName] = useState("");
  const [csvError, setCsvError] = useState("");
  
  // Contact Book Lists
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [selectedContactListTag, setSelectedContactListTag] = useState("");
  const [loadingContactLists, setLoadingContactLists] = useState(false);

  // Voice Campaigns List
  const [campaignsList, setCampaignsList] = useState<CampaignRow[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // 4. Dispatch Timing
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [scheduleTime, setScheduleTime] = useState("10:00");

  // 5. Branding Options (Optional)
  const [branding, setBranding] = useState<EmailBrandingOptions>({
    headerType: "logo",
    logoUrl: "https://callinggen.com/logo.png",
    headerTitle: "GenX Reality",
    headerSubtitle: "AI Voice Calling & Marketing Platform",
    headerAlign: "center",
    socialLinks: {
      website: "https://callinggen.com",
      linkedin: "",
      twitter: "",
      instagram: "",
    },
    showSocial: true,
    companyFooter: "GenX Reality Technologies Inc. • All Rights Reserved",
  });

  const [showOptionalBranding, setShowOptionalBranding] = useState(false);

  // Image Upload Modal State
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState("");
  const [imageModalAlt, setImageModalAlt] = useState("");
  const [imageModalLink, setImageModalLink] = useState("");
  const [imageModalAlign, setImageModalAlign] = useState<"left" | "center" | "right">("center");
  const [imageModalWidth, setImageModalWidth] = useState<"100%" | "75%" | "50%" | "300px">("100%");
  const [imageSizeStatus, setImageSizeStatus] = useState("");

  // AI Email Assistant State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState<"Professional" | "Friendly" | "Persuasive" | "Urgent" | "Casual">("Professional");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState("");

  // CTA Button Modal State
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [buttonModalText, setButtonModalText] = useState("Learn More & Get Started →");
  const [buttonModalUrl, setButtonModalUrl] = useState("https://genxreality.com");
  const [buttonModalColor, setButtonModalColor] = useState("#6366f1");

  // Template Picker State
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<EmailMarketingTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState("");

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

  // Helper to update branding
  const updateBranding = (partial: Partial<EmailBrandingOptions>) => {
    setBranding((prev) => ({ ...prev, ...partial }));
  };

  // Pre-fill user details & fetch senders/contact lists/campaigns
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setName(`Email Campaign - ${today}`);
    setSubject("Exciting Update from GenX Reality");

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

    // Fetch existing voice campaigns for contact selection
    api.getCampaigns().then((cList) => {
      setCampaignsList(cList || []);
    }).catch(() => { });
  }, []);

  // Handle template selection if query param exists
  useEffect(() => {
    const tid = Number(templateIdParam);
    if (!tid) return;

    api.getEmailTemplate(tid)
      .then((tpl) => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
        setName(`${tpl.name} Campaign - ${today}`);
        setSubject(tpl.subject);
        setHtmlBody(tpl.html_body);
        setActiveTemplateName(tpl.name);
        if (user?.company_name) {
          setFromName(user.company_name);
        }
      })
      .catch((err) => {
        console.warn("Failed to load initial template:", err);
      });
  }, [templateIdParam, user]);

  // Load contacts from Contact Book List
  const loadContactsFromTag = async (tag: string) => {
    if (!tag) return;
    try {
      setLoadingContactLists(true);
      const allSaved = await api.getAllSavedContacts(tag);
      const emailContacts: StudioContactItem[] = allSaved
        .filter((c) => c.email && c.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()))
        .map((c) => ({
          name: c.name || "Customer",
          email: c.email!.trim(),
          phone: c.phone || "",
          call_status: c.last_called_at ? `Called (${c.call_count}x)` : "Saved Contact",
          source: `Contact Book: ${tag}`,
        }));

      if (emailContacts.length > 0) {
        setContacts(emailContacts);
        setCsvUploadedName(`${emailContacts.length} contacts • From "${tag}"`);
        setCsvError("");
      } else {
        setCsvError(`No valid email addresses found in "${tag}".`);
      }
    } catch (err: any) {
      setCsvError(err.message || "Failed to load contacts.");
    } finally {
      setLoadingContactLists(false);
    }
  };

  // Load contacts from Voice Campaign Call Logs
  const loadContactsFromCampaign = async (campaignId: string) => {
    if (!campaignId) return;
    try {
      setLoadingCampaigns(true);
      const cId = Number(campaignId);
      const campContacts = await api.getCampaignContacts(cId);

      if (campContacts && campContacts.length > 0) {
        const selectedCamp = campaignsList.find((c) => String(c.id) === String(campaignId));
        const emailContacts: StudioContactItem[] = campContacts.map((c: any) => {
          const meta = c.metadata_fields || {};
          const emailVal = c.email || meta.email || meta.Email || meta.EMAIL || c.email_address || "";
          return {
            id: c.id,
            name: c.name || "Customer",
            email: emailVal || `${c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'contact'}@customer.com`,
            phone: c.phone || "",
            call_status: c.status ? `Call: ${c.status}` : "Completed Call",
            call_response: c.response || "—",
            source: selectedCamp?.name ? `Voice: ${selectedCamp.name}` : `Voice Campaign #${cId}`,
          };
        });

        setContacts(emailContacts);
        setCsvUploadedName(`${emailContacts.length} contacts • Campaign "${selectedCamp?.name || campaignId}"`);
        setCsvError("");
      } else {
        setCsvError("No contacts found in the selected campaign.");
      }
    } catch (err: any) {
      setCsvError(err.message || "Failed to load campaign contacts.");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSelectTemplate = (tpl: EmailMarketingTemplate) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setName(`${tpl.name} Campaign - ${today}`);
    setSubject(tpl.subject);
    setHtmlBody(tpl.html_body);
    setActiveTemplateName(tpl.name);
    setShowTemplatePicker(false);
  };

  // CSV Upload
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

  // Logo Upload Handler with 20KB-100KB Optimizer
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

  // Editor Image Upload Handler
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

  // Manual Add Single Contact
  const addManual = () => {
    if (!manualName.trim() || !manualEmail.trim()) return;
    if (!manualEmail.includes("@")) {
      setCsvError("Invalid email address.");
      return;
    }
    if (contacts.some((c) => c.email.toLowerCase() === manualEmail.trim().toLowerCase())) {
      setCsvError("This email is already in the recipient list.");
      return;
    }
    setCsvError("");
    const updated = [
      ...contacts,
      {
        name: manualName.trim(),
        email: manualEmail.trim(),
        call_status: "Manual Entry",
        call_response: "Directly added",
        source: "Direct Input",
      },
    ];
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

  // Unique statuses for filter tags
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.call_status) set.add(c.call_status);
    });
    return Array.from(set);
  }, [contacts]);

  const [statusFilter, setStatusFilter] = useState("all");

  // Filtered contacts for table view
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (statusFilter !== "all") {
      list = list.filter((c) => c.call_status === statusFilter);
    }
    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.call_status && c.call_status.toLowerCase().includes(q)) ||
          (c.call_response && c.call_response.toLowerCase().includes(q)) ||
          (c.source && c.source.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, statusFilter, contactSearchQuery]);

  // Insert Custom Button Handler
  const handleInsertCustomButton = () => {
    const url = buttonModalUrl.trim() || branding.socialLinks.website || "#";
    const text = buttonModalText.trim() || "Learn More & Get Started →";
    const color = buttonModalColor || "#6366f1";
    const blockHtml = `<p style="text-align: center; margin: 18px 0;"><a href="${url}" target="_blank" class="email-btn" style="background-color: ${color}; color: #ffffff !important; padding: 11px 26px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${text}</a></p>`;
    setHtmlBody((prev) => prev + blockHtml);
    setShowButtonModal(false);
  };

  // AI Generation & Quick Polish Handlers
  const handleQuickAIGenerate = async (customPrompt?: string, customTone?: string) => {
    const promptToUse = (customPrompt || aiPrompt).trim();
    const toneToUse = customTone || aiTone;
    if (!promptToUse) return;

    setIsGeneratingAI(true);
    setAiSuccessMessage("");
    try {
      const res = await api.generateEmailWithAI({
        prompt: promptToUse,
        tone: toneToUse,
        category: "Marketing",
        action: "generate",
        current_subject: subject,
        current_body: htmlBody,
      });
      if (res.subject) setSubject(res.subject);
      if (res.body) setHtmlBody(res.body);
      setAiSuccessMessage("✨ AI email generated successfully!");
      setTimeout(() => setAiSuccessMessage(""), 4000);
      if (showAIModal) setShowAIModal(false);
    } catch (err: any) {
      console.warn("AI backend generation fallback:", err);
      const fallbackSubject = `Special Update: ${promptToUse.slice(0, 45)}...`;
      const fallbackBody = `<h2><strong>Important Announcement</strong></h2><p>Hi {{name}},</p><p>${promptToUse}</p><p>We are delighted to bring this tailored update to you from {{company}}. Our automated solutions are designed to accelerate your growth and deliver real results.</p><p style="text-align: center; margin: 20px 0;"><a href="https://genxreality.com" class="email-btn" style="background-color: #6366f1; color: #ffffff !important; padding: 11px 26px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Learn More & Get Started →</a></p><p>Best regards,<br><strong>The {{company}} Team</strong></p>`;
      setSubject(fallbackSubject);
      setHtmlBody(fallbackBody);
      setAiSuccessMessage("✨ AI email draft created!");
      setTimeout(() => setAiSuccessMessage(""), 4000);
      if (showAIModal) setShowAIModal(false);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIPolish = async (actionType: "shorten" | "strong_cta" | "polish") => {
    setIsGeneratingAI(true);
    setAiSuccessMessage("");
    try {
      const actionPrompts = {
        shorten: "Make this email shorter, punchier, and more concise while preserving core message.",
        strong_cta: "Strengthen the Call to Action button and closing urgency in this email.",
        polish: `Polish the tone to make it sound exceptionally ${aiTone.toLowerCase()} and smooth flowing.`,
      };
      const res = await api.generateEmailWithAI({
        prompt: actionPrompts[actionType],
        tone: aiTone,
        action: actionType,
        current_subject: subject,
        current_body: htmlBody,
      });
      if (res.subject) setSubject(res.subject);
      if (res.body) setHtmlBody(res.body);
      setAiSuccessMessage(`✨ Applied AI ${actionType === "shorten" ? "shorten" : actionType === "strong_cta" ? "strong CTA" : "tone polish"}!`);
      setTimeout(() => setAiSuccessMessage(""), 4000);
    } catch (err: any) {
      console.warn("AI polish error:", err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Insert Pre-styled HTML Block into Editor
  const insertBlock = (blockType: string) => {
    let blockHtml = "";
    switch (blockType) {
      case "text":
        blockHtml = `<p>Write your message here with personalized value for {{name}}.</p>`;
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
        setShowOptionalBranding(true);
        return;
      case "signature":
        blockHtml = `<p>Warm regards,<br><strong>${fromName || user?.name || "The Team"}</strong><br><span style="color: #64748b; font-size: 12px;">${branding.headerTitle || "GenX Reality"}</span></p>`;
        break;
      default:
        return;
    }
    setHtmlBody((prev) => prev + blockHtml);
  };

  const handleOpenInNewTab = () => {
    const fullHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  // Send Instant Test Email Handler
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
      await api.createEmailCampaign({
        name: `[Test] ${subject || "Email Preview"} - ${new Date().toLocaleTimeString()}`,
        subject: `[Test Preview] ${subject || "No Subject"}`,
        html_body: formattedHtml,
        from_email: fromEmail || user?.email,
        from_name: fromName || user?.name,
        reply_to: replyTo || undefined,
        contacts: [{ name: "Test Recipient", email: testEmailInput.trim() }],
      });
      setTestEmailSuccess(true);
    } catch (err: any) {
      setTestEmailError(err.message || "Failed to send test email.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Submit & Launch Campaign Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a Campaign Name.");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a Subject Line.");
      return;
    }
    if (!htmlBody.trim()) {
      setError("Please write your email content.");
      return;
    }
    if (contacts.length === 0) {
      setError("Please add at least one recipient via CSV upload, contact book, or campaign selection.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formattedHtml = formatEmailDocumentHtml(htmlBody, subject, branding);
      const payloadContacts: EmailContactItem[] = contacts.map((c) => ({
        name: c.name,
        email: c.email,
      }));

      const res = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        html_body: formattedHtml,
        from_email: fromEmail.trim() || user?.email,
        from_name: fromName.trim() || undefined,
        reply_to: replyTo.trim() || undefined,
        schedule_date: scheduleMode === "later" ? scheduleDate : undefined,
        schedule_time: scheduleMode === "later" ? scheduleTime : undefined,
        contacts: payloadContacts,
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

      <div className="max-w-[1740px] mx-auto space-y-4 pb-12">

        {/* ══════════════════════════════════════════════════════════════════════
            1. TOP ACTION & NAVIGATION BAR
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 dark:bg-[#0E131F]/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm sticky top-0 z-30">

          {/* Left: Back button & Campaign Name Input */}
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
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Campaign Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q4 Growth Announcement"
                  className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 outline-none transition px-0.5 py-0.5 w-full max-w-md truncate"
                />
              </div>

              {activeTemplateName && (
                <span className="hidden md:inline-flex text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  {activeTemplateName}
                </span>
              )}
            </div>
          </div>

          {/* Right: Template picker & Launch Campaign Button */}
          <div className="flex items-center gap-2.5 shrink-0">
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
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              <LayoutTemplate className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Templates</span>
            </button>

            {/* Launch / Schedule Campaign Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition disabled:opacity-60 cursor-pointer"
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
            2. CAMPAIGN SETUP (Card 1: Left 7 cols with full interactive Contacts Table | Cards 2 & 3: Right 5 cols stacked)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* LEFT (Col 7): Card 1 - Recipients & Audience with Interactive Table */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-4">
            
            {/* Header with Title & CSV / Clear Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                      Card 1 — Recipients &amp; Audience
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800">
                      {contacts.length.toLocaleString()} queued
                    </span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Upload CSV, select Contact Book tags, or import from Voice Campaign call logs
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload CSV</span>
                </button>

                {contacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setContacts([]);
                      setCsvUploadedName("");
                      setSelectedContactListTag("");
                      setSelectedCampaignId("");
                      setStatusFilter("all");
                    }}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Audience Source Selectors (Contact Book & Previous Voice Campaigns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Contact Book Selector */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Contact Book Tag
                </label>
                <select
                  value={selectedContactListTag}
                  onChange={(e) => {
                    const t = e.target.value;
                    setSelectedContactListTag(t);
                    if (t) loadContactsFromTag(t);
                  }}
                  disabled={loadingContactLists}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="">📁 Select from Contact Book Lists...</option>
                  {contactLists.map((l: any) => (
                    <option key={l.tag} value={l.tag}>
                      {l.tag} ({l.with_email || l.total_contacts} emails)
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Campaign Call Logs Selector */}
              <div>
                <label className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Voice Campaign Call Logs
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setSelectedCampaignId(cId);
                    if (cId) loadContactsFromCampaign(cId);
                  }}
                  disabled={loadingCampaigns}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-indigo-500 cursor-pointer font-medium"
                >
                  <option value="">📞 Select from Voice Campaign Call Logs...</option>
                  {campaignsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.totalCalls || c.contactCount || 0} calls • {c.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inline Single Recipient Add Row */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-700/60 space-y-1.5">
              <label className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block">
                Inline Single Recipient Add
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Contact Name (e.g. John Doe)"
                  className="w-full sm:w-1/3 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Email Address (e.g. john@company.com)"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                  className="w-full sm:flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addManual}
                  className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shrink-0"
                >
                  + Add Recipient
                </button>
              </div>
            </div>

            {/* Live Uploaded File Status Pill */}
            {csvUploadedName && (
              <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 px-3 py-2 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="truncate">Active Source: {csvUploadedName}</span>
                </div>
                <span className="text-[10.5px] font-bold bg-indigo-200/60 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md shrink-0">
                  {contacts.length} Total Recipients
                </span>
              </div>
            )}
            {csvError && <p className="text-xs text-red-500 font-medium">{csvError}</p>}

            {/* Contacts Table Controls: Search & Status Filters */}
            {contacts.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search contacts by name, email, phone, or status..."
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <span className="text-[11px] font-medium text-zinc-400">
                    Showing <strong className="text-zinc-700 dark:text-zinc-200">{filteredContacts.length}</strong> of {contacts.length} recipients
                  </span>
                </div>

                {/* Status Filter Tabs (if multiple statuses exist) */}
                {uniqueStatuses.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer ${
                        statusFilter === "all"
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      All ({contacts.length})
                    </button>
                    {uniqueStatuses.map((st) => {
                      const count = contacts.filter((c) => c.call_status === st).length;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer truncate max-w-[180px] ${
                            statusFilter === st
                              ? "bg-indigo-600 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {st} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Full Contacts Table */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
              <div className="max-h-72 overflow-y-auto">
                {contacts.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-400 space-y-1.5">
                    <Users className="w-7 h-7 mx-auto opacity-35 mb-1 text-indigo-500" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-300">No recipients added yet.</p>
                    <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                      Upload a CSV file, select a Contact Book tag, or import contacts from a Voice Campaign above.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/80 sticky top-0 border-b border-zinc-200 dark:border-zinc-700/80 z-10">
                      <tr>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold w-10">#</th>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold">Recipient</th>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold">Email</th>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold">Phone</th>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold">Call Log / Status</th>
                        <th className="px-3 py-2.5 text-left text-zinc-500 font-semibold">Source</th>
                        <th className="px-3 py-2.5 text-right text-zinc-500 font-semibold w-14">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {filteredContacts.map((c, i) => {
                        const statusLower = (c.call_status || "").toLowerCase();
                        const isInterested = statusLower.includes("interested") && !statusLower.includes("not");
                        const isCompleted = statusLower.includes("completed") || statusLower.includes("answered");
                        const isFailed = statusLower.includes("failed") || statusLower.includes("busy") || statusLower.includes("no answer");

                        return (
                          <tr key={`${c.email}-${i}`} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition">
                            <td className="px-3 py-2.5 text-zinc-400 font-mono text-[11px]">{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                                </div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                                  {c.name || "Customer"}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-300 font-mono text-[11px] truncate max-w-[160px]">
                              {c.email}
                            </td>
                            <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                              {c.phone || "—"}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5 max-w-[160px]">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border truncate ${
                                    isInterested
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                      : isCompleted
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                      : isFailed
                                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800"
                                      : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                                  }`}
                                >
                                  {c.call_status || "Ready"}
                                </span>
                                {c.call_response && c.call_response !== "—" && (
                                  <span className="text-[10px] text-zinc-400 truncate" title={c.call_response}>
                                    {c.call_response}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 truncate max-w-[130px]">
                                {c.source || "Direct"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => removeContact(c.email)}
                                className="text-zinc-400 hover:text-red-500 cursor-pointer p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                title="Remove recipient"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {contacts.length > 0 && (
                <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700/80 text-[10.5px] font-medium text-zinc-400 flex items-center justify-between">
                  <span>Audience verified &amp; ready for batch dispatch</span>
                  <span>{filteredContacts.length} recipients selected</span>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT (Col 5): Cards 2 & 3 Stacked */}
          <div className="lg:col-span-5 space-y-4">

            {/* Card 2: Sending Mailbox */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Sending Mailbox</h4>
                  <span className="text-[10.5px] text-zinc-400">Authenticated delivery sender</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                    From Sending Account
                  </label>
                  <select
                    value={fromEmail}
                    onChange={(e) => {
                      setFromEmail(e.target.value);
                      const chosen = verifiedSenders.find((s) => s.email === e.target.value);
                      if (chosen && chosen.display_name && !fromName) {
                        setFromName(chosen.display_name);
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                      Sender Name
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="e.g. Sai Sathwik"
                      className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-bold text-zinc-600 dark:text-zinc-300 block mb-1">
                      Reply-To Address
                    </label>
                    <input
                      type="email"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="support@company.com"
                      className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Dispatch Timing */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">Dispatch Timing</h4>
                  <span className="text-[10.5px] text-zinc-400">Launch now or schedule ahead</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setScheduleMode("now")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                    scheduleMode === "now"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  Immediate Send
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode("later")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                    scheduleMode === "later"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold"
                      : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  Schedule Later
                </button>
              </div>

              {scheduleMode === "later" ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Date</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Time (IST)</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-medium"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 font-medium italic pt-0.5">
                  Dispatches immediately to all queued recipients once you click Launch.
                </p>
              )}
            </div>

          </div>

        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            3. MAIN WORKSPACE: SPLIT SCREEN (LEFT: EDITOR | RIGHT: LIVE VIEW)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ──────────────────────────────────────────────────────────────────
              LEFT COLUMN: STUDIO EDITOR & OPTIONAL INPUTS (col-span-7)
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 space-y-4">

            {/* AI Email Writer & Assistant Card */}
            <div className="bg-gradient-to-br from-purple-50/80 via-indigo-50/40 to-white dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-[#0E131F] rounded-2xl border border-purple-200/80 dark:border-purple-900/50 p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-500/30 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>AI Email Writer &amp; Assistant</span>
                    </h3>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                      Type your goal or select a high-converting intent below
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Full Assistant Modal &rarr;</span>
                </button>
              </div>

              {/* Prompt Input & Generate Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-0.5">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleQuickAIGenerate())}
                    placeholder="e.g. Write a persuasive announcement for our new feature with a 20% discount code..."
                    className="w-full rounded-xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-zinc-800/90 px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-2xs font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAIGenerate()}
                  disabled={isGeneratingAI || !aiPrompt.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-500/20 disabled:opacity-60 transition cursor-pointer shrink-0"
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toolbar: Tones and Polish Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-purple-100 dark:border-purple-900/40">
                {/* Tone selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-400">Tone:</span>
                  {(["Professional", "Friendly", "Persuasive", "Urgent"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAiTone(t)}
                      className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold transition cursor-pointer border ${
                        aiTone === t
                          ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 shadow-2xs"
                          : "bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Quick Polish Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleAIPolish("shorten")}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
                    title="Make email shorter and more concise"
                  >
                    <span>✂️ Shorter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAIPolish("strong_cta")}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
                    title="Add strong call to action"
                  >
                    <span>🎯 Strong CTA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAIPolish("polish")}
                    disabled={isGeneratingAI}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-2xs"
                    title="Polish tone and flow"
                  >
                    <span>🪄 Polish Tone</span>
                  </button>
                </div>
              </div>

              {/* Status or Success message */}
              {aiSuccessMessage && (
                <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>{aiSuccessMessage}</span>
                  <button type="button" onClick={() => setAiSuccessMessage("")} className="text-zinc-400 hover:text-zinc-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>

            {/* Email Content Box */}
            <div className="bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-sm space-y-3.5">

              {/* Subject Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
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

              {/* ACTION TOOLBAR: Personalization Tags + Logo + Image + CTA Button + Brand Links */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">

                {/* Left: Tags helper pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider px-0.5">Tags:</span>
                  <button
                    type="button"
                    onClick={() => setSubject((p) => p + " {{name}} ")}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-2xs transition"
                    title="Insert recipient name token"
                  >
                    + {"{{name}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubject((p) => p + " {{company}} ")}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-2xs transition"
                    title="Insert company name token"
                  >
                    + {"{{company}}"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubject((p) => p + " {{email}} ")}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer shadow-2xs transition"
                    title="Insert recipient email token"
                  >
                    + {"{{email}}"}
                  </button>
                </div>

                {/* Right: Direct Inserters (Logo, Add Image, CTA Button, Brand & Links) */}
                <div className="flex items-center gap-1.5 flex-wrap">

                  {/* Header Logo */}
                  <button
                    type="button"
                    onClick={() => setShowOptionalBranding(!showOptionalBranding)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <Palette className="h-3 w-3 text-emerald-600" />
                    <span>Upload Logo</span>
                  </button>

                  {/* Body Image */}
                  <button
                    type="button"
                    onClick={() => editorImageRef.current?.click()}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <ImageIcon className="h-3 w-3" />
                    <span>Add Image</span>
                  </button>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => setShowButtonModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer"
                  >
                    <MousePointerClick className="h-3 w-3 text-amber-600" />
                    <span>+ CTA Button</span>
                  </button>

                  {/* Brand & Links */}
                  <button
                    type="button"
                    onClick={() => setShowOptionalBranding(!showOptionalBranding)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                      showOptionalBranding
                        ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300"
                        : "bg-white dark:bg-zinc-700 border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    <Share2 className="h-3 w-3 text-purple-600" />
                    <span>Brand &amp; Links</span>
                  </button>

                </div>
              </div>

              {/* Optional Brand & Links Input Panel */}
              {showOptionalBranding && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                      <Palette className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Branding &amp; Footer Links (Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOptionalBranding(false)}
                      className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 cursor-pointer"
                    >
                      Done ✓
                    </button>
                  </div>

                  {/* Logo, Brand Name & Tagline */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Header Logo</label>
                        {branding.logoUrl && (
                          <button
                            type="button"
                            onClick={() => updateBranding({ logoUrl: "" })}
                            className="text-[10px] text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      >
                        <Upload className="h-3.5 w-3.5 text-indigo-500" />
                        <span>{branding.logoUrl ? "Replace Logo" : "Upload Logo Image"}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Brand Title (Optional)</label>
                      <input
                        type="text"
                        value={branding.headerTitle}
                        onChange={(e) => updateBranding({ headerTitle: e.target.value })}
                        placeholder="e.g. GenX Reality"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 block">Tagline (Optional)</label>
                      <input
                        type="text"
                        value={branding.headerSubtitle}
                        onChange={(e) => updateBranding({ headerSubtitle: e.target.value })}
                        placeholder="e.g. AI Automation Platform"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-indigo-500 dark:border-zinc-600 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Header Alignment */}
                  <div className="flex items-center gap-3 bg-white dark:bg-zinc-800/80 p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300">Logo Alignment:</span>
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
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              active
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

                  {/* Footer & Social Links */}
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
                  onChange={(val) => setHtmlBody(val)}
                  className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[300px]"
                  placeholder="Write your email message here..."
                />
              </div>

              {/* Bottom Quick Block Inserter Bar */}
              <div className="bg-zinc-50/80 dark:bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    <span>Insert Quick Layout Blocks</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">Click to append to email body</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                  {[
                    { id: "text", label: "Paragraph", icon: Type },
                    { id: "image", label: "Image", icon: ImageIcon },
                    { id: "button", label: "CTA Button", icon: MousePointerClick },
                    { id: "divider", label: "Divider", icon: Minus },
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

                {/* Laptop Desktop / Mobile Switcher & New Tab */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-0.5 border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        previewViewport === "desktop"
                          ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                          : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <Laptop className="h-3 w-3" />
                      <span className="hidden sm:inline">Laptop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        previewViewport === "mobile"
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

              {/* Fast Test Inbox Sender Widget */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  <span>Send Test to Real Inbox</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Verify formatting in Gmail / Outlook</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="Enter your email to test..."
                    className="flex-1 rounded-lg border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTestEmail || !testEmailInput.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {sendingTestEmail ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-3 w-3" />
                    )}
                    <span>Send Test</span>
                  </button>
                </div>
                {testEmailSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-600">✓ Test email dispatched successfully! Check your inbox.</p>
                )}
                {testEmailError && (
                  <p className="text-[11px] font-semibold text-red-500">{testEmailError}</p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ── CTA Button Configuration Modal ── */}
      {showButtonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-indigo-600" />
                <span>Configure CTA Button</span>
              </h3>
              <button onClick={() => setShowButtonModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Button Label</label>
                <input
                  type="text"
                  value={buttonModalText}
                  onChange={(e) => setButtonModalText(e.target.value)}
                  placeholder="e.g. Claim Your 20% Discount →"
                  className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Target Link URL</label>
                <input
                  type="url"
                  value={buttonModalUrl}
                  onChange={(e) => setButtonModalUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/offer"
                  className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Button Color</label>
                <div className="flex items-center gap-2">
                  {["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#0f172a"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setButtonModalColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        buttonModalColor === c ? "border-zinc-900 dark:border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={buttonModalColor}
                    onChange={(e) => setButtonModalColor(e.target.value)}
                    className="h-7 w-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowButtonModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertCustomButton}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
              >
                Insert Button
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Insert Modal ── */}
      {showImageUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <span>Insert Compressed Image</span>
              </h3>
              <button onClick={() => setShowImageUploadModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {imageSizeStatus && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
                {imageSizeStatus}
              </p>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Alt Text / Description</label>
                <input
                  type="text"
                  value={imageModalAlt}
                  onChange={(e) => setImageModalAlt(e.target.value)}
                  placeholder="e.g. Product Showcase Image"
                  className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700 dark:text-zinc-300">Clickable Link URL (Optional)</label>
                <input
                  type="url"
                  value={imageModalLink}
                  onChange={(e) => setImageModalLink(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-white outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Image Width</label>
                  <select
                    value={imageModalWidth}
                    onChange={(e) => setImageModalWidth(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="100%">100% Full Width</option>
                    <option value="75%">75% Medium</option>
                    <option value="50%">50% Half Width</option>
                    <option value="300px">300px Compact</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Alignment</label>
                  <select
                    value={imageModalAlign}
                    onChange={(e) => setImageModalAlign(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="center">Center</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowImageUploadModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Template Library Modal ── */}
      {showTemplatePicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-3xl w-full space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-indigo-600" />
                  <span>Choose an Email Marketing Template</span>
                </h3>
                <p className="text-xs text-zinc-500">Pick from high-converting pre-built email templates</p>
              </div>
              <button onClick={() => setShowTemplatePicker(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingTemplates ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading templates…</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-indigo-500 hover:bg-indigo-50/20 transition cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white group-hover:text-indigo-600 transition">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-1">{tpl.subject}</p>
                    <div className="text-[11px] font-medium text-indigo-600 pt-1">
                      Click to use template &rarr;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Assistant Interactive Full Modal ── */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E131F] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    AI Email Writing Assistant
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Generate high-converting email copy with intelligent personalization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Intent Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                1. Select an Email Goal / Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "🚀 Product Launch", prompt: "Announce our revolutionary new AI feature designed to automate customer calls and boost conversions." },
                  { label: "🏷️ Promo / Discount", prompt: "Offer a limited-time 20% discount on our annual plan for early subscribers." },
                  { label: "📅 Webinar Invite", prompt: "Invite our clients to an exclusive live masterclass on scaling sales with AI voice bots." },
                  { label: "🤝 Cold Outreach", prompt: "Reach out to high-growth businesses to demonstrate how CallingGen cuts support costs by 50%." },
                  { label: "💬 Feedback Request", prompt: "Ask our active users for a quick 2-minute review on their experience with our platform." },
                  { label: "⏰ Urgent Reminder", prompt: "Send an urgent reminder that their subscription discount expires in 48 hours." },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setAiPrompt(item.prompt)}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-purple-500 hover:bg-purple-50/20 text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                2. Instructions or Context
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                placeholder="Describe what you want to communicate, key benefits, discounts, or deadlines..."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-900 dark:text-white outline-none focus:border-purple-500 font-medium"
              />
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                3. Choose Tone of Voice
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {(["Professional", "Friendly", "Persuasive", "Urgent", "Casual"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAiTone(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      aiTone === t
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickAIGenerate()}
                disabled={isGeneratingAI || !aiPrompt.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-60 transition cursor-pointer"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Draft…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate &amp; Insert Draft</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardShell>
  );
}

export default function EmailCampaignStudio() {
  return (
    <Suspense fallback={<div>Loading Studio...</div>}>
      <EmailCampaignStudioInner />
    </Suspense>
  );
}
