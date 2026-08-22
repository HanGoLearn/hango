import { config } from "dotenv";

import { OpenAiSttProvider } from "@/lib/speech/providers/openai";
import { assessHanTranscript } from "@/lib/speech/transcript-quality";
import { OpenAiTtsProvider } from "@/lib/tts/providers/openai";

config({ path: ".env.local", quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is missing from .env.local");

const tts = new OpenAiTtsProvider(apiKey);
const stt = new OpenAiSttProvider(apiKey);

const cases = [
  {
    name: "bare Mandarin ai",
    spokenText: "爱",
    validate(transcript: string) {
      return transcript === "ai" || /\p{Script=Han}/u.test(transcript);
    },
  },
  {
    name: "full Spanish sentence",
    spokenText: "Quiero aprender chino contigo, Han.",
    validate(transcript: string) {
      return (
        ["quiero", "aprender", "chino", "contigo"].filter((word) =>
          transcript.toLocaleLowerCase("es").includes(word),
        ).length >= 2
      );
    },
  },
  {
    name: "spoken Mandarin phrase",
    spokenText: "你好，我想学习中文。",
    validate(transcript: string) {
      return (transcript.match(/\p{Script=Han}/gu) ?? []).length >= 3;
    },
  },
  {
    name: "mixed Spanish with 爱情",
    spokenText: "¿Cómo se pronuncia la palabra 爱情?",
    validate(transcript: string) {
      return (
        /cómo se pronuncia/iu.test(transcript) && transcript.includes("爱情")
      );
    },
  },
] as const;

async function main() {
  for (const regressionCase of cases) {
    const speech = await tts.synthesize(regressionCase.spokenText, "cedar");
    const result = await stt.transcribe(
      speech.audio,
      speech.contentType,
      "han-multilingual",
    );
    const assessment = assessHanTranscript(
      result.transcript,
      result.confidence,
    );

    if (!assessment.ok || !regressionCase.validate(assessment.transcript)) {
      throw new Error(
        `${regressionCase.name} failed: ${JSON.stringify({ result, assessment })}`,
      );
    }

    console.log(
      JSON.stringify({
        case: regressionCase.name,
        transcript: assessment.transcript,
        confidence: result.confidence,
        accepted: true,
      }),
    );
  }
}

void main();
