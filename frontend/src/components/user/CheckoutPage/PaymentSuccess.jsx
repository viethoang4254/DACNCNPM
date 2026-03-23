import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getAuthToken } from "../../../utils/authStorage";
import "./PaymentSuccess.scss";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function parseJsonSafe(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function normalizeBooking(rawBooking = {}) {
  const tourFromApi = rawBooking?.tour || {};
  const scheduleFromApi = rawBooking?.schedule || {};

  return {
    id: Number(rawBooking.id || 0),
    tong_tien: Number(rawBooking.tong_tien || 0),
    tour: {
      ten_tour: tourFromApi.ten_tour || rawBooking.ten_tour || "",
    },
    schedule: {
      start_date: scheduleFromApi.start_date || rawBooking.start_date || "",
    },
  };
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function normalizePaymentMethod(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function isCodMethod(value) {
  const normalized = normalizePaymentMethod(value);
  return [
    "pay_at_place",
    "pay_later",
    "cod",
    "cash",
    "cash_on_delivery",
  ].includes(normalized);
}

function getPaymentMethodLabel(value) {
  const normalized = normalizePaymentMethod(value);
  if (
    normalized === "pay_at_place" ||
    normalized === "pay_later" ||
    normalized === "cod"
  ) {
    return "Thanh toán khi đến nơi (COD)";
  }
  if (normalized === "bank_transfer") {
    return "Chuyển khoản ngân hàng";
  }
  if (normalized === "paypal") {
    return "PayPal";
  }
  if (normalized === "cash" || normalized === "cash_on_delivery") {
    return "Tiền mặt (COD)";
  }
  return "Đang cập nhật";
}

function PaymentSuccess() {
  const { bookingId: bookingIdParam } = useParams();
  const { state } = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const bookingIdFromQuery = Number(searchParams.get("bookingId") || 0);
  const bookingIdFromPath = Number(bookingIdParam || 0);
  const bookingIdFromUrl = bookingIdFromPath || bookingIdFromQuery;
  const paymentId = Number(
    state?.paymentId || searchParams.get("paymentId") || 0,
  );

  const [booking, setBooking] = useState(state?.booking || null);
  const [payment, setPayment] = useState({
    id: paymentId || null,
    method: state?.paymentMethod || "",
    status: "pending",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isCodPayment = isCodMethod(payment?.method);
  const pageTag = isCodPayment ? "Booking Confirmed" : "Payment Pending";
  const pageTitle = isCodPayment
    ? "Đặt tour thành công"
    : "Yêu cầu thanh toán đã được gửi";
  const pageDescription = isCodPayment
    ? "Bạn chọn thanh toán khi đến nơi. Vui lòng dùng mã booking khi check-in để hoàn tất thanh toán."
    : "Đơn của bạn đang ở trạng thái chờ xử lý. Chúng tôi sẽ xác nhận trong thời gian sớm nhất.";

  useEffect(() => {
    let ignore = false;

    async function fetchBookingFallback() {
      if (booking?.id || bookingIdFromUrl <= 0) {
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const token = getAuthToken();
        const response = await fetch(
          `${API_BASE_URL}/api/bookings/${bookingIdFromUrl}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const payload = parseJsonSafe(await response.text());
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Không thể tải booking.");
        }

        if (!ignore) {
          setBooking(normalizeBooking(payload?.data || payload));
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.message || "Không thể tải thông tin booking.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchBookingFallback();

    async function fetchPaymentFallback() {
      if (bookingIdFromUrl <= 0) {
        return;
      }

      try {
        const token = getAuthToken();
        const response = await fetch(
          `${API_BASE_URL}/api/payments/booking/${bookingIdFromUrl}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const payload = parseJsonSafe(await response.text());
        if (!response.ok || payload?.success === false) {
          return;
        }

        const paymentData = payload?.data || {};
        if (!ignore) {
          setPayment((prev) => ({
            id: Number(paymentData?.id || prev?.id || 0) || null,
            method: paymentData?.method || prev?.method || "",
            status: paymentData?.status || prev?.status || "pending",
          }));
        }
      } catch {
        // Keep UI resilient when payment fallback cannot be loaded.
      }
    }

    fetchPaymentFallback();

    return () => {
      ignore = true;
    };
  }, [booking?.id, bookingIdFromUrl]);

  return (
    <main className="payment-success-page">
      <section className="payment-success-page__card">
        <p
          className={`payment-success-page__tag ${isCodPayment ? "payment-success-page__tag--cod" : ""}`}
        >
          {pageTag}
        </p>
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>

        {isLoading && (
          <p className="payment-success-page__hint">
            Đang tải thông tin booking...
          </p>
        )}
        {error && (
          <p className="payment-success-page__hint payment-success-page__hint--error">
            {error}
          </p>
        )}

        {booking?.id ? (
          <div className="payment-success-page__meta">
            <div>
              <span>Mã booking</span>
              <strong>BOOKING#{booking.id}</strong>
            </div>
            <div>
              <span>Phương thức thanh toán</span>
              <strong>{getPaymentMethodLabel(payment?.method)}</strong>
            </div>
            {!isCodPayment && (
              <div>
                <span>Mã thanh toán</span>
                <strong>
                  {(payment?.id || paymentId) > 0
                    ? `PAYMENT#${payment?.id || paymentId}`
                    : "Đang xử lý"}
                </strong>
              </div>
            )}
            <div>
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(booking.tong_tien)} VND</strong>
            </div>
            <div>
              <span>Tên tour</span>
              <strong>{booking?.tour?.ten_tour || "-"}</strong>
            </div>
            <div>
              <span>Ngày khởi hành</span>
              <strong>{formatDate(booking?.schedule?.start_date)}</strong>
            </div>
          </div>
        ) : null}

        <div className="payment-success-page__actions">
          <Link
            to="/"
            className="payment-success-page__btn payment-success-page__btn--solid"
          >
            Về trang chủ
          </Link>
          <Link
            to="/tours"
            className="payment-success-page__btn payment-success-page__btn--ghost"
          >
            Quay về trang Tours
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaymentSuccess;
