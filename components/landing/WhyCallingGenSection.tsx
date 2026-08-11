"use client";

import { useState } from "react";
import {
  XCircle,
  CheckCircle2,
  Clock,
  PhoneOff,
  UserX,
  FileQuestion,
  Users,
  Bot,
  Zap,
  CalendarCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function WhyCallingGenSection() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const comparisons = [
    {
      problem: "Missed Customer Calls",
      problemDesc: "Calls go unanswered during peak hours or after business hours.",
      problemIcon: <PhoneOff className="w-5 h-5 text-rose-500" />,
      solution: "AI Answers 24/7 Instantly",
      solutionDesc: "100% of inbound calls answered on the first ring with zero wait time.",
      solutionIcon: <Bot className="w-5 h-5 text-emerald-500" />,
    },
    {
      problem: "Manual Follow-ups & Delays",
      problemDesc: "Leads cold down while waiting for manual callbacks.",
      problemIcon: <Clock className="w-5 h-5 text-rose-500" />,
      solution: "Automatic Immediate Follow-ups",
      solutionDesc: "Outbound AI calls & WhatsApp messages triggered in real time.",
      solutionIcon: <Zap className="w-5 h-5 text-[#4F6BFF]" />,
    },
    {
      problem: "Unqualified Lost Leads",
      problemDesc: "Repetitive sales bandwidth spent on low-intent prospects.",
      problemIcon: <UserX className="w-5 h-5 text-rose-500" />,
      solution: "Smart AI Lead Qualification",
      solutionDesc: "AI asks screening questions, scores intent, and logs CRM data.",
      solutionIcon: <Sparkles className="w-5 h-5 text-[#4F6BFF]" />,
    },
    {
      problem: "Manual Appointment Booking",
      problemDesc: "Back-and-forth emails and calls to schedule meetings.",
      problemIcon: <FileQuestion className="w-5 h-5 text-rose-500" />,
      solution: "AI Books Meetings Live",
      solutionDesc: "Real-time calendar checking and direct meeting booking during call.",
      solutionIcon: <CalendarCheck className="w-5 h-5 text-amber-500" />,
    },
    {
      problem: "No Real-time Call Insights",
      problemDesc: "No visibility into call quality, sentiment, or lost opportunities.",
      problemIcon: <FileQuestion className="w-5 h-5 text-rose-500" />,
      solution: "Live Analytics & Transcriptions",
      solutionDesc: "Instant transcriptions, AI summaries, and sentiment reporting.",
      solutionIcon: <BarChart3 className="w-5 h-5 text-purple-500" />,
    },
    {
      problem: "Team Overloaded & Fatigued",
      problemDesc: "Human agents burnt out by repetitive phone scripts.",
      problemIcon: <Users className="w-5 h-5 text-rose-500" />,
      solution: "AI Handles Repetitive Work",
      solutionDesc: "Human teams focus on high-value closing & strategy.",
      solutionIcon: <ShieldCheck className="w-5 h-5 text-[#4F6BFF]" />,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 relative overflow-hidden" id="why-us">
      {/* Background glow */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-[#4F6BFF]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE CALLINGGEN TRANSFORMATION</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
            Why Businesses Choose{" "}
            <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
              CallingGen
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            See how CallingGen transforms traditional manual phone operations into automated, 24/7 AI-powered voice campaigns that never miss a lead.
          </p>
        </div>

        {/* BEFORE vs AFTER Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
          
          {/* LEFT SIDE: WITHOUT CALLINGGEN (Red/Muted Accent) */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-rose-200/60 dark:border-rose-900/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-rose-600 dark:text-rose-400">
                    Without CallingGen
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Traditional Phone Operations</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                Low Efficiency
              </span>
            </div>

            <div className="space-y-4">
              {comparisons.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    hoveredRow === idx
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 scale-[1.01]"
                      : "bg-slate-50/80 dark:bg-[#161F33]/60 border-slate-200/70 dark:border-slate-800/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 shrink-0 mt-0.5">
                      {item.problemIcon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
                        {item.problem}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.problemDesc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: WITH CALLINGGEN (Primary Brand Accent) */}
          <div className="bg-gradient-to-br from-slate-900 via-[#111C33] to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#4F6BFF]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-6 mb-6 border-b border-indigo-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4F6BFF] flex items-center justify-center text-white shadow-lg shadow-[#4F6BFF]/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-white">
                    With CallingGen
                  </h3>
                  <span className="text-xs text-indigo-300 font-medium">AI Voice Automation</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 animate-pulse">
                ● 100% Automated
              </span>
            </div>

            <div className="space-y-4">
              {comparisons.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    hoveredRow === idx
                      ? "bg-[#4F6BFF]/20 border-[#4F6BFF] shadow-lg shadow-[#4F6BFF]/20 scale-[1.01]"
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/10 shrink-0 mt-0.5">
                      {item.solutionIcon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-white mb-0.5 flex items-center gap-2">
                        <span>{item.solution}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#4F6BFF]" />
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.solutionDesc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
