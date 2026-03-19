import { validationResult } from "express-validator";
import { sendResponse } from "../utils/response.js";

export const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return sendResponse(res, {
    statusCode: 400,
    success: false,
    message: "Validation failed",
    data: {
      errors: errors.array(),
    },
  });
};

export default validationMiddleware;
