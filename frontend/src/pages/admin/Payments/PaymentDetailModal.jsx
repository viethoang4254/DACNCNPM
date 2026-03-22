import { formatDateVi } from "../../../utils/dateOnly";

function PaymentDetailModal({
  open,
  payment,
  loading = false,
  onClose,
  onConfirm,
  onReject,
  getStatusLabel,
  getMethodLabel,
  normalizeStatus,
  formatCurrency,
}) {
  if (!open || !payment) {
    return null;
  }

  const normalizedStatus = normalizeStatus(payment.status);
  const canReview = normalizedStatus === "pending";

  return (
    <div
      className="admin-modal__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-detail-title"
    >
      <div className="payment-detail-modal">
        <div className="payment-detail-modal__header">
          <div>
            <h3 id="payment-detail-title">Thanh toán #{payment.id}</h3>
            <p>Chi tiết khách hàng, booking và trạng thái thanh toán</p>
          </div>
          <button
            type="button"
            className="payment-detail-modal__close"
            disabled={loading}
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="payment-detail-modal__body">
          <section className="payment-detail-modal__group">
            <h4>Khách hàng</h4>
            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <label>Họ tên</label>
                <span>{payment.user_name || "-"}</span>
              </div>
              <div className="admin-detail-item">
                <label>Email</label>
                <span>{payment.user_email || "-"}</span>
              </div>
              <div className="admin-detail-item">
                <label>SĐT</label>
                <span>{payment.user_phone || "-"}</span>
              </div>
            </div>
          </section>

          <section className="payment-detail-modal__group">
            <h4>Booking</h4>
            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <label>Tên tour</label>
                <span>{payment.ten_tour || "-"}</span>
              </div>
              <div className="admin-detail-item">
                <label>Số người</label>
                <span>{payment.so_nguoi || 0}</span>
              </div>
              <div className="admin-detail-item">
                <label>Ngày đi</label>
                <span>{formatDateVi(payment.start_date, "-")}</span>
              </div>
              <div className="admin-detail-item">
                <label>Booking ID</label>
                <span>#{payment.booking_id}</span>
              </div>
            </div>
          </section>

          <section className="payment-detail-modal__group">
            <h4>Thanh toán</h4>
            <div className="admin-detail-grid">
              <div className="admin-detail-item">
                <label>Số tiền</label>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
              <div className="admin-detail-item">
                <label>Phương thức</label>
                <span>{getMethodLabel(payment.method)}</span>
              </div>
              <div className="admin-detail-item">
                <label>Trạng thái</label>
                <span>
                  <span
                    className={`status-pill status-pill--${normalizedStatus}`}
                  >
                    {getStatusLabel(payment.status)}
                  </span>
                </span>
              </div>
              <div className="admin-detail-item">
                <label>Ngày tạo</label>
                <span>{formatDateVi(payment.created_at, "-")}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="payment-detail-modal__footer">
          <button
            type="button"
            className="admin-btn"
            onClick={onClose}
            disabled={loading}
          >
            Đóng
          </button>

          {canReview ? (
            <>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                disabled={loading}
                onClick={() => onReject(payment)}
              >
                {loading ? (
                  <span className="admin-inline-spinner" aria-hidden="true" />
                ) : null}
                {loading ? "Đang xử lý..." : "Từ chối"}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={loading}
                onClick={() => onConfirm(payment)}
              >
                {loading ? (
                  <span className="admin-inline-spinner" aria-hidden="true" />
                ) : null}
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PaymentDetailModal;
