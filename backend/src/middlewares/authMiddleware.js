import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/response.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Unauthorized",
      data: {},
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Invalid or expired token",
      data: {},
    });
  }
};

export default authMiddleware;
