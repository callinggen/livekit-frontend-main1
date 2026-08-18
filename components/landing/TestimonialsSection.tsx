"use client";

import { Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const testimonials = [
    {
      name: t("t1Name"),
      role: t("t1Role"),
      company: t("t1Company"),
      content: t("t1Content"),
      initials: "RS",
      color: "bg-blue-100 text-blue-600"
    },
    {
      name: t("t2Name"),
      role: t("t2Role"),
      company: t("t2Company"),
      content: t("t2Content"),
      initials: "PR",
      color: "bg-purple-100 text-purple-600"
    },
    {
      name: t("t3Name"),
      role: t("t3Role"),
      company: t("t3Company"),
      content: t("t3Content"),
      initials: "AP",
      color: "bg-emerald-100 text-emerald-600"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black transition-colors" id="testimonials">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] dark:text-white mb-6">
            {t("testiTitle")}
          </h2>
          <p className="text-lg text-[#6B7280] dark:text-slate-400">
            {t("testiSubtitle")}
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
