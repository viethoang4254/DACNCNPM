const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MAX_IMAGE_WIDTH_PX = Math.round(
  toPositiveNumber(import.meta.env.VITE_MAX_IMAGE_WIDTH_PX, 1600),
);

const IMAGE_QUALITY = clamp(
  Number(import.meta.env.VITE_IMAGE_QUALITY || 0.82),
  0.4,
  0.92,
);

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Khong the doc tep anh."));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Khong the nen anh."));
        return;
      }

      resolve(blob);
    }, type, quality);
  });

export const optimizeImageFile = async (file) => {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return file;
  }

  if (file.type === "image/gif") {
    return file;
  }

  const image = await loadImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const ratio = longestEdge > MAX_IMAGE_WIDTH_PX ? MAX_IMAGE_WIDTH_PX / longestEdge : 1;
  const targetWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
  const targetHeight = Math.max(1, Math.round(image.naturalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const optimizedBlob = await canvasToBlob(canvas, "image/webp", IMAGE_QUALITY);
  if (optimizedBlob.size >= file.size) {
    return file;
  }

  const nextName = file.name.replace(/\.[^.]+$/, "") || "tour-image";
  return new File([optimizedBlob], `${nextName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
};

export const optimizeImageFiles = async (files = []) => {
  return Promise.all(files.map(optimizeImageFile));
};