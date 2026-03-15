import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

function PaymentSuccess() {
  const { state } = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const bookingIdFromUrl = Number(searchParams.get("bookingId") || 0);

  const [booking, setBooking] = useState(state?.booking || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    return () => {
      ignore = true;
    };
  }, [booking?.id, bookingIdFromUrl]);

  return (
    <main className="payment-success-page">
      <section className="payment-success-page__card">
        <p className="payment-success-page__tag">Payment Success</p>
        <h1>Thanh toán đã được tạo thành công</h1>
        <p>
          Đơn của bạn đang ở trạng thái chờ xử lý. Chúng tôi sẽ xác nhận trong
          thời gian sớm nhất.
        </p>

        {isLoading && <p className="payment-success-page__hint">Đang tải thông tin booking...</p>}
        {error && <p className="payment-success-page__hint payment-success-page__hint--error">{error}</p>}

        {booking?.id ? (
          <div className="payment-success-page__meta">
            <div>
              <span>Mã booking</span>
              <strong>BOOKING#{booking.id}</strong>
            </div>
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
          <Link to="/" className="payment-success-page__btn payment-success-page__btn--solid">
            Về trang chủ
          </Link>
          <Link to="/tours" className="payment-success-page__btn payment-success-page__btn--ghost">
            Quay về trang Tours
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaymentSuccess;
