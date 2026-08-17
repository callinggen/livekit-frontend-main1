"use client";

import { useState } from "react";
import {
  Bot,
  FolderKanban,
  UserCheck,
  Calendar,
  Share2,
  BarChart3,
  CheckCircle2,
  Volume2,
  Play,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Clock,
  Send,
  TrendingUp,
  Globe,
  Database,
} from "lucide-react";

import { useLanguage } from "@/components/LanguageContext";
import { featuresData } from "@/lib/translations";

const tabIcons = [
  <Bot className="w-4 h-4" key="voice" />,
  <FolderKanban className="w-4 h-4" key="campaign" />,
  <UserCheck className="w-4 h-4" key="lead" />,
  <Calendar className="w-4 h-4" key="booking" />,
  <Share2 className="w-4 h-4" key="integrations" />,
  <BarChart3 className="w-4 h-4" key="analytics" />,
];

export default function FeaturesSection() {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<number>(0);

  const rawTabs = featuresData[language] || featuresData["en"];
  const tabs = rawTabs.map((tab, idx) => ({
    ...tab,
    icon: tabIcons[idx] || <Bot className="w-4 h-4" />,
  }));

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-[#090D16] transition-colors duration-300 relative overflow-hidden" id="features">
      {/* Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("featuresTag")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-5 leading-[1.15]">
            {t("featuresTitleMain")}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t("featuresSubtitleMain")}
          </p>
        </div>

        {/* Horizontal Scrollable Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar justify-start md:justify-center border-b border-slate-200/80 dark:border-slate-800">
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#4F6BFF] text-white shadow-lg shadow-[#4F6BFF]/25 scale-[1.02]"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.icon}
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Feature Content & Product Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 dark:bg-[#111827] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl">
          
          {/* LEFT: Feature Information (Col 5) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#4F6BFF]/10 text-[#4F6BFF] dark:text-[#818CF8] text-xs font-bold w-fit">
              {tabs[activeTab].tagline}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {tabs[activeTab].title}
            </h3>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
              {tabs[activeTab].description}
            </p>

            <div className="space-y-3 pt-2">
              {tabs[activeTab].highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Dynamic CallingGen Product Visual (Col 7) */}
          <div className="lg:col-span-7 bg-slate-100 dark:bg-[#151C2C] rounded-2xl p-2 sm:p-3 border border-slate-200/90 dark:border-slate-800 shadow-2xl relative min-h-[420px] flex flex-col">
            <div className="bg-white dark:bg-[#0B0F19] rounded-xl border border-slate-200/50 dark:border-slate-800/50 h-full flex flex-col overflow-hidden shadow-inner">
            
            {/* Visual Header / MacOS style */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#111827]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div className="ml-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <div className="px-2 py-1 bg-white dark:bg-[#1E293B] rounded-md shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />
                    <span>callinggen.com/app/{tabs[activeTab].previewType}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Live Preview</span>
              </div>
            </div>
            
            <div className="p-5 sm:p-6 flex-grow flex flex-col justify-center">

            {/* DYNAMIC PREVIEW VIEW 1: AI VOICE CALLING */}
            {tabs[activeTab].previewType === "voice" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-400 uppercase">Live Call Connected</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                      <Volume2 className="w-3.5 h-3.5 text-[#4F6BFF]" />
                      <span>HD Audio Stream</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold mb-1">Customer: Sarah Jenkins (+1 (415) 555-0199)</div>
                  <div className="text-xs text-slate-400 mb-3">Campaign: Q3 Outbound Outreach • Accent: English (US)</div>
                  
                  <div className="bg-slate-950/90 rounded-lg p-3 text-xs text-slate-200 border border-slate-800">
                    <span className="font-bold text-indigo-300">AI Agent: </span>
                    "Hello Sarah! CallingGen offers automated 24/7 lead qualification and calendar booking. Should I schedule a 15-minute demo with our specialist?"
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4F6BFF]" />
                    <span>Response Latency: 240ms</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Sentiment: Positive (88%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC PREVIEW VIEW 2: CAMPAIGN MANAGEMENT */}
            {tabs[activeTab].previewType === "campaign" && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Active Campaign: Q3 Outbound Sales</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">Active (Running)</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Progress: 1,420 / 1,500 Dialed</span>
                      <span className="text-[#4F6BFF]">94.6% Completed</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] rounded-full w-[94.6%]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-400 text-[10px]">Calls Connected</div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">1,280</div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-400 text-[10px]">Interested Leads</div>
                      <div className="font-bold text-emerald-500 text-sm">348</div>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-slate-400 text-[10px]">Retry Queue</div>
                      <div className="font-bold text-amber-500 text-sm">42</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC PREVIEW VIEW 3: LEAD MANAGEMENT */}
            {tabs[activeTab].previewType === "lead" && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">Recent Qualified Leads Table</div>
                <div className="space-y-2">
                  {[
                    { name: "John Miller", phone: "+1 (415) 555-0123", status: "Qualified", score: "High Intent (92%)" },
                    { name: "Rajesh Sharma", phone: "+91 98765 43210", status: "Appointment Scheduled", score: "Demo Booked" },
                    { name: "Emma Watson", phone: "+44 20 7946 0958", status: "Callback Requested", score: "Follow-up Tomorrow" },
                  ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{lead.name}</div>
                        <div className="text-slate-400 text-[10px]">{lead.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold block text-[10px] mb-0.5">
                          {lead.status}
                        </span>
                        <span className="text-slate-400 text-[10px]">{lead.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DYNAMIC PREVIEW VIEW 4: APPOINTMENT BOOKING */}
            {tabs[activeTab].previewType === "booking" && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4F6BFF]" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Google Calendar Sync</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500">Confirmed (Tomorrow)</span>
                  </div>

                  <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">📅 Product Demo — CallingGen Enterprise</div>
                    <div className="text-slate-500">Time: 10:00 AM – 10:30 AM (IST / EST)</div>
                    <div className="text-slate-500">Attendee: john.miller@acme.com</div>
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold pt-1">
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Confirmation & Calendar Invite Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC PREVIEW VIEW 5: CRM & INTEGRATIONS */}
            {tabs[activeTab].previewType === "integrations" && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "HubSpot CRM", type: "Contact & Note Sync", icon: <Database className="w-5 h-5 text-orange-500" />, status: "Connected" },
                  { name: "WhatsApp Business", type: "Automated Messaging", icon: <MessageSquare className="w-5 h-5 text-emerald-500" />, status: "Active" },
                  { name: "Google Calendar", type: "Real-time Booking", icon: <Calendar className="w-5 h-5 text-blue-500" />, status: "Synced" },
                  { name: "Zapier & Webhooks", type: "Custom Integrations", icon: <Share2 className="w-5 h-5 text-purple-500" />, status: "Live" },
                ].map((app, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                        {app.icon}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {app.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white">{app.name}</div>
                    <div className="text-slate-400 text-[10px]">{app.type}</div>
                  </div>
                ))}
              </div>
            )}

            {/* DYNAMIC PREVIEW VIEW 6: ANALYTICS */}
            {tabs[activeTab].previewType === "analytics" && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#4F6BFF]" />
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Call Volume & Conversions</span>
                    </div>
                    <span className="text-xs text-slate-400 font-semibold">Success Rate: 94.2%</span>
                  </div>

                  <div className="flex items-end gap-2 h-24 pt-4">
                    {[35, 60, 45, 90, 70, 85, 100, 65, 80].map((val, idx) => (
                      <div key={idx} className="flex-1 bg-indigo-500/20 dark:bg-indigo-500/30 hover:bg-[#4F6BFF] rounded-t transition-all duration-300" style={{ height: `${val}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
