import { memo, useMemo } from "react";
import TourCard from "../TourCard";
import { normalizeTour } from "../../../utils/tourUtils";
import "./FeaturedTours.scss";

/**
 * Swap FEATURED_SORT_STRATEGY to change how "Tours nổi bật" are ranked.
 *
 * Supported values:
 *   "latest"   – newest tours first (default; matches API sort=latest)
 *   "featured" – tours explicitly marked is_featured by admin (filter first)
 *
 * To switch to "featured" once the API supports it:
 *   1. Change the constant below.
 *   2. Ensure the backend Tour API returns is_featured = true|false.
 */
const FEATURED_SORT_STRATEGY = "latest";
const MAX_FEATURED = 8;

function applyFeaturedSort(tours, strategy) {
  if (strategy === "featured") {
    const featured = tours.filter((t) => t.is_featured);
    // Fall back to all tours if none are marked featured yet
    return featured.length > 0 ? featured : tours;
  }

  // "latest" – use API order (already sorted by created_at DESC)
  return tours;
}

function FeaturedTours({
  tours: toursProp = [],
  isLoading = false,
  error = "",
}) {
  const displayTours = useMemo(() => {
    const normalized = toursProp.map(normalizeTour);
    return applyFeaturedSort(normalized, FEATURED_SORT_STRATEGY).slice(
      0,
      MAX_FEATURED,
    );
  }, [toursProp]);

  return (
    <section className="home__section featured-tours">
      <div className="featured-tours__heading">
        <div>
          <h2>Tours nổi bật</h2>
          <p className="featured-tours__sub">
            Chọn nhanh các tour đang được quan tâm nhiều nhất.
          </p>
        </div>
      </div>

      {isLoading && <p className="home__message">Đang tải tour...</p>}
      {!isLoading && error && (
        <p className="home__message home__message--error">{error}</p>
      )}

      {!isLoading && !error && (
        <div className="featured-tours__grid">
          {displayTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(FeaturedTours);
