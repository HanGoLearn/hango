# HanGo User Flow

Version: 1.1

Status: Official (Stages 2 and 5 corrected 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** Stage 2 described a mandatory initial
> assessment; the real placement exam is optional and skippable. Stage 5's
> lesson flow was the same 11-step design `lesson_design.md` already
> documents as superseded by a real 6-step flow - both have been corrected
> below to match. This document also predates HanCoins, the avatar shop,
> the leaderboard, achievements, and the Han hub (Tutor/Companion/
> Vocabulary) - none of which are mentioned anywhere below; treat the rest
> of this document as the pre-gamification core loop, still broadly
> accurate in spirit, just incomplete.

---

# Purpose

This document defines the complete user journey inside HanGo.

Its purpose is to describe how a learner discovers, starts, and continuously uses the platform.

The user flow ensures that every product module works together as a coherent learning experience.

---

# Core Experience

HanGo should guide users through a continuous cycle:

```
Understand

↓

Learn

↓

Practice

↓

Receive Feedback

↓

Improve

↓

Continue
```

Every feature should support this cycle.

---

# Stage 1: Account Creation

## Objective

Create a personalized learning profile.

The user provides:

- Name.
- Preferred language.
- Learning goals.
- Current Chinese level.
- Study objectives.

---

# Stage 2: Initial Assessment (real: optional placement exam)

## Objective

Give a returning-level learner immediate credit instead of re-doing
already-known material - **not** a mandatory gate every new learner must
pass through.

Real behavior (`app/(app)/placement-exam`,
`src/components/onboarding/steps/placement-offer-step.tsx`): offered once
during onboarding with an explicit "Skip for now" option. It evaluates
exactly **five** skills - Vocabulary, Grammar, Reading, Listening,
Speaking (no separate Writing skill) - adaptively, climbing HSK level by
level while the learner keeps passing at an 80% ratio.

---

# Assessment Output (real)

The real payoff is automatic **General Level point credit** for every
lesson at or below the learner's demonstrated level - not a strengths/
weaknesses narrative report. A learner who places at HSK 5, for example,
starts with the point credit HSK 1-5 content would have earned, and
resumes normal lesson-by-lesson play from there. There is no generated
"Strength: Reading / Needs Improvement: Speaking Fluency" summary
anywhere in the app.

---

# Stage 3: Personalized Learning Plan

## Objective

Create the learner's starting path.

The AI Teacher recommends:

- First scenario.
- Study frequency.
- Priority skills.
- Review strategy.

Example:

"Your first goal is completing Restaurant Communication at Intermediate level."

---

# Stage 4: Daily Learning Session

## Objective

Complete meaningful learning activities.

The user enters the Dashboard.

The Dashboard shows:

- Current objective.
- Recommended lesson.
- AI Teacher recommendation.
- Progress update.

---

# Stage 5: Learning Journey Activity

The learner enters a lesson.

**Real flow** (see `lesson_design.md`'s audit note for detail):

```
Vocabulary

↓

Situation (situation + dialogue merged into one screen)

↓

Comprehension

↓

Grammar

↓

Speaking

↓

Reflection
```

Writing, Mission, and Quiz are reached separately (Writing Lab, Progress/
Speaking Lab), not as in-lesson steps.

---

# Stage 6: AI Teacher Interaction

The AI Teacher is available during the entire lesson.

The learner can:

- Ask questions.
- Request explanations.
- Practice examples.
- Generate additional exercises.
- Clarify mistakes.

The AI Teacher uses lesson context to provide relevant help.

---

# Stage 7: Speaking Practice

After learning concepts, the learner practices production.

Possible activities:

- Shadowing.
- Role play.
- Conversation.
- Pronunciation training.

The system evaluates performance and provides feedback.

---

# Stage 8: Writing Practice

The learner applies knowledge through writing.

Activities:

- Sentence creation.
- Messages.
- Paragraphs.
- Practical writing.

The AI provides corrections and explanations.

---

# Stage 9: Evaluation

After completing activities, HanGo updates:

- Competency profile.
- Scenario progress.
- Vocabulary knowledge.
- Grammar confidence.

The AI Teacher provides recommendations.

Example:

"You completed Restaurant Communication. Your next step is improving spontaneous speaking."

---

# Stage 10: Progress Review

The learner can review:

- Skill development.
- Completed scenarios.
- Strengths.
- Weaknesses.
- Future recommendations.

---

# Returning User Experience

When users return, HanGo should remember:

- Previous progress.
- Current goals.
- Learning history.
- Common mistakes.
- Pending recommendations.

The experience should feel continuous.

---

# Daily Learning Loop

The ideal daily loop:

```
Open HanGo

↓

Check Dashboard

↓

Follow Recommendation

↓

Learn New Content

↓

Practice

↓

Receive Feedback

↓

Review Progress

↓

Continue Tomorrow
```

---

# Long-Term Journey

Over months and years, the learner progresses through:

```
Intermediate Chinese

↓

Upper Intermediate Chinese

↓

Advanced Chinese

↓

Professional / Academic Communication

↓

Independent Chinese Usage
```

---

# User Experience Principles

The user should always feel:

## Guided

They know what to do next.

## Supported

The AI Teacher is always available.

## Challenged

Activities increase naturally in difficulty.

## Progressing

Improvement is visible.

---

# Success Definition

The user flow succeeds when learners can naturally continue studying without confusion, while consistently improving their ability to communicate in Chinese.

---

End of document.