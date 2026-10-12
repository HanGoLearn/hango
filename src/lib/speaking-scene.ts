/** Scene detection must not depend on the language of localized curriculum copy. */
export function isIntroductionSpeakingScene(scene: {
  aiRole?: string;
  scenarioContext?: string;
  objective: string;
}): boolean {
  const description = `${scene.aiRole ?? ""} ${scene.scenarioContext ?? ""} ${scene.objective}`;
  return (
    /\b(?:new classmate|meet(?:ing)? (?:someone|a person|a classmate) new|meet(?:ing)? for the first time|exchange names?|introduc(?:e|ing|tion)|ask(?:s|ing)? (?:for )?(?:their|your|someone'?s) name)\b/iu.test(
      description,
    ) ||
    /\b(?:nuev[oa] compañer[oa](?: de clase)?|saludos? y presentaciones|presentar(?:se|te|nos)|intercambiar (?:sus |los )?nombres|conocer(?:se)? por primera vez)\b/iu.test(
      description,
    ) ||
    /(?:初次见面|第一次见面|自我介绍|互相介绍|新同学)/u.test(description)
  );
}

/** Session-local evidence only; never infer a learner identity from the character. */
export function buildSpeakingLearnerIdentityMemory(
  transcript: readonly { role: "user" | "assistant"; content: string }[],
): string | null {
  let occupationEvidence: string | null = null;
  for (const message of transcript) {
    if (message.role !== "user") continue;
    for (const clause of message.content.split(/[，,。.!！;；]/u)) {
      const normalized = clause
        .trim()
        .normalize("NFD")
        .replace(/\p{Mark}/gu, "");
      if (/[?？]|(?:吗|呢)$/u.test(normalized)) continue;
      if (
        /^我(?:现在|也|其实)?(?:是|不是|做|当)(?:一[名个位])?(?:老师|教师|学生|医生|工程师|经理|服务员|店员)[啊呀哦嘛\s]*$/u.test(
          normalized,
        ) ||
        /^(?:(?:i am|i'm|i’m)(?: not)?(?: a| an)?|(?:yo )?(?:no )?soy(?: un| una)?)\s+(?:teacher|student|profesor(?:a)?|maestro|maestra|estudiante|alumn[oa]|lao\s*shi|xue\s*sheng|老师|学生)(?:\b|$)/iu.test(
          normalized,
        ) ||
        /^wo\s+(?:bu\s+)?shi\s+(?:lao\s*shi|xue\s*sheng)\b/iu.test(normalized)
      )
        occupationEvidence = clause.trim().slice(0, 160);
    }
  }
  if (!occupationEvidence) return null;
  return `LEARNER OCCUPATION/STATUS EVIDENCE: ${JSON.stringify(occupationEvidence)}. This is a learner statement, not a question about your character. Preserve its exact affirmative or negative meaning. The learner's explicit statement takes precedence over the suggested starting learner role, but never changes your own character identity. Do not ask for an occupation/status fact already supplied, including through 你呢？. If the learner says 我是老师, accept that they are a teacher; do not answer as if they asked whether YOU are a teacher, insist they are a student, or ask 你是学生吗. Continue from their latest statement or answer their latest question before returning to the scene goal.`;
}
