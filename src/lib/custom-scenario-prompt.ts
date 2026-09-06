export interface CustomScenario {
  title: string;
  scenarioContext: string;
  learnerRole: string;
  aiRole: string;
  objective: string;
  openingLine: string;
}

/**
 * Han Companion's "what do you want to practice today?" (2026-08-31,
 * Fase 4) - builds a one-off practice scenario from the learner's own
 * free-text request instead of a pre-authored Mission row (missions are
 * 100% seeded content, never generated - see mission-data.ts). Mirrors the
 * same request/prompt shape `buildFreeTopicRolePlay` (free-topic-role-play.ts)
 * already produces by hand from Speaking Lab's form fields, so the result
 * plugs into the exact same RolePlayContext-consuming code
 * (HanVoiceConversation, ai-context.ts's role-play prompt builders)
 * without any new persona logic.
 */
export function buildCustomScenarioPrompt(
  learnerRequest: string,
  level: string,
  knownFacts: string[],
): string {
  return [
    "You are Han, designing a one-off Mandarin Chinese speaking practice scenario for a learner, based on what they just asked to practice.",
    `The learner's request: "${learnerRequest}"`,
    `The learner's current level: ${level}.`,
    knownFacts.length > 0
      ? `Things you already know about this learner: ${knownFacts.join("; ")}. Use these only if they genuinely make the scenario more personal and relevant - never force them in.`
      : null,
    "",
    "Design a short, realistic role-play scenario that lets the learner practice exactly what they asked for. You (Han) play one character in the scene; the learner plays the other.",
    "The opening line is the very first thing your character says when the conversation starts - natural spoken Mandarin only, no pinyin, no translation, appropriate for the learner's level.",
    "",
    "Respond with ONLY a JSON object, no other text, shaped exactly like this:",
    '{"title": string, "scenarioContext": string, "learnerRole": string, "aiRole": string, "objective": string, "openingLine": string}',
    "title: a short English label for this scenario (max 6 words).",
    "scenarioContext: one English sentence describing the situation and setting.",
    "learnerRole: a short English description of who the learner is playing.",
    "aiRole: a short English description of who you (Han) are playing.",
    "objective: one English sentence describing what the learner is trying to accomplish.",
    "openingLine: your character's first line, in Mandarin Chinese characters only.",
  ]
    .filter(Boolean)
    .join("\n");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Never throws - returns null for anything that doesn't parse cleanly (same convention as reflection-prompt.ts). */
export function parseCustomScenario(raw: string): CustomScenario | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Record<string, unknown>;

    if (
      !isNonEmptyString(candidate.title) ||
      !isNonEmptyString(candidate.scenarioContext) ||
      !isNonEmptyString(candidate.learnerRole) ||
      !isNonEmptyString(candidate.aiRole) ||
      !isNonEmptyString(candidate.objective) ||
      !isNonEmptyString(candidate.openingLine)
    ) {
      return null;
    }

    return {
      title: candidate.title,
      scenarioContext: candidate.scenarioContext,
      learnerRole: candidate.learnerRole,
      aiRole: candidate.aiRole,
      objective: candidate.objective,
      openingLine: candidate.openingLine,
    };
  } catch {
    return null;
  }
}
