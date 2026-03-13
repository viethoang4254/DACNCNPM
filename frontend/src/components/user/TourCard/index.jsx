import { memo } from "react";

function TourCard({ tour }) {
  return (
    <article className="tour-card">
      <div className="tour-card__image-wrap">
        <img src={tour.image} alt={tour.name} loading="lazy" decoding="async" />
        <span className="tour-card__badge">{tour.days}N</span>
      </div>

      <div className="tour-card__info">
        <h3 className="tour-card__name">{tour.name}</h3>
        <p className="tour-card__location">{tour.location}</p>
        <div className="tour-card__meta">
          <span className="tour-card__price">
            Giá / 1 người: {Number(tour.price || 0).toLocaleString("vi-VN")} VND
          </span>
          <button type="button" className="tour-card__button">
            View
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(TourCard);
