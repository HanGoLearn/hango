# Learning Journey — optimization audit (2026-08-19)

> Triggered by: user noticed clicking into a Learning Journey session feels
> slow to load, and asked for a substantial audit of Vocabulary/Grammar/etc,
> organized by facet, looking for both perceived-speed and operations-cost
> wins.
>
> **Facets A, B, C implemented and verified same day (2026-08-19)** - see
> each facet's own "Implemented" note below for what changed and how it was
> checked. Facets E, F, G remain audit-only (F confirmed NOT to affect the
> Learning Journey itself - see the chat record - deferred, scoped to
> Writing/Speaking Lab instead).

## Facet A — Missing indexes on `lessonId` (biggest, broadest finding)

`getLessonWithContent` (`src/lib/content/lesson-data.ts`) is the single
function every lesson page load calls. It runs 6 queries in parallel
(`Promise.all`, already correct - no waterfall there), each filtered by
`lessonId`:

| Query | Table | `lessonId` indexed? |
|---|---|---|
| `getDialoguesForLesson` | `Dialogue` | **No** |
| `getVocabularyForLesson` | `LessonVocabulary` | Yes (composite `@@id`) |
| `getGrammarForLesson` | `LessonGrammarPoint` | Yes (composite `@@id`) |
| `getExercisesForLesson` | `Exercise` | **No** |
| `getQuizzesForLesson` | `Quiz` | **No** |
| `getMissionForLesson` | `Mission` | **No** |
| `getLessonBySlug`'s `learningObjectives` include | `LearningObjective` | **No** |

Checked directly against `prisma/schema.prisma`'s `@@index`/`@@id`/`@@unique`
declarations (grepped every one in the file) - `Dialogue`, `Exercise`,
`Quiz`, `Mission`, and `LearningObjective` all declare `lessonId` as a plain
relation field with no supporting index. PostgreSQL does **not**
auto-index foreign key columns (unlike some other databases) - Prisma only
indexes what `@@index`/`@@id`/`@@unique` explicitly says. So 5 of the 7
queries that run on **every single lesson load** are sequential-scanning
their whole table, filtered only after every row is read.

Not urgent at today's content scale (a few hundred rows per table at
most), but:
- It's a zero-risk, zero-behavior-change fix (adding an index changes
  nothing observable except making the query faster).
- It compounds as content grows (this app is explicitly building out a
  full HSK1-9 curriculum).
- Unindexed FKs on tables with `onDelete: Cascade` (all of these have it)
  also make cascading deletes slower, not just reads.

**Fix**: one migration adding `@@index([lessonId])` to `Dialogue`,
`Exercise`, `Quiz`, `Mission`, `LearningObjective` (`Mission` also has a
`scenarioId` FK with the same gap, used by `getMissionForScenario`).

**Implemented**: migration `20260820010443_add_missing_lesson_fk_indexes`,
applied to the real database. Also added `Exercise.grammarPointId` (found
while implementing Facet B - `getExercisesForGrammarPoint` had the exact
same gap) and `LearningObjective.scenarioId` (same dual-nullable-FK shape
as `Mission`, for consistency). 8 `CREATE INDEX` statements total, nothing
destructive - `npx prisma migrate dev` output confirmed. Also fixed two
stale schema doc comments found along the way (`VocabularyExample` and
`Exercise.grammarPointId` both still said "AI-generated" - the 2026-08-14
removal of that live fallback was never reflected there, which is
exactly the kind of stale comment that caused Facet C's first-pass mistake
below).

## Facet B — Grammar step: N unnecessary client round-trips per lesson

`GrammarStep` (`grammar-step.tsx`) renders **every** grammar point in the
lesson at once (unlike Vocabulary's one-word-at-a-time flow), and each
`GrammarPointCard` independently fires `getGrammarExercisesAction(id)` in
its own `useEffect` on mount. A lesson with 3 grammar points fires 3
parallel server-action round-trips the instant the Grammar step renders,
each showing its own "Loading practice questions..." spinner.

This is real, avoidable latency: `getExercisesForGrammarPoint`
(`src/lib/content/exercise.ts`) is a plain `db.exercise.findMany` - no AI
generation, no per-learner variation, same static content for everyone
(confirmed by reading `grammar-interactivity.ts`: grammar examples and
exercises are both hand-authored, unlike Vocabulary's AI-generated
examples). There's no reason this needs a separate client fetch - it could
be eager-loaded server-side in `getGrammarForLesson`
(`src/lib/content/grammar.ts`), exactly the same way `examples` already is,
via one more `Promise.all` branch. That removes N round-trips and N loading
spinners per lesson, replacing them with zero extra latency (already
inside the one parallel fetch `getLessonWithContent` does).

**Implemented**: `getGrammarForLesson` (`content/grammar.ts`) now includes
`exercises` (filtered `PUBLISHED`, with `options`/`hints`) alongside
`examples`. `lesson-data.ts`'s `getLessonWithContent` sanitizes them via
`toClientExercise` (same as every other exercise/quiz question - grading
data never reaches the client). `grammar-step.tsx`'s `GrammarPointCard`
dropped its `useEffect`/`getGrammarExercisesAction` call entirely, reads
`grammarPoint.exercises` directly - no more loading state for Practice.

## Facet C — Vocabulary step: CORRECTION - the lazy per-word fetch is now pure overhead, not a necessary trade-off

**This reverses what this document originally said here.** The first pass
assumed Vocabulary's lazy per-word example fetch (`getVocabularyExamplesAction`,
fired on arrival at each word) earns its keep by avoiding AI-generation
cost for words never reached - true once, but stale: `vocabulary-interactivity.ts`'s
own doc comment says examples' live AI fallback was **removed 2026-08-14**
("every word in the app is expected to be pre-authored"). Confirmed by
reading the function - `getVocabularyExamples` today is a plain
`db.vocabularyItem.findUnique({ include: { examples } })`, exactly as static
as Grammar's examples (which already load eagerly, no separate fetch at
all - see `grammar-step.tsx`'s comment: "Already loaded server-side... no
client fetch needed"). The AI-avoidance justification for keeping
Vocabulary's fetch lazy no longer applies - **every word transition pays an
unnecessary network round-trip for data that could ride along in the one
parallel fetch `getLessonWithContent` already does**, the same way Grammar's
does. The UI's own "Generating — only happens the first time..." copy is
now inaccurate too (nothing generates anymore).

**One real constraint, not a reason to keep the current design**:
`getVocabularyExamples` also calls `recordVocabularyInteraction` (upserts
`LearnerVocabularyInteraction`, a per-user-per-word "seen this word at least
once" signal) as a side effect. That part **does** need to fire exactly
when the learner actually reaches each word, not all at once at lesson
load (eager-loading all 8 words' content at once would wrongly mark words
5-8 as "interacted with" even if the learner abandons the lesson at word 3).
The fix is to split the two concerns that are currently bundled into one
call, not to keep the whole thing lazy:
- Move `examples` into `getVocabularyForLesson`'s `include` (eager,
  server-side, same as Grammar) - removes the fetch and the spinner
  entirely.
- Keep a `useEffect` on word-change, but have it call a new, much smaller
  action that *only* does the `recordVocabularyInteraction` upsert - no
  content in the request/response at all.

Net effect: same 1 write per word-view as today (the upsert), but the
*read* moves from "1 network round-trip per word, blocking render" to "0
extra round-trips, already included in the single upfront fetch." Real
speed win (no more per-word wait) and a real operations win (the read
half of today's per-word cost disappears, not just moves).

**Implemented**: `getVocabularyForLesson` (`content/vocabulary.ts`) now
includes `examples` on `vocabularyItem`. New `recordVocabularyWordSeen`
(`vocabulary-interactivity.ts`) does only the `recordVocabularyInteraction`
upsert - no content read. New `recordVocabularyWordSeenAction` (fire-and-
forget, same pattern as `recordVocabularyQuizAttemptAction`).
`vocabulary-step.tsx` reads `currentItem.examples` directly, its
`useEffect` now only calls the lightweight action (guarded by a `useRef`
set so navigating back to an already-seen word in the same session doesn't
re-fire it). Removed the "Generating..." loading state and error state
entirely - nothing to wait on or fail anymore. `getVocabularyExamples`/
`getVocabularyExamplesAction` were left in place, untouched, still tested
(`tests/integration/vocabulary-interactivity.test.ts`) - not deleted since
they're a reasonable general-purpose "fetch a word's examples" API that
other features could still want, even though the Vocabulary Step itself no
longer calls them.

## Fourth pass (user question: "does the green/red feedback need a round-trip?") - batched quiz-attempt writes

User noticed the Vocabulary Step's per-question green/red reveal and asked
whether it needed to happen "one question at a time" server-side, or could
be batched. Checked `vocabulary-quiz.ts`: correctness is computed entirely
client-side (`buildVocabularyQuizOptions`/`buildFillBlankQuestion`/
`buildSentenceOrderQuestion` all return `isCorrect` directly, no AI, no
server validation - by design, since these are self-quiz checks, not
graded assessments) - so the instant visual feedback was never coupled to
the server write in the first place. That write
(`recordVocabularyQuizAttempt`, one `create` per question, fire-and-
forget) existed purely for scoring history, and fired 4-6 times per word
(`vocabularyQuestionsPerWord()` - Beginner 4, Intermediate 5, Advanced 6) -
the single highest-frequency write in the whole lesson flow (8 words ×
5 questions = 40 individual writes, just for this one step).

**Implemented**: batched. `recordVocabularyQuizAttempts` (plural,
`vocabulary-interactivity.ts`) takes an array and writes it with one
`createMany`. `vocabulary-step.tsx`'s `handleAnswer` no longer calls the
server at all - it only pushes onto a `pendingAttemptsRef` buffer (the
green/red reveal still comes from `answeredByQuestion` local state,
unchanged, still instant). The buffer flushes as one batched call whenever
the learner leaves the current word - forward, back (both go through
`goTo`, which flushes first), or finishing the step on the last word
(explicit flush before `onContinue()`) - plus a component-unmount safety
net for SPA-internal navigation away from the step. Net: 8 words × 5
questions goes from 40 real writes to 8. The old singular
`recordVocabularyQuizAttempt`/`recordVocabularyQuizAttemptAction` had no
other callers once the Vocabulary Step stopped using them, so they were
deleted rather than left dead (`getVocabularyExamples` above was kept
instead, for comparison, because it's a plausible standalone API - a
"record one quiz answer" function isn't).

**Accepted trade-off, confirmed with the user before implementing**:
answers for the *current* word are only in memory until flushed - closing
the tab or losing connection mid-word (answered 2 of 5 questions, never
clicked Next/Back) loses those unflushed rows, where today they'd already
be saved individually as answered. Bounded to at most one word's worth,
same shape as the placement exam's block-submission trade-off from
earlier today. No visible difference in normal use either way - the write
was already fire-and-forget/invisible before this change, so moving *when*
it fires (per-question -> per-word) has no user-visible effect except in
that one abandonment edge case.

**Verified**: `tsc --noEmit` and `eslint` clean on every touched file
(`vocabulary-interactivity.ts`, `actions/vocabulary-interactivity.ts`,
`vocabulary-step.tsx`, `scripts/measure-lesson-operations.test.ts` -
updated to call the batched function too, matching real behavior, same
reasoning as every other measurement-script update this session). No
existing test referenced the deleted singular functions by name (grepped
`tests/`), so nothing needed updating there; `tests/integration/
vocabulary-interactivity.test.ts` + `content.test.ts` re-run clean.

## Facet E — Exercise/Quiz answer submission: correct but worth knowing the real per-answer cost

Traced `recordExerciseAttempt` (`exercise-progress-data.ts`) and
`submitQuizAnswer`/`completeQuizAttempt` (`quiz-progress-data.ts`) - the
functions that run on literally every exercise/quiz question a learner
answers (Comprehension, Guided Practice, Grammar's practice section, Quiz
step - the highest-*volume* interaction in a lesson, easily 10-20+ calls
per session).

- `recordExerciseAttempt`: validates the answer server-side (re-fetches
  the exercise - correct, required, never trust a client-supplied
  correctness), counts previous attempts for numbering, creates the
  attempt row, **unconditionally deletes any cached
  `LessonReflectionReport`** for this lesson, then (if graded) looks up
  competencies (already TTL-cached, Tier 3) and writes evidence. The
  reflection-report delete runs on *every single exercise answered in the
  whole lesson*, even though a report can't possibly exist yet until the
  learner has already reached and generated one at the Reflection step
  (the last step) - so for most exercises in most lessons, this is a
  guaranteed no-op delete that still costs one real operation. Small
  per-call, but multiplies by every exercise in every lesson, every
  learner.
- `submitQuizAnswer`: re-verifies attempt ownership (`assertOwnedAttempt`,
  a `findUniqueOrThrow`) on **every question**, not once per quiz - correct
  behavior (never trust a client-supplied attempt id), but means a 5-question
  quiz pays this check 5 separate times instead of once per quiz-taking
  session. Same trade-off as Facet A's queries: legitimate security
  practice, real repeated cost, not a bug to "fix" carelessly (weakening
  the ownership check for speed would be a real regression, not an
  optimization).

Neither is wrong to keep as-is without a specific reason - flagging both
because the user asked for maximum thoroughness on cost, not just
"cargar rápido." The reflection-delete is the more clearly worth doing
(cheap, safe: skip the delete unless a report row could plausibly exist,
e.g. only bother once the learner has reached the Reflection step at least
once this lesson - or just accept it as noise, since Prisma's own
operation counter is dominated by far bigger contributors elsewhere in
this same audit).

## Facet F — Lab points recompute: full rescan of up to 300 rows on every Writing/Speaking submission

`recomputeGeneralLevelPoints` (`general-level.ts`) runs after **every**
Writing Lab submission (`submitWritingAttempt`, `submitCustomWriting`) and
(by the same pattern) Speaking Lab completions. It calls `computeLabPoints`
(`lab-points.ts`), which on every single call:
- Fetches up to **150** `WritingAttempt` rows (`ROLLING_WINDOW_RAW_LIMIT`)
  for this user, full history, re-scored and re-deduped in JS every time.
- Fetches up to **150** `SpeakingSession` rows, each with its own nested
  "latest attempt" sub-query, same full-history re-scan.

This isn't cached at all (no `React.cache`/TTL wrapper, unlike almost
everything else touched in this session's earlier Tier 1-3 work) - a
learner with a long Writing/Speaking Lab history pays a ~300-row combined
re-scan **on every new submission**, to recompute a rolling points total
that only actually changed by one new data point. Flagging it because the
user asked to audit "costos" broadly, not just the lesson-loading path.

> **Correction (2026-08-21)**: the "single most expensive individual
> operation in this whole audit" framing below was wrong, and this note
> says so plainly rather than leaving it uncorrected. Measured empirically
> (query-log diagnostic, same technique the Grammar/Vocabulary/Learning
> Journey passes below eventually all used) with 5 real WritingAttempt +
> 5 real SpeakingSession/SpeakingAttempt rows for a throwaway user:
> `computeLabPoints` is exactly **3** real statements (`WritingAttempt`
> `findMany`, `SpeakingSession` `findMany`, `SpeakingAttempt` `findMany`
> with `sessionId IN (...)` - the nested `attempts: { take: 1 }` batches
> fine, it is NOT a per-session N+1). Plus
> `recomputeGeneralLevelPoints`'s own `scenarioCompletion.aggregate` +
> `learnerProfile.update` = **~5 operations total per submission**,
> regardless of whether the user has 5 or 150 rows of history - the
> `take: 150` caps row count, not query count, and Prisma Postgres bills
> per query, not per row (confirmed later this same investigation, the
> "Seventh pass" section below - this Facet F note predates that
> confirmation, which is exactly why it under-appreciated the difference
> between "many rows scanned" and "many operations billed"). ~5 ops is
> cheap - cheaper than Vocabulary (~39) or pre-fix Comprehension (~40).
> This is a real *row-count / JS-processing latency* consideration for a
> learner with a very long history, not an *operations-budget* one - not
> urgent at this app's current activity level. Not fixed; re-open only if
> it starts showing up as real submit-latency for an active user, not on
> operations-cost grounds.
>
> **Follow-up (2026-08-21, same day)**: user asked "como podriamos
> optimizarlo como un profesional" once the algorithm itself was
> explained (`computeLabSkillPoints`, points-system.ts - all 4 factors
> are mathematically reducible to running aggregates: `Σscore`,
> `Σscore²`, distinct count, and a week→count map, since
> `dedupeLabEvidence` replaces-not-adds on resubmission). Two real options
> were weighed honestly rather than jumping straight to a rebuild:
> (A) shrink `ROLLING_WINDOW_RAW_LIMIT` - a plain constant tune, no
> behavior change beyond less row volume; (B) a persisted incremental
> summary (new schema, correct subtract-on-replace handling, a backfill
> migration for existing users) - real engineering effort with no
> confirmed bottleneck driving it. Recommended (A) now, (B) only if a real
> latency complaint ever materializes - premature optimization for a
> hypothetical scale problem this app doesn't have yet. User chose A.
> `ROLLING_WINDOW_RAW_LIMIT` (`lab-points.ts`) cut from 150 to 90 - still
> a comfortable 1.5x buffer over the real 60-distinct-attempt full-weight
> threshold (`computeLabFactorVolumen`), ~40% less row volume fetched and
> JS-processed per submission. **Verified**: `tsc --noEmit`/`eslint`
> clean; no test hardcodes the old constant or exercises anywhere near
> 90+ attempts (checked before changing it, not assumed) - full
> `writing-lab.test.ts` + `speaking-lab.test.ts` + `points-system.test.ts`
> re-run clean, **71/71** passing.

## Facet G — "Se demora en cargar" needs one more variable isolated: dev server compile time

Everything measured live this session so far has gone through `npm run dev`
(Turbopack dev server), which JIT-compiles each route/component tree the
*first* time it's requested in a given server process - visible directly in
tonight's own logs (e.g. `GET /placement-exam 200 in 11.7s (next.js: 4.7s,
application-code: 7.0s)` on a cold first hit). That compile overhead is a
dev-only cost; it doesn't exist in a production build (`next build && next
start`), where every route is pre-compiled.

Before concluding the lesson page itself needs more code changes for perceived
speed, it's worth separating these two things - the code path itself
(`page.tsx` → `getLessonWithContent`) already parallelizes its 6 queries
correctly and has no client-side extra fetch before `LessonEngine` renders
(everything needed for the first step arrives as props from the server).
Facet A's missing indexes are the one concrete, real fix on this exact path
regardless of dev/prod; if the "feels slow" impression persists after that
fix under `next dev`, testing once under a production build would confirm
whether the rest is compile overhead rather than real query cost.

## Second pass coverage (after user pushed back on "is that really everything?")

Round 1 covered the shared lesson-load path plus Vocabulary/Grammar only.
Round 2 added: Exercise/Quiz answer submission (Facet E, the highest-volume
interaction in any lesson), Writing/Speaking Lab's points recompute
(Facet F, the single most expensive individual operation found in this
whole audit), and the Facet C correction. Reflection was re-checked and
confirmed already-optimal (Tier 2, earlier this session) and structurally
can't be eager-loaded (its data doesn't exist until the learner has done
the rest of the lesson).

**Still not traced query-by-query**: Situation, Dialogue, Comprehension,
Guided Practice, Speaking, and Writing *step* components themselves
(spot-checked via `grep` for `useEffect`/action imports - none of them
fetch anything beyond their server-provided props, so no Grammar-style
N-round-trip pattern exists there, but they weren't read line-by-line the
way Vocabulary/Grammar/Exercise/Quiz/Lab-points were). The Learning
Journey overview and Scenario Detail pages (entry points *before* clicking
into a lesson) were spot-checked, not deeply audited - they sit on top of
`learning-journey-data.ts`/`dashboard-data.ts`, which already went through
Tier 1/3 caching earlier this session.

## Third pass (user asked "what else, before measuring") - Facet H found and fixed

Went back and actually read, line-by-line rather than grep-spot-checked,
every remaining lesson step component (`situation-step.tsx`,
`dialogue-lines.tsx`/`ConversationPlayer` - specifically re-checked for
the same "reused component instance, stale audio" bug class found and
fixed in the placement exam earlier today, confirmed **not** present here:
every per-line audio ref is keyed by `lineId` in a `Record`, and
`ConversationPlayer` instances are naturally scoped one-per-dialogue via
the parent `.map()`'s `key` - `comprehension-step.tsx`, `exercise-sequence.tsx`,
`guided-practice-step.tsx`, `quiz-step.tsx`/`QuizRunner`), plus the
Learning Journey overview page and Scenario Detail's data function
(`getScenarioBySlug`, `getScenariosWithProgress`, `getContinueLearningTarget`).

**Found**: `getScenarioDetailWithProgress` (`learning-journey-data.ts`,
powers the Scenario Detail page - the entry point immediately before
clicking into a lesson) fetched the learner's **entire lifetime**
`LearnerLessonCompletion` history across every scenario they've ever
touched, unscoped - right next to a `lessonReflectionReport` query that
*was* correctly scoped to `lessonId: { in: allLessonIds } }`. The
completion ids are only ever checked against this one scenario's lessons
(`completedIds.has(lesson.id)` where `lesson` comes from this scenario's
own levels), so every row from every *other* scenario was fetched and then
guaranteed never to match anything - pure waste that grows with how much
of the app a learner has completed over their lifetime, same shape as
Facet F's Lab-points problem but on the core Learning Journey path this
time, not a side feature.

**Fixed**: added the same `lessonId: { in: allLessonIds } }` scoping the
sibling query already had. Zero behavior change (the set of matching ids
is identical - only irrelevant rows stop being fetched), so no test
update needed; no dedicated test exists for this function specifically to
re-run, verified by inspection plus `tsc`/`eslint` clean.

**Everything else in this third pass came back clean** - no further
findings. Combined with the first two passes, this audit has now traced,
line-by-line, every lesson step component, every entry-point page before
a lesson (Learning Journey overview, Scenario Detail), the shared content-
loading path, and the highest-volume submission paths (exercises, quiz
answers). What's left un-fixed is deliberately deferred (Facets E/F/G,
see their own sections) rather than unexamined.

## Suggested priority

1. **Facet A (indexes)** - zero risk, zero behavior change, helps every
   facet and every future feature that queries by `lessonId`/`scenarioId`.
   Cheapest, safest place to start.
2. **Facet C (Vocabulary eager-load + split interaction-tracking)** - now
   that the AI-avoidance reason is gone, this is a real speed *and*
   operations win with no trade-off, same shape as Facet B.
3. **Facet B (Grammar eager-load)** - small, contained change, removes a
   real per-lesson latency/spinner with no cost trade-off (content is
   already static/cheap).
4. **Facet F (Lab points caching)** - **correction, 2026-08-21: this was
   mischaracterized when written.** Empirically measured at ~5 real
   operations per submission regardless of history size, not the
   "biggest single-operation cost" this note originally claimed - see the
   correction block under Facet F itself above. Not an operations-budget
   problem; leave as-is unless it becomes a real latency complaint from an
   active user.
5. **Facet E (exercise/quiz submission)** - smallest, most debatable value
   (the reflection-delete skip is cheap but low-impact; the ownership
   re-check shouldn't be touched for speed at the cost of security).

## Verification (Facets A/B/C, 2026-08-19)

- `npx tsc --noEmit` and `npx eslint` clean on every touched file (schema,
  `content/vocabulary.ts`, `content/grammar.ts`, `content/lesson-data.ts`,
  `vocabulary-interactivity.ts`, `actions/vocabulary-interactivity.ts`,
  `vocabulary-step.tsx`, `grammar-step.tsx`).
- Migration applied to the real database (`prisma migrate dev`, exit 0).
- Existing test suites re-run against the real database, no changes needed
  to any of them (confirms nothing observable broke): `tests/integration/
  content.test.ts`, `vocabulary-interactivity.test.ts`,
  `grammar-interactivity.test.ts`, `lesson-progress.test.ts`,
  `tests/unit/lesson-progress.test.ts`, `vocabulary-quiz.test.ts` -
  **59/59 passing**.
- `scripts/measure-lesson-operations.test.ts` updated to match the new
  Vocabulary/Grammar Step behavior (it was independently calling
  `getVocabularyExamples`/`getGrammarExamples`/`getGrammarExercises` per
  item, simulating the *old* per-item fetches that no longer happen in the
  real UI - would have overcounted a fresh measurement otherwise). Not yet
  re-run - it costs 2 real paid AI-provider calls (Reflection's scoring),
  same warning as always; needs the user's go-ahead and a fresh Prisma
  Console Operations count, same pattern as every other measurement this
  session.
- **Not yet done**: a live browser click-through (dev server is running,
  same instance from earlier this session) - haven't personally clicked
  through a lesson's Vocabulary/Grammar steps since these changes landed.

## Fifth pass (user asked to confirm Grammar/Situation/Comprehension/Speaking/Reflection had nothing left) - found a real bug, not just a cost issue

Asked to re-verify rather than take the earlier audit's word for it (given
the Facet C correction earlier). Re-checked the shared `advanceLessonStep`
(`lesson-progress-data.ts`, the write behind every single step's
"Continue" button, including Situation/Comprehension's) - confirmed
genuinely minimal already (one necessary read-modify-write, the read
can't be hinted away since nothing else in the same request already has
that session's `responses` blob). Then read `ai-teacher-data.ts` in full
for the first time this session (it wasn't touched in any earlier tier) -
this is what Speaking's `HanVoiceConversation` writes through
(`saveRealtimeConversationTurn`), and it's also what every "Ask AI"
button anywhere in the app goes through.

**Found, in order, by following the user's questions rather than the
audit's own momentum:**
1. Redundant per-turn reads (`learnerProfile.aiConversationStorageEnabled`,
   `aiConversation` lookup) - the original, smaller finding.
2. User pointed out the chat "resets every time you open it" - traced this
   to `openTeacher` (`ai-teacher-provider.tsx`) calling
   `resetConversation()` on every open, which did
   `db.aiConversation.deleteMany({ where: { userId } })` - **the entire
   conversation, unconditionally**.
3. Cross-referenced with `reflection.ts`'s `getSpeakingTranscriptForLesson`,
   which reconstructs a lesson's Speaking score from that *same*
   `AiConversation` thread (there's no per-lesson conversation table -
   `AiConversation.userId` is `@unique`, one thread per user, forever).
4. **Real bug, not a cost issue**: since `AskAiButton` (used everywhere -
   Vocabulary, Grammar, Dialogue, every lesson step) also calls
   `openTeacher`, clicking *any* "Ask AI" button anywhere in the app after
   doing Speaking practice - even in a completely unrelated lesson, even
   much later - silently deleted that Speaking transcript before
   Reflection could ever read it. No error, no warning - the Speaking
   score would just come back null/wrong.

**User's design constraint once this was found**: still wants the text
chat to reset on open (doesn't want cross-session chat history hanging
around) - just not at the cost of deleting Speaking evidence. This ruled
out the simpler "stop resetting entirely" fix in favor of a *selective*
one.

**Implemented** (`ai-teacher-data.ts`, `app-shell.tsx`,
`ai-teacher-provider.tsx`):
- `isSpeakingMessage()` - a message counts as Speaking practice if its
  stored `contextSnapshot.rolePlay` is truthy (same signal
  `getSpeakingTranscriptForLesson` already keyed off, reused rather than
  adding a schema column).
- `resetConversation` rewritten: deletes only non-Speaking `AiMessage`
  rows, never the `AiConversation` row itself. Text chat still "starts
  fresh" every time it's opened (unchanged from the user's perspective);
  Speaking transcripts now survive indefinitely, exactly as
  `getSpeakingTranscriptForLesson` always assumed they would.
- `getConversationHistory` also excludes Speaking messages now (so a
  role-play exchange can't leak into the text chat's own display or the
  context Han sees for an unrelated question), and `HISTORY_LIMIT` dropped
  20 -> 10 (user request, now that cross-session bleed is no longer a
  concern the same way).
- `AppShell` no longer calls `getConversationHistory` at all - since the
  chat always starts visually empty anyway (`openTeacher` resets it on
  every open), preloading old history to immediately discard it was pure
  waste, not something worth caching. `AiTeacherProvider.initialMessages`
  now defaults to `[]`.
- Redundant per-turn reads (finding #1) fixed with the same
  `createTtlCache` pattern as the rest of this audit -
  `getCachedConversationStorageEnabled`, `getCachedConversation`.
- **Deliberately not done**: an explicit "clear history" settings button
  (considered, user declined - redundant with reset-on-open already
  covering the "don't let this accumulate" goal).

**Verified**: `tsc --noEmit` and `eslint` clean on every touched file. Two
new integration tests added (`tests/integration/ai-teacher.test.ts`)
proving the fix directly: a Speaking-tagged message survives
`resetConversation` while a plain chat message in the same conversation
doesn't, and `getConversationHistory` excludes Speaking messages from what
it returns. Existing test suite re-run against the real database
(including `resetConversation clears stored history`, which still passes
unchanged since it never used Speaking-tagged messages). No schema
migration needed - implemented entirely from the existing
`contextSnapshot` JSON field already being written.

## Operational incident (2026-08-19, same day): a debugging action corrupted the live dev server

While chasing an intermittent vitest resolution error, `TaskStop` was
called on the running `next dev` process to test whether it was causing
file contention. The process didn't die cleanly - it kept running but hit
`write EPIPE` -> repeated `Jest worker encountered 2 child process
exceptions, exceeding retry limit`, permanently unable to compile
`/lesson/[slug]`/`/learning-journey/[slug]` from that point on. A shallow
health check (`curl /dashboard`, got a 307) missed this entirely, since
that route doesn't need the broken worker pool. The user then hit this
broken server live - reported as "Vocabulary audio never loads," "Grammar
never loads, errors," and "lost my Vocabulary progress." **None of these
were real bugs** - confirmed by force-killing the zombied process
(`Stop-Process -Force`, not `TaskStop`), clearing the now-corrupted
`.next/dev/types/routes.d.ts` (a partial write from the crash - build
output, safe to delete), and restarting clean.

**Lesson for future sessions**: stopping a `next dev` task via the
background-task tool does not reliably kill the underlying Turbopack
process tree on this setup - it can leave a zombie that looks alive
(responds to simple requests) but has a broken compilation worker pool.
If a dev server needs to be stopped mid-session, force-kill by PID
(`Stop-Process -Id <pid> -Force`, confirm with a follow-up `Get-Process`)
and verify with a request to an actual dynamic route the user will use
(not just any 200/307), not just `TaskStop`.

## Sixth pass (user: "the Grammar submit flow doesn't look good, audio still doesn't work, and I do have $0.00 in OpenAI")

Investigated all three against the *clean, restarted* server's logs.

- **Audio**: no quota/billing/429/401 error appeared in either the bash
  task output or `.next/dev/logs/next-development.log` for the whole
  session - inconclusive on the $0.00 theory specifically. But
  `audio-play-button.tsx`'s `state === "error"` was never distinctly
  rendered (falls through to the same Play icon as "never clicked" - the
  same category of finding as the placement exam's silent-failure bug
  fixed earlier today, just never applied here). **Fixed**: the button
  now shows a red `AlertCircle` icon, an `aria-label`/`title` with the
  real error message when the server action returned one, and stays
  clickable to retry. This doesn't diagnose whether it's really the
  OpenAI balance, but the next failure will show a real reason instead of
  looking identical to doing nothing.
- **Vocabulary hydration mismatch** (found while investigating, not
  something the user reported this round): `vocabulary-quiz.ts`'s
  `build*Question` functions defaulted to `Math.random()`, called inside
  a `useMemo` in `vocabulary-step.tsx` - since that runs both during SSR
  and again during client hydration with an unseeded PRNG, the shuffled
  option order differed between the two, and React discarded/regenerated
  the whole Vocabulary Step tree every time (visible repeatedly in dev
  logs). **Fixed**: new `seededRandom(seed)` (deterministic hash + PRNG,
  `vocabulary-quiz.ts`), seeded per word+question-type
  (`${currentItemId}:${field}` etc.) so server and client compute the
  identical shuffle. 4 new unit tests
  (`tests/unit/vocabulary-quiz.test.ts`) - determinism, seed-sensitivity,
  `[0,1)` range, and an end-to-end check through
  `buildVocabularyQuizOptions`. **27/27 passing.**
- **Grammar practice redesign** ("el grande con el cambio de
  experiencia" - explicitly chosen over the smaller no-UX-change option):
  every exercise across every grammar point on the page now shows at
  once, answered locally with no per-exercise Submit/Next round trip: one
  "Check answers" button at the bottom of the whole Grammar step grades
  everything in a single batched call, then the same spot becomes
  "Continue." Implementation:
  - `ExerciseItem` (`exercise-item.tsx`) gained an opt-in **controlled
    mode** (`hideControls`/`externalResult`/`onAnswerChange`, all
    optional) - hides its own Submit/Next/Retry buttons and reports
    answer changes to a parent instead of self-managing `result`. Every
    existing call site (Comprehension, Guided Practice, Quiz) leaves
    these unset and is byte-for-byte unaffected - traced through every
    changed line to confirm the `hideControls=false` path is identical to
    before.
  - New `recordExerciseAttempts` (`exercise-progress-data.ts`) - same
    server-side grading as `recordExerciseAttempt` (never trusts a
    client-supplied correctness), but batches the fixed per-exercise
    overhead: one `findMany` for all exercises instead of N
    `findUniqueOrThrow`, one `findMany` for previous-attempt counts
    instead of N `count`s, one `deleteMany` for reflection invalidation
    covering every distinct lesson in the batch instead of N, one
    `createMany` for all progress evidence instead of N. Attempt
    *creation* still runs one `create` per exercise inside a
    `$transaction` (not a single `createMany`) since `createMany` doesn't
    return generated ids and `ProgressEvidence.relatedActivityId` needs a
    real one per attempt - no `cuid` package available as a direct
    dependency to pre-generate them safely.
  - New `submitExerciseAttemptsAction` (`actions/exercise-progress.ts`),
    returns results keyed by `exerciseId`.
  - `grammar-step.tsx` rewritten: `GrammarStep` lifts answer/result state
    for the whole page, `GrammarPointCard` renders each exercise via
    `ExerciseItem` in controlled mode.
  - **Verified**: `tsc --noEmit`/`eslint` clean on every touched file. 4
    new integration tests
    (`tests/integration/exercise-and-quiz-progress.test.ts`) against the
    real seeded database - batch grading keyed correctly, attempt
    numbering matches single-attempt behavior, server-side grading still
    can't be bypassed by a client-supplied answer, empty batch is a
    no-op. **11/11 passing** (existing single-exercise tests included,
    confirming no regression there). No dedicated component-level test
    existed for `ExerciseItem`/`GrammarStep` before this change either,
    so the `hideControls=false` no-regression claim rests on the
    line-by-line trace above plus these integration tests, not a
    component-render test - flagging honestly rather than overclaiming
    coverage that doesn't exist. **Not yet confirmed live in the browser
    by the user.**

## Seventh pass (2026-08-19/20): the real Operations number, and why estimates kept undershooting it

User pushed back hard after measuring Grammar's real cost live ("solo el
grammar voló a 216 operaciones, que paso?") - this section is the honest
result of that investigation, not a reassurance.

**Root cause found**: every "1 op" estimate in this doc that involves a
Prisma `include` was wrong. Confirmed empirically (not from Prisma's own
marketing blog, which claims "1 query = 1 operation regardless of SQL
complexity" - true for a single write's internal statements, but NOT true
for relation loading with this project's `@prisma/adapter-pg` driver
adapter setup) by enabling real SQL query logging
(`DEBUG_PRISMA_QUERIES=1`, gated in `db.ts`, zero effect otherwise) and
counting actual statements sent per call:
- `getLessonBySlug` (4 top-level relations in one `include`): **7**
  statements, not 1.
- `getGrammarForLesson` (4-level-deep nested `include`): **6** statements,
  not 1.
- `recordExerciseAttempts` (batched, N=4 exercises): **13** statements,
  not the ~9 estimated pre-investigation - `include: { options: true }`
  alone splits into 2, and `getLessonCompetencyIds`'s own nested
  `competency: { select }` splits into 2 more on a cache miss.

Each relation in an `include` becomes its own SELECT, batched via
`IN (...)` across all parent rows (not true per-row N+1 - still bounded),
but each distinct relation path is its own billed operation. This
explains why every "op" number in this document from before 2026-08-20
under-counts, likely by 2-7x depending on how many relations a given call
loads - not just Grammar.

Diagnostic tools added, both safe (no AI calls) and reusable for the next
time a real vs. estimated gap needs closing:
- `tests/manual/measure-grammar-operations.test.ts` - isolated,
  before/after Prisma-Console-reading tool for just
  `recordExerciseAttempts`. (Originally placed in `scripts/`, which
  doesn't match `vitest.config.mts`'s `tests/**` include glob and fails
  with "No test files found" - moved to `tests/manual/` where it's
  directly runnable. `measure-lesson-operations.test.ts` moved alongside
  it and had its own Grammar section fixed to call the new batched
  `recordExerciseAttempts` instead of the pre-redesign per-exercise
  `recordExerciseAttempt` loop, which had gone stale and silently
  under-counted.)
- `tests/manual/_diagnose-query-counts.test.ts` - the real SQL-statement
  counter above (`DEBUG_PRISMA_QUERIES=1 npx vitest run <file>`,
  `--reporter=verbose` to see the query log). One-off framing in its own
  header, but left in place since it's already proven useful twice in one
  day (Grammar, then Vocabulary/Comprehension below) and costs nothing
  unless explicitly invoked.

**Did this fully explain 216?** No - and said so plainly rather than
force a fit. Auditing every action in the user's own precisely-described
measurement window (enter Grammar -> "Check answers" -> "Siguiente")
against real source code - `advanceLessonStep` (confirmed exactly 2
statements, `lesson-progress-data.ts:107-148`), each grammar-example audio
click (confirmed exactly 1 statement even on a $0-balance TTS failure,
`grammar-interactivity.ts:44`), the batch submit itself (~14 statements
for 5 exercises) - tops out around 16-20 statements, not 216. Most likely
remaining explanation: Prisma Console's operations counter isn't
real-time, and the user's "before" reading (taken right as Grammar
rendered) likely hadn't fully settled from Vocabulary's own cost yet -
not a code bug. Flagged as the leading hypothesis, not a confirmed fact.

## Eighth pass (2026-08-20): applying the same measurement to Vocabulary and Comprehension, then the same batching fix to Comprehension

User asked to extend the query-count technique to the other steps
("podriamos ver cuantas op utilizan las otras pruebas?"). Speaking and
Reflection deliberately excluded from live measurement - both make real,
paid OpenAI calls; user confirmed $0.00 balance days earlier, then topped
up $10 on 2026-08-20 with an explicit "no lo gastes así nomás" - budget
exists again but the same caution still applies, see
[[project_speaking_voice_api_cost]]. Situation skipped too - no submit
action, content arrives as props (confirmed by reading
`situation-step.tsx`), nothing new to learn beyond the already-known 2-op
`advanceLessonStep` cost.

Measured against `restaurant-entering-and-ordering` (6 vocabulary words, 5
comprehension exercises):
- **Vocabulary**: content load 3 statements (one-time) + 6 per word
  (`recordVocabularyWordSeen` 4 + `recordVocabularyQuizAttempts` 2), no
  caching benefit across words -> **39 statements** for the full step.
- **Comprehension** (pre-fix, `ExerciseSequence`'s one-submit-per-exercise
  pattern - the same UX shape Grammar had before its 2026-08-19 redesign):
  content load 3 + 9 for exercise 1 (competency-cache miss) + 7 for each
  exercise after (cache hit) -> **40 statements** for 5 exercises, vs. an
  estimated ~20 if batched the same way Grammar was.

**Two concrete, low-risk fixes made from these numbers, both requested by
the user ("si, ambos"):**

1. **Comprehension batched like Grammar.** `comprehension-step.tsx`
   rewritten: same shape as `GrammarStep` (lift answer/result state,
   render every exercise via `ExerciseItem` in `hideControls` mode, one
   "Check answers" -> one "Continue"). Reuses
   `submitExerciseAttemptsAction`/`recordExerciseAttempts` as-is - already
   tested from the Grammar work, nothing exercise/grammar-specific about
   that function. `feedbackMode="assessment"` passed through explicitly
   (Grammar didn't need this - it defaults to `"learning"`) to preserve
   Comprehension's existing no-reveal/no-retry assessment behavior, both
   already conditioned on `feedbackMode` inside `ExerciseItem` independent
   of the `hideControls` change. `ExerciseSequence` itself untouched -
   still used by `GuidedPracticeStep`, a separate step not in scope here.
   Expected new real cost: ~20 statements for this lesson's 5 exercises
   (not independently re-measured live yet - would cost more real
   operations to verify precisely, and the per-exercise math already
   matches Grammar's own confirmed batching savings closely enough to
   trust without spending more quota just to re-confirm the obvious).

2. **`recordVocabularyInteraction` (`reflection.ts`) no longer uses
   `upsert`.** It cost 4 real statements (pre-check SELECT, INSERT,
   post-insert re-SELECT, COMMIT - confirmed via the query-log diagnostic)
   for a function that returns `Promise<void>` and none of its 3 call
   sites (`vocabulary-interactivity.ts`) ever use the returned row. Now a
   plain `create` wrapped in try/catch, swallowing P2002 (the
   `@@unique([userId, vocabularyItemId])` violation) as the expected
   "already recorded" case instead of pre-checking for it. Down to 1
   statement per call (success) or 1 failed-and-caught insert (repeat) -
   both cheaper than the old no-op path, and at least as race-safe since
   uniqueness is enforced atomically by Postgres either way.
   - **Verified**: `tsc --noEmit`/`eslint` clean. 2 new integration tests
     (`tests/integration/reflection.test.ts`, describe block prefixed
     "recordVocabularyInteraction (2026-08-20...)") - first call creates
     the row, repeat call for the same word resolves without throwing and
     without a duplicate row. Full file re-run alongside
     `exercise-and-quiz-progress.test.ts`: **17/17 passing**.

**Honest gap, same discipline as every other pass in this doc**: dev
server confirmed compiling (`curl` to the lesson route returns a clean
307 redirect through middleware, not a 500 - the one `TypeError` observed
in the dev log during this check was `session!.user!.id!` on an
unauthenticated `curl` request with no session cookie, i.e. an artifact of
testing via `curl` with no login flow scripted, not a regression from
these changes - `page.tsx` wasn't touched). No browser-automation tool is
available in this session to click through the redesigned Comprehension
step personally. **Not yet confirmed live in the browser by the user** -
same caveat as Grammar's redesign, which is exactly where the user's own
live testing caught 2 real bugs (audio, the Vocabulary->Grammar
transition) that code review and tests alone had missed.

## Ninth pass (2026-08-20): the Learning Journey landing page itself, and a real cache-stampede bug found while measuring it

User asked to keep going on Learning Journey specifically: "cuando alguien
abre este, hay alguna manera de optimizarlo más?" Measured
`getScenariosWithProgress` (the page's only data call - `JourneyChapters`
is a plain server component, no client fetch) the same way as every prior
pass: real query log, not an estimate.

The page itself is already cheap - **5 statements** for
`getScenariosWithProgress` (LearnerLessonCompletion, Scenario, Domain,
ScenarioLevel, Lesson - each one batched via `IN (...)` regardless of how
many of the 41 real scenarios/lessons exist, no N+1) plus 1-2 for the
layout's `getOrCreateLearnerProfile`. Nothing like Vocabulary/
Comprehension's per-item cost, since this page only shows IDs and counts,
not full lesson content.

**What was actually worth fixing**: `getScenariosWithProgress` and
`getContinueLearningTarget` (`content/learning-journey-data.ts`) each ran
their own independent copy of essentially the same "every published
scenario -> domain -> level -> lesson" query - and `getDashboardData`
(`dashboard-data.ts:71-79`) calls both in the same `Promise.all`, so one
Dashboard load paid for this curriculum tree twice already, before even
counting a later Learning Journey visit. Unified into one
`getCachedPublishedScenarioTree` (`createTtlCache`, 5-minute TTL, same
Tier-3 reasoning as `getLessonCompetencyIds` - authored content, no live
publish/unpublish action in this app) that both now call, selecting the
union of fields either needs.

**Real bug found while empirically verifying the fix, not assumed
working**: the first version measured showed the "shared" cache firing
the underlying query **twice anyway** for the Dashboard's exact call
pattern - `getContinueLearningTarget(userId)` and
`getScenariosWithProgress(userId)` both start in the same
`Promise.all` tick, both saw a cache miss simultaneously (the store had no
entry yet for either to find), and both independently called through to
the database. `createTtlCache` (`ttl-cache.ts`) only ever cached the
*resolved value*, not the in-flight promise, so it had no protection
against concurrent callers racing the same miss - a classic stampede.
Fixed at the shared utility itself (benefits every current and future
caller, including `getLessonCompetencyIds`, which happened to be safe
from this so far only because its own call site awaits sequentially in a
loop rather than via `Promise.all`): store the promise synchronously,
before awaiting it, so a second concurrent call finds and awaits the same
in-flight promise instead of starting its own. Also stopped caching
rejections (delete the entry on failure) so a transient error can't lock
in a broken result for the rest of the TTL window.
- **Verified empirically, twice**: first run of the query-log diagnostic
  against the Dashboard's real `Promise.all` pattern showed 10 statements
  in the combined section (Scenario/Domain/ScenarioLevel/Lesson each
  appearing twice) - confirming the stampede was real, not theoretical.
  After the `ttl-cache.ts` fix, the same diagnostic against the same call
  pattern showed 6 (each exactly once) - confirming the fix actually
  closes the gap it was meant to close, not just plausible-looking code.
- **Verified**: `tsc --noEmit`/`eslint` clean. 2 new unit tests
  (`tests/unit/ttl-cache.test.ts`) - concurrent calls before the first
  resolves share one underlying call instead of one each, and a rejection
  doesn't poison the cache for the rest of the TTL window. **52/52**
  passing across every test file touched today (ttl-cache, dashboard,
  progress-and-review, learning-journey unit, reflection,
  exercise-and-quiz-progress) - one unrelated timeout on first combined
  run (`progress-and-review.test.ts`, the exact latency-variance flake
  vitest.config.mts's own comment already documents), reproduced clean on
  an isolated re-run and again on a second full combined run, so not a
  regression from this change.

## Tenth pass (2026-08-21): Speaking Lab's lesson picker - Chapter -> Scenario -> Lesson, and another stampede fixed along the way

User found the flat 164-lesson `<select>` genuinely disorganized (screenshot
of it open, scrolling off-screen) and asked for real reorganization
options, mocked up as an interactive artifact with real curriculum content
(not lorem ipsum) - three options (grouped `<optgroup>`, two-step domain
cascade, live search), then refined to a level-first cascade after
confirming empirically that every domain maps to exactly one
`JourneyChapter` (no domain spans BEGINNER/INTERMEDIATE/ADVANCED), then
corrected again once the user pointed out the real Learning Journey page
already has this exact chapter concept with its own names/colors
(`CHAPTER_CONFIG` in `journey-chapters.tsx`: Foundations/Everyday
Life/Advanced Situations) - moved `CHAPTER_CONFIG` to
`content/learning-journey.ts` (previously a component-local, unexported
constant) so Speaking Lab's picker imports the exact same names/colors
instead of inventing a second copy that could drift.

Implemented: `speaking-lab-home.tsx`'s lesson picker is now a pill that
opens Chapter tabs (reusing `CHAPTER_CONFIG`'s real titles/accent colors)
-> scenario chips within the active chapter -> lesson rows within the
active scenario, opening pre-scrolled to the currently-selected lesson's
own chapter/scenario. All grouping runs client-side in JS from the
already-fetched `lessonOptions` prop - zero additional Prisma operations
from the reorganization itself.

**User explicitly asked to also minimize operations once implemented** -
found the same stampede shape already fixed once this investigation
(`getContinueLearningTarget`/`getScenariosWithProgress`,
`ttl-cache.ts`): `speaking-lab/page.tsx` calls
`getSpeakingLessonOptions()` directly AND `getSpeakingPrompts(lessonId)`
calls it again internally to resolve a default lesson when no `lessonId`
is in the URL, both inside the same `Promise.all` - the 164-lesson query
was running twice on the common (no-`lessonId`) first visit, before even
adding the chapter/scenario fields the new picker needed. Extended
`SpeakingLessonOption` with `scenarioSlug`/`chapter` and wrapped
`getSpeakingLessonOptions` in `createTtlCache` (same 5-minute Tier-3
reasoning as `getLessonCompetencyIds`/`getCachedPublishedScenarioTree`) -
collapses both the in-request duplicate and every repeat page load within
the TTL window.
- **Verified empirically**: query-log diagnostic against `page.tsx`'s
  exact `Promise.all(getSpeakingPrompts(undefined), getSpeakingLessonOptions())`
  pattern shows the Lesson/ScenarioLevel/Scenario trio exactly once, not
  twice.
- **Verified**: `tsc --noEmit`/`eslint` clean on every touched file
  (`speaking-lab-home.tsx`, `speaking-prompts.ts`, `learning-journey.ts`,
  `journey-chapters.tsx`). **32/32** passing across every affected test
  file (`ttl-cache`, `speaking-prompts`, `speaking-lab`,
  `learning-journey` unit). Dev server compiles the route clean (`curl`
  to `/speaking-lab` returns a clean 307 redirect through middleware, not
  a 500). **Not yet confirmed live in the browser by the user** - same
  standing caveat as every other UI change this investigation: no
  browser-automation tool available this session.
