import { describe, expect, it, vi } from "vitest";
import {
  importedReviewBudget,
  runImportedReviewOnce,
  verifyAdditionalPromptV2Request,
  PROMPT_V2_ADDITIONAL_AUTHORIZATION,
  EVIDENCE_REVIEW_AUTHORIZATION,
} from "@/lib/journey-speaking-quality-once";
import type { prepareImportedJourneyQualityReview } from "@/lib/journey-speaking-quality-import";
import type {
  AiCompletionRequest,
  AiCompletionResult,
} from "@/lib/ai/provider";

function setup() {
  const prepared = {
    request: {
      instructions: "Evaluate",
      input: "clear turns",
      promptVersion: "test",
      responseFormat: {
        name: "test",
        type: "json_schema",
        strict: true,
        schema: {},
      },
    },
    receipt: { attemptId: "attempt", source: "production" },
    inspectResponse: vi.fn(() => ({ state: "INVALID_OUTPUT" })),
  } as unknown as ReturnType<typeof prepareImportedJourneyQualityReview>;
  const claimed = new Set<string>();
  const events: string[] = [];
  const deps = {
    store: {
      claim: vi.fn(async (key: string) => {
        if (claimed.has(key)) return false;
        claimed.add(key);
        return true;
      }),
      readSummary: vi.fn(async (_key: string): Promise<unknown> => null),
      saveResponse: vi.fn(async () => {
        events.push("saved");
      }),
      saveInspection: vi.fn(async () => {
        events.push("inspected");
      }),
      saveSummary: vi.fn(async () => {}),
    },
    authorize: vi.fn(async (operation: () => Promise<AiCompletionResult>) =>
      operation(),
    ),
    complete: vi.fn(async (_request: AiCompletionRequest) => {
      events.push("provider");
      return {
        content: "{}",
        provider: "openai",
        model: "gpt-5-mini",
        inputTokens: 100,
        outputTokens: 200,
        outputStatus: "complete" as const,
      };
    }),
    meter: vi.fn(async () => {
      events.push("meter");
      return "local-usage";
    }),
  };
  return { prepared, deps, events };
}
const approval = { confirmOnePaidReview: true, maximumUsd: 0.05 } as const;
describe("imported review one-shot", () => {
  it("allows one separately authorized evidence-format review and leaves both old claims locked", async () => {
    const { prepared, deps } = setup();
    const first = await runImportedReviewOnce(prepared, approval, deps);
    deps.store.readSummary.mockResolvedValue({
      ...first,
      state: "REJECTED_CANDIDATE",
    });
    prepared.request.promptVersion = "journey-quality-review-2026-10-18-v2";
    const second = await runImportedReviewOnce(
      prepared,
      {
        ...approval,
        additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
      },
      deps,
    );
    deps.store.readSummary.mockResolvedValue({
      ...second,
      state: "REJECTED_CANDIDATE",
    });
    prepared.request.promptVersion =
      "journey-quality-evidence-review-2026-10-18-v1";
    prepared.request.responseFormat.name = "journey_evidence_selection";
    const evidenceApproval = {
      ...approval,
      evidenceAuthorization: EVIDENCE_REVIEW_AUTHORIZATION,
    } as const;
    const third = await runImportedReviewOnce(prepared, evidenceApproval, deps);
    expect(
      new Set([first.reviewKey, second.reviewKey, third.reviewKey]).size,
    ).toBe(3);
    expect(deps.complete.mock.lastCall?.[0].timeoutMs).toBe(60000);
    expect(deps.complete.mock.lastCall?.[0].retry).toBe(false);
    expect(
      (await runImportedReviewOnce(prepared, evidenceApproval, deps)).state,
    ).toBe("ALREADY_CLAIMED");
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
    expect(deps.complete).toHaveBeenCalledTimes(3);
    expect(deps.store.readSummary).toHaveBeenLastCalledWith(second.reviewKey);
  });
  it("refuses an evidence run without its rejected predecessor or with mixed approvals", async () => {
    const { prepared, deps } = setup();
    prepared.request.promptVersion =
      "journey-quality-evidence-review-2026-10-18-v1";
    prepared.request.responseFormat.name = "journey_evidence_selection";
    await expect(
      runImportedReviewOnce(
        prepared,
        { ...approval, evidenceAuthorization: EVIDENCE_REVIEW_AUTHORIZATION },
        deps,
      ),
    ).rejects.toThrow("predecessor");
    await expect(
      runImportedReviewOnce(
        prepared,
        {
          ...approval,
          evidenceAuthorization: EVIDENCE_REVIEW_AUTHORIZATION,
          additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
        },
        deps,
      ),
    ).rejects.toThrow("Conflicting");
    expect(deps.complete).not.toHaveBeenCalled();
    expect(deps.store.claim).not.toHaveBeenCalled();
  });
  it("allows exactly one newly authorized prompt-v2 review without unlocking the old claim", async () => {
    const { prepared, deps } = setup();
    const first = await runImportedReviewOnce(prepared, approval, deps);
    deps.store.readSummary.mockResolvedValue({
      ...first,
      state: "REJECTED_CANDIDATE",
    });
    prepared.request.promptVersion = "journey-quality-review-2026-10-18-v2";
    const secondApproval = {
      ...approval,
      additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
    } as const;
    const second = await runImportedReviewOnce(prepared, secondApproval, deps);
    expect(second.reviewKey).not.toBe(first.reviewKey);
    expect(second.paidDispatches).toBe(1);
    expect(
      (await runImportedReviewOnce(prepared, secondApproval, deps)).state,
    ).toBe("ALREADY_CLAIMED");
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
    expect(deps.complete).toHaveBeenCalledTimes(2);
    expect(deps.store.readSummary).toHaveBeenCalledWith(first.reviewKey);
  });
  it("requires a finished rejected predecessor, not a pending or ambiguous paid call", async () => {
    const { prepared, deps } = setup();
    prepared.request.promptVersion = "journey-quality-review-2026-10-18-v2";
    const next = {
      ...approval,
      additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
    } as const;
    await expect(runImportedReviewOnce(prepared, next, deps)).rejects.toThrow(
      "predecessor",
    );
    expect(deps.store.claim).not.toHaveBeenCalled();
    expect(deps.complete).not.toHaveBeenCalled();
  });
  it("does not infer authorization from prompt versions or accept arbitrary authorization labels", async () => {
    const { prepared, deps } = setup();
    await expect(
      runImportedReviewOnce(
        prepared,
        {
          ...approval,
          additionalAuthorization: PROMPT_V2_ADDITIONAL_AUTHORIZATION,
        },
        deps,
      ),
    ).rejects.toThrow("Unsupported");
    await expect(
      runImportedReviewOnce(
        prepared,
        { ...approval, additionalAuthorization: "unapproved" as never },
        deps,
      ),
    ).rejects.toThrow("Unsupported");
    expect(deps.complete).not.toHaveBeenCalled();
  });
  it("limits the extra approval to identical speech, banks and schema", () => {
    const { prepared } = setup();
    const previous = {
      ...prepared.request,
      promptVersion: "journey-quality-review-2026-10-18-v1",
    };
    const current = {
      ...prepared.request,
      promptVersion: "journey-quality-review-2026-10-18-v2",
      instructions: "revised rules",
    };
    expect(() =>
      verifyAdditionalPromptV2Request(previous, current),
    ).not.toThrow();
    expect(() =>
      verifyAdditionalPromptV2Request(previous, {
        ...current,
        input: "other speech",
      }),
    ).toThrow();
    expect(() =>
      verifyAdditionalPromptV2Request(previous, {
        ...current,
        responseFormat: {
          ...current.responseFormat,
          schema: { changed: true },
        },
      }),
    ).toThrow();
  });
  it("includes schema, UTF8 bytes, overhead and reasoning output within TEXT reservation", () => {
    const { prepared } = setup();
    const budget = importedReviewBudget(prepared.request);
    expect(budget.allowanceUsd).toBeLessThan(0.02);
    expect(budget.inputTokenAllowance).toBeGreaterThan(
      Buffer.byteLength(JSON.stringify(prepared.request)),
    );
    expect(() =>
      importedReviewBudget({ ...prepared.request, input: "中".repeat(30000) }),
    ).toThrow();
  });
  it("persists response before accounting/inspection and prevents duplicate dispatch", async () => {
    const { prepared, deps, events } = setup();
    const result = await runImportedReviewOnce(prepared, approval, deps);
    expect(result.state).toBe("INVALID_OUTPUT");
    expect(events).toEqual(["provider", "saved", "meter", "inspected"]);
    expect(deps.complete.mock.calls[0]).toEqual([
      {
        systemPrompt: "Evaluate",
        messages: [{ role: "user", content: "clear turns" }],
        structuredOutput: { name: "test", schema: {} },
        maxOutputTokens: 3500,
        timeoutMs: 45000,
        retry: false,
      },
    ]);
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
    expect(deps.complete).toHaveBeenCalledTimes(1);
    expect(deps.meter).toHaveBeenCalledWith(expect.anything(), 0.000425);
  });
  it("blocks before provider when existing caps reject", async () => {
    const { prepared, deps } = setup();
    deps.authorize.mockRejectedValueOnce(new Error("cap"));
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "CAP_OR_AUTHORIZATION_BLOCKED",
    );
    expect(deps.complete).not.toHaveBeenCalled();
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
  });
  it("never retries after ambiguous transport failure", async () => {
    const { prepared, deps } = setup();
    deps.complete.mockRejectedValueOnce(new Error("timeout"));
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "PROVIDER_OR_STORAGE_FAILURE_NO_RETRY",
    );
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
    expect(deps.complete).toHaveBeenCalledTimes(1);
  });
  it("retains response after metering failure without regenerating", async () => {
    const { prepared, deps } = setup();
    deps.meter.mockRejectedValueOnce(new Error("db"));
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "POST_RESPONSE_FAILURE",
    );
    expect(deps.store.saveResponse).toHaveBeenCalledOnce();
    expect(prepared.inspectResponse).not.toHaveBeenCalled();
    expect((await runImportedReviewOnce(prepared, approval, deps)).state).toBe(
      "ALREADY_CLAIMED",
    );
  });
});
