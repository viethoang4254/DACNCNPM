import { sendResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return sendResponse(res, {
    statusCode,
    success: false,
    message,
    data: {},
  });
};

export default errorHandler;
