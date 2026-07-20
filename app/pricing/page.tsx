"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Demo",
    price: "XXXX",
    desc: "Perfect for exploring the platform capabilities.",
    popular: false,
    features: ["1 Active AI Agent", "100 AI Call Minutes", "Standard Voices", "Basic Analytics", "Email Support"],
    cta: "Start Free",
    variant: "outline"
  },
  {
    name: "Starter",
    price: "XXXX",
    desc: "For small teams ready to automate.",
    popular: false,
    features: ["3 Active AI Agents", "1,000 AI Call Minutes", "Premium Voices", "Advanced Analytics", "CRM Integration", "Priority Support"],
    cta: "Get Started",
    variant: "outline"
  },
  {
    name: "Professional",
    price: "XXXX",
    desc: "For growing businesses needing volume.",
    popular: true,
    features: ["10 Active AI Agents", "5,000 AI Call Minutes", "Voice Cloning", "Custom Workflows", "API Access", "Dedicated Success Manager"],
    cta: "Upgrade to Pro",
    variant: "default"
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For large scale operations and agencies.",
    popular: false,
    features: ["Unlimited AI Agents", "Custom Volume", "White Labeling", "Custom Integration", "SLA Guarantee", "24/7 Phone Support"],
    cta: "Contact Sales",
    variant: "outline"
  }
];

const FEATURES_COMPARE = [
  { name: "Active AI Agents", demo: "1", starter: "3", pro: "10", enterprise: "Unlimited" },
  { name: "Monthly Call Minutes", demo: "100", starter: "1,000", pro: "5,000", enterprise: "Custom" },
  { name: "Voice Quality", demo: "Standard", starter: "Premium", pro: "Clone", enterprise: "Clone+" },
  { name: "CRM Integrations", demo: false, starter: true, pro: true, enterprise: true },
  { name: "API & Webhooks", demo: false, starter: false, pro: true, enterprise: true },
  { name: "White Labeling", demo: false, starter: false, pro: false, enterprise: true },
  { name: "Support SLA", demo: "Email", starter: "Priority", pro: "Dedicated", enterprise: "24/7 Phone" },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        {/* Header */}
        <section className="container mx-auto px-6 max-w-7xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-primary font-semibold tracking-wider text-sm uppercase mb-4"
          >
            Pricing
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Simple Pricing That Grows With Your Business
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Flexible plans designed for businesses of every size. Start automating your calls today.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex justify-center items-center gap-3"
          >
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
            <button 
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-7 rounded-full bg-accent relative flex items-center px-1 transition-colors hover:bg-border"
            >
              <div className={`w-5 h-5 rounded-full bg-primary shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm flex items-center gap-2 ${billingCycle === 'yearly' ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
              Yearly <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
            </span>
          </motion.div>
        </section>

        {/* Pricing Cards */}
        <section className="container mx-auto px-6 max-w-7xl mb-32">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`relative p-8 rounded-3xl border flex flex-col ${plan.popular ? 'border-primary shadow-xl scale-105 bg-background z-10' : 'border-border/50 bg-accent/10 hover:bg-accent/20'} transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6 h-10">{plan.desc}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
                </div>
                
                <Button 
                  className={`w-full mb-8 rounded-full ${plan.popular ? 'bg-primary text-primary-foreground glow-primary' : 'bg-accent hover:bg-border text-foreground'}`}
                  variant={plan.variant as any}
                  size="lg"
                >
                  {plan.cta}
                </Button>
                
                <div className="space-y-4 flex-grow">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="container mx-auto px-6 max-w-5xl mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Compare Features</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b border-border font-bold w-1/3">Features</th>
                  <th className="p-4 border-b border-border font-bold text-center">Demo</th>
                  <th className="p-4 border-b border-border font-bold text-center">Starter</th>
                  <th className="p-4 border-b border-border font-bold text-center text-primary">Pro</th>
                  <th className="p-4 border-b border-border font-bold text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_COMPARE.map((feature, i) => (
                  <tr key={feature.name} className={i % 2 === 0 ? "bg-accent/5" : ""}>
                    <td className="p-4 border-b border-border/50 font-medium">{feature.name}</td>
                    {[feature.demo, feature.starter, feature.pro, feature.enterprise].map((val, idx) => (
                      <td key={idx} className="p-4 border-b border-border/50 text-center">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        ) : (
                          <span className="text-sm">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-6 max-w-4xl text-center">
          <div className="p-12 rounded-3xl bg-primary/10 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <h2 className="text-3xl font-bold mb-4 relative z-10">Need a custom solution?</h2>
            <p className="text-lg text-muted-foreground mb-8 relative z-10 max-w-2xl mx-auto">
              Contact our sales team to build a tailored plan that perfectly fits your organization's unique requirements.
            </p>
            <div className="flex justify-center gap-4 relative z-10">
              <Button size="lg" className="rounded-full h-14 px-8 bg-primary text-primary-foreground">
                Contact Sales <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-14 px-8 bg-background">
                Book Demo
              </Button>
            </div>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}