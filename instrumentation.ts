import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { normalizedOperationalErrorCode, recordOperationalEventBestEffort } =
    await import("@/lib/operational-events");
  const digest =
    typeof error === "object" &&
    error !== null &&
    typeof Reflect.get(error, "digest") === "string"
      ? (Reflect.get(error, "digest") as string)
      : null;

  await recordOperationalEventBestEffort({
    source: "SERVER",
    severity: "CRITICAL",
    code: normalizedOperationalErrorCode(error),
    route: context.routePath,
    method: request.method,
    digest,
  });
};
