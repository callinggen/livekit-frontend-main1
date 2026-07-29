import { Building2, Calculator, ShieldCheck, GraduationCap, Megaphone, Stethoscope } from "lucide-react";

export default function IndustriesSection() {
  const industries = [
    {
      name: "Real Estate",
      description: "Automatically qualify property buyers and schedule site visits.",
      icon: <Building2 className="w-8 h-8 text-[#4F6BFF]" />,
      color: "bg-[#4F6BFF]/10",
    },
    {
      name: "Tax Companies",
      description: "Follow up with clients for documents and schedule consultations.",
      icon: <Calculator className="w-8 h-8 text-emerald-500" />,
      color: "bg-emerald-500/10",
    },
    {
      name: "Insurance",
      description: "Qualify policy leads and renew expiring customer policies via voice.",
      icon: <ShieldCheck className="w-8 h-8 text-[#7B61FF]" />,
      color: "bg-[#7B61FF]/10",
    },
    {
      name: "Education",
      description: "Answer admission queries and confirm student enrollment details.",
      icon: <GraduationCap className="w-8 h-8 text-amber-500" />,
      color: "bg-amber-500/10",
    },
    {
      name: "Digital Marketing",
      description: "Instantly contact fresh leads generated from ad campaigns.",
      icon: <Megaphone className="w-8 h-8 text-pink-500" />,
      color: "bg-pink-500/10",
    },
    {
      name: "Healthcare",
      description: "Automate patient appointment booking and send friendly reminders.",
      icon: <Stethoscope className="w-8 h-8 text-cyan-500" />,
      color: "bg-cyan-500/10",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black" id="industries">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            Built for Every Business
          </h2>
          <p className="text-lg text-[#6B7280]">
            Whatever your industry, CallingGen adapts to your specific needs to automate conversations and drive results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <div 
              key={index} 
              className="group flex flex-col items-center text-center p-8 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:bg-white hover:shadow-xl hover:border-gray-200 transition-all duration-300"
            >
              <div className={`${industry.color} w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {industry.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">{industry.name}</h3>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                {industry.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
