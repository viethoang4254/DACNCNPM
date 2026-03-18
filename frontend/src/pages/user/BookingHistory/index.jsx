import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getApiMessage,
  getMyBookings,
} from "../../../services/userService";
import "./BookingHistory.scss";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", className: "pending" },
  confirmed: { label: "Đã xác nhận", className: "confirmed" },
  cancelled: { label: "Đã hủy", className: "cancelled" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

function BookingHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let ignore = false;

    const fetchBookings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getMyBookings();
        if (ignore) return;
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        if (ignore) return;
        setError(getApiMessage(err, "Không thể tải lịch sử đặt tour"));
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchBookings();

    return () => {
      ignore = true;
    };
  }, []);

  const hasData = useMemo(() => bookings.length > 0, [bookings.length]);

  return (
    <section className="booking-history">
      <div className="booking-history__head">
        <h1>Lịch sử đặt tour</h1>
        <p>Theo dõi trạng thái các đơn đặt tour gần đây của bạn.</p>
      </div>

      {isLoading && <p className="booking-history__message">Đang tải dữ liệu...</p>}
      {!isLoading && error && (
        <p className="booking-history__message booking-history__message--error">
          {error}
        </p>
      )}

      {!isLoading && !error && !hasData && (
        <div className="booking-history__empty">
          <p>Bạn chưa có đơn đặt tour nào.</p>
          <Link to="/tours">Khám phá tour ngay</Link>
        </div>
      )}

      {!isLoading && !error && hasData && (
        <div className="booking-history__list">
          {bookings.map((booking) => {
            const status = STATUS_MAP[booking.trang_thai] || {
              label: booking.trang_thai || "Không rõ",
              className: "pending",
            };

            return (
              <article key={booking.id} className="booking-history__card">
                <img
                  src={
                    booking.image ||
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={booking.ten_tour || "Tour"}
                />

                <div className="booking-history__content">
                  <div className="booking-history__row">
                    <h3>{booking.ten_tour || `Tour #${booking.tour_id}`}</h3>
                    <span className={`status-badge status-badge--${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <p>
                    Điểm đến: <strong>{booking.tinh_thanh || "Đang cập nhật"}</strong>
                  </p>
                  <p>
                    Ngày khởi hành: <strong>{formatDate(booking.start_date)}</strong>
                  </p>
                  <p>
                    Số người: <strong>{booking.so_nguoi || 0}</strong>
                  </p>
                  <p>
                    Tổng tiền: <strong>{formatCurrency(booking.tong_tien)}</strong>
                  </p>

                  <div className="booking-history__actions">
                    <Link to={`/tours/${booking.tour_id}`}>Xem chi tiết tour</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default BookingHistory;
