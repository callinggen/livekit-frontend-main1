import React, { useState, useMemo, useEffect } from "react";
import { FileSpreadsheet, User, Calendar, Rocket, ChevronDown, Clock, Globe, Phone } from "lucide-react";
import EditableScript from "./EditableScript";
import UploadSource from "./UploadSource";
import WhatsAppAutomationConfigSection from "./WhatsAppAutomationConfigSection";
import { CampaignFormData, UploadSourceType } from "./types";
import { api, UserPhoneNumber } from "@/lib/api";


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
  agents?: { id: number; name: string; language: string; voice: string; script: string }[];
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
  agents = [],
}: CampaignFormProps) {
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [userNumbers, setUserNumbers] = useState<UserPhoneNumber[]>([]);

  useEffect(() => {
    async function loadPhoneNumbers() {
      try {
        const nums = await api.getUserPhoneNumbers();
        if (nums && nums.length > 0) {
          setUserNumbers(nums);
          const defaultNum = nums.find(n => n.is_default) || nums[0];
          if (!formData.outboundPhoneNumber && defaultNum) {
            onChange({ outboundPhoneNumber: defaultNum.phone_number });
          }
        }
      } catch (err) {
        console.warn("Failed to load user phone numbers:", err);
      }
    }
    loadPhoneNumbers();
  }, []);

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
                  {agents.length === 0 && (
                    <div className="px-4 py-3 text-sm text-zinc-500">No agents available</div>
                  )}
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        const newDefault = agent.script || "";
                        const currentScript = formData.script || "";
                        const previousAgentObj = agents.find(a => a.name === formData.agent);
                        const previousAgentDefault = previousAgentObj ? (previousAgentObj.script || "") : "";

                        const isUnchanged = !currentScript || currentScript.trim() === previousAgentDefault.trim() || currentScript.trim() === TAXES_AGENT_DEFAULT_SCRIPT.trim();

                        if (!isUnchanged) {
                          if (window.confirm("You have edited the current script. Selecting a new agent will replace it with the new default. Proceed?")) {
                            onChange({ agent: agent.name, script: newDefault });
                          } else {
                            setShowAgentDropdown(false);
                            return;
                          }
                        } else {
                          onChange({ agent: agent.name, script: newDefault });
                        }
                        setShowAgentDropdown(false);
                      }}
                      className="flex w-full px-4 py-2 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left"
                    >
                      {agent.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.agent && <p className="text-xs font-medium text-red-500">{errors.agent}</p>}
          </div>

          {/* Outbound Phone Number / Region Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-zinc-100">
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              Outbound Number & Region <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.outboundPhoneNumber || (userNumbers[0]?.phone_number ?? "")}
                onChange={(e) => onChange({ outboundPhoneNumber: e.target.value })}
                disabled={disabled}
                className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition dark:border-zinc-700 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
              >
                {userNumbers.map((num) => (
                  <option key={num.id} value={num.phone_number}>
                    {num.region.includes("India") ? "🇮🇳 " : num.region.includes("United States") || num.region.includes("US") ? "🇺🇸 " : num.region.includes("United Kingdom") || num.region.includes("UK") ? "🇬🇧 " : "🌐 "}
                    {num.region} ({num.phone_number})
                  </option>
                ))}
              </select>
            </div>
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
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed ${errors.scheduleDate ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 focus:border-violet-400 dark:border-zinc-700'
                    }`}
                  disabled={disabled}
                />
              </div>

              {/* Time picker dropdowns */}
              {(() => {
                const parsed = parseTime(formData.scheduleTime);
                const updateScheduleTime = (h: string, m: string, ap: "AM" | "PM") => {
                  let h24 = parseInt(h, 10);
                  if (ap === "PM" && h24 < 12) h24 += 12;
                  if (ap === "AM" && h24 === 12) h24 = 0;
                  const newTimeStr = `${String(h24).padStart(2, "0")}:${m}`;
                  onChange({ scheduleTime: newTimeStr });
                };

                return (
                  <div className="flex gap-1">
                    {/* Hour dropdown */}
                    <select
                      value={parsed.hour}
                      onChange={(e) => updateScheduleTime(e.target.value, parsed.minute, parsed.ampm)}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2.5 text-xs font-medium focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>

                    {/* Minute dropdown */}
                    <select
                      value={parsed.minute}
                      onChange={(e) => updateScheduleTime(parsed.hour, e.target.value, parsed.ampm)}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2.5 text-xs font-medium focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* AM/PM toggle */}
                    <button
                      type="button"
                      onClick={() => updateScheduleTime(parsed.hour, parsed.minute, parsed.ampm === "AM" ? "PM" : "AM")}
                      className="rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-2.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={disabled}
                    >
                      {parsed.ampm}
                    </button>
                  </div>
                );
              })()}
            </div>
            {errors.scheduleDate && <p className="text-xs font-medium text-red-500">{errors.scheduleDate}</p>}
            {errors.scheduleTime && <p className="text-xs font-medium text-red-500">{errors.scheduleTime}</p>}
          </div>

          {/* Upload Data Source Section */}
          <div className="flex flex-col gap-1.5 pt-1">
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

          </div>

          {/* Editable AI Prompt Script */}
          <div className="flex flex-col gap-1.5 pt-1">
            <EditableScript
              script={formData.script}
              onChange={(newScript) => onChange({ script: newScript })}
              error={errors.script}
              disabled={disabled}
            />

          {/* WhatsApp Automation Section (Post-call automated follow-ups) */}
          <WhatsAppAutomationConfigSection
            value={formData.whatsappAutomation}
            onChange={(whatsappAutomation) => onChange({ whatsappAutomation })}
            disabled={disabled}
          />
          </div>
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="mt-auto border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Rocket className="h-4 w-4" />
          Launch Campaign
        </button>
      </div>
    </div>
  );
}
