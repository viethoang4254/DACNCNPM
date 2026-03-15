import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../../../utils/authStorage";
import CustomerForm from "./components/CustomerForm";
import PaymentMethod from "./components/PaymentMethod";
import OrderSummary from "./components/OrderSummary";
import "./CheckoutPage.scss";

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

function resolveImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function validateCustomerForm(value = {}) {
  const errors = {
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
  };

  if (!String(value.ho_ten || "").trim()) {
    errors.ho_ten = "Vui lòng nhập họ tên.";
  }

  const email = String(value.email || "").trim();
  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    errors.email = "Email không đúng định dạng.";
  }

  const phone = String(value.so_dien_thoai || "").trim();
  if (!phone) {
    errors.so_dien_thoai = "Vui lòng nhập số điện thoại.";
  } else if (!/^[0-9+\-\s]{8,15}$/.test(phone)) {
    errors.so_dien_thoai = "Số điện thoại không hợp lệ.";
  }

  const isValid = !errors.ho_ten && !errors.email && !errors.so_dien_thoai;
  return {
    isValid,
    errors,
  };
}

function normalizeBooking(rawBooking = {}) {
  const tourFromApi = rawBooking?.tour || {};
  const scheduleFromApi = rawBooking?.schedule || {};
  const userFromApi = rawBooking?.user || {};

  return {
    id: Number(rawBooking.id || 0),
    so_nguoi: Number(rawBooking.so_nguoi || 0),
    tong_tien: Number(rawBooking.tong_tien || 0),
    trang_thai: rawBooking.trang_thai || "pending",
    tour: {
      id: Number(tourFromApi.id || rawBooking.tour_id || 0),
      ten_tour: tourFromApi.ten_tour || rawBooking.ten_tour || "",
      gia: Number(tourFromApi.gia || rawBooking.gia || 0),
    },
    schedule: {
      start_date: scheduleFromApi.start_date || rawBooking.start_date || "",
    },
    image:
      resolveImageUrl(rawBooking.image) ||
      rawBooking.image_url ||
      rawBooking.tour_image ||
      tourFromApi.image ||
      "",
    customer: {
      ho_ten: userFromApi.ho_ten || rawBooking.user_name || "",
      email: userFromApi.email || rawBooking.user_email || "",
      so_dien_thoai:
        userFromApi.so_dien_thoai ||
        rawBooking.user_phone ||
        rawBooking.so_dien_thoai ||
        "",
    },
  };
}

function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [customerForm, setCustomerForm] = useState({
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [customerErrors, setCustomerErrors] = useState({
    ho_ten: "",
    email: "",
    so_dien_thoai: "",
  });

  const authToken = useMemo(() => getAuthToken(), []);
  const authUser = useMemo(() => getAuthUser(), []);

  useEffect(() => {
    let isMounted = true;

    async function fetchBookingDetail() {
      const id = Number(bookingId);
      if (!Number.isInteger(id) || id <= 0) {
        setError("Mã booking không hợp lệ.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        });

        const payload = parseJsonSafe(await response.text());

        if (!response.ok || payload?.success === false) {
          const serverMessage =
            payload?.message || "Không thể lấy thông tin booking.";
          throw new Error(serverMessage);
        }

        const normalized = normalizeBooking(payload?.data || payload);

        if (!normalized.id) {
          throw new Error("Dữ liệu booking không hợp lệ.");
        }

        if (normalized.trang_thai === "cancelled") {
          throw new Error(
            "Booking đã hết hạn thanh toán (quá 15 phút). Vui lòng đặt lại tour.",
          );
        }

        if (isMounted) {
          setBooking(normalized);
          setCustomerForm({
            ho_ten:
              normalized.customer.ho_ten || authUser?.ho_ten || authUser?.name || "",
            email: normalized.customer.email || authUser?.email || "",
            so_dien_thoai:
              normalized.customer.so_dien_thoai ||
              authUser?.so_dien_thoai ||
              authUser?.phone ||
              "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Đã xảy ra lỗi khi tải dữ liệu booking.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchBookingDetail();

    return () => {
      isMounted = false;
    };
  }, [bookingId, authToken, authUser]);

  const handleCustomerFieldChange = (field, value) => {
    setCustomerForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setCustomerErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleConfirmPayment = async () => {
    if (!booking?.id) {
      setSubmitError("Không tìm thấy thông tin booking để thanh toán.");
      return;
    }

    if (!selectedMethod) {
      setSubmitError("Vui lòng chọn phương thức thanh toán.");
      return;
    }

    const validation = validateCustomerForm(customerForm);
    if (!validation.isValid) {
      setCustomerErrors(validation.errors);
      setSubmitError("Vui lòng kiểm tra lại thông tin khách hàng.");
      return;
    }

    try {
      setSubmitError("");
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: booking.tong_tien,
          method: selectedMethod,
        }),
      });

      const payload = parseJsonSafe(await response.text());

      if (!response.ok || payload?.success === false) {
        const firstValidationError = payload?.data?.errors?.[0]?.msg;
        const serverMessage =
          firstValidationError ||
          payload?.message ||
          "Không thể tạo thanh toán. Vui lòng thử lại.";
        throw new Error(serverMessage);
      }

      navigate(`/payment-success?bookingId=${booking.id}`, {
        replace: true,
        state: {
          payment: payload?.data || {},
          booking,
        },
      });
    } catch (err) {
      setSubmitError(err?.message || "Thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/tours");
  };

  if (isLoading) {
    return (
      <main className="checkout-page">
        <div className="checkout-page__state">Đang tải thông tin booking...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="checkout-page">
        <div className="checkout-page__state checkout-page__state--error">{error}</div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <h1 className="checkout-page__title">Thanh toán đơn đặt tour</h1>

      <section className="checkout-page__grid">
        <div className="checkout-page__left">
          <article className="checkout-page__card">
            <h2>Thông tin khách hàng</h2>
            <CustomerForm
              value={customerForm}
              errors={customerErrors}
              onFieldChange={handleCustomerFieldChange}
            />
          </article>

          <article className="checkout-page__card">
            <h2>Phương thức thanh toán</h2>
            <PaymentMethod
              selectedMethod={selectedMethod}
              onChangeMethod={(method) => {
                setSelectedMethod(method);
                setSubmitError("");
              }}
              bookingId={booking?.id}
            />

            <div className="checkout-page__payment-total">
              <span>Tổng tiền</span>
              <strong>{Number(booking?.tong_tien || 0).toLocaleString("vi-VN")}đ</strong>
            </div>

            <button
              type="button"
              className="checkout-page__back-btn"
              onClick={handleGoBack}
              disabled={isSubmitting}
            >
              Quay lại
            </button>

            <button
              type="button"
              className="checkout-page__confirm-btn"
              onClick={handleConfirmPayment}
              disabled={isSubmitting || !selectedMethod}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
            </button>
          </article>

          {submitError && <p className="checkout-page__error">{submitError}</p>}
        </div>

        <div className="checkout-page__right">
          <OrderSummary booking={booking} />
        </div>
      </section>
    </main>
  );
}

export default CheckoutPage;
