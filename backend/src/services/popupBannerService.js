import jwt from "jsonwebtoken";
import {
  createPopupBanner,
  deletePopupBannerById,
  getActivePopupBanner,
  getAdminPopupBanners,
  getPopupBannerById,
  togglePopupBannerActiveById,
  updatePopupBannerById,
} from "../models/popupBannerModel.js";

const pad2 = (value) => String(value).padStart(2, "0");

const toMySqlDateTime = (value) => {
  if (!value) return value;

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`;
};

const normalizePopupPayload = (payload = {}) => ({
  title: String(payload.title || "").trim(),
  image_url: String(payload.image_url || "").trim(),
  link: payload.link ? String(payload.link).trim() : null,
  is_active: payload.is_active === undefined ? true : Boolean(payload.is_active),
  start_date: toMySqlDateTime(payload.start_date),
  end_date: toMySqlDateTime(payload.end_date),
  priority: Number(payload.priority || 0),
  target_type: payload.target_type || "all",
});

const resolveIsLoggedIn = (authorizationHeader = "") => {
  const token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice(7) : null;

  if (!token) return false;

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

export const getAdminPopupBannersService = async () => {
  const banners = await getAdminPopupBanners();

  return {
    statusCode: 200,
    success: true,
    message: "Lấy danh sách popup thành công",
    data: banners,
  };
};

export const getActivePopupBannerService = async ({ authorizationHeader }) => {
  const banner = await getActivePopupBanner({
    isLoggedIn: resolveIsLoggedIn(authorizationHeader),
  });

  return {
    statusCode: 200,
    success: true,
    message: "Lấy popup đang hoạt động thành công",
    data: banner || {},
  };
};

export const createPopupBannerService = async ({ payload }) => {
  const insertId = await createPopupBanner(normalizePopupPayload(payload));
  const createdBanner = await getPopupBannerById(insertId);

  return {
    statusCode: 201,
    success: true,
    message: "Tạo popup thành công",
    data: createdBanner,
  };
};

export const updatePopupBannerService = async ({ id, payload }) => {
  const updated = await updatePopupBannerById(id, normalizePopupPayload(payload));

  if (!updated) {
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy popup",
      data: {},
    };
  }

  const updatedBanner = await getPopupBannerById(id);

  return {
    statusCode: 200,
    success: true,
    message: "Cập nhật popup thành công",
    data: updatedBanner,
  };
};

export const deletePopupBannerService = async ({ id }) => {
  const deleted = await deletePopupBannerById(id);

  if (!deleted) {
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy popup",
      data: {},
    };
  }

  return {
    statusCode: 200,
    success: true,
    message: "Xóa popup thành công",
    data: { id },
  };
};

export const togglePopupBannerService = async ({ id }) => {
  const toggled = await togglePopupBannerActiveById(id);

  if (!toggled) {
    return {
      statusCode: 404,
      success: false,
      message: "Không tìm thấy popup",
      data: {},
    };
  }

  const banner = await getPopupBannerById(id);

  return {
    statusCode: 200,
    success: true,
    message: "Đổi trạng thái popup thành công",
    data: banner,
  };
};
