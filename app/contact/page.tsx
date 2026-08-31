"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, PhoneCall, ShieldCheck, Globe } from "lucide-react";

import { api } from "@/lib/api";

interface SlotOption {
  formatted: string;
  iso: string;
}

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");

  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [availableSlotsData, setAvailableSlotsData] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  
  // Calendar State
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [showDetailsForm, setShowDetailsForm] = useState(false);

  const fetchSlots = async () => {
    try {
      setIsLoadingSlots(true);
      const data = await api.getCalendarSlots();
      setAvailableSlotsData(data.available_slots || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setIndustry("");
    setSelectedSlot(null);
    setSelectedDateKey(null);
    setShowDetailsForm(false);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (!selectedSlot) {
        throw new Error("Please select a date and time slot.");
      }

      await api.bookCalendarSlot({
        name,
        email,
        phone: `${countryCode}${phone}`,
        company: company || "Not Provided",
        industry: industry || "Other",
        appointment_time: selectedSlot.iso
      });

      setSubmitted(true);
      resetForm();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to book slot");
    } finally {
      setIsSubmitting(false);
    }
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

  // Derived Dates and Slots using Map to preserve strict chronological order (YYYY-MM-DD)
  const dateGroupsMap = new Map<string, {
    dateKey: string;
    day: string;
    dateNum: number;
    monthFull: string;
    monthShort: string;
    slots: SlotOption[];
  }>();

  availableSlotsData.forEach((isoStr: string) => {
    const d = new Date(isoStr);
    // Format YYYY-MM-DD in IST
    const dateKey = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });
    const dateNum = d.getDate();
    const day = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const monthShort = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' });
    const monthFull = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'long', year: 'numeric' });

    if (!dateGroupsMap.has(dateKey)) {
      dateGroupsMap.set(dateKey, {
        dateKey,
        day,
        dateNum,
        monthFull,
        monthShort,
        slots: []
      });
    }

    dateGroupsMap.get(dateKey)!.slots.push({
      formatted: d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }),
      iso: isoStr
    });
  });

  const availableDateGroups = Array.from(dateGroupsMap.values());
  
  // Set default selected date key if not set
  const activeDateKey = selectedDateKey && dateGroupsMap.has(selectedDateKey) 
    ? selectedDateKey 
    : (availableDateGroups.length > 0 ? availableDateGroups[0].dateKey : null);

  const selectedGroup = activeDateKey ? dateGroupsMap.get(activeDateKey) : null;

  const currentMonthYear = selectedGroup ? selectedGroup.monthFull : (availableDateGroups.length > 0 ? availableDateGroups[0].monthFull : "Loading...");
  
  const timeSlots: SlotOption[] = selectedGroup ? selectedGroup.slots : [];

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
                  <Button onClick={() => { setSubmitted(false); resetForm(); fetchSlots(); }} className="mt-4 bg-[#4F6BFF] text-white">
                    Book Another Slot
                  </Button>
                </div>
              ) : !showDetailsForm ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Select a Date & Time</h3>
                    <p className="text-sm text-slate-500">Duration: 1 Hour • Video Call (Google Meet)</p>
                  </div>

                  {/* Calendar Dates */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <span>{currentMonthYear}</span>
                    </div>
                    {isLoadingSlots ? (
                      <div className="py-8 text-center text-sm text-slate-500">Loading available slots...</div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {availableDateGroups.slice(0, 7).map((group, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedDateKey(group.dateKey); setSelectedSlot(null); }}
                          className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                            activeDateKey === group.dateKey
                              ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-md shadow-[#4F6BFF]/20"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-80">{group.day}</span>
                          <span className="text-lg font-black">{group.dateNum}</span>
                        </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time Slots */}
                  {activeDateKey && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Available Slots (IST)</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((slotObj: SlotOption, i: number) => (
                          <button
                            key={i}
                            onClick={() => setSelectedSlot(slotObj)}
                            className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                              selectedSlot?.iso === slotObj.iso
                                ? "bg-[#4F6BFF] text-white border-[#4F6BFF] shadow-md shadow-[#4F6BFF]/20"
                                : "bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-[#4F6BFF] hover:border-[#4F6BFF] hover:bg-[#4F6BFF]/5"
                            }`}
                          >
                            {slotObj.formatted}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDateKey && selectedSlot && (
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
                        {selectedGroup?.dateNum} {selectedGroup?.monthShort}, {selectedSlot?.formatted} (IST)
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Full Name *</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="John Miller" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Work Email *</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="john@company.com" />
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
                        <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="98765 43210" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Company (Optional)</label>
                      <input value={company} onChange={e => setCompany(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BFF]" placeholder="Acme Inc" />
                    </div>

                    {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

                    <Button disabled={isSubmitting} type="submit" className="w-full py-6 text-base font-bold bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-xl shadow-lg shadow-[#4F6BFF]/25 mt-2">
                      {isSubmitting ? "Scheduling..." : "Schedule Event"}
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
