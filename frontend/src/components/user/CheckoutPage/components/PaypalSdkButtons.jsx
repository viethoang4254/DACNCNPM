import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import apiClient from "../../../../utils/apiClient";

function normalizePaypalCaptureError(error) {
  const issue =
    error?.response?.data?.data?.paypalError?.details?.[0]?.issue ||
    error?.response?.data?.data?.paypalError?.name ||
    "";

  if (issue === "INSTRUMENT_DECLINED") {
    return "PayPal đã từ chối phương thức thanh toán (INSTRUMENT_DECLINED). Vui lòng thử lại bằng tài khoản/nguồn tiền khác.";
  }

  if (issue === "ORDER_ALREADY_CAPTURED") {
    return "Đơn PayPal đã được thanh toán trước đó.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Không thể xử lý thanh toán PayPal. Vui lòng thử lại."
  );
}

function PaypalSdkButtons({
  bookingId,
  amount,
  payerNote,
  onValidate,
  onSuccess,
  onProcessingChange,
}) {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";
  const [localError, setLocalError] = useState("");

  const scriptOptions = useMemo(() => {
    return {
      clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons",
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <p className="checkout-page__error">
        Chưa cấu hình PayPal JS SDK. Vui lòng thêm `VITE_PAYPAL_CLIENT_ID` vào
        file .env của frontend.
      </p>
    );
  }

  const parsedBookingId = Number(bookingId);
  const parsedAmount = Number(amount);

  if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
    return <p className="checkout-page__error">bookingId không hợp lệ.</p>;
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return <p className="checkout-page__error">Số tiền thanh toán không hợp lệ.</p>;
  }

  return (
    <div style={{ marginTop: 14 }}>
      {localError && <p className="checkout-page__error">{localError}</p>}

      <PayPalScriptProvider options={scriptOptions}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={async () => {
            setLocalError("");

            if (typeof onValidate === "function") {
              const ok = onValidate();
              if (!ok) {
                throw new Error("Vui lòng kiểm tra lại thông tin trước khi thanh toán.");
              }
            }

            if (typeof onProcessingChange === "function") {
              onProcessingChange(true);
            }

            try {
              const res = await apiClient.post("/api/paypal/create", {
                bookingId: parsedBookingId,
                amount: parsedAmount,
                note: payerNote || undefined,
              });

              const orderId = res?.data?.orderId;
              if (!orderId) {
                throw new Error("Không nhận được orderId từ backend.");
              }

              return orderId;
            } finally {
              if (typeof onProcessingChange === "function") {
                onProcessingChange(false);
              }
            }
          }}
          onApprove={async (data) => {
            setLocalError("");

            const token = data?.orderID || "";
            const payerId = data?.payerID || "";

            if (!token || !payerId) {
              setLocalError("Thiếu thông tin orderID/payerID từ PayPal.");
              return;
            }

            if (typeof onProcessingChange === "function") {
              onProcessingChange(true);
            }

            try {
              await apiClient.post("/api/payments/capture", {
                bookingId: parsedBookingId,
                token,
                payerId,
              });

              toast.success("Thanh toán PayPal thành công.");
              if (typeof onSuccess === "function") {
                onSuccess({ bookingId: parsedBookingId, token, payerId });
              }
            } catch (error) {
              const message = normalizePaypalCaptureError(error);
              setLocalError(message);
              toast.error(message);
            } finally {
              if (typeof onProcessingChange === "function") {
                onProcessingChange(false);
              }
            }
          }}
          onCancel={() => {
            setLocalError("");
            toast.info("Bạn đã hủy thanh toán PayPal.");
          }}
          onError={(error) => {
            const message = normalizePaypalCaptureError(error);
            setLocalError(message);
            toast.error(message);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}

export default PaypalSdkButtons;
