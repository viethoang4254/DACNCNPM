import "./BookingCancelInfoModal.scss";

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

const getCancelledByLabel = (cancelledBy) => {
  const key = String(cancelledBy || "").toLowerCase();
  if (key === "user") return "Bạn";
  if (key === "admin") return "Admin";
  if (key === "system") return "Hệ thống";
  return "Không rõ";
};

const getRefundStatusLabel = (refundStatus) => {
  const key = String(refundStatus || "").toLowerCase();
  if (key === "pending") return "Chờ xử lý";
  if (key === "processed") return "Đã hoàn tiền";
  if (key === "failed") return "Từ chối hoàn tiền";
  if (key === "none") return "Không áp dụng";
  return refundStatus || "-";
};

const getDisplayCancelledBy = (booking) => {
  const cancelledBy = String(booking?.cancelled_by || "").toLowerCase();
  const refundStatus = String(booking?.refund_status || "").toLowerCase();
  const paymentStatus = String(booking?.payment_status || "").toLowerCase();

  // Fallback for old data that was overwritten to admin when refund was processed/rejected.
  if (
    cancelledBy === "admin" &&
    ["processed", "failed"].includes(refundStatus)
  ) {
    return "Bạn (admin đã xử lý hoàn tiền)";
  }

  // Failed payment usually means admin rejected payment and cancelled booking.
  if (!cancelledBy && paymentStatus === "failed") {
    return "Admin";
  }

  return getCancelledByLabel(cancelledBy);
};

function BookingCancelInfoModal({ booking, onClose }) {
  const refundStatus = String(booking.refund_status || "").toLowerCase();
  let officialRefundText = "Không áp dụng";
  if (refundStatus === "processed") {
    officialRefundText = formatCurrency(booking.refund_amount);
  } else if (refundStatus === "pending") {
    officialRefundText = "Chờ admin duyệt";
  } else if (refundStatus === "failed") {
    officialRefundText = "0 ₫ (admin từ chối hoàn tiền)";
  }

  return (
    <div className="booking-cancel-info-modal">
      <div className="booking-cancel-info-modal__overlay" onClick={onClose} />
      <div
        className="booking-cancel-info-modal__content"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="booking-cancel-info-modal__close"
          onClick={onClose}
          aria-label="Đóng"
        >
          ×
        </button>

        <h2 className="booking-cancel-info-modal__title">Thông tin hủy tour</h2>

        <div className="booking-cancel-info-modal__tour-block">
          <img
            src={
              booking.image ||
              "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
            }
            alt={booking.ten_tour || "Tour"}
          />
          <div>
            <h3>{booking.ten_tour || `Tour #${booking.tour_id}`}</h3>
            <p>
              Điểm đến: <strong>{booking.tinh_thanh || "Đang cập nhật"}</strong>
            </p>
            <p>
              Ngày khởi hành: <strong>{formatDate(booking.start_date)}</strong>
            </p>
          </div>
        </div>

        <div className="booking-cancel-info-modal__info-grid">
          <p>
            Tổng tiền: <strong>{formatCurrency(booking.tong_tien)}</strong>
          </p>
          <p>
            Hoàn tiền: <strong>{officialRefundText}</strong>
          </p>
          <p>
            Trạng thái hoàn tiền:{" "}
            <strong>{getRefundStatusLabel(booking.refund_status)}</strong>
          </p>
          <p>
            Hủy bởi: <strong>{getDisplayCancelledBy(booking)}</strong>
          </p>
          <p>
            Thời điểm hủy: <strong>{formatDate(booking.cancelled_at)}</strong>
          </p>
        </div>

        <div className="booking-cancel-info-modal__reason">
          <h4>Lý do hủy tour</h4>
          <p>
            {booking.cancel_reason
              ? `Lý do hủy: ${booking.cancel_reason}.`
              : booking.cancellationReason || "Đơn đặt tour đã bị hủy."}
          </p>
        </div>

        <div className="booking-cancel-info-modal__actions">
          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingCancelInfoModal;
