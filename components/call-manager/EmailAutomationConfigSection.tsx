"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Edit3,
  AlertCircle,
  ExternalLink,
  Lock,
  Zap,
} from "lucide-react";

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

// ── MultiSelectDropdown (reused from WhatsApp section pattern) ─────────────

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
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    method: string | null;
  } | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [previewRuleIdx, setPreviewRuleIdx] = useState<number | null>(null);
  const [editingBodyIdx, setEditingBodyIdx] = useState<number | null>(null);

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

    // Templates
    setLoadingTemplates(true);
    fetch(`${BASE_URL}/api/email/automation/templates`, { headers })
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoadingTemplates(false));
  }, []);

  const isConnected = connectionStatus?.connected ?? false;
  const isEnabled = value.enabled;
  const isToggleAllowed = isConnected && !disabled;

  const handleToggleEnabled = () => {
    if (!isToggleAllowed) return;
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
    if (previewRuleIdx === index) setPreviewRuleIdx(null);
    if (editingBodyIdx === index) setEditingBodyIdx(null);
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
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
              Automatically send personalized email templates to contacts based on call outcome.
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
            disabled={!isToggleAllowed}
            title={
              !isConnected
                ? "Connect an email account in Email Settings first"
                : undefined
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              !isToggleAllowed
                ? "opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-700"
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
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-amber-800 dark:text-amber-300">
              No email account connected
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Connect Resend or an SMTP mailbox in Email Settings to enable automation.
            </p>
          </div>
          <a
            href="/email-campaign"
            className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap"
          >
            Go to Email Settings
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* ── Connected badge ──────────────────────────────────────────────── */}
      {!loadingConnection && isConnected && !isEnabled && (
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Email connected via{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
            {connectionStatus?.method || "resend"}
          </span>{" "}
          — toggle ON to enable automation
        </div>
      )}

      {/* ── Rule Builder ─────────────────────────────────────────────────── */}
      {isEnabled && (
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {(value.rules || []).map((rule, idx) => {
            const tmpl = getTemplateById(rule.template_id);
            const isCustom = rule.template_id === "custom";
            const isPreviewOpen = previewRuleIdx === idx;
            const isEditingBody = editingBodyIdx === idx;
            const subject = resolvedSubject(rule);
            const body = resolvedBody(rule);

            return (
              <div
                key={rule.id || idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/30 p-4 space-y-4 shadow-2xs"
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

                {/* 2. Template Picker */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-zinc-400" />
                    Email Template
                  </span>

                  {loadingTemplates ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading templates…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                                custom_body: "",
                              });
                              setEditingBodyIdx(
                                tmplOpt.id === "custom" ? idx : null
                              );
                              setPreviewRuleIdx(null);
                            }}
                            className={`group flex flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40 ring-1 ring-blue-500/30"
                                : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-700"
                            }`}
                          >
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                              {tmplOpt.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                              {tmplOpt.description}
                            </span>
                            {isSelected && (
                              <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <Check className="w-3 h-3" />
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Custom Subject (always shown, overrides template) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Subject Line{" "}
                    <span className="normal-case font-normal text-zinc-400">
                      (optional — overrides template default)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={rule.custom_subject}
                    onChange={(e) =>
                      handleUpdateRule(idx, { custom_subject: e.target.value })
                    }
                    placeholder={
                      tmpl?.subject || "e.g. Great speaking with you, {{name}}!"
                    }
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* 4. Custom Body / Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Email Body
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Placeholder chips */}
                      <div className="hidden sm:flex items-center gap-1">
                        {["{{name}}", "{{campaign_name}}", "{{appointment_date}}"].map(
                          (ph) => (
                            <button
                              key={ph}
                              type="button"
                              onClick={() => {
                                const current = rule.custom_body || tmpl?.body || "";
                                handleUpdateRule(idx, {
                                  custom_body: current + (current ? " " : "") + ph,
                                });
                                setEditingBodyIdx(idx);
                              }}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition"
                            >
                              +{ph}
                            </button>
                          )
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewRuleIdx(isPreviewOpen ? null : idx)
                        }
                        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isPreviewOpen ? "Hide" : "Preview"}
                      </button>

                      {!isEditingBody && (
                        <button
                          type="button"
                          onClick={() => setEditingBodyIdx(idx)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {rule.custom_body ? "Edit" : "Customize"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editing body textarea */}
                  {isEditingBody && (
                    <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-zinc-900 p-3 space-y-2 shadow-xs">
                      <textarea
                        rows={5}
                        value={rule.custom_body || tmpl?.body || ""}
                        onChange={(e) =>
                          handleUpdateRule(idx, { custom_body: e.target.value })
                        }
                        placeholder={
                          tmpl?.body ||
                          "Hi {{name}},\n\nThank you for speaking with us about {{campaign_name}}.\n\nBest regards,\nThe Team"
                        }
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-y"
                      />
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <span className="text-[10px] text-zinc-400 mr-1">Placeholders:</span>
                        {[
                          "{{name}}",
                          "{{phone}}",
                          "{{campaign_name}}",
                          "{{appointment_date}}",
                          "{{appointment_time}}",
                        ].map((ph) => (
                          <button
                            key={ph}
                            type="button"
                            onClick={() => {
                              const current =
                                rule.custom_body ||
                                tmpl?.body ||
                                "";
                              handleUpdateRule(idx, {
                                custom_body:
                                  current +
                                  (current ? " " : "") +
                                  ph,
                              });
                            }}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition"
                          >
                            +{ph}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setEditingBodyIdx(null)}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  {isPreviewOpen && !isEditingBody && (
                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3.5 space-y-2 shadow-xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                          {subject || "(no subject)"}
                        </span>
                      </div>
                      <pre className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                        {body || "(template body will appear here)"}
                      </pre>
                      <p className="text-[10px] text-zinc-400 italic">
                        Preview uses raw placeholders — they'll be replaced with real contact data on send.
                      </p>
                    </div>
                  )}

                  {/* Quick summary when not editing or previewing */}
                  {!isEditingBody && !isPreviewOpen && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                        {subject || tmpl?.subject || "Click Preview to see the email"}
                      </span>
                      {rule.custom_body && (
                        <span className="ml-auto text-[10px] font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          Custom body
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Rule Button */}
          <button
            type="button"
            onClick={handleAddRule}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-600 dark:hover:text-blue-400 transition"
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
          Email Automation is disabled. Toggle ON to configure post-call email rules.
        </div>
      )}
    </div>
  );
}
