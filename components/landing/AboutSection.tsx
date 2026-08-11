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

export default function AboutSection() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // 6 Journey Steps for the Zig-Zag path
  const steps = [
    {
      id: 1,
      title: "Login",
      subtext: "Access your dashboard",
      icon: <User className="w-4 h-4" />,
      highlightFeatureIndex: 0,
      side: "left",
    },
    {
      id: 2,
      title: "Create Campaign",
      subtext: "Set goal, scripts & settings",
      icon: <Megaphone className="w-4 h-4" />,
      highlightFeatureIndex: 3,
      side: "right",
    },
    {
      id: 3,
      title: "Upload Contacts",
      subtext: "Upload your contact list",
      icon: <UploadCloud className="w-4 h-4" />,
      highlightFeatureIndex: 1,
      side: "left",
    },
    {
      id: 4,
      title: "Launch Campaign",
      subtext: "Review and launch",
      icon: <Rocket className="w-4 h-4" />,
      highlightFeatureIndex: 2,
      side: "right",
    },
    {
      id: 5,
      title: "AI Starts Calling",
      subtext: "AI calls and handles conversations",
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
      title: "AI Voice Calls",
      desc: "Human-like conversations that feel natural.",
      icon: <Bot className="w-5 h-5 text-[#4F6BFF]" />,
      bgColor: "bg-indigo-500/10",
      accentColor: "border-[#4F6BFF] ring-2 ring-[#4F6BFF]/20 text-[#4F6BFF]",
    },
    {
      id: "lead",
      title: "Lead Qualification",
      desc: "Qualify leads and capture important information.",
      icon: <Target className="w-5 h-5 text-emerald-500" />,
      bgColor: "bg-emerald-500/10",
      accentColor: "border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-500",
    },
    {
      id: "booking",
      title: "Appointment Booking",
      desc: "Automatically book appointments in calendar.",
      icon: <Calendar className="w-5 h-5 text-amber-500" />,
      bgColor: "bg-amber-500/10",
      accentColor: "border-amber-500 ring-2 ring-amber-500/20 text-amber-500",
    },
    {
      id: "automation",
      title: "Smart Automation",
      desc: "CRM updates, follow-ups and notifications.",
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

  // Step advancement timer
  useEffect(() => {
    if (!hasAnimated) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev; // Stay at step 6 once completed
      });
    }, 1800); // 1.8s per step for comfortable, readable pacing

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
          {/* LEFT SIDE: PRECISION ZIG-ZAG JOURNEY (~52% = col-span-6) */}
          {/* ================================================== */}
          <div className="lg:col-span-6 relative flex flex-col justify-center py-6 min-h-[480px]">
            
            {/* Smooth Animated SVG Zig-Zag Path (Desktop & Tablet) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block -z-0"
              viewBox="0 0 500 500"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Background Path (Dashed Muted Track) */}
              <path
                d="M 140,50 C 360,50 360,150 360,150 C 360,150 140,150 140,250 C 140,250 360,250 360,350 C 360,350 140,350 140,450"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                className="text-slate-200 dark:text-slate-800"
              />

              {/* Glowing Active Progress Gradient Path */}
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

              {/* Gradient Definition */}
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

            {/* 6 Zig-Zag Step Cards Container */}
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
                      className={`w-full sm:w-[260px] md:w-[275px] p-3.5 sm:p-4 rounded-2xl border transition-all duration-500 cursor-pointer relative group ${
                        isActive
                          ? step.isFinal
                            ? "bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white border-emerald-500/80 shadow-xl shadow-emerald-500/20 scale-[1.03] ring-2 ring-emerald-500/30"
                            : "bg-white dark:bg-[#131B2E] border-[#4F6BFF] text-slate-900 dark:text-white shadow-xl shadow-[#4F6BFF]/20 scale-[1.02] ring-2 ring-[#4F6BFF]/30"
                          : isPassed
                          ? "bg-white/90 dark:bg-[#111827]/90 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                          : "bg-slate-50/70 dark:bg-[#0D1322]/50 border-slate-200/50 dark:border-slate-800/50 opacity-60 hover:opacity-90"
                      }`}
                    >
                      {/* Active Glowing Pulse Ring behind icon */}
                      {isActive && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4F6BFF]/30 to-[#7B61FF]/30 rounded-2xl blur-md opacity-75 -z-10" />
                      )}

                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-3">
                          {/* Step Icon Container */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isActive
                                ? step.isFinal
                                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/40 scale-110"
                                  : "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/40 scale-110"
                                : isPassed
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                                : "bg-slate-200/80 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {isPassed ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              step.icon
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Step {step.id}
                            </span>
                            <h3
                              className={`font-bold text-sm leading-snug transition-colors ${
                                isActive && step.isFinal
                                  ? "text-white"
                                  : isActive
                                  ? "text-[#4F6BFF] dark:text-[#818CF8]"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {step.title}
                            </h3>
                          </div>
                        </div>

                        {/* Final Step Live Pill */}
                        {step.isFinal && isActive && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>LIVE</span>
                          </div>
                        )}
                      </div>

                      {/* Supporting Subtext */}
                      <p
                        className={`text-xs leading-relaxed transition-colors ${
                          isActive && step.isFinal
                            ? "text-slate-300"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {step.subtext}
                      </p>

                      {/* STEP 6 SPECIAL PAYOFF — Voice Waveform */}
                      {step.isFinal && isActive && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>AI Conversation Active</span>
                          </div>

                          {/* Animated Voice Waveform Bars */}
                          <div className="flex items-center gap-1 h-4">
                            {[40, 85, 50, 100, 75, 35].map((h, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-emerald-400 rounded-full animate-pulse"
                                style={{
                                  height: `${h}%`,
                                  animationDelay: `${i * 120}ms`,
                                }}
                              />
                            ))}
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
          {/* RIGHT SIDE: ABOUT CALLINGGEN + 2x2 FEATURE CARDS (~48% = col-span-6) */}
          {/* ================================================== */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            {/* Section Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4 w-fit">
              <Cpu className="w-3.5 h-3.5" />
              <span>ABOUT CALLINGGEN</span>
            </div>

            {/* Right Side Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
              What is{" "}
              <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
                CallingGen?
              </span>
            </h2>

            {/* Exact Required Copy Text */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl">
              Businesses lose valuable leads when calls go unanswered or follow-ups are delayed. CallingGen solves this by using AI voice agents that answer instantly, engage customers naturally, and automate the entire calling process from start to finish.
            </p>

            {/* 2 × 2 Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feat, fIdx) => {
                const highlighted = steps[activeStep]?.highlightFeatureIndex === fIdx;

                return (
                  <div
                    key={feat.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-500 ${
                      highlighted
                        ? `${feat.accentColor} bg-white dark:bg-[#131B2E] shadow-xl shadow-indigo-500/10 scale-[1.02]`
                        : "bg-slate-50 dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl w-fit mb-3 ${feat.bgColor}`}>
                      {feat.icon}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
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
