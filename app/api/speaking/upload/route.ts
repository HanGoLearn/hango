import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/lib/auth";
import { serverEnv } from "@/lib/env/server";
import {
  authorizeSpeakingUploadToken,
  MAX_SPEAKING_AUDIO_BYTES,
  SPEAKING_UPLOAD_CONTENT_TYPES,
  SPEAKING_UPLOAD_TOKEN_TTL_MS,
} from "@/lib/speaking-upload";

function parseClientPayload(value: string | null): { sessionId: string } {
  if (!value || value.length > 500) throw new Error("Invalid upload request");
  const parsed: unknown = JSON.parse(value);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("sessionId" in parsed) ||
    typeof parsed.sessionId !== "string" ||
    parsed.sessionId.length < 1 ||
    parsed.sessionId.length > 100
  ) {
    throw new Error("Invalid upload request");
  }
  return { sessionId: parsed.sessionId };
}

function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const storageProviderName =
    serverEnv.HANGO_STORAGE_PROVIDER ??
    (serverEnv.NODE_ENV === "production" ? "vercel-blob" : "local");
  if (
    storageProviderName !== "vercel-blob" ||
    !serverEnv.BLOB_READ_WRITE_TOKEN
  ) {
    return new Response("Private uploads are not configured", { status: 503 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    if (body.type !== "blob.generate-client-token") {
      return new Response("Invalid upload request", { status: 400 });
    }

    const result = await handleUpload({
      request,
      body,
      token: serverEnv.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { sessionId } = parseClientPayload(clientPayload);
        await authorizeSpeakingUploadToken({ userId, sessionId, pathname });
        return {
          allowedContentTypes: [...SPEAKING_UPLOAD_CONTENT_TYPES],
          maximumSizeInBytes: MAX_SPEAKING_AUDIO_BYTES,
          validUntil: Date.now() + SPEAKING_UPLOAD_TOKEN_TTL_MS,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
        };
      },
    });
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Invalid upload request", { status: 400 });
  }
}
