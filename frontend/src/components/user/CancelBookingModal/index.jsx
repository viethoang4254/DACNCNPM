import { useState } from "react";
import { getCancelPreview, cancelBooking } from "../../../services/userService";
import { getApiMessage } from "../../../services/userService";
import "./CancelBookingModal.scss";

function CancelBookingModal({ booking, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelPreview, setCancelPreview] = useState(null);
  const [step, setStep] = useState("confirm"); // 'confirm' or 'preview'

  const handleLoadPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const preview = await getCancelPreview(booking.id);
      setCancelPreview(preview);
      setStep("preview");
    } catch (err) {
      setError(
        getApiMessage(err, "Không thể tải thông tin hoàn tiền. Vui lòng thử lại.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await cancelBooking(booking.id);
      if (result) {
        onSuccess(result);
      }
    } catch (err) {
      setError(
        getApiMessage(err, "Không thể hủy tour. Vui lòng thử lại.")
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  return (
    <div className="cancel-booking-modal">
      <div className="cancel-booking-modal__overlay" onClick={onCancel} />
      <div className="cancel-booking-modal__content">
        <button
          className="cancel-booking-modal__close"
          onClick={onCancel}
          aria-label="Close"
        >
          ×
        </button>

        {step === "confirm" && (
          <>
            <h2 className="cancel-booking-modal__title">
              Bạn có chắc muốn hủy tour?
            </h2>
            <p className="cancel-booking-modal__subtitle">
              Tour: <strong>{booking.ten_tour}</strong>
            </p>
            <p className="cancel-booking-modal__date">
              Ngày khởi hành:{" "}
              <strong>
                {new Date(booking.start_date).toLocaleDateString("vi-VN")}
              </strong>
            </p>

            {error && (
              <div className="cancel-booking-modal__error">{error}</div>
            )}

            <div className="cancel-booking-modal__warning">
              <p>
                ⚠️ Hủy tour sẽ không thể hoàn tác. Bạn sẽ nhận được hoàn tiền
                dựa trên chính sách:
              </p>
              <ul>
                <li>Còn ≥7 ngày: Hoàn 100%</li>
                <li>Còn 3-6 ngày: Hoàn 70%</li>
                <li>Còn 1-2 ngày: Hoàn 30%</li>
                <li>Còn &lt;24 giờ: Hoàn 0%</li>
              </ul>
            </div>

            <div className="cancel-booking-modal__actions">
              <button
                className="cancel-booking-modal__btn cancel-booking-modal__btn--cancel"
                onClick={onCancel}
                disabled={loading}
              >
                Tiếp tục
              </button>
              <button
                className="cancel-booking-modal__btn cancel-booking-modal__btn--confirm"
                onClick={handleLoadPreview}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem hoàn tiền dự kiến"}
              </button>
            </div>
          </>
        )}

        {step === "preview" && cancelPreview && (
          <>
            <h2 className="cancel-booking-modal__title">
              Xác nhận hủy tour
            </h2>

            <div className="cancel-booking-modal__preview">
              <div className="preview-item">
                <span>Tên tour:</span>
                <strong>{cancelPreview.tourName}</strong>
              </div>
              <div className="preview-item">
                <span>Ngày khởi hành:</span>
                <strong>
                  {new Date(cancelPreview.startDate).toLocaleDateString("vi-VN")}
                </strong>
              </div>
              <div className="preview-item">
                <span>Còn lại:</span>
                <strong>
                  {cancelPreview.daysLeft} ngày
                </strong>
              </div>
              <div className="preview-item">
                <span>Tổng tiền:</span>
                <strong>{formatCurrency(cancelPreview.originalAmount)}</strong>
              </div>
              <div className="preview-item preview-item--highlight">
                <span>Hoàn tiền ({cancelPreview.refundPercentage}%):</span>
                <strong className="refund-amount">
                  {formatCurrency(cancelPreview.refundAmount)}
                </strong>
              </div>
              <div className="preview-message">
                <p>{cancelPreview.message}</p>
              </div>
            </div>

            {error && (
              <div className="cancel-booking-modal__error">{error}</div>
            )}

            <div className="cancel-booking-modal__actions">
              <button
                className="cancel-booking-modal__btn cancel-booking-modal__btn--cancel"
                onClick={() => setStep("confirm")}
                disabled={loading}
              >
                Quay lại
              </button>
              <button
                className="cancel-booking-modal__btn cancel-booking-modal__btn--confirm"
                onClick={handleConfirmCancel}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CancelBookingModal;
