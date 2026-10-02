import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

const OWNER_RESTAURANTS_ENDPOINT = "/restaurants/mine";

// Small helper so every icon shares the same stroke style.
const Icon = ({ d, className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  plus: "M12 4v16m8-8H4",
  bell: "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9",
  home: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10",
  restaurants: "M3 21h18M5 21V7l8-4v18M13 9h6v12M9 9h.01M9 12h.01M9 15h.01",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  orders: "M9 2a1 1 0 00-1 1v1H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3V3a1 1 0 00-1-1H9zM7 8h10M7 12h10M7 16h6",
  help: "M9.5 9a2.5 2.5 0 015 .5c0 1.5-2 1.75-2 3.25M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M12 16v-4M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0",
};

const Badge = ({ count, className = "" }) =>
  count > 0 ? (
    <span
      className={`inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-amber-500 text-[10px] font-semibold leading-none text-stone-900 ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  ) : null;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.role === "owner";

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const [ownerRestaurants, setOwnerRestaurants] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const menuRef = useRef(null);
  const manageRef = useRef(null);

  const handleLogout = () => {
    setMenuOpen(false);
    setDrawerOpen(false);
    logout();
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setMobileSearchOpen(false);
    navigate(q ? `/restaurants?search=${encodeURIComponent(q)}` : "/restaurants");
  };

  // Close dropdowns on outside click / Escape.
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (manageRef.current && !manageRef.current.contains(e.target)) setManageMenuOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setManageMenuOpen(false);
        setDrawerOpen(false);
        setMobileSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Pending bookings across all of the owner's restaurants.
  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;

    const load = async () => {
      setLoadingPending(true);
      try {
        const { data: restaurants } = await api.get(OWNER_RESTAURANTS_ENDPOINT);
        const withCounts = await Promise.all(
          restaurants.map(async (r) => {
            try {
              const { data: bookings } = await api.get(`/bookings/restaurant/${r._id}`);
              return { ...r, pendingCount: bookings.filter((b) => b.status === "pending").length };
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

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isOwner]);

  const restaurantsWithPending = ownerRestaurants
    .filter((r) => r.pendingCount > 0)
    .sort((a, b) => b.pendingCount - a.pendingCount);
  const totalPending = restaurantsWithPending.reduce((sum, r) => sum + r.pendingCount, 0);

  const goToRestaurantOrders = (id) => {
    setManageMenuOpen(false);
    setDrawerOpen(false);
    navigate(`/owner/restaurants/${id}/manage?filter=pending`);
  };

  const handleReviewOrders = () => {
    if (restaurantsWithPending.length === 1) goToRestaurantOrders(restaurantsWithPending[0]._id);
    else if (restaurantsWithPending.length > 1) setManageMenuOpen((p) => !p);
    else navigate("/owner");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const iconBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 active:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]";

  const drawerLink =
    "flex items-center gap-5 rounded-xl px-3 py-2.5 text-sm text-stone-800 transition-colors hover:bg-stone-100";

  const dropdownLink =
    "flex items-center gap-4 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-100 transition-colors";

  // Drawer content differs by role.
  const drawerMain = isOwner
    ? [
        { to: "/owner", label: "My Restaurants", icon: ICONS.restaurants },
        { to: "/owner/restaurants/new", label: "Add a Restaurant", icon: ICONS.plus },
      ]
    : [
        { to: "/", label: "Home", icon: ICONS.home },
        { to: "/restaurants", label: "Restaurants", icon: ICONS.restaurants },
        ...(user
          ? [
              { to: "/my-bookings", label: "My Bookings", icon: ICONS.calendar },
              { to: "/my-orders", label: "Your Orders", icon: ICONS.orders },
            ]
          : []),
      ];

  const Logo = ({ onClick }) => (
    <Link
      to={isOwner ? "/owner" : "/"}
      onClick={onClick}
      aria-label="BhookLagi home"
      className="flex flex-shrink-0 items-center gap-2"
    >
      <span className="block h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full bg-white ring-2 ring-[#D4AF37]/60">
        <img src="/Icon2.png" alt="" className="h-full w-full object-cover" />
      </span>
      <div className="hidden flex-col sm:flex">
        <img src="/Bhooklagi2.png" alt="BhookLagi" className={`w-auto object-contain ${isOwner ? "h-7 md:h-8" : "h-8 md:h-10"}`} />
        {isOwner && (
          <span className="mt-0.5 flex w-fit items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 py-[2px] pl-1.5 pr-2 text-[8px] font-semibold uppercase leading-none tracking-[0.2em] text-[#EBD182]">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-2 w-2 text-[#D4AF37]">
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" />
            </svg>
            Partner Portal
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <>
      {/* ---------- Left drawer (YouTube-style guide) ---------- */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        aria-hidden={!drawerOpen}
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center gap-3 px-4">
          <button className={iconBtn} onClick={() => setDrawerOpen(false)} aria-label="Close menu">
            <Icon d={ICONS.menu} />
          </button>
          <Logo onClick={() => setDrawerOpen(false)} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-0.5">
            {drawerMain.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setDrawerOpen(false)} className={drawerLink}>
                <Icon d={item.icon} className="h-5 w-5 text-stone-600" />
                {item.label}
              </Link>
            ))}
            {isOwner && (
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  if (restaurantsWithPending.length === 1) goToRestaurantOrders(restaurantsWithPending[0]._id);
                  else navigate("/owner");
                }}
                className={`${drawerLink} w-full`}
              >
                <Icon d={ICONS.orders} className="h-5 w-5 text-stone-600" />
                <span className="flex-1 text-left">Review orders</span>
                <Badge count={totalPending} />
              </button>
            )}
          </div>

          <div className="my-3 border-t border-stone-200" />

          <div className="space-y-0.5">
            <Link to="/help" onClick={() => setDrawerOpen(false)} className={drawerLink}>
              <Icon d={ICONS.help} className="h-5 w-5 text-stone-600" />
              Help &amp; Support
            </Link>
            <Link to="/about" onClick={() => setDrawerOpen(false)} className={drawerLink}>
              <Icon d={ICONS.info} className="h-5 w-5 text-stone-600" />
              About
            </Link>
          </div>
        </div>
      </aside>

      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-30 h-16 md:h-20 border-b border-stone-200 bg-white">
        {/* Mobile expanded search (replaces the bar while open) */}
        {!isOwner && mobileSearchOpen ? (
          <form onSubmit={handleSearch} className="flex h-full items-center gap-2 px-2 sm:hidden">
            <button type="button" className={iconBtn} onClick={() => setMobileSearchOpen(false)} aria-label="Close search">
              <Icon d={ICONS.back} />
            </button>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search restaurants, cuisines, cities"
              className="h-10 min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#D4AF37] focus:outline-none"
            />
            <button type="submit" className={iconBtn} aria-label="Search">
              <Icon d={ICONS.search} />
            </button>
          </form>
        ) : null}

        <nav
          className={`h-full grid-cols-[auto_1fr_auto] items-center gap-2 px-2 sm:px-4 ${
            !isOwner && mobileSearchOpen ? "hidden sm:grid" : "grid"
          }`}
        >
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-1 sm:gap-3">
            <button className={iconBtn} onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Icon d={ICONS.menu} />
            </button>
            <Logo />
          </div>

          {/* Center: search (customers) */}
          <div className="flex justify-center">
            {!isOwner && (
              <form onSubmit={handleSearch} className="hidden w-full max-w-xl sm:flex" role="search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants, cuisines, cities"
                  className="h-11 min-w-0 flex-1 rounded-l-full border border-stone-300 bg-white pl-5 pr-3 text-sm text-stone-800 placeholder:text-stone-400 shadow-inner focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex h-11 w-16 items-center justify-center rounded-r-full border border-l-0 border-stone-300 bg-stone-50 text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                >
                  <Icon d={ICONS.search} className="h-5 w-5" />
                </button>
              </form>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isOwner && (
              <button className={`${iconBtn} sm:hidden`} onClick={() => setMobileSearchOpen(true)} aria-label="Search">
                <Icon d={ICONS.search} />
              </button>
            )}

            {!isOwner && (
              <Link to="/restaurants" className="group relative hidden items-center gap-1.5 text-sm font-medium text-stone-700 md:flex">
                <Icon d={ICONS.calendar} className="h-4 w-4 text-stone-400 transition-colors group-hover:text-[#D4AF37]" />
                <span className="transition-colors group-hover:text-stone-900">Restaurants</span>
                <span className="absolute -bottom-1 left-0 h-[1.5px] w-0 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
              </Link>
            )}

            {isOwner && (
              <>
                <Link to="/owner/restaurants/new" className="hidden lg:inline-flex inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white text-stone-700 px-5 py-2.5 text-sm font-medium hover:border-[#D4AF37]/60 hover:text-stone-900 hover:bg-stone-50 hover:shadow-sm transition-all duration-200">
                  <Icon d={ICONS.plus} className="h-4 w-4 text-[#D4AF37]" />
                  Add a Restaurant
                </Link>

                <div className="relative hidden lg:block" ref={manageRef}>
                  <button
                    onClick={handleReviewOrders}
                    disabled={loadingPending && ownerRestaurants.length === 0}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white text-stone-700 px-5 py-2.5 text-sm font-medium hover:border-[#D4AF37]/60 hover:text-stone-900 hover:bg-stone-50 hover:shadow-sm transition-all duration-200 disabled:opacity-60"
                  >
                    <Icon d={ICONS.orders} className="h-4 w-4 text-[#D4AF37]" />
                    Review orders
                    <Badge count={totalPending} />
                  </button>

                  <div
                    className={`absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl transition-all duration-150 ${
                      manageMenuOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                    }`}
                  >
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="text-sm font-medium text-stone-900">Pending orders</p>
                      <p className="text-xs text-stone-500">Choose which restaurant to visit</p>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {restaurantsWithPending.map((r) => (
                        <button
                          key={r._id}
                          onClick={() => goToRestaurantOrders(r._id)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-stone-100"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-stone-800">{r.name}</span>
                            {r.city && <span className="block truncate text-xs text-stone-500">{r.city}</span>}
                          </span>
                          <Badge count={r.pendingCount} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Link
                  to="/owner"
                  className="hidden lg:inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <Icon d={ICONS.restaurants} className="h-4 w-4 text-[#D4AF37]" />
                  My Restaurants
                </Link>
              </>
            )}

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  aria-label="Account menu"
                  className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white ring-2 ring-[#D4AF37]/40 transition-shadow hover:ring-[#D4AF37] focus:outline-none focus-visible:ring-[#D4AF37]"
                >
                  {initials}
                </button>

                <div
                  className={`absolute right-0 top-full z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl transition-all duration-150 ${
                    menuOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3.5">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">{user.name}</p>
                      <p className="truncate text-xs text-stone-500">{user.email}</p>
                      {isOwner && <p className="mt-0.5 text-xs text-amber-700">Owner account</p>}
                    </div>
                  </div>

                  <div className="border-b border-stone-100 py-1.5">
                    <Link to="/my-orders" onClick={() => setMenuOpen(false)} className={dropdownLink}>
                      <Icon d={ICONS.orders} className="h-5 w-5 text-stone-500" />
                      My Orders
                    </Link>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} className={dropdownLink}>
                      <Icon d={ICONS.user} className="h-5 w-5 text-stone-500" />
                      Profile
                    </Link>
                  </div>

                  <div className="py-1.5">
                    <button onClick={handleLogout} className={`${dropdownLink} w-full text-red-600 hover:bg-red-50`}>
                      <Icon d={ICONS.logout} className="h-5 w-5" />
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-stone-300 px-3 text-sm font-medium text-[#8a6d12] transition-colors hover:border-[#D4AF37] hover:bg-amber-50"
              >
                <Icon d={ICONS.user} className="h-5 w-5" />
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
};

export default Navbar;
