import { optimizeUploadedImages, removeUploadedFiles } from "../middlewares/uploadMiddleware.js";

const mapUploadedPath = (file) => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${file.filename}`;
};

export const uploadImageService = async ({ file }) => {
  if (!file) {
    return {
      statusCode: 400,
      success: false,
      message: "Image file is required",
      data: {},
    };
  }

  let processedFiles = [];

  try {
    processedFiles = await optimizeUploadedImages([file]);

    if (processedFiles.length === 0) {
      return {
        statusCode: 400,
        success: false,
        message: "Image file is required",
        data: {},
      };
    }

    const uploadedFile = processedFiles[0];
    const isDuplicate = Boolean(uploadedFile.isDuplicate);

    return {
      statusCode: isDuplicate ? 200 : 201,
      message: isDuplicate ? "Image already exists, reused existing file" : "Image uploaded successfully",
      data: {
        image_url: mapUploadedPath(uploadedFile),
        is_duplicate: isDuplicate,
      },
    };
  } catch (error) {
    await removeUploadedFiles(processedFiles);
    throw error;
  }
};
