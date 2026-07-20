"use client";

import { motion } from "framer-motion";
import { Bot, FileDown, Phone, Rocket, MessagesSquare, LineChart } from "lucide-react";

const STEPS = [
  { icon: Bot, title: "Create AI Agent", desc: "Select a voice and define the agent's persona and goals." },
  { icon: FileDown, title: "Train With Data", desc: "Upload your business knowledge base and FAQs." },
  { icon: Phone, title: "Connect Number", desc: "Link your existing phone number or buy a new one." },
  { icon: Rocket, title: "Launch Campaign", desc: "Set your target audience and hit launch." },
  { icon: MessagesSquare, title: "AI Talks With Customers", desc: "Agent holds human-like conversations automatically." },
  { icon: LineChart, title: "Analytics & Reports", desc: "Review transcripts, recordings, and success metrics." },
];

export default function Workflow() {
  return (
    <section className="py-24 bg-background overflow-hidden relative" id="workflow">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider text-sm uppercase mb-4"
          >
            How It Works
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Set Up In Minutes, Automate Forever
          </motion.h2>
        </div>

        <div className="relative">
          {/* Horizontal Line connecting steps (Desktop only) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-6 gap-8 relative z-10">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center text-primary mb-6 group-hover:-translate-y-2 transition-transform duration-300 relative z-10">
                  <step.icon className="w-8 h-8" />
                  <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                
                {/* Mobile connecting line */}
                {i < STEPS.length - 1 && (
                  <div className="lg:hidden h-8 w-0.5 bg-border my-4" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
