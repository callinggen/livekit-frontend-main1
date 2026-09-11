"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DashboardShell from "@/components/DashboardShell";
import Badge, { BadgeVariant } from "@/components/shared/Badge";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
  Loader2,
  LayoutTemplate,
  Search,
  Sparkles,
  ArrowRight,
  X,
  Globe,
  Tag,
  Building2,
  TrendingUp,
  LifeBuoy,
  Check,
  Copy,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  api,
  EmailCampaignRow,
  EmailMarketingTemplate,
  UserMailbox,
} from "@/lib/api";

const getStatusBadge = (status: string) => {
  const map: Record<string, BadgeVariant> = {
    completed: "success",
    running: "info",
    scheduled: "warning",
    draft: "neutral",
    failed: "error",
  };
  return (
    <Badge variant={map[status.toLowerCase()] || "neutral"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const CATEGORIES = [
  { id: "All", label: "All Templates", icon: LayoutTemplate },
  { id: "Business", label: "Business", icon: Building2 },
  { id: "Sales", label: "Sales & Growth", icon: TrendingUp },
  { id: "Support", label: "Customer Support", icon: LifeBuoy },
];

const getCategoryColor = (cat: string) => {
  switch (cat.toLowerCase()) {
    case "business":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "sales":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "support":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
  }
};

// ── Personalization Placeholder Helper ─────────────────────────────────────────
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

export default function EmailCampaignPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates" | "mailboxes">("campaigns");

  // Campaigns State
  const [campaigns, setCampaigns] = useState<EmailCampaignRow[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Templates State
  const [templates, setTemplates] = useState<EmailMarketingTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);

  // Mailboxes State (Method 2: Custom SMTP Integration)
  const [mailboxes, setMailboxes] = useState<UserMailbox[]>([]);
  const [mailboxesLoading, setMailboxesLoading] = useState(false);
  const [testingMailboxId, setTestingMailboxId] = useState<number | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(true);

  // Connect Mailbox Form State
  const [mbProvider, setMbProvider] = useState<"gmail" | "outlook" | "zoho" | "custom">("gmail");
  const [mbSenderName, setMbSenderName] = useState("");
  const [mbSenderEmail, setMbSenderEmail] = useState("");
  const [mbSmtpHost, setMbSmtpHost] = useState("smtp.gmail.com");
  const [mbSmtpPort, setMbSmtpPort] = useState(587);
  const [mbEncryption, setMbEncryption] = useState<"tls" | "ssl" | "none">("tls");
  const [mbUsername, setMbUsername] = useState("");
  const [mbPassword, setMbPassword] = useState("");
  const [mbIsDefault, setMbIsDefault] = useState(true);
  const [connectingMailbox, setConnectingMailbox] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [connectSuccess, setConnectSuccess] = useState("");

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<EmailMarketingTemplate | null>(null);

  // Create Template Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplCategory, setNewTplCategory] = useState("Business");
  const [newTplSubject, setNewTplSubject] = useState("");
  const [newTplDescription, setNewTplDescription] = useState("");
  const [newTplBody, setNewTplBody] = useState("");
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Load Campaigns
  const loadCampaigns = async () => {
    try {
      const data = await api.getEmailCampaigns();
      setCampaigns(data);
    } catch (e) {
      console.warn("Failed to load email campaigns:", e);
    } finally {
      setCampaignsLoading(false);
    }
  };

  // Load Templates
  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const data = await api.getEmailTemplates();
      setTemplates(data);
    } catch (e) {
      console.warn("Failed to load email templates:", e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load Connected Mailboxes
  const loadMailboxes = async () => {
    setMailboxesLoading(true);
    try {
      const data = await api.getMailboxes();
      setMailboxes(data);
    } catch (e) {
      console.warn("Failed to load mailboxes:", e);
    } finally {
      setMailboxesLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadCampaigns();
    loadTemplates();
    loadMailboxes();
    const interval = setInterval(() => {
      loadCampaigns();
    }, 12000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleProviderSelect = (p: "gmail" | "outlook" | "zoho" | "custom") => {
    setMbProvider(p);
    setConnectError("");
    setConnectSuccess("");
    if (p === "gmail") {
      setMbSmtpHost("smtp.gmail.com");
      setMbSmtpPort(587);
      setMbEncryption("tls");
      setShowAppPasswordGuide(true);
    } else if (p === "outlook") {
      setMbSmtpHost("smtp.office365.com");
      setMbSmtpPort(587);
      setMbEncryption("tls");
      setShowAppPasswordGuide(false);
    } else if (p === "zoho") {
      setMbSmtpHost("smtp.zoho.in");
      setMbSmtpPort(587);
      setMbEncryption("tls");
      setShowAppPasswordGuide(false);
    } else {
      setMbSmtpHost("");
      setMbSmtpPort(587);
      setMbEncryption("tls");
      setShowAppPasswordGuide(false);
    }
  };

  const handleConnectMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError("");
    setConnectSuccess("");

    if (!mbSenderName.trim() || !mbSenderEmail.trim() || !mbSmtpHost.trim() || !mbPassword.trim()) {
      setConnectError("Please fill in all required fields (Sender Name, Email, SMTP Host, Password).");
      return;
    }

    setConnectingMailbox(true);
    try {
      const usernameVal = mbUsername.trim() || mbSenderEmail.trim();
      const created = await api.createMailbox({
        provider: mbProvider,
        sender_name: mbSenderName.trim(),
        sender_email: mbSenderEmail.trim(),
        smtp_host: mbSmtpHost.trim(),
        smtp_port: Number(mbSmtpPort) || 587,
        smtp_encryption: mbEncryption,
        username: usernameVal,
        password: mbPassword.trim(),
        is_default: mbIsDefault,
        send_test_on_create: true,
      });

      setConnectSuccess("✅ Connected and verified! Test email sent successfully.");
      await loadMailboxes();
      setTimeout(() => {
        setShowConnectModal(false);
        setConnectSuccess("");
        setMbPassword("");
      }, 1500);
    } catch (err: any) {
      setConnectError(err.message || "Failed to verify and connect mailbox. Please check your credentials.");
    } finally {
      setConnectingMailbox(false);
    }
  };

  const handleTestExistingMailbox = async (id: number) => {
    setTestingMailboxId(id);
    try {
      const res = await api.testExistingMailbox(id);
      alert(`✅ ${res.message}`);
      await loadMailboxes();
    } catch (err: any) {
      alert(`❌ Verification Failed: ${err.message || "Could not connect to SMTP server"}`);
      await loadMailboxes();
    } finally {
      setTestingMailboxId(null);
    }
  };

  const handleSetDefaultMailbox = async (id: number) => {
    try {
      await api.setDefaultMailbox(id);
      await loadMailboxes();
    } catch (err: any) {
      alert(err.message || "Failed to set default mailbox");
    }
  };

  const handleDeleteMailbox = async (id: number) => {
    if (!confirm("Disconnect this email mailbox? Broadcast campaigns will no longer be able to send from this address.")) return;
    try {
      await api.deleteMailbox(id);
      setMailboxes((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to disconnect mailbox");
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("Delete this email campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteEmailCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete campaign");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Delete this custom template?")) return;
    setDeletingTemplateId(id);
    try {
      await api.deleteEmailTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete template");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!newTplName.trim() || !newTplSubject.trim() || !newTplBody.trim()) {
      setCreateError("Name, subject, and content are required.");
      return;
    }

    setCreatingTemplate(true);
    try {
      const created = await api.createEmailTemplate({
        name: newTplName.trim(),
        category: newTplCategory,
        subject: newTplSubject.trim(),
        description: newTplDescription.trim(),
        html_body: newTplBody.trim(),
      });
      setTemplates((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setNewTplName("");
      setNewTplSubject("");
      setNewTplDescription("");
      setNewTplBody("");
    } catch (err: any) {
      setCreateError(err.message || "Failed to create template");
    } finally {
      setCreatingTemplate(false);
    }
  };

  if (!isLoggedIn) return null;

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCat =
      selectedCategory === "All" ||
      t.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  // Campaign Stats
  const totalCampaigns = campaigns.length;
  const runningCampaigns = campaigns.filter((c) => c.status === "running").length;
  const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
  const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);

  return (
    <DashboardShell title="Email Marketing">
      <div className="flex flex-col gap-6 p-1 sm:p-4">

        {/* ── Top Header & Tab Selector ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
              <Mail className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              Email Marketing &amp; Campaigns
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Design high-converting email templates and launch marketing broadcasts with AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "mailboxes" && (
              <button
                onClick={() => {
                  setShowConnectModal(true);
                  setConnectError("");
                  setConnectSuccess("");
                }}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Connect Email Account
              </button>
            )}

            {activeTab === "templates" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                <Plus className="h-4 w-4" />
                Custom Template
              </button>
            )}

            {activeTab === "campaigns" && (
              <button
                id="new-email-campaign-btn"
                onClick={() => router.push("/email-campaign/new")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "campaigns"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Send className="h-4 w-4" />
            Active Campaigns
            <span className="ml-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300 font-mono">
              {campaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "templates"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <LayoutTemplate className="h-4 w-4" />
            Template Library
            <span className="ml-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 px-2 py-0.5 text-xs text-violet-700 dark:text-violet-300 font-mono font-semibold">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("mailboxes")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "mailboxes"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Mail className="h-4 w-4 text-emerald-500" />
            Connected Mailboxes (SMTP)
            <span className="ml-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300 font-mono font-bold">
              {mailboxes.length}
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: CAMPAIGNS LIST & STATS
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "campaigns" && (
          <div className="flex flex-col gap-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
              {[
                { label: "Total Campaigns", value: totalCampaigns, icon: Mail, color: "violet" },
                { label: "Running", value: runningCampaigns, icon: Loader2, color: "blue" },
                { label: "Completed", value: completedCampaigns, icon: CheckCircle2, color: "emerald" },
                { label: "Drafts", value: draftCampaigns, icon: Clock, color: "amber" },
                { label: "Emails Delivered", value: totalEmailsSent, icon: Send, color: "indigo" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19]"
                >
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">{value}</h3>
                </div>
              ))}
            </div>

            {/* Campaigns Table */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Recent Broadcasts</h3>
                <span className="text-xs text-zinc-500">Live updating</span>
              </div>

              {campaignsLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading campaigns…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-400">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/20">
                    <Mail className="h-8 w-8 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium">No email campaigns created yet.</p>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className="mt-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:opacity-95 transition"
                  >
                    Pick a template to get started &rarr;
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                        {["Campaign Name", "Subject", "Status", "Contacts", "Sent", "Failed", "Created", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {campaigns.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/email-campaign/${c.id}`)}
                        >
                          <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="px-5 py-3.5 max-w-[220px] truncate text-zinc-600 dark:text-zinc-400">
                            {c.subject}
                          </td>
                          <td className="px-5 py-3.5">{getStatusBadge(c.status)}</td>
                          <td className="px-5 py-3.5 font-mono text-zinc-700 dark:text-zinc-300">
                            {c.total}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {c.sent}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-mono">
                              <XCircle className="h-3.5 w-3.5" />
                              {c.failed}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400 text-xs">
                            {c.created_at}
                          </td>
                          <td
                            className="px-5 py-3.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                title="View Details"
                                onClick={() => router.push(`/email-campaign/${c.id}`)}
                                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-white transition"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => handleDeleteCampaign(c.id)}
                                disabled={deletingId === c.id}
                                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition"
                              >
                                {deletingId === c.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 2: MARKETING TEMPLATE LIBRARY
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "templates" && (
          <div className="flex flex-col gap-6">

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0B0F19] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search templates by title, subject, keyword…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/70 text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Personalization Variables Callout */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                <Sparkles className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                <span>Personalization tags:</span>
                <span className="font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px]">{"{{name}}"}</span>
                <span className="font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px]">{"{{email}}"}</span>
                <span className="font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px]">{"{{company}}"}</span>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(({ id, label, icon: Icon }) => {
                const count = templates.filter(
                  (t) => id === "All" || t.category.toLowerCase() === id.toLowerCase()
                ).length;
                const isSelected = selectedCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/20"
                        : "bg-white dark:bg-[#0B0F19] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10.5px] font-mono ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Template Grid */}
            {templatesLoading ? (
              <div className="flex items-center justify-center py-24 gap-3 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                Loading template library…
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400 bg-white dark:bg-[#0B0F19] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <LayoutTemplate className="h-10 w-10 text-zinc-400" />
                <p className="text-sm font-medium">No templates found matching your filter.</p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
                  className="text-xs text-violet-600 hover:underline font-semibold"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-violet-800"
                  >
                    {/* Top Metadata */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getCategoryColor(
                            template.category
                          )}`}
                        >
                          <Tag className="h-3 w-3" />
                          {template.category}
                        </span>

                        {!template.is_system && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                              Custom
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              disabled={deletingTemplateId === template.id}
                              className="text-zinc-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                              title="Delete custom template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {template.name}
                      </h4>

                      <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {template.description || "Reusable marketing template."}
                      </p>

                      {/* Subject Preview Pill */}
                      <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 p-2.5 border border-zinc-100 dark:border-zinc-800/80">
                        <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate font-medium">
                          {template.subject}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/60 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </button>

                      <button
                        onClick={() => router.push(`/email-campaign/new?template_id=${template.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 hover:shadow-md hover:shadow-violet-500/30 transition-all"
                      >
                        Use Template
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}



        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: PREVIEW TEMPLATE (CLEAN DESKTOP VIEW)
        ══════════════════════════════════════════════════════════════════════ */}
        {previewTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getCategoryColor(previewTemplate.category)}`}>
                    {previewTemplate.category}
                  </span>
                  <span className="text-base font-bold text-zinc-900 dark:text-white">
                    {previewTemplate.name}
                  </span>
                </div>

                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subject Bar with Placeholders */}
              <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 flex items-center gap-2 text-xs">
                <span className="font-semibold text-zinc-500 shrink-0">Subject:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate">
                  {resolvePlaceholders(previewTemplate.subject)}
                </span>
              </div>

              {/* Email Content Frame (Clean Desktop View) */}
              <div className="flex-1 overflow-y-auto p-5 bg-zinc-100/80 dark:bg-zinc-900 flex justify-center">
                <div className="w-full max-w-3xl rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm overflow-hidden">
                  <iframe
                    srcDoc={resolvePlaceholders(previewTemplate.html_body)}
                    className="w-full min-h-[520px] border-0 bg-white"
                    title="Email Template Live Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Selecting this creates an independent campaign copy without changing the library.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/email-campaign/new?template_id=${previewTemplate.id}`);
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:opacity-95 transition"
                  >
                    Use This Template
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 3: CONNECTED MAILBOXES (CUSTOM SMTP - METHOD 2)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "mailboxes" && (
          <div className="flex flex-col gap-6">
            
            {/* Method 2 Advantage Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-6 shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-teal-950/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    Method 2: Direct Mailbox Sending (SMTP)
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Send Campaigns Directly from Your Own Real Email
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Connect your <strong>Google Workspace, Gmail, Microsoft 365, Zoho, or cPanel</strong> account. 
                    CallingGen dispatches emails through your authenticated mail server so emails appear in your own 
                    <strong>Sent folder</strong>, pass all spam filters, and replies go directly to your personal inbox.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowConnectModal(true);
                    setConnectError("");
                    setConnectSuccess("");
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 shadow-md shadow-emerald-600/20 transition shrink-0 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  + Connect Email Account
                </button>
              </div>

              {/* 4 Feature Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-emerald-200/60 dark:border-emerald-900/30 text-xs">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% White-Labeled</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Zero Spam Penalties</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sent Folder Sync</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Direct Inbox Replies</span>
                </div>
              </div>
            </div>

            {/* Mailboxes Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-600" />
                  Connected Email Accounts ({mailboxes.length})
                </h3>
              </div>

              {mailboxesLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-zinc-500">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  Loading connected mailboxes…
                </div>
              ) : mailboxes.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-4">
                    <Mail className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                    No Email Mailboxes Connected Yet
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mt-1.5 mb-6">
                    Connect your Google Workspace, Gmail, Outlook, or private domain SMTP in 60 seconds with an App Password to begin sending verified marketing broadcasts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConnectModal(true);
                      setConnectError("");
                      setConnectSuccess("");
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Connect Your First Mailbox
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mailboxes.map((mb) => (
                    <div
                      key={mb.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0B0F19] dark:hover:border-emerald-800"
                    >
                      {/* Top Bar */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                              mb.provider === "gmail"
                                ? "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300"
                                : mb.provider === "outlook"
                                ? "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                                : mb.provider === "zoho"
                                ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {mb.provider === "gmail"
                              ? "Google / Gmail"
                              : mb.provider === "outlook"
                              ? "Microsoft 365"
                              : mb.provider === "zoho"
                              ? "Zoho Mail"
                              : "Custom SMTP"}
                          </span>

                          <div className="flex items-center gap-2">
                            {mb.is_default && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Check className="h-3 w-3" />
                                Default
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mb.is_verified
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200/60"
                              }`}
                            >
                              {mb.is_verified ? "Verified" : "Needs Re-test"}
                            </span>
                          </div>
                        </div>

                        {/* Sender Info */}
                        <div className="space-y-1">
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white truncate">
                            {mb.sender_name}
                          </h4>
                          <p className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 truncate">
                            {mb.sender_email}
                          </p>
                        </div>

                        {/* Connection Details */}
                        <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 p-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Server:</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold">
                              {mb.smtp_host}:{mb.smtp_port}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Security:</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-200 text-[11px] uppercase">
                              {mb.smtp_encryption}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Username:</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-200 text-[11px] truncate max-w-[150px]">
                              {mb.username}
                            </span>
                          </div>
                          {mb.last_tested_at && (
                            <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-800 text-[10px] text-zinc-400">
                              <span>Last Verified:</span>
                              <span>{new Date(mb.last_tested_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {mb.error_message && (
                          <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded-lg border border-red-200 dark:border-red-900">
                            {mb.error_message}
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {!mb.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultMailbox(mb.id)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTestExistingMailbox(mb.id)}
                            disabled={testingMailboxId === mb.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {testingMailboxId === mb.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Test
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMailbox(mb.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                          title="Disconnect Mailbox"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: CREATE CUSTOM TEMPLATE
        ══════════════════════════════════════════════════════════════════════ */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-violet-600" />
                  Create Custom Marketing Template
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Customer VIP Invite"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={newTplCategory}
                      onChange={(e) => setNewTplCategory(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                    >
                      <option value="Business">Business</option>
                      <option value="Sales">Sales &amp; Growth</option>
                      <option value="Support">Customer Support</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                      Short Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Re-engage high value accounts"
                      value={newTplDescription}
                      onChange={(e) => setNewTplDescription(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                    Default Email Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Announcement from {{company}}"
                    value={newTplSubject}
                    onChange={(e) => setNewTplSubject(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase text-zinc-500">
                      HTML Content *
                    </label>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <span>Insert:</span>
                      <button
                        type="button"
                        onClick={() => setNewTplBody((b) => b + " {{name}} ")}
                        className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-violet-600 hover:underline"
                      >
                        {"{{name}}"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTplBody((b) => b + " {{company}} ")}
                        className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-violet-600 hover:underline"
                      >
                        {"{{company}}"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder="<h2>Hi {{name}},</h2><p>Your message here...</p>"
                    value={newTplBody}
                    onChange={(e) => setNewTplBody(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3.5 text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                  />
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                    {createError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTemplate}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 disabled:opacity-60"
                  >
                    {creatingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save to Template Library"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: CONNECT EMAIL ACCOUNT (CUSTOM SMTP - METHOD 2)
        ══════════════════════════════════════════════════════════════════════ */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Connect Your Email Account (SMTP)
                    </h3>
                    <p className="text-xs text-zinc-500">Method 2: Send marketing broadcasts directly from your verified mailbox</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowConnectModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleConnectMailbox} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                
                {/* 1. Provider Selection Cards */}
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">
                    1. Select Email Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "gmail", label: "Google / Gmail", sub: "Workspace or Gmail" },
                      { id: "outlook", label: "Microsoft 365", sub: "Outlook / Office 365" },
                      { id: "zoho", label: "Zoho Mail", sub: "Zoho Workspace" },
                      { id: "custom", label: "Custom SMTP", sub: "cPanel / Private Server" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProviderSelect(p.id as any)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          mbProvider === p.id
                            ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                        }`}
                      >
                        <div className="font-bold text-zinc-900 dark:text-white text-xs">{p.label}</div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{p.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Step-by-Step Google App Password Guide (if Gmail selected) */}
                {mbProvider === "gmail" && (
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-xs">
                        <Info className="h-4 w-4 text-amber-600 shrink-0" />
                        How to get your Google 16-letter App Password:
                      </div>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        Open Google App Passwords <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90 pl-1 leading-relaxed">
                      <li>Go to <strong>Google Account</strong> (myaccount.google.com) &rarr; <strong>Security</strong></li>
                      <li>Enable <strong>2-Step Verification</strong> (if not already enabled)</li>
                      <li>Under 2-Step Verification, scroll down to <strong>App Passwords</strong></li>
                      <li>Enter App name <strong>&quot;CallingGen&quot;</strong> and click <strong>Create</strong></li>
                      <li>Copy the generated <strong>16-letter code</strong> and paste it in the App Password field below!</li>
                    </ol>
                  </div>
                )}

                {/* 3. Account Details Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Sender Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sai Sathwik - GenX Reality"
                      value={mbSenderName}
                      onChange={(e) => setMbSenderName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Sender Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="saisathwik@genxreality.in"
                      value={mbSenderEmail}
                      onChange={(e) => {
                        setMbSenderEmail(e.target.value);
                        if (!mbUsername) setMbUsername(e.target.value);
                      }}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="smtp.gmail.com"
                      value={mbSmtpHost}
                      onChange={(e) => setMbSmtpHost(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        Port &amp; Security *
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        required
                        value={mbSmtpPort}
                        onChange={(e) => setMbSmtpPort(Number(e.target.value))}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                      />
                      <select
                        value={mbEncryption}
                        onChange={(e) => setMbEncryption(e.target.value as any)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                      >
                        <option value="tls">TLS (Port 587)</option>
                        <option value="ssl">SSL (Port 465)</option>
                        <option value="none">Plain (Port 25)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Username / Login Email *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="saisathwik@genxreality.in"
                      value={mbUsername || mbSenderEmail}
                      onChange={(e) => setMbUsername(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      {mbProvider === "gmail" ? "16-Letter App Password *" : "Password / App Password *"}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="•••• •••• •••• ••••"
                      value={mbPassword}
                      onChange={(e) => setMbPassword(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:border-emerald-500 font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="mbIsDefault"
                    checked={mbIsDefault}
                    onChange={(e) => setMbIsDefault(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="mbIsDefault" className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    Set as default sender for new email marketing campaigns
                  </label>
                </div>

                {connectError && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{connectError}</span>
                  </div>
                )}

                {connectSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{connectSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connectingMailbox}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
                  >
                    {connectingMailbox ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Testing &amp; Connecting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Send Test Email &amp; Connect Mailbox
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}

