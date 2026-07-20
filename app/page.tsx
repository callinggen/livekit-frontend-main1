import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Trust from "@/components/landing/Trust";
import Problem from "@/components/landing/Problem";
import About from "@/components/landing/About";
import Features from "@/components/landing/Features";
import Services from "@/components/landing/Services";
import Workflow from "@/components/landing/Workflow";
import Industries from "@/components/landing/Industries";
import WhyCallingGen from "@/components/landing/WhyCallingGen";
import Integrations from "@/components/landing/Integrations";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Trust />
        <Problem />
        <About />
        <Features />
        <Services />
        <Workflow />
        <Industries />
        <WhyCallingGen />
        <Integrations />
        <DashboardPreview />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}