import { useNavigate } from "react-router-dom";

const QuickFilters = () => {
  const navigate = useNavigate();

  const cities = [
    { name: "Delhi", count: "120+ restaurants" },
    { name: "Mumbai", count: "180+ restaurants" },
    { name: "Bengaluru", count: "150+ restaurants" },
    { name: "Hyderabad", count: "90+ restaurants" },
    { name: "Hazaribagh", count: "20+ restaurants" },
    { name: "Pune", count: "110+ restaurants" },
  ];

  const cuisines = [
    { name: "Indian", icon: "🍛" },
    { name: "Italian", icon: "🍝" },
    { name: "Chinese", icon: "🥡" },
    { name: "Continental", icon: "🍽️" },
    { name: "Cafe", icon: "☕" },
    { name: "Seafood", icon: "🦞" },
  ];

  const goToCity = (city) => navigate(`/restaurants?city=${encodeURIComponent(city)}`);
  const goToCuisine = (cuisine) => navigate(`/restaurants?search=${encodeURIComponent(cuisine)}`);

  return (
    <section className="max-w-6xl mx-auto px-6 py-18">
      <div className="text-center mb-16">
        <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
          Explore
        </span>
        <h2 className="font-display text-3xl md:text-5xl text-neutral-900 mt-3">
          Find what you're <span className="text-orange-600">craving, fast</span>
        </h2>
        <p className="text-neutral-500 mt-4 max-w-md mx-auto">
          Jump straight to your city or favorite cuisine — no scrolling required.
        </p>
      </div>

      {/* Cities */}
      <div className="mb-20">
        <div className="flex items-end justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-neutral-900 text-orange-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9.5" r="2.3" />
              </svg>
            </span>
            <div>
              <h3 className="font-display text-lg text-neutral-900 leading-none">
                Popular cities
              </h3>
              <p className="text-xs text-neutral-400 mt-1">Booked most this month</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => goToCity(city.name)}
              className="group relative rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-center overflow-hidden hover:border-orange-300 hover:shadow-lg hover:shadow-neutral-200/60 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-orange-50/0 to-orange-50/0 group-hover:from-orange-50/60 group-hover:to-transparent transition-all duration-300" />
              <div className="relative">
                <p className="font-display text-base text-neutral-900 group-hover:text-orange-700 transition-colors">
                  {city.name}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">{city.count}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisines */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <span className="w-9 h-9 rounded-full bg-neutral-900 text-orange-400 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M8 3v7a2 2 0 0 1-2 2H4M4 3v18M15 3v18M15 8c2.5 0 4.5 2 4.5 4.5S17.5 17 15 17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <h3 className="font-display text-lg text-neutral-900 leading-none">
              Popular cuisines
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Tap to explore each style</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.name}
              onClick={() => goToCuisine(cuisine.name)}
              className="group flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white pl-3 pr-5 py-2.5 hover:border-orange-300 hover:shadow-md hover:shadow-neutral-200/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-sm group-hover:bg-orange-100 transition-colors">
                {cuisine.icon}
              </span>
              <span className="text-sm font-medium text-neutral-700 group-hover:text-orange-700 transition-colors">
                {cuisine.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickFilters;