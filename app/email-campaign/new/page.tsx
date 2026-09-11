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
  Sparkle,
} from "lucide-react";
import {
  api,
  EmailContactItem,
  EmailMarketingTemplate,
  VerifiedSenderOption,
  EmailAIGenerateResult,
  EmailAIGeneratePayload,
} from "@/lib/api";

// ── Plain text token resolver (for Subject, Headings, and Header strings) ──
function resolveTextTokens(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{name\}\}/gi, "{{Client Name}}")
    .replace(/\{\{company\}\}/gi, "{{Company Name}}")
    .replace(/\{\{email\}\}/gi, "{{client@email.com}}");
}

// ── Full HTML Document Formatter (Fluid Scalable for Real-time Preview) ──
function formatEmailDocumentHtml(
  bodyHtml: string,
  title?: string,
  subtitle: string = "AI VOICE CALLING & AUTOMATION PLATFORM"
): string {
  if (!bodyHtml) return "";
  const resolved = resolveTextTokens(bodyHtml);

  if (resolved.includes("<!DOCTYPE") || resolved.includes("<html")) {
    return resolved;
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
      padding: 10px 8px;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    p { margin: 0 0 10px 0; }
    ul { margin: 0 0 10px 0; padding-left: 20px; }
    li { margin-bottom: 4px; }
    h1, h2, h3 { color: #0f172a; margin: 0 0 10px 0; font-weight: 700; }
    h1 { font-size: 18px; }
    h2 { font-size: 16px; }
    a { color: #6366f1; }
    .email-btn {
      background-color: #6366f1;
      color: #ffffff !important;
      padding: 10px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px -2px rgba(15, 23, 42, 0.06); text-align: left;">
    <tr>
      <td style="background-color: #ffffff; padding: 16px 20px 12px 20px; text-align: center; border-bottom: 2px solid #6366f1;">
        <div style="font-size: 21px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
          Calling<span style="color: #6366f1;">Gen</span>
        </div>
        <div style="font-size: 9.5px; color: #6366f1; margin-top: 2px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 700;">
          ${subtitle}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 18px 20px 14px 20px; font-size: 13.5px; color: #334155; line-height: 1.55;">
        ${title ? `<h2 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0 0 12px 0;">${title}</h2>` : ""}
        ${resolved}
      </td>
    </tr>
    <tr>
      <td style="background-color: #faf5ff; padding: 14px 20px; border-top: 1px solid #f1f5f9; text-align: center;">
        <div style="margin-bottom: 8px;">
          <a href="https://linkedin.com" style="display: inline-block; margin: 0 4px; width: 24px; height: 24px; line-height: 24px; border-radius: 50%; background: #0077b5; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center;">in</a>
          <a href="https://x.com" style="display: inline-block; margin: 0 4px; width: 24px; height: 24px; line-height: 24px; border-radius: 50%; background: #000000; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center;">𝕏</a>
          <a href="https://facebook.com" style="display: inline-block; margin: 0 4px; width: 24px; height: 24px; line-height: 24px; border-radius: 50%; background: #1877f2; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center;">f</a>
          <a href="https://youtube.com" style="display: inline-block; margin: 0 4px; width: 24px; height: 24px; line-height: 24px; border-radius: 50%; background: #ff0000; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: bold; text-align: center;">▶</a>
        </div>
        <p style="margin: 0 0 3px 0; font-size: 11px; color: #64748b;">
          &copy; 2026 CallingGen Inc. All rights reserved.
        </p>
        <p style="margin: 0; font-size: 10.5px; color: #94a3b8;">
          Sent via <a href="https://callinggen.in" style="color: #6366f1; text-decoration: none; font-weight: 600;">CallingGen</a> &bull; <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── CSV parser ───────────────────────────────────────────────────────────────
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

  // Template query param & library picker
  const templateIdParam = searchParams.get("template_id");
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

  // Campaign Setup Card Expansion State (Open by default so users can fill immediately)
  const [setupExpanded, setSetupExpanded] = useState(true);

  // Form state
  const [name, setName] = useState("Q3 Growth Announcement");
  const [subject, setSubject] = useState("Q3 Growth Announcement");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [verifiedSenders, setVerifiedSenders] = useState<VerifiedSenderOption[]>([]);
  const [replyTo, setReplyTo] = useState("");
  const [htmlBody, setHtmlBody] = useState(DEFAULT_TEMPLATE);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("2026-09-12");
  const [scheduleTime, setScheduleTime] = useState("10:00");

  // Tab State inside Expanded Campaign Setup: "recipients" | "sender" | "schedule"
  const [activeSetupTab, setActiveSetupTab] = useState<"recipients" | "sender" | "schedule">("recipients");

  // Contacts
  const [contacts, setContacts] = useState<EmailContactItem[]>([
    { name: "John Doe", email: "john@example.com" },
    { name: "Sarah Smith", email: "sarah@acme.com" },
  ]);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [csvUploadedName, setCsvUploadedName] = useState("2 contacts • CSV uploaded");

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

  // Load templates & verified sender options (Connected mailboxes + custom domains)
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
  }, []);

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

  // ── Inline AI Generation Handler ──────────────────────────────────────────
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

  // ── CSV Upload ──────────────────────────────────────────────────────────────
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

  // ── Manual add ─────────────────────────────────────────────────────────────
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
    setCsvUploadedName(`${updated.length.toLocaleString()} contacts`);
  };

  // ── Insert Pre-styled HTML Block into Editor ────────────────────────────────
  const insertBlock = (blockType: string) => {
    let blockHtml = "";
    switch (blockType) {
      case "text":
        blockHtml = `<p>Write your paragraph message here with personalized value for {{name}}.</p>`;
        break;
      case "image":
        blockHtml = `<p style="text-align: center;"><img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80" alt="Promotional Banner" style="border-radius: 8px; max-width: 100%;" /></p>`;
        break;
      case "button":
        blockHtml = `<p style="text-align: center; margin: 16px 0;"><a href="https://callinggen.in" target="_blank" class="email-btn" style="background-color: #6366f1; color: #ffffff !important; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Learn More &amp; Get Started &rarr;</a></p>`;
        break;
      case "divider":
        blockHtml = `<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 18px 0;" />`;
        break;
      case "heading":
        blockHtml = `<h2 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 14px 0 6px 0;">Special Announcement</h2>`;
        break;
      case "social":
        blockHtml = `<div style="text-align: center; margin: 16px 0;"><p style="font-size: 11.5px; color: #64748b; margin-bottom: 6px;">Follow our official channels:</p><a href="https://linkedin.com" style="margin: 0 5px; color: #6366f1; font-weight: 600;">LinkedIn</a> &bull; <a href="https://x.com" style="margin: 0 5px; color: #6366f1; font-weight: 600;">Twitter/X</a> &bull; <a href="https://youtube.com" style="margin: 0 5px; color: #6366f1; font-weight: 600;">YouTube</a></div>`;
        break;
      case "signature":
        blockHtml = `<p style="margin-top: 16px;">Best regards,<br><strong>${fromName || "Sai Sathwik"}</strong><br><span style="color: #64748b; font-size: 11.5px;">The {{company}} Team</span></p>`;
        break;
      default:
        break;
    }
    if (blockHtml) {
      setHtmlBody((prev) => prev + blockHtml);
    }
  };

  // ── Open in New Tab ────────────────────────────────────────────────────────
  const handleOpenInNewTab = () => {
    const formattedHtml = formatEmailDocumentHtml(htmlBody, subject);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(formattedHtml);
      win.document.close();
    }
  };

  // ── Handle Save Draft ──────────────────────────────────────────────────────
  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // ── Submit & Launch Campaign ────────────────────────────────────────────────
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
      // 1. Create the campaign
      const { campaign_id } = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        from_name: fromName.trim() || undefined,
        from_email: fromEmail ? fromEmail.trim() : undefined,
        reply_to: replyTo.trim() || undefined,
        html_body: htmlBody,
        schedule_date: scheduleMode === "later" ? scheduleDate : undefined,
        schedule_time: scheduleMode === "later" ? scheduleTime : undefined,
        contacts,
      });

      // 2. If "Send immediately", launch right now
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
            2. TOP INTERACTIVE CARD: CAMPAIGN SETUP (Directly Fillable)
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

          {/* 3 Summary Interactive Tiles (Clicking immediately switches & opens the section to fill) */}
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
                  {contacts.length > 0 ? `${contacts.length.toLocaleString()} contacts` : "0 contacts"}
                </div>
                <div className="text-[10.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium truncate">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>{csvUploadedName}</span>
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
                  {fromName || user?.company_name || "Sai Sathwik"} &lt;{fromEmail || "info@callinggen.in"}&gt;
                </div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                  Reply-to: {replyTo || "support@callinggen.in"}
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
                      Add & Manage Recipients ({contacts.length} added)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Upload CSV or add contacts one by one
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
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-36 overflow-y-auto bg-white dark:bg-zinc-900">
                      <table className="w-full text-xs">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/70 sticky top-0">
                          <tr>
                            <th className="px-3 py-1 text-left font-semibold text-zinc-500">#</th>
                            <th className="px-3 py-1 text-left font-semibold text-zinc-500">Name</th>
                            <th className="px-3 py-1 text-left font-semibold text-zinc-500">Email</th>
                            <th className="px-3 py-1 text-right font-semibold text-zinc-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {contacts.map((c, i) => (
                            <tr key={c.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                              <td className="px-3 py-1 text-zinc-400">{i + 1}</td>
                              <td className="px-3 py-1 font-medium text-zinc-800 dark:text-zinc-200">{c.name}</td>
                              <td className="px-3 py-1 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                              <td className="px-3 py-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeContact(c.email)}
                                  className="text-zinc-400 hover:text-red-500 transition cursor-pointer p-0.5"
                                  title="Remove contact"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No recipients added yet. Upload a CSV or add contacts above.</p>
                  )}
                </div>
              )}

              {/* 2. Sender Details Form */}
              {activeSetupTab === "sender" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Sender & Mailbox Details
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
                          <option value="">CallingGen Platform (noreply@callinggen.in)</option>
                        ) : (
                          verifiedSenders.map((s) => (
                            <option key={s.email} value={s.email}>
                              {s.is_smtp
                                ? `⭐ ${s.email} (${(s.provider || "Connected Mailbox").toUpperCase()})`
                                : s.is_default
                                ? `CallingGen Platform (${s.email})`
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
                        placeholder="e.g. support@callinggen.in"
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
            4. BOTTOM DUAL-PANE: EMAIL CONTENT (LEFT) | LIVE PREVIEW (RIGHT)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

          {/* ──────────────────────────────────────────────────────────────────
              LEFT PANE: EMAIL CONTENT CARD
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3.5 shadow-sm space-y-3">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Email Content
                </h3>
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

            {/* Custom Toolbar / Quick Action Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80">
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

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertBlock("button")}
                  className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>AI</span>
                </button>
              </div>
            </div>

            {/* Rich Editor */}
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <ReactQuill
                theme="snow"
                value={htmlBody}
                onChange={setHtmlBody}
                className="studio-editor bg-white dark:bg-[#0A0D14] text-zinc-900 dark:text-white min-h-[220px]"
                placeholder="Write your email body here..."
              />
            </div>

            {/* Bottom Block Insertion Tray */}
            <div className="bg-zinc-50/70 dark:bg-zinc-900/50 rounded-xl p-2.5 border border-zinc-200/70 dark:border-zinc-800 space-y-1.5">
              <div className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Plus className="h-3 w-3" />
                <span>Add Block</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-7 gap-1">
                {[
                  { id: "text", label: "Text", icon: Type },
                  { id: "image", label: "Image", icon: ImageIcon },
                  { id: "button", label: "Button", icon: MousePointerClick },
                  { id: "divider", label: "Divider", icon: Minus },
                  { id: "heading", label: "Heading", icon: Heading },
                  { id: "social", label: "Social Links", icon: Share2 },
                  { id: "signature", label: "Signature", icon: PenTool },
                ].map((blk) => {
                  const Icon = blk.icon;
                  return (
                    <button
                      key={blk.id}
                      type="button"
                      onClick={() => insertBlock(blk.id)}
                      className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition group cursor-pointer"
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

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT PANE: LIVE PREVIEW CARD (Fit cleanly on screen)
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 bg-white dark:bg-[#0E131F] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-3.5 shadow-sm space-y-2.5 sticky top-2">
            
            {/* Live Preview Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Live Preview
                  </h3>
                </div>

                {/* Viewport switcher */}
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("desktop")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      previewViewport === "desktop"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
                    title="Desktop Preview"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport("mobile")}
                    className={`p-1 rounded-md transition cursor-pointer ${
                      previewViewport === "mobile"
                        ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-zinc-400 hover:text-zinc-600"
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* View in new tab */}
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                <span>View in new tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

            </div>

            {/* Rendered Preview Canvas Container (Auto-Fit & Responsive) */}
            <div className={`mx-auto bg-zinc-100/70 dark:bg-zinc-950/70 p-2 rounded-xl flex justify-center transition-all ${
              previewViewport === "mobile" ? "max-w-[370px]" : "w-full"
            }`}>
              <div className="w-full bg-white dark:bg-[#0A0D14] rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
                <iframe
                  srcDoc={formatEmailDocumentHtml(htmlBody, subject)}
                  className="w-full border-0 bg-transparent block"
                  style={{ minHeight: "420px", height: "480px" }}
                  title="Email Studio Live Preview"
                  sandbox="allow-same-origin allow-popups"
                />
              </div>
            </div>

            {/* Preview Status Footer */}
            <div className="flex items-center justify-between text-[10.5px] text-zinc-400 px-1 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-time Sync Active</span>
              </span>
              <span>CallingGen Email Engine</span>
            </div>

          </div>

        </div>

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

// ── Default HTML fallback template ──────────────────────────────────────────
const DEFAULT_TEMPLATE = `<h2><strong>Special Announcement</strong></h2><p>Hi {{name}},</p><p>We are excited to share our latest updates and solutions with you from {{company}}.</p><p>Our team has been working hard to bring you innovative solutions that help your business grow faster and smarter. This quarter, we're introducing new features, better support, and exclusive offers designed just for you.</p><p style="text-align: center; margin: 16px 0;"><a href="https://callinggen.in" target="_blank" class="email-btn" style="background-color: #6366f1; color: #ffffff !important; padding: 10px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Learn More &amp; Get Started &rarr;</a></p><p>Best regards,<br><strong>The {{company}} Team</strong></p>`;
