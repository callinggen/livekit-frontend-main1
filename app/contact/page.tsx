"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, PhoneCall, ShieldCheck, Globe } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const countries = [
    { code: "+91", label: "India (+91)" },
    { code: "+1", label: "United States (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+971", label: "UAE (+971)" },
    { code: "+65", label: "Singapore (+65)" },
    { code: "+61", label: "Australia (+61)" },
    { code: "+1", label: "Canada (+1)" },
  ];

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  const availableDates = [
    { day: "Mon", date: 14 },
    { day: "Tue", date: 15 },
    { day: "Wed", date: 16 },
    { day: "Thu", date: 17 },
    { day: "Fri", date: 18 },
  ];

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:30 AM",
    "01:00 PM",
    "02:30 PM",
    "04:00 PM",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* LEFT: Contact & Book Demo Message (Col 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>BOOK A PERSONALIZED DEMO</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
                See How CallingGen Automates Your{" "}
                <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
                  Business Calls
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Schedule a 1-on-1 walkthrough with our voice AI specialists. Discover how to deploy custom AI agents, qualify leads automatically, and integrate with your CRM.
              </p>

              {/* Benefits Checklist */}
              <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Live demonstration of AI agent calling & transcriptions</span>
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>Custom prompt & script setup for your specific use case</span>
                </div>

                <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>CRM, WhatsApp & Google Calendar integration walkthrough</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Booking Form (Col 7) */}
            <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-2xl min-h-[500px]">
              {submitted ? (
                <div className="text-center py-16 space-y-4 h-full flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Meeting Confirmed!</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto">
                    A calendar invitation has been sent to your email. We look forward to showing you CallingGen in action.
                  </p>
                </div>
              ) : !showDetailsForm ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Select a Date & Time</h3>
                    <p className="text-sm text-slate-500">Duration: 30 Min • Video Call (Google Meet)</p>
                  </div>

                  {/* Calendar Dates */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <span>October 2024</span>
                      <div className="flex gap-2">
                        <button className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">&lt;</button>
                        <button className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">&gt;</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {availableDates.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                          className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                            selectedDate === d.date
                              ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-md shadow-[#4F6BFF]/20"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-80">{d.day}</span>
                          <span className="text-lg font-black">{d.date}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Available Slots (IST)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((time, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedSlot(time)}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                              selectedSlot === time
                                ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-md shadow-[#4F6BFF]/20"
                                : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-[#4F6BFF] hover:border-[#4F6BFF] hover:bg-[#4F6BFF]/5"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && selectedSlot && (
                    <div className="pt-6 mt-4">
                      <Button
                        onClick={() => setShowDetailsForm(true)}
                        className="w-full py-6 text-base font-bold bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-xl shadow-lg shadow-[#4F6BFF]/25 transition-all"
                      >
                        Next: Enter Details
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setShowDetailsForm(false)}
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      &lt;
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enter Details</h3>
                      <p className="text-xs text-slate-500 font-semibold text-[#4F6BFF]">
                        {selectedDate} Oct, {selectedSlot} (IST)
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Full Name *</label>
                        <input type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="John Miller" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Work Email *</label>
                        <input type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="john@company.com" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Phone Number *</label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]"
                        >
                          {countries.map((c, i) => (
                            <option key={i} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                        <input type="tel" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="98765 43210" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Use Case (Optional)</label>
                      <textarea rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] resize-none" placeholder="Briefly describe what you're looking to automate..." />
                    </div>

                    <Button type="submit" className="w-full py-6 text-base font-bold bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-xl shadow-lg shadow-[#4F6BFF]/25 mt-2">
                      Schedule Event
                    </Button>
                  </form>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
