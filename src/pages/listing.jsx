import { Link } from "react-router-dom";


const RestaurantCard = ({ restaurant }) => (
  <Link
    to={`/restaurants/${restaurant._id}`}
    className="group block rounded-2xl border border-stone-200 bg-white overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition"
  >
    <div className="h-40 bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
      <span className="font-display text-3xl text-brand-600">{restaurant.name[0]}</span>
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-stone-900 group-hover:text-brand-600">
          {restaurant.name}
        </h3>
        <span className="text-xs rounded-full bg-stone-100 px-2 py-1 text-stone-600">
          {restaurant.priceRange}
        </span>
      </div>
      <p className="text-sm text-stone-500 mt-1">{restaurant.city}</p>
      <p className="text-sm text-stone-500 mt-1 line-clamp-1">
        {restaurant.cuisine?.join(", ")}
      </p>
    </div>
  </Link>
);

export default RestaurantCard;
