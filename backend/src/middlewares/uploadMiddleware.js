import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { findDuplicateFileByHash } from "../utils/uploadHash.js";

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_IMAGE_SIZE_MB = toPositiveNumber(process.env.MAX_IMAGE_SIZE_MB, 15);
const MAX_IMAGE_WIDTH_PX = Math.round(toPositiveNumber(process.env.MAX_IMAGE_WIDTH_PX, 1600));
const IMAGE_QUALITY = clamp(Math.round(toPositiveNumber(process.env.IMAGE_QUALITY, 78)), 40, 90);
const FILE_HASH_ALGORITHM = process.env.UPLOAD_HASH_ALGORITHM || "sha256";

export const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const buildOptimizedFilename = (filename) => {
  const parsed = path.parse(filename);
  return `${parsed.name}-optimized.webp`;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024,
  },
});

export const removeUploadedFiles = async (files = []) => {
  await Promise.all(
    files
      .filter((file) => Boolean(file) && !file.isDuplicate)
      .map(async (file) => {
        const resolvedPath = file.path || (file.filename ? path.resolve(uploadDir, file.filename) : "");

        if (!resolvedPath || !fs.existsSync(resolvedPath)) {
          return;
        }

        await fs.promises.unlink(resolvedPath).catch(() => {});
      })
  );
};

const optimizeUploadedFile = async (file) => {
  const optimizedFilename = buildOptimizedFilename(file.filename);
  const optimizedPath = path.resolve(uploadDir, optimizedFilename);

  try {
    await sharp(file.path)
      .rotate()
      .resize({
        width: MAX_IMAGE_WIDTH_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY })
      .toFile(optimizedPath);

    const duplicate = await findDuplicateFileByHash({
      targetFilePath: optimizedPath,
      directoryPath: uploadDir,
      excludeFileNames: [optimizedFilename, file.filename],
      algorithm: FILE_HASH_ALGORITHM,
    });

    if (duplicate) {
      const duplicateStats = await fs.promises.stat(duplicate.path);
      await removeUploadedFiles([{ path: optimizedPath }, file]);

      return {
        ...file,
        filename: duplicate.filename,
        path: duplicate.path,
        mimetype: "image/webp",
        size: duplicateStats.size,
        isDuplicate: true,
        hash: duplicate.hash,
      };
    }

    const stats = await fs.promises.stat(optimizedPath);
    await removeUploadedFiles([file]);

    return {
      ...file,
      filename: optimizedFilename,
      path: optimizedPath,
      mimetype: "image/webp",
      size: stats.size,
      isDuplicate: false,
    };
  } catch (error) {
    await removeUploadedFiles([{ path: optimizedPath }, file]);
    throw error;
  }
};

export const optimizeUploadedImages = async (files = []) => {
  const uploadedFiles = files.filter(Boolean);
  const optimizedFiles = [];

  for (const file of uploadedFiles) {
    const optimizedFile = await optimizeUploadedFile(file);
    optimizedFiles.push(optimizedFile);
  }

  return optimizedFiles;
};

export default upload;
