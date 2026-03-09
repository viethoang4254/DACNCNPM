import { sendResponse } from "../utils/response.js";

export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden: admin access required",
      data: {},
    });
  }

  return next();
};

export default adminMiddleware;
