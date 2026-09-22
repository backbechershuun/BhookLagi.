import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import ReviewModal from "../components/ReviewModal.jsx";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  completed: "bg-stone-100 text-stone-500 ring-1 ring-stone-200",
};

const statusDot = {
  pending: "bg-amber-400",
  confirmed: "bg-emerald-400",
  cancelled: "bg-red-400",
  completed: "bg-stone-400",
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const formatDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// A "pending" booking that came from the paid checkout flow (it has a
// depositAmount) is awaiting the restaurant's confirmation, not just an
// unpaid request — label it distinctly so guests aren't confused about
// whether they've already paid.
const statusLabel = (b) => {
  if (b.status === "pending" && b.depositAmount) return "Awaiting confirmation";
  return b.status;
};

// Renders one preordered dish line: name, portion (if any), quantity, and
// line total (price × quantity — price on the booking item is already the
// per-unit price for whichever portion was chosen, set server-side at checkout).
const OrderItemRow = ({ item }) => (
  <div className="flex items-center justify-between text-sm py-1.5">
    <span className="text-stone-600">
      {item.quantity}× {item.name}
      {item.portion && (
        <span className="text-stone-400 capitalize"> ({item.portion})</span>
      )}
    </span>
    <span className="text-stone-500 tabular-nums">
      ₹{item.price * item.quantity}
    </span>
  </div>
);

// Collapsible preorder summary — only rendered when a booking actually has
// items (the paid, menu-first checkout flow). Bookings from the older
// table-only flow have no `items`, so this section is skipped for those.
const OrderSummary = ({ booking }) => {
  const [open, setOpen] = useState(false);
  const items = booking.items || [];
  if (items.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-amber-600 transition"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
        </svg>
        {open ? "Hide" : "View"} preorder ({items.length} {items.length === 1 ? "dish" : "dishes"})
      </button>

      {open && (
        <div className="mt-2 rounded-xl bg-stone-50 border border-stone-100 px-3.5 py-2 divide-y divide-stone-100">
          {items.map((item, i) => (
            <OrderItemRow key={`${item.menuItem}-${item.portion || "std"}-${i}`} item={item} />
          ))}
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 pt-2 mt-1">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{booking.subtotal}</span>
          </div>
          {booking.depositAmount != null && (
            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <span>
                {booking.depositPercent === 100 ? "Paid in full" : `Paid now (${booking.depositPercent}%)`}
              </span>
              <span className="tabular-nums">₹{booking.depositAmount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelError, setCancelError] = useState("");

  const fetchData = async () => {
    const [bookingsRes, reviewsRes] = await Promise.all([
      api.get("/bookings/my"),
      api.get("/reviews/mine"),
    ]);
    setBookings(bookingsRes.data);
    setMyReviews(reviewsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cancelBooking = async (id) => {
    setCancellingId(id);
    setCancelError("");
    try {
      await api.patch(`/bookings/${id}/status`, { status: "cancelled" });
      await fetchData();
    } catch (err) {
      // Surfaces the refund-failure message from updateBookingStatus (502)
      // instead of silently doing nothing.
      setCancelError(
        err.response?.data?.message || "Could not cancel this booking. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  };

  const getReviewForRestaurant = (restaurantId) =>
    myReviews.find((r) => r.restaurant === restaurantId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="h-8 w-48 bg-stone-100 rounded-lg animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const visibleBookings =
    statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-1.5">
            Your reservations
          </p>
          <h1 className="font-display text-4xl text-stone-900">My bookings</h1>
        </div>

        {bookings.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-stone-100/80 p-1 overflow-x-auto">
            {filterTabs.map((tab) => {
              const count =
                tab.key === "all"
                  ? bookings.length
                  : bookings.filter((b) => b.status === tab.key).length;
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] tabular-nums ${active ? "text-white/70" : "text-stone-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {cancelError && (
        <div className="mb-6 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
          {cancelError}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-stone-200 bg-stone-50/50">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl">
            🍽️
          </div>
          <p className="text-stone-600 font-medium">No bookings yet</p>
          <p className="text-stone-400 text-sm mt-1 mb-5">
            Reserve a table and it'll show up here.
          </p>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Find a restaurant
          </Link>
        </div>
      ) : visibleBookings.length === 0 ? (
        <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
          <p className="text-stone-500 text-sm">No {statusFilter} bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleBookings.map((b) => {
            const review = getReviewForRestaurant(b.restaurant?._id);
            const canReview = b.status !== "cancelled" && !review;
            const canRebook = ["completed", "cancelled"].includes(b.status);

            return (
              <div
                key={b._id}
                className={`group relative rounded-2xl border bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
                  b.status === "pending" ? "border-amber-200 ring-1 ring-amber-100" : "border-stone-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center ring-2 ring-[#D4AF37]/20">
                      {b.restaurant?.image ? (
                        <img
                          src={b.restaurant.image}
                          alt={b.restaurant?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl text-stone-300">🍽️</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="font-display text-lg text-stone-900 truncate">
                          {b.restaurant?.name}
                        </h3>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[b.status]}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusDot[b.status]} ${
                              b.status === "pending" ? "animate-pulse" : ""
                            }`}
                          />
                          {statusLabel(b)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(b.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {b.timeSlot}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
                          </svg>
                          {b.partySize} guests
                        </span>
                        {b.table?.tableNumber && (
                          <span className="text-stone-400">Table {b.table.tableNumber}</span>
                        )}
                      </div>

                      {b.status === "cancelled" && b.refundedAt && (
                        <p className="text-xs text-stone-400 mt-2">
                          Deposit refunded
                        </p>
                      )}

                      <OrderSummary booking={b} />

                      {review && (
                        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-stone-100">
                          <span className="text-amber-400 text-sm tracking-tight">
                            {"★".repeat(review.rating)}
                            <span className="text-stone-200">{"★".repeat(5 - review.rating)}</span>
                          </span>
                          <span className="text-xs text-stone-400">You rated this visit</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {["pending", "confirmed"].includes(b.status) && (
                      <button
                        onClick={() => cancelBooking(b._id)}
                        disabled={cancellingId === b._id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:text-white hover:bg-red-500 px-4 py-2.5 rounded-xl border border-red-200 hover:border-red-500 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                      >
                        {cancellingId === b._id ? (
                          "Cancelling…"
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <circle cx="12" cy="12" r="9" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5l5 5m0-5l-5 5" />
                            </svg>
                            Cancel
                          </>
                        )}
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => setReviewTarget(b)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-4 py-2.5 rounded-xl bg-gradient-to-r from-stone-900 to-stone-700 hover:from-stone-800 hover:to-stone-600 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.3l-5.6 3 1.1-6.2L3 9.6l6.3-.9L12 3l2.7 5.7 6.3.9-4.5 4.5 1.1 6.2z" />
                        </svg>
                        Leave a review
                      </button>
                    )}

                    {canRebook && b.restaurant?._id && (
                      <Link
                        to={`/restaurants/${b.restaurant._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-[#D4AF37]/60 hover:bg-stone-50 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-[#D4AF37]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Book again
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          bookingId={reviewTarget._id}
          restaurantName={reviewTarget.restaurant?.name}
          onClose={() => setReviewTarget(null)}
          onSubmitted={(newReview) => setMyReviews((prev) => [...prev, newReview])}
        />
      )}
    </div>
  );
};

export default MyBookings;
