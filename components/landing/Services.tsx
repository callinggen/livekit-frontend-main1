"use client";

import { motion } from "framer-motion";

const SERVICES = [
  "Sales Calls",
  "Customer Support",
  "Lead Qualification",
  "Appointment Scheduling",
  "Payment Reminders",
  "Property Enquiries",
  "Recruitment Screening",
  "Healthcare Appointments",
  "Education Admissions",
  "Survey Calls",
  "Feedback Collection",
  "Follow-up Campaigns",
];

export default function Services() {
  return (
    <section className="py-24 bg-accent/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            What Can CallingGen Automate?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Our AI voice agents can handle a wide variety of tasks across your entire business.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl border border-border/50 bg-background hover:bg-primary/5 hover:border-primary/30 transition-colors text-center font-medium cursor-default"
            >
              {service}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
