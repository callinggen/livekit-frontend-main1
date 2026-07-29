"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, handle form submission here
    alert("Thank you for your interest! We will contact you soon.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[800px]">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#111827] dark:text-white mb-6">
              Book a Demo
            </h1>
            <p className="text-xl text-[#6B7280] dark:text-gray-300">
              Fill out the form below and our team will get back to you shortly to schedule your personalized demo.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Business Name
                  </label>
                  <input 
                    type="text" 
                    id="businessName" 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    id="phone" 
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Email
                </label>
                <input 
                  type="email" 
                  id="email" 
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description / How can we help you?
                </label>
                <textarea 
                  id="description" 
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4F6BFF] transition-all resize-none"
                  placeholder="Tell us about your use case, call volume, and what you're looking to automate..."
                ></textarea>
              </div>

              <Button type="submit" className="w-full py-6 text-base font-bold bg-[#4F6BFF] hover:bg-[#6a82ff] text-white rounded-xl shadow-lg transition-all hover:-translate-y-1">
                Submit Request
              </Button>
            </form>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}
