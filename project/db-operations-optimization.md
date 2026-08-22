# Database operations optimization — full-app audit

> 2026-08-16. Trigger: Prisma Postgres hit its "Operations" quota
> (100,000/period) and the account got restricted ("planLimitReached"),
> which blocked the entire app (every feature reads/writes through the
> same Postgres database, so this isn't specific to any one surface).
> Today's spike was overwhelmingly testing-driven (seeding 211 placement
> exam questions, multiple full integration-test runs, many debug
> scripts), not organic usage - but user asked for the whole app to be
> made "muy óptimo" (maximally optimized) in every sense, not just enough
> to survive today's testing load.
>
> **Everything in this document is unverified against the real database**
> - Prisma is still blocked, so nothing here has been tested end-to-end
> yet, only read/reasoned about. Do not apply any fix from this list
> without running its owning test suite (or, if none exists, adding one)
> once DB access is restored.

## Step 0 (once Prisma is unblocked): get a real measured baseline, not an estimate

Before applying any fix below, run `scripts/measure-lesson-operations.test.ts`
(`npx vitest run scripts/measure-lesson-operations.test.ts`) once, checking
the Prisma Console's Operations count immediately before and after - this
simulates one full, realistic lesson session (Vocabulary through
Reflection) through the exact same data-layer functions the real app
uses, and gives a real number instead of the wide 150-450+ estimate this
document was originally written with. **Costs 2 small real AI-provider
calls** (Reflection's speaking-grading + narrative generation) - see the
file's own header for full details, cleanup guarantees, and why it must
run via `vitest` rather than plain `node`/`tsx`. Re-run it after applying
Tier 1/2 fixes to measure the real improvement, not an assumed one.

## The established fix pattern

Found and fixed first in the placement exam
(`src/lib/placement-exam-data.ts`, `src/lib/actions/placement-exam.ts`,
this same day - see `project/TASKS.md`'s Reading/Listening grouping
section for the full story): a top-level action was calling two
sub-functions that **each independently re-fetched the same data**
(`getNextQuestion` was computed twice per answer submitted; `session`
and `attempts` were each fetched twice). Fixed by:

1. Fetching the shared data **once**, at the top of the top-level caller.
2. Adding an **optional hint parameter** to each sub-function
   (`attemptsHint?: T`) that, when provided, skips that function's own
   internal fetch and uses the hint instead.
3. Leaving the parameter optional (not required) so every other existing
   caller (tests, other call sites) keeps working unmodified - they just
   don't get the optimization unless they opt in.

This exact pattern (multiple independent functions in one call chain,
each re-deriving the same input) turned out to repeat throughout the
app - most findings below are the same bug, in different files.

## Tier 1 — hits every single page load, regardless of what the user is doing

These are the highest-value fixes: they don't require a specific action
(answering a question, submitting an exercise) to trigger - they fire on
every authenticated request, so the multiplier is "every page view by
every user," not "every exercise submitted."

**Status: done and verified 2026-08-19** (real measured baseline: ~500
operations/lesson via `scripts/measure-lesson-operations.test.ts`, before
any Tier 1 fix - see git-less history in `project/TASKS.md` for the
after-number once a comparable measurement is re-run). All fixes below
used `React.cache()` for per-request deduplication instead of the
prop-threading originally sketched here - Next's own docs
(`node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`,
"Reusing data with React.cache") call this out as exactly the right tool:
layouts and pages render as independent trees in this Next version, so a
layout can't hand data down into `{children}` the way a hint param can be
threaded through a normal call chain. Verified via
`tests/integration/dashboard.test.ts`, `progress-and-review.test.ts`,
`critical-path.test.ts`, `tests/unit/learner-profile.test.ts`,
`learning-journey.test.ts`, `tests/component/shell.test.tsx` - 47/47
passing.

- [x] **`learnerProfile` row fetched 3-4 separate times per page load, by
  different consumers, each with its own narrow `select`** - and this
  hits *every* authenticated page, not just Dashboard, because the first
  fetch is in the shared layout:
  - `app/(app)/layout.tsx:29` → full-row fetch via `getOrCreateLearnerProfile` (every page)
  - `src/components/shell/app-shell.tsx:29-38` → same row, `select:{defaultAiMode,hanResponseMode,hanVoice,explanationLanguage}` (every page)
  - `src/lib/dashboard-data.ts:78-81` → same row, `select:{dailyStudyTargetMinutes}` (Dashboard)
  - `src/lib/progress-data.ts:103-106` and `:131-134` → same row, `select:{currentLevel}` then `select:{generalLevelPoints}`, as two *separate* calls (Progress)
  - **Fix applied**: `getOrCreateLearnerProfile` (`src/lib/learner-profile.ts`) wrapped in `React.cache()`; every call site above now calls it instead of its own `db.learnerProfile.findUnique`.

- [x] **`getScenarioMastery`'s result is fetched but never read on Dashboard** - pure waste, zero risk to remove:
  - `src/lib/dashboard-data.ts:74-76,89` computes `scenarioMastery` and returns it in `getDashboardData`'s result.
  - Confirmed via repo-wide grep: `app/(app)/dashboard/page.tsx` never reads `data.scenarioMastery` - only a test references it.
  - **Fix applied**: the call and field are gone from `getDashboardData`.

- [x] **`getScenarioMastery` (when actually used, e.g. on Progress) internally re-fetches data its own caller already fetched in parallel**:
  - `src/lib/progress-data.ts:173-179` (`getScenarioMastery`) calls `getScenariosWithProgress` and `getCompetencyProgress` with no hint params.
  - Both are *also* called directly, in the same `Promise.all`, by `dashboard-data.ts:74-76` and `app/(app)/progress/page.tsx:40,44`.
  - **Fix applied**: `getCompetencyProgress` wrapped in `React.cache()` instead of threading hint params (see status note above).

- [x] **The same `learnerLessonCompletion.findMany({where:{userId}, select:{lessonId:true}})` fires 3-4 times per Dashboard/Progress load**, independently, from:
  - `src/lib/content/learning-journey-data.ts:33-36` (`getScenariosWithProgress`)
  - `src/lib/content/learning-journey-data.ts:126-129` (`getContinueLearningTarget`)
  - `src/lib/progress-data.ts:63-66` (`getVocabularyGrammarExposure`, Progress only)
  - `src/lib/review-data.ts:30-33` (`getReviewQueue`)
  - **Fix applied**: new `getCompletedLessonIds` (`src/lib/content/learning-journey-data.ts`), wrapped in `React.cache()`; all four call sites use it.

- [x] **Study streak computed twice on every Dashboard load**:
  - `src/components/shell/app-shell.tsx:52` calls `getStudyStreak` (5 queries) since it's in the shared layout - runs on every page.
  - `src/lib/dashboard-data.ts:73` calls it *again* inside `getDashboardData` → 10 queries total on Dashboard specifically.
  - **Fix applied**: `getStudyStreak` (`src/lib/dashboard-data.ts`) wrapped in `React.cache()`.

- [x] **Review-queue cooldown check: 4 unbounded queries where 1 filtered query would do**:
  - `src/lib/review-data.ts:43-46` → `getRecentlyReviewedKeys` (lines 10-26) runs once per item type (VOCABULARY/GRAMMAR/MISTAKE/DIALOGUE), each its own `db.reviewCompletion.findMany({where:{userId,itemType}})` with **no** `createdAt` filter or `take` - full all-time history, every time.
  - **Fix applied**: replaced with one `getRecentlyReviewedKeysByType`, filtered by `itemType:{in:[...]}` and `createdAt:{gte: cooldownCutoff}` (24h), grouped by type in JS.

Also bumped, unrelated to the fixes above but discovered while verifying
them: vitest's default `testTimeout` (5000ms) was too tight for this
Prisma Postgres serverless connection's real latency variance under
today's heavy test load - raised to 15000ms in `vitest.config.mts`, and
`critical-path.test.ts`'s own explicit timeout raised 20s → 60s
(confirmed via timing instrumentation that latency was spread evenly
across every step, not concentrated at one hung query - an infra issue,
not a logic bug).

## Tier 2 — hits every time the user does a specific action (still frequent, just not universal)

**Status: done and verified 2026-08-19.** Verified via
`tests/integration/reflection.test.ts` (plus one new test - stale-report
regeneration had zero prior coverage, see below),
`grammar-interactivity.test.ts`, `lesson-progress.test.ts`,
`ai-teacher.test.ts`, plus `dashboard.test.ts`/`progress-and-review.test.ts`
as a Tier 1 regression check (Tier 2 touched `progress-data.ts` again) -
37/37 passing.

Two things found *while* verifying this tier, both unrelated to the
optimization itself but real: (1) `reflection.test.ts`'s `SPEAKING_RESPONSE`
mock fixture was missing the `vocabularyUsageRatio`/`objectiveCompletionRatio`
fields the multiplicative Speaking formula has required since 2026-08-16,
silently zeroing that test's speaking score (66 → correct value 53) -
pre-existing, unrelated to this session's work, fixed since it blocked
getting a clean test run. (2) Three of that file's tests grabbed an
arbitrary `db.scenarioLevel.findFirstOrThrow()` for a throwaway
create-then-delete lesson fixture, which can transiently land on the real
"restaurant" scenario's level and skew its lesson count for *other* test
files asserting exact counts against it, if both happen to run in the same
parallel batch - fixed by excluding `scenario.slug: "restaurant"` from
that lookup in all three.

- [x] **Grammar Step: examples fetched server-side, then discarded and
  re-fetched client-side, on every view or revisit of the step**:
  - `src/lib/content/grammar.ts:3-9` already loads each grammar point's `examples` via SSR (`lesson.grammar[i].grammarPoint.examples`).
  - `src/components/lesson/steps/grammar-step.tsx:71-73` calls `getGrammarExamplesAction` on mount anyway → `src/lib/grammar-interactivity.ts:77-88` → a brand-new `db.grammarPoint.findUnique`, ignoring the SSR data.
  - Step components mount/unmount per visit (`lesson-engine.tsx:125-196`), and step revisiting is an explicitly supported flow, so this repeats often.
  - **Fix applied**: `getGrammarForLesson`'s `examples` include ordered (`orderBy: {order:"asc"}`, matching what the dropped action guaranteed); `GrammarPointCard` renders `grammarPoint.examples` directly, no client fetch. `getGrammarExamplesAction`/`getGrammarExamples` themselves untouched - still real, tested, used by `scripts/measure-lesson-operations.test.ts` and their own test suite.

- [x] **`getGrammarExercises` burns a query solely to check existence, on the same Grammar Step mount as above**:
  - `src/lib/grammar-interactivity.ts:96-104` fetches the full `GrammarPoint` row via `findUnique` purely for a null check, then calls a *separate* `getExercisesForGrammarPoint` (`content/exercise.ts:15-24`) - the first row's data is never used past the check.
  - **Fix applied**: pre-check dropped; a nonexistent `grammarPointId` now returns `[]` instead of throwing (no test asserted the old NotFoundError behavior for this specific path).

- [x] **`canAccessLesson` and `isLessonCompleted` both query
  `LearnerLessonCompletion` for overlapping data - same bug class as the
  original placement-exam fix**:
  - `app/(app)/lesson/[slug]/page.tsx:25` → `canAccessLesson` (`lesson-progress-data.ts:14-28`) already fetches every sibling lesson's completion row (current lesson's id included) to build an internal `completedIds` set - then discards it, returning only a boolean.
  - `page.tsx:30` → `isLessonCompleted` (`lesson-progress-data.ts:37-46`) then issues a brand-new `findUnique` on the exact same table for the exact same `(userId, lessonId)`.
  - **Fix applied**: new `getLessonAccess(userId, lesson)` (`lesson-progress-data.ts`) fetches the sibling/completion data once and returns `{allowed, completed}`; `page.tsx` uses it instead of calling both functions. `canAccessLesson`/`isLessonCompleted` themselves untouched (same signatures, same behavior) for their other callers (tests, `scripts/measure-lesson-operations.test.ts`).

- [x] **`getOrGenerateLessonReflectionReport` computes every sub-score
  twice when regenerating a stale cached report** (the single biggest
  per-request query count found - ~6 duplicate queries in one request):
  - `src/lib/reflection.ts:289-429`. A stale-report trigger (legacy speaking rubric, a redone exercise/vocab quiz, a failed-AI fallback, non-English cached narrative) causes: `scoredExercises` fetched once (291-294) → scored via 3 more queries to get "first" scores used only for a mismatch check (305-316) → the **same lesson** refetched again (371, already fetched at 295) → exercise ids refetched **again** as two separate queries instead of reusing `scoredExercises` (399-412) → scores recomputed a third time with identical inputs (414-429).
  - **Fix applied**: `scoredExercises`/its comprehension-grammar split now computed once, unconditionally, at the top. New shared `fetchLessonForReflection` helper, widened to the shape both the mismatch-check and the actual regeneration need, called once and reused (`lesson ??= await fetchLessonForReflection(lessonId)`) instead of twice. The mismatch check's freshly-computed scores (`freshComprehensionScore`/`freshGrammarScore`/`freshVocabularyScore`) are reused directly in the regeneration's final `Promise.all` instead of recomputed a third time. No test exercised stale-report regeneration at all before this fix - added one (`tests/integration/reflection.test.ts`, "regenerates a stale cached report...").

- [x] **`getLessonScoreBreakdown` runs 2 separate queries where the file's
  own `scoredExercises` pattern (1 query) already solves this**:
  - `src/lib/reflection.ts:531-544` - two `db.exercise.findMany` calls (comprehension vs. grammar) against the same `lessonId`/`status`, split only by `grammarPointId`.
  - **Fix applied**: one `findMany` selecting `{id, grammarPointId}`, split client-side, matching the same pattern now used in `getOrGenerateLessonReflectionReport`.

- [x] **`progressEvidence` queried twice in one AI Teacher message send**:
  - `src/lib/ai-teacher-data.ts:169-186` - `getCompetencyProgress(userId)` (full, unfiltered `progressEvidence.findMany`) runs alongside a second, separate `db.progressEvidence.findMany` (`take:10`, same table, same userId) in the same `Promise.all`.
  - **Fix applied**: new `getRawProgressEvidence` (`src/lib/progress-data.ts`, `React.cache()`-wrapped like Tier 1's fixes) does the one unfiltered fetch; `getCompetencyProgress` now calls it instead of querying directly; `sendAiTeacherMessage` calls it too and derives "10 most recent results" via a client-side sort+slice instead of a second bounded/ordered query.

Also bumped, unrelated to the fixes above but discovered while verifying
them (same root cause as Tier 1's timeout note): `ai-teacher.test.ts`'s
"rate-limits a user sending too many messages too quickly" test (15
sequential message sends, each several DB round trips) had its own
explicit 15s timeout, too tight for the same latency this whole session
saw - raised to 30s.

## Tier 3 — static/shared reference data, genuine caching candidates

**Status: done and verified 2026-08-19.**

Unlike everything above (which is "fetch once instead of twice, within
one request"), these are cases where the *same* rarely-changing,
non-per-user data gets re-queried from scratch on every relevant event,
across many different requests. Caching here is a real architecture
decision (staleness, invalidation-on-content-edit), not a pure win - do
this deliberately, not as a drive-by fix, and only once DB access is
back and each change can be verified.

**Mechanism**: neither `React.cache()` (Tier 1/2's tool - request-scoped
only, doesn't persist across requests) nor Next's `unstable_cache`/`"use
cache"` fit here. `unstable_cache` requires Next's own request-lifecycle
internals (`globalThis.__incrementalCache` / a work-unit store) that only
exist while an actual Next.js server is handling a request - confirmed by
reading its source
(`node_modules/next/dist/server/web/spec-extension/unstable-cache.js`):
it throws `Invariant: incrementalCache missing` unconditionally otherwise.
Every integration test in this repo calls data-layer functions directly,
bypassing Next's server entirely (the established pattern throughout this
whole session), so wrapping either function in `unstable_cache` would have
broken every test touching them. Instead: new `src/lib/ttl-cache.ts`
(`createTtlCache`), a plain in-memory `Map`-backed TTL cache with no
framework dependency - identical behavior under `next dev`/`next start`
and under `vitest`. 5-minute TTL for both fixes below: there is no live
publish/unpublish action anywhere in this app (confirmed via repo-wide
grep) - content only changes via seed scripts/migrations, i.e. while
instances are being restarted anyway, so a multi-minute staleness window
costs nothing in practice and there is no edit-trigger to hook an explicit
invalidation into.

Verified via a new `tests/unit/ttl-cache.test.ts` (the cache mechanism
itself, with `vi.useFakeTimers()` - TTL hit/expiry/per-key isolation/manual
`.clear()`), a new `tests/integration/scenario-completion.test.ts` (zero
prior coverage existed for this file at all - both the "not yet complete"
and "complete, persists General Level points" paths), plus the full
existing suite touching `getLessonCompetencyIds`'s 6 call sites
(`exercise-and-quiz-progress`, `writing-lab`, `speaking-lab`, `mission`,
`reflection`) - 16 files / 110 tests passing overall (run with
`--no-file-parallelism`; see the operational note below).

- [x] **`getChapterHskSums`** (`src/lib/scenario-completion.ts:20-39`) -
  recomputes HSK-weight sums over *every published lesson in the whole
  curriculum* on every single scenario-completion check, for every user.
  Already flagged in the code's own comment as an accepted "cheap
  enough, revisit later" tradeoff. Only changes when lessons are
  published/unpublished - a real caching candidate now that "revisit
  later" has arrived.
  - **Fix applied**: wrapped in `createTtlCache(..., 5 * 60 * 1000)`.
- [x] **`getLessonCompetencyIds`** (`src/lib/progress-evidence.ts:92-107`)
  - queried fresh on every single exercise submission
  (`exercise-progress-data.ts:57`) and quiz completion
  (`quiz-progress-data.ts:85`), 5-10+ times per lesson session, for data
  (which competencies a lesson maps to) that's authored curriculum
  metadata, not per-user or per-session.
  - **Fix applied**: the DB-touching part extracted into a
  `createTtlCache`-wrapped inner function (`getCachedLessonCompetencyIds`,
  keyed by `(lessonId, source)`); the exported `getLessonCompetencyIds`
  keeps its exact signature (including the `!lessonId → []` short-circuit,
  kept outside the cache) for all 6 existing callers.

**Operational note, unrelated to the fixes above**: running many
integration test files together with vitest's default parallelism
reliably exhausted this Prisma Postgres project's *direct* connection
(`db.prisma.io`, not `pooled.db.prisma.io` - see `.env.local`'s
`DATABASE_URL`) after enough cumulative test runs in one session - by the
end, even a plain `afterEach`'s `db.user.deleteMany` was timing out at its
10s hook default, not just individual test bodies at their 15s default.
`npx vitest run --no-file-parallelism <files>` (forces sequential file
execution) reliably resolved it every time it was tried. Two real,
lower-cost fixes worth doing later if this keeps coming up: switch
`DATABASE_URL` to the pooled endpoint, or set vitest's `poolOptions` to
cap concurrent workers.

## Tier 4 — lower priority / already-documented tradeoffs / over-fetch only

**Status: done and verified 2026-08-19** (3 of 4 applied; 1 rejected as a
false positive - see below). Verified via `tests/integration/content.test.ts`,
`writing-lab.test.ts`, `reflection.test.ts` - 23/23 passing.

These don't add extra *query count* (the main driver of "Operations"
usage) - they're either already accepted tradeoffs, low-frequency paths,
or pure payload-size over-fetches (bigger `select`/`include` than the
caller needs, but still just one query).

- [x] ~~`getLessonBySlug` (`content/lesson.ts:3-13`) includes `competencies`
  that nothing reads anywhere in `src/components/lesson/**` or the
  lesson page (verified via grep) - drop from the include.~~ **Rejected -
  false positive.** That grep only covered `src/`, not `tests/`:
  `tests/integration/content.test.ts:35` asserts
  `lesson!.competencies.length` as an explicit, documented "FASE 4
  completion criterion" (real content-modeling verification, not dead
  code) - dropping the include broke that test immediately. Left
  untouched.
- [x] `getSpeakingTranscriptForLesson` (`reflection.ts:173-195`) pulls a
  learner's entire unbounded conversation history to filter down to one
  lesson's messages - already flagged in-code as an accepted
  simplification; a `where` on `contextSnapshot` or a bounded `take`
  would cap it as history grows.
  - **Fix applied**: bounded to the most recent 200 messages
  (`take: 200, orderBy: desc`, reversed back to chronological order before
  filtering) - a JSON `where` filter was considered but rejected as
  needlessly risky for a Tier 4 item (Postgres JSON-path matching is easy
  to get subtly wrong, and this simplification's existing accepted-tradeoff
  status meant a cap was enough).
- [x] `computeExerciseCounts`/`computeVocabularyCounts`
  (`reflection.ts:82-85,126-129`) have no `select`, pulling full rows
  though only 2 fields are used each.
  - **Fix applied**: `select: {exerciseId, isCorrect}` /
  `select: {questionKey, isCorrect}` respectively.
- [x] `getWritingLessonOptions`/`getWritingTasks` (`writing-data.ts:26-54`)
  - calling `getWritingTasks()` with no `lessonId` runs a full
  `findMany` with heavy `scenarioLevel.scenario` includes just to grab
  `[0].id`. Page-load path, not per-submission. A `findFirst` with a
  minimal select would do.
  - **Fix applied**: `db.lesson.findFirst({select:{id:true}, ...})`
  directly, with `orderBy: [{scenarioLevel:{scenario:{order:"asc"}}}, {order:"asc"}]`
  - matches `getWritingLessonOptions()`'s ordering exactly (that function
  orders by lesson order in the DB query but then *re-sorts* by scenario
  order in JS, so "the first option" is scenario-order-first; a naive
  `orderBy: {order:"asc"}` alone would have picked a different lesson).
  `getWritingLessonOptions()` itself untouched - still used by the lesson
  picker UI, which needs the full list.

## Placement exam (out of this audit's original scope - added 2026-08-19)

The placement exam (`src/lib/placement-exam-data.ts` and friends) wasn't
built yet when this document's original scope was written (Learning
Journey/lessons, Reflection/Labs/Missions, Dashboard/Progress/Review) -
audited separately, later the same day, after the user asked for a real
measured cost of the exam to weigh reducing/cutting its 211-question item
bank.

**Real measured cost** (`scripts/measure-placement-exam-operations.test.ts`,
run via the real server actions with `auth()` mocked - see that file's
header for why a first version measuring the lower-level functions
directly gave a meaningfully wrong number): **1,412 operations** for one
full WRITTEN attempt (Vocabulary/Grammar/Reading/Listening) that answers
everything correctly and climbs all four skills to HSK 7 - 147 questions
total (44/72/7/7 by skill, the 7s each answered as grouped Reading/
Listening blocks). Deliberately the *upper bound*: a learner who misses
questions or plateaus earlier sees fewer questions and a lower cost. For
scale, one full lesson session measured ~500 operations
(`scripts/measure-lesson-operations.test.ts`) - the exam's worst case
costs about 3 lesson-sessions' worth, but unlike a lesson it's a one-time
per-learner cost, not a recurring one.

**Speaking is separate and NOT included in that number at all.** It
requires a real live voice conversation (`HanVoiceConversation`, OpenAI's
Realtime API) that cannot be scripted/measured this way, and its cost is
dominated by realtime-voice-API minutes, not Prisma "Operations" - a
different budget entirely. Structurally: passing a level climbs to the
next one (3→4→5→6→7), each round capped at `maxSessionMs: 4 minutes` of
live audio plus one `gradePlacementSpeakingAction` text-completion call -
worst case (passes every level) is 5 rounds, up to ~20 minutes of
realtime audio plus 5 grading calls, for one exam. Code reviewed
(`src/components/placement/placement-speaking-exam.tsx`,
`src/lib/placement-speaking.ts`, `src/lib/actions/placement-exam.ts`'s
`gradePlacementSpeakingAction`) - no bugs found, input sanitization and
level-progression logic both correct; existing `tests/unit/placement-speaking.test.ts`
(6 tests) covers the pure logic (start-level selection, next-level
climbing, the deterministic score formula, prompt construction, response
parsing).

- [x] **`loadQuestionMetas`/`loadCategoriesBySkillAndLevel`
  (`placement-exam-data.ts`) re-fetch the entire ~211-question item bank
  on *every single question served*** (once per `getNextQuestion` call,
  i.e. once per answer submitted) - for data that cannot change mid-exam.
  Surfaced directly by the operations measurement above: ~294 of the
  1,412-operation total (~21%) was these two functions alone, called 147
  times each. Exactly Tier 3's caching pattern (project/db-operations-optimization.md),
  just in a file that tier's audit never covered.
  - **Fix applied**: both wrapped in `createTtlCache(..., 5 * 60 * 1000)`
  (`src/lib/ttl-cache.ts`, the same Tier 3 utility - no live
  question-authoring UI exists here either, so the same "content only
  changes via seed scripts/migrations" reasoning applies). Verified via
  `tests/integration/placement-exam.test.ts` (the full real-database exam
  run, ~500s).
  - **Confirmed with a real before/after re-measurement** (same 147-question
  upper-bound run, same script): 1,412 → **914 operations, a 35.3%
  reduction** - larger than the ~21% estimate above, most likely because
  these two functions are called from more places in the adaptive flow
  than the single `getNextQuestion`-per-answer count this estimate was
  based on.

## Explicitly checked, no issues found

Per-agent confirmation, so this doesn't get re-audited later: `points-
system.ts`, `competency-progress.ts`, `speaking-help.ts`, `speaking-
session-timing.ts`, `mission-evaluation.ts`, `mission-prompt.ts`, the
mission/speaking/writing action-layer files, `general-level.ts`, `lab-
points.ts`, `progress-evidence.ts`'s other functions - all pure,
already correctly threaded, or bounded with no N+1 loops. No polling or
client-side repeated re-fetching found in any audited component. No
N+1 *write* loops found anywhere audited (every attempt/answer write is
correctly one-per-user-action; `submitQuizAnswer`'s upsert is a single
row).

## Suggested order of attack, once Prisma access is restored

1. Tier 1's `learnerProfile` fix and the dead `getScenarioMastery` call
   on Dashboard - highest volume (every page/every Dashboard load),
   lowest risk (one is outright dead code).
2. Rest of Tier 1 (streak, `learnerLessonCompletion` dedup, review-queue
   cooldown query).
3. Tier 2, same "thread a hint parameter through" pattern throughout.
4. Tier 3's caching, deliberately, with its own test coverage for
   invalidation behavior (what happens when a lesson gets edited/
   unpublished after the cache is warm).
5. Tier 4 opportunistically - lowest urgency.

After each tier: re-run the relevant integration tests, and for
Dashboard/Progress specifically, manually load the page and confirm the
UI still shows the same data (some of these fixes remove calls whose
*output* is still used, just previously re-derived - verify nothing
silently goes null).
