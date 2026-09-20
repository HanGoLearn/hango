import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNextQuestion } from "@/lib/placement-exam-data";
import { getStorageProvider } from "@/lib/storage";

/**
 * Authenticated file delivery for locally-stored audio (docs/03_engineering/
 * storage.md - "backend-mediated only", "create controlled access"). Stands
 * in for a real signed-URL flow until a cloud storage provider is
 * configured (src/lib/storage).
 *
 * Key namespaces and their authorization rules:
 * - Speaking Lab recordings (`speaking/...`) are per-learner, so access
 *   requires owning the SpeakingAttempt that references the key.
 * - Dialogue audio (`dialogue-audio/...`), vocabulary audio
 *   (`vocabulary-audio/...`), grammar audio (`grammar-audio/...`),
 *   and Welcome to Chinese audio (`welcome-audio/...`) are shared content
 *   generated once and reused by every learner, so any authenticated user
 *   may fetch them. Placement listening files are also shared physically,
 *   but may only be delivered while their question is the learner's current
 *   active placement question.
 * - `welcome-audio/...` has no backing DB row to check against (that
 *   page's content is hand-authored in the page component, not
 *   database-backed) - authorization there is simply "the file exists at
 *   this content-addressed path," which only happens if
 *   welcome-audio.ts's allowlisted synthesizeAndStore actually wrote it;
 *   an attacker can't get arbitrary content stored under this prefix.
 */
async function isSharedContentKey(
  key: string,
  userId: string,
): Promise<boolean> {
  if (key.startsWith("welcome-audio/")) return true;
  if (key.startsWith("dialogue-audio/")) {
    const [line, dialogue] = await Promise.all([
      db.dialogueLine.findFirst({ where: { audioFilePath: key } }),
      db.dialogue.findFirst({ where: { audioFilePath: key } }),
    ]);
    return line !== null || dialogue !== null;
  }
  if (key.startsWith("vocabulary-audio/")) {
    const [item, example] = await Promise.all([
      db.vocabularyItem.findFirst({ where: { audioFilePath: key } }),
      db.vocabularyExample.findFirst({ where: { audioFilePath: key } }),
    ]);
    return item !== null || example !== null;
  }
  if (key.startsWith("grammar-audio/")) {
    const example = await db.grammarExample.findFirst({
      where: { audioFilePath: key },
    });
    return example !== null;
  }
  if (key.startsWith("placement-audio/")) {
    const [line, script, placementSession] = await Promise.all([
      db.placementListeningLine.findFirst({
        where: { audioFilePath: key },
        select: { script: { select: { questionId: true } } },
      }),
      db.placementListeningScript.findFirst({
        where: { audioFilePath: key },
        select: { questionId: true },
      }),
      db.placementSession.findFirst({
        where: { userId, status: "IN_PROGRESS" },
        orderBy: { startedAt: "desc" },
        select: { id: true },
      }),
    ]);
    const questionId = script?.questionId ?? line?.script.questionId;
    if (!questionId || !placementSession) return false;

    const currentQuestion = await getNextQuestion(userId, placementSession.id);
    const currentQuestionIds = currentQuestion?.questionGroup?.length
      ? currentQuestion.questionGroup.map((question) => question.id)
      : currentQuestion
        ? [currentQuestion.id]
        : [];
    return currentQuestionIds.includes(questionId);
  }
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const isSharedNamespace =
    key.startsWith("dialogue-audio/") ||
    key.startsWith("vocabulary-audio/") ||
    key.startsWith("grammar-audio/") ||
    key.startsWith("placement-audio/") ||
    key.startsWith("welcome-audio/");

  let authorized: boolean;
  let contentType: string;

  if (isSharedNamespace) {
    authorized = await isSharedContentKey(key, session.user.id);
    contentType = key.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
  } else {
    const attempt = await db.speakingAttempt.findFirst({
      where: { audioFilePath: key },
      include: { session: { select: { userId: true } } },
    });
    authorized = attempt !== null && attempt.session.userId === session.user.id;
    contentType = speakingContentType(key);
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await getStorageProvider().download(key);
    const total = data.byteLength;

    // `<audio>` seeking relies on the browser being able to fetch just the
    // bytes it needs via a Range request - without honoring it (RFC 7233),
    // a seek forces a full re-download and playback restarts from 0 instead
    // of jumping to the requested time (user report, 2026-08-22).
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : total - 1;
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start > end ||
        end >= total
      ) {
        return new NextResponse(null, {
          status: 416,
          headers: { "content-range": `bytes */${total}` },
        });
      }
      const chunk = data.subarray(start, end + 1);
      return new NextResponse(new Uint8Array(chunk), {
        status: 206,
        headers: {
          "content-type": contentType,
          "content-range": `bytes ${start}-${end}/${total}`,
          "accept-ranges": "bytes",
          "content-length": String(chunk.byteLength),
          "cache-control": "private, max-age=0, no-store",
        },
      });
    }

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "accept-ranges": "bytes",
        "cache-control": "private, max-age=0, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

function speakingContentType(key: string): string {
  if (key.endsWith(".ogg")) return "audio/ogg";
  if (key.endsWith(".m4a")) return "audio/mp4";
  if (key.endsWith(".wav")) return "audio/wav";
  return "audio/webm";
}
