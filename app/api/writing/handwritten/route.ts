import { auth } from "@/lib/auth";
import {
  isHandwrittenLevel,
  isHandwrittenTopic,
} from "@/lib/handwritten-writing";
import {
  HandwrittenRateLimitError,
  submitHandwrittenWriting,
} from "@/lib/handwritten-writing-data";
import { HandwrittenEvaluationError } from "@/lib/handwritten-writing-evaluator";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;

function hasExpectedImageSignature(
  mimeType: string,
  bytes: ArrayBuffer,
): boolean {
  const data = new Uint8Array(bytes);
  if (mimeType === "image/jpeg") return data[0] === 0xff && data[1] === 0xd8;
  if (mimeType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47
    );
  }
  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json(
      { error: "Invalid photo submission." },
      { status: 400 },
    );
  }

  const level = formData.get("level");
  const topic = formData.get("topic");
  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File);
  if (!isHandwrittenLevel(level) || !isHandwrittenTopic(topic)) {
    return Response.json(
      { error: "Choose a valid level and topic." },
      { status: 400 },
    );
  }
  if (files.length < 1 || files.length > MAX_IMAGE_COUNT) {
    return Response.json(
      { error: "Upload between 1 and 3 photos." },
      { status: 400 },
    );
  }
  if (
    files.some(
      (file) =>
        !ALLOWED_IMAGE_TYPES.has(file.type) ||
        file.size === 0 ||
        file.size > MAX_IMAGE_BYTES,
    ) ||
    files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES
  ) {
    return Response.json(
      { error: "Use clear JPG, PNG, or WebP photos no larger than 2 MB each." },
      { status: 400 },
    );
  }

  const images = await Promise.all(
    files.map(async (file) => ({
      mimeType: file.type,
      bytes: await file.arrayBuffer(),
    })),
  );
  if (
    images.some(
      (image) => !hasExpectedImageSignature(image.mimeType, image.bytes),
    )
  ) {
    return Response.json(
      { error: "One of the selected files is not a valid image." },
      { status: 400 },
    );
  }

  try {
    const result = await submitHandwrittenWriting(
      session.user.id,
      level,
      topic,
      images,
    );
    return Response.json(result, {
      headers: { "cache-control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof HandwrittenRateLimitError) {
      return Response.json({ error: error.message }, { status: 429 });
    }
    if (error instanceof HandwrittenEvaluationError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json(
      {
        error:
          "Something went wrong evaluating your photos. Please try again when ready.",
      },
      { status: 500 },
    );
  }
}
