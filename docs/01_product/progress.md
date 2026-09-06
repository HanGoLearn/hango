# HanGo Progress System

Version: 1.1

Status: Official (corrected 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** the 9-competency taxonomy below (Language
> Skills + Communication Abilities) is real and verified against
> `prisma/seed.ts` and `src/lib/competency-progress.ts`. Three things
> were wrong and are corrected below: (1) Grammar Control and Vocabulary
> Range are **not** staged competencies - the schema explicitly says so;
> the real Progress page shows them as flat exposure counts instead; (2)
> the Mastery Levels' stage names were an earlier design that got renamed
> before shipping; (3) this document never mentioned the page's actual
> headline metric, the earned **General Level**.

---

# Purpose

The Progress System allows learners to understand their development, identify strengths and weaknesses, and visualize their growth throughout the HanGo learning journey.

The objective is to measure real communicative competence rather than only completed content.

---

# Core Philosophy

Progress should answer one fundamental question:

"What can the learner do now that they could not do before?"

Completion is not mastery.

Time spent studying is not mastery.

True progress is the ability to understand and communicate more effectively.

---

# Student Competency Profile

Every learner has a dynamic competency profile.

The profile represents their current abilities across multiple dimensions.

---

# Core Competencies

## Listening

Measures the ability to understand spoken Chinese.

Indicators:

- Understanding everyday conversations.
- Recognizing different speaking speeds.
- Understanding authentic audio.
- Following complex discussions.

---

## Speaking

Measures the ability to communicate verbally.

Indicators:

- Pronunciation.
- Fluency.
- Sentence formation.
- Conversation ability.
- Confidence.

---

## Reading

Measures the ability to understand written Chinese.

Indicators:

- Vocabulary recognition.
- Grammar comprehension.
- Understanding longer texts.
- Reading speed.

---

## Writing

Measures the ability to express ideas in written Chinese.

Indicators:

- Sentence accuracy.
- Organization.
- Vocabulary range.
- Natural expression.

---

## Grammar and Vocabulary (not staged competencies)

**Correction (2026-09-05):** unlike the four skills above, Grammar and
Vocabulary are explicitly **not** tracked as staged competencies -
`prisma/schema.prisma`'s own comment on the `Competency` model states
this directly. The real Progress page instead shows a flat count: "X
vocabulary items encountered," "Y grammar points encountered" - exposure,
not a mastery stage.

---

# Communication Competencies

Besides language skills, HanGo measures practical communication abilities.

Examples:

## Daily Communication

Can communicate in everyday situations.

Examples:

- Ordering food.
- Shopping.
- Asking directions.
- Making plans.

---

## Travel Communication

Can handle communication while traveling.

Examples:

- Hotels.
- Transportation.
- Problems.
- Recommendations.

---

## Social Communication

Can interact naturally with Chinese speakers.

Examples:

- Introducing oneself.
- Maintaining conversations.
- Expressing feelings.
- Sharing experiences.

---

## Professional Communication

Can communicate in workplace environments.

Examples:

- Meetings.
- Emails.
- Presentations.
- Negotiations.

---

## Academic Communication

Can participate in academic contexts.

Examples:

- Discussions.
- Presentations.
- Research topics.

---

# Learning Journey Progress

**Correction (2026-09-05):** each scenario's real progress is a single
`completionPercent` plus a `mastered: boolean` - not tiered per-scenario
mastery levels ("Level 1/2/3" below was an invented example, not a real
feature).

---

# General Level (the real headline metric)

**Added 2026-09-05, previously missing from this document entirely.** The
Progress page's top-of-page metric is the learner's earned **General
Level**: 0-2000 points, accumulated from completed scenarios/lessons/labs,
mapped to an HSK-style label. This is the authoritative signal Han treats
as the learner's real level when it disagrees with a self-reported one -
see `points_system.md` and `hsk_mapping.md` for the full formula.

---

# Mastery Levels

Each of the four staged competencies (Listening/Speaking/Reading/Writing,
plus the five Communication Abilities) follows five real stages, in
order: **Exposure → Practice → Functional → Confident → Mastery**
(`src/lib/competency-progress.ts`). These replaced an earlier draft
naming (Introduced/Practicing/Developing/Confident/Mastered) before
shipping - if you see the old names elsewhere, they're stale.

---

# Progress Visualization

The learner should see progress through:

---

## Learning Journey Map

Shows completed and upcoming scenarios.

Example:

Restaurant

██████░░░░ 60%

Hotel

████░░░░░░ 40%

Business Meeting

Locked

---

## Competency Dashboard

Shows current abilities.

Example:

Speaking:

Intermediate

Listening:

Upper Intermediate

Writing:

Developing

---

## Strengths and Weaknesses

The system identifies:

Strengths:

"Your vocabulary retention is strong."

Weaknesses:

"You frequently confuse measure words."

---

# AI-Powered Recommendations

The AI Teacher analyzes progress and recommends actions.

Examples:

"You have completed restaurant conversations but need more speaking practice."

"Your grammar knowledge is strong, but your active vocabulary needs reinforcement."

"Practice listening with faster conversations."

---

# HSK Integration

HSK levels are included as a reference point.

They provide structure and progression.

However, HSK level does not fully represent communication ability.

A learner can have strong HSK knowledge but limited speaking ability.

HanGo tracks both.

---

# Data Sources

Progress is calculated from multiple learning activities.

Sources include:

- Completed lessons.
- Speaking evaluations.
- Writing corrections.
- Quiz results.
- Conversation performance.
- Vocabulary retention.
- Grammar performance.

---

# Progress Philosophy

The system should motivate learners.

Progress should feel:

- Clear.
- Honest.
- Encouraging.
- Actionable.

The purpose is not to rank learners.

The purpose is to help learners improve.

---

# Success Definition

The Progress System succeeds when learners clearly understand:

Where they are.

What they can do.

What they need to improve.

What they should do next.

---

End of document.