"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  GraduationCap,
  Stethoscope,
  Landmark,
  Megaphone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Volume2,
  Play,
  Pause,
  Globe,
  Radio,
  Sliders,
} from "lucide-react";

import { useLanguage } from "@/components/LanguageContext";
import { industriesData } from "@/lib/translations";

const indIcons = [
  <Building2 className="w-5 h-5 text-[#4F6BFF]" key="real-estate" />,
  <GraduationCap className="w-5 h-5 text-amber-500" key="education" />,
  <Stethoscope className="w-5 h-5 text-emerald-500" key="healthcare" />,
  <Landmark className="w-5 h-5 text-[#7B61FF]" key="finance" />,
  <Megaphone className="w-5 h-5 text-pink-500" key="agency" />,
  <Briefcase className="w-5 h-5 text-cyan-500" key="services" />,
];

export default function IndustriesSection() {
  const { language, t } = useLanguage();
  const [activeIndustry, setActiveIndustry] = useState<number>(0);
  const [activeVoiceLang, setActiveVoiceLang] = useState<"en" | "hi" | "te">("en");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);

  // Audio Playback Simulation Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 5;
        });
      }, 300);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const voiceSamples = {
    en: {
      langName: "English (US / IN)",
      flag: "🌐",
      speaker: "Clara — Professional AI Agent",
      transcript:
        "\"Hello! Thank you for inquiring with us. I can help answer your questions, qualify your preferences, and schedule a live site visit directly in your calendar. Would 10 AM tomorrow work for you?\"",
    },
    hi: {
      langName: "Hindi (हिंदी)",
      flag: "🇮🇳",
      speaker: "Aarav — Conversational AI Agent",
      transcript:
        "\"नमस्ते! कॉलिंगजीन में आपका स्वागत है। मैं आपकी प्रॉपर्टी और लोन संबंधी प्रश्नों में मदद कर सकता हूँ। क्या मैं आपके लिए कल सुबह 11 बजे का अपॉइंटमेंट बुक कर दूँ?\"",
    },
    te: {
      langName: "Telugu (తెలుగు)",
      flag: "🇮🇳",
      speaker: "Srikar — Support AI Agent",
      transcript:
        "\"నమస్కారం! మేము మీ విచారణను అందుకున్నాము. మీ సమాచారాన్ని సరిచూసి, మా నిపుణుడితో ప్రత్యక్ష అపాయింట్‌మెంట్‌ని బుక్ చేయడానికి నేను మీకు సహాయం చేయగలను.\"",
    },
  };

  const rawIndustries = industriesData[language] || industriesData["en"];
  const industries = rawIndustries.map((ind, idx) => ({
    ...ind,
    icon: indIcons[idx] || <Building2 className="w-5 h-5 text-[#4F6BFF]" />,
  }));

  const current = industries[activeIndustry];
  const sample = voiceSamples[activeVoiceLang];

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300 relative overflow-hidden" id="industries">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("indTag")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
            {t("indTitle")}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t("indSubtitle")}
          </p>
        </div>

        {/* Industry Selector Tabs (Grid of 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {industries.map((ind, idx) => {
            const isActive = activeIndustry === idx;
            return (
              <button
                key={ind.id}
                onClick={() => setActiveIndustry(idx)}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center group ${
                  isActive
                    ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-lg shadow-[#4F6BFF]/25 scale-[1.03]"
                    : "bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#4F6BFF]/40"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl mb-2 transition-all ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-110"
                  }`}
                >
                  {ind.icon}
                </div>
                <span className="font-bold text-xs sm:text-sm tracking-tight">{ind.name}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Industry Content & Interactive Voice Sample Player */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: Industry Challenges & Solutions (Col 7) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#4F6BFF] dark:text-[#818CF8] uppercase tracking-wider mb-1">
                {current.name} Solution Overview
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {current.subtitle}
              </h3>
            </div>

            {/* Challenges */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider block">
                {t("indChallengesHeader")}
              </span>
              {current.challenges.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* Solutions */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">
                {t("indSolutionsHeader")}
              </span>
              {current.solutions.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Benefit Pill */}
            <div className="p-3.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-bold flex items-center gap-2 w-fit">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{current.benefits}</span>
            </div>
          </div>

          {/* RIGHT: Interactive AI Voice Sample Audio Player (3 Languages) (Col 5) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-500/30 shadow-2xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#4F6BFF]/20 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Listen to AI Agent Voice
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  HD Voice
                </span>
              </div>

              {/* 3 Language Selector Buttons */}
              <div className="flex items-center gap-2 mb-5">
                {(["en", "hi", "te"] as const).map((langKey) => (
                  <button
                    key={langKey}
                    onClick={() => {
                      setActiveVoiceLang(langKey);
                      setIsPlaying(false);
                      setAudioProgress(0);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeVoiceLang === langKey
                        ? "bg-[#4F6BFF] text-white shadow-md shadow-[#4F6BFF]/30"
                        : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>{voiceSamples[langKey].flag}</span>
                    <span className="capitalize">{langKey === "en" ? "English" : langKey === "hi" ? "Hindi" : "Telugu"}</span>
                  </button>
                ))}
              </div>

              {/* Speaker Info */}
              <div className="text-xs text-indigo-300 font-semibold mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#4F6BFF]" />
                <span>{sample.speaker}</span>
              </div>

              {/* Transcript Text Box */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 text-xs text-slate-200 leading-relaxed italic mb-5">
                {sample.transcript}
              </div>
            </div>

            {/* Interactive Play/Pause Controls Bar */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-[#4F6BFF] hover:bg-[#435BE0] text-white flex items-center justify-center shadow-lg shadow-[#4F6BFF]/30 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>{isPlaying ? "Playing Voice Sample..." : "Click to Play Audio"}</span>
                    <span>{isPlaying ? `${Math.round(audioProgress)}%` : "0:15"}</span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#4F6BFF] via-[#7B61FF] to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Animated Equalizer Visualizer */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-1 h-5 pt-1">
                  {[60, 100, 45, 90, 75, 30, 85, 50, 95, 40].map((h, idx) => (
                    <div
                      key={idx}
                      className="w-1 bg-[#4F6BFF] rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDelay: `${idx * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
