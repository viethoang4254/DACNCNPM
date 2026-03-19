import { useEffect } from "react";
import "./BookingViewModal.scss";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("vi-VN");
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

function BookingViewModal({
  booking,
  onClose,
  bookingStatusLabels,
  paymentStatusLabels,
}) {
  useEffect(() => {
    if (!booking) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [booking, onClose]);

  if (!booking) return null;

  const paymentStatus = booking.payment_status || "pending";

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <div
        className="booking-view-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết đơn đặt #${booking.id}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-view-modal__header">
          <div>
            <h3>Đơn đặt #{booking.id}</h3>
            <p>Thông tin chi tiết đơn đặt tour</p>
          </div>
          <button
            type="button"
            className="booking-view-modal__close"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn đặt"
          >
            ✕
          </button>
        </div>

        <div className="booking-view-modal__body">
          <div className="booking-view-modal__section">
            <h4>Thông tin khách hàng</h4>
            <div className="booking-detail-grid">
              <div className="booking-detail-item">
                <label>Người dùng</label>
                <span>{booking.user_name || "—"}</span>
              </div>
              <div className="booking-detail-item">
                <label>Email</label>
                <span>{booking.user_email || "—"}</span>
              </div>
            </div>
          </div>

          <div className="booking-view-modal__section">
            <h4>Thông tin đặt tour</h4>
            <div className="booking-detail-grid">
              <div className="booking-detail-item">
                <label>Tour</label>
                <span>{booking.ten_tour || "—"}</span>
              </div>
              <div className="booking-detail-item">
                <label>Ngày khởi hành</label>
                <span>{formatDate(booking.start_date)}</span>
              </div>
              <div className="booking-detail-item">
                <label>Số người</label>
                <span>{booking.so_nguoi ?? "—"}</span>
              </div>
              <div className="booking-detail-item">
                <label>Tổng tiền</label>
                <span className="booking-detail-price">
                  {formatCurrency(booking.tong_tien)}
                </span>
              </div>
              <div className="booking-detail-item">
                <label>Trạng thái</label>
                <span
                  className={`status-pill status-pill--${booking.trang_thai}`}
                >
                  {bookingStatusLabels[booking.trang_thai] ||
                    booking.trang_thai}
                </span>
              </div>
              <div className="booking-detail-item">
                <label>Thanh toán</label>
                <span className={`status-pill status-pill--${paymentStatus}`}>
                  {paymentStatusLabels[paymentStatus] || paymentStatus}
                </span>
              </div>
              <div className="booking-detail-item">
                <label>Ngày đặt</label>
                <span>{formatDate(booking.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingViewModal;
