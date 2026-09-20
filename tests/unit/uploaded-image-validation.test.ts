import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  UploadedImageValidationError,
  validateAndSanitizeLearnerImages,
} from "@/lib/uploaded-image-validation";

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

describe("learner image validation", () => {
  it("fully decodes, auto-orients, and strips metadata without resizing", async () => {
    const input = await sharp({
      create: {
        width: 320,
        height: 180,
        channels: 3,
        background: "white",
      },
    })
      .jpeg({ quality: 95 })
      .withMetadata({ orientation: 6 })
      .toBuffer();

    const [sanitized] = await validateAndSanitizeLearnerImages([
      { mimeType: "image/jpeg", bytes: toArrayBuffer(input) },
    ]);
    const metadata = await sharp(Buffer.from(sanitized!.bytes)).metadata();

    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(180);
    expect(metadata.height).toBe(320);
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
  });

  it("rejects mismatched MIME, corrupt pixels, and excessive file count", async () => {
    const png = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: "white",
      },
    })
      .png()
      .toBuffer();
    const bytes = toArrayBuffer(png);

    await expect(
      validateAndSanitizeLearnerImages([{ mimeType: "image/jpeg", bytes }]),
    ).rejects.toBeInstanceOf(UploadedImageValidationError);
    await expect(
      validateAndSanitizeLearnerImages([
        {
          mimeType: "image/png",
          bytes: toArrayBuffer(Buffer.from("not an image")),
        },
      ]),
    ).rejects.toBeInstanceOf(UploadedImageValidationError);
    await expect(
      validateAndSanitizeLearnerImages(
        Array.from({ length: 4 }, () => ({ mimeType: "image/png", bytes })),
      ),
    ).rejects.toThrow("Upload between 1 and 3 photos.");
  });
});
