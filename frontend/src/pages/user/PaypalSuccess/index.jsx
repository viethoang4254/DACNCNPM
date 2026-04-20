import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../../utils/apiClient";
import "../PaypalCallback/index.scss";

const STATUS = {
  PROCESSING: "processing",
  SUCCESS: "success",
  ERROR: "error",
};

function normalizePaypalErrorMessage(rawMessage) {
  const message = String(rawMessage || "").trim();
  const lower = message.toLowerCase();

  if (
    lower.includes("instrument") &&
    (lower.includes("declined") || lower.includes("can't be used"))
  ) {
    return "Phuong thuc thanh toan trong tai khoan PayPal bi tu choi. Vui long chon nguon tien khac trong PayPal hoac thu lai sau.";
  }

  if (lower.includes("payerid") && lower.includes("khop")) {
    return "Thong tin xac thuc PayPal khong hop le. Vui long thanh toan lai tu dau.";
  }

  return message || "Khong the xac nhan thanh toan PayPal.";
}

function PaypalSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCapturedRef = useRef(false);

  const bookingId = Number(searchParams.get("bookingId") || 0);
  const token = searchParams.get("token") || "";
  const payerId = searchParams.get("PayerID") || "";

  const [status, setStatus] = useState(STATUS.PROCESSING);
  const [message, setMessage] = useState("Đang xử lý thanh toán PayPal...");

  useEffect(() => {
    let redirectTimer;

    // React StrictMode can run effects twice in development.
    // This guard avoids sending duplicate capture requests.
    if (hasCapturedRef.current) {
      return undefined;
    }

    if (!bookingId || !token || !payerId) {
      setStatus(STATUS.ERROR);
      setMessage("Thiếu thông tin callback từ PayPal. Vui lòng thử lại.");
      return;
    }

    hasCapturedRef.current = true;

    async function capturePayment() {
      try {
        setStatus(STATUS.PROCESSING);
        setMessage("Đang xác nhận giao dịch với PayPal...");

        const response = await apiClient.post("/api/payments/capture", {
          bookingId,
          token,
          payerId,
        });

        if (response?.data?.success === false) {
          throw new Error(response?.data?.message || "Capture thất bại");
        }

        setStatus(STATUS.SUCCESS);
        setMessage(
          "Thanh toán thành công. Đang chuyển về trang chi tiết booking...",
        );

        // Redirect to the existing booking success page after capture is done.
        redirectTimer = setTimeout(() => {
          navigate(`/payment-success/${bookingId}`, { replace: true });
        }, 2000);
      } catch (error) {
        setStatus(STATUS.ERROR);
        setMessage(
          normalizePaypalErrorMessage(
            error?.response?.data?.message || error?.message,
          ),
        );
      }
    }

    capturePayment();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [bookingId, token, payerId, navigate]);

  return (
    <main className="paypal-callback-page">
      <section className="paypal-callback-page__card">
        <h1>PayPal Callback</h1>

        {status === STATUS.PROCESSING ? (
          <p className="paypal-callback-page__status paypal-callback-page__status--processing">
            Đang xử lý thanh toán...
          </p>
        ) : null}

        {status === STATUS.SUCCESS ? (
          <p className="paypal-callback-page__status paypal-callback-page__status--success">
            Thanh toán thành công.
          </p>
        ) : null}

        {status === STATUS.ERROR ? (
          <p className="paypal-callback-page__status paypal-callback-page__status--error">
            Thanh toán thất bại.
          </p>
        ) : null}

        <p className="paypal-callback-page__message">{message}</p>

        <div className="paypal-callback-page__actions">
          {status === STATUS.ERROR && bookingId > 0 ? (
            <Link
              to={`/checkout/${bookingId}`}
              className="paypal-callback-page__btn paypal-callback-page__btn--solid"
            >
              Thu thanh toan lai
            </Link>
          ) : null}
          <Link
            to="/info-user/bookings"
            className="paypal-callback-page__btn paypal-callback-page__btn--ghost"
          >
            Xem lịch sử booking
          </Link>
          <Link
            to="/tours"
            className="paypal-callback-page__btn paypal-callback-page__btn--ghost"
          >
            Quay lại danh sách tour
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaypalSuccess;
