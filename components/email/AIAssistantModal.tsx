"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  X,
  Loader2,
  Wand2,
  Zap,
  Tag,
  Users,
  Calendar,
  Rocket,
  Check,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  LifeBuoy,
  BadgePercent,
  CheckCircle2,
} from "lucide-react";
import { api, EmailAIGeneratePayload, EmailAIGenerateResult } from "@/lib/api";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGenerated: (result: EmailAIGenerateResult) => void;
  templateName?: string;
  templateCategory?: string;
  currentSubject?: string;
  currentHeading?: string;
  currentBody?: string;
  currentCtaText?: string;
}

interface SuggestionPreset {
  icon: any;
  label: string;
  prompt: string;
  tone: string;
  category: string;
}

// ── Template-Specific Suggestion Presets ─────────────────────────────────────

const PRODUCT_LAUNCH_PRESETS: SuggestionPreset[] = [
  {
    icon: Rocket,
    label: "Major Feature & Speed Upgrade",
    prompt: "Announce our latest platform release featuring sub-second voice AI latency and custom sending domains. Include 3 bullet highlights and an explore dashboard CTA button.",
    tone: "Friendly",
    category: "Sales",
  },
  {
    icon: Zap,
    label: "Exclusive VIP Early Access",
    prompt: "Invite our valued clients to test our newly launched automated voice workflows with complimentary onboarding and priority support.",
    tone: "Persuasive",
    category: "Sales",
  },
  {
    icon: Tag,
    label: "New Release + Bonus Credits",
    prompt: "Announce our newest conversational AI features and offer 500 bonus credits for teams that test the feature this week.",
    tone: "Persuasive",
    category: "Sales",
  },
  {
    icon: Sparkles,
    label: "Feature Spotlight & ROI Benefits",
    prompt: "Write a high-converting announcement breaking down how our new features save 15+ hours per week on customer outreach.",
    tone: "Professional",
    category: "Sales",
  },
];

const LEAD_FOLLOWUP_PRESETS: SuggestionPreset[] = [
  {
    icon: Users,
    label: "Post-Demo Consultation Follow-Up",
    prompt: "Write a polite, high-converting follow-up email for leads who attended our product demo. Summarize key benefits of AI voice automation and propose a 10-minute next-steps call.",
    tone: "Professional",
    category: "Sales",
  },
  {
    icon: Calendar,
    label: "Reschedule Missed Appointment",
    prompt: "Write a warm, helpful check-in for a prospect who missed our scheduled demo call. Provide a 1-click calendar link to pick a convenient new timeslot.",
    tone: "Friendly",
    category: "Sales",
  },
  {
    icon: Sparkles,
    label: "Addressing Common Questions",
    prompt: "Follow up with clear answers regarding multi-language voice models, CRM webhook integration, and pay-as-you-go credit packages.",
    tone: "Professional",
    category: "Sales",
  },
  {
    icon: Zap,
    label: "Fast-Track 24-Hour Implementation",
    prompt: "Offer an expedited onboarding session to deploy their first customized outbound AI voice agent within 24 hours.",
    tone: "Persuasive",
    category: "Sales",
  },
];

const COMPANY_INTRO_PRESETS: SuggestionPreset[] = [
  {
    icon: Building2,
    label: "Enterprise Solutions Overview",
    prompt: "Introduce CallingGen AI's conversational voice & email automation platform to prospective business partners. Highlight tailored workflows, 99.9% uptime, and fast turnaround.",
    tone: "Professional",
    category: "Business",
  },
  {
    icon: Users,
    label: "Founder's Welcome Letter",
    prompt: "Write a personalized welcome message from our leadership introducing our core services, client success stories, and our commitment to their business growth.",
    tone: "Friendly",
    category: "Business",
  },
  {
    icon: Rocket,
    label: "Proven Results & Cost Savings",
    prompt: "Showcase how leading companies reduce call center overhead by 70% and convert more warm leads using CallingGen voice agents.",
    tone: "Persuasive",
    category: "Business",
  },
  {
    icon: Zap,
    label: "Interactive 2-Minute Voice Demo",
    prompt: "Invite prospective decision-makers to experience a live 2-minute test call with our AI persona to evaluate natural conversation flow.",
    tone: "Persuasive",
    category: "Business",
  },
];

const CUSTOMER_SUPPORT_PRESETS: SuggestionPreset[] = [
  {
    icon: LifeBuoy,
    label: "Proactive Account Health Check",
    prompt: "Check in with our client to ensure their AI voice campaigns and email broadcasts are performing at peak efficiency. Offer dedicated engineering assistance.",
    tone: "Friendly",
    category: "Support",
  },
  {
    icon: Sparkles,
    label: "Guides, Video Tutorials & Tips",
    prompt: "Share our top 3 best practices, video tutorials, and call script optimization templates to help their team maximize campaign conversion rates.",
    tone: "Professional",
    category: "Support",
  },
  {
    icon: Users,
    label: "1-on-1 Engineering Support",
    prompt: "Offer a dedicated technical consultation to troubleshoot custom CRM webhooks, phone number routing, or domain DNS setup.",
    tone: "Professional",
    category: "Support",
  },
  {
    icon: RefreshCw,
    label: "Feedback & Satisfaction Check",
    prompt: "Ask for honest feedback on their recent experience with our platform and provide direct escalation channels for any questions.",
    tone: "Friendly",
    category: "Support",
  },
];

const PROMOTIONAL_DEFAULT_PRESETS: SuggestionPreset[] = [
  {
    icon: BadgePercent,
    label: "20% Promotional Discount",
    prompt: "Create a compelling promotional email offering a 20% limited-time discount to re-engage customers with promo code SAVE20. Emphasize fast deployment and easy checkout.",
    tone: "Persuasive",
    category: "Promotional",
  },
  {
    icon: Zap,
    label: "48-Hour Flash Offer (Double Credits)",
    prompt: "Announce a 48-hour flash sale offering double credits on all subscription upgrades to supercharge their outbound marketing.",
    tone: "Urgent",
    category: "Promotional",
  },
  {
    icon: RefreshCw,
    label: "Win-Back Inactive Customers",
    prompt: "Create a warm re-engagement email for customers who haven't logged in over 60 days. Highlight new updates and offer dedicated concierge onboarding to help them succeed.",
    tone: "Friendly",
    category: "Win-Back",
  },
  {
    icon: Calendar,
    label: "Webinar / Live Masterclass Invite",
    prompt: "Draft an invitation email for an exclusive live workshop on scaling outbound sales with AI voice agents. Highlight agenda topics and include a reserve-seat CTA button.",
    tone: "Professional",
    category: "Event",
  },
];

const TONES = [
  { id: "Professional", label: "Professional", emoji: "💼" },
  { id: "Friendly", label: "Friendly & Warm", emoji: "😊" },
  { id: "Persuasive", label: "Persuasive", emoji: "🎯" },
  { id: "Urgent", label: "Urgent (FOMO)", emoji: "⚡" },
  { id: "Direct", label: "Concise & Direct", emoji: "💬" },
];

export default function AIAssistantModal({
  isOpen,
  onClose,
  onApplyGenerated,
  templateName,
  templateCategory,
  currentSubject,
  currentHeading,
  currentBody,
  currentCtaText,
}: AIAssistantModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedCategory, setSelectedCategory] = useState("Marketing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Determine active template context
  const activeTemplateLabel = useMemo(() => {
    if (templateName && templateName.trim()) return templateName.trim();
    if (currentSubject) {
      const s = currentSubject.toLowerCase();
      if (s.includes("launch") || s.includes("announc") || s.includes("product")) return "New Product Launch";
      if (s.includes("follow") || s.includes("inquiry") || s.includes("demo")) return "Lead Follow-Up";
      if (s.includes("support") || s.includes("assist") || s.includes("help")) return "Customer Support";
      if (s.includes("introduc") || s.includes("partner") || s.includes("company")) return "Company Introduction";
    }
    return "Marketing Campaign";
  }, [templateName, currentSubject]);

  // Dynamically select tailored suggestions for the active template
  const dynamicPresets = useMemo(() => {
    const t = (templateName || currentSubject || "").toLowerCase();
    const c = (templateCategory || "").toLowerCase();

    if (t.includes("product") || t.includes("launch") || t.includes("release") || t.includes("feature") || c.includes("launch")) {
      return PRODUCT_LAUNCH_PRESETS;
    }
    if (t.includes("follow") || t.includes("lead") || t.includes("inquiry") || t.includes("demo") || c.includes("sales")) {
      return LEAD_FOLLOWUP_PRESETS;
    }
    if (t.includes("intro") || t.includes("company") || t.includes("partner") || c.includes("business")) {
      return COMPANY_INTRO_PRESETS;
    }
    if (t.includes("support") || t.includes("assist") || t.includes("help") || c.includes("support")) {
      return CUSTOMER_SUPPORT_PRESETS;
    }
    return PROMOTIONAL_DEFAULT_PRESETS;
  }, [templateName, templateCategory, currentSubject]);

  // Set default prompt when opening modal if empty
  useEffect(() => {
    if (isOpen && !prompt && dynamicPresets.length > 0) {
      // Don't auto-fill prompt textarea so user can type freely, but keep presets ready
    }
  }, [isOpen, dynamicPresets, prompt]);

  if (!isOpen) return null;

  const handleGenerate = async (actionType: string = "generate", customPrompt?: string) => {
    const effectivePrompt = customPrompt ?? prompt;
    if (!effectivePrompt.trim()) {
      setError("Please choose a template suggestion or describe your email.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload: EmailAIGeneratePayload = {
        prompt: effectivePrompt.trim(),
        template_name: activeTemplateLabel,
        tone: selectedTone,
        category: selectedCategory,
        action: actionType,
        current_subject: currentSubject,
        current_heading: currentHeading,
        current_body: currentBody,
        current_cta_text: currentCtaText,
      };

      const result = await api.generateEmailWithAI(payload);
      onApplyGenerated(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate email content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: SuggestionPreset) => {
    setPrompt(preset.prompt);
    setSelectedTone(preset.tone);
    setSelectedCategory(preset.category);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0F1422] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar with Active Template Context Pill */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  AI Email Assistant
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200/80 dark:border-violet-700 flex items-center gap-1">
                  <Wand2 className="h-2.5 w-2.5" />
                  {activeTemplateLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Suggestions are customized for <strong className="text-violet-600 dark:text-violet-400">{activeTemplateLabel}</strong>. Click any preset or write custom instructions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Template-Tailored Suggestions Box */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Suggestions for &ldquo;{activeTemplateLabel}&rdquo;:
              </span>
              <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">1-Click Apply</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dynamicPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = prompt === preset.prompt;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border text-xs transition-all duration-150 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50/90 dark:bg-violet-950/50 text-violet-950 dark:text-violet-100 font-semibold shadow-md shadow-violet-500/10 ring-1 ring-violet-500"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate text-zinc-900 dark:text-white flex items-center justify-between">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0 ml-1" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {preset.prompt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Description Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-violet-600" />
                Email Instructions &amp; Goal *
              </label>
              <span className="text-[11px] text-zinc-400">Edit preset or write custom instructions</span>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError("");
              }}
              placeholder={`e.g. Write an engaging email tailored for ${activeTemplateLabel} highlighting key benefits and inviting them to take action...`}
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
            />
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Desired Tone:
            </span>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => {
                const active = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTone(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      active
                        ? "border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-500/25"
                        : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Refinements (if current body content exists) */}
          {currentBody && currentBody.length > 50 && (
            <div className="rounded-2xl border border-dashed border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 p-3.5 space-y-2">
              <span className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Refine Existing {activeTemplateLabel} Copy:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { action: "improve", label: "✨ Enhance Copy" },
                  { action: "shorten", label: "✂️ Make Shorter" },
                  { action: "persuasive", label: "🎯 More Persuasive" },
                  { action: "friendly", label: "😊 Friendlier" },
                  { action: "professional", label: "👔 More Professional" },
                ].map((act) => (
                  <button
                    key={act.action}
                    type="button"
                    disabled={loading}
                    onClick={() => handleGenerate(act.action, `Refine and optimize current email content for ${activeTemplateLabel}: ${act.label}`)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-zinc-800 border border-violet-200 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition disabled:opacity-50"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/40">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Generates subject, body &amp; CTA matching {activeTemplateLabel}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              id="ai-generate-submit-btn"
              disabled={loading || !prompt.trim()}
              onClick={() => handleGenerate("generate")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:opacity-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating for {activeTemplateLabel}…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Email Content
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
