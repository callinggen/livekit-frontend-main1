"use client";

import { motion } from "framer-motion";
import { Database, Calendar, MessageSquare, Phone, Plug, Globe, Box, Hash } from "lucide-react";

const INTEGRATIONS = [
  { name: "Salesforce CRM", icon: Database },
  { name: "HubSpot", icon: Box },
  { name: "WhatsApp", icon: MessageSquare },
  { name: "Google Calendar", icon: Calendar },
  { name: "Twilio", icon: Phone },
  { name: "REST API", icon: Globe },
  { name: "Webhooks", icon: Plug },
  { name: "Slack", icon: Hash },
];

export default function Integrations() {
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
            Connects With Your Existing Tools
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Seamlessly integrate CallingGen into your current workflow. No complex setup required.
          </motion.p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {INTEGRATIONS.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 px-6 py-4 rounded-full bg-background border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-default"
            >
              <integration.icon className="w-6 h-6 text-primary" />
              <span className="font-semibold">{integration.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
