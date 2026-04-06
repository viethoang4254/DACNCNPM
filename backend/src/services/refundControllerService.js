import {
  approveRefund,
  getRefundDetail,
  getRefundList,
  rejectRefund,
} from "./refundService.js";

export const getRefundsControllerService = async ({ status, keyword }) => {
  const mappedRefunds = await getRefundList({ status, keyword });

  return {
    statusCode: 200,
    success: true,
    message: "Lấy danh sách yêu cầu hoàn tiền thành công",
    data: mappedRefunds,
  };
};

export const getRefundDetailControllerService = async ({ bookingId }) => {
  const refund = await getRefundDetail(bookingId);

  if (!refund) {
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy yêu cầu hoàn tiền",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Lấy chi tiết yêu cầu hoàn tiền thành công",
    data: refund,
  };
};

export const approveRefundControllerService = async ({ bookingId }) => {
  const result = await approveRefund(bookingId);

  return {
    statusCode: result.statusCode || 200,
    success: Boolean(result.success),
    message: result.message,
    data: result.data || {},
  };
};

export const rejectRefundControllerService = async ({ bookingId }) => {
  const result = await rejectRefund(bookingId);

  return {
    statusCode: result.statusCode || 200,
    success: Boolean(result.success),
    message: result.message,
    data: result.data || {},
  };
};
