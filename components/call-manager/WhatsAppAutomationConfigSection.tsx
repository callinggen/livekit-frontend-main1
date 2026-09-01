"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Zap,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Paperclip,
  Check,
  X,
  Info,
  ShieldCheck,
  Upload,
  Layers,
} from "lucide-react";
import { WhatsAppAutomationConfig, WhatsAppAutomationRule } from "./types";
import AddMaterialModal, { MaterialItem } from "@/components/whatsapp/AddMaterialModal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://localhost:8000");

// Filter definitions matching the UI screenshots
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
    allLabel: "All Leads",
    options: [
      { label: "Hot Lead", value: "Hot Lead" },
      { label: "Warm Lead", value: "Warm Lead" },
      { label: "Cold Lead", value: "Cold Lead" },
      { label: "Interested", value: "Interested" },
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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isAllSelected = !selectedValues || selectedValues.length === 0 || selectedValues.includes("all") || selectedValues.includes(allLabel);

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
    let next: string[];
    if (exists) {
      next = current.filter((v) => v !== val);
    } else {
      next = [...current, val];
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1 min-w-[130px] flex-1 relative" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:border-violet-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition disabled:opacity-50"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
              className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 pointer-events-none"
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
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 font-semibold"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500 pointer-events-none"
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

interface Props {
  value?: WhatsAppAutomationConfig;
  onChange: (config: WhatsAppAutomationConfig) => void;
  disabled?: boolean;
}

export default function WhatsAppAutomationConfigSection({
  value = { enabled: false, rules: [] },
  onChange,
  disabled = false,
}: Props) {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Add Material Modal State
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [activeRuleIndexForAdd, setActiveRuleIndexForAdd] = useState<number | null>(null);

  // Fetch Material Base items (Real-time data from backend)
  const loadMaterials = async () => {
    try {
      setLoadingMaterials(true);
      let token: string | null = null;
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("callinggen-auth") || localStorage.getItem("callinggen-auth");
        if (stored) {
          try {
            token = JSON.parse(stored)?.token || null;
          } catch {
            token = localStorage.getItem("token") || null;
          }
        } else {
          token = localStorage.getItem("token") || null;
        }
      }
      const res = await fetch(`${BASE_URL}/api/whatsapp/materials`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to load materials for campaign automation:", err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const isEnabled = value.enabled;

  const handleToggleEnabled = () => {
    const nextEnabled = !isEnabled;
    let nextRules = value.rules || [];
    if (nextEnabled && nextRules.length === 0) {
      nextRules = [
        {
          id: `rule_${Date.now()}`,
          call_type_filters: [],
          ai_class_filters: ["Interested", "Hot Lead"],
          response_filters: [],
          status_filters: ["Completed"],
          require_permission: true,
          message_text: "Hi {{name}}, thank you for speaking with us! Here is the information regarding {{campaign_name}} you requested.",
          enabled: true,
          attachments: [],
        },
      ];
    }
    onChange({ enabled: nextEnabled, rules: nextRules });
  };

  const handleAddRule = () => {
    const newRule: WhatsAppAutomationRule = {
      id: `rule_${Date.now()}`,
      call_type_filters: [],
      ai_class_filters: ["Interested"],
      response_filters: [],
      status_filters: [],
      require_permission: true,
      message_text: "Hi {{name}}, thank you for your time on our call! Please find the details below.",
      enabled: true,
      attachments: [],
    };
    onChange({ enabled: true, rules: [...(value.rules || []), newRule] });
  };

  const handleUpdateRule = (index: number, updates: Partial<WhatsAppAutomationRule>) => {
    const nextRules = [...(value.rules || [])];
    nextRules[index] = { ...nextRules[index], ...updates };
    onChange({ enabled: isEnabled, rules: nextRules });
  };

  const handleDeleteRule = (index: number) => {
    const nextRules = (value.rules || []).filter((_, i) => i !== index);
    onChange({ enabled: isEnabled, rules: nextRules });
  };

  const handleSelectMaterialForRule = (index: number, materialId: number) => {
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      if (mat.type === "text") {
        handleUpdateRule(index, {
          material_id: mat.id,
          message_text: mat.content || "",
        });
      } else {
        const currentRule = value.rules[index];
        const existing = currentRule.attachments || [];
        if (!existing.some((a) => a.id === mat.id)) {
          handleUpdateRule(index, {
            attachments: [
              ...existing,
              {
                id: mat.id,
                title: mat.title,
                type: mat.type as "image" | "document",
                url: mat.file_url || "",
                file_size: mat.file_size,
                mime_type: mat.mime_type,
              },
            ],
          });
        }
      }
    }
  };

  const handleMaterialCreated = (newMaterial: MaterialItem) => {
    setMaterials((prev) => [newMaterial, ...prev]);
    if (activeRuleIndexForAdd !== null) {
      handleSelectMaterialForRule(activeRuleIndexForAdd, newMaterial.id);
    }
    setActiveRuleIndexForAdd(null);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              WhatsApp Automation
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Post-Call Follow-ups
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Automatically send WhatsApp materials based on live call outcome filters and consent.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
            {isEnabled ? "ON" : "OFF"}
          </span>
          <button
            type="button"
            onClick={handleToggleEnabled}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isEnabled ? "bg-emerald-600" : "bg-zinc-200 dark:bg-zinc-700"
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

      {/* When ON: Rule Builder */}
      {isEnabled && (
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {(value.rules || []).map((rule, idx) => (
            <div
              key={rule.id || idx}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800/40 p-4 space-y-4 shadow-xs"
            >
              {/* Rule Header */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-700/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Automation Rule #{idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => handleUpdateRule(idx, { enabled: e.target.checked })}
                      className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Active
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(idx)}
                    className="p-1 text-zinc-400 hover:text-rose-600 transition"
                    title="Delete rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* 4 Multi-Select Filter Dropdowns matching the screenshots */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Match Filters (Multi-Select Supported)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {/* 1. CALL TYPE */}
                  <MultiSelectDropdown
                    label={FILTER_DEFINITIONS.call_type.label}
                    allLabel={FILTER_DEFINITIONS.call_type.allLabel}
                    options={FILTER_DEFINITIONS.call_type.options}
                    selectedValues={rule.call_type_filters || []}
                    onChange={(vals) => handleUpdateRule(idx, { call_type_filters: vals })}
                  />

                  {/* 2. AI CLASS */}
                  <MultiSelectDropdown
                    label={FILTER_DEFINITIONS.ai_class.label}
                    allLabel={FILTER_DEFINITIONS.ai_class.allLabel}
                    options={FILTER_DEFINITIONS.ai_class.options}
                    selectedValues={rule.ai_class_filters || []}
                    onChange={(vals) => handleUpdateRule(idx, { ai_class_filters: vals })}
                  />

                  {/* 3. RESPONSE */}
                  <MultiSelectDropdown
                    label={FILTER_DEFINITIONS.response.label}
                    allLabel={FILTER_DEFINITIONS.response.allLabel}
                    options={FILTER_DEFINITIONS.response.options}
                    selectedValues={rule.response_filters || []}
                    onChange={(vals) => handleUpdateRule(idx, { response_filters: vals })}
                  />

                  {/* 4. STATUS */}
                  <MultiSelectDropdown
                    label={FILTER_DEFINITIONS.status.label}
                    allLabel={FILTER_DEFINITIONS.status.allLabel}
                    options={FILTER_DEFINITIONS.status.options}
                    selectedValues={rule.status_filters || []}
                    onChange={(vals) => handleUpdateRule(idx, { status_filters: vals })}
                  />
                </div>
              </div>

              {/* Consent & Permission Indicator */}
              <div className="flex items-center justify-between rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-900/50 px-3.5 py-2 text-xs text-violet-800 dark:text-violet-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="text-[11px] font-semibold">Post-Call Permission:</span>
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300">
                    Materials will only be dispatched if the contact consented during the call.
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.require_permission !== false}
                    onChange={(e) => handleUpdateRule(idx, { require_permission: e.target.checked })}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  Require Consent
                </label>
              </div>

              {/* Message Template + Insert from Material Base */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Message Template (with placeholders)
                  </label>

                  {materials.filter((m) => m.type === "text").length > 0 && (
                    <select
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val) handleSelectMaterialForRule(idx, val);
                      }}
                      defaultValue=""
                      className="text-[11px] font-medium text-violet-600 dark:text-violet-400 bg-transparent border-0 focus:ring-0 cursor-pointer"
                    >
                      <option value="" disabled>
                        + Insert from Material Base
                      </option>
                      {materials
                        .filter((m) => m.type === "text")
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={rule.message_text}
                  onChange={(e) => handleUpdateRule(idx, { message_text: e.target.value })}
                  placeholder="Hi {{name}}, thank you for speaking with us today..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Placeholders:</span>
                  {["{{name}}", "{{phone}}", "{{campaign_name}}", "{{appointment_date}}", "{{appointment_time}}"].map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      onClick={() => handleUpdateRule(idx, { message_text: rule.message_text + " " + ph })}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition"
                    >
                      +{ph}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dedicated Buttons to Add Material & Material Base */}
              <div className="space-y-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-700/70">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Attached Materials (Brochure / Pricing / Document / Image)
                    </label>
                    <p className="text-[10px] text-zinc-500">
                      Attach promotional collateral sent upon affirmative consent.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Proper Button 1: Upload Material Modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRuleIndexForAdd(idx);
                        setShowAddMaterialModal(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Material
                    </button>

                    {/* Proper Button 2: Select from Real-Time Material Base */}
                    {materials.filter((m) => m.type === "image" || m.type === "document").length > 0 && (
                      <select
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val) handleSelectMaterialForRule(idx, val);
                        }}
                        defaultValue=""
                        className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          📁 Select Existing ({materials.filter((m) => m.type !== "text").length})
                        </option>
                        {materials
                          .filter((m) => m.type === "image" || m.type === "document")
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              [{m.type.toUpperCase()}] {m.title}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Attached Material Badges / Cards */}
                {rule.attachments && rule.attachments.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {rule.attachments.map((att, attIdx) => (
                      <div
                        key={attIdx}
                        className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-xs"
                      >
                        {att.type === "image" ? (
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        )}
                        <span className="max-w-[160px] truncate font-semibold">{att.title}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500">
                          {att.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextAtts = rule.attachments?.filter((_, i) => i !== attIdx);
                            handleUpdateRule(idx, { attachments: nextAtts });
                          }}
                          className="text-zinc-400 hover:text-rose-500 transition p-0.5 rounded"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/80 p-3 text-center text-xs text-zinc-400">
                    No attachments added. Click <strong>&ldquo;Add Material&rdquo;</strong> to upload or select from Material Base.
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddRule}
            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-violet-300 dark:border-violet-800 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center justify-center gap-2 transition"
          >
            <Plus className="h-4 w-4" />
            Add Another Automation Rule
          </button>
        </div>
      )}

      {/* Shared AddMaterialModal */}
      <AddMaterialModal
        isOpen={showAddMaterialModal}
        onClose={() => {
          setShowAddMaterialModal(false);
          setActiveRuleIndexForAdd(null);
        }}
        onSuccess={handleMaterialCreated}
        initialType="document"
      />
    </div>
  );
}
