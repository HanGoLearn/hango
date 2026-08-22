import type {
  SttProvider,
  SttTranscriptionMode,
  SttTranscriptionResult,
} from "@/lib/speech/provider";

/**
 * Used whenever no STT provider key is configured (src/lib/speech/index.ts)
 * - no network calls, so recording/upload/feedback flows are fully
 * exercisable without an API key. The transcript is always the same canned
 * placeholder regardless of what was actually said.
 */
export class MockSttProvider implements SttProvider {
  readonly name = "mock";

  async transcribe(
    _audio: Buffer,
    _mimeType: string,
    _mode: SttTranscriptionMode,
  ): Promise<SttTranscriptionResult> {
    void _audio;
    void _mimeType;
    void _mode;
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      transcript:
        "[Mock transcription — configure OPENAI_API_KEY for real speech-to-text]",
      confidence: 0.5,
      provider: this.name,
      model: "mock-stt-v1",
    };
  }
}
