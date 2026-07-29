import Link from "next/link";
import { PhoneCall, Globe, Video, Code } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black pt-20 pb-8 border-t border-gray-100 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="bg-[#4F6BFF] p-2 rounded-lg">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#111827]">CallingGen</span>
            </Link>
            <p className="text-[#6B7280] mb-6 max-w-sm">
              The AI Voice Calling Platform that helps businesses automate inbound and outbound calls, qualify leads, and book appointments.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#6B7280] hover:text-[#4F6BFF] hover:bg-[#4F6BFF]/10 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#6B7280] hover:text-[#4F6BFF] hover:bg-[#4F6BFF]/10 transition-colors">
                <Video className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#6B7280] hover:text-[#4F6BFF] hover:bg-[#4F6BFF]/10 transition-colors">
                <Code className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-[#111827] mb-6">Product</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#features" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Features</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Pricing</Link>
              </li>
              <li>
                <Link href="/login" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Dashboard</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#111827] mb-6">Company</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#about" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">About</Link>
              </li>
              <li>
                <Link href="#contact" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Contact</Link>
              </li>
              <li>
                <Link href="#" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Careers</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#111827] mb-6">Resources</h4>
            <ul className="space-y-4">
              <li>
                <Link href="#faqs" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">FAQs</Link>
              </li>
              <li>
                <Link href="#" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Documentation</Link>
              </li>
              <li>
                <Link href="#" className="text-[#6B7280] hover:text-[#4F6BFF] transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#6B7280] text-sm">
            Copyright © CallingGen. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}