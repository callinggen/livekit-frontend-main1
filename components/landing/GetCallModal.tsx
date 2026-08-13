"use client";

import { useState, useEffect } from "react";
import { X, Phone, Loader2, CheckCircle2, User, Building2, Mail, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "@/lib/api";

const industries = [
  "Real Estate",
  "Healthcare",
  "E-Commerce",
  "Software / SaaS",
  "Logistics",
  "Customer Support",
  "Other"
];

const countryCodes = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+61", label: "Australia (+61)" },
];

export default function GetCallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("Software / SaaS");

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setCountryCode("+91");
    setIndustry("Software / SaaS");
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsSuccess(false);
      resetForm();
    };
    
    window.addEventListener("open-get-call-modal", handleOpen);
    return () => window.removeEventListener("open-get-call-modal", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.triggerDemoCall({
        name,
        email,
        company,
        phone: `${countryCode}${phone}`,
        industry
      });
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && setIsOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[440px] bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden border border-white/40 dark:border-white/10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative Gradients */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-[3rem] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-[3rem] pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-8 py-7 border-b border-slate-100/60 dark:border-slate-800/60 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F6BFF] to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-[#4F6BFF]/30 ring-4 ring-[#4F6BFF]/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 leading-tight">CallingGen AI</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Experience the future of voice</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 relative z-10">
          {isSuccess ? (
            <div className="text-center py-10 space-y-4">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Connecting Call!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] mx-auto leading-relaxed">
                Please ensure your phone is off silent mode. Our AI agent is dialing your number right now...
              </p>
              <Button 
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="mt-8 w-full py-6 text-base font-bold bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-2xl shadow-lg shadow-[#4F6BFF]/20 transition-all hover:shadow-[#4F6BFF]/40 hover:-translate-y-0.5"
              >
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Fill in your details below and our AI will call you instantly, ready to discuss your specific industry needs.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-sm focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="John Doe" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Company</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input required value={company} onChange={e => setCompany(e.target.value)} type="text" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-sm focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Acme Inc" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-sm focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="john@company.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Phone Number</label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-[110px] px-3 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-xs focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none font-medium text-slate-900 dark:text-white cursor-pointer">
                    {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input required value={phone} onChange={e => setPhone(e.target.value)} type="tel" className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-sm focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none font-medium tracking-wide text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="98765 43210" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-1">Industry</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                  <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#131B2E]/50 text-sm focus:ring-2 focus:ring-[#4F6BFF]/50 focus:border-[#4F6BFF] transition-all outline-none font-medium text-slate-900 dark:text-white cursor-pointer appearance-none">
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
              </div>

              <Button 
                disabled={isSubmitting}
                type="submit" 
                className="group w-full py-6 mt-4 text-base font-bold bg-[#4F6BFF] hover:bg-[#435BE0] text-white rounded-2xl shadow-lg shadow-[#4F6BFF]/25 flex items-center justify-center gap-2 transition-all hover:shadow-[#4F6BFF]/40 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Initiating Call...</>
                ) : (
                  <>
                    Call Me Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
