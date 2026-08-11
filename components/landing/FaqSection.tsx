"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "1. What is CallingGen and how does it work for my business?",
      answer:
        "CallingGen is an AI Voice Calling SaaS platform that builds custom AI agents to handle both inbound and outbound business calls. It answers customer calls 24/7 in natural human speech, qualifies leads, schedules appointments directly into your calendar, and logs call data into your CRM.",
    },
    {
      question: "2. Can CallingGen AI agents handle both inbound customer support & outbound sales campaigns?",
      answer:
        "Yes! CallingGen supports both inbound phone reception (answering support queries, booking appointments, routing calls) and high-volume outbound campaigns (contacting ad leads, follow-up calls, policy renewals, and event reminders).",
    },
    {
      question: "3. Does CallingGen integrate with CRMs, WhatsApp, and Google Calendar?",
      answer:
        "CallingGen offers seamless integrations with major CRMs (HubSpot, Salesforce, Zoho), WhatsApp Business (sending automated call confirmations & reminders), Google Calendar, and custom webhooks/APIs to keep your business data in sync.",
    },
    {
      question: "4. Which languages and regional accents does CallingGen AI support?",
      answer:
        "CallingGen supports over 12+ global and regional languages including English (US, UK, IN), Hindi, Telugu, Tamil, Spanish, French, and more with natural human speech accents and ultra-low response latency (<300ms).",
    },
    {
      question: "5. How quickly can I set up and deploy my first CallingGen AI voice agent?",
      answer:
        "You can configure and launch your first AI Voice Agent in under 10 minutes! Simply choose an agent persona, set your business script/goals, connect your calendar or contact list, and launch your campaign.",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 md:py-28 bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors duration-300" id="faqs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[900px]">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#4F6BFF] dark:text-[#818CF8] text-xs sm:text-sm font-semibold tracking-wide mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>GOT QUESTIONS?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-[#4F6BFF] to-[#7B61FF] bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Everything you need to know about deploying AI voice agents for your organization.
          </p>
        </div>

        {/* 5 Clean Accordion Questions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white dark:bg-[#111827] border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "border-[#4F6BFF] shadow-lg shadow-indigo-500/10 dark:border-indigo-500/60"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none gap-4"
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen
                        ? "bg-[#4F6BFF] text-white rotate-180"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
