import { getPublicHealthStatus } from "@/lib/platform-operations";

export async function GET() {
  const health = await getPublicHealthStatus();
  return Response.json(
    {
      status: health.healthy ? "ok" : "unavailable",
      checkedAt: health.checkedAt.toISOString(),
    },
    {
      status: health.healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
