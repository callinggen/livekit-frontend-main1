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
  CustomEmailDomain,
  DnsRecordItem,
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
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates" | "domains">("campaigns");

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

  // Custom Domains State
  const [domains, setDomains] = useState<CustomEmailDomain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [deletingDomainId, setDeletingDomainId] = useState<number | null>(null);

  // Add Domain Modal
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState("");
  const [newDomainRegion, setNewDomainRegion] = useState("us-east-1");
  const [addingDomain, setAddingDomain] = useState(false);
  const [addDomainError, setAddDomainError] = useState("");

  // DNS Records & Verification Modal
  const [selectedDnsDomain, setSelectedDnsDomain] = useState<CustomEmailDomain | null>(null);
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dnsCheckMessage, setDnsCheckMessage] = useState<string | null>(null);

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

  // Load Custom Domains
  const loadDomains = async () => {
    setDomainsLoading(true);
    try {
      const data = await api.getCustomDomains();
      setDomains(data);
    } catch (e) {
      console.warn("Failed to load sending domains:", e);
    } finally {
      setDomainsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    loadCampaigns();
    loadTemplates();
    loadDomains();
    const interval = setInterval(loadCampaigns, 12000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

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

  // ── Add Custom Domain ──
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDomainError("");
    if (!newDomainInput.trim()) {
      setAddDomainError("Please provide a domain name (e.g. company.com).");
      return;
    }

    setAddingDomain(true);
    try {
      const created = await api.createCustomDomain({
        domain: newDomainInput.trim(),
        region: newDomainRegion,
      });
      setDomains((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
      setShowAddDomainModal(false);
      setNewDomainInput("");
      // Immediately open DNS view modal so user can copy records
      setSelectedDnsDomain(created);
    } catch (err: any) {
      setAddDomainError(err.message || "Failed to add domain.");
    } finally {
      setAddingDomain(false);
    }
  };

  // ── Delete Custom Domain ──
  const handleDeleteDomain = async (id: number, domainName: string) => {
    if (!confirm(`Delete sending domain '${domainName}'? Campaigns will no longer be able to send from this domain.`)) return;
    setDeletingDomainId(id);
    try {
      await api.deleteCustomDomain(id);
      setDomains((prev) => prev.filter((d) => d.id !== id));
      if (selectedDnsDomain?.id === id) setSelectedDnsDomain(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete domain");
    } finally {
      setDeletingDomainId(null);
    }
  };

  // ── Run Live DNS Verification ──
  const handleVerifyDns = async (domainId: number) => {
    setVerifyingDns(true);
    setDnsCheckMessage(null);
    try {
      const result = await api.verifyCustomDomain(domainId);
      setDnsCheckMessage(result.message);

      // Update in domains list
      setDomains((prev) =>
        prev.map((d) =>
          d.id === domainId
            ? {
                ...d,
                status: result.status,
                is_verified: result.is_verified,
                sending_enabled: result.sending_enabled,
                dns_records: result.dns_records,
                last_checked_at: new Date().toISOString(),
              }
            : d
        )
      );

      // Update in modal view if open
      if (selectedDnsDomain && selectedDnsDomain.id === domainId) {
        setSelectedDnsDomain((prev) =>
          prev
            ? {
                ...prev,
                status: result.status,
                is_verified: result.is_verified,
                sending_enabled: result.sending_enabled,
                dns_records: result.dns_records,
                last_checked_at: new Date().toISOString(),
              }
            : null
        );
      }
    } catch (err: any) {
      setDnsCheckMessage(err.message || "Failed to run DNS verification check.");
    } finally {
      setVerifyingDns(false);
    }
  };

  // ── Copy Helper ──
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
              Design high-converting email templates, manage verified sending domains, and launch broadcasts via Resend.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "templates" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                <Plus className="h-4 w-4" />
                Custom Template
              </button>
            )}

            {activeTab === "domains" && (
              <button
                onClick={() => setShowAddDomainModal(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Sending Domain
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
            onClick={() => setActiveTab("domains")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "domains"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            Sending Domains
            <span className="ml-1.5 rounded-full bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-300 font-mono font-semibold">
              {domains.length}
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
            TAB 3: SENDING DOMAINS & DNS MANAGEMENT
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "domains" && (
          <div className="flex flex-col gap-6">

            {/* Info Callout */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4.5 dark:border-blue-900/40 dark:bg-blue-950/20 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                <strong className="font-semibold block text-sm mb-0.5">Brand Your Outbound Emails with Custom Domains</strong>
                Connect your business domain (e.g. <span className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded">yourcompany.com</span>) to send marketing broadcasts directly from your own company address with full DKIM &amp; SPF authentication.
              </div>
            </div>

            {/* Domain List Cards */}
            {domainsLoading ? (
              <div className="flex items-center justify-center py-24 gap-3 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                Loading sending domains…
              </div>
            ) : domains.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-400 bg-white dark:bg-[#0B0F19] rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Globe className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">No Custom Domains Connected</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                    Campaigns currently send from the default CallingGen platform domain. Add your domain to start sending with your brand.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDomainModal(true)}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:opacity-95 transition"
                >
                  + Add Your First Domain
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {domains.map((dom) => {
                  const verifiedRecordsCount = (dom.dns_records || []).filter((r) => r.dns_verified).length;
                  const totalRecordsCount = (dom.dns_records || []).length;

                  return (
                    <div
                      key={dom.id}
                      className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#0B0F19] transition hover:shadow-md"
                    >
                      <div>
                        {/* Domain Top Row */}
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                              {dom.domain}
                            </h3>
                          </div>

                          {dom.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <Clock className="h-3.5 w-3.5" />
                              DNS Pending
                            </span>
                          )}
                        </div>

                        {/* Status detail */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <div>
                            Sending:{" "}
                            <span className={dom.sending_enabled ? "text-emerald-600 font-semibold" : "text-amber-600 font-medium"}>
                              {dom.sending_enabled ? "Enabled" : "Waiting for DNS"}
                            </span>
                          </div>
                          <div>&bull;</div>
                          <div>
                            Region: <span className="font-mono text-zinc-700 dark:text-zinc-300">{dom.region}</span>
                          </div>
                        </div>

                        {/* DNS Record Progress */}
                        {totalRecordsCount > 0 && (
                          <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-medium text-zinc-700 dark:text-zinc-300">DNS Configuration</span>
                              <span className="font-mono text-xs font-semibold text-zinc-500">
                                {verifiedRecordsCount} of {totalRecordsCount} records active
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  dom.is_verified ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                                style={{ width: `${(verifiedRecordsCount / totalRecordsCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {dom.error_message && (
                          <div className="mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs border border-red-200 dark:border-red-900">
                            {dom.error_message}
                          </div>
                        )}
                      </div>

                      {/* Domain Action Buttons */}
                      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <button
                            onClick={() => {
                              setSelectedDnsDomain(dom);
                              setDnsCheckMessage(null);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                          >
                            <Info className="h-3.5 w-3.5 text-blue-500" />
                            View DNS Records
                          </button>

                          <button
                            onClick={() => handleVerifyDns(dom.id)}
                            disabled={verifyingDns}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 px-3.5 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition"
                            title="Perform live DNS lookup"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${verifyingDns ? "animate-spin" : ""}`} />
                            Check DNS
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteDomain(dom.id, dom.domain)}
                          disabled={deletingDomainId === dom.id}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                          title="Remove domain"
                        >
                          {deletingDomainId === dom.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            MODAL: ADD CUSTOM SENDING DOMAIN
        ══════════════════════════════════════════════════════════════════════ */}
        {showAddDomainModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden">
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-violet-600" />
                  Add Custom Sending Domain
                </h3>
                <button
                  onClick={() => setShowAddDomainModal(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddDomain} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                    Domain Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. acmecorp.com or mail.acmecorp.com"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Enter your root domain or subdomain without http:// or www.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-500 mb-1.5">
                    Resend Delivery Region
                  </label>
                  <select
                    value={newDomainRegion}
                    onChange={(e) => setNewDomainRegion(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-violet-500"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="eu-west-1">Europe (Ireland)</option>
                    <option value="sa-east-1">South America (São Paulo)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  </select>
                </div>

                {addDomainError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900">
                    {addDomainError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowAddDomainModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingDomain}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 disabled:opacity-60"
                  >
                    {addingDomain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Continue & View DNS Records"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            MODAL: DNS RECORDS & LIVE VERIFICATION
        ══════════════════════════════════════════════════════════════════════ */}
        {selectedDnsDomain && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-violet-600" />
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      DNS Records: {selectedDnsDomain.domain}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Add these records to your DNS provider (Cloudflare, GoDaddy, Route53, Namecheap, etc.)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDnsDomain(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content / Table */}
              <div className="p-6 overflow-y-auto space-y-5">
                
                {/* DNS Check Feedback Notice */}
                {dnsCheckMessage && (
                  <div className="p-3.5 rounded-xl bg-violet-50 text-violet-800 text-xs dark:bg-violet-950/40 dark:text-violet-200 border border-violet-200 dark:border-violet-800 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-violet-600" />
                    <span>{dnsCheckMessage}</span>
                  </div>
                )}

                {/* DNS Records Table */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50/80 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Type</th>
                        <th className="px-4 py-2.5 text-left">Host / Name</th>
                        <th className="px-4 py-2.5 text-left">Value / Target</th>
                        <th className="px-4 py-2.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {(selectedDnsDomain.dns_records || []).map((rec, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400">
                            {rec.type}
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-900 dark:text-white max-w-[180px]">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{rec.name}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.name, `host_${idx}`)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white shrink-0"
                                title="Copy Host"
                              >
                                {copiedKey === `host_${idx}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-300 max-w-[240px]">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{rec.value}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(rec.value, `val_${idx}`)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white shrink-0"
                                title="Copy Value"
                              >
                                {copiedKey === `val_${idx}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {rec.dns_verified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Instructions Box */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 space-y-1.5">
                  <div className="font-semibold text-zinc-900 dark:text-white">How DNS Verification Works:</div>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-500 dark:text-zinc-400">
                    <li>Copy each Record Name and Value into your domain's DNS manager.</li>
                    <li>If your DNS provider automatically appends your domain (e.g. Cloudflare), enter only the subdomain prefix.</li>
                    <li>Click <strong>Check Verification Now</strong> to run an instant server-side lookup on public DNS.</li>
                  </ol>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-xs text-zinc-400">
                  {selectedDnsDomain.is_verified ? "Domain ready for sending" : "Waiting for DNS records to propagate"}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedDnsDomain(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => handleVerifyDns(selectedDnsDomain.id)}
                    disabled={verifyingDns}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/20 hover:opacity-95 transition disabled:opacity-60"
                  >
                    {verifyingDns ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking Public DNS…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Check Verification Now
                      </>
                    )}
                  </button>
                </div>
              </div>

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

      </div>
    </DashboardShell>
  );
}
