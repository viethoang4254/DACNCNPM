import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import { uploadImageService } from "../services/uploadService.js";

export const uploadImageController = asyncHandler(async (req, res) => {
  const result = await uploadImageService({ file: req.file });
  return sendResponse(res, result);
});
