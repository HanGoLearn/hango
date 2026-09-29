import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  markOperationalHeartbeat,
  recordOperationalEvent,
} from "@/lib/operational-events";
import { getPlatformOperations } from "@/lib/platform-operations";

const marker = `observability_test_${Date.now()}`;
const heartbeatKey = `test.heartbeat.${Date.now()}`;

afterEach(async () => {
  await Promise.all([
    db.operationalEvent.deleteMany({ where: { code: marker } }),
    db.operationalHeartbeat.deleteMany({ where: { key: heartbeatKey } }),
  ]);
});

describe("platform operations (integration, real database)", () => {
  it("groups repeated safe events and exposes service health", async () => {
    const privateIdentifier = "cm1234567890abcdefghijkl";
    const input = {
      source: "SERVER" as const,
      severity: "CRITICAL" as const,
      code: marker,
      route: `/users/${privateIdentifier}?token=must-never-appear`,
      method: "POST",
      digest: "safe-digest-1",
    };
    await recordOperationalEvent(input);
    await recordOperationalEvent(input);
    await markOperationalHeartbeat({
      key: heartbeatKey,
      status: "HEALTHY",
    });

    const row = await db.operationalEvent.findFirstOrThrow({
      where: { code: marker },
    });
    expect(row).toMatchObject({
      occurrenceCount: 2,
      route: "/users/:id",
      method: "POST",
      digest: "safe-digest-1",
    });
    expect(JSON.stringify(row)).not.toContain(privateIdentifier);
    expect(JSON.stringify(row)).not.toContain("must-never-appear");

    const dashboard = await getPlatformOperations();
    expect(dashboard.services.map((service) => service.key)).toEqual(
      expect.arrayContaining(["application", "database", "storage", "email"]),
    );
    expect(dashboard.events.some((event) => event.id === row.id)).toBe(true);
    expect(
      dashboard.alerts.some((alert) =>
        alert.title.includes(marker.replaceAll("_", " ")),
      ),
    ).toBe(true);
  });
});
