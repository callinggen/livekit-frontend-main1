"use client";

import Link from "next/link";
import { PhoneCall, Globe, MessageSquare, Share2, Mail } from "lucide-react";

import { useLanguage } from "@/components/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-slate-900 dark:bg-[#070A12] text-white pt-16 pb-8 border-t border-slate-800 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1280px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          
          {/* Brand Column (Col 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-[#4F6BFF] p-2 rounded-xl text-white shadow-md shadow-[#4F6BFF]/20">
                <PhoneCall className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">CallingGen</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {t("footerDesc")}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-700 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-700 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-700 transition-colors">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#4F6BFF] hover:bg-slate-700 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 1: Platform / Product */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Product</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li>
                <Link href="/#features" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Features</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Pricing Plans</Link>
              </li>
              <li>
                <Link href="/book-demo" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Book Demo</Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Dashboard Login</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Solutions</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li>
                <Link href="/#about" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">About Platform</Link>
              </li>
              <li>
                <Link href="/#why-us" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Why CallingGen</Link>
              </li>
              <li>
                <Link href="/#industries" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Industries</Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Contact Team</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Legal */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Resources</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li>
                <Link href="/#faqs" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">FAQs</Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Support Center</Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#" className="text-slate-400 hover:text-[#4F6BFF] transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CallingGen Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Security & Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}