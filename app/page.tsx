import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import AboutSection from "@/components/landing/AboutSection";
import WhyCallingGenSection from "@/components/landing/WhyCallingGenSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import IndustriesSection from "@/components/landing/IndustriesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/landing/Footer";
import GetCallModal from "@/components/landing/GetCallModal";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#090D16] transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <AboutSection />
        <WhyCallingGenSection />
        <FeaturesSection />
        <IndustriesSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <GetCallModal />
    </div>
  );
}