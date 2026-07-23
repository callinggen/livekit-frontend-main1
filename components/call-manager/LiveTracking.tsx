import React from "react";
import { Crosshair, Clock, Zap, CheckCircle2 } from "lucide-react";
import { LiveTrackingStats } from "./types";

interface LiveTrackingProps {
  stats: LiveTrackingStats;
}

export default function LiveTracking({ stats }: LiveTrackingProps) {
  const steps = [
    { 
      key: "registry", 
      label: "REGISTRY", 
      value: stats.registry, 
      sub: "Input detected",
      icon: Crosshair, 
      color: "text-rose-500",
      bgLight: "bg-rose-100 ring-rose-200",
      bgDark: "dark:bg-rose-500/10 dark:ring-rose-500/30",
      glow: "dark:shadow-[0_0_15px_rgba(244,63,94,0.3)]",
    },
    { 
      key: "standby", 
      label: "STANDBY", 
      value: stats.standby, 
      sub: "Waiting in queue",
      icon: Clock, 
      color: "text-amber-500",
      bgLight: "bg-amber-100 ring-amber-200",
      bgDark: "dark:bg-amber-500/10 dark:ring-amber-500/30",
      glow: "dark:shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    },
    { 
      key: "dialer", 
      label: "DIALER", 
      value: stats.dialer, 
      sub: "Active dialing",
      icon: Zap, 
      color: "text-cyan-500",
      bgLight: "bg-cyan-100 ring-cyan-200",
      bgDark: "dark:bg-cyan-500/10 dark:ring-cyan-500/30",
      glow: "dark:shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    },
    { 
      key: "analysis", 
      label: "ANALYSIS", 
      value: stats.analysis, 
      sub: "Finished calls",
      icon: CheckCircle2, 
      color: "text-purple-500",
      bgLight: "bg-purple-100 ring-purple-200",
      bgDark: "dark:bg-purple-500/10 dark:ring-purple-500/30",
      glow: "dark:shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm border border-zinc-200 dark:bg-gradient-to-b dark:from-[#09090b] dark:to-[#130f1c] dark:shadow-2xl dark:border-zinc-800/60 overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
          <div className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span className="text-[10px] font-extrabold tracking-widest text-rose-600 dark:text-rose-400 uppercase">Live Journey</span>
        </div>
        <div className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
          Mission Control /
        </div>
      </div>

      {/* Center the pipeline vertically */}
      <div className="flex flex-1 flex-col items-center justify-center py-2 w-full">
        
        {stats.campaign_status === "Scheduled" && stats.schedule_date && (
          <div className="mb-4 text-center rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 w-full max-w-[240px]">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Scheduled</p>
            <p className="text-xs text-blue-500/80 mt-1">
              {new Date(stats.schedule_date).toLocaleString()}
            </p>
          </div>
        )}

        {/* Main Pipeline Area */}
        <div className="relative flex flex-col items-center w-full max-w-[240px]">
          
          {/* Continuous Gradient Background Line - precisely aligned behind icons */}
          <div className="absolute left-1/2 top-6 bottom-[10px] -ml-[1px] w-[2px] bg-gradient-to-b from-rose-400 via-cyan-400 to-purple-500 z-0 opacity-40 dark:opacity-80" />

          {/* Vertical Steps */}
          <div className="flex flex-col gap-5 w-full z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`flex w-[200px] flex-col items-center justify-center rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-md backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-zinc-700/50 dark:bg-[#16161e]/95 ${step.glow}`}>
                    <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${step.bgLight} ${step.bgDark}`}>
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    </div>
                    
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      {step.label}
                    </p>
                    
                    <p className={`mt-0.5 text-2xl font-black ${step.color}`}>
                      {step.value}
                    </p>
                    
                    <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                      {step.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Outcomes Branching Area */}
          <div className="relative mt-5 flex w-[260px] justify-between gap-3 z-10">
            
            {/* SVG curves connecting the central line to the cards */}
            <div className="absolute -top-5 left-1/2 w-[160px] -translate-x-1/2 h-5 z-0 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 160 20" preserveAspectRatio="none">
                <path d="M80 0 C80 10 40 10 40 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400/50 dark:text-purple-500/80" />
                <path d="M80 0 C80 10 120 10 120 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400/50 dark:text-purple-500/80" />
              </svg>
            </div>

            {/* Completed Card */}
            <div className="relative flex flex-1 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-2.5 shadow-sm dark:border-emerald-500/30 dark:bg-[#121217] dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <div className="absolute top-0 h-1 w-1/2 rounded-b-full bg-emerald-500" />
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
              <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
                Completed
              </p>
            </div>

            {/* No Answer Card */}
            <div className="relative flex flex-1 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-2.5 shadow-sm dark:border-blue-500/30 dark:bg-[#121217] dark:shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <div className="absolute top-0 h-1 w-1/2 rounded-b-full bg-blue-500" />
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">{stats.failed}</p>
              <p className="text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
                No Answer
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
