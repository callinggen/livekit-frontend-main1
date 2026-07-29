"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Phone, Mic, Calendar, BarChart3, UserCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#F8FAFC] dark:bg-black transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4F6BFF]/10 text-[#4F6BFF] font-medium text-sm mb-6 border border-[#4F6BFF]/20">
              <span className="flex h-2 w-2 rounded-full bg-[#4F6BFF] animate-pulse"></span>
              AI Voice Calling Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] dark:text-white leading-tight mb-6">
              AI Voice Agents That Handle Your Business Calls <span className="text-[#4F6BFF]">Automatically</span>
            </h1>
            
            <p className="text-lg text-[#6B7280] mb-8 max-w-xl leading-relaxed">
              CallingGen helps businesses automate inbound and outbound calls, qualify leads, book appointments, answer customer queries, and save valuable time using AI voice agents.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
              <Link href="/contact">
                <Button size="lg" className="bg-[#4F6BFF] hover:bg-[#6a82ff] text-white rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-[#4F6BFF]/25 transition-all hover:-translate-y-1">
                  Book Demo
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-medium border-gray-200 text-[#111827] hover:bg-gray-50 transition-all hover:-translate-y-1">
                See How It Works
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm font-medium text-[#6B7280]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F6BFF]" />
                <span>24/7 AI Calling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F6BFF]" />
                <span>Multi-language Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F6BFF]" />
                <span>CRM Integration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4F6BFF]" />
                <span>WhatsApp Integration</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Dashboard Mockup */}
          <div className="w-full lg:w-1/2 relative mt-10 lg:mt-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#4F6BFF]/20 to-[#7B61FF]/20 blur-3xl rounded-full opacity-60 -z-10"></div>
            
            {/* Dashboard Container */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
              {/* Header */}
              <div className="border-b border-gray-100 p-4 flex items-center justify-between bg-gray-50/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Dashboard</div>
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4">
                {/* Active Call Card */}
                <div className="col-span-2 bg-gradient-to-br from-[#4F6BFF] to-[#7B61FF] rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <div className="text-white/80 text-sm font-medium mb-1 flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                        </span>
                        Live Call with Client
                      </div>
                      <div className="text-xl font-bold">John Doe (+1 234 567 8900)</div>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Mic className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-3 text-sm border border-white/20 relative z-10">
                    <p className="text-white/90">&quot;Hi John, this is CallingGen. I saw you were looking at our pricing page. Can I help answer any questions?&quot;</p>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Lead Qualified</div>
                  </div>
                  <div className="text-2xl font-bold text-[#111827] mb-1">84%</div>
                  <div className="text-xs text-green-600 font-medium">+12% from last week</div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-sm text-gray-500 font-medium">Appointments</div>
                  </div>
                  <div className="text-2xl font-bold text-[#111827] mb-1">24</div>
                  <div className="text-xs text-blue-600 font-medium">Today</div>
                </div>
                
                {/* Graph mockup */}
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600 font-medium">Call Analytics</div>
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
                      <div key={i} className="flex-1 bg-[#4F6BFF]/20 rounded-t-md hover:bg-[#4F6BFF] transition-colors cursor-pointer" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>
                </div>
                
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -left-4 md:-left-8 top-1/4 bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Inbound Call</div>
                  <div className="text-sm font-bold text-[#111827]">Answered by AI</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}