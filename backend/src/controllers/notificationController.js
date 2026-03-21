import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
} from "../models/notificationModel.js";

export const getNotificationsController = asyncHandler(async (req, res) => {
  const notifications = await getNotifications();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lấy danh sách thông báo thành công",
    data: notifications,
  });
});

export const markNotificationReadController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const updated = await markNotificationAsRead(id);

  if (!updated) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy thông báo",
      data: {},
    });
  }

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Đánh dấu đã đọc thành công",
    data: { id },
  });
});

export const getUnreadNotificationCountController = asyncHandler(async (req, res) => {
  const unreadCount = await getUnreadNotificationsCount();

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lấy số lượng thông báo chưa đọc thành công",
    data: { unreadCount },
  });
});
