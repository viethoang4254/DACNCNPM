import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./PaypalCancel.scss";

function safeInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function PaypalCancel() {
  const [searchParams] = useSearchParams();

  const bookingId = useMemo(
    () => safeInt(searchParams.get("bookingId")),
    [searchParams],
  );

  return (
    <main className="paypal-callback-page">
      <section className="paypal-callback-page__card">
        <h1>Đã hủy thanh toán PayPal</h1>
        <p className="paypal-callback-page__hint">
          Bạn đã hủy thao tác thanh toán. Bạn có thể quay lại để chọn phương thức
          khác hoặc thanh toán lại.
        </p>

        <div className="paypal-callback-page__actions">
          {bookingId ? (
            <Link
              to={`/checkout/${bookingId}`}
              className="paypal-callback-page__btn paypal-callback-page__btn--solid"
            >
              Quay lại thanh toán
            </Link>
          ) : (
            <Link
              to="/tours"
              className="paypal-callback-page__btn paypal-callback-page__btn--solid"
            >
              Về trang Tours
            </Link>
          )}

          <Link
            to="/"
            className="paypal-callback-page__btn paypal-callback-page__btn--ghost"
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaypalCancel;
