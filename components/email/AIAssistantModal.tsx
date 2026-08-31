"use client";

import { useState } from "react";
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
} from "lucide-react";
import { api, EmailAIGeneratePayload, EmailAIGenerateResult } from "@/lib/api";

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGenerated: (result: EmailAIGenerateResult) => void;
  currentSubject?: string;
  currentHeading?: string;
  currentBody?: string;
  currentCtaText?: string;
}

const MARKETING_PRESETS = [
  {
    icon: Tag,
    label: "20% Promotional Discount",
    prompt: "Create a compelling promotional email offering a 20% limited-time discount to re-engage customers. Emphasize value, fast deployment, and an easy checkout CTA.",
    tone: "Persuasive",
    category: "Promotional",
  },
  {
    icon: Users,
    label: "Demo Follow-Up & Next Steps",
    prompt: "Write a polite, high-converting follow-up email for leads who attended our product demo. Summarize key benefits of AI voice automation and propose a 10-minute next-steps call.",
    tone: "Professional",
    category: "Sales",
  },
  {
    icon: Rocket,
    label: "New Product / Feature Launch",
    prompt: "Write an exciting announcement email for our latest platform release with sub-second voice latency and custom domain verification. Include 3 bullet highlights and an explore CTA.",
    tone: "Friendly",
    category: "Announcement",
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
    label: "Webinar / Event Invitation",
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
  const [lastGenerated, setLastGenerated] = useState<EmailAIGenerateResult | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (actionType: string = "generate", customPrompt?: string) => {
    const effectivePrompt = customPrompt ?? prompt;
    if (!effectivePrompt.trim()) {
      setError("Please describe what kind of email you want to generate.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload: EmailAIGeneratePayload = {
        prompt: effectivePrompt.trim(),
        tone: selectedTone,
        category: selectedCategory,
        action: actionType,
        current_subject: currentSubject,
        current_heading: currentHeading,
        current_body: currentBody,
        current_cta_text: currentCtaText,
      };

      const result = await api.generateEmailWithAI(payload);
      setLastGenerated(result);
      onApplyGenerated(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate email content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof MARKETING_PRESETS[0]) => {
    setPrompt(preset.prompt);
    setSelectedTone(preset.tone);
    setSelectedCategory(preset.category);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0F1422] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                AI Email Marketing Assistant
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                  Smart Composer
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Describe your goal or pick a marketing preset. Fully customizable after generation.
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

          {/* Prompt Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-violet-600" />
                Describe your email *
              </label>
              <span className="text-[11px] text-zinc-400">Be as specific as you like</span>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Create a promotional email for customers who haven't ordered in 3 months offering 20% discount with code SAVE20 and inviting them to explore our new AI voice features..."
              className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition resize-none"
            />
          </div>

          {/* Quick Marketing Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Quick Marketing Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MARKETING_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = prompt === preset.prompt;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left border text-xs font-medium transition ${
                      isSelected
                        ? "border-violet-500 bg-violet-50/80 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 font-semibold shadow-sm"
                        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-violet-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
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

          {/* Quick Refinements (if user already has content written) */}
          {currentBody && currentBody.length > 50 && (
            <div className="rounded-2xl border border-dashed border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 p-3.5 space-y-2">
              <span className="text-xs font-bold text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Refine Existing Email Content:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { action: "improve", label: "✨ Improve Copy" },
                  { action: "shorten", label: "✂️ Make Shorter" },
                  { action: "persuasive", label: "🎯 Make More Persuasive" },
                  { action: "friendly", label: "😊 Make Friendlier" },
                  { action: "professional", label: "👔 Make Professional" },
                ].map((act) => (
                  <button
                    key={act.action}
                    type="button"
                    disabled={loading}
                    onClick={() => handleGenerate(act.action, `Refine and optimize current email content for: ${act.label}`)}
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
            <span>Generates subject, heading, copy &amp; CTA button instantly</span>
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
                  Generating with AI…
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
