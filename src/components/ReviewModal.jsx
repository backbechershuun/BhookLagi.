import { useState } from "react";
import api from "../api/axios.js";

const ReviewModal = ({ bookingId, restaurantName, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError("Please select a rating");
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/reviews", { bookingId, rating, comment });
      onSubmitted(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-display text-xl text-stone-900">Rate your visit</h2>
        <p className="text-sm text-stone-500">{restaurantName}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl leading-none"
            >
              <span className={star <= (hoverRating || rating) ? "text-amber-400" : "text-stone-200"}>★</span>
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was it? (optional)"
          className="w-full border border-stone-200 rounded-lg p-2 text-sm"
          rows={3}
          maxLength={500}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="text-sm text-stone-500 px-3 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;