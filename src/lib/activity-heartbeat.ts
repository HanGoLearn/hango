import {
  isLearnerActivitySurface,
  type LearnerActivitySurface,
} from "@/lib/activity-surface";

export interface ActivityHeartbeatPayload {
  clientSessionId: string;
  surface: LearnerActivitySurface;
  path: string;
  startedAt: Date;
  activeSeconds: number;
  interactionCount: number;
  sequence: number;
}

const CLIENT_SESSION_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;

export function parseActivityHeartbeat(
  value: unknown,
): ActivityHeartbeatPayload | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (
    typeof input.clientSessionId !== "string" ||
    !CLIENT_SESSION_PATTERN.test(input.clientSessionId) ||
    !isLearnerActivitySurface(input.surface) ||
    typeof input.path !== "string" ||
    !input.path.startsWith("/") ||
    input.path.length > 300 ||
    typeof input.startedAt !== "string" ||
    !Number.isInteger(input.activeSeconds) ||
    (input.activeSeconds as number) < 0 ||
    (input.activeSeconds as number) > 86_400 ||
    !Number.isInteger(input.interactionCount) ||
    (input.interactionCount as number) < 1 ||
    (input.interactionCount as number) > 1_000_000 ||
    !Number.isInteger(input.sequence) ||
    (input.sequence as number) < 1 ||
    (input.sequence as number) > 1_000_000
  ) {
    return null;
  }

  const startedAt = new Date(input.startedAt);
  const now = Date.now();
  if (
    Number.isNaN(startedAt.getTime()) ||
    startedAt.getTime() > now + 60_000 ||
    startedAt.getTime() < now - 24 * 60 * 60 * 1000
  ) {
    return null;
  }

  const elapsedSeconds = Math.max(
    0,
    Math.ceil((now - startedAt.getTime()) / 1000),
  );
  const maximumSequence = Math.ceil(elapsedSeconds / 15) + 2;
  if (
    (input.activeSeconds as number) > elapsedSeconds + 15 ||
    (input.sequence as number) > maximumSequence
  ) {
    return null;
  }

  return {
    clientSessionId: input.clientSessionId,
    surface: input.surface,
    path: input.path,
    startedAt,
    activeSeconds: input.activeSeconds as number,
    interactionCount: input.interactionCount as number,
    sequence: input.sequence as number,
  };
}
