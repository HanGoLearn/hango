import { serverEnv } from "@/lib/env/server";
import { runPrivateObjectRetention } from "@/lib/private-object-retention";

/** Daily, idempotent enforcement of private Speaking Lab audio retention. */
export async function GET(request: Request) {
  if (!serverEnv.CRON_SECRET) {
    return new Response("Private-object retention is not configured", {
      status: 503,
    });
  }
  if (
    request.headers.get("authorization") !== `Bearer ${serverEnv.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await runPrivateObjectRetention();
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
