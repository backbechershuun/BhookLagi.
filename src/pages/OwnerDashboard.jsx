import { useEffect, useState, useRef } from "react";
import api from "../api/axios.js";

const BACKEND_URL = "http://localhost:5000";
const emptyRestaurant = { name: "", city: "", address: "", cuisine: "", description: "" };
const emptyTable = { tableNumber: "", capacity: 2, location: "indoor" };

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

const OwnerDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState(emptyRestaurant);
  const [newTable, setNewTable] = useState(emptyTable);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const [exteriorImage, setExteriorImage] = useState(null);
  const [exteriorPreview, setExteriorPreview] = useState(null);
  const [uploadingExterior, setUploadingExterior] = useState(false);

  const [interiorImage, setInteriorImage] = useState(null);
  const [interiorPreview, setInteriorPreview] = useState(null);
  const [uploadingInterior, setUploadingInterior] = useState(false);

  const [pendingPosition, setPendingPosition] = useState(null);

  // NEW — image box measurement for the click-to-place picker
  const { containerRef, imgRef, box, recalc } = useImageBox();

  const loadMyRestaurants = async () => {
    const { data } = await api.get("/restaurants");
    const user = JSON.parse(localStorage.getItem("user"));
    setRestaurants(data.filter((r) => r.owner === user._id));
  };

  useEffect(() => {
    loadMyRestaurants();
  }, []);

  const selectRestaurant = async (r) => {
    setSelected(r);
    setExteriorImage(null);
    setExteriorPreview(null);
    setInteriorImage(null);
    setInteriorPreview(null);
    setPendingPosition(null);
    const [tRes, bRes] = await Promise.all([
      api.get(`/tables/${r._id}`),
      api.get(`/bookings/restaurant/${r._id}`),
    ]);
    setTables(tRes.data);
    setBookings(bRes.data);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const cuisineArray =
        typeof newRestaurant.cuisine === "string"
          ? newRestaurant.cuisine.split(",").map((c) => c.trim()).filter(Boolean)
          : newRestaurant.cuisine ?? [];

      const formData = new FormData();
      formData.append("name", newRestaurant.name);
      formData.append("city", newRestaurant.city);
      formData.append("address", newRestaurant.address);
      formData.append("description", newRestaurant.description);
      cuisineArray.forEach((c) => formData.append("cuisine", c));
      if (image) formData.append("image", image);

      const { data } = await api.post("/restaurants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewRestaurant(emptyRestaurant);
      setImage(null);
      setPreview(null);
      setRestaurants((prev) => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATED — accounts for letterbox offset when converting a click to an image percentage
  const handleImageClick = (e) => {
    if (!box.width || !box.height) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;
    const xInImage = clickX - box.offsetX;
    const yInImage = clickY - box.offsetY;

    // Ignore clicks landing on the empty letterboxed space, not the photo itself
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
    const { data } = await api.post(`/tables/${selected._id}`, payload);
    setTables((prev) => [...prev, data]);
    setNewTable(emptyTable);
    setPendingPosition(null);
  };

  const updateBookingStatus = async (id, status) => {
    await api.patch(`/bookings/${id}/status`, { status });
    selectRestaurant(selected);
  };

  const handleExteriorImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExteriorImage(file);
    setExteriorPreview(URL.createObjectURL(file));
  };

  const handleExteriorImageUpload = async () => {
    if (!exteriorImage || !selected) return;
    setUploadingExterior(true);
    try {
      const formData = new FormData();
      formData.append("image", exteriorImage);

      const { data } = await api.put(`/restaurants/${selected._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelected(data);
      setRestaurants((prev) => prev.map((r) => (r._id === data._id ? data : r)));
      setExteriorImage(null);
      setExteriorPreview(null);
    } catch (err) {
      console.error("Exterior image upload failed:", err);
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
    if (!interiorImage || !selected) return;
    setUploadingInterior(true);
    try {
      const formData = new FormData();
      formData.append("interiorImage", interiorImage);

      const { data } = await api.put(`/restaurants/${selected._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelected(data);
      setRestaurants((prev) => prev.map((r) => (r._id === data._id ? data : r)));
      setInteriorImage(null);
      setInteriorPreview(null);
    } catch (err) {
      console.error("Interior image upload failed:", err);
    } finally {
      setUploadingInterior(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-[300px_1fr] gap-8">
      <aside className="space-y-6">
        <div>
          <h2 className="font-display text-xl mb-4 text-neutral-900">My restaurants</h2>

          {!selected ? (
            <div className="space-y-2.5">
              {restaurants.map((r) => {
                const imgSrc = r.image ? `${BACKEND_URL}${r.image}` : null;
                return (
                  <button
                    key={r._id}
                    onClick={() => selectRestaurant(r)}
                    className="group w-full flex items-center gap-3 text-left rounded-2xl border border-neutral-200 bg-white p-3 hover:border-orange-300 hover:shadow-md hover:shadow-neutral-200/50 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 flex items-center justify-center">
                      {imgSrc ? (
                        <img src={imgSrc} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-neutral-400 text-lg">🍽️</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-orange-700 transition-colors">
                        {r.name}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">{r.city}</p>
                    </div>
                  </button>
                );
              })}
              {restaurants.length === 0 && (
                <p className="text-sm text-neutral-400 py-2">You haven't added a restaurant yet.</p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-300 bg-orange-50/60 p-3 flex items-center gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex-shrink-0 flex items-center justify-center">
                {selected.image ? (
                  <img src={`${BACKEND_URL}${selected.image}`} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-neutral-400 text-lg">🍽️</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 truncate">{selected.name}</p>
                <p className="text-xs text-neutral-500 truncate">{selected.city}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
            </div>
          )}
        </div>

        {!selected && (
          <form onSubmit={handleCreateRestaurant} className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2">
            <h3 className="font-medium text-sm text-neutral-700">Add a restaurant</h3>
            <input required placeholder="Name" value={newRestaurant.name}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <input required placeholder="City" value={newRestaurant.city}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <input required placeholder="Address" value={newRestaurant.address}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <input placeholder="Cuisine (comma separated)" value={newRestaurant.cuisine}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
            <textarea placeholder="Description" value={newRestaurant.description}
              onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
              rows={3} className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />

            <div>
              <label className="block text-xs text-neutral-500 mb-1">Exterior photo</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm" />
              {preview && <img src={preview} alt="Preview" className="mt-2 rounded-lg w-full h-32 object-cover" />}
            </div>

            <button className="w-full rounded-lg bg-neutral-900 text-white py-1.5 text-sm hover:bg-orange-600 transition">
              Create
            </button>
          </form>
        )}

        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="group w-full flex items-center gap-2 text-sm text-neutral-500 hover:text-orange-600 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All restaurants
          </button>
        )}
      </aside>

      <section>
        {!selected ? (
          <p className="text-neutral-500">Select or create a restaurant to manage its tables and bookings.</p>
        ) : (
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl mb-4 text-neutral-900">{selected.name} — Tables</h2>

              {/* EXTERIOR photo */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4 flex items-center gap-5">
                <img
                  src={exteriorPreview || (selected.image ? `${BACKEND_URL}${selected.image}` : "/images/placeholder.jpg")}
                  alt={selected.name}
                  className="w-24 h-24 rounded-lg object-cover border border-neutral-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Exterior photo</p>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleExteriorImageChange} className="text-sm" />
                    {exteriorImage && (
                      <button
                        onClick={handleExteriorImageUpload}
                        disabled={uploadingExterior}
                        className="rounded-lg bg-orange-600 text-white px-4 py-1.5 text-sm hover:bg-orange-700 disabled:opacity-50 transition"
                      >
                        {uploadingExterior ? "Uploading…" : "Save photo"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Shown on restaurant cards and the top of the detail page.</p>
                </div>
              </div>

              {/* INTERIOR photo */}
              <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4 flex items-center gap-5">
                <img
                  src={interiorPreview || (selected.interiorImage ? `${BACKEND_URL}${selected.interiorImage}` : "/images/placeholder.jpg")}
                  alt={`${selected.name} interior`}
                  className="w-24 h-24 rounded-lg object-cover border border-neutral-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700 mb-2">Interior photo</p>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*" onChange={handleInteriorImageChange} className="text-sm" />
                    {interiorImage && (
                      <button
                        onClick={handleInteriorImageUpload}
                        disabled={uploadingInterior}
                        className="rounded-lg bg-orange-600 text-white px-4 py-1.5 text-sm hover:bg-orange-700 disabled:opacity-50 transition"
                      >
                        {uploadingInterior ? "Uploading…" : "Save photo"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Shown in the "closer look" section on the booking page.</p>
                </div>
              </div>

              {/* Click-to-place table position picker — uses THIS restaurant's own interior photo */}
              {selected.interiorImage && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    Click on the photo where the next table sits, then fill in its details below and click "Add table"
                  </p>
                  <div
                    ref={containerRef}
                    className="relative rounded-xl overflow-hidden border border-neutral-200 cursor-crosshair"
                    onClick={handleImageClick}
                  >
                    <img
                      ref={imgRef}
                      src={`${BACKEND_URL}${selected.interiorImage}`}
                      alt="Interior layout"
                      onLoad={recalc}
                      className="w-full h-80 object-contain bg-neutral-900 pointer-events-none"
                    />

                    {/* Pending marker for the table about to be added */}
                    {pendingPosition && box.width > 0 && (
                      <span
                        className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600 border-2 border-white shadow-lg animate-pulse"
                        style={{
                          left: box.offsetX + (pendingPosition.x / 100) * box.width,
                          top: box.offsetY + (pendingPosition.y / 100) * box.height,
                        }}
                      />
                    )}

                    {/* Already-placed tables for this restaurant */}
                    {box.width > 0 &&
                      tables
                        .filter((t) => t.positionX != null && t.positionY != null)
                        .map((t) => (
                          <span
                            key={t._id}
                            className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900/85 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white"
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
                    <p className="text-xs text-orange-600 mt-1.5">
                      Position set — fill in table details and click "Add table" to save.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 mb-4">
                {tables.map((t) => (
                  <span key={t._id} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm">
                    Table {t.tableNumber} · seats {t.capacity} · {t.location}
                    {t.positionX != null && (
                      <span className="ml-1.5 text-orange-500" title="Positioned on interior photo">📍</span>
                    )}
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTable} className="flex flex-wrap gap-3 items-end">
                <input required placeholder="Table #" value={newTable.tableNumber}
                  onChange={(e) => setNewTable({ ...newTable, tableNumber: e.target.value })}
                  className="w-28 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                <input required type="number" min={1} placeholder="Capacity" value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
                <select value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="private">Private</option>
                </select>
                <button className="rounded-lg bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-700 transition">
                  Add table
                </button>
              </form>
            </div>

            <div>
              <h2 className="font-display text-2xl mb-4 text-neutral-900">Bookings</h2>
              {bookings.length === 0 ? (
                <p className="text-neutral-500">No bookings yet.</p>
              ) : (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b._id} className="rounded-xl border border-neutral-200 bg-white p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-neutral-900">{b.user?.name} · {b.partySize} guests</p>
                        <p className="text-sm text-neutral-500">
                          {b.date} at {b.timeSlot} · Table {b.table?.tableNumber} · {b.status}
                        </p>
                      </div>
                      {b.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => updateBookingStatus(b._id, "confirmed")}
                            className="text-sm rounded-lg bg-green-600 text-white px-3 py-1.5 hover:bg-green-700 transition">
                            Confirm
                          </button>
                          <button onClick={() => updateBookingStatus(b._id, "cancelled")}
                            className="text-sm rounded-lg bg-red-100 text-red-700 px-3 py-1.5 hover:bg-red-200 transition">
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerDashboard;