import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveSafePath } from "@/lib/storage/providers/local";

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
 *   (`vocabulary-audio/...`), grammar audio (`grammar-audio/...`), and
 *   placement exam listening audio (`placement-audio/...`) are shared
 *   content generated once and reused by every learner, so any
 *   authenticated user may fetch it — the check is that the key is a real
 *   generated file, not that the requester generated it.
 */
async function isSharedContentKey(key: string): Promise<boolean> {
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
    const [line, script] = await Promise.all([
      db.placementListeningLine.findFirst({ where: { audioFilePath: key } }),
      db.placementListeningScript.findFirst({ where: { audioFilePath: key } }),
    ]);
    return line !== null || script !== null;
  }
  return false;
}

export async function GET(
  _request: NextRequest,
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
    key.startsWith("placement-audio/");

  let authorized: boolean;
  let contentType: string;

  if (isSharedNamespace) {
    authorized = await isSharedContentKey(key);
    contentType = key.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
  } else {
    const attempt = await db.speakingAttempt.findFirst({
      where: { audioFilePath: key },
      include: { session: { select: { userId: true } } },
    });
    authorized = attempt !== null && attempt.session.userId === session.user.id;
    contentType = "audio/webm";
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const filePath = resolveSafePath(key);
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=0, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
