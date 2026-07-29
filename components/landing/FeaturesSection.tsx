import { PhoneOutgoing, PhoneIncoming, CalendarPlus, Database, FileText, LayoutDashboard } from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      title: "AI Outbound Calling",
      description: "Scale your sales with AI agents that automatically dial leads and pitch your product perfectly every time.",
      icon: <PhoneOutgoing className="w-6 h-6 text-[#4F6BFF]" />,
    },
    {
      title: "AI Inbound Receptionist",
      description: "Never miss a customer call again. Our AI answers instantly, 24/7, with human-like conversation.",
      icon: <PhoneIncoming className="w-6 h-6 text-[#7B61FF]" />,
    },
    {
      title: "Appointment Booking",
      description: "AI seamlessly checks your calendar and schedules meetings directly with your customers on the call.",
      icon: <CalendarPlus className="w-6 h-6 text-green-500" />,
    },
    {
      title: "CRM Integration",
      description: "Automatically sync call notes, transcripts, and lead statuses directly into HubSpot, Salesforce, or Zoho.",
      icon: <Database className="w-6 h-6 text-orange-500" />,
    },
    {
      title: "Call Recording & Transcripts",
      description: "Get full audio recordings and text transcripts for every conversation to maintain quality and compliance.",
      icon: <FileText className="w-6 h-6 text-pink-500" />,
    },
    {
      title: "Analytics Dashboard",
      description: "Track performance, success rates, and call volumes in real-time with our intuitive analytics platform.",
      icon: <LayoutDashboard className="w-6 h-6 text-cyan-500" />,
    },
  ];

  return (
    <section className="py-24 bg-[#F8FAFC] dark:bg-[#111827] transition-colors" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            Everything You Need to Automate Business Calls
          </h2>
          <p className="text-lg text-[#6B7280]">
            Powerful features designed to replace manual calling efforts and supercharge your business growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
            >
              <div className="bg-[#F8FAFC] w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#4F6BFF]/5 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-3">{feature.title}</h3>
              <p className="text-[#6B7280] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
