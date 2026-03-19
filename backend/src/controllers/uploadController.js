import asyncHandler from "../utils/asyncHandler.js";
import { optimizeUploadedImages, removeUploadedFiles } from "../middlewares/uploadMiddleware.js";
import { sendResponse } from "../utils/response.js";

const mapUploadedPath = (file) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${file.filename}`;
};

export const uploadImageController = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "Image file is required",
      data: {},
    });
  }

  let processedFiles = [];

  try {
    processedFiles = await optimizeUploadedImages([req.file]);

    if (processedFiles.length === 0) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Image file is required",
        data: {},
      });
    }

    const uploadedFile = processedFiles[0];
    const isDuplicate = Boolean(uploadedFile.isDuplicate);

    return sendResponse(res, {
      statusCode: isDuplicate ? 200 : 201,
      message: isDuplicate ? "Image already exists, reused existing file" : "Image uploaded successfully",
      data: {
        image_url: mapUploadedPath(uploadedFile),
        is_duplicate: isDuplicate,
      },
    });
  } catch (error) {
    await removeUploadedFiles(processedFiles);
    throw error;
  }
});
