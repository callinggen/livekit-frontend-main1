"use client";

import { useState, useMemo } from "react";
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
  Copy,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
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
  description: string;
  prompt: string;
  tone: string;
  category: string;
}

interface CategoryGroup {
  id: string;
  label: string;
  icon: any;
  badge: string;
  presets: SuggestionPreset[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "product_launch",
    label: "Product & Feature Launch",
    icon: Rocket,
    badge: "Highest Engagement",
    presets: [
      {
        icon: Rocket,
        label: "Major Feature & Speed Upgrade",
        description: "Announce new platform capabilities with performance stats and bullet highlights.",
        prompt: "Announce our latest platform release featuring sub-second voice AI latency and custom sending domains. Include 3 bullet highlights and an explore dashboard CTA button.",
        tone: "Friendly",
        category: "Sales",
      },
      {
        icon: Zap,
        label: "Exclusive VIP Early Access",
        description: "Invite high-value clients to test new features before general release.",
        prompt: "Invite our valued clients to test our newly launched automated voice workflows with complimentary onboarding and priority support.",
        tone: "Persuasive",
        category: "Sales",
      },
      {
        icon: Tag,
        label: "New Release + Free Bonus Credits",
        description: "Drive adoption by bundling new feature announcements with trial credits.",
        prompt: "Announce our newest conversational AI features and offer 500 bonus credits for teams that test the feature this week.",
        tone: "Persuasive",
        category: "Sales",
      },
      {
        icon: Sparkles,
        label: "Feature Spotlight & ROI Benefits",
        description: "Showcase concrete time and cost savings with customer outcomes.",
        prompt: "Write a high-converting announcement breaking down how our new features save 15+ hours per week on customer outreach.",
        tone: "Professional",
        category: "Sales",
      },
    ],
  },
  {
    id: "sales_followup",
    label: "Sales & Lead Follow-Up",
    icon: Users,
    badge: "High Conversion",
    presets: [
      {
        icon: Users,
        label: "Post-Demo Consultation Follow-Up",
        description: "Warm recap of discussion with next steps and scheduling link.",
        prompt: "Write a polite, high-converting follow-up email for leads who attended our product demo. Summarize key benefits of AI voice automation and propose a 10-minute next-steps call.",
        tone: "Professional",
        category: "Sales",
      },
      {
        icon: Calendar,
        label: "Reschedule Missed Appointment",
        description: "Friendly check-in with 1-click calendar rescheduling.",
        prompt: "Write a warm, helpful check-in for a prospect who missed our scheduled demo call. Provide a 1-click calendar link to pick a convenient new timeslot.",
        tone: "Friendly",
        category: "Sales",
      },
      {
        icon: Sparkles,
        label: "Addressing Common Questions & ROI",
        description: "Overcome objections about pricing, setup speed, and integrations.",
        prompt: "Follow up with clear answers regarding multi-language voice models, CRM webhook integration, and pay-as-you-go credit packages.",
        tone: "Professional",
        category: "Sales",
      },
      {
        icon: Zap,
        label: "Fast-Track 24-Hour Implementation",
        description: "Urgent limited-time onboarding offer for fast decision makers.",
        prompt: "Offer an expedited onboarding session to deploy their first customized outbound AI voice agent within 24 hours.",
        tone: "Persuasive",
        category: "Sales",
      },
    ],
  },
  {
    id: "company_intro",
    label: "Company & Partnership Outreach",
    icon: Building2,
    badge: "B2B Outreach",
    presets: [
      {
        icon: Building2,
        label: "Enterprise AI Solutions Overview",
        description: "Introduce core capabilities, reliability uptime, and compliance.",
        prompt: "Introduce CallingGen AI's conversational voice & email automation platform to prospective business partners. Highlight tailored workflows, 99.9% uptime, and fast turnaround.",
        tone: "Professional",
        category: "Business",
      },
      {
        icon: Users,
        label: "Founder's Welcome & Vision",
        description: "Authentic, personal welcome message from executive leadership.",
        prompt: "Write a personalized welcome message from our leadership introducing our core services, client success stories, and our commitment to their business growth.",
        tone: "Friendly",
        category: "Business",
      },
      {
        icon: Rocket,
        label: "70% Overhead Reduction Case Study",
        description: "Proof-driven outreach highlighting benchmark cost reduction.",
        prompt: "Showcase how leading companies reduce call center overhead by 70% and convert more warm leads using CallingGen voice agents.",
        tone: "Persuasive",
        category: "Business",
      },
      {
        icon: Zap,
        label: "Interactive 2-Minute Live Voice Demo",
        description: "Invite prospects to dial a live AI number for an instant test.",
        prompt: "Invite prospective decision-makers to experience a live 2-minute test call with our AI persona to evaluate natural conversation flow.",
        tone: "Persuasive",
        category: "Business",
      },
    ],
  },
  {
    id: "promotions_offers",
    label: "Offers, Discounts & Re-Engagement",
    icon: BadgePercent,
    badge: "Drive Revenue",
    presets: [
      {
        icon: BadgePercent,
        label: "20% Limited-Time Discount (SAVE20)",
        description: "Incentivize quick upgrades with a discount coupon code.",
        prompt: "Create a compelling promotional email offering a 20% limited-time discount to re-engage customers with promo code SAVE20. Emphasize fast deployment and easy checkout.",
        tone: "Persuasive",
        category: "Promotional",
      },
      {
        icon: Zap,
        label: "48-Hour Flash Sale (2x Credits)",
        description: "High-urgency flash offer providing double credit value.",
        prompt: "Announce a 48-hour flash sale offering double credits on all subscription upgrades to supercharge their outbound marketing.",
        tone: "Urgent",
        category: "Promotional",
      },
      {
        icon: RefreshCw,
        label: "Win-Back Inactive Customers",
        description: "Warm re-engagement for accounts dormant over 60 days.",
        prompt: "Create a warm re-engagement email for customers who haven't logged in over 60 days. Highlight new updates and offer dedicated concierge onboarding to help them succeed.",
        tone: "Friendly",
        category: "Win-Back",
      },
      {
        icon: Calendar,
        label: "Exclusive Live Masterclass Invite",
        description: "Invite audience to a virtual workshop or webinar.",
        prompt: "Draft an invitation email for an exclusive live workshop on scaling outbound sales with AI voice agents. Highlight agenda topics and include a reserve-seat CTA button.",
        tone: "Professional",
        category: "Event",
      },
    ],
  },
  {
    id: "customer_support",
    label: "Customer Support & Account Health",
    icon: LifeBuoy,
    badge: "Retention",
    presets: [
      {
        icon: LifeBuoy,
        label: "Proactive Account Health Check",
        description: "Reach out to ensure campaign performance is meeting benchmarks.",
        prompt: "Check in with our client to ensure their AI voice campaigns and email broadcasts are performing at peak efficiency. Offer dedicated engineering assistance.",
        tone: "Friendly",
        category: "Support",
      },
      {
        icon: Sparkles,
        label: "Best Practices & Optimization Tips",
        description: "Share educational tips, video links, and playbook strategies.",
        prompt: "Share our top 3 best practices, video tutorials, and call script optimization templates to help their team maximize campaign conversion rates.",
        tone: "Professional",
        category: "Support",
      },
      {
        icon: Users,
        label: "Dedicated 1-on-1 Engineering Support",
        description: "Offer technical troubleshooting for webhooks and DNS records.",
        prompt: "Offer a dedicated technical consultation to troubleshoot custom CRM webhooks, phone number routing, or domain DNS setup.",
        tone: "Professional",
        category: "Support",
      },
      {
        icon: RefreshCw,
        label: "Quick Feedback & NPS Survey",
        description: "Gather feedback to improve product experience and customer satisfaction.",
        prompt: "Ask for honest feedback on their recent experience with our platform and provide direct escalation channels for any questions.",
        tone: "Friendly",
        category: "Support",
      },
    ],
  },
];

const TONES = [
  { id: "Professional", label: "Professional", emoji: "💼", desc: "Polished, executive, authoritative" },
  { id: "Friendly", label: "Friendly & Warm", emoji: "😊", desc: "Approachable, conversational, cheerful" },
  { id: "Persuasive", label: "Persuasive", emoji: "🎯", desc: "Compelling, benefit-focused, driving action" },
  { id: "Urgent", label: "Urgent (FOMO)", emoji: "⚡", desc: "Time-sensitive, limited availability" },
  { id: "Direct", label: "Concise & Direct", emoji: "💬", desc: "Short, to the point, zero fluff" },
];

const LENGTHS = [
  { id: "Short", label: "Short (~75 words)", desc: "Quick punchy note" },
  { id: "Medium", label: "Medium (~150 words)", desc: "Standard announcement" },
  { id: "Detailed", label: "Detailed (~250 words)", desc: "In-depth newsletter" },
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
  const [selectedCategory, setSelectedCategory] = useState("product_launch");
  const [prompt, setPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedLength, setSelectedLength] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Generated Result Preview State
  const [generatedResult, setGeneratedResult] = useState<EmailAIGenerateResult | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // Active category preset data
  const currentCategoryData = useMemo(() => {
    return CATEGORY_GROUPS.find((g) => g.id === selectedCategory) || CATEGORY_GROUPS[0];
  }, [selectedCategory]);

  if (!isOpen) return null;

  const handleGenerate = async (actionType: string = "generate", customPrompt?: string) => {
    const effectivePrompt = customPrompt ?? prompt;
    if (!effectivePrompt.trim()) {
      setError("Please choose a suggestion or describe your email goal.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload: EmailAIGeneratePayload = {
        prompt: effectivePrompt.trim(),
        template_name: templateName || currentCategoryData.label,
        tone: selectedTone,
        category: selectedLength === "Short" ? "Quick Note" : selectedLength === "Detailed" ? "Detailed Newsletter" : "Sales",
        action: actionType,
        current_subject: currentSubject,
        current_heading: currentHeading,
        current_body: currentBody,
        current_cta_text: currentCtaText,
      };

      const result = await api.generateEmailWithAI(payload);
      setGeneratedResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate email content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: SuggestionPreset) => {
    setPrompt(preset.prompt);
    setSelectedTone(preset.tone);
    setError("");
  };

  const handleApplyToEditor = () => {
    if (generatedResult) {
      onApplyGenerated(generatedResult);
      onClose();
    }
  };

  const copySubjectToClipboard = () => {
    if (generatedResult?.subject) {
      navigator.clipboard.writeText(generatedResult.subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-[#0B0F19] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  AI Email Studio Assistant
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Smart AI 2.0
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Craft high-converting subject lines, rich copy, and clear CTA buttons effortlessly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* If Result is Generated -> Show Split Preview & Apply Option */}
          {generatedResult ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Email Generated Successfully!</h4>
                    <p className="text-[11px] opacity-90">Review the AI draft below and click Apply to inject into your email editor.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGeneratedResult(null)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Edit Prompt
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyToEditor}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 transition cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Apply to Editor</span>
                  </button>
                </div>
              </div>

              {/* Subject Line Preview Card */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Generated Subject Line:</span>
                  <button
                    type="button"
                    onClick={copySubjectToClipboard}
                    className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {copiedSubject ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedSubject ? "Copied!" : "Copy Subject"}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700 font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white">
                  {generatedResult.subject}
                </div>
              </div>

              {/* Email Body Preview Card */}
              <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 space-y-1.5">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Generated Email Body Preview:
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700 max-h-64 overflow-y-auto text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed prose dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: generatedResult.body }} />
                </div>
              </div>

              {/* Quick AI Refine Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-zinc-500">Quick Refine:</span>
                {[
                  { action: "shorten", label: "✂️ Make Shorter" },
                  { action: "persuasive", label: "🎯 Add Urgency & CTA" },
                  { action: "friendly", label: "😊 Friendlier Tone" },
                  { action: "professional", label: "👔 Executive Polish" },
                ].map((act) => (
                  <button
                    key={act.action}
                    type="button"
                    disabled={loading}
                    onClick={() => handleGenerate(act.action, `Refine previous generated email: ${act.label}`)}
                    className="px-3 py-1 text-xs font-medium rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-900/60 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer disabled:opacity-50"
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Select Email Category / Goal */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">1</span>
                    <span>Select Email Purpose:</span>
                  </label>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">Click category to view suggestions</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {CATEGORY_GROUPS.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-2.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isActive
                            ? "bg-purple-50 dark:bg-purple-950/60 border-purple-400 dark:border-purple-700 shadow-sm ring-1 ring-purple-400"
                            : "bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-purple-200 hover:bg-purple-50/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-1.5 rounded-xl ${isActive ? "bg-purple-600 text-white" : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            {cat.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-zinc-900 dark:text-white leading-tight">
                            {cat.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Pre-Crafted 1-Click Prompt Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">2</span>
                    <span>1-Click High-Converting Templates ({currentCategoryData.label}):</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">Click to load</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentCategoryData.presets.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = prompt === preset.prompt;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl text-left border text-xs transition cursor-pointer ${
                          isSelected
                            ? "border-purple-500 bg-purple-50/90 dark:bg-purple-950/60 text-purple-950 dark:text-purple-100 font-semibold shadow-sm ring-1 ring-purple-500"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-purple-300 hover:bg-purple-50/30"
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate text-zinc-900 dark:text-white flex items-center justify-between">
                            <span>{preset.label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 ml-1" />}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Prompt Textarea & Custom Instructions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[10px]">3</span>
                    <span>Customize Your Prompt / Goal *</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">Describe specific offers, discounts, or deadlines</span>
                </div>

                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Write a persuasive email for our new product launch. Emphasize 1-click onboarding, include 3 bullet highlights, and offer a 20% discount code."
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none font-medium"
                />
              </div>

              {/* STEP 4: Tone & Length Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tone */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Tone of Voice:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => {
                      const active = selectedTone === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTone(t.id)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                            active
                              ? "border-purple-500 bg-purple-600 text-white shadow-xs"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          <span>{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Length */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    Email Length:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LENGTHS.map((len) => {
                      const active = selectedLength === len.id;
                      return (
                        <button
                          key={len.id}
                          type="button"
                          onClick={() => setSelectedLength(len.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            active
                              ? "border-purple-500 bg-purple-600 text-white shadow-xs"
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                          }`}
                        >
                          {len.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* Error Notification */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/40">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Generates clean HTML with subject, responsive layout &amp; CTA</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            {generatedResult ? (
              <button
                type="button"
                onClick={handleApplyToEditor}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Apply to Email Editor</span>
              </button>
            ) : (
              <button
                type="button"
                id="ai-generate-submit-btn"
                disabled={loading || !prompt.trim()}
                onClick={() => handleGenerate("generate")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Writing Email Content…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Email with AI</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
