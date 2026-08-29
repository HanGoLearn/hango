# HanGo Speaking Lab

Version: 1.1

Status: Official

Last Updated: August 2026

The original "7 practice modes" below described an early, aspirational
design. **"Speaking Practice Modes"** has been rewritten to match the real
shipped structure — see "Real Implementation" at the end.

---

# Purpose

The Speaking Lab is the dedicated environment for developing Chinese speaking ability.

Its purpose is to transform passive knowledge into active communication skills through continuous speaking practice, real-time interaction, and personalized feedback.

The Speaking Lab helps learners move from understanding Chinese to using Chinese naturally.

---

# Core Philosophy

Speaking ability is developed through production.

Knowing vocabulary and grammar does not automatically create speaking ability.

Learners need opportunities to:

- Produce sentences.
- Express ideas.
- Respond spontaneously.
- Adapt to different situations.
- Build confidence.

The Speaking Lab exists to provide those opportunities.

---

# Main Objectives

The Speaking Lab helps learners improve:

- Pronunciation.
- Fluency.
- Speaking confidence.
- Sentence construction.
- Vocabulary usage.
- Grammar application.
- Natural expression.
- Conversational ability.

---

# Speaking Practice Modes (real implementation)

Speaking Lab's home screen offers three entry points, plus every lesson's
own embedded Speaking step. There's no separate "pronunciation drill,"
"interview practice," or "debate practice" screen — those needs are met
through the scenario content itself, at the difficulty appropriate to
where the learner is in the curriculum (a Foundations lesson's Speaking
step is a simple daily exchange; an Advanced Situations lesson's is a job
interview, a debate, or a diplomatic negotiation — see
`curriculum_structure.md`).

## 1. Practice with Han (free topic)

The learner sets their own topic, who Han should be, level, pace, and
correction style, then has a live spoken conversation built around exactly
that. This is the open-ended, self-directed practice surface.

## 2. Shadowing

Two ways to shadow a lesson's real dialogue: turn-by-turn like a chat
(`ConversationShadowing`), or the whole conversation as one continuous
passage with pinyin always shown. **Currently locked behind a Pre-MVP
release gate** — fully built, temporarily hidden (see `project/TASKS.md`).

## 3. Scenario Role Play

Respond in character to a chosen scenario's mission, outside the guided
lesson flow. **Also currently Pre-MVP-locked**, same as Shadowing.

## 4. The lesson's own Speaking step

Every published lesson's Speaking step is a real in-character AI
conversation (not a placeholder) built from that specific lesson's
scenario, vocabulary, and grammar — this is the primary way most learners
encounter Speaking practice, reached automatically as part of the Learning
Journey rather than chosen from Speaking Lab's menu.

---

# Conversation Rules

The AI should:

- Adapt to learner level.
- Encourage longer responses.
- Avoid excessive correction during conversation.
- Provide feedback after the interaction.

The goal is communication first.

---

# Speaking Evaluation System

Speaking performance is evaluated through multiple dimensions.

---

## Pronunciation

Ability to produce understandable Chinese sounds and tones.

---

## Fluency

Ability to speak smoothly without excessive hesitation.

---

## Accuracy

Correct use of grammar and vocabulary.

---

## Complexity

Ability to use increasingly advanced structures.

---

## Communication Effectiveness

Ability to successfully express ideas.

---

# Connection With Competency System

Speaking Lab contributes to the learner's speaking profile.

Progress updates include:

- Speaking confidence.
- Pronunciation.
- Fluency.
- Conversational ability.
- Scenario competence.

---

# Connection With AI Teacher

The AI Teacher supports the Speaking Lab by:

- Explaining mistakes.
- Creating personalized exercises.
- Suggesting practice activities.
- Reviewing performance.

---

# User Experience Principles

The Speaking Lab should feel:

- Safe.
- Encouraging.
- Challenging.
- Realistic.

Learners should feel comfortable making mistakes because mistakes are part of improvement.

---

# Success Definition

The Speaking Lab succeeds when learners become comfortable using Chinese spontaneously in real situations.

The final objective is not perfect speech.

The final objective is confident communication.

---

# Real Implementation

Reconciled 2026-08-23 against the shipped codebase
(`src/components/speaking/speaking-lab-home.tsx`,
`src/components/lesson/steps/speaking-step.tsx`). The Speaking Evaluation
System's 5 metrics above (Pronunciation, Fluency, Accuracy, Complexity,
Communication Effectiveness) are real and match the scored rubric in
`points_system.md`'s Speaking formula exactly. The original 7-mode
enumeration did not match the shipped 3-tile-plus-embedded-step structure
and has been rewritten accordingly.

---

End of document.