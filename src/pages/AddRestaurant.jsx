import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

const AddRestaurant = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    city: "",
    address: "",
    cuisine: "",
    description: "",
    priceRange: "$$",
    openingTime: "10:00",
    closingTime: "22:00",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cuisineArray = form.cuisine.split(",").map((c) => c.trim()).filter(Boolean);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("city", form.city);
      formData.append("address", form.address);
      formData.append("description", form.description);
      formData.append("priceRange", form.priceRange);
      formData.append("openingTime", form.openingTime);
      formData.append("closingTime", form.closingTime);
      cuisineArray.forEach((c) => formData.append("cuisine", c));
      if (image) formData.append("image", image);

      const { data } = await api.post("/restaurants", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/owner/restaurants/${data._id}/manage`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase mb-1.5">
          Partner Portal
        </p>
        <h1 className="font-display text-3xl text-stone-900">Add a Restaurant</h1>
        <p className="text-stone-500 text-sm mt-1">
          Fill in the details below to list your restaurant on Dine Slot.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-medium text-stone-500 mb-1.5 block">Exterior photo</label>
          <label className="block relative h-48 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 overflow-hidden cursor-pointer hover:border-[#D4AF37]/50 transition-colors">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Click to upload a photo</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1.5 block">Restaurant name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="e.g. The Olive Grove"
            className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              placeholder="e.g. Patna"
              className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">Price range</label>
            <select
              name="priceRange"
              value={form.priceRange}
              onChange={handleChange}
              className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
            >
              <option value="$">$ — Budget</option>
              <option value="$$">$$ — Moderate</option>
              <option value="$$$">$$$ — Upscale</option>
              <option value="$$$$">$$$$ — Fine dining</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1.5 block">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            placeholder="Street address"
            className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1.5 block">
            Cuisine <span className="text-stone-300">(comma-separated)</span>
          </label>
          <input
            name="cuisine"
            value={form.cuisine}
            onChange={handleChange}
            placeholder="e.g. Italian, Mediterranean"
            className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">Opening time</label>
            <input
              type="time"
              name="openingTime"
              value={form.openingTime}
              onChange={handleChange}
              className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">Closing time</label>
            <input
              type="time"
              name="closingTime"
              value={form.closingTime}
              onChange={handleChange}
              className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-stone-500 mb-1.5 block">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Tell customers what makes your restaurant special..."
            rows={4}
            className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-shadow resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/owner")}
            className="flex-1 text-sm font-medium text-stone-600 px-4 py-3 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 text-sm font-medium text-white px-4 py-3 rounded-xl bg-gradient-to-r from-stone-900 to-stone-700 hover:from-stone-800 hover:to-stone-600 shadow-lg shadow-stone-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Creating…" : "Create Restaurant"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRestaurant;