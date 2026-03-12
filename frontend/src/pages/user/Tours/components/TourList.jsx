import TourCard from "./TourCard";

function SkeletonCard() {
  return (
    <div className="tour-card-h tour-card-h--skeleton" aria-hidden="true">
      <div className="tour-card-h__image-wrap skeleton-box" />
      <div className="tour-card-h__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--short" />
      </div>
    </div>
  );
}

function TourList({ tours, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="tour-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-list tour-list--empty">
        <p className="tour-list__empty-text">Đã có lỗi xảy ra: {error}</p>
      </div>
    );
  }

  if (!tours || tours.length === 0) {
    return (
      <div className="tour-list tour-list--empty">
        <div className="tour-list__empty-icon">🔍</div>
        <p className="tour-list__empty-text">
          Không tìm thấy tour nào phù hợp với bộ lọc của bạn.
        </p>
        <p className="tour-list__empty-hint">
          Hãy thử điều chỉnh bộ lọc để xem thêm kết quả.
        </p>
      </div>
    );
  }

  return (
    <div className="tour-list">
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}

export default TourList;
