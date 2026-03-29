import { memo } from "react";
import { CiLocationOn } from "react-icons/ci";
import {
  FaBusAlt,
  FaCarSide,
  FaFire,
  FaPlaneDeparture,
  FaShip,
  FaTrain,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatDuration } from "../../../utils/tourUtils";
import { getPriceInfo } from "../../../utils/price";

const normalizeTransport = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

const getTransportMeta = (value) => {
  const normalized = normalizeTransport(value);

  if (!normalized) {
    return {
      Icon: FaCarSide,
      label: "Phương tiện cập nhật sau",
    };
  }

  if (
    normalized.includes("máy bay") ||
    normalized.includes("may bay") ||
    normalized.includes("plane") ||
    normalized.includes("flight")
  ) {
    return { Icon: FaPlaneDeparture, label: value };
  }

  if (
    normalized.includes("tàu hỏa") ||
    normalized.includes("tau hoa") ||
    normalized.includes("train")
  ) {
    return { Icon: FaTrain, label: value };
  }

  if (
    normalized.includes("tàu") ||
    normalized.includes("tau") ||
    normalized.includes("thuyền") ||
    normalized.includes("thuyen") ||
    normalized.includes("ship") ||
    normalized.includes("boat")
  ) {
    return { Icon: FaShip, label: value };
  }

  if (
    normalized.includes("xe") ||
    normalized.includes("bus") ||
    normalized.includes("coach")
  ) {
    return { Icon: FaBusAlt, label: value };
  }

  return { Icon: FaCarSide, label: value };
};

function TourCard({ tour, buttonLabel = "View", viewedText = "" }) {
  const { finalPrice, originalPrice, discount } = getPriceInfo(
    { gia: Number(tour.price || 0) },
    tour.schedule || {
      is_on_sale: Boolean(tour.is_on_sale),
      discount_percent: Number(tour.discount_percent || 0),
    },
  );
  const price = Number(finalPrice || 0).toLocaleString("vi-VN");
  const original = Number(originalPrice || 0).toLocaleString("vi-VN");
  const duration = formatDuration(tour.days);
  const transport = getTransportMeta(tour.transport || tour.phuong_tien || "");

  return (
    <article className="tour-card">
      <div className="tour-card__image-wrap">
        <img src={tour.image} alt={tour.name} loading="lazy" decoding="async" />
        <span className="tour-card__badge">{duration}</span>
        {discount > 0 ? (
          <span className="tour-card__sale-badge">
            <FaFire aria-hidden="true" /> -{discount}%
          </span>
        ) : null}
      </div>

      <div className="tour-card__info">
        <div className="tour-card__content">
          <h3 className="tour-card__name">{tour.name}</h3>
          <div className="tour-card__subinfo">
            <p className="tour-card__location">
              <CiLocationOn className="tour-card__subicon" aria-hidden="true" />
              <span>{tour.location}</span>
            </p>
            <p className="tour-card__transport">
              <transport.Icon
                className="tour-card__subicon"
                aria-hidden="true"
              />
              <span>{transport.label}</span>
            </p>
          </div>
          {viewedText ? (
            <p className="tour-card__viewed">{viewedText}</p>
          ) : null}
        </div>

        <div className="tour-card__meta">
          <div className="tour-card__price-wrap">
            {discount > 0 ? (
              <p className="tour-card__price-old">{original} ₫</p>
            ) : null}
            <p
              className={`tour-card__price ${
                discount > 0 ? "tour-card__price--sale" : ""
              }`}
            >
              {price} ₫
              <span className="tour-card__per"> / người</span>
            </p>
          </div>
          <Link to={`/tours/${tour.id}`} className="tour-card__button">
            {buttonLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default memo(TourCard);
