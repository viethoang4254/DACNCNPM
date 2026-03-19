import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getApiMessage, getMyBookings } from "../../../services/userService";
import CancelBookingModal from "../../../components/user/CancelBookingModal";
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

/**
 * Calculate days remaining until tour start
 */
const getDaysRemaining = (startDate) => {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const diffMs = start.getTime() - today.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
};

/**
 * Check if booking can be cancelled
 */
const canCancelBooking = (booking) => {
  // Can only cancel if status is 'pending' or 'confirmed'
  if (!["pending", "confirmed"].includes(booking.trang_thai)) {
    return {
      canCancel: false,
      reason: "Chỉ có thể hủy tour ở trạng thái chờ xác nhận hoặc đã xác nhận",
    };
  }

  // Cannot cancel if already cancelled
  if (booking.trang_thai === "cancelled") {
    return {
      canCancel: false,
      reason: "Tour này đã hủy",
    };
  }

  // Check if schedule is cancelled
  const scheduleStatusKey = String(booking.schedule_status || "").toLowerCase();
  const isScheduleCancelled = scheduleStatusKey === "cancelled" || scheduleStatusKey === "canceled";
  if (isScheduleCancelled) {
    return {
      canCancel: false,
      reason: "Lịch khởi hành đã bị hủy",
    };
  }

  // Check time remaining (only block after departure date)
  const daysLeft = getDaysRemaining(booking.start_date);
  if (daysLeft === null) {
    return {
      canCancel: false,
      reason: "Ngày khởi hành không hợp lệ",
    };
  }

  if (daysLeft < 0) {
    return {
      canCancel: false,
      reason: "Không thể hủy sau ngày khởi hành",
    };
  }

  return { canCancel: true };
};

function BookingHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
  };

  const handleCancelModalClose = () => {
    setSelectedBooking(null);
  };

  const handleCancelSuccess = (result) => {
    // Update the booking in state
    const updatedBooking = result.booking;
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );

    // Show success message
    setSuccessMessage(
      `Hủy tour thành công! Hoàn tiền: ${formatCurrency(result.refundAmount)}`
    );

    // Close modal
    setSelectedBooking(null);
  };

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => Boolean(booking.payment_status)),
    [bookings],
  );

  const hasData = useMemo(
    () => visibleBookings.length > 0,
    [visibleBookings.length],
  );

  return (
    <section className="booking-history">
      <div className="booking-history__head">
        <h1>Lịch sử đặt tour</h1>
        <p>Theo dõi trạng thái các đơn đặt tour gần đây của bạn.</p>
      </div>

      {successMessage && (
        <div className="booking-history__success">
          ✓ {successMessage}
        </div>
      )}

      {isLoading && (
        <p className="booking-history__message">Đang tải dữ liệu...</p>
      )}
      {!isLoading && error && (
        <p className="booking-history__message booking-history__message--error">
          {error}
        </p>
      )}

      {!isLoading && !error && !hasData && (
        <div className="booking-history__empty">
          <p>Bạn chưa có đơn đặt tour nào đã gửi yêu cầu thanh toán.</p>
          <Link to="/tours">Khám phá tour ngay</Link>
        </div>
      )}

      {!isLoading && !error && hasData && (
        <div className="booking-history__list">
          {visibleBookings.map((booking) => {
            const bookingStatusKey = String(booking.trang_thai || "").toLowerCase();
            const scheduleStatusKey = String(
              booking.schedule_status || "",
            ).toLowerCase();
            const isScheduleCancelled =
              scheduleStatusKey === "cancelled" || scheduleStatusKey === "canceled";
            const effectiveStatusKey =
              isScheduleCancelled ? "cancelled" : bookingStatusKey;

            const cancellationReason =
              effectiveStatusKey === "cancelled"
                ? isScheduleCancelled
                  ? "Lý do hủy: Lịch khởi hành không đủ số lượng khách tối thiểu."
                  : `Lý do hủy: Đơn đặt tour đã bị hủy${booking.cancelled_by ? ` (bởi ${booking.cancelled_by === 'user' ? 'bạn' : 'admin'})` : ""}.`
                : "";

            const status = STATUS_MAP[effectiveStatusKey] || {
              label: effectiveStatusKey || "Không rõ",
              className: "pending",
            };

            const daysLeft = getDaysRemaining(booking.start_date);
            const cancelability = canCancelBooking(booking);

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
                    <span
                      className={`status-badge status-badge--${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p>
                    Điểm đến:{" "}
                    <strong>{booking.tinh_thanh || "Đang cập nhật"}</strong>
                  </p>
                  <p>
                    Ngày khởi hành:{" "}
                    <strong>{formatDate(booking.start_date)}</strong>
                  </p>
                  {daysLeft !== null && (
                    <p className={`booking-history__days-left ${daysLeft < 3 ? 'days-left--urgent' : ''}`}>
                      Còn lại: <strong>{daysLeft} ngày</strong>
                    </p>
                  )}
                  <p>
                    Số người: <strong>{booking.so_nguoi || 0}</strong>
                  </p>
                  <p>
                    Tổng tiền:{" "}
                    <strong>{formatCurrency(booking.tong_tien)}</strong>
                  </p>

                  {booking.refund_amount > 0 && (
                    <p className="booking-history__refund">
                      Hoàn tiền:{" "}
                      <strong>{formatCurrency(booking.refund_amount)}</strong>
                    </p>
                  )}

                  {cancellationReason && (
                    <p className="booking-history__cancel-reason">
                      {cancellationReason}
                    </p>
                  )}

                  <div className="booking-history__actions">
                    <Link
                      to={`/tours/${booking.tour_id}`}
                      className="booking-history__detail-btn"
                    >
                      Xem chi tiết
                    </Link>
                    {cancelability.canCancel ? (
                      <button
                        className="booking-history__cancel-btn"
                        onClick={() => handleCancelClick(booking)}
                      >
                        Hủy tour
                      </button>
                    ) : (
                      <button
                        className="booking-history__cancel-btn booking-history__cancel-btn--disabled"
                        disabled
                        title={cancelability.reason}
                      >
                        Hủy tour
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <CancelBookingModal
          booking={selectedBooking}
          onCancel={handleCancelModalClose}
          onSuccess={handleCancelSuccess}
        />
      )}
    </section>
  );
}

export default BookingHistory;
