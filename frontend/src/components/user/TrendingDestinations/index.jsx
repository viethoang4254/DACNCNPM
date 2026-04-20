import { memo, useMemo } from "react";
import TourCard from "../TourCard";
import { normalizeTour } from "../../../utils/tourUtils";
import "./TrendingDestinations.scss";

/**
 * Swap TREND_SORT_STRATEGY to change how "Điểm đến thịnh hành" are picked.
 *
 * Supported values:
 *   "mock"          – use tours in their current API order (default)
 *   "review_count"  – sort by number of reviews (most reviewed first)
 *   "avg_rating"    – filter rating >= 4.5, sort highest first
 *   "booking_count" – sort by total bookings (most booked first)
 *
 * To switch to a real strategy once the API exposes those fields:
 *   1. Change the constant below.
 *   2. Make sure the backend Tour API returns the matching field.
 */
const TREND_SORT_STRATEGY = "mock";
const MAX_TRENDING = 4;

function applyTrendSort(tours, strategy) {
  if (strategy === "review_count") {
    return [...tours].sort((a, b) => b.review_count - a.review_count);
  }

  if (strategy === "avg_rating") {
    return [...tours]
      .filter((t) => t.avg_rating >= 4.5)
      .sort((a, b) => b.avg_rating - a.avg_rating);
  }

  if (strategy === "booking_count") {
    return [...tours].sort((a, b) => b.booking_count - a.booking_count);
  }

  // "mock" – use API order as-is
  return tours;
}

function TrendingDestinations({
  tours: toursProp = [],
  isLoading = false,
  error = "",
}) {
  const displayTours = useMemo(() => {
    const normalized = toursProp.map(normalizeTour);
    return applyTrendSort(normalized, TREND_SORT_STRATEGY).slice(
      0,
      MAX_TRENDING,
    );
  }, [toursProp]);

  return (
    <section className="home__section trending-destinations">
      <div className="trending-destinations__heading">
        <div>
          <h2>Điểm đến thịnh hành</h2>
          <p className="trending-destinations__sub">
            Những hành trình được yêu thích nhất tuần này.
          </p>
        </div>
      </div>

      {isLoading && <p className="home__message">Đang tải tour...</p>}
      {!isLoading && error && (
        <p className="home__message home__message--error">{error}</p>
      )}

      {!isLoading && !error && (
        <div className="trending-destinations__grid">
          {displayTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(TrendingDestinations);
