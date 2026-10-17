import type { AiTeacherContext, AiTeacherMode } from "@/lib/ai-context";

/** User-approved estimate per session, not measured provider billing or a
 * guaranteed maximum. Also used by the preventive authorization gate. */
export const REALTIME_SESSION_ESTIMATE_USD = 0.05;
export const REALTIME_USAGE_FEATURES = [
  "han-tutor-realtime-session",
  "han-companion-realtime-session",
  "journey-speaking-realtime-session",
  "speaking-lab-realtime-session",
  "placement-realtime-session",
] as const;
export type RealtimeUsageFeature = (typeof REALTIME_USAGE_FEATURES)[number];
export type RealtimeRolePlaySurface = "JOURNEY" | "SPEAKING_LAB" | "PLACEMENT";

export function isRealtimeUsageFeature(
  feature: string,
): feature is RealtimeUsageFeature {
  return (REALTIME_USAGE_FEATURES as readonly string[]).includes(feature);
}

/** Tutor/Companion follow the actual conversation mode, not a supplied
 * feature key. Role-play callers identify their separate product surface. */
export function resolveRealtimeUsageFeature(
  mode: AiTeacherMode,
  context: AiTeacherContext,
  requestedSurface: string | null = null,
): RealtimeUsageFeature | null {
  if (!context.rolePlay) {
    if (requestedSurface !== null) return null;
    return mode === "TUTOR"
      ? "han-tutor-realtime-session"
      : "han-companion-realtime-session";
  }
  if (mode !== "PRACTICE") return null;
  const surface =
    requestedSurface ??
    (context.rolePlay.isFreeTopic ? "SPEAKING_LAB" : "JOURNEY");
  if (surface === "JOURNEY") return "journey-speaking-realtime-session";
  if (surface === "SPEAKING_LAB") return "speaking-lab-realtime-session";
  if (surface === "PLACEMENT") return "placement-realtime-session";
  return null;
}
