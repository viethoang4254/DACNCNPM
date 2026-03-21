import { useEffect, useState } from "react";
import { getCancelPreview, cancelBooking } from "../../../services/userService";
import { getApiMessage } from "../../../services/userService";
import "./CancelBookingModal.scss";

function CancelBookingModal({ booking, onCancel, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [step, setStep] = useState("confirm"); // 'confirm' or 'preview'

  useEffect(() => {
    let ignore = false;

    const preloadPreview = async () => {
      setLoading(true);
      setError("");
      try {
        const preview = await getCancelPreview(booking.id);
        if (ignore) return;
        setCancelPreview(preview);
      } catch (err) {
        if (ignore) return;
        setError(
          getApiMessage(
            err,
            "Không thể tải thông tin hoàn tiền. Vui lòng thử lại.",
          ),
        );
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    preloadPreview();

    return () => {
      ignore = true;
    };
  }, [booking.id]);

  const handleLoadPreview = async () => {
    if (cancelPreview) {
      setStep("preview");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const preview = await getCancelPreview(booking.id);
      setCancelPreview(preview);
      setStep("preview");
    } catch (err) {
      setError(
        getApiMessage(
          err,
          "Không thể tải thông tin hoàn tiền. Vui lòng thử lại.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await cancelBooking(booking.id, {
        cancel_reason: cancelReason.trim() || undefined,
      });
      if (result) {
        onSuccess(result);
      }
    } catch (err) {
      setError(getApiMessage(err, "Không thể hủy tour. Vui lòng thử lại."));
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

  const getPreviewMessageVi = (preview) => {
    const rawMessage = String(preview?.message || "").toLowerCase();
    if (rawMessage.includes("hệ thống hủy") || rawMessage.includes("system")) {
      return "Tour đã bị hệ thống hủy, mức hoàn tiền dự kiến là 100%.";
    }

    const percent = Number(preview?.refundPercentage || 0);
    if (percent === 100) {
      return "Mức hoàn tiền dự kiến là 100% theo chính sách hiện tại.";
    }
    if (percent === 70) {
      return "Mức hoàn tiền dự kiến là 70% theo chính sách hiện tại.";
    }
    if (percent === 30) {
      return "Mức hoàn tiền dự kiến là 30% theo chính sách hiện tại.";
    }
    return "Hiện tại mức hoàn tiền dự kiến cho yêu cầu này là 0%.";
  };

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
              <p>Hủy tour sẽ không thể hoàn tác.</p>
              {cancelPreview ? (
                <p className="cancel-booking-modal__estimated-refund">
                  Hoàn tiền dự kiến:{" "}
                  <strong>{cancelPreview.refundPercentage}%</strong> (~
                  {formatCurrency(cancelPreview.refundAmount)})
                </p>
              ) : (
                <p className="cancel-booking-modal__estimated-refund">
                  Đang tính toán số tiền hoàn dự kiến...
                </p>
              )}
              <div className="cancel-booking-modal__reason-block">
                <label htmlFor="cancel-reason">
                  Lý do hủy (không bắt buộc)
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  maxLength={500}
                  placeholder="Ví dụ: Thay đổi kế hoạch cá nhân"
                  onChange={(event) => setCancelReason(event.target.value)}
                />
                <p>{cancelReason.trim().length}/500 ký tự</p>
              </div>
              <ul>
                <li>Còn ≥7 ngày: Hoàn 100%</li>
                <li>Còn 3-6 ngày: Hoàn 70%</li>
                <li>Còn 1-2 ngày: Hoàn 30%</li>
                <li>Còn &lt;24 giờ: Hoàn 0%</li>
                <li>Tour bị hệ thống hủy: Hoàn 100%</li>
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
                {loading ? "Đang tải..." : "Xem chi tiết hoàn tiền"}
              </button>
            </div>
          </>
        )}

        {step === "preview" && cancelPreview && (
          <>
            <h2 className="cancel-booking-modal__title">Xác nhận hủy tour</h2>

            <div className="cancel-booking-modal__preview">
              <div className="preview-item">
                <span>Tên tour:</span>
                <strong>{cancelPreview.tourName}</strong>
              </div>
              <div className="preview-item">
                <span>Ngày khởi hành:</span>
                <strong>
                  {new Date(cancelPreview.startDate).toLocaleDateString(
                    "vi-VN",
                  )}
                </strong>
              </div>
              <div className="preview-item">
                <span>Còn lại:</span>
                <strong>{cancelPreview.daysLeft} ngày</strong>
              </div>
              <div className="preview-item">
                <span>Tổng tiền:</span>
                <strong>{formatCurrency(cancelPreview.originalAmount)}</strong>
              </div>
              <div className="preview-item preview-item--highlight">
                <span>
                  Hoàn tiền dự kiến ({cancelPreview.refundPercentage}%):
                </span>
                <strong className="refund-amount">
                  {formatCurrency(cancelPreview.refundAmount)}
                </strong>
              </div>
              <div className="preview-message">
                <p>{getPreviewMessageVi(cancelPreview)}</p>
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
