import { Star } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Founder",
      company: "Sharma Realty",
      content: "We reduced our missed calls and increased property visits using CallingGen.",
      initials: "RS",
      color: "bg-blue-100 text-blue-600"
    },
    {
      name: "Priya Reddy",
      role: "Director",
      company: "Bright Tax Consultants",
      content: "Our follow-ups are now completely automated and clients receive instant responses.",
      initials: "PR",
      color: "bg-purple-100 text-purple-600"
    },
    {
      name: "Amit Patel",
      role: "CEO",
      company: "Digital Reach Agency",
      content: "CallingGen helped us qualify leads faster and improve our team's productivity.",
      initials: "AP",
      color: "bg-emerald-100 text-emerald-600"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black transition-colors" id="testimonials">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-6">
            What Our Customers Say
          </h2>
          <p className="text-lg text-[#6B7280]">
            Join thousands of businesses that trust CallingGen to handle their customer conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-lg text-[#111827] font-medium leading-relaxed mb-8">
                &quot;{testimonial.content}&quot;
              </p>
              
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${testimonial.color}`}>
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-bold text-[#111827]">{testimonial.name}</h4>
                  <p className="text-sm text-[#6B7280]">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
