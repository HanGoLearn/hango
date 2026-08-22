import "dotenv/config";
import { config } from "dotenv";
import { buildRealtimeSystemPrompt } from "@/lib/ai-context";
import {
  buildRealtimeTurnInstructions,
  buildSessionPreservingRealtimeTurnEvents,
} from "@/lib/han-realtime";

config({ path: ".env.local", override: true, quiet: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

type PendingResponse = {
  text: string;
  resolve: (text: string) => void;
  reject: (error: Error) => void;
};

const socket = new WebSocket(
  "wss://api.openai.com/v1/realtime?model=gpt-realtime-mini",
  // Node's WebSocket accepts request headers; the shared DOM type only
  // exposes browser protocols in this overload.
  // @ts-expect-error Node WebSocket client options
  { headers: { Authorization: `Bearer ${apiKey}` } },
);

let pending: PendingResponse | null = null;
let sessionReadyResolve: (() => void) | null = null;
let sessionReadyReject: ((error: Error) => void) | null = null;
const sessionReady = new Promise<void>((resolve, reject) => {
  sessionReadyResolve = resolve;
  sessionReadyReject = reject;
});

function send(event: unknown) {
  socket.send(JSON.stringify(event));
}

socket.addEventListener("open", () => {
  send({
    type: "session.update",
    session: {
      type: "realtime",
      output_modalities: ["text"],
      instructions: buildRealtimeSystemPrompt(
        {
          level: "HSK 3",
          explanationLanguage: "EN",
          generalLevelPoints: null,
        },
        {},
        "TUTOR",
      ),
    },
  });
});

socket.addEventListener("message", async (message) => {
  const raw =
    typeof message.data === "string"
      ? message.data
      : message.data instanceof Blob
        ? await message.data.text()
        : Buffer.from(message.data as ArrayBuffer).toString("utf8");
  const event = JSON.parse(raw) as {
    type?: string;
    delta?: string;
    error?: { message?: string };
  };
  if (event.type === "session.updated") sessionReadyResolve?.();
  if (event.type === "response.output_text.delta" && event.delta && pending)
    pending.text += event.delta;
  if (event.type === "response.done" && pending) {
    const current = pending;
    pending = null;
    current.resolve(current.text.trim());
  }
  if (event.type === "error") {
    const error = new Error(event.error?.message ?? "Realtime API error");
    sessionReadyReject?.(error);
    pending?.reject(error);
    pending = null;
  }
});

socket.addEventListener("error", (event) => {
  const error = new Error(
    (event as ErrorEvent).message || "Realtime connection failed",
  );
  sessionReadyReject?.(error);
  pending?.reject(error);
  pending = null;
});

async function ask(text: string) {
  const guardItemId = `item_guard_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
  send({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text }],
    },
  });
  const { guardEvent, responseEvent } =
    buildSessionPreservingRealtimeTurnEvents(
      buildRealtimeTurnInstructions(
        "English",
        undefined,
        null,
        text,
        null,
        "TUTOR",
      ),
      guardItemId,
    );
  send(guardEvent);
  const response = new Promise<string>((resolve, reject) => {
    pending = { text: "", resolve, reject };
  });
  send(responseEvent);
  const answer = await response;
  send({ type: "conversation.item.delete", item_id: guardItemId });
  return answer;
}

async function main() {
  await Promise.race([
    sessionReady,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Realtime setup timed out")), 15_000),
    ),
  ]);

  const nameAnswer = await ask("Hey, what's your name?");
  const productAnswer = await ask("What is HanGo?");
  socket.close();

  console.log(JSON.stringify({ nameAnswer, productAnswer }, null, 2));

  if (!/\bHan\b/i.test(nameAnswer))
    throw new Error("Realtime identity regression: the answer did not say Han");
  if (
    !/HanGo/i.test(productAnswer) ||
    !/(Mandarin|Chinese|chino|mandarín)/i.test(productAnswer)
  )
    throw new Error(
      "Realtime product regression: HanGo was not identified as a Mandarin-learning app",
    );
}

void main().catch((error) => {
  socket.close();
  console.error(error);
  process.exitCode = 1;
});
