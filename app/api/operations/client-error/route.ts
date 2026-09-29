import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordOperationalEventBestEffort } from "@/lib/operational-events";

const schema = z.object({
  kind: z.enum(["window_error", "unhandled_rejection", "react_boundary"]),
  path: z.string().max(300),
  errorName: z.string().regex(/^[A-Za-z][A-Za-z0-9]{0,39}$/),
  digest: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,100}$/)
    .optional(),
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REPORTS_PER_WINDOW = 20;
const reportTimestamps = new Map<string, number[]>();

function allowsReport(userId: string): boolean {
  const now = Date.now();
  const recent = (reportTimestamps.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REPORTS_PER_WINDOW) return false;
  recent.push(now);
  reportTimestamps.set(userId, recent);
  return true;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!allowsReport(session.user.id)) {
    return Response.json({ error: "Too many reports" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid report" }, { status: 400 });
  }

  await recordOperationalEventBestEffort({
    source: "CLIENT",
    severity: "WARNING",
    code: `${parsed.data.kind}.${parsed.data.errorName}`,
    route: parsed.data.path,
    digest: parsed.data.digest,
  });

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
