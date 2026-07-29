"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is CallingGen?",
      answer: "CallingGen is an AI Voice Calling Platform that helps businesses automate inbound and outbound calls, qualify leads, and book appointments using advanced conversational AI."
    },
    {
      question: "How does AI voice calling work?",
      answer: "Our AI agents are trained to understand human speech, intent, and context. They can hold natural, two-way conversations with your customers, answer questions based on your knowledge base, and perform actions like booking meetings."
    },
    {
      question: "Can I integrate it with my CRM?",
      answer: "Yes, CallingGen offers seamless integrations with popular CRMs like HubSpot, Salesforce, Zoho, and many more, ensuring all call data and transcripts are automatically synced."
    },
    {
      question: "Does it support multiple languages?",
      answer: "Absolutely. Our AI agents can speak and understand multiple languages and regional accents, allowing you to serve a global or diverse customer base effortlessly."
    },
    {
      question: "Can I use my own phone numbers?",
      answer: "Yes, you can easily port your existing business numbers to CallingGen or purchase new numbers directly through our platform in minutes."
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-[#F8FAFC] dark:bg-[#111827]" id="faqs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[800px]">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-[#6B7280]">
            Everything you need to know about the product and how it works.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'border-[#4F6BFF] shadow-md' : 'border-gray-200'
              }`}
            >
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                onClick={() => toggleAccordion(index)}
              >
                <span className="font-semibold text-lg text-[#111827] pr-8">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-[#6B7280] transition-transform duration-300 shrink-0 ${
                    openIndex === index ? 'rotate-180 text-[#4F6BFF]' : ''
                  }`} 
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-5 pt-0 text-[#6B7280] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
