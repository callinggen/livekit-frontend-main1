import { Clock, Filter, CalendarPlus, Globe, Link as LinkIcon, BarChart } from "lucide-react";

export default function WhyCallingGenSection() {
  const features = [
    {
      title: "24/7 AI Calling",
      description: "Never miss customer calls. Our agents work around the clock without breaks.",
      icon: <Clock className="w-6 h-6 text-[#4F6BFF]" />
    },
    {
      title: "Lead Qualification",
      description: "Automatically identify quality leads based on your specific criteria during the call.",
      icon: <Filter className="w-6 h-6 text-[#4F6BFF]" />
    },
    {
      title: "Appointment Booking",
      description: "Book meetings seamlessly without any manual effort from your sales team.",
      icon: <CalendarPlus className="w-6 h-6 text-[#4F6BFF]" />
    },
    {
      title: "Multi-language Support",
      description: "Talk naturally to your customers in multiple languages and regional accents.",
      icon: <Globe className="w-6 h-6 text-[#4F6BFF]" />
    },
    {
      title: "CRM Integration",
      description: "Automatically update customer records and log all interactions instantly.",
      icon: <LinkIcon className="w-6 h-6 text-[#4F6BFF]" />
    },
    {
      title: "Analytics & Reports",
      description: "Monitor every call with detailed insights, sentiment analysis, and transcriptions.",
      icon: <BarChart className="w-6 h-6 text-[#4F6BFF]" />
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black" id="why-us">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            Why Businesses Choose CallingGen
          </h2>
          <p className="text-lg text-[#6B7280]">
            The most reliable and intelligent voice AI platform built for modern enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:border-[#4F6BFF]/30 hover:shadow-lg hover:shadow-[#4F6BFF]/5 transition-all duration-300"
            >
              <div className="bg-[#4F6BFF]/10 p-3 rounded-xl shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#111827] mb-2">{feature.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
