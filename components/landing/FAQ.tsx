"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { question: "What is CallingGen?", answer: "CallingGen is a cloud-based AI platform that creates hyper-realistic voice agents to automate outbound and inbound phone calls for sales, support, and operations." },
  { question: "How does AI calling work?", answer: "Our system combines large language models with advanced text-to-speech technology. You provide a prompt and business data, and the AI holds conversational, dynamic phone calls with users in real-time." },
  { question: "Can it receive inbound calls?", answer: "Yes, you can connect your existing phone numbers or purchase new ones through our platform to use the AI as a 24/7 intelligent receptionist." },
  { question: "Can I customize the AI's voice and personality?", answer: "Absolutely. You can choose from dozens of premium voices across different accents and genders, and define the exact tone and rules the AI should follow." },
  { question: "Does it support multiple languages?", answer: "Yes, our AI agents can speak and understand over 30 languages natively, and can even switch languages mid-conversation if requested by the caller." },
  { question: "Can it integrate with CRM?", answer: "Yes, CallingGen natively integrates with Salesforce, HubSpot, and others, or you can use our API and webhooks to connect with any custom backend." },
  { question: "Is call recording available?", answer: "Yes, all calls are recorded and transcribed in real-time. You can access the audio files and transcripts from your dashboard." },
  { question: "How secure is CallingGen?", answer: "We use enterprise-grade encryption for all data at rest and in transit. Our infrastructure is compliant with major data protection regulations." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-background" id="faq">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-border/50 rounded-2xl bg-accent/10 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-lg hover:bg-accent/20 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                {faq.question}
                <ChevronDown 
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
