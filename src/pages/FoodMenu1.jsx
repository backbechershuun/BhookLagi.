import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

// Guests can pay this percentage now, or pay the full order now.
// Nothing in between, and never less than this.
const MIN_DEPOSIT_PERCENT = 40;

const PRIMARY = "#006DB7";
const DARK = "#231F20";
const INK = "#0F1111";
const SUBTLE = "#565959";
const PANEL = "#F7F8FA";
const PANEL_BORDER = "#D5D9D9";

const foodTypeBorder = {
  veg: "border-green-600",
  "non-veg": "border-red-600",
  egg: "border-amber-600",
};
const foodTypeFill = {
  veg: "bg-green-600",
  "non-veg": "bg-red-600",
  egg: "bg-amber-600",
};

// Razorpay's checkout script is loaded on demand rather than in index.html
// so pages that don't need payments don't pay for it.
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const FoodTypeIcon = ({ type }) => (
  <span
    className={`inline-flex items-center justify-center w-[14px] h-[14px] border bg-white ${
      foodTypeBorder[type] || foodTypeBorder.veg
    } flex-shrink-0`}
  >
    <span className={`w-[6px] h-[6px] rounded-full ${foodTypeFill[type] || foodTypeFill.veg}`} />
  </span>
);

// Compact +/- stepper used in the cart and the portion picker.
const Stepper = ({ qty, onIncrement, onDecrement, size = "md", full = false }) => {
  const pad = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  return (
    <div
      className={`flex items-center rounded-lg border bg-white ${pad} ${full ? "w-full justify-between" : "gap-2"}`}
      style={{ borderColor: PRIMARY }}
    >
      <button
        onClick={onDecrement}
        aria-label="Decrease quantity"
        className="w-5 text-center font-bold leading-none"
        style={{ color: PRIMARY }}
      >
        −
      </button>
      <span className="text-sm font-bold tabular-nums w-4 text-center" style={{ color: INK }}>
        {qty}
      </span>
      <button
        onClick={onIncrement}
        aria-label="Increase quantity"
        className="w-5 text-center font-bold leading-none"
        style={{ color: PRIMARY }}
      >
        +
      </button>
    </div>
  );
};

// Swiggy-style row: details on the left, image on the right with the ADD
// button overlapping the image's bottom edge.
const ProductCard = ({ item, cart, updateQty, onCustomise }) => {
  const qtyOf = (portion) => cart[portion ? `${item._id}:${portion}` : item._id]?.qty || 0;
  const totalQty = item.hasPortions ? qtyOf("half") + qtyOf("full") : qtyOf(null);

  const buttonBase =
    "absolute -bottom-4 left-1/2 -translate-x-1/2 w-[96px] h-9 rounded-lg bg-white border border-[#E4E6E8] shadow-[0_3px_8px_rgba(0,0,0,0.15)] flex items-center justify-center text-sm font-extrabold uppercase select-none";

  return (
    <div className="flex items-start justify-between gap-4 py-6">
      {/* Details */}
      <div className="min-w-0 flex-1">
        <FoodTypeIcon type={item.foodType} />
        <h3 className="mt-2 text-base font-semibold leading-snug" style={{ color: DARK }}>
          {item.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium tabular-nums" style={{ color: INK }}>
          {item.hasPortions ? `₹${item.halfPrice} – ₹${item.fullPrice}` : `₹${item.price}`}
        </p>
        {item.description && (
          <p className="mt-3 text-sm leading-relaxed line-clamp-2" style={{ color: SUBTLE }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Image + ADD */}
      <div className="relative flex-shrink-0 flex flex-col items-center">
        <div className="w-[118px] h-[118px] sm:w-[156px] sm:h-[144px] rounded-2xl overflow-hidden bg-[#F2F2F2]">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-[#D9D9D9]">🍕</div>
          )}
        </div>

        {totalQty === 0 ? (
          <button
            onClick={() => (item.hasPortions ? onCustomise(item) : updateQty(item, null, 1))}
            className={`${buttonBase} hover:bg-[#F0F7FC] transition-colors`}
            style={{ color: PRIMARY }}
          >
            Add
          </button>
        ) : item.hasPortions ? (
          <button onClick={() => onCustomise(item)} className={`${buttonBase} gap-2`} style={{ color: PRIMARY }}>
            <span style={{ color: INK }}>{totalQty}</span>
            <span className="text-base leading-none">+</span>
          </button>
        ) : (
          <div className={`${buttonBase} justify-between px-3`} style={{ color: PRIMARY }}>
            <button onClick={() => updateQty(item, null, -1)} aria-label="Decrease quantity" className="text-lg leading-none">
              −
            </button>
            <span style={{ color: INK }}>{totalQty}</span>
            <button onClick={() => updateQty(item, null, 1)} aria-label="Increase quantity" className="text-lg leading-none">
              +
            </button>
          </div>
        )}

        {item.hasPortions && <p className="mt-6 text-[11px]" style={{ color: SUBTLE }}>Customisable</p>}
      </div>
    </div>
  );
};

// Half / Full picker, opened from a "Customisable" card.
const PortionSheet = ({ item, cart, updateQty, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = [
    { portion: "half", label: "Half", price: item.halfPrice },
    { portion: "full", label: "Full", price: item.fullPrice },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center gap-2">
          <FoodTypeIcon type={item.foodType} />
          <h3 className="text-base font-bold" style={{ color: DARK }}>{item.name}</h3>
        </div>
        <p className="text-xs mt-1" style={{ color: SUBTLE }}>Choose your portion</p>

        <div className="mt-4 divide-y divide-[#E9E9EB]">
          {rows.map(({ portion, label, price }) => {
            const qty = cart[`${item._id}:${portion}`]?.qty || 0;
            return (
              <div key={portion} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: INK }}>{label}</p>
                  <p className="text-sm tabular-nums" style={{ color: SUBTLE }}>₹{price}</p>
                </div>
                {qty > 0 ? (
                  <Stepper
                    qty={qty}
                    onIncrement={() => updateQty(item, portion, 1)}
                    onDecrement={() => updateQty(item, portion, -1)}
                  />
                ) : (
                  <button
                    onClick={() => updateQty(item, portion, 1)}
                    className="w-[84px] rounded-lg border bg-white py-1.5 text-sm font-extrabold uppercase shadow-sm hover:bg-[#F0F7FC]"
                    style={{ borderColor: "#E4E6E8", color: PRIMARY }}
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

// Order + payment in one panel. Used as the always-visible right-hand sidebar
// on desktop, and inside a bottom sheet on mobile.
const CartPanel = ({
  onClose,
  restaurant,
  date,
  timeSlot,
  partySize,
  table,
  cartLines,
  updateQty,
  payFull,
  setPayFull,
  subtotal,
  depositPercent,
  depositAmount,
  status,
  paying,
  canProceed,
  onPay,
}) => {
  const totalItems = cartLines.reduce((s, l) => s + l.qty, 0);
  const balance = subtotal - depositAmount;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3.5 border-b border-[#E9E9EB] flex-shrink-0">
        <div className="min-w-0">
          <p className="text-[17px] font-bold" style={{ color: INK }}>
            Your order <span className="font-normal text-[#8B8B8B]">({totalItems})</span>
          </p>
          <p className="text-xs text-[#8B8B8B] mt-0.5 truncate">
            {restaurant?.name} · Table {table.tableNumber}
          </p>
          <p className="text-xs text-[#8B8B8B] mt-0.5">
            {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
            {timeSlot} · {partySize} guest{partySize > 1 ? "s" : ""}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="w-8 h-8 rounded-full hover:bg-[#F5F5F5] flex items-center justify-center flex-shrink-0"
            style={{ color: DARK }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Items + payment choice + summary */}
      <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">
        {cartLines.length === 0 ? (
          <p className="text-sm text-[#8B8B8B] py-8 text-center">Add dishes from the menu to get started</p>
        ) : (
          <div className="divide-y divide-[#E9E9EB]">
            {cartLines.map((l) => (
              <div key={`${l.item._id}:${l.portion || "single"}`} className="flex gap-3 py-3.5 first:pt-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F2F2F2] flex-shrink-0 border border-[#E9E9EB]">
                  {l.item.image ? (
                    <img src={l.item.image} alt={l.item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-[#D9D9D9]">🍕</div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: INK }}>
                      {l.item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {l.portion && (
                        <span
                          className="text-[11px] font-medium rounded px-1.5 py-0.5 capitalize"
                          style={{ backgroundColor: PANEL, color: SUBTLE, border: `1px solid ${PANEL_BORDER}` }}
                        >
                          {l.portion}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: SUBTLE }}>
                        ₹{l.price} each
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <Stepper
                      qty={l.qty}
                      onIncrement={() => updateQty(l.item, l.portion, 1)}
                      onDecrement={() => updateQty(l.item, l.portion, -1)}
                      size="sm"
                    />
                    <span className="text-sm font-bold tabular-nums" style={{ color: INK }}>
                      ₹{l.price * l.qty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment choice */}
        <div className="flex rounded-xl bg-[#F5F5F5] p-1 mt-5">
          <button
            type="button"
            onClick={() => setPayFull(false)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
              !payFull ? "bg-white shadow-sm" : "text-[#8B8B8B]"
            }`}
            style={!payFull ? { color: DARK } : undefined}
          >
            Pay {MIN_DEPOSIT_PERCENT}% deposit
          </button>
          <button
            type="button"
            onClick={() => setPayFull(true)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
              payFull ? "bg-white shadow-sm" : "text-[#8B8B8B]"
            }`}
            style={payFull ? { color: DARK } : undefined}
          >
            Pay full amount
          </button>
        </div>

        {/* Order summary */}
        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: PANEL, border: `1px solid ${PANEL_BORDER}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: INK }}>
            Order summary
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: SUBTLE }}>Items ({totalItems})</span>
              <span className="tabular-nums" style={{ color: INK }}>
                ₹{subtotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: SUBTLE }}>Balance due at the table</span>
              <span className="tabular-nums" style={{ color: INK }}>
                ₹{balance}
              </span>
            </div>
          </div>
          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: `1px dashed ${PANEL_BORDER}` }}
          >
            <span className="text-[15px] font-bold" style={{ color: INK }}>
              Due now {!payFull && `(${depositPercent}% deposit)`}
            </span>
            <span className="text-[19px] font-extrabold tabular-nums" style={{ color: PRIMARY }}>
              ₹{depositAmount}
            </span>
          </div>
        </div>

        {status.message && (
          <div
            className={`mt-4 rounded-xl px-3 py-2.5 text-xs ${
              status.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {status.message}
          </div>
        )}
      </div>

      {/* Pay footer */}
      <div className="px-5 py-4 border-t border-[#E9E9EB] flex-shrink-0 bg-white">
        <button
          disabled={!canProceed}
          onClick={onPay}
          className="w-full rounded-xl text-white px-6 py-3.5 font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: PRIMARY }}
        >
          {paying ? (
            "Processing…"
          ) : cartLines.length === 0 ? (
            "Add a dish to continue"
          ) : (
            <>
              Pay ₹{depositAmount} to hold table
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        <p className="text-[11px] text-center mt-3 leading-relaxed" style={{ color: SUBTLE }}>
          Table {table.tableNumber} is held once payment clears, pending the restaurant's confirmation.
        </p>
      </div>
    </div>
  );
};

// Mobile only: the same panel in a bottom sheet, opened from the cart bar.
const CartSheet = ({ onClose, ...panelProps }) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:hidden">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full bg-white rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none ${
          entered ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex justify-center pt-2.5">
          <span className="w-10 h-1 rounded-full bg-[#E9E9EB]" />
        </div>
        <CartPanel onClose={onClose} {...panelProps} />
      </div>
    </div>
  );
};

const FoodMenu = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!state?.table) {
      navigate(`/restaurants/${id}`, { replace: true });
    }
  }, [state, id, navigate]);

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [payFull, setPayFull] = useState(false);
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [portionItemId, setPortionItemId] = useState(null);

  const sectionRefs = useRef({});

  useEffect(() => {
    api
      .get(`/menu/${id}`)
      .then(({ data }) => setMenu(data))
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, [id]);

  const { restaurant, date, timeSlot, partySize, table } = state || {};

  const filteredMenu = useMemo(
    () =>
      menu.filter((item) => {
        if (vegOnly && item.foodType !== "veg") return false;
        if (search.trim() && !item.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [menu, vegOnly, search]
  );

  // All hooks are above this line — safe to bail out now.
  if (!state?.table) return null;

  const depositPercent = payFull ? 100 : MIN_DEPOSIT_PERCENT;

  const grouped = filteredMenu.reduce((acc, item) => {
    const category = item.category || "Menu";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});
  const categories = Object.keys(grouped);

  const priceFor = (item, portion) => {
    if (item.hasPortions) return portion === "half" ? item.halfPrice : item.fullPrice;
    return item.price;
  };

  const updateQty = (item, portion, delta) => {
    const key = portion ? `${item._id}:${portion}` : item._id;
    setCart((prev) => {
      const next = Math.max(0, (prev[key]?.qty || 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[key];
      else copy[key] = { itemId: item._id, portion, qty: next };
      return copy;
    });
  };

  const cartLines = Object.values(cart)
    .map(({ itemId, portion, qty }) => {
      const item = menu.find((m) => m._id === itemId);
      return item ? { item, portion, qty, price: priceFor(item, portion) } : null;
    })
    .filter(Boolean);

  const subtotal = cartLines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const totalItems = cartLines.reduce((sum, l) => sum + l.qty, 0);
  const depositAmount = Math.ceil((subtotal * depositPercent) / 100);
  const canProceed = totalItems > 0 && !paying;

  const portionItem = portionItemId ? menu.find((m) => m._id === portionItemId) : null;

  const scrollToCategory = (cat) => {
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePay = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (totalItems === 0) {
      setStatus({ type: "error", message: "Add at least one dish to order before booking the table." });
      return;
    }

    setPaying(true);
    setStatus({ type: "", message: "" });

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Could not load the payment gateway. Check your connection and try again.");

      const { data: order } = await api.post("/bookings/checkout", {
        restaurantId: id,
        tableId: table._id,
        date,
        timeSlot,
        partySize,
        payFull,
        items: cartLines.map((l) => ({
          menuItemId: l.item._id,
          portion: l.portion || undefined,
          quantity: l.qty,
        })),
      });

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: restaurant?.name || "Table booking",
        description: `${payFull ? "Full payment" : "Deposit"} for Table ${table.tableNumber}`,
        order_id: order.razorpayOrderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: PRIMARY },
        handler: async (response) => {
          try {
            await api.post(`/bookings/${order.bookingId}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            navigate("/my-bookings", {
              state: { justBooked: true, tableNumber: table.tableNumber },
            });
          } catch (err) {
            setStatus({
              type: "error",
              message:
                err.response?.data?.message ||
                "Payment went through but we couldn't confirm the booking. Please contact support.",
            });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || err.message || "Could not start payment.",
      });
      setPaying(false);
    }
  };

  const panelProps = {
    restaurant,
    date,
    timeSlot,
    partySize,
    table,
    cartLines,
    updateQty,
    payFull,
    setPayFull,
    subtotal,
    depositPercent,
    depositAmount,
    status,
    paying,
    canProceed,
    onPay: handlePay,
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 lg:pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E9E9EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="p-1 flex-shrink-0" style={{ color: DARK }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-extrabold truncate" style={{ color: DARK }}>
              {restaurant?.name || "Order food"}
            </p>
            <p className="text-xs text-[#8B8B8B]">
              Table {table.tableNumber} · {timeSlot} · {partySize} guest{partySize > 1 ? "s" : ""}
            </p>
          </div>
          <label className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
            <span className="text-xs font-semibold hidden sm:inline" style={{ color: DARK }}>
              Veg only
            </span>
            <span
              onClick={() => setVegOnly((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                vegOnly ? "bg-green-600" : "bg-[#D9D9D9]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  vegOnly ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </label>
        </div>

        {/* Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#F5F5F5] px-3.5 py-2.5 lg:max-w-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B8B8B" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for dishes"
              className="bg-transparent text-sm flex-1 outline-none placeholder:text-[#8B8B8B]"
              style={{ color: DARK }}
            />
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className="flex-shrink-0 rounded-full border-2 border-[#E9E9EB] px-4 py-1.5 text-xs font-bold hover:border-current transition-colors whitespace-nowrap"
                style={{ color: DARK }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu (left) + order & payment sidebar (right on desktop) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:items-start">
        <div className="bg-white rounded-xl px-4 sm:px-6">
          {loading ? (
            <div className="p-14 text-center text-[#8B8B8B] text-sm">Loading menu…</div>
          ) : menu.length === 0 ? (
            <div className="p-14 text-center text-[#8B8B8B] text-sm">This restaurant hasn't added a menu yet.</div>
          ) : filteredMenu.length === 0 ? (
            <div className="p-14 text-center text-[#8B8B8B] text-sm">No dishes match your search.</div>
          ) : (
            categories.map((cat) => (
              <div key={cat} ref={(el) => (sectionRefs.current[cat] = el)} className="scroll-mt-44 mb-2">
                <h2 className="text-lg font-extrabold py-4" style={{ color: DARK }}>
                  {cat} <span className="text-sm font-normal text-[#8B8B8B]">({grouped[cat].length})</span>
                </h2>
                <div className="divide-y divide-[#E9E9EB]">
                  {grouped[cat].map((item) => (
                    <ProductCard
                      key={item._id}
                      item={item}
                      cart={cart}
                      updateQty={updateQty}
                      onCustomise={(it) => setPortionItemId(it._id)}
                    />
                  ))}
                </div>
                <div className="h-2 -mx-4 sm:-mx-6 bg-[#F0F0F5] mt-2" />
              </div>
            ))
          )}
        </div>

        {/* Desktop sidebar — order and payment always visible, no cart to open */}
        <aside className="hidden lg:flex flex-col sticky top-44 max-h-[calc(100vh-12rem)] rounded-2xl border border-[#E9E9EB] bg-white shadow-sm overflow-hidden">
          <CartPanel {...panelProps} />
        </aside>
      </div>

      {/* Mobile cart bar */}
      {cartLines.length > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 text-white font-bold shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
          style={{ backgroundColor: PRIMARY }}
        >
          <span className="text-sm">
            {totalItems} item{totalItems > 1 ? "s" : ""} · ₹{subtotal}
          </span>
          <span className="flex items-center gap-1 text-sm uppercase tracking-wide">
            Review and pay
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      )}

      {cartOpen && <CartSheet onClose={() => setCartOpen(false)} {...panelProps} />}

      {portionItem && (
        <PortionSheet
          item={portionItem}
          cart={cart}
          updateQty={updateQty}
          onClose={() => setPortionItemId(null)}
        />
      )}
    </div>
  );
};

export default FoodMenu;
