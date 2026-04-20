import { Link, useSearchParams } from "react-router-dom";
import "../PaypalCallback/index.scss";

function PaypalCancel() {
  const [searchParams] = useSearchParams();
  const bookingId = Number(searchParams.get("bookingId") || 0);

  return (
    <main className="paypal-callback-page">
      <section className="paypal-callback-page__card paypal-callback-page__card--cancel">
        <h1>Bạn đã hủy thanh toán PayPal</h1>
        <p className="paypal-callback-page__message">
          Không có giao dịch nào được ghi nhận. Bạn có thể quay lại trang thanh
          toán để thử lại.
        </p>

        <div className="paypal-callback-page__actions">
          {bookingId > 0 ? (
            <Link
              to={`/checkout/${bookingId}`}
              className="paypal-callback-page__btn paypal-callback-page__btn--solid"
            >
              Quay lại trang thanh toán
            </Link>
          ) : (
            <Link
              to="/tours"
              className="paypal-callback-page__btn paypal-callback-page__btn--solid"
            >
              Quay lại danh sách tour
            </Link>
          )}
          <Link
            to="/info-user/bookings"
            className="paypal-callback-page__btn paypal-callback-page__btn--ghost"
          >
            Xem lịch sử booking
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaypalCancel;
