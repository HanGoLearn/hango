# HanGo AI Teacher

Version: 1.1

Status: Official

Last Updated: August 2026

This document originally described an early, aspirational design. **"Main
Modes"**, **"AI Teacher Interface"**, and **"Future Capabilities"** below
have been rewritten to match what's actually shipped — real-time voice
conversation, in particular, was listed as a future capability but has
existed and worked since Phase F (see `project/TASKS.md`). See "Real
Implementation" at the end of this document for the reconciliation.

---

# Purpose

The AI Teacher is the intelligent educational companion that supports learners throughout the entire HanGo experience.

Its purpose is to provide personalized instruction, explanations, feedback, practice, and guidance based on each learner's progress.

The AI Teacher is not a simple chatbot.

It is designed to behave as a personal Chinese teacher available at any moment.

---

# Core Philosophy

Artificial Intelligence should not replace the learning process.

It should enhance it.

The AI Teacher exists to:

- Explain concepts clearly.
- Adapt difficulty.
- Identify weaknesses.
- Provide additional practice.
- Encourage communication.
- Correct mistakes.
- Recommend learning actions.

Every interaction should contribute to the learner's improvement.

---

# Main Characteristics

The AI Teacher should be:

## Personalized

The AI Teacher understands the learner's history.

It knows:

- Current level.
- Learning goals.
- Completed lessons.
- Common mistakes.
- Vocabulary knowledge.
- Grammar weaknesses.
- Speaking ability.
- Writing ability.
- Preferred explanation language.

The AI Teacher should avoid treating every learner identically.

---

## Context-Aware

The AI Teacher understands where the learner is inside HanGo.

Examples:

If the learner is studying a Restaurant scenario:

The AI Teacher can explain vocabulary related to ordering food.

If the learner is practicing 把 grammar:

The AI Teacher can create examples using previously learned vocabulary.

If the learner struggles with pronunciation:

The AI Teacher can provide targeted speaking practice.

---

## Available Everywhere

The AI Teacher should always be accessible throughout the platform.

The learner should be able to open it from any section:

- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.
- Vocabulary pages.
- Grammar pages.

The AI Teacher is a permanent companion.

---

# AI Teacher Interface (real implementation)

Han lives as a floating bubble available on every authenticated page — not
a side panel, a non-modal dialog (Radix `Dialog`, `modal={false}`) that
stays open across navigation. It has two response modes the learner picks
in Settings:

- **Text and Audio** — a normal chat, with each reply optionally read aloud.
- **Audio only** — the default; the assistant's own text bubble is hidden
  and every reply autoplays, matching a real spoken-conversation feel more
  than a chat log. Han's voice is fixed to a single voice ("cedar"),
  chosen for sounding the most natural in testing.

For a fuller, hands-free experience, Han also supports **live two-way
voice conversation** — the learner speaks, Han responds by voice in real
time, no typing or tapping "play" required (`han-voice-conversation.tsx`,
`app/api/han/realtime`).

---

# Main Modes (real implementation)

Rather than the numbered list of six separate "modes" originally planned
here, Han operates as one continuous chat/voice assistant whose behavior
adapts to what the learner is doing and asking — the underlying
capabilities below are all real and available through that single
interface, not separate screens the learner switches between.

**Tutoring and explanation** — the learner can ask Han to explain any
grammar point, vocabulary word, or "why" question ("Why is 了 used here?",
"What's the difference between 刚 and 刚才?") in Chinese, English, or
Spanish, and Han answers at the learner's level.

**Conversation partner** — inside a lesson's Speaking step, or in Speaking
Lab's "Practice with Han" free-topic mode, Han holds a real in-character
conversation (a waiter, an interviewer, a friend, etc.) built from the
scenario's own context, not a generic chat.

**Correction and feedback** — after a Speaking or Writing attempt, Han's
feedback covers grammar, vocabulary use, naturalness, and (for Speaking)
pronunciation and fluency, graded against the same rubric documented in
`points_system.md`.

**Context-awareness** — Han knows which page/lesson the learner is on, the
lesson's own vocabulary/grammar/dialogue content when relevant, and the
learner's real earned progress (see "Student Memory" below) — this
replaces the originally-planned separate "Study Planning Mode": asking Han
"what should I study today" or "why am I struggling with X" is answered
from this same real context, not a distinct mode.

---

# Language Behavior

The AI Teacher should communicate according to learner needs.

Possible languages:

- Chinese.
- English.
- Spanish.

The learner can request:

"Explain this in English."

"Explain this in Chinese."

"Use only Chinese."

The AI Teacher adapts accordingly.

---

# Teaching Behavior

The AI Teacher should follow these rules:

## Encourage production

The learner should actively use Chinese.

The AI Teacher should not always provide the answer immediately.

---

## Explain according to level

Beginner explanations should be simple.

Advanced explanations should include nuance and cultural context.

---

## Correct strategically

Not every mistake requires interruption.

The AI Teacher should prioritize:

- Important grammar errors.
- Repeated mistakes.
- Errors that affect communication.

---

## Maintain Motivation

The AI Teacher should recognize progress.

Feedback should be constructive.

The learner should feel guided, not judged.

---

# Student Memory (real implementation)

Han's most precise signal of real ability is the learner's earned
**General Level** score (0-2000, see `points_system.md`) and its HSK
equivalent — this takes precedence over the learner's self-reported level
from onboarding whenever the two disagree, since it's evidence-based
rather than declared. A brand-new learner with 0 points still gets the
simplest possible Chinese by default, regardless of what they self-reported.

Alongside that, the profile carries: completed scenarios, demonstrated
competency band, recent accuracy, strengths and focus areas (from real
Progress data), and the learner's chosen explanation language. Deliberately
excluded from anything sent to the AI provider: name, email, or any other
account-identifying field — only pedagogical state.

---

# Integration With HanGo

The AI Teacher connects with every major module.

## Learning Journey

Explains lessons and provides support.

## Speaking Lab

Evaluates speaking and provides feedback.

## Writing Lab

Corrects writing and suggests improvements.

## Progress System

Uses performance data to recommend actions.

---

# Future Capabilities

Voice conversation and real-time speaking feedback are already live (see
above) — not future work. What's still genuinely planned:

- Advanced, per-sound pronunciation analysis (today's Speaking feedback is
  a 5-metric AI rubric — pronunciation, fluency, accuracy, complexity,
  communication effectiveness — not phoneme-level diagnostics).
- Personalized lesson generation.
- Cultural coaching.
- AI-generated learning plans.

---

# Success Definition

The AI Teacher succeeds when learners feel they have a knowledgeable Chinese teacher available whenever they need guidance.

The learner should never feel alone during the learning journey.

---

# Real Implementation

Reconciled 2026-08-23 against the shipped codebase. The floating-bubble UI,
Text/Audio-only response modes, live two-way voice conversation, and the
General-Level-as-authoritative-signal rule are all real and verified —
`src/components/shell/ai-teacher-bubble.tsx`,
`src/components/ai-teacher/han-voice-conversation.tsx`,
`app/api/han/realtime/route.ts`, `src/lib/ai-context.ts`. The original
six-mode enumeration above did not match the shipped single-interface
design and has been rewritten accordingly.

---

End of document.