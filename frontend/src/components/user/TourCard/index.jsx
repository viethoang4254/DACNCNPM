import { memo } from "react";
import { Link } from "react-router-dom";
import { formatDuration } from "../../../utils/tourUtils";

function TourCard({ tour }) {
  const price = Number(tour.price || 0).toLocaleString("vi-VN");
  const duration = formatDuration(tour.days);

  return (
    <article className="tour-card">
      <div className="tour-card__image-wrap">
        <img src={tour.image} alt={tour.name} loading="lazy" decoding="async" />
        <span className="tour-card__badge">{duration}</span>
      </div>

      <div className="tour-card__info">
        <div className="tour-card__content">
          <h3 className="tour-card__name">{tour.name}</h3>
          <p className="tour-card__location">{tour.location}</p>
        </div>

        <div className="tour-card__meta">
          <p className="tour-card__price">
            {price} ₫
            <span className="tour-card__per"> / người</span>
          </p>
          <Link to={`/tours/${tour.id}`} className="tour-card__button">
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(TourCard);
