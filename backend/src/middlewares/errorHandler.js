import multer from "multer";
import { sendResponse } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  const maxImageSizeMb = Number(process.env.MAX_IMAGE_SIZE_MB || 15);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err instanceof multer.MulterError) {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = `Kich thuoc anh vuot qua gioi han ${maxImageSizeMb}MB.`;
    } else {
      message = err.message;
    }
  }

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
