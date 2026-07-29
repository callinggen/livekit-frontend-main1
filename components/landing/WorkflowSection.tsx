import { PlusCircle, UploadCloud, Rocket, Bot, PieChart } from "lucide-react";

export default function WorkflowSection() {
  const steps = [
    {
      title: "Create Campaign",
      icon: <PlusCircle className="w-6 h-6 text-[#111827]" />,
      number: "1",
    },
    {
      title: "Upload Contacts",
      icon: <UploadCloud className="w-6 h-6 text-[#111827]" />,
      number: "2",
    },
    {
      title: "Launch Campaign",
      icon: <Rocket className="w-6 h-6 text-[#111827]" />,
      number: "3",
    },
    {
      title: "AI Calls Customers",
      icon: <Bot className="w-6 h-6 text-[#111827]" />,
      number: "4",
    },
    {
      title: "Track Reports",
      icon: <PieChart className="w-6 h-6 text-[#111827]" />,
      number: "5",
    },
  ];

  return (
    <section className="py-24 bg-[#F8FAFC] dark:bg-[#111827]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            Launch Your AI Campaign in Minutes
          </h2>
          <p className="text-lg text-[#6B7280]">
            Get started instantly. No coding or complex setups required.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line for Desktop */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4 relative">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  {/* Circle */}
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 group-hover:border-[#4F6BFF] group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                    {step.icon}
                  </div>
                  {/* Number Badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#4F6BFF] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[#111827]">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
