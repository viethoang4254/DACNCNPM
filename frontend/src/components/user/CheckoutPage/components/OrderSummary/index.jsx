import "./OrderSummary.scss";
import OptimizedTourImage from "../../../../common/OptimizedTourImage";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function OrderSummary({ booking, pricing }) {
  const imageUrl = booking?.image || "";

  return (
    <aside className="order-summary">
      <h3>Tóm tắt đơn hàng</h3>

      {imageUrl ? (
        <OptimizedTourImage
          src={imageUrl}
          alt={booking?.tour?.ten_tour || "Tour"}
          className="order-summary__image"
        />
      ) : (
        <div className="order-summary__image-placeholder">Chưa có ảnh tour</div>
      )}

      <div className="order-summary__body">
        <h4>{booking?.tour?.ten_tour || "Chưa có tên tour"}</h4>

        <div className="order-summary__row">
          <span>Ngày khởi hành</span>
          <strong>{formatDate(booking?.schedule?.start_date) || "-"}</strong>
        </div>

        <div className="order-summary__row">
          <span>Số người</span>
          <strong>{booking?.so_nguoi || 0}</strong>
        </div>

        <div className="order-summary__row">
          <span>Giá mỗi người</span>
          <strong>{formatCurrency(booking?.tour?.gia)} VND</strong>
        </div>

        <div className="order-summary__row">
          <span>Giá gốc</span>
          <strong className={pricing?.discount > 0 ? "is-original" : ""}>
            {formatCurrency(pricing?.originalTotal)} VND
          </strong>
        </div>

        <div className="order-summary__row">
          <span>Giảm giá</span>
          <strong className="is-discount">
            -{formatCurrency(pricing?.discountTotal)} VND
          </strong>
        </div>

        <div className="order-summary__row order-summary__row--total">
          <span>Tổng tiền</span>
          <strong>{formatCurrency(pricing?.total)} VND</strong>
        </div>
      </div>
    </aside>
  );
}

export default OrderSummary;
