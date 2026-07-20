"use client";

import { motion } from "framer-motion";
import { PhoneOff, Clock, Coins, Users, CalendarX, TrendingDown } from "lucide-react";

const PROBLEMS = [
  { icon: Users, title: "Missed Leads", desc: "Every missed call is a potential customer lost to a competitor." },
  { icon: PhoneOff, title: "Manual Calling", desc: "Spending hours dialing numbers instead of closing deals." },
  { icon: Clock, title: "Slow Follow-ups", desc: "Delayed responses reduce conversion rates significantly." },
  { icon: Coins, title: "High Operational Cost", desc: "Hiring large teams for simple calls drains your budget." },
  { icon: CalendarX, title: "Limited Working Hours", desc: "Your business stops when your human team goes home." },
  { icon: TrendingDown, title: "Poor Customer Response", desc: "Inconsistent communication hurts brand reputation." },
];

export default function Problem() {
  return (
    <section className="py-24 bg-background overflow-hidden relative">
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Stop Losing Customers Because Nobody Answered The Phone
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Traditional customer communication is broken. CallingGen solves these challenges with AI voice automation.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-destructive/10 blur-[100px] rounded-full" />
            <div className="relative aspect-square max-w-md mx-auto glass-card rounded-3xl border border-destructive/20 p-8 flex flex-col items-center justify-center gap-6 shadow-2xl">
              <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center text-destructive mb-4 animate-pulse">
                <PhoneOff className="w-12 h-12" />
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold">14 Missed Calls Today</div>
                <div className="text-destructive font-medium">Estimated Loss: $4,200</div>
              </div>
              
              {/* Fake missed call notifications */}
              <div className="w-full space-y-3 mt-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-background/80 p-3 rounded-lg flex items-center gap-3 border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">New Lead (Web Form)</div>
                      <div className="text-xs text-muted-foreground">Called 2 hours ago - No Answer</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Problem Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {PROBLEMS.map((problem, i) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-accent/30 border border-border/50 hover:bg-accent/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                  <problem.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold mb-2">{problem.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{problem.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
