import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiClient from "../../../utils/apiClient";
import { getAuthUser } from "../../../utils/authStorage";
import { getPriceInfo } from "../../../utils/price";
import CustomerForm from "./components/CustomerForm";
import PaymentMethod from "./components/PaymentMethod";
import OrderSummary from "./components/OrderSummary";
import "./CheckoutPage.scss";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const PAYPAL_VND_TO_USD_RATE = Number(
  import.meta.env.VITE_PAYPAL_VND_TO_USD_RATE || 25000,
);

function convertVndToUsd(vndAmount) {
  const normalizedVnd = Number(vndAmount || 0);
  const rate =
    Number.isFinite(PAYPAL_VND_TO_USD_RATE) && PAYPAL_VND_TO_USD_RATE > 0
      ? PAYPAL_VND_TO_USD_RATE
      : 25000;

  if (!Number.isFinite(normalizedVnd) || normalizedVnd <= 0) {
    return 0;
  }

  return Math.round((normalizedVnd / rate) * 100) / 100;
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
    payment_status: rawBooking.payment_status || "pending",
    tour: {
      id: Number(tourFromApi.id || rawBooking.tour_id || 0),
      ten_tour: tourFromApi.ten_tour || rawBooking.ten_tour || "",
      gia: Number(tourFromApi.gia || rawBooking.gia || 0),
    },
    schedule: {
      start_date: scheduleFromApi.start_date || rawBooking.start_date || "",
      is_on_sale: Boolean(
        scheduleFromApi.is_on_sale ?? rawBooking.is_on_sale ?? false,
      ),
      discount_percent: Number(
        scheduleFromApi.discount_percent ?? rawBooking.discount_percent ?? 0,
      ),
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

function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
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
  const [paypalQuote, setPaypalQuote] = useState({
    amountUsd: 0,
    amountVnd: 0,
    rate:
      Number.isFinite(PAYPAL_VND_TO_USD_RATE) && PAYPAL_VND_TO_USD_RATE > 0
        ? PAYPAL_VND_TO_USD_RATE
        : 25000,
    isLoading: false,
    source: "local",
  });

  const authUser = useMemo(() => getAuthUser(), []);

  const pricing = useMemo(() => {
    const people = Number(booking?.so_nguoi || 0);
    const priceInfo = getPriceInfo(
      booking?.tour || {},
      booking?.schedule || {},
    );

    const unitFinal = Number(priceInfo.finalPrice || 0);
    const unitOriginal = Number(
      priceInfo.originalPrice ?? booking?.tour?.gia ?? 0,
    );
    const originalTotal = unitOriginal * people;
    const finalTotal = unitFinal * people;
    const discountTotal = Math.max(0, originalTotal - finalTotal);

    return {
      discount: Number(priceInfo.discount || 0),
      originalTotal,
      discountTotal,
      total: finalTotal,
    };
  }, [booking]);

  const paypalEstimate = useMemo(() => {
    const amountUsd = convertVndToUsd(pricing.total);
    return {
      rate:
        Number.isFinite(PAYPAL_VND_TO_USD_RATE) && PAYPAL_VND_TO_USD_RATE > 0
          ? PAYPAL_VND_TO_USD_RATE
          : 25000,
      amountUsd,
    };
  }, [pricing.total]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPaypalQuote() {
      if (selectedMethod !== "paypal" || !booking?.id) {
        if (isMounted) {
          setPaypalQuote((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
        return;
      }

      setPaypalQuote((prev) => ({
        ...prev,
        isLoading: true,
      }));

      try {
        const response = await apiClient.get(`/api/paypal/quote/${booking.id}`);
        const payload = response?.data || {};

        if (!isMounted) return;

        const amountUsd = Number(payload.amountUsd || 0);
        const amountVnd = Number(payload.amountVnd || 0);
        const rate = Number(payload.rate || 0);

        setPaypalQuote({
          amountUsd: Number.isFinite(amountUsd)
            ? amountUsd
            : paypalEstimate.amountUsd,
          amountVnd: Number.isFinite(amountVnd)
            ? amountVnd
            : Number(pricing.total || 0),
          rate: Number.isFinite(rate) && rate > 0 ? rate : paypalEstimate.rate,
          isLoading: false,
          source: "server",
        });
      } catch {
        if (!isMounted) return;

        setPaypalQuote({
          amountUsd: paypalEstimate.amountUsd,
          amountVnd: Number(pricing.total || 0),
          rate: paypalEstimate.rate,
          isLoading: false,
          source: "local",
        });
      }
    }

    fetchPaypalQuote();

    return () => {
      isMounted = false;
    };
  }, [
    selectedMethod,
    booking?.id,
    pricing.total,
    paypalEstimate.amountUsd,
    paypalEstimate.rate,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPaymentAndBooking() {
      const id = Number(bookingId);
      if (!Number.isInteger(id) || id <= 0) {
        setError("Mã booking không hợp lệ.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const bookingRes = await apiClient.get(`/api/bookings/${id}`);
        const normalized = normalizeBooking(bookingRes?.data?.data || {});

        if (!normalized.id) {
          throw new Error("Dữ liệu booking không hợp lệ.");
        }

        if (normalized.trang_thai === "cancelled") {
          throw new Error(
            "Booking đã hết hạn thanh toán hoặc đã bị hủy. Vui lòng đặt lại tour.",
          );
        }

        let foundPayment = null;
        try {
          const paymentRes = await apiClient.get(`/api/payments/booking/${id}`);
          foundPayment = paymentRes?.data?.data || null;
        } catch (paymentErr) {
          if (paymentErr?.response?.status !== 404) {
            throw paymentErr;
          }
        }

        if (isMounted) {
          setBooking(normalized);
          setPaymentId(foundPayment?.id || null);
          setSelectedMethod(foundPayment?.method || "");
          setCustomerForm({
            ho_ten:
              normalized.customer.ho_ten ||
              authUser?.ho_ten ||
              authUser?.name ||
              "",
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
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Đã xảy ra lỗi khi tải dữ liệu booking.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPaymentAndBooking();

    return () => {
      isMounted = false;
    };
  }, [bookingId, authUser]);

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
    console.log("selectedMethod:", selectedMethod);

    if (!booking?.id) {
      setSubmitError("Không tìm thấy thông tin booking để xử lý thanh toán.");
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

      // 🔥 FIX CHẮC ĂN PAYPAL
      if (selectedMethod?.toLowerCase().trim() === "paypal") {
        console.log("👉 ĐÃ VÀO PAYPAL");

        try {
          const res = await apiClient.post("/api/paypal/create", {
            bookingId: booking.id,
          });

          console.log("PayPal response:", res.data);

          if (!res.data?.approvalUrl) {
            throw new Error("Không nhận được approvalUrl từ PayPal");
          }

          // 🚀 REDIRECT
          window.location.href = res.data.approvalUrl;
          return;
        } catch (err) {
          console.error("PAYPAL ERROR:", err);
          setSubmitError("Không thể kết nối PayPal");
          toast.error("Lỗi PayPal");
          setIsSubmitting(false);
          return;
        }
      }

      // 🔵 FLOW CŨ (COD / BANK)
      let nextPaymentId = paymentId;

      if (!nextPaymentId) {
        const createRes = await apiClient.post("/api/payments", {
          booking_id: booking.id,
          amount: pricing.total,
          method: selectedMethod,
          status: "pending",
        });
        nextPaymentId = createRes?.data?.data?.id;
      }

      if (!nextPaymentId) {
        throw new Error("Không thể xác định mã thanh toán.");
      }

      await apiClient.put(`/api/payments/${nextPaymentId}/user-confirm`);
      setPaymentId(nextPaymentId);

      toast.success(
        "Đã gửi yêu cầu xác nhận thanh toán. Vui lòng chờ admin duyệt.",
      );

      navigate(`/payment-success/${booking.id}?paymentId=${nextPaymentId}`, {
        replace: true,
        state: {
          paymentId: nextPaymentId,
          paymentMethod: selectedMethod,
          booking,
        },
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.";
      setSubmitError(message);
      toast.error(message);
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
        <div className="checkout-page__state">
          <span className="checkout-page__spinner" aria-hidden="true" />
          Đang tải thông tin booking...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="checkout-page">
        <div className="checkout-page__state checkout-page__state--error">
          {error}
        </div>
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
              <div className="checkout-page__payment-row">
                <span>Giá gốc</span>
                <strong className={pricing.discount > 0 ? "is-original" : ""}>
                  {Number(pricing.originalTotal || 0).toLocaleString("vi-VN")}đ
                </strong>
              </div>

              <div className="checkout-page__payment-row">
                <span>Giảm giá</span>
                <strong className="is-discount">
                  -{Number(pricing.discountTotal || 0).toLocaleString("vi-VN")}đ
                </strong>
              </div>

              <div className="checkout-page__payment-row checkout-page__payment-row--total">
                <span>Tổng tiền</span>
                <strong>
                  {Number(pricing.total || 0).toLocaleString("vi-VN")}đ
                </strong>
              </div>

              {selectedMethod === "paypal" ? (
                <div className="checkout-page__paypal-estimate" role="note">
                  <p className="checkout-page__paypal-estimate-title">
                    Ước tính thanh toán PayPal
                  </p>
                  <p className="checkout-page__paypal-estimate-value">
                    {paypalQuote.amountUsd.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </p>
                  <p className="checkout-page__paypal-estimate-note">
                    Tỷ giá tạm tính: 1 USD ={" "}
                    {paypalQuote.rate.toLocaleString("vi-VN")} VND.
                    {paypalQuote.source === "server"
                      ? " (đồng bộ từ hệ thống)"
                      : " (fallback local)"}
                  </p>
                  {paypalQuote.isLoading ? (
                    <p className="checkout-page__paypal-estimate-note">
                      Đang đồng bộ số tiền PayPal từ hệ thống...
                    </p>
                  ) : null}
                </div>
              ) : null}
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
              {isSubmitting ? "Đang gửi yêu cầu..." : "Xác nhận thanh toán"}
            </button>
          </article>

          {submitError && <p className="checkout-page__error">{submitError}</p>}
        </div>

        <div className="checkout-page__right">
          <OrderSummary booking={booking} pricing={pricing} />
        </div>
      </section>
    </main>
  );
}

export default PaymentPage;
