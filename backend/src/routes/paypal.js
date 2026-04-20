import express from "express";
import { OrdersController } from "@paypal/paypal-server-sdk";
import client from "../utils/paypalClient.js";
import { getBookingById } from "../models/bookingModel.js";
import pool from "../config/db.js";

const router = express.Router();
const ordersController = new OrdersController(client);

const FRONTEND_BASE_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PAYPAL_RETURN_URL = process.env.PAYPAL_RETURN_URL || `${FRONTEND_BASE_URL}/paypal-success`;
const PAYPAL_CANCEL_URL = process.env.PAYPAL_CANCEL_URL || `${FRONTEND_BASE_URL}/paypal-cancel`;
const PAYPAL_VND_TO_USD_RATE = Number(process.env.PAYPAL_VND_TO_USD_RATE || 25000);

function convertVndToUsd(vndAmount) {
  const normalizedVnd = Number(vndAmount || 0);
  if (!Number.isFinite(normalizedVnd) || normalizedVnd <= 0) {
    return null;
  }

  const rate = Number.isFinite(PAYPAL_VND_TO_USD_RATE) && PAYPAL_VND_TO_USD_RATE > 0
    ? PAYPAL_VND_TO_USD_RATE
    : 25000;

  // PayPal requires decimal amount in the target currency.
  const usd = Math.round((normalizedVnd / rate) * 100) / 100;
  return usd >= 0.01 ? usd : 0.01;
}

function calculateSaleAwareTotalVnd(booking) {
  const unitPrice = Number(booking?.gia || 0);
  const quantity = Number(booking?.so_nguoi || 0);
  const baseTotal = unitPrice * quantity;

  if (!Number.isFinite(baseTotal) || baseTotal <= 0) {
    return 0;
  }

  const discount = Boolean(booking?.is_on_sale)
    ? Math.max(0, Math.min(100, Number(booking?.discount_percent || 0)))
    : 0;

  return Math.round(baseTotal * (1 - discount / 100));
}

async function resolvePayableAmountVnd({ bookingId, syncPendingBookingTotal }) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    return {
      ok: false,
      statusCode: 404,
      message: "Booking not found",
    };
  }

  if (booking.trang_thai === "cancelled") {
    return {
      ok: false,
      statusCode: 400,
      message: "Booking đã hết hạn hoặc bị hủy",
    };
  }

  const bookingTotalVnd = Number(booking.tong_tien || 0);
  const saleAwareTotalVnd = calculateSaleAwareTotalVnd(booking);

  let payableVnd = bookingTotalVnd;
  if (saleAwareTotalVnd > 0 && (payableVnd <= 0 || saleAwareTotalVnd < payableVnd)) {
    payableVnd = saleAwareTotalVnd;
  }

  if (
    syncPendingBookingTotal &&
    booking.trang_thai === "pending" &&
    payableVnd > 0 &&
    Math.abs(payableVnd - bookingTotalVnd) >= 1
  ) {
    await pool.execute(
      "UPDATE bookings SET tong_tien = ? WHERE id = ? AND trang_thai = 'pending'",
      [payableVnd, bookingId],
    );
  }

  return {
    ok: true,
    booking,
    payableVnd,
  };
}

function getErrorMessage(error, fallbackMessage) {
  const detail =
    error?.result?.details?.[0]?.description ||
    error?.result?.message ||
    error?.message;
  return detail || fallbackMessage;
}

router.post("/create", async (req, res) => {
  try {
    const { bookingId } = req.body;
    const parsedBookingId = Number(bookingId);

    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({ message: "bookingId không hợp lệ" });
    }

    const resolvedAmount = await resolvePayableAmountVnd({
      bookingId: parsedBookingId,
      syncPendingBookingTotal: true,
    });
    if (!resolvedAmount.ok) {
      return res.status(resolvedAmount.statusCode).json({ message: resolvedAmount.message });
    }

    const payableVnd = resolvedAmount.payableVnd;

    const amountUsd = convertVndToUsd(payableVnd);
    if (!amountUsd) {
      return res.status(400).json({ message: "Tổng tiền booking không hợp lệ" });
    }

    const returnUrl = new URL(PAYPAL_RETURN_URL);
    returnUrl.searchParams.set("bookingId", String(parsedBookingId));

    const cancelUrl = new URL(PAYPAL_CANCEL_URL);
    cancelUrl.searchParams.set("bookingId", String(parsedBookingId));

    const response = await ordersController.createOrder({
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            referenceId: String(parsedBookingId),
            amount: {
              currencyCode: "USD",
              value: amountUsd.toFixed(2),
            },
          },
        ],
        applicationContext: {
          returnUrl: returnUrl.toString(),
          cancelUrl: cancelUrl.toString(),
        },
      },
    });

    const responseBody = response?.result || response;
    const approvalUrl = responseBody?.links?.find((l) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      return res.status(502).json({ message: "Không lấy được approvalUrl từ PayPal" });
    }

    res.json({
      orderId: responseBody?.id,
      approvalUrl,
      amount: {
        currencyCode: "USD",
        value: amountUsd.toFixed(2),
      },
      amountVnd: payableVnd,
    });

  } catch (err) {
    console.error("[paypal/create]", err);
    const statusCode = Number(err?.statusCode || err?.statusCodeNumber || 500);
    res.status(Number.isInteger(statusCode) ? statusCode : 500).json({
      message: getErrorMessage(err, "PayPal create error"),
    });
  }
});

router.get("/quote/:bookingId", async (req, res) => {
  try {
    const parsedBookingId = Number(req.params.bookingId);
    if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
      return res.status(400).json({ message: "bookingId không hợp lệ" });
    }

    const resolvedAmount = await resolvePayableAmountVnd({
      bookingId: parsedBookingId,
      syncPendingBookingTotal: false,
    });
    if (!resolvedAmount.ok) {
      return res.status(resolvedAmount.statusCode).json({ message: resolvedAmount.message });
    }

    const amountUsd = convertVndToUsd(resolvedAmount.payableVnd);
    if (!amountUsd) {
      return res.status(400).json({ message: "Tổng tiền booking không hợp lệ" });
    }

    const safeRate = Number.isFinite(PAYPAL_VND_TO_USD_RATE) && PAYPAL_VND_TO_USD_RATE > 0
      ? PAYPAL_VND_TO_USD_RATE
      : 25000;

    return res.json({
      bookingId: parsedBookingId,
      amountVnd: resolvedAmount.payableVnd,
      amountUsd: Number(amountUsd.toFixed(2)),
      currencyCode: "USD",
      rate: safeRate,
    });
  } catch (err) {
    console.error("[paypal/quote]", err);
    const statusCode = Number(err?.statusCode || err?.statusCodeNumber || 500);
    return res.status(Number.isInteger(statusCode) ? statusCode : 500).json({
      message: getErrorMessage(err, "PayPal quote error"),
    });
  }
});

router.post("/capture", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "orderId không hợp lệ" });
    }

    const response = await ordersController.captureOrder({
      id: orderId,
    });

    res.json(response?.result || response);

  } catch (err) {
    console.error("[paypal/capture]", err);
    const statusCode = Number(err?.statusCode || err?.statusCodeNumber || 500);
    res.status(Number.isInteger(statusCode) ? statusCode : 500).json({
      message: getErrorMessage(err, "PayPal capture error"),
    });
  }
});
router.get("/test", async (req, res) => {
  res.send("PayPal route OK");
});

export default router;