import { sendResponse } from "../utils/response.js";

export const notFoundHandler = (req, res) => {
  return sendResponse(res, {
    statusCode: 404,
    success: false,
    message: "Route not found",
    data: {},
  });
};

export default notFoundHandler;
