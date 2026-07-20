"use client";

import { motion } from "framer-motion";
import { Bot, Zap, Globe, Shield } from "lucide-react";

export default function About() {
  return (
    <section className="py-24 bg-accent/10 relative" id="about">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[500px] rounded-3xl glass-card border border-primary/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Central AI Brain */}
                <div className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(108,76,241,0.3)] border border-primary/30 z-10">
                  <Bot className="w-12 h-12 text-primary" />
                </div>
                {/* Orbiting nodes */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                  className="absolute inset-0 border border-primary/20 rounded-full border-dashed"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                </motion.div>
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  className="absolute -inset-12 border border-primary/10 rounded-full border-dashed"
                >
                  <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <div className="text-primary font-semibold tracking-wider text-sm uppercase">About The Platform</div>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              AI Voice Automation Built For Modern Businesses
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              CallingGen is a state-of-the-art cloud platform that transforms how businesses communicate. We replace manual dialling and rigid phone trees with dynamic, conversational AI that understands context, handles complex queries, and drives real business outcomes.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you need to qualify thousands of leads in minutes or provide 24/7 empathetic customer support, our AI agents adapt to your business rules and speak with your brand's voice.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
