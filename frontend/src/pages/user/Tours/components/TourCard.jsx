import {
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaBus,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DESTINATION_LABELS = {
  "da-nang": "Đà Nẵng",
  "phu-quoc": "Phú Quốc",
  "ha-noi": "Hà Nội",
  "sa-pa": "Sa Pa",
  "hoi-an": "Hội An",
  "khanh-hoa": "Nha Trang",
  khanh_hoa: "Nha Trang",
  "da-lat": "Đà Lạt",
  hue: "Huế",
  "quang-ninh": "Hạ Long",
  hcm: "TP. Hồ Chí Minh",
};

const VEHICLE_LABELS = {
  "may-bay": "Máy bay",
  "xe-khach": "Xe khách",
  "tau-hoa": "Tàu hỏa",
  "tu-tuc": "Tự túc",
};

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function TourCard({ tour }) {
  const imageUrl = resolveImageUrl(tour.hinh_anh);
  const price = Number(tour.gia || 0).toLocaleString("vi-VN");
  const destinationLabel =
    DESTINATION_LABELS[tour.tinh_thanh] || tour.tinh_thanh;
  const departureLabel =
    DESTINATION_LABELS[tour.diem_khoi_hanh] || tour.diem_khoi_hanh;
  const vehicleLabel = VEHICLE_LABELS[tour.phuong_tien] || tour.phuong_tien;

  return (
    <article className="tour-card-h">
      <div className="tour-card-h__image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={tour.ten_tour} loading="lazy" />
        ) : (
          <div className="tour-card-h__image-placeholder" aria-hidden="true" />
        )}
        <span className="tour-card-h__badge">{tour.so_ngay} ngày</span>
      </div>

      <div className="tour-card-h__body">
        <div className="tour-card-h__top">
          <h3 className="tour-card-h__name">{tour.ten_tour}</h3>
          <div className="tour-card-h__meta">
            <span className="tour-card-h__meta-item">
              <FaMapMarkerAlt className="tour-card-h__meta-icon" />
              {destinationLabel}
            </span>
            <span className="tour-card-h__meta-item">
              <FaClock className="tour-card-h__meta-icon" />
              {tour.so_ngay} ngày {tour.so_ngay - 1} đêm
            </span>
            <span className="tour-card-h__meta-item">
              <FaUsers className="tour-card-h__meta-icon" />
              Tối đa {tour.so_nguoi_toi_da} người
            </span>
            <span className="tour-card-h__meta-item">
              <FaBus className="tour-card-h__meta-icon" />
              {vehicleLabel}
            </span>
          </div>
          {tour.mo_ta && <p className="tour-card-h__desc">{tour.mo_ta}</p>}
        </div>

        <div className="tour-card-h__footer">
          <div className="tour-card-h__price-wrap">
            <span className="tour-card-h__price-label">Giá từ</span>
            <span className="tour-card-h__price">{price} ₫</span>
            <span className="tour-card-h__price-note">/ người</span>
          </div>
          <div className="tour-card-h__actions">
            <span className="tour-card-h__departure">
              Khởi hành từ: <strong>{departureLabel}</strong>
            </span>
            <Link to={`/tours/${tour.id}`} className="tour-card-h__btn">
              Xem chi tiết
              <FaArrowRight className="tour-card-h__btn-icon" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default TourCard;
