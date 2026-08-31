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
  Check,
  Building2,
  Tag,
  Globe,
} from "lucide-react";
import {
  api,
  EmailContactItem,
  EmailMarketingTemplate,
  VerifiedSenderOption,
} from "@/lib/api";

// ── Personalization Resolver for Live Preview ───────────────────────────────
function resolvePlaceholders(html: string, title?: string, subtitle: string = "AI Voice Calling & Automation Platform"): string {
  if (!html) return "";
  const resolved = html
    .replace(/\{\{name\}\}/gi, "[Client Name]")
    .replace(/\{\{company\}\}/gi, "[Company Name]")
    .replace(/\{\{email\}\}/gi, "[client@email.com]");

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
      .content-padding { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 36px 10px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #334155; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06); text-align: left;">
          <tr>
            <td style="background-color: #ffffff; padding: 28px 32px 20px 32px; text-align: center; border-bottom: 2px solid #2563eb;">
              <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a;">
                Calling<span style="color: #2563eb;">Gen</span>
              </div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600;">
                ${subtitle}
              </div>
            </td>
          </tr>
          <tr>
            <td class="content-padding" style="padding: 32px 32px 28px 32px; font-size: 14.5px; color: #334155; line-height: 1.65;">
              ${title ? `<h1 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 18px 0; line-height: 1.35; letter-spacing: -0.3px;">${title}</h1>` : ""}
              ${resolved}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
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

// ── Clean Desktop HTML email preview modal ──────────────────────────────────
function PreviewModal({
  html,
  subject,
  onClose,
}: {
  html: string;
  subject: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="text-base font-bold text-zinc-900 dark:text-white">
              Campaign Live Preview
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subject preview bar */}
        <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-500 shrink-0">Subject:</span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate">
            {resolvePlaceholders(subject) || "(No subject provided)"}
          </span>
        </div>

        {/* Content iframe */}
        <div className="flex-1 overflow-y-auto p-5 bg-zinc-100/80 dark:bg-zinc-900 flex justify-center">
          <div className="w-full max-w-3xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm overflow-hidden">
            <iframe
              srcDoc={resolvePlaceholders(html)}
              className="w-full min-h-[500px] border-0 bg-white"
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>

        <div className="flex justify-end px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
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
  const [showPreview, setShowPreview] = useState(false);

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
    setShowTemplatePicker(false);
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
    <DashboardShell title="New Email Campaign">
      <div className="flex flex-col gap-6 p-1 sm:p-4 max-w-4xl mx-auto">

        {/* ── Back row & Quick Template Switcher ── */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Email Campaigns
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className="flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-3.5 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Choose from Template Library
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>

            {/* Template Dropdown Drawer */}
            {showTemplatePicker && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-40 p-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Select a Template
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
                      className="w-full text-left p-2.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 transition group flex flex-col gap-0.5"
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

        {loadingTemplate && (
          <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl text-xs text-violet-700 dark:text-violet-300 flex items-center gap-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
            Loading template content into composer…
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Campaign Details Card ── */}
          <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Campaign Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Product Launch Q3"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Special Announcement for {{name}} 🎉"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Sender / From Name
                </label>
                <input
                  id="from-name"
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="CallingGen Team"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Reply-To Email
                </label>
                <input
                  id="reply-to"
                  type="email"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="support@callinggen.in"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              {/* Sending Domain & From Address */}
              <div className="sm:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-violet-600" />
                    Sending Domain &amp; From Address
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push("/email-campaign")}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                  >
                    Manage Sending Domains &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={selectedSenderDomain}
                      onChange={(e) => setSelectedSenderDomain(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                    >
                      <option value="default">Default Platform Domain (CallingGen)</option>
                      {verifiedSenders
                        .filter((s) => !s.is_default)
                        .map((s) => (
                          <option key={s.domain} value={s.domain}>
                            {s.domain} (Verified Custom Domain)
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedSenderDomain !== "default" ? (
                    <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-1.5">
                      <input
                        type="text"
                        value={customSenderPrefix}
                        onChange={(e) => setCustomSenderPrefix(e.target.value)}
                        placeholder="info"
                        className="bg-transparent text-sm text-zinc-900 dark:text-white font-mono outline-none w-28 text-right font-medium"
                      />
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-sm font-semibold">
                        @{selectedSenderDomain}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                      Sending via default verified gateway (noreply@callinggen.in)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Email Body Card with Dynamic Variable Injectors ── */}
          <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Email Content</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Customize your message. Click any variable badge to insert into text.
                  </p>
                </div>
              </div>

              {/* Personalization Quick Badges & Preview Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHtmlBody((prev) => prev + " {{name}} ")}
                  className="px-2 py-1 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                  title="Insert contact's name"
                >
                  + {"{{name}}"}
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlBody((prev) => prev + " {{company}} ")}
                  className="px-2 py-1 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                  title="Insert company name"
                >
                  + {"{{company}}"}
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlBody((prev) => prev + " {{email}} ")}
                  className="px-2 py-1 text-xs font-mono bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition"
                  title="Insert contact's email"
                >
                  + {"{{email}}"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition ml-2 shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <ReactQuill
                  theme="snow"
                  value={htmlBody}
                  onChange={setHtmlBody}
                  className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white min-h-[220px]"
                  placeholder="Paste or write your email content here..."
                />
              </div>
            </div>
          </section>

          {/* ── Contacts Card ── */}
          <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Recipients <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">({contacts.length} Contacts Added)</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Upload a CSV or add contacts manually. CSV header must contain <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">name</code> and <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">email</code>.
                </p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* CSV Upload */}
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
                  className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-900/50 px-5 py-3 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-violet-400 hover:bg-violet-50/40 dark:hover:border-violet-700 dark:hover:bg-violet-950/20 transition w-full justify-center"
                >
                  <Upload className="h-4 w-4 text-violet-500" />
                  Upload Contacts CSV (.csv)
                </button>
                {csvError && (
                  <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{csvError}</p>
                )}
              </div>

              {/* Manual Add Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Recipient Name"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="email@example.com"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
                <button
                  type="button"
                  id="add-contact-btn"
                  onClick={addManual}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition"
                >
                  Add
                </button>
              </div>

              {/* Contact list */}
              {contacts.length > 0 && (
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-500">Email</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {contacts.map((c, i) => (
                        <tr key={c.email} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="px-4 py-2 text-xs text-zinc-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-zinc-800 dark:text-zinc-200">{c.name}</td>
                          <td className="px-4 py-2 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeContact(c.email)}
                              className="text-zinc-400 hover:text-red-500 transition"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* ── Schedule Card ── */}
          <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Send className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Delivery Schedule</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                {(["now", "later"] as const).map((mode) => (
                  <label
                    key={mode}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-5 py-3 transition ${
                      scheduleMode === mode
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
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
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {mode === "now" ? "Send immediately through Resend" : "Schedule for a future date"}
                    </span>
                  </label>
                ))}
              </div>

              {scheduleMode === "later" && (
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Date</label>
                    <input
                      type="date"
                      id="schedule-date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Time</label>
                    <input
                      type="time"
                      id="schedule-time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Error & Submit ── */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              id="create-email-campaign-btn"
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {scheduleMode === "now" ? "Broadcasting via Resend…" : "Creating…"}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {scheduleMode === "now" ? "Create & Send Now" : "Schedule Campaign"}
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Preview Modal ── */}
        {showPreview && (
          <PreviewModal
            html={htmlBody}
            subject={subject}
            onClose={() => setShowPreview(false)}
          />
        )}

      </div>
    </DashboardShell>
  );
}

export default function NewEmailCampaignPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading campaign composer…</div>}>
      <NewEmailCampaignContent />
    </Suspense>
  );
}

// ── Default HTML fallback template ──────────────────────────────────────────
const DEFAULT_TEMPLATE = `<h2><strong>Special Announcement</strong></h2><p><br></p><p>Hi {{name}},</p><p><br></p><p>We are excited to share our latest updates and solutions with you from {{company}}.</p><p><br></p><p><a href="#" rel="noopener noreferrer" target="_blank">Click here to learn more</a></p><p><br></p><p>Best regards,</p><p><strong>The {{company}} Team</strong></p>`;
