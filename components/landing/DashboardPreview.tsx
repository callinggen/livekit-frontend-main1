"use client";

import { motion } from "framer-motion";
import { Users, PhoneCall, CheckCircle2, AlertCircle } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider text-sm uppercase mb-4"
          >
            Analytics & Insights
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Monitor Performance In Real-Time
          </motion.h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full max-w-5xl mx-auto rounded-3xl glass-card border border-border shadow-2xl overflow-hidden"
        >
          {/* Dashboard Header */}
          <div className="bg-background/80 border-b border-border p-4 flex justify-between items-center">
            <div className="flex gap-4">
              <div className="font-bold text-lg">Overview</div>
              <div className="text-muted-foreground hidden sm:block">Campaigns</div>
              <div className="text-muted-foreground hidden sm:block">Agents</div>
            </div>
            <div className="bg-accent px-4 py-1.5 rounded-full text-sm font-medium">
              Last 30 Days
            </div>
          </div>

          <div className="p-8 bg-accent/10">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Calls", value: "24,592", up: true },
                { label: "Connected", value: "18,204", up: true },
                { label: "Converted Leads", value: "3,145", up: true },
                { label: "Failed/Voicemail", value: "6,388", up: false },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-background border border-border/50">
                  <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className={`text-xs mt-2 ${stat.up ? "text-green-500" : "text-destructive"}`}>
                    {stat.up ? "↑ +12.5%" : "↓ -2.4%"} from last month
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Main Chart Area */}
              <div className="md:col-span-2 bg-background rounded-xl border border-border/50 p-6">
                <div className="font-bold mb-6">Call Volume vs Conversion</div>
                <div className="h-48 flex items-end justify-between gap-2">
                  {[40, 60, 45, 80, 55, 90, 75, 100, 85, 95].map((h, i) => (
                    <div key={i} className="w-full relative group cursor-pointer">
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="bg-primary/20 rounded-t-sm w-full absolute bottom-0 group-hover:bg-primary/40 transition-colors"
                      />
                      <motion.div 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h * 0.3}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="bg-primary rounded-t-sm w-full absolute bottom-0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-background rounded-xl border border-border/50 p-6">
                <div className="font-bold mb-6">Recent Activity</div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Meeting Scheduled</div>
                      <div className="text-xs text-muted-foreground">with Sarah Jenkins (TechFlow)</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <PhoneCall className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Inbound Support Resolved</div>
                      <div className="text-xs text-muted-foreground">Billing inquiry handled via AI</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Voicemail Left</div>
                      <div className="text-xs text-muted-foreground">Follow-up campaign #4</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Users className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">Lead Qualified: Hot</div>
                      <div className="text-xs text-muted-foreground">Transferred to Sales Team</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
