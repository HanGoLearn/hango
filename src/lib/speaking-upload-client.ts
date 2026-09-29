"use client";

import { upload } from "@vercel/blob/client";
import {
  prepareSpeakingUploadAction,
  submitRecordingAction,
  submitUploadedRecordingAction,
  type SubmitSpeakingResult,
} from "@/lib/actions/speaking";

const SUBMIT_FAILED =
  "Something went wrong submitting your attempt. Please try again.";
const MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024;

export async function submitSpeakingRecording(
  sessionId: string,
  formData: FormData,
): Promise<SubmitSpeakingResult> {
  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return { ok: false, error: SUBMIT_FAILED };
  }

  // Local development/test keeps the existing filesystem + Server Action
  // path. Production forbids local storage and always uses the private direct
  // upload path so Vercel's Function payload limit is never involved.
  if (process.env.NODE_ENV !== "production") {
    return submitRecordingAction(sessionId, formData);
  }

  try {
    const prepared = await prepareSpeakingUploadAction(sessionId, audio.type);
    if (!prepared.ok) return prepared;

    const uploaded = await upload(prepared.pathname, audio, {
      access: "private",
      handleUploadUrl: "/api/speaking/upload",
      clientPayload: JSON.stringify({ sessionId }),
      contentType: prepared.mimeType,
      multipart: audio.size > MULTIPART_THRESHOLD_BYTES,
    });
    if (uploaded.pathname !== prepared.pathname) {
      return { ok: false, error: SUBMIT_FAILED };
    }

    const rawToneScore = formData.get("toneScore");
    const toneScore =
      typeof rawToneScore === "string" && rawToneScore !== ""
        ? Number(rawToneScore)
        : null;
    return submitUploadedRecordingAction(sessionId, {
      storageKey: uploaded.pathname,
      claimedMimeType: prepared.mimeType,
      toneScore: Number.isFinite(toneScore) ? toneScore : null,
    });
  } catch {
    return { ok: false, error: SUBMIT_FAILED };
  }
}
