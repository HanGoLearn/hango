import "server-only";

import sharp from "sharp";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 20_000_000;
const MAX_DIMENSION = 6_000;

export class UploadedImageValidationError extends Error {}

export interface UploadedImageInput {
  mimeType: string;
  bytes: ArrayBuffer;
}

/**
 * Decodes and re-encodes learner photos. This validates real pixel data,
 * enforces dimensions/pixels, rejects animation, auto-orients, and strips
 * EXIF/XMP/IPTC metadata without resizing or lowering handwriting fidelity.
 */
export async function validateAndSanitizeLearnerImages(
  images: UploadedImageInput[],
): Promise<UploadedImageInput[]> {
  if (images.length < 1 || images.length > MAX_IMAGE_COUNT) {
    throw new UploadedImageValidationError("Upload between 1 and 3 photos.");
  }
  if (
    images.some(
      (image) =>
        !ALLOWED_IMAGE_TYPES.has(image.mimeType) ||
        image.bytes.byteLength === 0 ||
        image.bytes.byteLength > MAX_IMAGE_BYTES,
    ) ||
    images.reduce((sum, image) => sum + image.bytes.byteLength, 0) >
      MAX_TOTAL_BYTES
  ) {
    throw new UploadedImageValidationError(
      "Use clear JPG, PNG, or WebP photos no larger than 2 MB each.",
    );
  }

  try {
    return await Promise.all(images.map(sanitizeOneImage));
  } catch (error) {
    if (error instanceof UploadedImageValidationError) throw error;
    throw new UploadedImageValidationError(
      "One of the selected files is not a valid image.",
    );
  }
}

async function sanitizeOneImage(
  image: UploadedImageInput,
): Promise<UploadedImageInput> {
  const input = Buffer.from(image.bytes);
  const pipeline = sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_PIXELS,
    sequentialRead: true,
    pages: 1,
  });
  const metadata = await pipeline.metadata();
  const expectedFormat =
    image.mimeType === "image/jpeg"
      ? "jpeg"
      : image.mimeType === "image/png"
        ? "png"
        : "webp";
  if (
    metadata.format !== expectedFormat ||
    !metadata.width ||
    !metadata.height ||
    metadata.width > MAX_DIMENSION ||
    metadata.height > MAX_DIMENSION ||
    metadata.width * metadata.height > MAX_PIXELS ||
    (metadata.pages ?? 1) !== 1
  ) {
    throw new UploadedImageValidationError(
      "One of the selected files is not a valid image.",
    );
  }

  let outputPipeline = sharp(input, {
    failOn: "warning",
    limitInputPixels: MAX_PIXELS,
    sequentialRead: true,
    pages: 1,
  }).rotate();
  if (expectedFormat === "jpeg") {
    outputPipeline = outputPipeline.jpeg({
      quality: 95,
      chromaSubsampling: "4:4:4",
      progressive: true,
    });
  } else if (expectedFormat === "png") {
    outputPipeline = outputPipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    });
  } else {
    outputPipeline = outputPipeline.webp({ quality: 95, effort: 4 });
  }
  const output = await outputPipeline.toBuffer();
  const bytes = output.buffer.slice(
    output.byteOffset,
    output.byteOffset + output.byteLength,
  ) as ArrayBuffer;
  return { mimeType: image.mimeType, bytes };
}
