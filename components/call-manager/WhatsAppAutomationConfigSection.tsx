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
  BookOpen,
  Edit3,
  Bookmark,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  CheckSquare,
  Square,
  MessageSquare,
} from "lucide-react";
import { WhatsAppAutomationConfig, WhatsAppAutomationRule } from "./types";
import AddMaterialModal, { MaterialItem } from "@/components/whatsapp/AddMaterialModal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "" : "http://localhost:8000");

// Filter definitions matching the UI requirements with ALL by default
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
    <div className="flex flex-col gap-1 min-w-[125px] flex-1 relative" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:border-violet-400 focus:border-violet-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition disabled:opacity-50 shadow-2xs"
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

  // Multi-select Material Base Picker Modal state
  const [showMultiSelectPicker, setShowMultiSelectPicker] = useState(false);
  const [activeRuleIdxForPicker, setActiveRuleIdxForPicker] = useState<number | null>(null);
  const [pickerSelectedIds, setPickerSelectedIds] = useState<number[]>([]);
  const [pickerTab, setPickerTab] = useState<"all" | "text" | "image" | "document">("all");
  const [pickerSearch, setPickerSearch] = useState("");

  // Add Material Modal State (Same process as Material Base)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [activeRuleIndexForAdd, setActiveRuleIndexForAdd] = useState<number | null>(null);

  // Track which rule is actively editing its message text vs in "Done" saved view
  const [editingMessageRuleIdx, setEditingMessageRuleIdx] = useState<number | null>(null);
  const [ruleSavedNotice, setRuleSavedNotice] = useState<number | null>(null);

  // Fetch Material Base items
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
      // Default rule with ALL filters selected (empty arrays represent All)
      nextRules = [
        {
          id: `rule_${Date.now()}`,
          source_mode: "custom",
          call_type_filters: [], // All Types
          ai_class_filters: [],  // All Classes
          response_filters: [],  // All Responses
          status_filters: [],    // All Status
          require_permission: true,
          message_text: "Hi {{name}}, thank you for speaking with us! Here is the information regarding {{campaign_name}} you requested.",
          enabled: true,
          attachments: [],
          save_to_material_base: false,
          material_title: "",
        },
      ];
    }
    onChange({ enabled: nextEnabled, rules: nextRules });
  };

  const handleAddRule = () => {
    const newRule: WhatsAppAutomationRule = {
      id: `rule_${Date.now()}`,
      source_mode: "custom",
      call_type_filters: [], // All Types
      ai_class_filters: [],  // All Classes
      response_filters: [],  // All Responses
      status_filters: [],    // All Status
      require_permission: true,
      message_text: "Hi {{name}}, thank you for your time on our call! Please find the details below.",
      enabled: true,
      attachments: [],
      save_to_material_base: false,
      material_title: "",
    };
    const nextRules = [...(value.rules || []), newRule];
    onChange({ enabled: true, rules: nextRules });
    setEditingMessageRuleIdx(nextRules.length - 1);
  };

  const handleUpdateRule = (index: number, updates: Partial<WhatsAppAutomationRule>) => {
    const nextRules = [...(value.rules || [])];
    nextRules[index] = { ...nextRules[index], ...updates };
    onChange({ enabled: isEnabled, rules: nextRules });
  };

  const handleDeleteRule = (index: number) => {
    const nextRules = (value.rules || []).filter((_, i) => i !== index);
    onChange({ enabled: isEnabled, rules: nextRules });
    if (editingMessageRuleIdx === index) {
      setEditingMessageRuleIdx(null);
    }
  };

  // Open Multi-Select Picker for a specific rule
  const handleOpenMultiSelectPicker = (index: number) => {
    setActiveRuleIdxForPicker(index);
    const currentRule = value.rules[index];
    const initialSelectedIds: number[] = [];
    if (currentRule.material_id) {
      initialSelectedIds.push(currentRule.material_id);
    }
    if (currentRule.attachments && currentRule.attachments.length > 0) {
      currentRule.attachments.forEach((att) => {
        if (att.id) initialSelectedIds.push(att.id);
      });
    }
    setPickerSelectedIds(initialSelectedIds);
    setPickerSearch("");
    setPickerTab("all");
    setShowMultiSelectPicker(true);
  };

  // Toggle item in Multi-Select Picker
  const handleTogglePickerItem = (matId: number) => {
    setPickerSelectedIds((prev) =>
      prev.includes(matId) ? prev.filter((id) => id !== matId) : [...prev, matId]
    );
  };

  // Confirm Multi-Selection from Picker
  const handleConfirmMultiSelection = () => {
    if (activeRuleIdxForPicker === null) return;
    const ruleIdx = activeRuleIdxForPicker;
    const currentRule = value.rules[ruleIdx];
    const selectedMaterials = materials.filter((m) => pickerSelectedIds.includes(m.id));

    // Combine any selected text templates
    const selectedTexts = selectedMaterials.filter((m) => m.type === "text");
    let nextMessageText = currentRule.message_text;

    if (selectedTexts.length > 0) {
      const combinedTexts = selectedTexts
        .map((t) => t.content?.trim())
        .filter(Boolean)
        .join("\n\n");

      if (combinedTexts) {
        nextMessageText = combinedTexts;
      }
    }

    // Collect all selected images/documents
    const selectedFiles = selectedMaterials.filter((m) => m.type === "image" || m.type === "document");
    const nextAttachments = selectedFiles.map((f) => ({
      id: f.id,
      title: f.title,
      type: f.type as "image" | "document",
      url: f.file_url || "",
      file_size: f.file_size,
      mime_type: f.mime_type,
    }));

    handleUpdateRule(ruleIdx, {
      message_text: nextMessageText,
      attachments: nextAttachments,
      source_mode: "material_base",
      material_id: selectedTexts[0]?.id || currentRule.material_id,
    });

    setShowMultiSelectPicker(false);
    setActiveRuleIdxForPicker(null);
    setEditingMessageRuleIdx(null);
    setRuleSavedNotice(ruleIdx);
    setTimeout(() => setRuleSavedNotice(null), 2500);
  };

  // Callback when a material is created via the popup modal
  const handleMaterialCreated = (newMaterial: MaterialItem) => {
    setMaterials((prev) => [newMaterial, ...prev]);
    if (activeRuleIndexForAdd !== null) {
      const currentRule = value.rules[activeRuleIndexForAdd];
      if (newMaterial.type === "text") {
        handleUpdateRule(activeRuleIndexForAdd, {
          message_text: newMaterial.content || currentRule.message_text,
          material_id: newMaterial.id,
        });
      } else {
        const existing = currentRule.attachments || [];
        if (!existing.some((a) => a.id === newMaterial.id || a.url === newMaterial.file_url)) {
          handleUpdateRule(activeRuleIndexForAdd, {
            attachments: [
              ...existing,
              {
                id: newMaterial.id,
                title: newMaterial.title,
                type: newMaterial.type as "image" | "document",
                url: newMaterial.file_url || "",
                file_size: newMaterial.file_size,
                mime_type: newMaterial.mime_type,
              },
            ],
          });
        }
      }
      setRuleSavedNotice(activeRuleIndexForAdd);
      setTimeout(() => setRuleSavedNotice(null), 2500);
    }
    setActiveRuleIndexForAdd(null);
  };

  // Click "Done" on custom message composition
  const handleDoneComposing = async (index: number) => {
    const rule = value.rules[index];
    setEditingMessageRuleIdx(null);
    setRuleSavedNotice(index);
    setTimeout(() => setRuleSavedNotice(null), 2500);

    // If user checked "Save to Material Base", create it in the background
    if (rule.save_to_material_base && rule.message_text?.trim()) {
      try {
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
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: rule.material_title?.trim() || `Campaign Template - ${new Date().toLocaleDateString()}`,
            content: rule.message_text,
            type: "text",
            tags: "campaign-saved",
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setMaterials((prev) => [created, ...prev]);
        }
      } catch (err) {
        console.warn("Could not save to material base:", err);
      }
    }
  };

  // Filtered list for Multi-Select Picker Modal
  const pickerFilteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchTab = pickerTab === "all" || m.type === pickerTab;
      const matchSearch =
        !pickerSearch.trim() ||
        m.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        (m.tags && m.tags.toLowerCase().includes(pickerSearch.toLowerCase())) ||
        (m.content && m.content.toLowerCase().includes(pickerSearch.toLowerCase()));
      return matchTab && matchSearch;
    });
  }, [materials, pickerTab, pickerSearch]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
      {/* Header & Main Automation Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs">
            <Zap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              WhatsApp Automation
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                Post-Call Follow-ups
              </span>
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Automatically send WhatsApp message templates or materials based on live call outcome filters and consent.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-wider ${isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
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
          {(value.rules || []).map((rule, idx) => {
            const isComposing = editingMessageRuleIdx === idx || !rule.message_text;
            const hasAttachments = rule.attachments && rule.attachments.length > 0;
            const hasSelectedContent = Boolean(rule.message_text || hasAttachments);

            return (
              <div
                key={rule.id || idx}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-800/30 p-4.5 space-y-4 shadow-2xs"
              >
                {/* Rule Header */}
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-700/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-xs">
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
                      className="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* 1. MATCH FILTERS (All Selected by Default) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3 h-3 text-zinc-400" />
                      Match Filters (All Types & Classes Selected by Default)
                    </span>
                  </div>
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

                {/* 2. POST-CALL PERMISSION / CONSENT */}
                <div className="flex items-center justify-between rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-900/50 px-3.5 py-2.5 text-xs text-violet-800 dark:text-violet-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                    <span className="text-[11px] font-bold">Post-Call Permission:</span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-300">
                      Materials will only be dispatched if the contact consented during the call.
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.require_permission !== false}
                      onChange={(e) => handleUpdateRule(idx, { require_permission: e.target.checked })}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    Require Consent
                  </label>
                </div>

                {/* 3. MESSAGE & MATERIAL SELECTION (Multi-Select Supported) */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
                      Message & Content Configuration
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Button 1: Open Multi-Select Material Base Picker */}
                      <button
                        type="button"
                        onClick={() => handleOpenMultiSelectPicker(idx)}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:border-violet-400 focus:outline-none transition shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                        <span>Select from Material Base</span>
                        {materials.length > 0 && (
                          <span className="ml-1 rounded-full bg-violet-100 dark:bg-violet-950 px-1.5 py-0.2 text-[9px] font-bold text-violet-700 dark:text-violet-300">
                            {materials.length}
                          </span>
                        )}
                      </button>

                      {/* Button 2: Add New Material (Opens popup modal) */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRuleIndexForAdd(idx);
                          setShowAddMaterialModal(true);
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/70 dark:border-violet-800 dark:bg-violet-950/40 hover:bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New (Popup)
                      </button>

                      {/* Button 3: Toggle Edit Text */}
                      {!isComposing && (
                        <button
                          type="button"
                          onClick={() => setEditingMessageRuleIdx(idx)}
                          className="flex items-center gap-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Text
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────────────────
                      ACTIVE COMPOSING EDITOR (with DONE button)
                  ───────────────────────────────────────────────────────────── */}
                  {isComposing && (
                    <div className="rounded-xl border border-violet-200 bg-white p-3.5 dark:border-violet-900/60 dark:bg-zinc-900/90 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                          Write Custom Message for this Campaign
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {rule.message_text.length} chars
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={rule.message_text}
                        onChange={(e) => handleUpdateRule(idx, { message_text: e.target.value })}
                        placeholder="Hi {{name}}, thank you for speaking with us regarding {{campaign_name}}..."
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800 p-3 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                      />

                      {/* Dynamic Placeholders */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-zinc-400 font-medium">Placeholders:</span>
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
                            onClick={() => handleUpdateRule(idx, { message_text: (rule.message_text ? rule.message_text + " " : "") + ph })}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-950/60 dark:hover:text-violet-300 transition"
                          >
                            +{ph}
                          </button>
                        ))}
                      </div>

                      {/* Bottom row: Save to Material Base toggle + DONE button */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={rule.save_to_material_base || false}
                            onChange={(e) => handleUpdateRule(idx, { save_to_material_base: e.target.checked })}
                            className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                          />
                          <Bookmark className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                            Save to Material Base for future use
                          </span>
                        </label>

                        {rule.save_to_material_base && (
                          <input
                            type="text"
                            placeholder="Template Title"
                            value={rule.material_title || ""}
                            onChange={(e) => handleUpdateRule(idx, { material_title: e.target.value })}
                            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        )}

                        {/* DONE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleDoneComposing(idx)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition sm:ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Done
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─────────────────────────────────────────────────────────────
                      SELECTED CONTENT DISPLAY (SHOWS DOWN WHAT WAS SELECTED)
                  ───────────────────────────────────────────────────────────── */}
                  <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900/80 p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Selected Message & Material for this Rule
                      </span>

                      {ruleSavedNotice === idx && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded animate-in fade-in">
                          ✓ Saved & Configured
                        </span>
                      )}
                    </div>

                    {hasSelectedContent ? (
                      <div className="space-y-2">
                        {/* Selected Message Text */}
                        {rule.message_text ? (
                          <div className="group relative rounded-xl bg-zinc-50 dark:bg-zinc-800/80 p-3 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-medium leading-relaxed flex-1">
                                {rule.message_text}
                              </p>
                              {!isComposing && (
                                <button
                                  type="button"
                                  onClick={() => setEditingMessageRuleIdx(idx)}
                                  className="text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 p-1 rounded transition shrink-0"
                                  title="Edit text"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Attached Materials (Images, Documents, PDFs) */}
                        {hasAttachments && (
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {rule.attachments!.map((att, attIdx) => (
                              <div
                                key={attIdx}
                                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs"
                              >
                                {att.type === "image" ? (
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                )}
                                <span className="max-w-[170px] truncate font-semibold">{att.title}</span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold">
                                  {att.type}
                                </span>
                                {att.url && (
                                  <a
                                    href={att.url.startsWith("http") ? att.url : `${BASE_URL}${att.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-400 hover:text-violet-600 transition"
                                    title="Open preview"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextAtts = rule.attachments?.filter((_, i) => i !== attIdx);
                                    handleUpdateRule(idx, { attachments: nextAtts });
                                  }}
                                  className="text-zinc-400 hover:text-rose-500 transition p-0.5 rounded"
                                  title="Remove"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                        No message text or material selected yet. Choose from Material Base or compose custom message above.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Rule Button */}
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

      {/* ─────────────────────────────────────────────────────────────
          MULTI-SELECT MATERIAL BASE PICKER MODAL (Text + Media Multi-Select)
      ───────────────────────────────────────────────────────────── */}
      {showMultiSelectPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[85vh] flex flex-col space-y-3.5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Select Materials from Library
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Select multiple text templates, images, or documents to bundle into this automation rule.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMultiSelectPicker(false)}
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 text-xs flex-1 border border-zinc-200 dark:border-zinc-700">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by title, tag, or content..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="bg-transparent border-0 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs">
                  {(["all", "text", "image", "document"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setPickerTab(tab)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition ${
                        pickerTab === tab
                          ? "bg-white text-violet-700 shadow-2xs dark:bg-zinc-900 dark:text-violet-300"
                          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      {tab === "all" ? "All" : tab === "text" ? "💬 Texts" : tab === "image" ? "🖼️ Images" : "📄 Docs"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Material Items List */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-2 max-h-72">
              {loadingMaterials ? (
                <div className="flex items-center justify-center py-8 text-xs text-zinc-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  Loading library materials...
                </div>
              ) : pickerFilteredMaterials.length > 0 ? (
                pickerFilteredMaterials.map((mat) => {
                  const isChecked = pickerSelectedIds.includes(mat.id);

                  return (
                    <div
                      key={mat.id}
                      onClick={() => handleTogglePickerItem(mat.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? "border-violet-500 bg-violet-50/70 dark:border-violet-500 dark:bg-violet-950/40 ring-1 ring-violet-500/50"
                          : "border-zinc-200 hover:border-violet-300 bg-white dark:border-zinc-800 dark:bg-zinc-800/60"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </div>

                      <div className="shrink-0 mt-0.5">
                        {mat.type === "text" ? (
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        ) : mat.type === "image" ? (
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {mat.title}
                          </h4>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 font-bold rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0">
                            {mat.type}
                          </span>
                        </div>

                        {mat.content && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                            {mat.content}
                          </p>
                        )}

                        {mat.file_size && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {(mat.file_size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-400">
                  No matching materials found in Material Base.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800 shrink-0">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                {pickerSelectedIds.length} {pickerSelectedIds.length === 1 ? "Item" : "Items"} Selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMultiSelectPicker(false)}
                  className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmMultiSelection}
                  disabled={pickerSelectedIds.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Attach Selected ({pickerSelectedIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared AddMaterialModal (Same standard popup modal as Material Base) */}
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
