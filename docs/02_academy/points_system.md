# HanGo Points & Leveling System

Version: 1.1

Status: Official

Last Updated: August 2026

2026-08-24: the General Level's point thresholds no longer map to a literal
official-HSK number. A word-for-word audit against the real 国际中文教育
中文水平等级标准 (2021) list (`informe_academico_hango.md` Section 10)
found the curriculum's actual vocabulary breadth didn't support that
equivalence claim, worse the higher the score. The 10 thresholds themselves
are unchanged (so is the internal 0-9 difficulty number driving Han's live
Speaking pacing) — only the label each threshold shows changed, from an HSK
number to a plain-language tier name. See "General Level Tiers" below.

---

# Purpose

This document defines HanGo's two-tier scoring system: a per-session Reflection
score (0-100, immediate feedback on one lesson) and a General Level score
(0-2000, the learner's real cumulative proficiency, shown as a named tier —
see below — with HSK kept only as an internal design-calibration reference,
never a certification claim).

It supersedes the point-related gaps in `hsk_mapping.md` and
`curriculum_structure.md` (see "Relationship to Existing Docs" below) — this
is now the authoritative source for how HanGo measures and reports level.

---

# Design Principles

- **Session score ≠ general level.** A perfect Reflection score tells the
  learner how one session went. It does not, by itself, raise their General
  Level — level only rises through the weighted contribution described below.
- **Evidence over single attempts.** Nothing in this system lets one lucky
  attempt inflate a learner's level. Redoing a scenario replaces its previous
  contribution rather than stacking on top of it.
- **Harder content is worth more, automatically.** Every lesson already
  carries a real `hskReference` (1-9) in the database. Point weight is
  derived directly from that field — not hand-assigned — so the system stays
  consistent across ~224 lessons without per-lesson judgment calls.
- **2000 (HSK 9) must be genuinely hard to reach.** The curriculum
  (Foundations → Everyday Life → Advanced Situations) only carries a learner
  to 1500 (HSK 6). The last 500 points (HSK 7-9) are reachable only through
  sustained, evidence-gated practice in Writing Lab and Speaking Lab — no
  shortcut through lesson content alone.

---

# Part 1 — Session Score (Reflection, 0-100)

Awarded at the end of every lesson's Reflection step. Breakdown:

| Step | Points | Scored from |
|---|---|---|
| Vocabulary | 20 | Real quiz accuracy (not coverage — see formula below) |
| Grammar | 20 | Real accuracy across the lesson's grammar exercises |
| Comprehension | 30 | Real accuracy across the comprehension exercises |
| Speaking | 30 | AI-graded rubric, 5 metrics (see below) |
| Situation | 0 | Presentational step, not graded — prepares Comprehension/Speaking |

**Passing score: 70/100 minimum.**

## Per-question point values

**Comprehension**: always 5 exercises per lesson (verified against the DB,
no exceptions) → **6 points per correct answer**, fixed.

**Grammar**: almost always 6 exercises per lesson (3 grammar points × 2
exercises each) → **3.33 points per correct answer**. Daily Life and Travel
are the exception, with 4 exercises per lesson (2 points × 2) → **5 points
per correct answer** there.

**Vocabulary**: varies per lesson, because the number of quiz questions per
word depends on that lesson's `ScenarioDifficulty` (Beginner = 4
questions/word, Intermediate/Upper Intermediate = 5, Advanced = 6) and word
count (6 or 10, depending on domain). Question mix per word: meaning
recognition, reverse-translation (chineseForm), 1-3 fill-in-the-blank
(scales with difficulty), and one "put the sentence in order" question
(**redefined 2026-08-16**, user report - replaced a pinyin-recognition
question that, together with meaning/chineseForm, tested the same
character<->meaning/sound association three times back to back with no
question requiring the learner to construct anything; a like-for-like swap,
so the totals below are unchanged). Formula:

```
points_per_question = 20 ÷ (lesson_word_count × questions_per_word_for_difficulty)
```

| Curriculum context | Words × questions/word | Total questions | Points/question |
|---|---|---|---|
| Foundations (Beginner) | 10 × 4 | 40 | 0.50 |
| Daily Life / Travel (Intermediate) | 6 × 5 | 30 | 0.667 |
| Getting Around / Everyday Life / Making Friends (Intermediate) | 10 × 5 | 50 | 0.40 |
| Health / Work & Office / Advanced Situations (Advanced) | 10 × 6 | 60 | 0.333 |

Vocabulary accuracy requires a new attempt-tracking table — today the
Vocabulary Step's quiz answers aren't persisted server-side (only word
*coverage* is, via `LearnerVocabularyInteraction`).

**Speaking (30 pts) is deliberately strict — a multiplicative formula, not
an average.** An average would let strong pronunciation compensate for weak
vocabulary use; multiplying does not.

```
base_average = (pronunciation + fluency + accuracy + complexity + communication_effectiveness) / 5   [0-100]
speaking_0_100 = base_average × vocabulary_factor × objective_factor
speaking_points = (speaking_0_100 / 100) × 30
```

- `base_average`: the existing 5-metric AI grading rubric, same one Speaking
  Lab already uses.
- `vocabulary_factor` (0-1): how much of the lesson's specific taught
  vocabulary the learner demonstrably engaged with. **Redefined 2026-08-16**
  (user report): originally required the learner to *produce* every word
  themselves, which penalized natural Chinese - a fluent speaker drops a
  noun once it's established and replies 好，我要 instead of restating it -
  and made the ratio fragile to a single mis-transcribed word, since it
  depended on exact string matching in the learner's own turn. Now a word
  counts if the learner either used it themselves, or the AI character used
  it first and the learner's next turn shows a clear, contextually
  appropriate response (understood-and-responded-to, not just present
  somewhere in the transcript).
- `objective_factor` (0-1, new): how completely the scenario's objective was
  achieved. The grading prompt already receives `successConditions` — same
  extension, return the completion ratio alongside the 5 metrics. Mirrors
  what Missions already do (`taskCompletion`/`vocabularyUsage` in
  `mission-evaluation.ts`) rather than inventing a new mechanism.

Because the three factors multiply, a weak showing in any one of them caps
the whole score — it cannot be averaged away by strength elsewhere.

**Worked example**: metrics average 83.6 (a genuinely good conversation),
but only 70% of the target vocabulary was used and the objective was 90%
completed: `83.6 × 0.70 × 0.90 = 52.7` → **15.8 / 30**. Reaching close to
30/30 requires near-100% on grammar, vocabulary use, *and* objective
completion simultaneously — hard, not impossible.

## Scenario Completion Screen

When a learner finishes all lessons in a scenario, show:

- The Reflection score obtained in each individual lesson (mini-session) of
  that scenario.
- A "Completed" marker.
- A "Redo this scenario" option. Redoing **replaces** the scenario's
  previous score for General Level purposes — attempts are not summed or
  averaged together, only the latest counts. This rewards genuine
  improvement without letting repetition farm extra points.

---

# Part 2 — General Level (0-2000, named tiers)

## Why 3 chapters, not 9 domains

The database organizes content into 9 `Domain` rows (Foundations, Daily Life,
Travel, Getting Around, Making Friends, Health, Work & Office, Everyday Life,
Advanced Situations) for content-authoring purposes. **The learner never sees
this** — the Learning Journey screen (`journey-chapters.tsx`) groups every
scenario into exactly 3 visual chapters by difficulty tier, with hardcoded
titles:

| Chapter (what the learner sees) | Scenario difficulty | Domains it contains |
|---|---|---|
| **Foundations** | BEGINNER | foundations |
| **Everyday Life** | INTERMEDIATE + UPPER_INTERMEDIATE | daily-life, travel, getting-around, making-friends, health, work-and-office, everyday-life |
| **Advanced Situations** | ADVANCED | advanced-situations |

The General Level system is built around these 3 chapters, matching exactly
what the learner sees and interacts with. The 7-domains-inside-one-chapter
split stays an internal calculation detail.

## General Level Tiers (2026-08-24: no longer literal HSK-equivalence claims)

An HSK-vocabulary audit (see `informe_academico_hango.md` Section 10) found
that, checked word-for-word against the official
国际中文教育中文水平等级标准 (2021) list, the old "N points = HSK-X"
table did not hold up — the curriculum's real vocabulary breadth undershoots
what each claimed official level actually requires, by a wider margin the
higher the score. Presenting an exact point-to-official-HSK-number mapping
is a falsifiable equivalence claim; presenting a difficulty tier is not.
The table below replaces the old one — same 10 thresholds
(`HSK_POINT_THRESHOLDS` in `src/lib/points-system.ts` is unchanged at the
`minPoints`/`level` level, only `label` changed), new names, no HSK number
in anything the learner or Han sees.

| Points | Tier name | Reached at |
|---|---|---|
| 0 | Just Starting Out | New learner |
| 100 | Getting By | Inside Foundations |
| **350** | **Finding Your Footing** | Foundations complete |
| 700 | Speaking with Ease | Inside Everyday Life chapter |
| **900** | **Easily Understood** | Everyday Life chapter complete |
| 1150 | Handling Real Situations | Inside Advanced Situations |
| **1500** | **Speaking Like a Professional** | Advanced Situations complete |
| 1650 | Nearing Mastery | Writing/Speaking Lab only |
| 1800 | Refined Fluency | Writing/Speaking Lab only |
| **2000** | **Mastering the Language** | Maximum |

The internal 0-9 difficulty number (`hskNumberForPoints()`) behind each
threshold is unchanged and still drives Han's real-time Speaking pacing
(character limits, speech speed, vocabulary scaling in
`han-realtime.ts`/`speech/realtime-turn-guard.ts`) — none of that logic
changed, only what's displayed. HSK still exists internally purely as a
*design calibration reference* (see "Relationship to Existing Docs" below)
— it is never shown to the learner or to Han as a level claim.

## Chapter Point Budgets (cumulative)

| Chapter | Adds | Cumulative total |
|---|---|---|
| Foundations | 350 | 350 |
| Everyday Life | +550 | 900 |
| Advanced Situations | +600 | 1500 |
| Writing Lab + Speaking Lab | +500 | 2000 |

## Formula

```
lesson_points   = (lesson_hsk / scenario_hsk_sum) × scenario_points
scenario_points = (scenario_hsk_sum / chapter_hsk_sum) × chapter_budget
```

Where `lesson_hsk` is the lesson's existing `hskReference` field and
`scenario_hsk_sum` is the sum of that field across the scenario's lessons.
This is fully derivable from existing data — no manual weight table to
maintain.

**Earning general points from a scenario**: each lesson begins contributing
as soon as its Reflection report is complete. While the scenario is still in
progress, finished lessons use their real Reflection scores and unfinished
lessons contribute zero to the same weighted scenario formula. This gives the
learner visible General Level progress after every lesson without recording a
false scenario completion.

Once every lesson is complete, the persisted `ScenarioCompletion` contribution
replaces that live partial value; the two are never added together. Its earned
points = `scenario_points × (weighted average of that scenario's lesson
Reflection scores ÷ 100)`. Example: a scenario worth 46.4 points, completed
with a lesson-weighted average Reflection score of 78.5%, earns the learner
`46.4 × 0.785 ≈ 36.4` points toward their General Level.

## Computed Scenario Points (current curriculum)

### Foundations — budget 350

| Scenario | Points |
|---|---|
| Getting Started | 16.9 |
| Family | 16.9 |
| Weather & Seasons | 16.9 |
| Daily Life & Feelings | 16.9 |
| Around the House | 16.9 |
| Basic Shopping | 16.9 |
| Phone & Communication | 16.9 |
| School & Classroom | 25.3 |
| Hobbies & Free Time | 29.5 |
| Body & Feeling Unwell (Basics) | 29.5 |
| Asking About Places & Opening Hours | 29.5 |
| Money, Banking & Simple Transactions | 33.7 |
| Opinions, Comparisons & Preferences | 38.0 |
| Making Plans & Talking About Time | 46.4 |

### Everyday Life chapter — budget 550

| Domain (internal) | Scenario | Points |
|---|---|---|
| Getting Around | Getting Around | 25.2 |
| Everyday Life | Grocery Shopping & Meal Planning | 25.2 |
| Everyday Life | Coffee Shop & Casual Meetups | 27.8 |
| Daily Life | Restaurant | 30.3 |
| Daily Life | Shopping | 30.3 |
| Travel | Hotel | 30.3 |
| Making Friends | Making Friends | 30.3 |
| Everyday Life | Gym & Fitness Classes | 30.3 |
| Everyday Life | Social Events & Small Talk with Strangers | 30.3 |
| Everyday Life | Renting an Apartment | 32.8 |
| Everyday Life | Post Office & Mailing Packages | 32.8 |
| Everyday Life | Online Shopping & Delivery Problems | 37.8 |
| Health | Health | 35.3 |
| Everyday Life | Weather, Plans & Rescheduling | 35.3 |
| Everyday Life | Roommate & Neighbor Issues | 35.3 |
| Work & Office | Work & Office | 40.4 |
| Everyday Life | Job Interview Basics | 40.4 |

### Advanced Situations — budget 600

| Scenario | Points |
|---|---|
| Negotiating a Job Contract | 47.2 |
| Debating a Current Issue | 47.2 |
| Academic Seminar Discussion | 52.0 |
| Resolving a Complex Workplace Conflict | 52.0 |
| Media Interview as an Expert | 52.0 |
| Legal and Notarial Procedures | 61.4 |
| Formal Speech and Toast at an Event | 61.4 |
| Specialist Medical Consultation | 70.9 |
| Diplomatic and Culturally Sensitive Negotiation | 75.6 |
| Tech and Finance Expert Panel | 80.3 |

Lesson-level (mini-session) points within each scenario are computed with
the same formula and are not hand-listed here (~224 rows) — they should be
generated programmatically from each lesson's `hskReference` at
implementation time, using the formula above.

---

# Part 3 — Lab Points (the final 500 points, HSK 7-9)

Reaching HSK 7-9 must be genuinely difficult and genuinely slow — not
achievable by finishing the guided curriculum alone, and not achievable in a
few weeks of concentrated effort either. Real fluency at this level takes
sustained practice over months, not volume alone.

## Budget split

| Skill | Points | Status |
|---|---|---|
| Speaking Lab | 200 | Live |
| Writing Lab | 150 | Live |
| Reading Lab | 150 | Planned — not built yet |
| **Total** | **500** | |

Until Reading Lab exists, the honest maximum a learner can reach is
**1850 / 2000**, not 2000. Do not temporarily inflate Speaking/Writing to
cover the gap — that would force lowering existing learners' points later
when Reading launches, which must never happen (see "Future skills" below).

## Formula

Each skill's points are computed independently from the same shape:

```
skill_points = skill_budget × factor_dominio × factor_volumen × factor_tiempo × factor_consistencia
```

All four factors are clamped to `[0, 1]`. Because they multiply, **any
factor at 0 makes the whole result 0** — this is deliberate: a learner
cannot compensate for "too new, too fast" with a couple of great scores.

- **factor_dominio** (score quality): `(recent_average_score - 70) / 30`.
  Nothing below a 70% average counts at all.
- **factor_volumen** (distinct evidence, not repeats): `(distinct_attempts - 20) / 40`.
  Needs 20 distinct graded attempts just to start contributing, full weight
  only at 60+. Repeating the identical exercise does not add distinct
  evidence, though a better score on a repeat can still raise the average.
- **factor_tiempo** (spread over real time — the key anti-farming lever):
  `(distinct_active_weeks - 2) / 10`. Needs practice spread across at least
  2 calendar weeks to start, full weight only after 12 weeks (~3 months) of
  activity. This is what stops a learner from compressing 60 attempts into
  a single intense week and maxing out — the same volume spread over a
  weekend vs. three months must not score the same.
- **factor_consistencia** (reliability, not one lucky spike):
  `1 - (stdev_of_recent_scores / 100)`, computed over the same rolling
  window as factor_volumen.

## Worked example

A learner with 65 distinct Writing Lab submissions, spread across 12
calendar weeks, averaging 88% with a standard deviation of 8:

```
factor_dominio      = (88-70)/30  = 0.60
factor_volumen       = (65-20)/40  = 1.00
factor_tiempo        = (12-2)/10   = 1.00
factor_consistencia  = 1 - 8/100   = 0.92

points = 150 × 0.60 × 1.00 × 1.00 × 0.92 ≈ 82.8 / 150 (55%)
```

Three months of genuinely good, consistent practice reaches barely over
half. Approaching the full 150 requires a sustained average in the
mid-to-high 90s — appropriately hard for HSK 7-9.

## Implementation note: Custom Writing counts too (2026-08-15)

Writing Lab has three activity types — Write a Paragraph, Translation
Challenge, and Custom Writing. Custom Writing originally graded a one-off
learner-defined prompt entirely in-memory and saved nothing to the
database, so it couldn't contribute evidence here. Fixed by making
`WritingAttempt.taskId` optional and adding a `customPrompt` JSON field
that holds the `CustomWritingCharacteristics` graded against when there's
no backing `WritingTask` row (see `submitCustomWriting()` in
`writing-data.ts`). `getWritingEvidence()` dedupes by `taskId ?? id` —
every Custom Writing submission is inherently a distinct piece of writing,
so unlike resubmitting a fixed task, each one counts toward
`factor_volumen` on its own.

## Future skills (Reading, Listening)

**Reading** already has its budget reserved (150) and slots into this same
formula unchanged once built.

**Listening does not get its own slice of these 500 points.** It is already
measured continuously through the existing `LISTENING` competency (0-100,
fed by Comprehension exercises, Situation/Dialogue, and conversation with
Han across the entire 0-1500 curriculum range) — it is not an isolated,
separately-submitted activity the way Writing/Speaking/Reading are. If a
dedicated Listening Lab is ever built with its own gradable submissions, add
it as a band **beyond 2000** rather than re-splitting the existing 500 —
shrinking Speaking/Writing/Reading's already-committed budgets would lower
existing learners' scores, which must never happen.

---

# Part 4 — Progress Tab Display

The Progress screen shows:

- General Level: `X / 2000`, with its tier name from the table above.
- Learning Journey weighted average (how the learner is doing across
  completed scenarios).
- Per-skill scores (0-100): Listening, Speaking, Reading, Writing, Daily
  Communication — from the existing `getCompetencyProgress()`.

---

# Part 5 — AI Teacher (Han) Responsibilities

In addition to the self-reported level and the evidence-based competency
band Han already uses, **Han must adapt to the learner's General Level
score (0-2000)** as the primary, most precise signal of real ability — more
precise than the coarse self-reported level, since it is earned, not
declared.

- Han should treat the General Level's tier name (from the table above,
  `hskLevelForPoints()`) as authoritative over the learner's self-reported
  `currentLevel` whenever the two disagree — and should see that tier name
  directly (`resolveEffectiveLevel()` in `ai-context.ts`), not a raw HSK
  number, both in tutoring mode and inside role-play/Speaking sessions
  (2026-08-24: Han's own text no longer references HSK at all).
- Difficulty of examples, vocabulary choice, and correction style should
  scale continuously with the General Level score, not just its rounded
  tier — a learner at 340 points and one at 950 points are both "close to a
  boundary" in different directions and should be treated accordingly.
- This does not replace the existing zero-evidence fallback (a brand-new
  learner with 0 points defaults to the simplest possible Chinese,
  regardless of anything self-reported).
- Live Speaking practice (`han-realtime.ts`) is a separate, unaffected
  concern: its per-turn character-limit/pace/vocabulary-scaling logic reads
  `hskNumberForPoints()` (the untouched internal 0-9 number) or a literal
  `"HSK N"` string built from it, never the tier name — see that file's
  `resolveRealtimePracticeLevel()` doc comment for why the two must stay
  separate.

---

# Confirmed Enhancements

- **Real HSK syllabus coverage as a secondary, internal-only signal.**
  Cross-check how much of the official HSK-N vocabulary/grammar list a
  learner has actually encountered and scored well on, alongside the points
  total — useful as a design-calibration sanity check (see
  `informe_academico_hango.md` Section 10's verified audit), but never
  surfaced to the learner as a certification claim.
- **Milestone celebrations.** A badge or small moment when a learner
  crosses each tier threshold.

---

# Relationship to Existing Docs

`hsk_mapping.md` currently states *"HanGo initially focuses on HSK 3-6, 7-9.
The Beginner stage (HSK 1-2) may be incorporated in future versions"* — this
is now incorrect (Foundations/HSK 1-2 already exists) and contradicts the
table in this document. `curriculum_structure.md` describes a generic
5-domain example set ("Personal Life," "Society," "Professional"...) that
doesn't match the real 9-domain / 3-chapter structure used here. Both should
be reconciled with this document before or during implementation — not done
yet, flagged for a separate pass.

**2026-08-24 addition**: `hsk_mapping.md` still frames the *entire* General
Level system as HSK-equivalence ("HanGo covers the full HSK 3.0 range... HSK
1-2 (Foundations)... HSK 7-9 (reachable only through sustained Lab
practice)"). That content-side framing (which scenarios teach roughly
HSK-N-level material, as a design reference) is still fine to keep — the
part that needs correcting is anywhere it implies the *point score itself*
certifies a specific official HSK number, which this document no longer
does (see "General Level Tiers" above). Not reconciled yet in that file.

---

# Success Definition

The Points & Leveling System succeeds when a learner's General Level score
is a trustworthy, hard-earned reflection of real Mandarin ability — resistant
to single-session inflation, aligned with genuine HSK expectations, and used
consistently by Han to meet the learner exactly where they are.

---

End of document.
