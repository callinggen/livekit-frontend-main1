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
import { useLanguage } from "@/components/LanguageContext";

export default function WhyCallingGenSection() {
  const { t } = useLanguage();
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const comparisons = [
    {
      problem: t("prob1Title"),
      problemDesc: t("prob1Desc"),
      problemIcon: <PhoneOff className="w-5 h-5 text-rose-500" />,
      solution: t("sol1Title"),
      solutionDesc: t("sol1Desc"),
      solutionIcon: <Bot className="w-5 h-5 text-emerald-500" />,
    },
    {
      problem: t("prob2Title"),
      problemDesc: t("prob2Desc"),
      problemIcon: <Clock className="w-5 h-5 text-rose-500" />,
      solution: t("sol2Title"),
      solutionDesc: t("sol2Desc"),
      solutionIcon: <Zap className="w-5 h-5 text-[#4F6BFF]" />,
    },
    {
      problem: t("prob3Title"),
      problemDesc: t("prob3Desc"),
      problemIcon: <UserX className="w-5 h-5 text-rose-500" />,
      solution: t("sol3Title"),
      solutionDesc: t("sol3Desc"),
      solutionIcon: <Sparkles className="w-5 h-5 text-[#4F6BFF]" />,
    },
    {
      problem: t("prob4Title"),
      problemDesc: t("prob4Desc"),
      problemIcon: <FileQuestion className="w-5 h-5 text-rose-500" />,
      solution: t("sol4Title"),
      solutionDesc: t("sol4Desc"),
      solutionIcon: <CalendarCheck className="w-5 h-5 text-amber-500" />,
    },
    {
      problem: t("prob5Title"),
      problemDesc: t("prob5Desc"),
      problemIcon: <FileQuestion className="w-5 h-5 text-rose-500" />,
      solution: t("sol5Title"),
      solutionDesc: t("sol5Desc"),
      solutionIcon: <BarChart3 className="w-5 h-5 text-purple-500" />,
    },
    {
      problem: t("prob6Title"),
      problemDesc: t("prob6Desc"),
      problemIcon: <Users className="w-5 h-5 text-rose-500" />,
      solution: t("sol6Title"),
      solutionDesc: t("sol6Desc"),
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
            <span>{t("whyTag")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
            {t("whyTitle")}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t("whySubtitle")}
          </p>
        </div>

        {/* BEFORE vs AFTER Side-by-Side Comparison Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
          
          {/* LEFT SIDE: WITHOUT CALLINGGEN */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-8 border border-rose-200/60 dark:border-rose-900/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-rose-100 dark:border-rose-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-rose-600 dark:text-rose-400">
                    {t("withoutCallingGen")}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{t("traditionalOps")}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                {t("lowEfficiency")}
              </span>
            </div>

            <div className="space-y-3">
              {comparisons.map((comp, idx) => (
                <div
                  key={`prob-${idx}`}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    hoveredRow === idx
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 scale-[1.01]"
                      : "bg-slate-50/80 dark:bg-[#182234]/50 border-slate-200/70 dark:border-slate-800/80"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{comp.problemIcon}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                        {comp.problem}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {comp.problemDesc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: WITH CALLINGGEN */}
          <div className="bg-[#090E17] dark:bg-[#080C14] rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl shadow-indigo-500/10 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#4F6BFF]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4F6BFF] flex items-center justify-center text-white shadow-lg shadow-[#4F6BFF]/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-white">
                    {t("withCallingGen")}
                  </h3>
                  <span className="text-xs text-indigo-300 font-medium">{t("aiAutomation")}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {t("fullAutomated")}
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {comparisons.map((comp, idx) => (
                <div
                  key={`sol-${idx}`}
                  onMouseEnter={() => setHoveredRow(idx)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    hoveredRow === idx
                      ? "bg-[#162036] border-[#4F6BFF] shadow-md shadow-[#4F6BFF]/20 scale-[1.01]"
                      : "bg-[#111827]/90 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{comp.solutionIcon}</div>
                      <div>
                        <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                          <span>{comp.solution}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#4F6BFF]" />
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-normal">
                          {comp.solutionDesc}
                        </p>
                      </div>
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
