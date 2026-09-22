import { Link } from "react-router-dom";

const BACKEND_URL = "http://localhost:5000";

const RestaurantCard = ({ restaurant }) => {
  const imageSrc = restaurant.image ? `${BACKEND_URL}${restaurant.image}` : "/images/placeholder.jpg";
  const rating = restaurant.rating ?? 0;
  const numReviews = restaurant.numReviews ?? 0;

  return (
    <Link
      to={`/restaurants/${restaurant._id}`}
      className="group block rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div className="relative overflow-hidden">
        <img
          src={imageSrc}
          alt={restaurant.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Subtle gradient so the badge stays readable over any photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {numReviews > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md">
            <span className="text-amber-400 text-sm leading-none">★</span>
            <span className="text-xs font-semibold text-stone-900">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg text-stone-900 group-hover:text-stone-700 transition-colors">
          {restaurant.name}
        </h3>
        <p className="text-stone-500 text-sm mt-0.5">{restaurant.city}</p>

        {numReviews > 0 ? (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex text-xs tracking-tight">
              <span className="text-amber-400">{"★".repeat(Math.round(rating))}</span>
              <span className="text-stone-200">{"★".repeat(5 - Math.round(rating))}</span>
            </div>
            <span className="text-stone-400 text-xs">
              {rating.toFixed(1)} · {numReviews} review{numReviews !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <p className="text-stone-300 text-xs mt-2.5 italic">No reviews yet</p>
        )}

        {restaurant.cuisine?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {restaurant.cuisine.map((c, i) => (
              <span
                key={i}
                className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default RestaurantCard;