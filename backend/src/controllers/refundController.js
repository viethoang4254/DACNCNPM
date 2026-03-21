import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  approveRefund,
  getRefundDetail,
  getRefundList,
  rejectRefund,
} from "../services/refundService.js";

export const getRefundsController = asyncHandler(async (req, res) => {
  const status = String(req.query?.status || "pending").trim().toLowerCase();
  const keyword = String(req.query?.keyword || "").trim();

  const mappedRefunds = await getRefundList({ status, keyword });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lấy danh sách yêu cầu hoàn tiền thành công",
    data: mappedRefunds,
  });
});

export const getRefundDetailController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  const refund = await getRefundDetail(bookingId);

  if (!refund) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy yêu cầu hoàn tiền",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lấy chi tiết yêu cầu hoàn tiền thành công",
    data: refund,
  });
});

export const approveRefundController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  const result = await approveRefund(bookingId);

  return sendResponse(res, {
    statusCode: result.statusCode || 200,
    success: Boolean(result.success),
    message: result.message,
    data: result.data || {},
  });
});

export const rejectRefundController = asyncHandler(async (req, res) => {
  const bookingId = Number(req.params.id);
  const result = await rejectRefund(bookingId);

  return sendResponse(res, {
    statusCode: result.statusCode || 200,
    success: Boolean(result.success),
    message: result.message,
    data: result.data || {},
  });
});
