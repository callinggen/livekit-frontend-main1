import React, { useState, useMemo, useEffect } from "react";
import { FileSpreadsheet, User, Calendar, Rocket, ChevronDown, Clock } from "lucide-react";
import EditableScript from "./EditableScript";
import UploadSource from "./UploadSource";
import { CampaignFormData, UploadSourceType } from "./types";
import { agents, DEFAULT_AGENT_SCRIPTS } from "@/lib/constants";

// BUG-028: Parse a time string like "09:00" or "09:00 AM" into parts
function parseTime(raw: string): { hour: string; minute: string; ampm: "AM" | "PM" } {
  const clean = raw.trim().toUpperCase();
  const pmMatched = clean.includes("PM");
  const stripped = clean.replace("AM", "").replace("PM", "").trim();
  const [h24Str, minStr = "00"] = stripped.split(":");
  let h24 = parseInt(h24Str || "9", 10);
  let ampm: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  if (clean.includes("AM")) ampm = "AM";
  if (clean.includes("PM")) ampm = "PM";
  let h12 = h24 % 12 || 12;
  return { hour: String(h12).padStart(2, "0"), minute: minStr.padStart(2, "0").slice(0, 2), ampm };
}

interface CampaignFormProps {
  formData: CampaignFormData;
  onChange: (data: Partial<CampaignFormData>) => void;
  onSubmit: () => void;
  errors: Record<string, string>;

  // Upload specific props
  onFileUpload: (file: File) => void;
  fileUploaded: boolean;
  fileName?: string;
  fileSize?: string;
  totalContacts?: number;
  onGoogleSheetLoaded?: (contacts: any[], sheetId: string) => void;
  disabled?: boolean;
}



const TAXES_AGENT_DEFAULT_SCRIPT = `You are a professional and courteous Tax Verification Officer.

You are calling {{customer_name}} regarding a routine verification of their tax records.

Your objectives are:

1. Greet the customer politely by name.
2. Confirm you are speaking with the correct person.
3. Inform them that this is a routine tax verification call.
4. Ask whether all outstanding taxes for the current assessment period have already been paid.
5. If the customer confirms payment:
   - Thank them.
   - Ask if they have the payment reference or approximate payment date for verification.
   - Inform them that no further action may be required after verification.
6. If the customer says taxes have not yet been paid:
   - Politely remind them that payment may still be pending.
   - Ask whether they need assistance or information regarding the payment process.
7. If the customer is unsure:
   - Ask whether they would like to verify their records before making any statements.
8. Never threaten, pressure, or provide legal advice.
9. Remain calm, professional, and patient throughout the call.`;

export default function CampaignForm({
  formData,
  onChange,
  onSubmit,
  errors,
  onFileUpload,
  fileUploaded,
  fileName,
  fileSize,
  totalContacts,
  onGoogleSheetLoaded,
  disabled = false,
}: CampaignFormProps) {
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  useEffect(() => {
    if (formData.agent === "Taxes Agent" && formData.script.trim() === "") {
      onChange({ script: TAXES_AGENT_DEFAULT_SCRIPT });
    }
  }, [formData.agent, formData.script, onChange]);

  return (
    <div className="flex h-full flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white">Campaign Details</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure your AI calling campaign.</p>
        </div>

        <div className="space-y-5">
          {/* Campaign Title */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.campaignTitle}
              onChange={(e) => onChange({ campaignTitle: e.target.value })}
              placeholder="e.g. Q3 Marketing Outreach"
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm transition placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-900 dark:placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed ${errors.campaignTitle ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                }`}
              disabled={disabled}
            />
            {errors.campaignTitle && <p className="text-xs font-medium text-red-500">{errors.campaignTitle}</p>}
          </div>

          {/* Select AI Agent */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
              <User className="h-3.5 w-3.5" />
              Select AI Agent <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !disabled && setShowAgentDropdown(!showAgentDropdown)}
                disabled={disabled}
                className={`flex w-full items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-sm font-medium transition dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${errors.agent ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                  }`}
              >
                <span className={formData.agent ? "" : "text-zinc-400 dark:text-zinc-600"}>
                  {formData.agent || "Select..."}
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showAgentDropdown && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  {agents.map((agent) => (
                    <button
                      key={agent}
                      type="button"
                      onClick={() => {
                        const newDefault = DEFAULT_AGENT_SCRIPTS[agent] || "";
                        const currentScript = formData.script || "";
                        const previousAgentDefault = formData.agent ? (DEFAULT_AGENT_SCRIPTS[formData.agent] || "") : "";

                        const isUnchanged = !currentScript || currentScript.trim() === previousAgentDefault.trim();

                        if (!isUnchanged) {
                          if (window.confirm("You have edited the current script. Selecting a new agent will replace it with the new default. Proceed?")) {
                            onChange({ agent, script: newDefault });
                          } else {
                            setShowAgentDropdown(false);
                            return;
                          }
                        } else {
                          onChange({ agent, script: newDefault });
                        }
                        setShowAgentDropdown(false);
                      }}
                      className="flex w-full px-4 py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                    >
                      {agent}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.agent && <p className="text-xs font-medium text-red-500">{errors.agent}</p>}
          </div>

          {/* Schedule Date & Time */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
              <Calendar className="h-3.5 w-3.5" />
              Schedule Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Date picker */}
              <div>
                <input
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => onChange({ scheduleDate: e.target.value })}
                  disabled={disabled}
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 ${errors.scheduleDate ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                    }`}
                />
                {errors.scheduleDate && <p className="mt-1 text-xs font-medium text-red-500">{errors.scheduleDate}</p>}
              </div>
              {/* BUG-028: Custom AM/PM time picker */}
              <div>
                <TimePicker
                  value={formData.scheduleTime}
                  onChange={(t) => onChange({ scheduleTime: t })}
                  error={!!errors.scheduleTime}
                  disabled={disabled}
                />
                {errors.scheduleTime && <p className="mt-1 text-xs font-medium text-red-500">{errors.scheduleTime}</p>}
              </div>
            </div>
          </div>

          {/* Upload Contacts */}
          <UploadSource
            sourceType={formData.uploadSource}
            onChangeSource={(type) => onChange({ uploadSource: type })}
            onFileUpload={onFileUpload}
            fileUploaded={fileUploaded}
            fileName={fileName}
            fileSize={fileSize}
            totalContacts={totalContacts}
            googleSheetUrl={formData.googleSheetUrl}
            onChangeGoogleSheetUrl={(url) => onChange({ googleSheetUrl: url })}
            singleContactName={formData.singleContactName}
            onChangeSingleName={(name) => onChange({ singleContactName: name })}
            singleContactPhone={formData.singleContactPhone}
            onChangeSinglePhone={(phone) => onChange({ singleContactPhone: phone })}
            errors={errors}
            onGoogleSheetLoaded={onGoogleSheetLoaded}
            disabled={disabled}
          />

          {/* Contact Selection */}
          {formData.uploadSource !== "single" && (fileUploaded || formData.googleSheetUrl) && totalContacts !== undefined && totalContacts > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
                <User className="h-3.5 w-3.5" />
                Contact Selection
              </label>
              
              <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.selectionType === "all"}
                      onChange={() => onChange({ selectionType: "all", startRow: undefined, endRow: undefined })}
                      disabled={disabled}
                      className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">All Contacts ({totalContacts})</span>
                  </label>
                  
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.selectionType === "range"}
                      onChange={() => onChange({ selectionType: "range", startRow: 1, endRow: totalContacts })}
                      disabled={disabled}
                      className="text-violet-600 focus:ring-violet-500 cursor-pointer"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">Custom Range</span>
                  </label>
                </div>

                {formData.selectionType === "range" && (
                  <div className="flex items-center gap-4 mt-1 border-t border-zinc-100 dark:border-zinc-700/50 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Start Row:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalContacts}
                        value={formData.startRow || ""}
                        onChange={(e) => onChange({ startRow: parseInt(e.target.value) || undefined })}
                        disabled={disabled}
                        className="w-20 rounded-md border border-zinc-200 px-2 py-1 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">End Row:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalContacts}
                        value={formData.endRow || ""}
                        onChange={(e) => onChange({ endRow: parseInt(e.target.value) || undefined })}
                        disabled={disabled}
                        className="w-20 rounded-md border border-zinc-200 px-2 py-1 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </div>
                    
                    <div className="ml-auto flex items-center">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
                        Selected: {
                          (formData.startRow && formData.endRow && formData.startRow >= 1 && formData.endRow <= totalContacts && formData.startRow <= formData.endRow)
                            ? (formData.endRow - formData.startRow + 1)
                            : 0
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editable Script */}
          <EditableScript
            script={formData.script}
            onChange={(script) => onChange({ script })}
            error={errors.script}
            disabled={disabled}
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#111827] py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
      >
        <Rocket className="h-4 w-4" />
        Launch Campaign
      </button>
    </div>
  );
}

// ── BUG-028: Custom AM/PM Time Picker ─────────────────────────────────────────

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
}

function TimePicker({ value, onChange, error, disabled = false }: TimePickerProps) {
  const { hour, minute, ampm } = useMemo(() => parseTime(value || "09:00"), [value]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const emit = (h: string, m: string, ap: "AM" | "PM") => {
    let h24 = parseInt(h, 10);
    if (ap === "PM" && h24 !== 12) h24 += 12;
    if (ap === "AM" && h24 === 12) h24 = 0;
    onChange(`${String(h24).padStart(2, "0")}:${m}`);
  };

  const baseSelect =
    `rounded-lg border bg-white px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-900 dark:text-zinc-100 ${error ? "border-red-400 dark:border-red-500" : "border-zinc-200 focus:border-violet-400 dark:border-zinc-700"
    }`;

  return (
    <div className={`flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 dark:bg-zinc-900 ${error ? "border-red-400 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      {/* Hour */}
      <select
        value={hour}
        onChange={e => emit(e.target.value, minute, ampm)}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-100 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Hour"
      >
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="text-zinc-400 font-bold text-sm">:</span>
      {/* Minute */}
      <select
        value={minute}
        onChange={e => emit(hour, e.target.value, ampm)}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-100 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Minute"
      >
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      {/* AM/PM toggle */}
      <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
        {(["AM", "PM"] as const).map(ap => (
          <button
            key={ap}
            type="button"
            onClick={() => emit(hour, minute, ap)}
            disabled={disabled}
            className={`px-2 py-1 text-xs font-bold transition disabled:cursor-not-allowed ${ampm === ap
              ? "bg-violet-600 text-white"
              : "bg-white text-zinc-500 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
          >
            {ap}
          </button>
        ))}
      </div>
    </div>
  );
}
