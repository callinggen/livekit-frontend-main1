"use client";

import { motion } from "framer-motion";
import { Home, GraduationCap, Stethoscope, Users, Building2, ShoppingCart, Car, Hotel, Headset } from "lucide-react";

const INDUSTRIES = [
  { icon: Home, title: "Real Estate", desc: "Qualify buyers, schedule viewings, and follow up with leads.", uses: "Lead Qualification • Viewing Appointments" },
  { icon: GraduationCap, title: "Education", desc: "Handle admission inquiries and schedule campus tours.", uses: "Admissions • Student Support" },
  { icon: Stethoscope, title: "Healthcare", desc: "Automate appointment bookings and patient reminders.", uses: "Bookings • Payment Reminders" },
  { icon: Users, title: "Recruitment", desc: "Pre-screen candidates and schedule interviews automatically.", uses: "Screening • Interview Scheduling" },
  { icon: Building2, title: "Finance", desc: "Collect payments, verify documents, and offer support.", uses: "Collections • Verification" },
  { icon: ShoppingCart, title: "Retail", desc: "Handle order tracking, returns, and customer queries.", uses: "Order Updates • Support" },
  { icon: Car, title: "Automotive", desc: "Schedule test drives and service appointments.", uses: "Test Drives • Servicing" },
  { icon: Hotel, title: "Hospitality", desc: "Manage room bookings and answer guest FAQs 24/7.", uses: "Bookings • Concierge" },
  { icon: Headset, title: "BPO & Contact Centers", desc: "Scale your call center operations with AI agents.", uses: "Tier 1 Support • Overflow Handling" },
];

export default function Industries() {
  return (
    <section className="py-24 bg-accent/5" id="industries">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider text-sm uppercase mb-4"
          >
            Built For Your Industry
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            AI Agents For Every Business
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INDUSTRIES.map((industry, i) => (
            <motion.div
              key={industry.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl glass-card border border-border/50 hover:-translate-y-1 transition-all duration-300"
            >
              <industry.icon className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-xl font-bold mb-3">{industry.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {industry.desc}
              </p>
              <div className="text-sm font-medium text-foreground bg-accent px-4 py-2 rounded-lg inline-block">
                {industry.uses}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}