import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] dark:bg-black transition-colors">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] dark:text-white mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-[#6B7280] dark:text-gray-300">
              Choose the perfect plan for your business. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-[#111827] dark:border-gray-800 rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col mt-4 md:mt-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#111827] dark:text-white mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#111827] dark:text-white">₹XXXX</span>
                  <span className="text-[#6B7280] dark:text-gray-400">/ Month</span>
                </div>
                <p className="text-[#6B7280] text-sm mt-2">500 Credits Included</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">AI Voice Calling</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">1 AI Agent</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Call Reports</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Email Support</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full rounded-full py-6 text-base font-bold text-[#111827] border-gray-300 hover:bg-gray-50">
                Get Started
              </Button>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="bg-[#4F6BFF] rounded-3xl p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                Most Popular
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">₹XXXX</span>
                  <span className="text-white/80">/ Month</span>
                </div>
                <p className="text-white/80 text-sm mt-2">2000 Credits Included</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>WhatsApp Integration</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>CRM Integration</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>Multi-language Support</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  <span>Advanced Reports</span>
                </li>
              </ul>
              
              <Button className="w-full rounded-full py-6 text-base font-bold bg-white text-[#4F6BFF] hover:bg-gray-100 shadow-lg">
                Get Started Now
              </Button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-[#111827] dark:border-gray-800 rounded-3xl p-8 border border-gray-200 shadow-sm flex flex-col mt-4 md:mt-8">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#111827] dark:text-white mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#111827] dark:text-white">Custom</span>
                </div>
                <p className="text-[#6B7280] text-sm mt-2">Unlimited Credits</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Unlimited AI Agents</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">White Label</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">API Access</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Custom Integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Priority Support</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4F6BFF] shrink-0" />
                  <span className="text-[#6B7280]">Dedicated Account Manager</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full rounded-full py-6 text-base font-bold text-[#111827] border-gray-300 hover:bg-gray-50">
                Contact Sales
              </Button>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}