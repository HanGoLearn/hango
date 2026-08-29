# HanGo Writing Lab

Version: 1.1

Status: Official

Last Updated: August 2026

The original "5 levels of writing development" and "5 practice modes"
below described an early, aspirational design. Both sections have been
rewritten to match the real shipped structure — see "Real Implementation"
at the end.

---

# Purpose

The Writing Lab is the dedicated environment for developing Chinese writing ability.

Its purpose is to help learners transform their vocabulary and grammar knowledge into clear, natural, and effective written communication.

The Writing Lab develops the ability to express ideas through Chinese writing in real-world contexts.

---

# Core Philosophy

Writing is not only about grammatical correctness.

Good writing requires:

- Clear ideas.
- Appropriate vocabulary.
- Natural expressions.
- Logical organization.
- Cultural awareness.

HanGo Writing Lab focuses on developing communication through writing rather than simply correcting mistakes.

---

# Main Objectives

The Writing Lab helps learners improve:

- Sentence construction.
- Grammar accuracy.
- Vocabulary usage.
- Writing fluency.
- Text organization.
- Natural expression.
- Formal and informal writing styles.

---

# Writing Lab Structure (real implementation)

Writing Lab's home screen offers three options, not a five-level ladder or
five separate modes:

## 1. Write a Paragraph — handwritten, leveled, photo-graded

The learner picks a level — **Basic** (~5–6 lines, ~60-90 characters),
**Intermediate** (~6–20 lines, ~90-300 characters), or **Advanced**
(20+ lines, 300+ characters) — and a topic (currently Family, Daily
Routine, or Shopping, each phrased differently per level). The learner
writes the paragraph **by hand on paper**, photographs it (1-3 photos for
longer Advanced submissions), and uploads it.

A vision-capable AI model (`gpt-5-mini`) transcribes the handwriting,
flags specific malformed or illegible characters (up to 8, with what's
wrong), and grades it against a level-specific weighted rubric:

| Level | Rubric dimensions (weight) |
|---|---|
| Basic | Legibility (25%), Topic & length (20%), Sentence construction (20%), Grammar (15%), Vocabulary (10%), Clarity (10%) |
| Intermediate | Legibility (20%), Topic development (15%), Grammar variety (20%), Vocabulary precision (15%), Cohesion/transitions (20%), Naturalness (10%) |
| Advanced | Legibility (15%), Content depth (15%), Complex grammar (20%), Lexical precision/register (20%), Organization (20%), Style (10%) |

Honest limit: a static photo can confirm a character's final form is
correct, but **cannot verify stroke order** — that requires watching the
writing happen, not just the result.

## 2. Translation Challenge

A standalone pool of ~15 topic-diverse texts. The learner translates one
into Chinese; grading checks meaning accuracy against a hidden reference
translation while still accepting any other natural, correct phrasing —
not a word-for-word match.

## 3. Custom Writing

The learner defines their own topic, level, format, and tone in plain
language, and gets graded against exactly what they asked for — an
ephemeral prompt, not drawn from a fixed catalog.

---

# AI Writing Feedback

**Translation Challenge and Custom Writing** (typed text) are scored on 4
dimensions, 0-100 each: **Grammar**, **Vocabulary**, **Naturalness**
(does it sound like real Chinese, not a textbook), and **Communication
Clarity** (for Translation Challenge specifically, how accurately the
meaning matches the source text). Every grading pass also returns a
corrected version and a short list of the specific changes made.

**Write a Paragraph** (handwritten) uses the richer, level-specific
rubric described above instead — Organization and Style only appear as
named dimensions at the Advanced level, not as universal categories every
submission is graded on.

---

# Correction Philosophy

Corrections should teach.

The AI should not simply replace the learner's writing with a perfect version.

The learner should understand:

- What was wrong.
- Why it was wrong.
- How to improve.

---

# Difficulty Progression

Writing difficulty increases through:

- Longer texts.
- More complex grammar.
- More abstract topics.
- More formal vocabulary.
- Greater independence.

---

# Connection With Learning Journey

Writing activities should reinforce scenarios.

Example:

Scenario:

Job Interview.

Writing practice:

Create a professional self-introduction.

Scenario:

Restaurant.

Writing practice:

Write a review of a restaurant.

---

# Connection With AI Teacher

The AI Teacher supports Writing Lab by:

- Explaining corrections.
- Providing examples.
- Suggesting improvements.
- Creating personalized writing exercises.

---

# Connection With Competency System

Writing Lab updates:

- Writing accuracy.
- Vocabulary range.
- Grammar control.
- Expression ability.
- Formal writing ability.

---

# Success Definition

The Writing Lab succeeds when learners can express their thoughts naturally and effectively in Chinese writing.

The goal is not perfect academic writing.

The goal is confident written communication.

---

# Real Implementation

Reconciled 2026-08-23 against the shipped codebase
(`src/components/writing/writing-lab-home.tsx`,
`src/lib/handwritten-writing.ts`, `src/lib/writing-feedback.ts`). The
original 5-level writing-development ladder and 5 separate practice modes
did not match the shipped 3-option structure and have been rewritten
accordingly. Write a Paragraph's handwritten/photo/leveled-rubric design
is new (2026-08-23) — it replaced an earlier, lesson-scoped typed-text
version of the same feature.

---

End of document.