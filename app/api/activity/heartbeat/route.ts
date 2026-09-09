import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { parseActivityHeartbeat } from "@/lib/activity-heartbeat";
import { db } from "@/lib/db";

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = parseActivityHeartbeat(
    await request.json().catch(() => null),
  );
  if (!payload) {
    return Response.json({ error: "Invalid heartbeat" }, { status: 400 });
  }

  const now = new Date();
  const where = {
    userId: session.user.id,
    clientSessionId: payload.clientSessionId,
    surface: payload.surface,
    lastSequence: { lt: payload.sequence },
  };
  const data = {
    path: payload.path,
    lastActiveAt: now,
    activeSeconds: payload.activeSeconds,
    interactionCount: payload.interactionCount,
    lastSequence: payload.sequence,
  };

  const updated = await db.learnerActivitySession.updateMany({ where, data });
  if (updated.count === 0) {
    try {
      await db.learnerActivitySession.create({
        data: {
          userId: session.user.id,
          clientSessionId: payload.clientSessionId,
          surface: payload.surface,
          path: payload.path,
          startedAt: payload.startedAt,
          lastActiveAt: now,
          activeSeconds: payload.activeSeconds,
          interactionCount: payload.interactionCount,
          lastSequence: payload.sequence,
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
      // A concurrent newer heartbeat may have created the row first. Retry
      // the monotonic update; stale sequences intentionally affect zero rows.
      await db.learnerActivitySession.updateMany({ where, data });
    }
  }

  return new Response(null, {
    status: 204,
    headers: { "cache-control": "private, no-store" },
  });
}
