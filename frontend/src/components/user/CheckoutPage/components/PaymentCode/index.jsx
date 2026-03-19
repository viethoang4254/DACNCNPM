import { useState } from "react";
import "./PaymentCode.scss";

function PaymentCode({ bookingId }) {
  const [copied, setCopied] = useState(false);
  const paymentCode = `BOOKING#${bookingId || ""}`;

  const handleCopyCode = async () => {
    if (!paymentCode.trim()) return;

    try {
      await navigator.clipboard.writeText(paymentCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="payment-code">
      <label htmlFor="payment-code-input">Mã thanh toán</label>
      <div className="payment-code__row">
        <input id="payment-code-input" type="text" value={paymentCode} readOnly />
        <button type="button" onClick={handleCopyCode}>
          {copied ? "Đã copy" : "Copy"}
        </button>
      </div>
      <p>Vui lòng nhập mã này vào nội dung chuyển khoản.</p>
    </div>
  );
}

export default PaymentCode;
