"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  Mic,
  Calendar,
  BarChart3,
  UserCheck,
  Globe,
  Sparkles,
  Check,
  ChevronDown,
  Volume2,
  LayoutDashboard,
  FolderKanban,
  PhoneCall,
  FileText,
  TrendingUp,
  Target,
  Bot,
  Plus,
  Coins,
  History,
  User,
  Settings,
  LogOut,
  PhoneForwarded,
} from "lucide-react";

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSecondaryCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const elem = document.getElementById("about") || document.getElementById("features");
    if (elem) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = elem.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-40 lg:pb-28 overflow-hidden bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300 flex items-center min-h-[85vh]">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-100px] left-[15%] w-[500px] h-[500px] bg-gradient-to-tr from-[#4F6BFF]/15 to-[#7B61FF]/15 blur-[120px] rounded-full dark:from-[#4F6BFF]/20 dark:to-[#7B61FF]/20" />
        <div className="absolute top-[200px] right-[10%] w-[400px] h-[400px] bg-gradient-to-br from-indigo-400/10 to-blue-500/10 blur-[100px] rounded-full dark:from-indigo-600/15 dark:to-blue-600/15" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ================================================== */}
          {/* LEFT SIDE: Marketing Content (~45% on desktop = col-span-5) */}
          {/* ================================================== */}
          <div className="lg:col-span-5 flex flex-col items-start text-left z-10">
            
            {/* 1. Small Hero Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-6 transition-all duration-700 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F6BFF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F6BFF]"></span>
              </span>
              <span>AI Voice Calling Platform</span>
            </div>

            {/* 2. Main Hero Heading */}
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-[54px] font-extrabold text-slate-900 dark:text-white leading-[1.12] tracking-tight mb-6 transition-all duration-700 delay-150 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              AI Voice Agents That Handle Your Business Calls{" "}
              <span className="bg-gradient-to-r from-[#4F6BFF] via-[#6366F1] to-[#7B61FF] bg-clip-text text-transparent inline-block">
                Automatically
              </span>
            </h1>

            {/* 3. Supporting Subheadline */}
            <p
              className={`text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-8 max-w-xl transition-all duration-700 delay-300 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              CallingGen helps businesses automate inbound and outbound calls, qualify leads, book appointments, answer customer queries, and save valuable time using AI voice agents.
            </p>

            {/* 4 & 5. Primary and Secondary CTAs */}
            <div
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10 w-full sm:w-auto transition-all duration-700 delay-450 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              {/* Primary CTA */}
              <Button
                onClick={() => window.dispatchEvent(new Event("open-get-call-modal"))}
                size="lg"
                className="w-full sm:w-auto bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-[#4F6BFF]/25 hover:shadow-xl hover:shadow-[#4F6BFF]/35 transition-all duration-200 active:scale-[0.98] focus:ring-2 focus:ring-[#4F6BFF] focus:ring-offset-2 dark:focus:ring-offset-[#090D16]"
              >
                Get Call
              </Button>

              {/* Secondary CTA */}
              <Button
                size="lg"
                variant="outline"
                onClick={handleSecondaryCtaClick}
                className="group w-full sm:w-auto rounded-full px-7 py-6 text-base font-medium border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
              >
                <span>See How It Works</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200 text-[#4F6BFF] dark:text-[#818CF8]" />
              </Button>
            </div>

            {/* 6. Trust Indicators */}
            <div
              className={`grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-700 delay-600 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>24/7 AI Calling</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>Multi-language Support</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>CRM Integration</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>WhatsApp Integration</span>
              </div>
            </div>

          </div>

          {/* ================================================== */}
          {/* RIGHT SIDE: Real CallingGen Dashboard Visualization (~55% on desktop = col-span-7) */}
          {/* ================================================== */}
          <div
            className={`lg:col-span-7 relative mt-10 lg:mt-0 transition-all duration-1000 delay-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Soft backdrop lighting */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#4F6BFF]/20 to-[#7B61FF]/20 rounded-3xl blur-2xl opacity-60 dark:opacity-40 -z-10" />

            {/* Dashboard Container / App Window */}
            <div className="bg-[#F9FAFB] dark:bg-[#0B0F19] rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden hover:shadow-indigo-500/10 transition-all duration-500">
              
              {/* Top Window Control & App Header Bar */}
              <div className="border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 bg-white dark:bg-[#111827] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/90" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                  <div className="ml-2 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">OVERVIEW</span>
                    <span>/</span>
                    <span className="text-slate-500 dark:text-slate-400">Dashboard</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Demo Plan Tag */}
                  <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Pro Plan
                  </span>

                  {/* Credits Indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Coins className="w-3.5 h-3.5 text-cyan-500" />
                    <span>850 Credits</span>
                  </div>

                  {/* User Profile Avatar Pill */}
                  <div className="flex items-center gap-1.5 bg-[#4F6BFF] text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">U</span>
                    <span className="hidden md:inline-block">User Name</span>
                  </div>
                </div>
              </div>

              {/* Main Dashboard Workspace (Sidebar + Content Area) */}
              <div className="grid grid-cols-12 min-h-[440px]">
                
                {/* Left Navigation Sidebar (Col 3 on desktop) */}
                <div className="hidden sm:block sm:col-span-3 bg-white dark:bg-[#111827] border-r border-slate-200/80 dark:border-slate-800 p-3 space-y-4">
                  {/* CallingGen Logo in Sidebar */}
                  <div className="flex items-center gap-2 px-2 py-1 mb-3">
                    <div className="bg-[#4F6BFF] p-1.5 rounded-lg text-white">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                      CallingGen
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                    Navigation
                  </div>

                  {/* Navigation Links */}
                  <nav className="space-y-1">
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-[#4F6BFF] text-white font-semibold text-xs shadow-md shadow-[#4F6BFF]/20 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-xs cursor-pointer transition-colors">
                      <Calendar className="w-4 h-4" />
                      <span>Calendar</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-xs cursor-pointer transition-colors">
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Manager</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-xs cursor-pointer transition-colors">
                      <FileText className="w-4 h-4" />
                      <span>Call Logs</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-xs cursor-pointer transition-colors">
                      <FolderKanban className="w-4 h-4" />
                      <span>Campaign</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium text-xs cursor-pointer transition-colors">
                      <BarChart3 className="w-4 h-4" />
                      <span>Report</span>
                    </div>
                  </nav>

                  {/* Sidebar Bottom User Widget */}
                  <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-slate-500 text-xs px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          U
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">User Name</div>
                          <div className="text-[9px] text-slate-400 truncate">callinggen.com</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Area (Col 9 on desktop / 12 on mobile) */}
                <div className="col-span-12 sm:col-span-9 p-4 space-y-4 overflow-hidden">
                  
                  {/* Greeting Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Welcome back, User Name</span>
                        <span>👋</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Here is what's happening with your campaigns today.
                      </p>
                    </div>

                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4F6BFF] hover:bg-[#435BE0] text-white text-xs font-semibold shadow-sm transition-all">
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Campaign</span>
                    </button>
                  </div>

                  {/* 8 DASHBOARD METRIC CARDS (Exact Match to callinggen.in UI) */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    
                    {/* Card 1: Total Campaigns */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-2">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">12</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Campaigns</div>
                    </div>

                    {/* Card 2: Total Calls */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-2">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">1,420</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Calls</div>
                    </div>

                    {/* Card 3: Completed Calls */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">1,280</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Completed Calls</div>
                    </div>

                    {/* Card 4: Interested Leads */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center mb-2">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">348</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Interested Leads</div>
                    </div>

                    {/* Card 5: Callbacks */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center mb-2">
                        <PhoneForwarded className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">42</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Callbacks</div>
                    </div>

                    {/* Card 6: Credits */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-2">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">850</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Credits</div>
                    </div>

                    {/* Card 7: Active Agents */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-2">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">5</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Agents</div>
                    </div>

                    {/* Card 8: Success Rate */}
                    <div className="bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-2">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">94.2%</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Success Rate</div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            {/* FLOATING NOTIFICATION CARD 1 (Top Left) */}
            <div className="absolute -left-3 sm:-left-6 top-12 bg-white dark:bg-[#1E293B] p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 hidden sm:flex items-center gap-3 animate-bounce [animation-duration:4s]">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Inbound Call
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Answered by AI</span>
                  <span className="text-[10px] text-emerald-500 font-normal">(+91 98765 43210)</span>
                </div>
              </div>
            </div>

            {/* FLOATING NOTIFICATION CARD 2 (Bottom Right) */}
            <div className="absolute -right-3 sm:-right-6 -bottom-4 bg-white dark:bg-[#1E293B] p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 hidden sm:flex items-center gap-3 animate-bounce [animation-duration:5s]">
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-[#4F6BFF]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Lead Qualified
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Appointment Synced to CRM
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}