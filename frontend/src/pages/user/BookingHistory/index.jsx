import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getApiMessage, getMyBookings } from "../../../services/userService";
import CancelBookingModal from "../../../components/user/CancelBookingModal";
import BookingCancelInfoModal from "../../../components/user/BookingCancelInfoModal";
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

const getRefundSummary = (booking) => {
  const refundStatus = String(booking?.refund_status || "").toLowerCase();
  const paymentStatus = String(booking?.payment_status || "").toLowerCase();

  if (paymentStatus !== "paid") {
    return null;
  }

  if (refundStatus === "pending") {
    return {
      className: "pending",
      text: "Hoàn tiền: Chờ admin duyệt",
    };
  }

  if (refundStatus === "processed") {
    return {
      className: "processed",
      text: `Hoàn tiền: Đã hoàn ${formatCurrency(booking?.refund_amount)}`,
    };
  }

  if (refundStatus === "failed") {
    return {
      className: "failed",
      text: "Hoàn tiền: Admin đã từ chối yêu cầu hoàn tiền",
    };
  }

  return null;
};

const buildCancellationReason = (booking) => {
  const scheduleStatusKey = String(
    booking?.schedule_status || "",
  ).toLowerCase();
  const isScheduleCancelled =
    scheduleStatusKey === "cancelled" || scheduleStatusKey === "canceled";

  if (String(booking?.trang_thai || "").toLowerCase() !== "cancelled") {
    return "";
  }

  if (isScheduleCancelled) {
    return "Lý do hủy: Lịch khởi hành không đủ số lượng khách tối thiểu.";
  }

  if (booking?.cancel_reason) {
    return `Lý do hủy: ${booking.cancel_reason}.`;
  }

  if (booking?.cancelled_by === "user") {
    return "Lý do hủy: Bạn đã yêu cầu hủy đơn đặt tour.";
  }

  if (booking?.cancelled_by === "system") {
    return "Lý do hủy: Hệ thống tự động hủy do lịch khởi hành không đủ khách.";
  }

  if (String(booking?.payment_status || "").toLowerCase() === "failed") {
    return "Lý do hủy: Thanh toán đã bị admin từ chối.";
  }

  if (
    booking?.cancelled_by === "admin" &&
    String(booking?.refund_status || "").toLowerCase() === "processed"
  ) {
    return "Lý do hủy: Bạn đã yêu cầu hủy đơn, admin đã xử lý yêu cầu hoàn tiền.";
  }

  if (
    booking?.cancelled_by === "admin" &&
    String(booking?.refund_status || "").toLowerCase() === "failed"
  ) {
    return "Lý do hủy: Bạn đã yêu cầu hủy đơn, nhưng admin đã từ chối hoàn tiền.";
  }

  return "Lý do hủy: Đơn đặt tour đã bị hủy bởi admin.";
};

function BookingHistory() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedCancelledBooking, setSelectedCancelledBooking] =
    useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [highlightedBookingIds, setHighlightedBookingIds] = useState([]);
  const refundStatusByBookingIdRef = useRef(new Map());
  const highlightTimersRef = useRef(new Map());

  const highlightProcessedRefunds = useCallback((bookingIds) => {
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) return;

    setHighlightedBookingIds((prev) => [...new Set([...prev, ...bookingIds])]);

    bookingIds.forEach((id) => {
      const existingTimer = highlightTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        setHighlightedBookingIds((prev) => prev.filter((item) => item !== id));
        highlightTimersRef.current.delete(id);
      }, 5000);

      highlightTimersRef.current.set(id, timer);
    });
  }, []);

  const fetchBookings = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setError("");
    }

    try {
      const data = await getMyBookings();
      const nextBookings = Array.isArray(data) ? data : [];

      const upgradedRefundIds = nextBookings
        .filter((item) => {
          const id = Number(item.id);
          if (!id) return false;

          const prevStatus = String(
            refundStatusByBookingIdRef.current.get(id) || "",
          ).toLowerCase();
          const nextStatus = String(item.refund_status || "").toLowerCase();

          return prevStatus === "pending" && nextStatus === "processed";
        })
        .map((item) => Number(item.id));

      refundStatusByBookingIdRef.current = new Map(
        nextBookings.map((item) => [Number(item.id), item.refund_status]),
      );

      highlightProcessedRefunds(upgradedRefundIds);

      setBookings(nextBookings);

      setSelectedCancelledBooking((prev) => {
        if (!prev) return prev;
        return nextBookings.find((item) => item.id === prev.id) || prev;
      });

      setSelectedBooking((prev) => {
        if (!prev) return prev;
        return nextBookings.find((item) => item.id === prev.id) || prev;
      });
    } catch (err) {
      if (!silent) {
        setError(getApiMessage(err, "Không thể tải lịch sử đặt tour"));
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchBookings();

    const timer = setInterval(() => {
      fetchBookings({ silent: true });
    }, 12000);

    const handleFocus = () => {
      fetchBookings({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchBookings({ silent: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchBookings]);

  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((timer) => clearTimeout(timer));
      highlightTimersRef.current.clear();
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
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)),
    );

    // Show success message
    const nextRefundStatus = String(result?.refundStatus || "").toLowerCase();
    if (nextRefundStatus === "pending") {
      setSuccessMessage(
        "Yêu cầu hủy tour đã được gửi. Yêu cầu hoàn tiền đang chờ admin duyệt.",
      );
    } else {
      setSuccessMessage("Yêu cầu hủy tour của bạn đã được gửi thành công.");
    }

    // Close modal
    setSelectedBooking(null);
  };

  const handleOpenCancelledInfo = (booking) => {
    setSelectedCancelledBooking(booking);
  };

  const handleCloseCancelledInfo = () => {
    setSelectedCancelledBooking(null);
  };

  const visibleBookings = useMemo(
    () => bookings.filter((booking) => Boolean(booking.payment_status)),
    [bookings],
  );

  const hasData = useMemo(
    () => visibleBookings.length > 0,
    [visibleBookings.length],
  );

  const selectedCancelledBookingForModal = useMemo(() => {
    if (!selectedCancelledBooking) return null;
    return {
      ...selectedCancelledBooking,
      cancellationReason: buildCancellationReason(selectedCancelledBooking),
    };
  }, [selectedCancelledBooking]);

  return (
    <section className="booking-history">
      <div className="booking-history__head">
        <h1>Lịch sử đặt tour</h1>
        <p>Theo dõi trạng thái các đơn đặt tour gần đây của bạn.</p>
      </div>

      {successMessage && (
        <div className="booking-history__success">✓ {successMessage}</div>
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
            const bookingStatusKey = String(
              booking.trang_thai || "",
            ).toLowerCase();
            const scheduleStatusKey = String(
              booking.schedule_status || "",
            ).toLowerCase();
            const isScheduleCancelled =
              scheduleStatusKey === "cancelled" ||
              scheduleStatusKey === "canceled";
            const effectiveStatusKey = isScheduleCancelled
              ? "cancelled"
              : bookingStatusKey;

            const cancellationReason = buildCancellationReason(booking);
            const refundSummary = getRefundSummary(booking);

            const status = STATUS_MAP[effectiveStatusKey] || {
              label: effectiveStatusKey || "Không rõ",
              className: "pending",
            };

            const daysLeft = getDaysRemaining(booking.start_date);
            const cancelability = canCancelBooking(booking);

            return (
              <article
                key={booking.id}
                className={`booking-history__card ${highlightedBookingIds.includes(Number(booking.id)) ? "booking-history__card--highlight" : ""}`}
              >
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
                    <p
                      className={`booking-history__days-left ${daysLeft < 3 ? "days-left--urgent" : ""}`}
                    >
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
                  {effectiveStatusKey === "cancelled" && refundSummary && (
                    <p
                      className={`booking-history__refund-summary booking-history__refund-summary--${refundSummary.className}`}
                    >
                      <strong>{refundSummary.text}</strong>
                    </p>
                  )}

                  <div className="booking-history__actions">
                    <Link
                      to={`/tours/${booking.tour_id}`}
                      className="booking-history__detail-btn"
                    >
                      Xem chi tiết
                    </Link>
                    {effectiveStatusKey === "cancelled" && (
                      <button
                        className="booking-history__cancel-info-btn"
                        onClick={() =>
                          handleOpenCancelledInfo({
                            ...booking,
                            cancellationReason,
                          })
                        }
                      >
                        Chi tiết hủy tour
                      </button>
                    )}
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

      {selectedCancelledBooking && (
        <BookingCancelInfoModal
          booking={selectedCancelledBookingForModal}
          onClose={handleCloseCancelledInfo}
        />
      )}
    </section>
  );
}

export default BookingHistory;
