import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";

const BACKEND_URL = "http://localhost:5000";

const MyRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/restaurants/mine");
        setRestaurants(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="h-8 w-56 bg-stone-100 rounded-lg animate-pulse mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-1.5">
          Partner Portal
        </p>
        <h1 className="font-display text-4xl text-stone-900">My Restaurants</h1>
      </div>

      {restaurants.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-stone-200 bg-stone-50/50">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
            🏪
          </div>
          <p className="text-stone-600 font-medium">No restaurants yet</p>
          <p className="text-stone-400 text-sm mt-1 mb-5">
            Add your first restaurant to start managing tables and bookings.
          </p>
          <Link
            to="/owner/restaurants/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Add Restaurant
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((r) => (
            <Link
              key={r._id}
              to={`/owner/restaurants/${r._id}/manage`}
              className="group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="relative h-40 bg-stone-100 flex items-center justify-center">
                {r.image ? (
                  <img
                    src={`${BACKEND_URL}${r.image}`}
                    alt={r.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <span className="text-3xl text-stone-300">🍽️</span>
                )}
                {r.numReviews > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md text-xs font-semibold text-stone-900">
                    <span className="text-amber-400">★</span>
                    {r.rating.toFixed(1)}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg text-stone-900 truncate">{r.name}</h3>
                <p className="text-stone-500 text-sm mt-0.5">{r.city}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-stone-400">
                  <span>{r.priceRange}</span>
                  <span>·</span>
                  <span>{r.numReviews} review{r.numReviews !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRestaurants;