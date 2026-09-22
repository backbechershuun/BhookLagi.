import { useEffect, useState } from "react";
import api from "../api/axios.js";

const TrustStrip = () => {
  const stats = [
    { value: "10,000+", label: "Tables booked" },
    { value: "500+", label: "Restaurants partnered" },
    { value: "25+", label: "Cities covered" },
    { value: "4.8/5", label: "Average rating" },
  ];

  const testimonials = [
    {
      quote:
        "Booking used to mean ten minutes on hold. Now I pick my exact table in seconds and I'm done.",
      name: "Ananya Sharma",
      role: "Regular diner, Bengaluru",
    },
    {
      quote:
        "Our no-show rate dropped noticeably once guests could see and choose their table before arriving.",
      name: "Rohit Verma",
      role: "Owner, The Copper Kettle",
    },
    {
      quote:
        "It feels like the app already knows what I want. Fast, clean, no back and forth calls.",
      name: "Priya Iyer",
      role: "Regular diner, Hazaribagh",
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      {/* Heading */}
      <div className="text-center mb-16">
        <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
          Testimonials
        </span>
        <h2 className="font-display text-3xl md:text-5xl text-neutral-900 mt-3">
          Loved by diners and owners alike
        </h2>
        <p className="text-neutral-500 mt-4 max-w-md mx-auto">
          Real stories from people who book and run tables with us every day.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-3xl md:text-4xl text-neutral-900">
              {s.value}
            </p>
            <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Testimonial cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col hover:border-orange-200 hover:shadow-lg hover:shadow-neutral-200/50 transition-all duration-300"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-orange-200 mb-4"
            >
              <path d="M7.17 6C4.87 8.3 3.5 11.2 3.5 14.3c0 2.9 1.7 4.7 3.9 4.7 2 0 3.5-1.6 3.5-3.5 0-1.8-1.3-3.3-3-3.5.4-1.8 1.6-3.5 3.3-4.7L7.17 6zm9 0C13.87 8.3 12.5 11.2 12.5 14.3c0 2.9 1.7 4.7 3.9 4.7 2 0 3.5-1.6 3.5-3.5 0-1.8-1.3-3.3-3-3.5.4-1.8 1.6-3.5 3.3-4.7L16.17 6z" />
            </svg>
            <p className="text-sm text-neutral-600 leading-relaxed flex-1">
              {t.quote}
            </p>
            <div className="mt-5 pt-4 border-t border-neutral-100">
              <p className="text-sm font-medium text-neutral-900">{t.name}</p>
              <p className="text-xs text-neutral-500">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustStrip;