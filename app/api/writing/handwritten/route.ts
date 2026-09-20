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
import { DailyUsageCapExceededError } from "@/lib/ai-usage";
import {
  UploadedImageValidationError,
  validateAndSanitizeLearnerImages,
} from "@/lib/uploaded-image-validation";

// The accepted photos total at most 5 MiB; this leaves ample room for the
// multipart boundaries and text fields while rejecting oversized bodies
// before the framework allocates every uploaded file.
const MAX_MULTIPART_BODY_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_MULTIPART_BODY_BYTES
  ) {
    return Response.json(
      { error: "Photo upload is too large." },
      { status: 413 },
    );
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
  let images;
  try {
    images = await validateAndSanitizeLearnerImages(
      await Promise.all(
        files.map(async (file) => ({
          mimeType: file.type,
          bytes: await file.arrayBuffer(),
        })),
      ),
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof UploadedImageValidationError
            ? error.message
            : "One of the selected files is not a valid image.",
      },
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
    if (error instanceof DailyUsageCapExceededError) {
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
