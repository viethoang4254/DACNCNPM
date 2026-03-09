import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { getBookingById, updateBookingStatus } from "../models/bookingModel.js";
import { createPayment, getAllPayments, getPaymentByBookingId } from "../models/paymentModel.js";

export const createPaymentController = asyncHandler(async (req, res) => {
  const { booking_id, method, status } = req.body;

  const booking = await getBookingById(booking_id);
  if (!booking) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Booking not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && booking.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  const existing = await getPaymentByBookingId(booking_id);
  if (existing) {
    return sendResponse(res, {
      statusCode: 409,
      success: false,
      message: "Payment already exists for this booking",
      data: existing,
    });
  }

  const payment = await createPayment({
    booking_id,
    amount: booking.tong_tien,
    method,
    status: status || "pending",
  });

  if (payment.status === "paid") {
    await updateBookingStatus(booking_id, "confirmed");
  }

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Payment created successfully",
    data: payment,
  });
});

export const getPaymentByBookingIdController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const payment = await getPaymentByBookingId(bookingId);

  if (!payment) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Payment not found",
      data: {},
    });
  }

  if (req.user.role !== "admin" && payment.user_id !== req.user.id) {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment fetched successfully",
    data: payment,
  });
});

export const getPaymentsController = asyncHandler(async (req, res) => {
  const payments = await getAllPayments();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payments fetched successfully",
    data: payments,
  });
});
