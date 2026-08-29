# HanGo Learning Journey

Version: 1.1

Status: Official

Last Updated: August 2026

The original "4 levels" and "11-step lesson" sections below described an
early, aspirational design. Both have been rewritten to match the real
shipped structure — see `curriculum_structure.md` for the full
chapter/domain/scenario breakdown and "Real Implementation" at the end of
this document.

---

# Purpose

The Learning Journey is the central learning path inside HanGo.

Its purpose is to guide learners from intermediate Chinese proficiency toward advanced communication skills through structured progression, realistic situations, and continuous practice.

The Learning Journey transforms language learning from isolated lessons into a complete educational experience.

---

# Core Concept

Traditional language learning often organizes content by:

- Vocabulary lists.
- Grammar chapters.
- Textbook units.
- Difficulty levels.

HanGo organizes learning by:

- Real-life situations.
- Communication goals.
- Competencies.
- Progressive challenges.

The learner does not simply study Chinese.

The learner uses Chinese to accomplish increasingly complex objectives.

---

# Learning Structure (real implementation)

The real hierarchy is **Chapter → Domain → Scenario → Difficulty Level →
Lesson**, not the four generic levels originally listed here. Full detail
lives in `curriculum_structure.md` — summary:

- The learner sees exactly **3 chapters** on the Learning Journey screen —
  Foundations, Everyday Life, Advanced Situations — grouped by difficulty
  tier, not by the 9 content Domains behind them (Foundations, Daily
  Life, Travel, Getting Around, Making Friends, Health, Work & Office,
  Everyday Life, Advanced Situations).
- Each Domain contains one or more **Scenarios** (a real situation —
  Restaurant, Job Interview, Negotiating a Contract).
- Each Scenario has one or more **Difficulty Levels** (Beginner,
  Intermediate, Advanced), each containing several **Lessons**.

---

# 1. Scenario

A Scenario represents a real-life context where Chinese is needed.

Examples:

Daily Life:

- Restaurant.
- Shopping.
- Transportation.
- Hotel.
- Hospital.
- Making friends.

Professional:

- Job interview.
- Office communication.
- Meetings.
- Presentations.
- Negotiations.

Academic:

- University.
- Research.
- Presentations.
- Discussions.

Advanced Society:

- Economy.
- Technology.
- Culture.
- Politics.
- Current events.

Each Scenario has a communication purpose.

The learner should understand:

"Why am I learning this?"

---

# Scenario Difficulty Levels (real implementation)

Unlike the earlier "every scenario spans 3 tiers" design, in the real
curriculum **each scenario carries only the difficulty level(s) it was
actually authored at** — most scenarios exist at a single tier (e.g.
Restaurant is Intermediate-only; every Foundations scenario is
Beginner-only), and a handful span two (e.g. Health has both Intermediate
and Advanced lessons; Getting Around has Beginner and Intermediate). No
scenario currently spans all of Beginner through Advanced. See
`points_system.md`'s scenario tables for exactly which scenarios exist at
which tier.

---

# Lesson Structure

Every lesson follows a consistent structure.

A lesson contains:

1. Objective

2. Context Introduction

3. Vocabulary

4. Grammar

5. Dialogue

6. Listening Practice

7. Speaking Practice

8. Writing Practice

9. Exercises

10. Mission

11. Evaluation

---

# 1. Objective

Every lesson must define what the learner will be able to do.

Example:

"After this lesson, the learner can order a meal, ask questions about ingredients, and express preferences in Chinese."

Learning objectives must focus on communication abilities. This is stored
as the lesson's `communicationObjective`, shown to the learner at the
start of the Situation step (below) — there is no separate "Objective"
step in the real flow.

---

# Real Lesson Step Flow

A published lesson does not use all 11 originally-planned steps. The
actual, consistent flow is **6 steps**, in this fixed order:

## 1. Vocabulary

Taught before the learner meets it in context (deliberately ahead of
Situation/Dialogue). Each word has its Chinese characters, pinyin,
English meaning, part of speech, and 1-3 example sentences, each with its
own audio. The learner is quizzed on each word — question count and mix
scale with the scenario's difficulty (see `points_system.md` Part 1).

## 2. Grammar

Each grammar point includes its meaning, structure, a worked example, and
a common-mistake note, followed by exercises. Grammar is presented before
Situation so the learner recognizes the pattern when they meet it in the
dialogue.

## 3. Situation (includes the dialogue)

Han presents the scene and the lesson's numbered communication goals,
then the full model dialogue between two characters (a waiter and
customer, an interviewer and candidate, etc.) — with real, natural-sounding
generated audio for the whole conversation, seekable like a normal audio
player, plus a tap-to-play button per line.

## 4. Comprehension

Listening comes before reading — the learner hears the full conversation
again first, with the questions and Chinese text held back until they
choose to move on. 5 comprehension questions per lesson, checking real
understanding of the dialogue just heard.

## 5. Speaking

A real in-character AI conversation with Han, built from that lesson's
own scenario, vocabulary, and grammar — not a placeholder. Graded on the
5-metric rubric in `points_system.md` (pronunciation, fluency, accuracy,
complexity, communication effectiveness), gated by how much of the
lesson's target vocabulary was engaged with and how completely the
scenario's objective was met.

## 6. Reflection

The lesson's single graded outcome screen — the weighted 0-100 session
score described in `points_system.md` Part 1 (Vocabulary 20 + Grammar 20
+ Comprehension 30 + Speaking 30, 70/100 to pass).

---

# Content That Exists Outside the Step Flow

**Mission** — each *scenario* (not every lesson) has one mission: a
practical, open-ended real-world task ("order food without help," "explain
a problem") completed as a free AI role-play once its lessons are done.
**Writing** — each lesson can have an attached Write-a-Paragraph writing
task (see `writing_lab.md`), reached through Writing Lab, not as an
in-lesson step. **Quiz** — a short end-of-scenario multiple-choice review
exists in the data model but isn't wired into the current step flow.

---

# Progressive Difficulty

Difficulty increases through:

- More vocabulary.
- More complex grammar.
- Longer conversations.
- Faster speech.
- More cultural context.
- More abstract topics.
- Greater independence.

The learner should always feel challenged but capable.

---

# Relationship With Other Modules

The Learning Journey connects with all other HanGo systems.

## AI Teacher

Provides explanations, support, and personalized guidance.

## Speaking Lab

Provides additional speaking practice.

## Writing Lab

Provides deeper writing development.

## Progress System

Tracks competency growth.

## Student Profile

Stores learning history and preferences.

---

# Completion Philosophy

Completing the Learning Journey does not mean finishing Chinese.

It means reaching a level where the learner can continue improving independently through real communication.

---

# Real Implementation

Reconciled 2026-08-23 against the shipped codebase
(`prisma/schema.prisma`'s `LessonStepType` enum, the `steps: { create:
[...] }` pattern used for every lesson in `prisma/seed.ts`,
`src/components/lesson/lesson-engine.tsx`). The real step flow uses 6 of
the enum's 13 values per lesson (Vocabulary, Grammar, Situation,
Comprehension, Speaking, Reflection — Situation absorbed Dialogue per a
2026-08-06 design decision, documented directly in
`situation-step.tsx`'s own code comments). The remaining enum values
(Objective, Guided Practice, Writing, AI Challenge, Quiz, Mission) exist
in the schema but are either unused, or — for Writing and Mission —
implemented as separate scenario/lesson-attached content rather than
in-lesson steps. The original 11-step design has been rewritten
accordingly; see `points_system.md` for how each graded step contributes
to the lesson's score and `curriculum_structure.md` for the full
chapter/domain/scenario hierarchy.

---

End of document.