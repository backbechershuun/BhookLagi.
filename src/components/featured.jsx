import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import RestaurantCard from "./RestaurantCard.jsx";

const FeaturedRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/restaurants");
        const sorted = [...data].sort((a, b) => b.rating - a.rating);
        setRestaurants(sorted.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || restaurants.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
          Handpicked for you
        </span>
        <h2 className="font-display text-3xl md:text-5xl text-neutral-900 mt-3">
           Featured  <span className="text-orange-600">Restaurants</span>
        </h2>
        <p className="text-neutral-500 mt-4 max-w-md mx-auto">
          Top-rated tables, chosen by the people who've already booked them.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((r) => (
          <RestaurantCard key={r._id} restaurant={r} />
        ))}
      </div>

      {/* View all CTA */}
      <div className="flex justify-center mt-14">
        <Link
          to="/restaurants"
          className="group inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-7 py-3 text-sm font-medium text-neutral-800 hover:border-orange-300 hover:text-orange-700 hover:shadow-lg hover:shadow-neutral-200/60 hover:-translate-y-0.5 transition-all duration-300"
        >
          View all restaurants
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </section>
  );
};

export default FeaturedRestaurants;