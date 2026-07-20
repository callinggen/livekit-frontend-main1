"use client";

import { motion } from "framer-motion";
import { PhoneOutgoing, PhoneIncoming, CalendarCheck, Target, Network, Mic, FileText, BarChart3, Languages, Settings2, Code2, Briefcase } from "lucide-react";

const FEATURES = [
  { icon: PhoneOutgoing, title: "AI Outbound Calling", desc: "Automate cold outreach, follow-ups, and payment reminders at scale." },
  { icon: PhoneIncoming, title: "AI Inbound Receptionist", desc: "Handle customer queries 24/7 without making them wait on hold." },
  { icon: CalendarCheck, title: "Appointment Booking", desc: "AI natively integrates with your calendar to schedule meetings." },
  { icon: Target, title: "Lead Qualification", desc: "Ask the right questions to qualify prospects before transferring to humans." },
  { icon: Network, title: "CRM Integration", desc: "Automatically sync calls, transcripts, and lead statuses to your CRM." },
  { icon: Mic, title: "Call Recording", desc: "Every conversation is securely recorded for quality assurance." },
  { icon: FileText, title: "Transcriptions", desc: "Get real-time, accurate transcripts of every AI conversation." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track success rates, call volumes, and agent performance." },
  { icon: Languages, title: "Multi-language Support", desc: "Speak to customers globally in their native language natively." },
  { icon: Settings2, title: "Workflow Automation", desc: "Trigger actions based on call outcomes (e.g., send SMS/Email)." },
  { icon: Code2, title: "API Integration", desc: "Build custom experiences with our robust developer APIs." },
  { icon: Briefcase, title: "White Label Support", desc: "Brand the platform as your own for your enterprise clients." },
];

export default function Features() {
  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider text-sm uppercase mb-4"
          >
            Platform Features
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Everything You Need To Automate Conversations
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-6 rounded-2xl bg-accent/20 border border-border/50 hover:border-primary/30 hover:bg-accent/40 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full group-hover:bg-primary/20 transition-colors" />
              <div className="w-12 h-12 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3 relative z-10">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}