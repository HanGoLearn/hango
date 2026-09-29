import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  submitLocal: vi.fn(),
  submitUploaded: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({ upload: mocks.upload }));
vi.mock("@/lib/actions/speaking", () => ({
  prepareSpeakingUploadAction: mocks.prepare,
  submitRecordingAction: mocks.submitLocal,
  submitUploadedRecordingAction: mocks.submitUploaded,
}));

const { submitSpeakingRecording } =
  await import("@/lib/speaking-upload-client");

function recordingFormData(): FormData {
  const formData = new FormData();
  formData.append(
    "audio",
    new Blob(["recording"], { type: "audio/webm;codecs=opus" }),
  );
  formData.append("toneScore", "73");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("submitSpeakingRecording", () => {
  it("keeps development/test recordings on the existing server path", async () => {
    vi.stubEnv("NODE_ENV", "test");
    mocks.submitLocal.mockResolvedValue({ ok: false, error: "local-result" });
    const formData = recordingFormData();

    await expect(
      submitSpeakingRecording("session-1", formData),
    ).resolves.toEqual({ ok: false, error: "local-result" });
    expect(mocks.submitLocal).toHaveBeenCalledWith("session-1", formData);
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("uses the private direct-upload path in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.prepare.mockResolvedValue({
      ok: true,
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
      mimeType: "audio/webm",
    });
    mocks.upload.mockResolvedValue({
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
    });
    mocks.submitUploaded.mockResolvedValue({
      ok: false,
      error: "final-result",
    });

    await expect(
      submitSpeakingRecording("session-1", recordingFormData()),
    ).resolves.toEqual({ ok: false, error: "final-result" });
    expect(mocks.upload).toHaveBeenCalledWith(
      "speaking/user-1/session-1-id-1790000000000.webm",
      expect.any(Blob),
      {
        access: "private",
        handleUploadUrl: "/api/speaking/upload",
        clientPayload: JSON.stringify({ sessionId: "session-1" }),
        contentType: "audio/webm",
        multipart: false,
      },
    );
    expect(mocks.submitUploaded).toHaveBeenCalledWith("session-1", {
      storageKey: "speaking/user-1/session-1-id-1790000000000.webm",
      claimedMimeType: "audio/webm",
      toneScore: 73,
    });
    expect(mocks.submitLocal).not.toHaveBeenCalled();
  });

  it("returns a safe error when the provider upload fails", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.prepare.mockResolvedValue({
      ok: true,
      pathname: "speaking/user-1/session-1-id-1790000000000.webm",
      mimeType: "audio/webm",
    });
    mocks.upload.mockRejectedValue(new Error("secret provider detail"));

    await expect(
      submitSpeakingRecording("session-1", recordingFormData()),
    ).resolves.toEqual({
      ok: false,
      error: "Something went wrong submitting your attempt. Please try again.",
    });
  });
});
