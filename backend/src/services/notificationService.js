import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
} from "../models/notificationModel.js";

export const getNotificationsService = async () => {
  const notifications = await getNotifications();
  return {
    statusCode: 200,
    success: true,
    message: "Lấy danh sách thông báo thành công",
    data: notifications,
  };
};

export const markNotificationReadService = async ({ id }) => {
  const updated = await markNotificationAsRead(id);

  if (!updated) {
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy thông báo",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Đánh dấu đã đọc thành công",
    data: { id },
  };
};

export const getUnreadNotificationCountService = async () => {
  const unreadCount = await getUnreadNotificationsCount();

  return {
    statusCode: 200,
    success: true,
    message: "Lấy số lượng thông báo chưa đọc thành công",
    data: { unreadCount },
  };
};
