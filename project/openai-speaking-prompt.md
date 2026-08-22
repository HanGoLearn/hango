# Prompt for the OpenAI session — Placement Exam Speaking

> Paste this whole document as one message to the OpenAI/Codex session
> working on `han-realtime.ts` / `ai-context.ts` / `han-voice-conversation.tsx`
> / `realtime-vad.ts`. It supersedes every earlier "standalone prompt for
> the OpenAI session" draft scattered through `project/TASKS.md` (search
> for that phrase if you want the history) — this is the current,
> corrected, complete version.

## Context

HanGo's adaptive HSK1-9 placement exam is fully built and live
(`/placement-exam`) for Vocabulary, Grammar, Reading, and Listening —
211 real questions seeded, adaptive engine climbing HSK1 through the
combined HSK7-9 tier. Speaking is the one skill still missing. It's not
in this exam's schema yet and has no seeded content — it needs your
Realtime pipeline, not multiple-choice/ordering questions, so it was
intentionally left for you to build rather than attempted from this side.

Full question-bank source of truth: `project/placement-exam-questions.md`.
Build log / decision history: `project/TASKS.md`.

## What already exists that you should reuse, not reinvent

- `RealtimeRolePlay` (`src/lib/han-realtime.ts`): `{ aiRole, learnerRole,
  scenarioContext, objective, lessonVocabulary?, lessonGrammar?, level?,
  lessonHskLevel?, pace?, isFreeTopic?, correctionMode? }`. The 5 scenarios
  below are already authored in exactly this shape.
- `buildConversationCompletionTool()` — the forced, silent
  `assess_conversation_completion` tool call already used to decide
  continue/end after every learner turn in lesson role-play. Reuse the
  same tool-calling pattern for placement Speaking rather than inventing
  a new one. One addition needed: grade `objective_complete` against the
  *specific* bullet points in each scenario's objective below (e.g.
  "acknowledged at least one valid counterpoint"), not just "the
  conversation felt complete." Same existing rule applies: the character
  prompting/suggesting an action never counts as the learner completing
  it (`pending_learner_action` already encodes this).
- `buildRealtimeOpeningInstructions` / `buildRealtimeTurnInstructions` /
  `buildRealtimeClosingInstructions` — the existing per-turn instruction
  builders. These scenarios should plug straight in.

## The 5 scenarios (verbatim from `placement-exam-questions.md`)

No Speaking below HSK3 — confirmed, not an oversight.

### HSK3 — "Weekend plans with a friend"
- **aiRole**: your friend
- **learnerRole**: yourself
- **scenarioContext**: You and your friend are deciding what to do this
  weekend — go hiking or stay in and watch a movie.
- **objective**: State a preference with at least one reason (因为), and
  respond to the friend's counter-suggestion — agree, compromise, or
  politely disagree.
- **AI opens with**: "这个周末你想在家休息休息，还是想出去运动？"

### HSK4 — "A dip in team efficiency"
- **aiRole**: your colleague
- **learnerRole**: yourself
- **scenarioContext**: Your team's work efficiency has dropped recently,
  and your colleague wants your take on why, and what to do about it.
- **objective**: Identify at least one possible cause, propose at least
  one solution, and respond to a mild pushback from the colleague using
  comparison or concession language (比较 / 虽然...但是 / 不过).
- **AI opens with**: "最近咱们团队的效率好像下降了，你觉得是为什么？"

### HSK5 — "Should young people live with their parents?"
- **aiRole**: an acquaintance with a differing opinion
- **learnerRole**: yourself
- **scenarioContext**: A casual but real debate about the social trend of
  young people living independently from their parents.
- **objective**: State and defend a position with reasoning, acknowledge
  at least one valid point from the other side (承认/不过), without simply
  agreeing to end the conversation.
- **AI opens with**: "现在很多年轻人不愿意跟父母住，你怎么看？"

### HSK6 — "Defending a position under scrutiny"
- **aiRole**: a skeptical colleague/reviewer
- **learnerRole**: yourself, presenting an idea or theory
- **scenarioContext**: The learner has proposed an idea (a plan, a
  theory, a method) and must defend it against genuine, substantive
  pushback about its limitations.
- **objective**: Acknowledge the theory/plan's real limitations honestly
  (局限性) while still making a coherent case for its value, using at
  least one concessive structure (虽...但/可/却).
- **AI opens with**: "这个想法听起来不错，不过你觉得它有没有局限性？"

### HSK7-9 — "Is disruption overrated?"
- **aiRole**: a debate partner with a genuinely opposing, well-reasoned view
- **learnerRole**: yourself
- **scenarioContext**: An abstract discussion of whether disruptive
  innovation is more valuable than gradual improvement — the kind of
  conversation a fluent adult speaker has, not a scripted exchange.
- **objective**: Construct a nuanced argument (not just pro/con), use at
  least one advanced discourse connector (连...都/宁可...也不/更不用说)
  naturally, and engage substantively with the counterargument rather
  than deflecting it.
- **AI opens with**: "你觉得真正的创新一定要颠覆原来的范式吗？"

## Scoring — the formula, corrected

Speaking has no discrete correct/incorrect to count, so it reuses the
existing rubric (`computeSpeakingConversationScore`, `points-system.ts`)
conceptually, **but drops `vocabularyUsageRatio` entirely**:

```
base_average = (pronunciation + fluency + accuracy + complexity + communication_effectiveness) / 5
speaking_0_100 = base_average × objective_completion_ratio
```

That's it — no third multiplier. `vocabularyUsageRatio` exists in the
*lesson* version of this formula to check engagement with that lesson's
own taught word list. A placement scenario has no such list — there's no
"unit" to have taught it — so that concept doesn't apply here at all,
not even at a different weight. Whether the learner's language was
actually *at* the target level is `complexity`'s job (already inside
`base_average`), not a separate check.

## Level-climbing logic

Same "climb while passing, stop on first failure" shape the other 4
skills already use (`src/lib/placement-exam.ts`'s `currentSkillLevel`),
just a score threshold instead of discrete right/wrong:

1. Start at the **lowest** of whatever Vocabulary/Grammar/Reading/
   Listening already placed the learner at (never start Speaking above
   what they've shown elsewhere — recognition and production are
   different skills, and Speaking should never be normalized up to match
   a stronger recognition score).
2. Run that level's scenario. Grade with the formula above.
3. **≥70/100** (same passing threshold as lesson Reflection,
   `REFLECTION_PASS_SCORE` in `points-system.ts`) → level confirmed, move
   up one level, repeat, up to HSK7-9.
4. **<70/100** → stop. The last level that scored ≥70 is the Speaking
   result. If even the starting level fails, Speaking is credited *below*
   where the other 4 skills placed — expected, not a bug.
5. **HSK7-9 here is informational only** — same rule as the rest of the
   exam (see below). Never grants the 1650-2000 point range or skips
   anything.

## HSK7-9 is diagnostic only — applies to your Speaking work too

`docs/02_academy/points_system.md` already has a deliberate rule: HSK7-9
(1650-2000 points) can only be earned through sustained Writing
Lab/Speaking Lab evidence over time, never a single exam/lesson. The
HSK7-9 scenario above still runs (useful signal — shows how far someone's
real ability goes) but its result must be shown/stored as informational
only, never used to grant real placement, points, or lesson-skipping.

## What we need from your side

1. Wire these 5 scenarios into a placement-specific Realtime session,
   adapting `buildConversationCompletionTool`'s objective-completion
   grading to check the specific bullet points above per scenario.
2. Confirm/tune with live audio whether 3-5 turns is enough to reach a
   real placement decision at each level — especially HSK5 vs. HSK6 vs.
   HSK7-9, which get progressively more abstract/concessive by design,
   but that needs verification with real speech, not just text review.
3. Verify the 70/100 threshold actually discriminates well in practice
   with real audio — it's borrowed from lesson Reflection's passing
   score, not independently validated for this specific use case.
4. Schema note: `PlacementSkill` (Prisma enum) currently only has
   `VOCABULARY | GRAMMAR | READING | LISTENING`, and `PlacementSession`
   has no `speakingHskLevel` column yet — both need a migration once you
   land on the final storage shape for a Speaking attempt/result. Loop
   back with the shape you land on (likely something like a
   `PlacementSpeakingAttempt` row per scenario run, or a simpler
   `speakingHskLevel Int?` + last-transcript field on `PlacementSession`
   — your call, since you know what the Realtime pipeline actually needs
   to persist) and I'll write the migration + wire it into
   `maybeCompleteSession`'s result object.
5. No Speaking below HSK3 — confirmed, not an oversight.
