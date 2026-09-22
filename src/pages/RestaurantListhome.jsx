import { useEffect, useState } from "react";
import api from "../api/axios.js";
import RestaurantCard from "../components/RestaurantCard.jsx";

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/restaurants", { params: { city, search } });
      setRestaurants(data);
      setShowAll(false); // reset to limited view on every new search
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  const visibleRestaurants = showAll ? restaurants : restaurants.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl mb-6">Find Your Perfect Slot</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or cuisine"
          className="flex-1 min-w-[200px] rounded-xl border border-stone-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-40 rounded-xl border border-stone-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button className="rounded-xl bg-stone-900 text-white px-6 py-2 hover:bg-stone-700 transition">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-stone-500">Loading restaurants…</p>
      ) : restaurants.length === 0 ? (
        <p className="text-stone-500">No restaurants found. Try a different search.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRestaurants.map((r) => (
              <RestaurantCard key={r._id} restaurant={r} />
            ))}
          </div>

          {!showAll && restaurants.length > 6 && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setShowAll(true)}
                className="rounded-full border border-stone-300 px-8 py-3 font-medium text-stone-900 hover:bg-stone-900 hover:text-white transition"
              >
                View All ({restaurants.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantList;