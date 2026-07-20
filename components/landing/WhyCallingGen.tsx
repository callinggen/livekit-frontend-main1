"use client";

import { motion } from "framer-motion";
import { Clock, BrainCircuit, Activity, Cloud, Plug, BarChart, Settings, Rocket, Briefcase, ShieldCheck } from "lucide-react";

const REASONS = [
  { icon: Clock, title: "24/7 AI Availability" },
  { icon: BrainCircuit, title: "Human-like Conversations" },
  { icon: Activity, title: "Scalable Infrastructure" },
  { icon: Cloud, title: "Secure Cloud Platform" },
  { icon: Plug, title: "Easy Integrations" },
  { icon: BarChart, title: "Powerful Analytics" },
  { icon: Settings, title: "Custom AI Agents" },
  { icon: Rocket, title: "Fast Deployment" },
  { icon: Briefcase, title: "White Label" },
  { icon: ShieldCheck, title: "Enterprise Ready" },
];

export default function WhyCallingGen() {
  return (
    <section className="py-24 bg-background border-t border-border/50">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Why Choose CallingGen?
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {REASONS.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-accent/20 hover:bg-accent/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <reason.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm">{reason.title}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
