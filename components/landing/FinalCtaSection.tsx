import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCtaSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4F6BFF] to-[#7B61FF] -z-10"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[800px] text-center text-white relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Ready to Automate Your Business Calls?
        </h2>
        <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
          See how CallingGen can help your business answer calls, qualify leads, and automate customer conversations.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/contact">
            <Button size="lg" className="bg-white text-[#4F6BFF] hover:bg-gray-50 rounded-full px-8 py-6 text-base font-bold shadow-lg transition-all hover:-translate-y-1">
              Book Demo
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-bold border-white/30 text-white hover:bg-white/10 hover:text-white transition-all hover:-translate-y-1 bg-transparent">
            Contact Sales
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
