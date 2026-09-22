import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios.js";

const emptyTable = { tableNumber: "", capacity: 2, location: "indoor" };
const emptyMenuItem = { name: "", price: "", category: "", description: "" };

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

  // --- Menu state ---
  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState(emptyMenuItem);
  const [menuImage, setMenuImage] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  const [addingMenuItem, setAddingMenuItem] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [editMenuItem, setEditMenuItem] = useState(emptyMenuItem);
  const [editMenuImage, setEditMenuImage] = useState(null);
  const [editMenuImagePreview, setEditMenuImagePreview] = useState(null);
  const [savingMenuItemId, setSavingMenuItemId] = useState(null);
  const [deletingMenuItemId, setDeletingMenuItemId] = useState(null);
  const [togglingMenuItemId, setTogglingMenuItemId] = useState(null);

  // --- Pre-orders (linked to bookings) ---
  const [orders, setOrders] = useState([]);
  const [expandedOrderBookingId, setExpandedOrderBookingId] = useState(null);

  const { containerRef, imgRef, box, recalc } = useImageBox();
  const bookingsSectionRef = useRef(null);

  const loadData = async () => {
    const [rRes, tRes, bRes, mRes, oRes] = await Promise.all([
      api.get(`/restaurants/${id}`),
      api.get(`/tables/${id}`),
      api.get(`/bookings/restaurant/${id}`),
      api.get(`/menu/${id}`),
      api.get(`/orders/restaurant/${id}`),
    ]);
    setRestaurant(rRes.data);
    setTables(tRes.data);
    setBookings(bRes.data);
    setMenuItems(mRes.data);
    setOrders(oRes.data);
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

  // --- Menu handlers ---

  const handleMenuImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMenuImage(file);
    setMenuImagePreview(URL.createObjectURL(file));
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setAddingMenuItem(true);
    try {
      const formData = new FormData();
      formData.append("name", newMenuItem.name);
      formData.append("price", newMenuItem.price);
      formData.append("category", newMenuItem.category);
      formData.append("description", newMenuItem.description);
      if (menuImage) formData.append("image", menuImage);

      const { data } = await api.post(`/menu/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMenuItems((prev) => [...prev, data]);
      setNewMenuItem(emptyMenuItem);
      setMenuImage(null);
      setMenuImagePreview(null);
    } finally {
      setAddingMenuItem(false);
    }
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItemId(item._id);
    setEditMenuItem({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || "",
    });
    setEditMenuImage(null);
    setEditMenuImagePreview(null);
  };

  const cancelEditMenuItem = () => {
    setEditingMenuItemId(null);
    setEditMenuItem(emptyMenuItem);
    setEditMenuImage(null);
    setEditMenuImagePreview(null);
  };

  const handleEditMenuImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditMenuImage(file);
    setEditMenuImagePreview(URL.createObjectURL(file));
  };

  const handleSaveMenuItem = async (e, itemId) => {
    e.preventDefault();
    setSavingMenuItemId(itemId);
    try {
      const formData = new FormData();
      formData.append("name", editMenuItem.name);
      formData.append("price", editMenuItem.price);
      formData.append("category", editMenuItem.category);
      formData.append("description", editMenuItem.description);
      if (editMenuImage) formData.append("image", editMenuImage);

      const { data } = await api.put(`/menu/item/${itemId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMenuItems((prev) => prev.map((m) => (m._id === itemId ? data : m)));
      cancelEditMenuItem();
    } finally {
      setSavingMenuItemId(null);
    }
  };

  const handleToggleMenuAvailability = async (itemId) => {
    setTogglingMenuItemId(itemId);
    try {
      const { data } = await api.patch(`/menu/item/${itemId}/availability`);
      setMenuItems((prev) => prev.map((m) => (m._id === itemId ? data : m)));
    } finally {
      setTogglingMenuItemId(null);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    setDeletingMenuItemId(itemId);
    try {
      await api.delete(`/menu/item/${itemId}`);
      setMenuItems((prev) => prev.filter((m) => m._id !== itemId));
    } finally {
      setDeletingMenuItemId(null);
    }
  };

  const goToPendingOrders = () => {
    setStatusFilter("pending");
    bookingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const menuByCategory = menuItems.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const ordersByBooking = orders.reduce((acc, order) => {
    acc[order.booking] = order;
    return acc;
  }, {});

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
            <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
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
            <p className="font-display text-2xl text-stone-900">{menuItems.length}</p>
            <p className="text-xs text-stone-400">Menu items</p>
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
                  src={exteriorPreview || restaurant.image || "/images/placeholder.jpg"}
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
                  src={interiorPreview || restaurant.interiorImage || "/images/placeholder.jpg"}
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
                  src={restaurant.interiorImage}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Menu
          </h2>

          {menuItems.length === 0 ? (
            <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 mb-5">
              <p className="text-stone-500 text-sm">No menu items yet — add your first dish below.</p>
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-2.5">
                    {category}
                  </p>
                  <div className="space-y-2.5">
                    {items.map((item) => {
                      const isEditing = editingMenuItemId === item._id;
                      return (
                        <div
                          key={item._id}
                          className={`rounded-2xl border bg-white p-4 shadow-sm transition-shadow ${
                            item.available ? "border-stone-200" : "border-stone-100 opacity-60"
                          }`}
                        >
                          {isEditing ? (
                            <form
                              onSubmit={(e) => handleSaveMenuItem(e, item._id)}
                              className="flex flex-wrap gap-3 items-end"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                                <img
                                  src={
                                    editMenuImagePreview ||
                                    item.image ||
                                    "/images/placeholder.jpg"
                                  }
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <label className="text-xs text-stone-500 border border-stone-200 rounded-lg px-3 py-2 cursor-pointer hover:border-[#D4AF37]/50 hover:bg-stone-50 transition-colors">
                                Change photo
                                <input type="file" accept="image/*" onChange={handleEditMenuImageChange} className="hidden" />
                              </label>
                              <div>
                                <label className="text-[11px] text-stone-400 block mb-1">Name</label>
                                <input
                                  required
                                  value={editMenuItem.name}
                                  onChange={(e) => setEditMenuItem({ ...editMenuItem, name: e.target.value })}
                                  className="w-40 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-stone-400 block mb-1">Price</label>
                                <input
                                  required
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={editMenuItem.price}
                                  onChange={(e) => setEditMenuItem({ ...editMenuItem, price: e.target.value })}
                                  className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] text-stone-400 block mb-1">Category</label>
                                <input
                                  required
                                  value={editMenuItem.category}
                                  onChange={(e) => setEditMenuItem({ ...editMenuItem, category: e.target.value })}
                                  className="w-32 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                />
                              </div>
                              <div className="flex-1 min-w-[10rem]">
                                <label className="text-[11px] text-stone-400 block mb-1">Description</label>
                                <input
                                  value={editMenuItem.description}
                                  onChange={(e) => setEditMenuItem({ ...editMenuItem, description: e.target.value })}
                                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={savingMenuItemId === item._id}
                                  className="rounded-lg bg-gradient-to-r from-stone-900 to-stone-700 text-white px-4 py-2 text-sm font-medium hover:from-stone-800 hover:to-stone-600 disabled:opacity-50 shadow-sm transition-all"
                                >
                                  {savingMenuItemId === item._id ? "Saving…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditMenuItem}
                                  className="rounded-lg border border-stone-200 text-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-50 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="w-full h-full flex items-center justify-center text-lg text-stone-300">
                                      🍴
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-stone-900 truncate">{item.name}</p>
                                    {!item.available && (
                                      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 ring-1 ring-stone-200">
                                        86'd
                                      </span>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-stone-500 truncate max-w-sm">{item.description}</p>
                                  )}
                                  <p className="text-sm text-stone-700 font-medium mt-0.5">
                                    ${Number(item.price).toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => handleToggleMenuAvailability(item._id)}
                                  disabled={togglingMenuItemId === item._id}
                                  className={`text-xs font-medium rounded-lg px-3 py-2 border transition-colors disabled:opacity-50 ${
                                    item.available
                                      ? "border-stone-200 text-stone-600 hover:bg-stone-50"
                                      : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  {item.available ? "86 it" : "Bring back"}
                                </button>
                                <button
                                  onClick={() => startEditMenuItem(item)}
                                  className="text-xs font-medium rounded-lg border border-stone-200 text-stone-600 px-3 py-2 hover:bg-stone-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenuItem(item._id)}
                                  disabled={deletingMenuItemId === item._id}
                                  className="text-xs font-medium rounded-lg bg-red-50 text-red-600 px-3 py-2 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                >
                                  {deletingMenuItemId === item._id ? "Removing…" : "Delete"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAddMenuItem}
            className="flex flex-wrap gap-3 items-end rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Photo</label>
              <label className="flex items-center justify-center w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
                {menuImagePreview ? (
                  <img src={menuImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-stone-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <input type="file" accept="image/*" onChange={handleMenuImageChange} className="hidden" />
              </label>
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Name</label>
              <input
                required
                placeholder="e.g. Burrata"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                className="w-40 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Price</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={newMenuItem.price}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                className="w-24 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Category</label>
              <input
                required
                placeholder="e.g. Starters"
                value={newMenuItem.category}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                className="w-32 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <div className="flex-1 min-w-[10rem]">
              <label className="text-[11px] text-stone-400 block mb-1">Description</label>
              <input
                placeholder="Optional"
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
              />
            </div>
            <button
              disabled={addingMenuItem}
              className="rounded-lg bg-gradient-to-r from-stone-900 to-stone-700 text-white px-5 py-2 text-sm font-medium hover:from-stone-800 hover:to-stone-600 disabled:opacity-50 shadow-sm transition-all"
            >
              {addingMenuItem ? "Adding…" : "Add dish"}
            </button>
          </form>
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

                    {ordersByBooking[b._id] && (
                      <div className="mt-4 pt-4 border-t border-stone-100">
                        {(() => {
                          const order = ordersByBooking[b._id];
                          const isExpanded = expandedOrderBookingId === b._id;
                          return (
                            <>
                              <button
                                onClick={() =>
                                  setExpandedOrderBookingId(isExpanded ? null : b._id)
                                }
                                className="w-full flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="inline-flex items-center gap-2 text-stone-700">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-amber-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m-9-4h9m-9 4a2 2 0 100 4 2 2 0 000-4zm9 4a2 2 0 100 4 2 2 0 000-4z" />
                                  </svg>
                                  Pre-ordered · {order.items.length} item{order.items.length === 1 ? "" : "s"} ·
                                  <span className="font-medium text-stone-900">
                                    ${order.totalPrice.toFixed(2)}
                                  </span>
                                </span>
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`w-4 h-4 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {isExpanded && (
                                <div className="mt-3 space-y-1.5">
                                  {order.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm text-stone-600"
                                    >
                                      <span>
                                        {item.quantity}× {item.name}
                                      </span>
                                      <span className="tabular-nums">
                                        ${(item.price * item.quantity).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                  {order.notes && (
                                    <p className="text-xs text-stone-500 italic mt-2 pt-2 border-t border-stone-100">
                                      Note: {order.notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RestaurantManage;
