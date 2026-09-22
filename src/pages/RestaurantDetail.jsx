import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const BACKEND_URL = "http://localhost:5000";

const zoneMeta = {
  indoor: { label: "Indoor", icon: "🏠" },
  outdoor: { label: "Outdoor", icon: "🌤️" },
  rooftop: { label: "Rooftop", icon: "🏙️" },
  private: { label: "Private", icon: "🔒" },
};

const TABLES_PER_ROW = 6;
const rowIndents = [0, 22, 44];

const chunk = (arr, size) => {
  const rows = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
};

const getNextDays = (count) => {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: d.getDate(),
      monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return days;
};

const getTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 24; hour++) {
    const h24 = hour % 24;
    const value = `${String(h24).padStart(2, "0")}:00`;
    const displayHour = h24 % 12 === 0 ? 12 : h24 % 12;
    const period = h24 < 12 || h24 === 24 ? "AM" : "PM";
    slots.push({ value, label: `${displayHour}:00 ${h24 === 24 ? "AM" : period}` });
  }
  return slots;
};

// Computes the actual visible rectangle of an <img> using object-fit: contain
// inside its container — accounts for letterboxing on either axis.
const useImageBox = () => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [box, setBox] = useState({ offsetX: 0, offsetY: 0, width: 0, height: 0 });

  const recalc = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !img.naturalWidth) return;

    const containerRect = container.getBoundingClientRect();
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = containerRect.width / containerRect.height;

    let width, height, offsetX, offsetY;
    if (imgRatio > containerRatio) {
      width = containerRect.width;
      height = width / imgRatio;
      offsetX = 0;
      offsetY = (containerRect.height - height) / 2;
    } else {
      height = containerRect.height;
      width = height * imgRatio;
      offsetY = 0;
      offsetX = (containerRect.width - width) / 2;
    }
    setBox({ offsetX, offsetY, width, height });
  };

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  return { containerRef, imgRef, box, recalc };
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const availableDays = getNextDays(15);
  const timeSlots = getTimeSlots();

  const [restaurant, setRestaurant] = useState(null);
  const [date, setDate] = useState(availableDays[0].iso);
  const [timeSlot, setTimeSlot] = useState(timeSlots[4].value);
  const [partySize, setPartySize] = useState(2);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  // NEW — image box measurement for the interior photo
  const { containerRef, imgRef, box, recalc } = useImageBox();

  useEffect(() => {
    api.get(`/restaurants/${id}`).then(({ data }) => setRestaurant(data));
  }, [id]);

  const checkAvailability = async () => {
    setStatus({ type: "", message: "" });
    setSelectedTable(null);
    const { data } = await api.get(`/tables/${id}/availability`, {
      params: { date, timeSlot, partySize },
    });
    setTables(data);
  };

  useEffect(() => {
    if (restaurant) checkAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, date, timeSlot, partySize]);

  // CHANGED — booking is no longer created here. This just hands the chosen
  // table + slot off to the food-ordering / payment step, which is the page
  // that actually creates the booking once a deposit is paid.
  const handleContinueToMenu = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!selectedTable) return;

    navigate(`/restaurants/${id}/menu`, {
      state: {
        restaurant,
        date,
        timeSlot,
        partySize,
        table: selectedTable,
      },
    });
  };

  const handlePartySizeInput = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setPartySize("");
      return;
    }
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num)) {
      setPartySize(Math.max(1, num));
    }
  };

  const handlePartySizeBlur = () => {
    if (partySize === "" || Number.isNaN(Number(partySize))) {
      setPartySize(1);
    }
  };

  if (!restaurant) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div
          className="relative rounded-3xl overflow-hidden h-64 flex items-center justify-center bg-cover bg-center brightness-[0.55]"
          style={{ backgroundImage: `url('/images/Restaurent_details.png')` }}
        >
          <div className="inline-flex items-center gap-2 text-white">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
            </svg>
            <span className="text-sm">Loading restaurant…</span>
          </div>
        </div>
      </div>
    );
  }

  const imageSrc = restaurant.image
    ? `${BACKEND_URL}${restaurant.image}`
    : "/images/placeholder.jpg";

  const interiorImageSrc = restaurant.interiorImage
    ? `${BACKEND_URL}${restaurant.interiorImage}`
    : imageSrc;

  const groupedTables = tables.reduce((acc, t) => {
    const zone = t.location || "indoor";
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(t);
    return acc;
  }, {});

  const positionedTables = tables.filter((t) => t.positionX != null && t.positionY != null);

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Header with EXTERIOR restaurant image */}
      <div
        className="border-b border-neutral-300 bg-white bg-cover bg-center relative"
        style={{ backgroundImage: `url('/images/Restaurent_details.png')` }}
      >
        <div className="absolute inset-0 bg-white/85" />

        <div className="max-w-6xl mx-auto px-6 py-14 relative z-10">
          <div className="grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <div>
              <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
                {restaurant.priceRange || "Restaurant"}
              </span>
              <h1 className="font-display text-4xl md:text-5xl text-neutral-900 mt-3">
                {restaurant.name}
              </h1>
              <p className="text-neutral-500 mt-3">
                {restaurant.address}, {restaurant.city}
              </p>

              {restaurant.cuisine?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {restaurant.cuisine.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {restaurant.description && (
                <p className="text-neutral-600 mt-5 max-w-2xl leading-relaxed">
                  {restaurant.description}
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-tr from-orange-100 via-orange-50 to-transparent rounded-[2rem] blur-xl opacity-70" />
              <img
                src={imageSrc}
                alt={restaurant.name}
                className="relative w-full h-64 md:h-72 object-cover rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking area */}
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Booking area heading */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-orange-800 tracking-[0.2em] uppercase">
            Reserve your spot
          </span>
          <h2 className="font-display text-3xl md:text-4xl text-neutral-900 mt-3">
            Pick your <span className="text-orange-600">date, time & table</span>
          </h2>
          <p className="text-neutral-500 mt-3 max-w-md mx-auto">
            Choose what works for you — no calls, no waiting for confirmation.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 mb-8 space-y-6">
          {/* Date selector — horizontally scrollable for 15 days */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Select date
            </label>
            <div className="flex gap-3 mt-3 overflow-x-auto pb-2 -mx-1 px-1">
              {availableDays.map((d) => {
                const isSelected = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl border w-16 h-18 py-2 transition-all duration-300 ${
                      isSelected
                        ? "border-orange-500 bg-orange-600 text-white shadow-lg shadow-orange-200"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-medium opacity-80">
                      {d.dayLabel}
                    </span>
                    <span className="font-display text-lg leading-tight mt-0.5">
                      {d.dateLabel}
                    </span>
                    <span className="text-[10px] opacity-80">{d.monthLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time selector — wraps, covers 8 AM to midnight */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Select time
            </label>
            <div className="flex flex-wrap gap-2.5 mt-3">
              {timeSlots.map((t) => {
                const isSelected = timeSlot === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTimeSlot(t.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      isSelected
                        ? "border-orange-500 bg-orange-600 text-white shadow-lg shadow-orange-200"
                        : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Party size — steppers + a direct-entry input */}
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Party size
            </label>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => setPartySize((p) => Math.max(1, (Number(p) || 1) - 1))}
                className="w-9 h-9 rounded-full border border-neutral-300 text-neutral-700 hover:border-orange-400 hover:text-orange-600 transition flex items-center justify-center"
              >
                −
              </button>

              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={partySize}
                onChange={handlePartySizeInput}
                onBlur={handlePartySizeBlur}
                className="font-display text-lg text-neutral-900 w-14 text-center rounded-lg border border-neutral-200 py-1 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              <button
                onClick={() => setPartySize((p) => (Number(p) || 0) + 1)}
                className="w-9 h-9 rounded-full border border-neutral-300 text-neutral-700 hover:border-orange-400 hover:text-orange-600 transition flex items-center justify-center"
              >
                +
              </button>
              <span className="text-sm text-neutral-500 ml-1">guests</span>
            </div>
          </div>
        </div>

        {/* INTERIOR photo — invisible hotspots, revealed on hover */}
        <div className="mb-10">
          <div
            ref={containerRef}
            className="relative rounded-3xl overflow-hidden shadow-xl bg-neutral-900"
          >
            <img
              ref={imgRef}
              src={interiorImageSrc}
              alt={`${restaurant.name} interior`}
              onLoad={recalc}
              className="w-full h-[32rem] md:h-[42rem] object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent pointer-events-none" />

            {/* Clickable table hotspots — using each table's REAL stored position, mapped through the image box */}
            {box.width > 0 &&
              positionedTables.map((t) => {
                const isSelected = selectedTable?._id === t._id;
                return (
                  <button
                    key={t._id}
                    onClick={() => setSelectedTable(t)}
                    style={{
                      left: box.offsetX + (t.positionX / 100) * box.width,
                      top: box.offsetY + (t.positionY / 100) * box.height,
                    }}
                    title={`Table ${t.tableNumber} · seats ${t.capacity}`}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-xl w-16 h-16 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-2 border-[#D4AF37] bg-green-600/90 scale-110 shadow-lg shadow-[#D4AF37]/40"
                        : "border-2 border-transparent bg-transparent hover:border-orange-300 hover:bg-black/60 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30"
                    }`}
                  >
                    <span
                      className={`flex flex-col items-center justify-center transition-opacity duration-200 ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <span className="text-[12px] font-bold leading-none text-white">
                        T{t.tableNumber}
                      </span>
                      <span className="text-[9px] leading-none text-white/80 mt-0.5">
                        {t.capacity} seats
                      </span>
                    </span>

                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}

            {/* Floating booking-confirmation badge — appears over the image once a table is picked */}
            {selectedTable && (
              <div className="absolute bottom-5 right-6 flex items-center gap-2.5 rounded-full bg-[#14532D]/95 border border-[#D4AF37]/60 pl-2 pr-4 py-2 shadow-lg shadow-black/30 backdrop-blur-sm">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#D4AF37] text-[#14532D] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
                    <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-xs text-white leading-tight">
                  <span className="block font-semibold text-[#E6C65C]">
                    Table {selectedTable.tableNumber} selected
                  </span>
                  <span className="block text-white/70">Choose food next</span>
                </span>
              </div>
            )}

            <div className="absolute bottom-5 left-6 pointer-events-none">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-[0.15em]">
                A closer look
              </p>
              <p className="font-display text-xl text-white mt-1">
                Inside {restaurant.name}
              </p>
            </div>
          </div>

          {positionedTables.length > 0 && (
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Hover over the photo to find a table, then click to select it.
            </p>
          )}
        </div>

        {/* ============================================================ */}
        {/* Select your table — keyboard-style staggered rows            */}
        {/* ============================================================ */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-[10px] font-semibold text-[#B8912F] tracking-[0.25em] uppercase">
                Seating chart
              </span>
              <h2 className="font-display text-2xl text-neutral-900 mt-1">
                Select your table
              </h2>
            </div>
            {tables.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {tables.length} table{tables.length !== 1 ? "s" : ""} available
              </div>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-[#D4AF37]/60 via-neutral-200 to-transparent mb-6" />

          {tables.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <p className="text-neutral-500 text-sm">
                No tables free for this slot. Try another time.
              </p>
            </div>
          ) : (
            <div className="space-y-5 mb-8">
              {Object.entries(groupedTables).map(([zone, zoneTables]) => {
                const rows = chunk(zoneTables, TABLES_PER_ROW);
                return (
                  <div
                    key={zone}
                    className="relative rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-white to-neutral-50/60 px-5 pt-4 pb-4 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#14532D]/5 text-sm">
                        {zoneMeta[zone]?.icon || "🍽️"}
                      </span>
                      <h3 className="font-display text-[13px] text-neutral-800 tracking-wide uppercase">
                        {zoneMeta[zone]?.label || zone}
                      </h3>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {zoneTables.length} {zoneTables.length === 1 ? "table" : "tables"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {rows.map((row, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="flex gap-2.5"
                          style={{ marginLeft: `${rowIndents[rowIdx % rowIndents.length]}px` }}
                        >
                          {row.map((t) => {
                            const isSelected = selectedTable?._id === t._id;
                            return (
                              <button
                                key={t._id}
                                onClick={() => setSelectedTable(t)}
                                title={`Table ${t.tableNumber} · seats ${t.capacity}`}
                                className={`group relative flex-shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl w-14 h-14 transition-all duration-300 ${
                                  isSelected
                                    ? "bg-gradient-to-br from-[#1a6636] to-[#0f3d20] text-white shadow-lg shadow-[#14532D]/30 scale-110 ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-neutral-50"
                                    : "bg-white text-neutral-600 border border-neutral-200 shadow-sm hover:border-[#D4AF37] hover:shadow-md hover:shadow-[#D4AF37]/10 hover:-translate-y-0.5"
                                }`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.4"
                                  className={`w-3.5 h-3.5 ${isSelected ? "text-[#E6C65C]" : "text-neutral-400 group-hover:text-[#B8912F]"}`}
                                >
                                  <rect x="4" y="9" width="16" height="4" rx="1" />
                                  <path d="M6 13v4M18 13v4M9 13v2M15 13v2" strokeLinecap="round" />
                                </svg>
                                <span className="text-[9px] font-bold leading-none tracking-wide">
                                  T{t.tableNumber}
                                </span>
                                <span
                                  className={`text-[7px] leading-none ${
                                    isSelected ? "text-white/70" : "text-neutral-400"
                                  }`}
                                >
                                  {t.capacity} seats
                                </span>

                                {isSelected && (
                                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#D4AF37] text-[#14532D] flex items-center justify-center shadow-sm">
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      className="w-1.5 h-1.5"
                                    >
                                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedTable && (
            <div className="relative rounded-2xl bg-gradient-to-br from-[#1a6636] to-[#0f3d20] text-white p-6 flex items-center justify-between mb-6 border border-[#D4AF37]/70 shadow-lg shadow-[#14532D]/30 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#D4AF37]/10 blur-2xl" />

              <div className="relative flex items-center gap-4">
                <span className="flex-shrink-0 w-11 h-11 rounded-full bg-[#D4AF37] text-[#14532D] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                <div>
                  <p className="text-xs text-[#E6C65C] uppercase tracking-[0.15em] font-semibold">
                    Table selected
                  </p>
                  <p className="font-display text-xl mt-1">
                    Table {selectedTable.tableNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-white/70">
                    <span>{selectedTable.capacity} seats</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="capitalize">{selectedTable.location}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTable(null)}
                className="relative text-xs font-medium text-white/60 hover:text-[#E6C65C] transition flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Clear
              </button>
            </div>
          )}

          {status.message && (
            <div
              className={`mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                status.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
              }`}
            >
              {status.message}
            </div>
          )}

          {/* CHANGED — this now moves to the food/menu + payment step instead
              of booking immediately. Booking itself happens after the deposit
              is paid there. */}
          <button
            disabled={!selectedTable}
            onClick={handleContinueToMenu}
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#1a6636] to-[#0f3d20] text-white px-8 py-3.5 font-medium hover:shadow-lg hover:shadow-[#14532D]/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none border border-[#D4AF37]/40"
          >
            Continue to menu & payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;