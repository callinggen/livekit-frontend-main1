"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Bot,
  Megaphone,
  UploadCloud,
  Rocket,
  PhoneCall,
  Target,
  Calendar,
  RefreshCw,
  Cpu,
  Check,
  Volume2,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function AboutSection() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // 5 Journey Steps for the Zig-Zag path
  const steps = [
    {
      id: 1,
      title: t("step1Title"),
      subtext: t("step1Subtext"),
      icon: <User className="w-4 h-4" />,
      highlightFeatureIndex: 0,
      side: "left",
    },
    {
      id: 2,
      title: t("step2Title"),
      subtext: t("step2Subtext"),
      icon: <Megaphone className="w-4 h-4" />,
      highlightFeatureIndex: 3,
      side: "right",
    },
    {
      id: 3,
      title: t("step3Title"),
      subtext: t("step3Subtext"),
      icon: <UploadCloud className="w-4 h-4" />,
      highlightFeatureIndex: 1,
      side: "left",
    },
    {
      id: 4,
      title: t("step4Title"),
      subtext: t("step4Subtext"),
      icon: <Rocket className="w-4 h-4" />,
      highlightFeatureIndex: 2,
      side: "right",
    },
    {
      id: 5,
      title: t("step5Title"),
      subtext: t("step5Subtext"),
      icon: <PhoneCall className="w-4 h-4" />,
      highlightFeatureIndex: 0,
      side: "left",
      isFinal: true,
    },
  ];

  // 2x2 Feature Cards Grid for Right Side
  const features = [
    {
      id: "voice",
      title: t("feature1Title"),
      desc: t("feature1Desc"),
      icon: <Bot className="w-5 h-5 text-[#4F6BFF]" />,
      bgColor: "bg-indigo-500/10",
      accentColor: "border-[#4F6BFF] ring-2 ring-[#4F6BFF]/20 text-[#4F6BFF]",
    },
    {
      id: "lead",
      title: t("feature2Title"),
      desc: t("feature2Desc"),
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      bgColor: "bg-emerald-500/10",
      accentColor: "border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-500",
    },
    {
      id: "booking",
      title: t("feature3Title"),
      desc: t("feature3Desc"),
      icon: <Calendar className="w-5 h-5 text-amber-500" />,
      bgColor: "bg-amber-500/10",
      accentColor: "border-amber-500 ring-2 ring-amber-500/20 text-amber-500",
    },
    {
      id: "automation",
      title: t("feature4Title"),
      desc: t("feature4Desc"),
      icon: <RefreshCw className="w-5 h-5 text-purple-500" />,
      bgColor: "bg-purple-500/10",
      accentColor: "border-purple-500 ring-2 ring-purple-500/20 text-purple-500",
    },
  ];

  // Trigger smooth step progression when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  // Auto step timer
  useEffect(() => {
    if (!hasAnimated) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [hasAnimated, steps.length]);

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 bg-white dark:bg-[#090D16] transition-colors duration-300 relative overflow-hidden"
      id="about"
    >
      {/* Ambient background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#4F6BFF]/10 rounded-full blur-3xl -translate-y-1/2 -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ================================================== */}
          {/* LEFT SIDE: PRECISION ZIG-ZAG JOURNEY */}
          {/* ================================================== */}
          <div className="lg:col-span-6 relative flex flex-col justify-center py-6 min-h-[480px]">
            
            {/* Smooth Animated SVG Zig-Zag Path */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block -z-0"
              viewBox="0 0 500 500"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M 140,50 C 360,50 360,150 360,150 C 360,150 140,150 140,250 C 140,250 360,250 360,350 C 360,350 140,350 140,450"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="text-slate-200 dark:text-slate-800"
              />

              <path
                d="M 140,50 C 360,50 360,150 360,150 C 360,150 140,150 140,250 C 140,250 360,250 360,350 C 360,350 140,350 140,450"
                stroke="url(#gradient-zigzag)"
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  strokeDasharray: "1150",
                  strokeDashoffset: `${1150 - (activeStep / 4) * 1150}`,
                  transition: "stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />

              <defs>
                <linearGradient id="gradient-zigzag" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F6BFF" />
                  <stop offset="50%" stopColor="#7B61FF" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Mobile Vertical Connector */}
            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-800 sm:hidden -z-0" />
            <div
              className="absolute left-6 top-8 w-0.5 bg-gradient-to-b from-[#4F6BFF] via-[#7B61FF] to-emerald-500 sm:hidden transition-all duration-700 -z-0"
              style={{ height: `${(activeStep / 4) * 85 + 10}%` }}
            />

            {/* 5 Zig-Zag Step Cards Container */}
            <div className="space-y-6 sm:space-y-7 relative z-10">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const isPassed = activeStep > idx;
                const isRight = step.side === "right";

                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center gap-4 transition-all duration-500 ${
                      isRight ? "sm:justify-end" : "sm:justify-start"
                    }`}
                  >
                    {/* Step Card */}
                    <div
                      className={`w-full sm:w-[260px] p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        step.isFinal && (isActive || isPassed)
                          ? "bg-[#0F172A] dark:bg-[#0B132B] text-white border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                          : isActive
                          ? "bg-white dark:bg-[#111827] border-[#4F6BFF] shadow-lg ring-2 ring-[#4F6BFF]/20 text-slate-900 dark:text-white translate-scale-102"
                          : isPassed
                          ? "bg-slate-50 dark:bg-[#111827]/80 border-emerald-500/30 text-slate-800 dark:text-slate-200"
                          : "bg-white dark:bg-[#111827]/40 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPassed || (isActive && step.isFinal)
                                ? "bg-emerald-500 text-white"
                                : isActive
                                ? "bg-[#4F6BFF] text-white"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.icon}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                            {t("step1Title").startsWith("దశ") || t("step1Title").startsWith("दशा") ? "" : "STEP "}{step.id === 1 ? t("step1Title") : step.id === 2 ? t("step2Title") : step.id === 3 ? t("step3Title") : step.id === 4 ? t("step4Title") : t("step5Title")}
                          </span>
                        </div>

                        {step.isFinal && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold animate-pulse">
                            • {t("step5Status").includes("లైవ్") ? "లైవ్" : "LIVE"}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base leading-snug mb-1">
                        {step.title}
                      </h4>
                      <p className="text-xs opacity-80 leading-relaxed font-medium">
                        {step.subtext}
                      </p>

                      {step.isFinal && isActive && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                            {t("step5Status")}
                          </span>
                          <div className="flex gap-0.5 items-end h-3">
                            <div className="w-0.5 bg-emerald-400 h-2 animate-pulse" />
                            <div className="w-0.5 bg-emerald-400 h-3 animate-pulse delay-75" />
                            <div className="w-0.5 bg-emerald-400 h-1.5 animate-pulse delay-150" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================== */}
          {/* RIGHT SIDE: PRODUCT VALUE PROPOSITION (~48% = col-span-6) */}
          {/* ================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            {/* Section Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("aboutTag")}</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-[42px] font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
              {t("aboutTitle")}
            </h2>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
              {t("aboutSubtitle")}
            </p>

            {/* 2x2 Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const isCurrentActive = steps[activeStep]?.highlightFeatureIndex === idx;

                return (
                  <div
                    key={feature.id}
                    className={`p-5 rounded-2xl border transition-all duration-300 ${
                      isCurrentActive
                        ? `bg-white dark:bg-[#111827] shadow-lg ${feature.accentColor}`
                        : "bg-slate-50/80 dark:bg-[#111827]/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-[#111827]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${feature.bgColor}`}>
                      {feature.icon}
                    </div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
