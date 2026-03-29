import { useEffect, useMemo, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import {
  createReview,
  getReviewEligibility,
} from "../../../../../services/reviewService";
import { getAuthToken } from "../../../../../utils/authStorage";
import "./TourReviews.scss";

function getAverage(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  );
  return total / reviews.length;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function getStarText(rating) {
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
  const filled = "★".repeat(normalized);
  const empty = "☆".repeat(5 - normalized);
  return `${filled}${empty}`;
}

function TourReviews({ tourId, reviews = [], onReviewsChange }) {
  const average = getAverage(reviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [eligibility, setEligibility] = useState({
    loading: true,
    canReview: false,
    hasReviewed: false,
    message: "",
  });

  const averageStarText = useMemo(
    () => getStarText(Math.round(average)),
    [average],
  );

  useEffect(() => {
    let active = true;

    async function fetchEligibility() {
      if (!tourId) return;

      const token = getAuthToken();
      if (!token) {
        if (!active) return;
        setEligibility({
          loading: false,
          canReview: false,
          hasReviewed: false,
          message: "Bạn chỉ có thể đánh giá sau khi hoàn thành tour",
        });
        return;
      }

      try {
        if (active) {
          setEligibility((prev) => ({ ...prev, loading: true }));
        }

        const data = await getReviewEligibility(tourId);
        if (!active) return;

        setEligibility({
          loading: false,
          canReview: Boolean(data?.canReview),
          hasReviewed: Boolean(data?.hasReviewed),
          message: String(data?.message || ""),
        });
      } catch (error) {
        if (!active) return;
        setEligibility({
          loading: false,
          canReview: false,
          hasReviewed: false,
          message:
            error?.response?.data?.message ||
            "Bạn chỉ có thể đánh giá sau khi hoàn thành tour",
        });
      }
    }

    fetchEligibility();

    return () => {
      active = false;
    };
  }, [tourId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!tourId) return;

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setMessage({ text: "Vui lòng nhập nội dung đánh giá", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setMessage({ text: "", type: "" });

      const created = await createReview({
        tour_id: Number(tourId),
        rating: Number(rating),
        comment: trimmedComment,
      });

      if (typeof onReviewsChange === "function" && created) {
        onReviewsChange((prev) => [
          created,
          ...(Array.isArray(prev) ? prev : []),
        ]);
      }

      setEligibility({
        loading: false,
        canReview: false,
        hasReviewed: true,
        message: "Bạn đã đánh giá tour này",
      });
      setComment("");
      setRating(5);
      setMessage({ text: "Gửi đánh giá thành công", type: "success" });
    } catch (error) {
      setMessage({
        text:
          error?.response?.data?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tour-detail__section card">
      <h3>Đánh giá khách hàng</h3>
      <div className="tour-detail__rating-head">
        <strong>{average.toFixed(1)}</strong>
        <span className="tour-detail__rating-stars">{averageStarText}</span>
        <small>({average.toFixed(1)} / 5)</small>
        <small>({reviews.length} đánh giá)</small>
      </div>

      {!eligibility.loading && eligibility.canReview && (
        <form className="tour-detail__review-form" onSubmit={handleSubmit}>
          <div
            className="tour-detail__review-stars"
            role="radiogroup"
            aria-label="Đánh giá sao"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`tour-detail__review-star-btn ${rating >= star ? "is-active" : ""}`}
                onClick={() => setRating(star)}
                aria-label={`${star} sao`}
              >
                {rating >= star ? <FaStar /> : <FaRegStar />}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về tour..."
            rows={4}
            maxLength={1000}
            disabled={submitting}
          />

          <div className="tour-detail__review-form-footer">
            <button type="submit" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}

      {!eligibility.loading &&
        !eligibility.canReview &&
        eligibility.message && (
          <p className="tour-detail__review-note">{eligibility.message}</p>
        )}

      {message.text && (
        <p
          className={`tour-detail__review-feedback tour-detail__review-feedback--${message.type}`}
        >
          {message.text}
        </p>
      )}

      <div className="tour-detail__reviews-list">
        {reviews.length === 0 ? (
          <p>Chưa có đánh giá nào.</p>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="tour-detail__review-item">
              <header>
                <strong>{review.user_name || "Khách hàng"}</strong>
                <span>{getStarText(Number(review.rating || 0))}</span>
              </header>
              <small>{formatDate(review.created_at)}</small>
              <p>{review.comment}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default TourReviews;
