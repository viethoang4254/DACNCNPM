import PaymentCode from "../PaymentCode";
import "./PaymentMethod.scss";
import qrCodeImage from "../../../../../assets/images/qr-code.jpg";

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
          <div className="payment-method__bank-details">
            <div className="payment-method__bank-text">
              <p>
                <strong>Ngân hàng:</strong> MBBank
              </p>
              <p>
                <strong>Số tài khoản:</strong> 0335661795
              </p>
              <p>
                <strong>Chủ tài khoản:</strong> PhAN MINH HAU
              </p>

              <PaymentCode bookingId={bookingId} />
            </div>

            <div className="payment-method__qr-wrap">
              <img
                src={qrCodeImage}
                alt="QR chuyển khoản ngân hàng"
                className="payment-method__qr-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentMethod;
