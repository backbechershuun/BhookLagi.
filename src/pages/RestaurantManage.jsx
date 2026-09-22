import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";

const BACKEND_URL = "http://localhost:5000";
const emptyTable = { tableNumber: "", capacity: 2, location: "indoor" };
const emptyMenuItem = {
  name: "",
  category: "",
  foodType: "veg",
  description: "",
  hasPortions: false,
  price: "",
  halfPrice: "",
  fullPrice: "",
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-red-50 text-red-600 ring-1 ring-red-200",
  completed: "bg-stone-100 text-stone-500 ring-1 ring-stone-200",
};

const statusDot = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  cancelled: "bg-red-500",
  completed: "bg-stone-400",
};

const filterTabs = [
  { key: "all", label: "All" },
  { key: "cancelled", label: "Cancelled" },
];

const nextActions = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const statusFilterButtons = [
  {
    key: "pending",
    label: "Pending",
    active: "bg-amber-500 border-amber-500 text-white shadow-sm",
    idle: "bg-white border-amber-200 text-amber-700 hover:bg-amber-50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    key: "confirmed",
    label: "Confirmed",
    active: "bg-emerald-600 border-emerald-600 text-white shadow-sm",
    idle: "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    key: "completed",
    label: "Completed",
    active: "bg-stone-800 border-stone-800 text-white shadow-sm",
    idle: "bg-white border-stone-200 text-stone-600 hover:bg-stone-50",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

// A booking's order can come back from the API under a few different
// shapes depending on how it was populated — this normalizes them so the
// UI doesn't care which one the backend sent.
const getOrderItems = (b) => {
  const raw = b.items || b.orderItems || b.menuItems || [];
  return raw.map((it) => ({
    name: it.name || it.menuItem?.name || it.menuItemId?.name || "Item",
    portion: it.portion || null,
    quantity: it.quantity || it.qty || 1,
    price: it.price ?? it.unitPrice ?? it.menuItem?.price ?? null,
  }));
};

const getOrderTotal = (b, items) => {
  if (b.totalAmount != null) return b.totalAmount;
  if (b.orderTotal != null) return b.orderTotal;
  if (b.subtotal != null) return b.subtotal;
  if (items.length && items.every((it) => it.price != null)) {
    return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  }
  return null;
};

const getAmountPaid = (b, total) => {
  if (b.amountPaid != null) return b.amountPaid;
  if (b.paidAmount != null) return b.paidAmount;
  if (b.depositAmount != null) return b.depositAmount;
  if (b.payFull && total != null) return total;
  return null;
};

// Printable bill for a single booking — shown as an overlay, printable via
// the browser's print dialog (which also covers "save as PDF").
const BillModal = ({ booking, restaurant, onClose }) => {
  const orderItems = getOrderItems(booking);
  const orderTotal = getOrderTotal(booking, orderItems);
  const amountPaid = getAmountPaid(booking, orderTotal);
  const balanceDue = orderTotal != null && amountPaid != null ? orderTotal - amountPaid : null;
  const billNumber = booking._id ? booking._id.slice(-6).toUpperCase() : "—";
  const issuedOn = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-bill, .printable-bill * { visibility: visible; }
          .printable-bill {
            position: absolute;
            inset: 0;
            margin: 0;
            width: 100%;
            max-width: none;
            max-height: none;
            box-shadow: none;
            border-radius: 0;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 no-print" onClick={onClose} />
        <div className="printable-bill relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-display text-xl text-stone-900">{restaurant?.name}</p>
                {restaurant?.city && <p className="text-xs text-stone-400 mt-0.5">{restaurant.city}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] uppercase tracking-wide text-stone-400">Bill</p>
                <p className="text-sm font-semibold text-stone-700">#{billNumber}</p>
              </div>
            </div>

            <div className="flex items-start justify-between text-sm text-stone-500 border-y border-dashed border-stone-200 py-3 mb-4">
              <div>
                <p className="text-stone-900 font-medium">{booking.user?.name}</p>
                <p>
                  Table {booking.table?.tableNumber} · {booking.partySize} guest
                  {booking.partySize > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p>{booking.date}</p>
                <p>{booking.timeSlot}</p>
              </div>
            </div>

            {orderItems.length > 0 ? (
              <div className="space-y-2 mb-4">
                {orderItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm gap-3">
                    <span className="text-stone-700 min-w-0">
                      {it.name}
                      {it.portion && <span className="text-stone-400 capitalize"> ({it.portion})</span>}
                      <span className="text-stone-400"> × {it.quantity}</span>
                    </span>
                    {it.price != null && (
                      <span className="tabular-nums text-stone-600 flex-shrink-0">₹{it.price * it.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-4">No itemized order on this booking.</p>
            )}

            <div className="border-t border-stone-200 pt-3 space-y-1.5 text-sm">
              {orderTotal != null && (
                <div className="flex items-center justify-between text-stone-600">
                  <span>Order total</span>
                  <span className="tabular-nums">₹{orderTotal}</span>
                </div>
              )}
              {amountPaid != null && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Paid</span>
                  <span className="tabular-nums">− ₹{amountPaid}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-bold text-stone-900 pt-1.5 border-t border-dashed border-stone-200">
                <span>{balanceDue != null ? "Balance due" : "Total"}</span>
                <span className="tabular-nums">₹{balanceDue != null ? balanceDue : orderTotal ?? 0}</span>
              </div>
            </div>

            <p className="text-center text-[11px] text-stone-400 mt-6">
              Issued {issuedOn} · Thank you for dining with us
            </p>
          </div>

          <div className="no-print flex gap-2 px-6 pb-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-stone-200 text-stone-600 py-2.5 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-lg bg-stone-900 text-white py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

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

const RestaurantManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [menu, setMenu] = useState([]);
  const [newTable, setNewTable] = useState(emptyTable);
  const [loading, setLoading] = useState(true);

  const [exteriorImage, setExteriorImage] = useState(null);
  const [exteriorPreview, setExteriorPreview] = useState(null);
  const [uploadingExterior, setUploadingExterior] = useState(false);

  const [interiorImage, setInteriorImage] = useState(null);
  const [interiorPreview, setInteriorPreview] = useState(null);
  const [uploadingInterior, setUploadingInterior] = useState(false);

  const [pendingPosition, setPendingPosition] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [billBooking, setBillBooking] = useState(null);
  const [addItemDraft, setAddItemDraft] = useState({ menuItemId: "", portion: "full", quantity: 1 });
  const [addingItem, setAddingItem] = useState(false);

  // Menu
  const [menuItem, setMenuItem] = useState(emptyMenuItem);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [savingMenuItem, setSavingMenuItem] = useState(false);
  const [menuStatus, setMenuStatus] = useState({ type: "", message: "" });
  const [menuImage, setMenuImage] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(null);

  const { containerRef, imgRef, box, recalc } = useImageBox();
  const bookingsSectionRef = useRef(null);

  const loadData = async () => {
    const [rRes, tRes, bRes, mRes] = await Promise.all([
      api.get(`/restaurants/${id}`),
      api.get(`/tables/${id}`),
      api.get(`/bookings/restaurant/${id}`),
      api.get(`/menu/${id}`),
    ]);
    setRestaurant(rRes.data);
    setTables(tRes.data);
    setBookings(bRes.data);
    setMenu(mRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleImageClick = (e) => {
    if (!box.width || !box.height) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    const xInImage = clickX - box.offsetX;
    const yInImage = clickY - box.offsetY;

    if (xInImage < 0 || xInImage > box.width || yInImage < 0 || yInImage > box.height) return;

    const x = (xInImage / box.width) * 100;
    const y = (yInImage / box.height) * 100;
    setPendingPosition({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    const payload = {
      ...newTable,
      positionX: pendingPosition?.x ?? null,
      positionY: pendingPosition?.y ?? null,
    };
    const { data } = await api.post(`/tables/${id}`, payload);
    setTables((prev) => [...prev, data]);
    setNewTable(emptyTable);
    setPendingPosition(null);
  };

  const updateBookingStatus = async (bookingId, status) => {
    setUpdatingBookingId(bookingId);
    await api.patch(`/bookings/${bookingId}/status`, { status });
    await loadData();
    setUpdatingBookingId(null);
  };

  const handleExteriorImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExteriorImage(file);
    setExteriorPreview(URL.createObjectURL(file));
  };

  const handleExteriorImageUpload = async () => {
    if (!exteriorImage) return;
    setUploadingExterior(true);
    try {
      const formData = new FormData();
      formData.append("image", exteriorImage);
      const { data } = await api.put(`/restaurants/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRestaurant(data);
      setExteriorImage(null);
      setExteriorPreview(null);
    } finally {
      setUploadingExterior(false);
    }
  };

  const handleInteriorImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setInteriorImage(file);
    setInteriorPreview(URL.createObjectURL(file));
  };

  const handleInteriorImageUpload = async () => {
    if (!interiorImage) return;
    setUploadingInterior(true);
    try {
      const formData = new FormData();
      formData.append("interiorImage", interiorImage);
      const { data } = await api.put(`/restaurants/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRestaurant(data);
      setInteriorImage(null);
      setInteriorPreview(null);
    } finally {
      setUploadingInterior(false);
    }
  };

  const goToPendingOrders = () => {
    setStatusFilter("pending");
    bookingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // A guest ordering more food at the table, added by staff here so it
  // flows straight into that booking's bill. Tries to persist it to the
  // backend first; if that route doesn't exist yet, applies it locally
  // (recalculating the order total from the item list) so billing still
  // works while the backend endpoint is being wired up.
  const addExtraOrderItem = async (booking) => {
    const menuItemData = menu.find((m) => m._id === addItemDraft.menuItemId);
    if (!menuItemData) return;

    const price = menuItemData.hasPortions
      ? addItemDraft.portion === "half"
        ? menuItemData.halfPrice
        : menuItemData.fullPrice
      : menuItemData.price;

    const newItem = {
      name: menuItemData.name,
      portion: menuItemData.hasPortions ? addItemDraft.portion : null,
      quantity: addItemDraft.quantity,
      price,
      menuItemId: menuItemData._id,
    };

    setAddingItem(true);
    try {
      const { data } = await api.post(`/bookings/${booking._id}/items`, newItem);
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? data : b)));
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b._id !== booking._id) return b;
          const items = [...getOrderItems(b), newItem];
          return { ...b, items, totalAmount: undefined, orderTotal: undefined, subtotal: undefined };
        })
      );
    } finally {
      setAddingItem(false);
      setAddItemDraft({ menuItemId: "", portion: "full", quantity: 1 });
    }
  };

  // ---- Menu handlers ----
  const groupedMenu = menu.reduce((acc, item) => {
    const category = item.category || "Menu";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const resetMenuForm = () => {
    setMenuItem(emptyMenuItem);
    setEditingMenuItemId(null);
    setMenuImage(null);
    setMenuImagePreview(null);
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItemId(item._id);
    setMenuItem({
      name: item.name,
      category: item.category || "",
      foodType: item.foodType || "veg",
      description: item.description || "",
      hasPortions: !!item.hasPortions,
      price: item.hasPortions ? "" : item.price,
      halfPrice: item.halfPrice ?? "",
      fullPrice: item.fullPrice ?? "",
    });
    setMenuImage(null);
    setMenuImagePreview(item.image ? `${BACKEND_URL}${item.image}` : null);
  };

  const handleMenuImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMenuImage(file);
    setMenuImagePreview(URL.createObjectURL(file));
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuItem.name.trim() || !menuItem.category.trim()) {
      setMenuStatus({ type: "error", message: "Give the dish a name and a category." });
      return;
    }
    if (menuItem.hasPortions) {
      if (menuItem.halfPrice === "" || menuItem.fullPrice === "") {
        setMenuStatus({ type: "error", message: "Enter both a half and a full price." });
        return;
      }
    } else if (menuItem.price === "" || Number(menuItem.price) < 0) {
      setMenuStatus({ type: "error", message: "Enter a valid price." });
      return;
    }

    setSavingMenuItem(true);
    setMenuStatus({ type: "", message: "" });
    try {
      const formData = new FormData();
      formData.append("name", menuItem.name.trim());
      formData.append("category", menuItem.category.trim());
      formData.append("foodType", menuItem.foodType);
      formData.append("description", menuItem.description.trim());
      formData.append("hasPortions", menuItem.hasPortions);
      if (menuItem.hasPortions) {
        formData.append("halfPrice", Number(menuItem.halfPrice));
        formData.append("fullPrice", Number(menuItem.fullPrice));
      } else {
        formData.append("price", Number(menuItem.price));
      }
      if (menuImage) formData.append("image", menuImage);

      if (editingMenuItemId) {
        const { data } = await api.put(`/menu/item/${editingMenuItemId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMenu((prev) => prev.map((m) => (m._id === editingMenuItemId ? data : m)));
        setMenuStatus({ type: "success", message: "Dish updated." });
      } else {
        const { data } = await api.post(`/menu/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMenu((prev) => [...prev, data]);
        setMenuStatus({ type: "success", message: "Dish added to the menu." });
      }

      resetMenuForm();
    } catch (err) {
      setMenuStatus({
        type: "error",
        message: err.response?.data?.message || "Could not save this dish.",
      });
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Remove this dish from the menu?")) return;
    try {
      await api.delete(`/menu/item/${itemId}`);
      setMenu((prev) => prev.filter((m) => m._id !== itemId));
      if (editingMenuItemId === itemId) resetMenuForm();
    } catch (err) {
      setMenuStatus({
        type: "error",
        message: err.response?.data?.message || "Could not remove this dish.",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="h-6 w-32 bg-stone-100 rounded-lg animate-pulse mb-6" />
        <div className="h-10 w-64 bg-stone-100 rounded-lg animate-pulse mb-10" />
        <div className="space-y-4">
          <div className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
          <div className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return <p className="max-w-6xl mx-auto px-6 py-12 text-stone-500">Restaurant not found.</p>;
  }

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const visibleBookings =
    statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link
        to="/owner"
        className="group inline-flex items-center gap-2 text-sm text-stone-500 hover:text-amber-600 transition mb-6"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All restaurants
      </Link>

      {/* Header card with photo, name, and quick stats */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 mb-10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center ring-2 ring-[#D4AF37]/20">
          {restaurant.image ? (
            <img src={`${BACKEND_URL}${restaurant.image}`} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-stone-300">🍽️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-1">
            Managing
          </p>
          <h1 className="font-display text-3xl text-stone-900 truncate">{restaurant.name}</h1>
          <p className="text-stone-500 text-sm mt-0.5">{restaurant.city}</p>
        </div>

        <div className="flex gap-6 sm:pl-6 sm:border-l border-stone-100 w-full sm:w-auto justify-between sm:justify-start">
          <div className="text-center">
            <p className="font-display text-2xl text-stone-900">{tables.length}</p>
            <p className="text-xs text-stone-400">Tables</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-stone-900">{menu.length}</p>
            <p className="text-xs text-stone-400">Dishes</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-stone-900">{bookings.length}</p>
            <p className="text-xs text-stone-400">Bookings</p>
          </div>
          <div className="text-center relative">
            <p className="font-display text-2xl text-stone-900">{pendingCount}</p>
            <p className="text-xs text-stone-400">Pending</p>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </div>
        </div>

        {/* Quick jump straight to the orders that need a decision */}
        <button
          onClick={goToPendingOrders}
          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 text-white px-5 py-3 text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm"
        >
          Review orders
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-[11px] font-semibold text-stone-900">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="space-y-12">
        {/* Photos */}
        <section>
          <h2 className="font-display text-xl text-stone-900 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photos
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-36 rounded-xl overflow-hidden mb-4 bg-stone-100">
                <img
                  src={exteriorPreview || (restaurant.image ? `${BACKEND_URL}${restaurant.image}` : "/images/placeholder.jpg")}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-stone-600 px-2 py-1 rounded-full">
                  Exterior
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-3">Shown on restaurant cards and the top of the detail page.</p>
              <label className="flex items-center justify-center gap-2 text-sm text-stone-600 border border-stone-200 rounded-xl py-2.5 cursor-pointer hover:border-[#D4AF37]/50 hover:bg-stone-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Choose photo
                <input type="file" accept="image/*" onChange={handleExteriorImageChange} className="hidden" />
              </label>
              {exteriorImage && (
                <button
                  onClick={handleExteriorImageUpload}
                  disabled={uploadingExterior}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-700 text-white py-2.5 text-sm font-medium hover:from-stone-800 hover:to-stone-600 disabled:opacity-50 shadow-sm transition-all"
                >
                  {uploadingExterior ? "Uploading…" : "Save photo"}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-36 rounded-xl overflow-hidden mb-4 bg-stone-100">
                <img
                  src={interiorPreview || (restaurant.interiorImage ? `${BACKEND_URL}${restaurant.interiorImage}` : "/images/placeholder.jpg")}
                  alt={`${restaurant.name} interior`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-white/90 backdrop-blur-sm text-stone-600 px-2 py-1 rounded-full">
                  Interior
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-3">Shown in the "closer look" section, and used for placing tables below.</p>
              <label className="flex items-center justify-center gap-2 text-sm text-stone-600 border border-stone-200 rounded-xl py-2.5 cursor-pointer hover:border-[#D4AF37]/50 hover:bg-stone-50 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Choose photo
                <input type="file" accept="image/*" onChange={handleInteriorImageChange} className="hidden" />
              </label>
              {interiorImage && (
                <button
                  onClick={handleInteriorImageUpload}
                  disabled={uploadingInterior}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-stone-900 to-stone-700 text-white py-2.5 text-sm font-medium hover:from-stone-800 hover:to-stone-600 disabled:opacity-50 shadow-sm transition-all"
                >
                  {uploadingInterior ? "Uploading…" : "Save photo"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tables */}
        <section>
          <h2 className="font-display text-xl text-stone-900 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-stone-400">
              <rect x="3" y="4" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
            </svg>
            Tables
          </h2>

          {restaurant.interiorImage && (
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-stone-700 mb-3">
                Click on the photo where the next table sits, then fill in its details and click "Add table"
              </p>
              <div
                ref={containerRef}
                className="relative rounded-xl overflow-hidden border border-stone-200 cursor-crosshair"
                onClick={handleImageClick}
              >
                <img
                  ref={imgRef}
                  src={`${BACKEND_URL}${restaurant.interiorImage}`}
                  alt="Interior layout"
                  onLoad={recalc}
                  className="w-full h-80 object-contain bg-stone-900 pointer-events-none"
                />

                {pendingPosition && box.width > 0 && (
                  <span
                    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 border-2 border-white shadow-lg animate-pulse"
                    style={{
                      left: box.offsetX + (pendingPosition.x / 100) * box.width,
                      top: box.offsetY + (pendingPosition.y / 100) * box.height,
                    }}
                  />
                )}

                {box.width > 0 &&
                  tables
                    .filter((t) => t.positionX != null && t.positionY != null)
                    .map((t) => (
                      <span
                        key={t._id}
                        className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-900/90 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white shadow-md"
                        style={{
                          left: box.offsetX + (t.positionX / 100) * box.width,
                          top: box.offsetY + (t.positionY / 100) * box.height,
                        }}
                      >
                        T{t.tableNumber}
                      </span>
                    ))}
              </div>
              {pendingPosition && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Position set — fill in table details and click "Add table" to save.
                </p>
              )}
            </div>
          )}

          {tables.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-5">
              {tables.map((t) => (
                <span
                  key={t._id}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-semibold flex items-center justify-center">
                    {t.tableNumber}
                  </span>
                  seats {t.capacity} · <span className="capitalize text-stone-500">{t.location}</span>
                  {t.positionX != null && (
                    <span className="text-amber-500" title="Positioned on interior photo">📍</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAddTable}
            className="flex flex-wrap gap-3 items-end rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Table #</label>
              <input
                required
                placeholder="e.g. 5"
                value={newTable.tableNumber}
                onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Capacity</label>
              <input
                required
                type="number"
                min={1}
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Location</label>
              <select
                value={newTable.location}
                onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="rooftop">Rooftop</option>
                <option value="private">Private</option>
              </select>
            </div>
            <button className="rounded-lg bg-gradient-to-r from-stone-900 to-stone-700 text-white px-5 py-2 text-sm font-medium hover:from-stone-800 hover:to-stone-600 shadow-sm transition-all">
              Add table
            </button>
          </form>
        </section>

        {/* Menu */}
        <section>
          <h2 className="font-display text-xl text-stone-900 mb-4 flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            Menu
          </h2>
          <p className="text-sm text-stone-500 mb-4">
            Dishes added here show up when a guest books a table and orders ahead.
          </p>

          <form
            onSubmit={handleMenuSubmit}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm mb-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-700">
                {editingMenuItemId ? "Edit dish" : "Add a dish"}
              </p>
              {editingMenuItemId && (
                <button
                  type="button"
                  onClick={resetMenuForm}
                  className="text-xs font-medium text-stone-400 hover:text-amber-600 transition"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 flex items-center justify-center">
                  {menuImagePreview ? (
                    <img src={menuImagePreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-stone-300 text-2xl">🍽️</span>
                  )}
                </div>
                <label className="mt-2 block text-center text-[11px] font-medium text-stone-500 hover:text-amber-600 cursor-pointer transition">
                  {menuImagePreview ? "Change" : "Add photo"}
                  <input type="file" accept="image/*" onChange={handleMenuImageChange} className="hidden" />
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Dish name</label>
                  <input
                    value={menuItem.name}
                    onChange={(e) => setMenuItem((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Paneer Butter Masala"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Category</label>
                  <input
                    value={menuItem.category}
                    onChange={(e) => setMenuItem((f) => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Mains, Starters"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Type</label>
                  <select
                    value={menuItem.foodType}
                    onChange={(e) => setMenuItem((f) => ({ ...f, foodType: e.target.value }))}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-veg</option>
                    <option value="egg">Egg</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-stone-600 select-none">
                    <input
                      type="checkbox"
                      checked={menuItem.hasPortions}
                      onChange={(e) =>
                        setMenuItem((f) => ({ ...f, hasPortions: e.target.checked }))
                      }
                      className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                    />
                    Has half & full portions
                  </label>
                </div>
              </div>
            </div>

            {menuItem.hasPortions ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Half price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={menuItem.halfPrice}
                    onChange={(e) => setMenuItem((f) => ({ ...f, halfPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-400 block mb-1">Full price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={menuItem.fullPrice}
                    onChange={(e) => setMenuItem((f) => ({ ...f, fullPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                  />
                </div>
              </div>
            ) : (
              <div className="sm:w-1/2">
                <label className="text-[11px] text-stone-400 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={menuItem.price}
                  onChange={(e) => setMenuItem((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Description (optional)</label>
              <textarea
                value={menuItem.description}
                onChange={(e) => setMenuItem((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="A short line guests will see under the dish name"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow resize-none"
              />
            </div>

            {menuStatus.message && (
              <div
                className={`rounded-lg px-3 py-2 text-xs ${
                  menuStatus.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {menuStatus.message}
              </div>
            )}

            <button
              type="submit"
              disabled={savingMenuItem}
              className="rounded-lg bg-gradient-to-r from-stone-900 to-stone-700 text-white px-5 py-2 text-sm font-medium hover:from-stone-800 hover:to-stone-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {savingMenuItem ? "Saving…" : editingMenuItemId ? "Save changes" : "Add dish"}
            </button>
          </form>

          {menu.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
              <p className="text-stone-500 text-sm">No dishes yet — add your first one above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-2">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img src={`${BACKEND_URL}${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-stone-300 text-lg">🍽️</span>
                            )}
                          </div>
                          <span
                            className={`mt-1 flex-shrink-0 w-3 h-3 rounded-sm border flex items-center justify-center ${
                              item.foodType === "non-veg"
                                ? "border-red-500"
                                : item.foodType === "egg"
                                ? "border-amber-500"
                                : "border-emerald-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.foodType === "non-veg"
                                  ? "bg-red-500"
                                  : item.foodType === "egg"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{item.description}</p>
                            )}
                            <p className="text-sm text-stone-600 mt-1">
                              {item.hasPortions ? (
                                <>Half ₹{item.halfPrice} · Full ₹{item.fullPrice}</>
                              ) : (
                                <>₹{item.price}</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button
                            onClick={() => startEditMenuItem(item)}
                            className="text-xs font-medium text-stone-400 hover:text-amber-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="text-xs font-medium text-stone-400 hover:text-red-600 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bookings */}
        <section ref={bookingsSectionRef} className="scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <h2 className="font-display text-xl text-stone-900 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-stone-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bookings
            </h2>

            <div className="flex items-center gap-1.5 rounded-full bg-stone-100/80 p-1">
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
                    className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-stone-900 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] tabular-nums ${
                        active ? "text-white/70" : "text-stone-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status buttons — click one to clear the list down to just that status */}
          <div className="flex flex-wrap gap-2.5 mb-5">
            {statusFilterButtons.map((btn) => {
              const count = bookings.filter((b) => b.status === btn.key).length;
              const active = statusFilter === btn.key;
              return (
                <button
                  key={btn.key}
                  onClick={() => setStatusFilter(active ? "all" : btn.key)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    active ? btn.active : btn.idle
                  }`}
                >
                  {btn.icon}
                  {btn.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                      active ? "bg-white/20" : "bg-black/5"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {visibleBookings.length === 0 ? (
            <div className="text-center py-14 px-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
              <p className="text-stone-500 text-sm">
                {statusFilter === "all" ? "No bookings yet." : `No ${statusFilter} bookings.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleBookings.map((b) => {
                const guestInitials = b.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const isPending = b.status === "pending";
                const allowed = nextActions[b.status] || [];

                const orderItems = getOrderItems(b);
                const orderTotal = getOrderTotal(b, orderItems);
                const amountPaid = getAmountPaid(b, orderTotal);
                const isExpanded = expandedBookingId === b._id;

                return (
                  <div
                    key={b._id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${
                      isPending ? "border-amber-200 ring-1 ring-amber-100" : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <span className="w-11 h-11 rounded-full bg-gradient-to-br from-stone-800 to-stone-950 text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-[#D4AF37]/20">
                          {guestInitials || "?"}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-stone-900 truncate">{b.user?.name}</p>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[b.status]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot[b.status]}`} />
                              {b.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-stone-500">
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-stone-400">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                              </svg>
                              {b.date}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-stone-400">
                                <circle cx="12" cy="12" r="9" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                              </svg>
                              {b.timeSlot}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-stone-400">
                                <rect x="3" y="4" width="18" height="16" rx="2" />
                                <path strokeLinecap="round" d="M3 10h18" />
                              </svg>
                              Table {b.table?.tableNumber}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-stone-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-6.13a3 3 0 11-6 0 3 3 0 016 0zm6 3a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {b.partySize} guests
                            </span>
                          </div>

                          {/* Payment strip — shows what they've paid vs. the order, and lets staff add dine-in orders */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            {amountPaid != null && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 py-1">
                                Paid ₹{amountPaid}
                                {orderTotal != null && orderTotal !== amountPaid && (
                                  <span className="font-normal text-emerald-600/70">of ₹{orderTotal}</span>
                                )}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setExpandedBookingId(isExpanded ? null : b._id);
                                setAddItemDraft({ menuItemId: "", portion: "full", quantity: 1 });
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-amber-600 transition"
                            >
                              {isExpanded
                                ? "Hide order"
                                : orderItems.length > 0
                                ? `View order (${orderItems.length})`
                                : "Add order"}
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setBillBooking(b)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full border border-stone-200 text-stone-600 px-2.5 py-1 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6M9 11h6M9 15h4M5 3h14a1 1 0 011 1v16l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 011-1z" />
                              </svg>
                              Bill
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 space-y-1.5">
                              {orderItems.length > 0 ? (
                                <>
                                  {orderItems.map((it, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                      <span className="text-stone-700">
                                        {it.quantity}× {it.name}
                                        {it.portion && (
                                          <span className="text-stone-400 capitalize"> ({it.portion})</span>
                                        )}
                                      </span>
                                      {it.price != null && (
                                        <span className="text-stone-500 tabular-nums">₹{it.price * it.quantity}</span>
                                      )}
                                    </div>
                                  ))}
                                  {orderTotal != null && (
                                    <div className="flex items-center justify-between text-sm font-semibold pt-1.5 mt-1.5 border-t border-dashed border-stone-200">
                                      <span className="text-stone-700">Order total</span>
                                      <span className="text-stone-900 tabular-nums">₹{orderTotal}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-stone-400 text-center py-1.5">
                                  No items yet — add what they order at the table below.
                                </p>
                              )}

                              {/* Dine-in ordering — whatever's added here rolls into this booking's bill */}
                              <div className="pt-2 mt-2 border-t border-dashed border-stone-200">
                                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-2">
                                  Add item ordered at the table
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    value={addItemDraft.menuItemId}
                                    onChange={(e) =>
                                      setAddItemDraft((d) => ({ ...d, menuItemId: e.target.value, portion: "full" }))
                                    }
                                    className="flex-1 min-w-[140px] rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                  >
                                    <option value="">Choose a dish…</option>
                                    {menu.map((m) => (
                                      <option key={m._id} value={m._id}>
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>

                                  {menu.find((m) => m._id === addItemDraft.menuItemId)?.hasPortions && (
                                    <select
                                      value={addItemDraft.portion}
                                      onChange={(e) => setAddItemDraft((d) => ({ ...d, portion: e.target.value }))}
                                      className="rounded-lg border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                    >
                                      <option value="half">Half</option>
                                      <option value="full">Full</option>
                                    </select>
                                  )}

                                  <input
                                    type="number"
                                    min={1}
                                    value={addItemDraft.quantity}
                                    onChange={(e) =>
                                      setAddItemDraft((d) => ({ ...d, quantity: Math.max(1, Number(e.target.value)) }))
                                    }
                                    className="w-14 rounded-lg border border-stone-200 px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                  />

                                  <button
                                    onClick={() => addExtraOrderItem(b)}
                                    disabled={!addItemDraft.menuItemId || addingItem}
                                    className="rounded-lg bg-stone-900 text-white px-3 py-1.5 text-xs font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {addingItem ? "Adding…" : "Add to bill"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {allowed.length > 0 && (
                        <div className="flex gap-2 flex-shrink-0">
                          {allowed.includes("confirmed") && (
                            <button
                              onClick={() => updateBookingStatus(b._id, "confirmed")}
                              disabled={updatingBookingId === b._id}
                              className="text-xs font-medium rounded-lg bg-emerald-600 text-white px-3.5 py-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                          {allowed.includes("completed") && (
                            <button
                              onClick={() => updateBookingStatus(b._id, "completed")}
                              disabled={updatingBookingId === b._id}
                              className="text-xs font-medium rounded-lg bg-stone-800 text-white px-3.5 py-2 hover:bg-stone-900 disabled:opacity-50 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {allowed.includes("cancelled") && (
                            <button
                              onClick={() => updateBookingStatus(b._id, "cancelled")}
                              disabled={updatingBookingId === b._id}
                              className="text-xs font-medium rounded-lg bg-red-50 text-red-600 px-3.5 py-2 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {billBooking && (
        <BillModal booking={billBooking} restaurant={restaurant} onClose={() => setBillBooking(null)} />
      )}
    </div>
  );
};

export default RestaurantManage;