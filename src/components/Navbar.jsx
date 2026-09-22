import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

// Returns every restaurant owned by the logged-in owner — same endpoint
// MyRestaurants.jsx uses.
const OWNER_RESTAURANTS_ENDPOINT = "/restaurants/mine";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isOwner = user?.role === "owner";

  // Pending-orders-across-all-restaurants state, used by the "Manage" dropdown below.
  const [ownerRestaurants, setOwnerRestaurants] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const manageRef = useRef(null);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/restaurants?search=${encodeURIComponent(q)}` : "/restaurants");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (manageRef.current && !manageRef.current.contains(e.target)) {
        setManageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Loads every restaurant this owner has, then the pending-booking count
  // for each one, so the navbar always knows where orders are waiting —
  // without the owner having to open each restaurant to check.
  useEffect(() => {
    if (!isOwner) return;

    let cancelled = false;

    const loadPendingAcrossRestaurants = async () => {
      setLoadingPending(true);
      try {
        const { data: restaurants } = await api.get(OWNER_RESTAURANTS_ENDPOINT);

        const withCounts = await Promise.all(
          restaurants.map(async (r) => {
            try {
              const { data: bookings } = await api.get(`/bookings/restaurant/${r._id}`);
              const pendingCount = bookings.filter((b) => b.status === "pending").length;
              return { ...r, pendingCount };
            } catch {
              return { ...r, pendingCount: 0 };
            }
          })
        );

        if (!cancelled) setOwnerRestaurants(withCounts);
      } catch {
        if (!cancelled) setOwnerRestaurants([]);
      } finally {
        if (!cancelled) setLoadingPending(false);
      }
    };

    loadPendingAcrossRestaurants();
    // Refresh periodically so the badge doesn't go stale while the owner
    // sits on another page.
    const interval = setInterval(loadPendingAcrossRestaurants, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOwner]);

  const restaurantsWithPending = ownerRestaurants
    .filter((r) => r.pendingCount > 0)
    .sort((a, b) => b.pendingCount - a.pendingCount);

  const totalPending = restaurantsWithPending.reduce((sum, r) => sum + r.pendingCount, 0);

  const goToRestaurantOrders = (restaurantId) => {
    setManageMenuOpen(false);
    navigate(`/owner/restaurants/${restaurantId}/manage?filter=pending`);
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Blurred backdrop behind the whole page when menu is open */}
      <div
        className={`fixed inset-0 z-30 bg-stone-900/10 backdrop-blur-sm transition-opacity duration-200 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />

      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-stone-200/80 shadow-[0_1px_0_0_rgba(212,175,55,0.25)]">
        <nav
          className={`max-w-7xl mx-auto grid items-center gap-3 sm:gap-6 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 ${
            isOwner ? "grid-cols-[auto_1fr]" : "grid-cols-[auto_1fr_auto]"
          }`}
        >
          {/* Logo — full image shown as-is (icon and text wordmark removed) */}
          <Link to={isOwner ? "/owner" : "/"} className="group flex-shrink-0 flex items-center">
            <div>
              <img
                src="/Bhooklagi.png"
                alt="BhookLagi"
                className="h-12 sm:h-11 lg:h-10 w-auto object-contain"
              />
              {isOwner && (
                <span className="mt-1.5 flex w-fit items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 py-[3px] pl-1.5 pr-2.5 text-[9px] font-semibold uppercase leading-none tracking-[0.22em] text-[#EBD182] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_1px_2px_rgba(28,25,23,0.25)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="h-2.5 w-2.5 text-[#D4AF37] transition-transform duration-500 group-hover:rotate-90"
                  >
                    <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
                  </svg>
                  Partner Portal
                </span>
              )}
              <span className="block h-[2px] w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
            </div>
          </Link>

          {/* Customer-only: centered restaurant search */}
          {!isOwner && (
            <form onSubmit={handleSearch} className="w-full min-w-0 max-w-md mx-auto">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants…"
                  className="w-full min-w-0 rounded-full border border-stone-200 bg-stone-50/80 pl-10 sm:pl-11 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm text-stone-700 placeholder:text-stone-400 shadow-inner transition-all duration-200 focus:outline-none focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/20"
                />
              </div>
            </form>
          )}

          {/* Right-side nav */}
          <div className="flex items-center gap-2.5 sm:gap-5 text-sm font-medium text-stone-700 flex-shrink-0 justify-self-end">
            {!isOwner && (
              <>
                {/* Restaurants link — icon + gold underline. Hidden on
                    mobile since it's redundant with "Reserve" in the
                    avatar dropdown, and keeps the search bar from being
                    squeezed on narrow screens. */}
                <Link to="/restaurants" className="hidden sm:flex group items-center gap-1.5 relative">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4 text-stone-400 group-hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="group-hover:text-stone-900 transition-colors duration-200">Restaurants</span>
                  <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
                </Link>
              </>
            )}

            {/* Owner-only: three actions, now sharing one consistent premium
                pill treatment (same height/padding/border/icon sizing)
                instead of three different button styles. */}
            {isOwner && (
              <>
                <Link
                  to="/owner/restaurants/new"
                  className="hidden lg:inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white text-stone-700 px-4 py-2.5 text-sm font-medium hover:border-[#D4AF37]/60 hover:text-stone-900 hover:bg-stone-50 hover:shadow-sm transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4AF37]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add a Restaurant
                </Link>

                {/* Review orders — jumps straight to pending orders. If more
                    than one restaurant has pending orders at once, opens a
                    picker instead of guessing which one to visit. */}
                <div className="relative hidden lg:block" ref={manageRef}>
                  <button
                    onClick={() => {
                      if (restaurantsWithPending.length === 1) {
                        goToRestaurantOrders(restaurantsWithPending[0]._id);
                      } else if (restaurantsWithPending.length > 1) {
                        setManageMenuOpen((prev) => !prev);
                      } else {
                        navigate("/owner");
                      }
                    }}
                    disabled={loadingPending && ownerRestaurants.length === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white text-stone-700 px-4 py-2.5 text-sm font-medium hover:border-[#D4AF37]/60 hover:text-stone-900 hover:bg-stone-50 hover:shadow-sm transition-all duration-200 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4AF37]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3V3a1 1 0 00-1-1H9zM7 8h10M7 12h10M7 16h6" />
                    </svg>
                    Review orders
                    {totalPending > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-[11px] font-semibold text-stone-900">
                        {totalPending}
                      </span>
                    )}
                  </button>

                  {/* Picker — only relevant, and only rendered, when 2+
                      restaurants have pending orders at the same time. */}
                  <div
                    className={`absolute right-0 top-full mt-3 w-72 origin-top-right rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 overflow-hidden transition-all duration-200 ease-out z-50 ${
                      manageMenuOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/60">
                      <p className="text-sm font-medium text-stone-900">Pending orders</p>
                      <p className="text-xs text-stone-400">Choose which restaurant to visit</p>
                    </div>
                    <div className="py-1.5 max-h-72 overflow-y-auto">
                      {restaurantsWithPending.map((r) => (
                        <button
                          key={r._id}
                          onClick={() => goToRestaurantOrders(r._id)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors text-left"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-stone-800">{r.name}</span>
                            {r.city && <span className="block text-xs text-stone-400 truncate">{r.city}</span>}
                          </span>
                          <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-[11px] font-semibold text-stone-900">
                            {r.pendingCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  to="/owner"
                  className="hidden lg:inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white text-stone-700 px-4 py-2.5 text-sm font-medium hover:border-[#D4AF37]/60 hover:text-stone-900 hover:bg-stone-50 hover:shadow-sm transition-all duration-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#D4AF37]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 9h6v12M9 9h.01M9 12h.01M9 15h.01" />
                  </svg>
                  My Restaurants
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-1">
                <span className="hidden lg:block w-px h-6 bg-stone-200" />

                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-label="Open menu"
                    className="relative z-50 flex items-center gap-2.5 rounded-full border border-stone-200 bg-white px-3 py-2 hover:border-[#D4AF37]/50 hover:shadow-sm transition-all duration-200"
                  >
                    <span className="relative w-7 h-7 rounded-full bg-gradient-to-br from-stone-800 to-stone-950 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-[#D4AF37]/30">
                      {initials}
                    </span>

                    <div className="w-4 h-4 flex flex-col justify-center gap-[3px]">
                      <span
                        className={`block h-[1.5px] bg-stone-600 rounded-full transition-all duration-200 ${
                          menuOpen ? "rotate-45 translate-y-[4.5px]" : ""
                        }`}
                      />
                      <span
                        className={`block h-[1.5px] bg-stone-600 rounded-full transition-all duration-200 ${
                          menuOpen ? "opacity-0" : "opacity-100"
                        }`}
                      />
                      <span
                        className={`block h-[1.5px] bg-stone-600 rounded-full transition-all duration-200 ${
                          menuOpen ? "-rotate-45 -translate-y-[4.5px]" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Dropdown — slides in from top-right */}
                  <div
                    className={`absolute right-0 top-full mt-3 w-64 origin-top-right rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 overflow-hidden transition-all duration-200 ease-out z-50 ${
                      menuOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3.5 border-b border-stone-100 bg-stone-50/60">
                      <p className="text-sm font-medium text-stone-900 truncate">{user.name}</p>
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                      {isOwner && (
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Owner Account
                        </span>
                      )}
                    </div>

                    <div className={isOwner ? "p-2.5 space-y-2 bg-gradient-to-b from-stone-50/80 to-transparent" : ""}>
                      {isOwner ? (
                        <>
                          <Link
                            to="/owner"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 9h6v12M9 9h.01M9 12h.01M9 15h.01" />
                              </svg>
                            </span>
                            My Restaurants
                          </Link>
                          <Link
                            to="/owner/restaurants/new"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </span>
                            Add a Restaurant
                          </Link>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              if (restaurantsWithPending.length === 1) {
                                goToRestaurantOrders(restaurantsWithPending[0]._id);
                              } else {
                                navigate("/owner");
                              }
                            }}
                            className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3V3a1 1 0 00-1-1H9zM7 8h10M7 12h10M7 16h6" />
                                </svg>
                              </span>
                              Review orders
                            </span>
                            {totalPending > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[1.375rem] h-5.5 px-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-[11px] font-bold text-stone-900 shadow-sm">
                                {totalPending}
                              </span>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="p-2.5 space-y-2 bg-gradient-to-b from-stone-50/80 to-transparent -mx-0">
                          <Link
                            to="/restaurants"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </span>
                            Reserve
                          </Link>
                          <Link
                            to="/my-bookings"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </span>
                            My Bookings
                          </Link>
                          <Link
                            to="/my-orders"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                          >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3V3a1 1 0 00-1-1H9zM7 8h10M7 12h10M7 16h6" />
                              </svg>
                            </span>
                            Your Orders
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-100 p-2.5 space-y-2 bg-gradient-to-b from-stone-50/80 to-transparent">
                      <Link
                        to="/help"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                            <circle cx="12" cy="12" r="9" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 015 .5c0 1.5-2 1.75-2 3.25M12 17h.01" />
                          </svg>
                        </span>
                        Help &amp; Support
                      </Link>
                      <Link
                        to="/about"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl border border-[#D4AF37]/30 bg-white px-3.5 py-3 text-sm font-semibold text-stone-800 shadow-sm hover:border-[#D4AF37]/60 hover:shadow-md hover:-translate-y-px transition-all duration-200 active:scale-[0.98] active:translate-y-0"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#F7E7B0] to-[#D4AF37]/40 flex-shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-stone-800">
                            <circle cx="12" cy="12" r="9" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
                          </svg>
                        </span>
                        About
                      </Link>
                    </div>

                    <div className="border-t border-stone-100 py-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="hover:text-brand-600 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-brand-600 text-white px-4 py-1.5 hover:bg-brand-700 transition-all duration-200 shadow-sm hover:shadow-md border border-[#D4AF37]/30"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
