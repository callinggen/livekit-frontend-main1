"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border rounded-xl animate-pulse text-zinc-400">
      Loading Editor...
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
  FileText,
  Send,
  Loader2,
  X,
  AlertCircle,
  Eye,
  LayoutTemplate,
  Sparkles,
  ChevronDown,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle2,
  Wand2,
  SlidersHorizontal,
  Layers,
  ChevronUp,
} from "lucide-react";
import {
  api,
  EmailContactItem,
  EmailMarketingTemplate,
  VerifiedSenderOption,
  EmailAIGenerateResult,
} from "@/lib/api";

// ── Plain text token resolver (for Subject, Headings, and Header strings) ──
function resolveTextTokens(text: string): string {
  if (!text) return "";
  return text
    .replace(/\{\{name\}\}/gi, "[Client Name]")
    .replace(/\{\{company\}\}/gi, "[Company Name]")
    .replace(/\{\{email\}\}/gi, "[client@email.com]");
}

// ── Full HTML Document Formatter (for the Iframe Preview only) ─────────────
function formatEmailDocumentHtml(
  bodyHtml: string,
  title?: string,
  subtitle: string = "AI Voice Calling & Automation Platform"
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
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media screen and (max-width: 620px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 8px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06); text-align: left;">
          <tr>
            <td style="background-color: #ffffff; padding: 24px 28px 18px 28px; text-align: center; border-bottom: 2px solid #2563eb;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
                Calling<span style="color: #2563eb;">Gen</span>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600;">
                ${subtitle}
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-padding" style="padding: 28px 28px 24px 28px; font-size: 14.5px; color: #334155; line-height: 1.65;">
              ${title ? `<h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 18px 0; line-height: 1.35; letter-spacing: -0.3px;">${title}</h1>` : ""}
              ${resolved}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 28px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                &copy; 2026 CallingGen Inc. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Sent via <a href="https://callinggen.in" style="color: #2563eb; text-decoration: none; font-weight: 600;">CallingGen</a> &bull; <a href="#" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
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

  // AI Assistant Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSuccessBadge, setAiSuccessBadge] = useState(false);

  // Live Preview Device Mode
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Accordion Toggles for Configuration Sections
  const [showSenderSettings, setShowSenderSettings] = useState(true);
  const [showRecipientsSettings, setShowRecipientsSettings] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [htmlBody, setHtmlBody] = useState(DEFAULT_TEMPLATE);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Verified Senders & Sending Domain State
  const [verifiedSenders, setVerifiedSenders] = useState<VerifiedSenderOption[]>([]);
  const [selectedSenderDomain, setSelectedSenderDomain] = useState<string>("default");
  const [customSenderPrefix, setCustomSenderPrefix] = useState<string>("info");

  // Contacts
  const [contacts, setContacts] = useState<EmailContactItem[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  // UI state
  const [csvError, setCsvError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Load all templates for quick picker & load verified senders
  useEffect(() => {
    api.getEmailTemplates().then((tpls) => setTemplateLibrary(tpls)).catch(() => {});
    api.getVerifiedSenders()
      .then((senders) => {
        setVerifiedSenders(senders);
        const custom = senders.find((s) => !s.is_default);
        if (custom) {
          setSelectedSenderDomain(custom.domain);
        } else {
          setSelectedSenderDomain("default");
        }
      })
      .catch(() => {});
  }, []);

  // Compute effective from_email
  const getComputedFromEmail = () => {
    if (selectedSenderDomain === "default" || !selectedSenderDomain) {
      return undefined;
    }
    const cleanPrefix = customSenderPrefix.trim().replace(/[^a-zA-Z0-9._-]/g, "") || "info";
    return `${cleanPrefix}@${selectedSenderDomain}`;
  };

  // Active template metadata for AI context
  const [activeTemplateName, setActiveTemplateName] = useState<string>("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string>("");

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
        return [...prev, ...parsed.filter((c) => !existing.has(c.email))];
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
    setContacts((prev) => [...prev, { name: manualName.trim(), email: manualEmail.trim() }]);
    setManualName("");
    setManualEmail("");
  };

  const removeContact = (email: string) => {
    setContacts((prev) => prev.filter((c) => c.email !== email));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      return;
    }
    if (scheduleMode === "later" && (!scheduleDate || !scheduleTime)) {
      setError("Please specify both date and time for scheduled send.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the campaign
      const { campaign_id } = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        from_name: fromName.trim() || undefined,
        from_email: getComputedFromEmail(),
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
    <DashboardShell title="Email Campaign Studio">
      <div className="flex flex-col gap-4 p-1 sm:p-2 max-w-[1700px] mx-auto">

        {/* ── Top Action & Campaign Header Bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0B0F19] p-3 sm:px-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <div className="h-4 w-[1px] bg-zinc-200 dark:border-zinc-800" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Campaign Name (e.g. Product Launch Blast)"
              className="bg-transparent font-bold text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none w-full max-w-md focus:ring-1 focus:ring-violet-500/40 rounded-lg px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* ✨ Primary AI Assistant Button */}
            <button
              type="button"
              id="ai-assistant-header-btn"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>Generate with AI</span>
            </button>

            {/* Template Library Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-violet-500" />
                <span>Templates</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>

              {showTemplatePicker && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-40 p-3 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      Select Template
                    </span>
                    <button
                      onClick={() => setShowTemplatePicker(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {templateLibrary.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectTemplate(t)}
                        className="w-full text-left p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 transition group flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
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
          </div>
        </div>

        {/* AI Success Notification Toast */}
        {aiSuccessBadge && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>AI Copy Applied!</strong> Subject, heading, and body have been populated. You can edit any word on the left and see real-time updates in the right preview.
              </span>
            </div>
            <button
              onClick={() => setAiSuccessBadge(false)}
              className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SIDE-BY-SIDE TWO-PANEL WORKSPACE
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ──────────────────────────────────────────────────────────────────
              LEFT PANEL: EMAIL COMPOSER & CAMPAIGN CONTROLS
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* 1. Core Content Editor Card */}
              <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Email Content Editor</h2>
                  </div>

                  {/* Personalization Tokens */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 mr-1 hidden sm:inline">Tokens:</span>
                    <button
                      type="button"
                      onClick={() => setHtmlBody((prev) => prev + " {{name}} ")}
                      className="px-2 py-0.5 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                      title="Insert contact name"
                    >
                      + {"{{name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlBody((prev) => prev + " {{company}} ")}
                      className="px-2 py-0.5 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                      title="Insert company name"
                    >
                      + {"{{company}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHtmlBody((prev) => prev + " {{email}} ")}
                      className="px-2 py-0.5 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                      title="Insert contact email"
                    >
                      + {"{{email}}"}
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Subject Line Input */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Email Subject Line <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-zinc-400 font-mono">Real-time sync to preview</span>
                    </div>
                    <input
                      id="email-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Special 20% Discount for {{name}} 🎉"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500 font-medium"
                    />
                  </div>

                  {/* AI Assistant Quick Trigger Banner & Refinement Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-violet-50/90 via-indigo-50/60 to-purple-50/40 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-transparent border border-violet-200/80 dark:border-violet-800/60 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/30">
                        <Sparkles className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-violet-900 dark:text-violet-200">AI Copywriter &amp; Assistant</div>
                        <div className="text-[11px] text-violet-700/80 dark:text-violet-400">Generate high-converting emails or refine current text</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="open-ai-assistant-btn"
                      onClick={() => setShowAIModal(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-1.5 shadow-sm shadow-violet-500/20 transition active:scale-[0.98]"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Open AI Assistant</span>
                    </button>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Email Body Content <span className="text-red-500">*</span>
                    </label>
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <ReactQuill
                        theme="snow"
                        value={htmlBody}
                        onChange={setHtmlBody}
                        className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white min-h-[250px]"
                        placeholder="Write or paste your email body content here..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Sender & Gateway Configuration Accordion */}
              <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSenderSettings(!showSenderSettings)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Sender &amp; Gateway Settings</h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Configure From Name, Reply-to, and Sending Domain</p>
                    </div>
                  </div>
                  {showSenderSettings ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {showSenderSettings && (
                  <div className="p-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Sender Display Name
                      </label>
                      <input
                        type="text"
                        value={fromName}
                        onChange={(e) => setFromName(e.target.value)}
                        placeholder="CallingGen Team"
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Reply-To Email
                      </label>
                      <input
                        type="email"
                        value={replyTo}
                        onChange={(e) => setReplyTo(e.target.value)}
                        placeholder="support@callinggen.in"
                        className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Sending Domain Gateway
                        </label>
                        <button
                          type="button"
                          onClick={() => router.push("/email-campaign")}
                          className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline font-medium"
                        >
                          Manage Domains &rarr;
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={selectedSenderDomain}
                          onChange={(e) => setSelectedSenderDomain(e.target.value)}
                          className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2 text-xs text-zinc-900 focus:border-violet-500 outline-none dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white font-medium"
                        >
                          <option value="default">Default Gateway (CallingGen)</option>
                          {verifiedSenders
                            .filter((s) => !s.is_default)
                            .map((s) => (
                              <option key={s.domain} value={s.domain}>
                                {s.domain} (Verified Domain)
                              </option>
                            ))}
                        </select>

                        {selectedSenderDomain !== "default" ? (
                          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1">
                            <input
                              type="text"
                              value={customSenderPrefix}
                              onChange={(e) => setCustomSenderPrefix(e.target.value)}
                              placeholder="info"
                              className="bg-transparent text-xs text-zinc-900 dark:text-white font-mono outline-none w-20 text-right font-medium"
                            />
                            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs font-semibold">
                              @{selectedSenderDomain}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 truncate">
                            noreply@callinggen.in
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Recipients & Delivery Schedule Accordion */}
              <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRecipientsSettings(!showRecipientsSettings)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Recipients &amp; Schedule ({contacts.length} Contacts)
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Add contact list and choose delivery timing</p>
                    </div>
                  </div>
                  {showRecipientsSettings ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {showRecipientsSettings && (
                  <div className="p-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4 mt-3">
                    {/* CSV Upload & Manual Add */}
                    <div className="flex flex-col gap-3">
                      <div>
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
                          className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-900/50 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-violet-400 hover:bg-violet-50/40 dark:hover:border-violet-700 w-full justify-center transition"
                        >
                          <Upload className="h-3.5 w-3.5 text-violet-500" />
                          Upload Contacts CSV (.csv)
                        </button>
                        {csvError && <p className="mt-1 text-xs text-red-500">{csvError}</p>}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          placeholder="Name"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                        />
                        <input
                          type="email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="email@example.com"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={addManual}
                          className="rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition"
                        >
                          Add
                        </button>
                      </div>

                      {/* Contact list table preview */}
                      {contacts.length > 0 && (
                        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden max-h-40 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0">
                              <tr>
                                <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">#</th>
                                <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">Name</th>
                                <th className="px-3 py-1.5 text-left font-semibold text-zinc-500">Email</th>
                                <th className="px-3 py-1.5"></th>
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
                                      className="text-zinc-400 hover:text-red-500 transition"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Delivery Timing Options */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                        Schedule Timing
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(["now", "later"] as const).map((mode) => (
                          <label
                            key={mode}
                            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition ${
                              scheduleMode === mode
                                ? "border-violet-500 bg-violet-50/70 dark:bg-violet-900/20"
                                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="scheduleMode"
                              value={mode}
                              checked={scheduleMode === mode}
                              onChange={() => setScheduleMode(mode)}
                              className="accent-violet-600"
                            />
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                              {mode === "now" ? "Send immediately" : "Schedule future date"}
                            </span>
                          </label>
                        ))}
                      </div>

                      {scheduleMode === "later" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                          />
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pb-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  id="create-email-campaign-btn"
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {scheduleMode === "now" ? "Sending Broadcast…" : "Scheduling…"}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {scheduleMode === "now" ? "Create & Send Broadcast" : "Schedule Campaign"}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              RIGHT PANEL: REAL-TIME LIVE TEMPLATE PREVIEW
          ────────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 sticky top-4 space-y-3">
            <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-xl overflow-hidden flex flex-col">
              
              {/* Window Frame Bar with macOS dots & device toggle */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <div className="h-3 w-3 rounded-full bg-red-400/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    Live Template Preview
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Sync
                  </span>
                </div>

                {/* Device Viewport Mode Switcher */}
                <div className="flex items-center bg-zinc-200/70 dark:bg-zinc-800 p-0.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      previewDevice === "desktop"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Desktop</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      previewDevice === "mobile"
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </button>
                </div>
              </div>

              {/* Realistic Email Client Header (Subject, From, To) */}
              <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-zinc-400 uppercase text-[10px] w-14 shrink-0 mt-0.5">Subject:</span>
                  <span className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-2">
                    {resolveTextTokens(subject) || "(No subject provided yet)"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold text-zinc-400 uppercase text-[10px] w-14 shrink-0">From:</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                    {fromName || user?.company_name || "CallingGen Team"} &lt;{getComputedFromEmail() || "noreply@callinggen.in"}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="font-bold text-zinc-400 uppercase text-[10px] w-14 shrink-0">To:</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-mono">
                    [Client Name] &lt;client@email.com&gt;
                  </span>
                </div>
              </div>

              {/* Live Iframe Body Area */}
              <div className="p-4 bg-zinc-100/80 dark:bg-zinc-950/80 flex justify-center min-h-[600px] max-h-[75vh] overflow-y-auto">
                <div
                  className={`w-full transition-all duration-300 rounded-2xl overflow-hidden border border-zinc-200/90 dark:border-zinc-800 bg-white shadow-md ${
                    previewDevice === "mobile" ? "max-w-[360px] my-auto" : "max-w-full"
                  }`}
                >
                  <iframe
                    srcDoc={formatEmailDocumentHtml(htmlBody)}
                    className="w-full min-h-[560px] border-0 bg-white"
                    title="Live Template Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>

              {/* Preview Footer */}
              <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Personalization tokens automatically resolve to demo values</span>
                <span className="font-semibold text-violet-600 dark:text-violet-400">Instant Real-Time Keystroke Sync</span>
              </div>

            </div>
          </div>

        </div>

        {/* ── AI Assistant Interactive Modal ── */}
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
const DEFAULT_TEMPLATE = `<h2><strong>Special Announcement</strong></h2><p><br></p><p>Hi {{name}},</p><p><br></p><p>We are excited to share our latest updates and solutions with you from {{company}}.</p><p><br></p><p style="text-align: center;"><a href="#" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Learn More &amp; Get Started &rarr;</a></p><p><br></p><p>Best regards,</p><p><strong>The {{company}} Team</strong></p>`;
