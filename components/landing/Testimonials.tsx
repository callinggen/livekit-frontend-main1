"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins",
    role: "VP of Sales, TechFlow",
    content: "CallingGen completely transformed our outbound strategy. We went from 5 reps dialing all day to an AI agent qualifying leads instantly. Our human reps now only talk to people ready to buy.",
  },
  {
    name: "David Chen",
    role: "Customer Success Director, Nexus",
    content: "Our inbound call wait times dropped from 15 minutes to zero. The AI handles all the basic tier-1 queries perfectly, and our CS team is much happier focusing on complex issues.",
  },
  {
    name: "Emily Rodriguez",
    role: "Operations Manager, Global Care",
    content: "Scheduling appointments used to be a nightmare of phone tag. CallingGen's AI calls patients, finds a slot that works, and updates our calendar natively. It's magic.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-accent/10">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Loved By Industry Leaders
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-background border border-border shadow-sm flex flex-col justify-between relative"
            >
              <div className="text-primary text-6xl absolute top-4 right-6 opacity-10 font-serif">"</div>
              <div>
                <div className="flex gap-1 mb-6 text-yellow-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-lg text-foreground mb-8 leading-relaxed">
                  "{t.content}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center font-bold text-muted-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
