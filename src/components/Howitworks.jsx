const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Search",
      description: "Find restaurants by city, cuisine, or name in seconds.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Pick your table",
      description: "See real tables and choose exactly where you want to sit.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
          <rect x="3" y="10" width="18" height="3" rx="1" />
          <path d="M5 13v6M19 13v6M9 13v3M15 13v3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Order your food",
      description: "Browse the menu and choose your dishes in a few taps.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
          {/* Serving dome (cloche) */}
          <path d="M4 16a8 8 0 0 1 16 0" strokeLinecap="round" />
          <path d="M2.5 16h19M4 19.5h16" strokeLinecap="round" />
          <path d="M12 8V6.5M10.5 6.5h3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Reserve instantly",
      description: "Confirm your table and order with no calls and no waiting.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-1 py-20">
      <div className="text-center mb-16">
        <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
          How it works
        </span>
        <h2 className="font-display text-3xl md:text-5xl text-neutral-900 mt-3">
          Four steps to your <span className="text-orange-600">perfect meal</span>
        </h2>
        <p className="text-neutral-500 mt-4 max-w-md mx-auto">
          No calls, no waiting rooms — just pick, order, book, and enjoy.
        </p>
      </div>

      <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Connector line runs through the centres of the 4 columns (large screens only) */}
        <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-neutral-200 via-orange-200 to-neutral-200" />

        {steps.map((s) => (
          <div
            key={s.number}
            className="group relative rounded-3xl bg-white border border-neutral-200 p-8 text-center overflow-hidden hover:border-orange-200 hover:shadow-2xl hover:shadow-neutral-300/40 hover:-translate-y-1.5 transition-all duration-500"
          >
            {/* Faint oversized number watermark in the background */}
            <span className="pointer-events-none absolute -top-4 -right-2 font-display text-8xl text-neutral-50 select-none">
              {s.number}
            </span>

            {/* Subtle top accent line on hover */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-600 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

            <div className="relative">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-2xl bg-orange-100 rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                <div className="relative w-16 h-16 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
                  {s.icon}
                </div>
                <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center ring-4 ring-white">
                  {s.number}
                </span>
              </div>

              <h3 className="font-display text-xl text-neutral-900 mt-6">
                {s.title}
              </h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;