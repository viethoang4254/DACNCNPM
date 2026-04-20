import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  approveRefundControllerService,
  getRefundDetailControllerService,
  getRefundsControllerService,
  rejectRefundControllerService,
} from "../services/refundControllerService.js";

export const getRefundsController = asyncHandler(async (req, res) => {
  const result = await getRefundsControllerService({
    status: String(req.query?.status || "pending").trim().toLowerCase(),
    keyword: String(req.query?.keyword || "").trim(),
  });
  return sendResponse(res, result);
});

export const getRefundDetailController = asyncHandler(async (req, res) => {
  const result = await getRefundDetailControllerService({
    bookingId: Number(req.params.id),
  });
  return sendResponse(res, result);
});

export const approveRefundController = asyncHandler(async (req, res) => {
  const result = await approveRefundControllerService({ bookingId: Number(req.params.id) });
  return sendResponse(res, result);
});

export const rejectRefundController = asyncHandler(async (req, res) => {
  const result = await rejectRefundControllerService({ bookingId: Number(req.params.id) });
  return sendResponse(res, result);
});
