"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Starter",
      tagline: "Essential AI Calling for Small Businesses",
      price: "₹XXXX",
      credits: "500 Credits Included",
      popular: false,
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      features: [
        "1 Active AI Voice Agent",
        "500 Calling Credits / Month",
        "Inbound & Outbound Calling",
        "Standard English & Hindi Accents",
        "Basic Call Transcripts & Reports",
        "Email Support",
      ],
    },
    {
      name: "Professional",
      tagline: "High-Volume Automation & CRM Integration",
      price: "₹XXXX",
      credits: "2,000 Credits Included",
      popular: true,
      buttonText: "Start Professional",
      buttonVariant: "default" as const,
      features: [
        "5 Active AI Voice Agents",
        "2,000 Calling Credits / Month",
        "Inbound & Outbound Calling",
        "Multi-language (12+ Languages)",
        "WhatsApp Business & CRM Sync",
        "Real-time Appointment Booking",
        "Advanced Sentiment Reports",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise",
      tagline: "Custom Concurrency & White-Label Capabilities",
      price: "Custom",
      credits: "Unlimited Credits & Concurrency",
      popular: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      features: [
        "Unlimited AI Voice Agents",
        "Custom Concurrency & SIP Trunks",
        "Dedicated Server & White-Label UI",
        "Custom API & Webhooks Integration",
        "Custom Prompt & Persona Engineering",
        "Dedicated Account Manager",
        "99.9% Uptime SLA",
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-300">
      <Navbar />

      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TRANSPARENT PRICING</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
              Simple, Transparent Plans for{" "}
              <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
                Every Growth Stage
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Choose the perfect plan for your business. No hidden fees.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                Monthly Billing
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-800 p-1 transition-colors relative"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-[#4F6BFF] transition-transform ${
                    billingCycle === "yearly" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.popular
                    ? "bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border-[#4F6BFF] shadow-2xl shadow-indigo-500/20 scale-[1.03]"
                    : "bg-white dark:bg-[#111827] border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#4F6BFF] text-white px-4 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wider">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <h3 className={`text-2xl font-bold mb-1 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-xs mb-6 ${plan.popular ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                    {plan.tagline}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.price !== "Custom" && (
                        <span className={`text-xs font-medium ${plan.popular ? "text-slate-300" : "text-slate-400"}`}>
                          / Month
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold mt-2 inline-block px-2.5 py-0.5 rounded-full ${
                      plan.popular ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}>
                      {plan.credits}
                    </span>
                  </div>

                  <ul className="space-y-3.5 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm font-medium">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? "text-emerald-400" : "text-[#4F6BFF]"}`} />
                        <span className={plan.popular ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={plan.name === "Enterprise" ? "/contact" : "/book-demo"} className="w-full">
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full rounded-full py-6 text-sm font-bold transition-all ${
                      plan.popular
                        ? "bg-[#4F6BFF] hover:bg-[#435BE0] text-white shadow-lg shadow-[#4F6BFF]/30"
                        : "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}