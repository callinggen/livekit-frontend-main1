"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { api, EmailContactItem } from "@/lib/api";

// ── Tiny inline HTML email preview modal ────────────────────────────────────
function PreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Email Preview</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[70vh] p-4">
          <iframe
            srcDoc={html}
            className="w-full min-h-[400px] border-0 rounded-lg"
            title="Email Preview"
            sandbox="allow-same-origin"
          />
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

export default function NewEmailCampaignPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [htmlBody, setHtmlBody] = useState(DEFAULT_TEMPLATE);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

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

  const removeContact = (email: string) =>
    setContacts((prev) => prev.filter((c) => c.email !== email));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Campaign name is required.");
    if (!subject.trim()) return setError("Email subject is required.");
    if (!htmlBody.trim()) return setError("Email body is required.");
    if (contacts.length === 0) return setError("Add at least one contact.");
    if (scheduleMode === "later" && (!scheduleDate || !scheduleTime))
      return setError("Please set a schedule date and time.");

    setSubmitting(true);
    try {
      const { campaign_id } = await api.createEmailCampaign({
        name: name.trim(),
        subject: subject.trim(),
        html_body: htmlBody,
        from_name: fromName.trim() || undefined,
        reply_to: replyTo.trim() || undefined,
        schedule_date: scheduleMode === "later" ? scheduleDate : undefined,
        schedule_time: scheduleMode === "later" ? scheduleTime : undefined,
        contacts,
      });

      // If "now", immediately launch
      if (scheduleMode === "now") {
        await api.launchEmailCampaign(campaign_id);
      }

      router.push(`/email-campaign/${campaign_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <DashboardShell title="New Email Campaign">
      {showPreview && (
        <PreviewModal html={htmlBody} onClose={() => setShowPreview(false)} />
      )}

      <div className="max-w-4xl mx-auto px-1 sm:px-4 py-2">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Email Campaigns
        </button>

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
                  placeholder="Summer Sale Announcement"
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
                  placeholder="Exclusive offer just for you 🎉"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  From Name
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
                  placeholder="support@yourcompany.com"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
              </div>
            </div>
          </section>

          {/* ── Email Body Card ── */}
          <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0B0F19] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Email Body (HTML)</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Use <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">{"{{name}}"}</code> to personalize with contact's name</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
            <div className="p-6">
              <textarea
                id="email-body"
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={16}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-mono text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500 resize-y"
                placeholder="Paste your HTML email here…"
              />
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
                  Contacts <span className="ml-2 text-xs font-normal text-zinc-500">({contacts.length} added)</span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Upload a CSV or add manually. CSV must have <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">name</code> and <code className="bg-zinc-100 dark:bg-zinc-700 px-1 rounded">email</code> columns.</p>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* CSV Upload */}
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 hover:border-violet-400 dark:hover:border-violet-600 transition-colors group"
                >
                  <Upload className="h-5 w-5 text-zinc-400 group-hover:text-violet-500 transition" />
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                    Click to upload CSV (name, email)
                  </span>
                </label>
                {csvError && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {csvError}
                  </p>
                )}
              </div>

              {/* Manual add */}
              <div className="flex gap-3">
                <input
                  id="manual-name"
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Full Name"
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500"
                />
                <input
                  id="manual-email"
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
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Schedule</h2>
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
                      {mode === "now" ? "Send immediately after creating" : "Schedule for later"}
                    </span>
                  </label>
                ))}
              </div>

              {scheduleMode === "later" && (
                <div className="flex gap-4">
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
                  {scheduleMode === "now" ? "Sending…" : "Creating…"}
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
      </div>
    </DashboardShell>
  );
}

// ── Default HTML template ───────────────────────────────────────────────────
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">CallingGen</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi {{name}},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Write your email content here. Use {{name}} to personalize greetings.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="#" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
                  Get Started
                </a>
              </div>
              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Best regards,<br/>The CallingGen Team
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © 2025 CallingGen. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
