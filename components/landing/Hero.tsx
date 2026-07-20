"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Sparkles, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] opacity-50" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary w-fit border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">🚀 AI Voice Calling Platform for Modern Businesses</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
              AI Voice Agents That <br className="hidden md:block" />
              <span className="gradient-text">Call, Talk, Follow Up</span> & Convert Automatically
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              CallingGen enables businesses to automate outbound calls, inbound customer support, lead qualification, appointment booking, multilingual conversations, and follow-up campaigns using human-like AI voice agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="#demo">
                <Button size="lg" className="h-14 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg w-full sm:w-auto glow-primary">
                  Book Free Demo <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg w-full sm:w-auto border-border bg-background/50 backdrop-blur hover:bg-accent">
                  <Play className="mr-2 w-5 h-5" /> See in Action
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
              {["Human-like AI", "Multi-language", "CRM Integration", "Secure Platform", "24/7 Availability"].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:h-[600px] flex items-center justify-center"
          >
            {/* Main Dashboard Card */}
            <div className="relative z-10 w-full max-w-[550px] aspect-[4/3] rounded-2xl glass-card border border-border/50 shadow-2xl overflow-hidden flex flex-col">
              {/* Fake Window Header */}
              <div className="h-12 border-b border-border/50 bg-background/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto text-xs font-medium text-muted-foreground bg-accent/50 px-3 py-1 rounded-md">
                  callinggen.ai/dashboard
                </div>
              </div>
              
              {/* Dashboard Content Mock */}
              <div className="flex-1 p-6 bg-gradient-to-br from-background/80 to-background/40 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold">Active Campaign</h3>
                    <p className="text-sm text-muted-foreground">Lead Qualification (Q3)</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">84%</div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
                
                {/* Chart Mockup */}
                <div className="h-32 rounded-xl bg-accent/30 border border-border/50 flex items-end px-4 gap-2 pt-8">
                  {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="flex-1 bg-primary/80 rounded-t-sm"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Live Calls</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      12 <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Today's Calls</div>
                    <div className="text-2xl font-bold">1,248</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Element 1 */}
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -right-8 top-20 z-20 p-4 rounded-2xl glass-card shadow-xl border border-border/50 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold">Agent Connected</div>
                <div className="text-xs text-muted-foreground">Speaking with John Doe</div>
              </div>
            </motion.div>

            {/* Floating Element 2 */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute -left-12 bottom-32 z-20 p-4 rounded-2xl glass-card shadow-xl border border-border/50 flex items-center gap-4"
            >
              <div className="text-3xl">🇺🇸</div>
              <div>
                <div className="text-sm font-bold">Multi-lingual</div>
                <div className="text-xs text-muted-foreground">English & Spanish Active</div>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}