import PaymentCode from "../PaymentCode";
import "./PaymentMethod.scss";

const METHOD_OPTIONS = [
  {
    value: "pay_at_place",
    label: "Thanh toán khi đến nơi",
  },
  {
    value: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
  },
  {
    value: "paypal",
    label: "PayPal",
  },
];

function PaymentMethod({ selectedMethod, onChangeMethod, bookingId }) {
  return (
    <div className="payment-method">
      {METHOD_OPTIONS.map((option) => (
        <label key={option.value} className="payment-method__option">
          <input
            type="radio"
            name="payment-method"
            value={option.value}
            checked={selectedMethod === option.value}
            onChange={(event) => onChangeMethod(event.target.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}

      {selectedMethod === "bank_transfer" && (
        <div className="payment-method__bank-info">
          <p>
            <strong>Ngân hàng:</strong> Vietcombank
          </p>
          <p>
            <strong>Số tài khoản:</strong> 123456789
          </p>
          <p>
            <strong>Chủ tài khoản:</strong> Booking Tours
          </p>

          <PaymentCode bookingId={bookingId} />
        </div>
      )}
    </div>
  );
}

export default PaymentMethod;
