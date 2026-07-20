"use client";

import { motion } from "framer-motion";

const COMPANIES = [
  "Acme Corp",
  "Global Industries",
  "TechFlow",
  "Nexus Solutions",
  "Pioneer Systems",
];

export default function Trust() {
  return (
    <section className="py-12 border-b border-border/50 bg-accent/20">
      <div className="container mx-auto px-6 max-w-7xl">
        <p className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wider">
          Trusted by Growing Businesses
        </p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale">
          {COMPANIES.map((company, i) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-xl md:text-2xl font-bold font-serif text-foreground/80 tracking-tight"
            >
              {company}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
