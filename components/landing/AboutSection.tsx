import { Bot, LineChart, CalendarCheck, Settings2 } from "lucide-react";

export default function AboutSection() {
  const highlights = [
    { icon: <Bot className="w-5 h-5 text-[#4F6BFF]" />, text: "AI Voice Calls" },
    { icon: <LineChart className="w-5 h-5 text-[#4F6BFF]" />, text: "Lead Qualification" },
    { icon: <CalendarCheck className="w-5 h-5 text-[#4F6BFF]" />, text: "Appointment Booking" },
    { icon: <Settings2 className="w-5 h-5 text-[#4F6BFF]" />, text: "Business Automation" },
  ];

  return (
    <section className="py-24 bg-white dark:bg-black" id="about">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left - Illustration */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md aspect-square">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-[#F8FAFC] rounded-full border border-gray-100 shadow-sm"></div>
              <div className="absolute inset-4 bg-gradient-to-tr from-[#4F6BFF]/5 to-[#7B61FF]/5 rounded-full border border-[#4F6BFF]/10"></div>
              
              {/* Central Element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-[#F8FAFC] z-20">
                <div className="w-20 h-20 bg-gradient-to-br from-[#4F6BFF] to-[#7B61FF] rounded-full flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white" />
                </div>
              </div>
              
              {/* Orbiting Elements */}
              <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-lg border border-gray-100 rotate-[0deg]">
                  <LineChart className="w-6 h-6 text-[#7B61FF]" />
                </div>
              </div>
              <div className="absolute inset-0 animate-[spin_25s_linear_infinite_reverse]">
                <div className="absolute top-1/2 -right-4 -translate-y-1/2 bg-white p-3 rounded-xl shadow-lg border border-gray-100 rotate-[0deg]">
                  <CalendarCheck className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <div className="absolute inset-0 animate-[spin_15s_linear_infinite]">
                <div className="absolute bottom-4 left-8 bg-white p-3 rounded-xl shadow-lg border border-gray-100 rotate-[0deg]">
                  <Settings2 className="w-6 h-6 text-[#4F6BFF]" />
                </div>
              </div>

              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full text-[#4F6BFF]/20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>

          {/* Right - Content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">About CallingGen</h2>
            
            <p className="text-lg text-[#6B7280] leading-relaxed mb-8">
              CallingGen is an AI Voice Calling Platform that helps businesses automate customer conversations. From answering incoming calls to making outbound sales calls, qualifying leads, booking appointments, and following up with customers, CallingGen works 24/7 so your team can focus on growing the business.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-[#F8FAFC] hover:shadow-md transition-shadow">
                  <div className="bg-white p-2.5 rounded-lg shadow-sm">
                    {item.icon}
                  </div>
                  <span className="font-semibold text-[#111827]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
