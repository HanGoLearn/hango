# HanGo Review System

Version: 1.0

Status: Official

Last Updated: August 2026

> **2026-09-05 audit note:** this document describes a personalized,
> spaced-repetition review system with forgetting-pattern detection and
> Simulation/Mission review - largely aspirational. The Simulation Engine
> it references was never built (see `simulation_engine.md`). The real
> system (`src/lib/review-data.ts`) builds a queue of at most 2 items each
> from 4 fixed types (Vocabulary, Grammar, Mistake, Dialogue) using a flat
> time-based cooldown, with no spaced-repetition algorithm or per-learner
> adaptivity.

---

# Purpose

The Review System ensures that previously learned knowledge remains active over time.

Language acquisition requires repeated exposure, meaningful practice, and periodic reinforcement.

HanGo does not consider a lesson permanently learned after completion.

Instead, learning is viewed as a continuous process of strengthening long-term communication ability.

---

# Educational Philosophy

Learning Chinese is not about completing lessons.

It is about retaining the ability to communicate.

Review should be:

- Personalized.
- Continuous.
- Efficient.
- Contextual.
- Communication-focused.

The learner should review what is most likely to be forgotten rather than reviewing everything equally.

---

# Review Objectives

The Review System aims to:

- Strengthen long-term memory.
- Prevent vocabulary loss.
- Reinforce grammar.
- Improve communication fluency.
- Maintain pronunciation.
- Increase learner confidence.

---

# Review Sources

Review activities may include:

- Vocabulary.
- Grammar.
- Dialogues.
- Listening.
- Reading.
- Speaking.
- Writing.
- Missions.
- Simulations.

Every completed lesson becomes eligible for future review.

---

# Review Triggers

Review sessions may be triggered by:

- Time since last practice.
- Low assessment scores.
- Frequent mistakes.
- AI Teacher recommendations.
- Learner request.
- Learning Journey milestones.

---

# Personalized Review

Every learner receives a unique review schedule.

The AI Teacher considers:

- Vocabulary mastery.
- Grammar mastery.
- Communication competency.
- Lesson history.
- Simulation performance.
- Quiz performance.
- Speaking performance.
- Writing performance.

No two learners should receive identical review sessions.

---

# Types of Review

## Vocabulary Review

Focuses on:

- Recognition.
- Recall.
- Pronunciation.
- Usage.
- Collocations.

---

## Grammar Review

Focuses on:

- Structure.
- Usage.
- Accuracy.
- Comparison with similar grammar.
- Production.

---

## Dialogue Review

Learners revisit previous conversations.

Activities include:

- Listening again.
- Shadowing.
- Role-play.
- AI continuation.

---

## Speaking Review

The AI generates conversations using previously learned content.

Learners practice speaking naturally.

---

## Writing Review

The AI generates writing prompts using familiar grammar and vocabulary.

---

## Mission Review

Learners repeat previous missions with:

- Different dialogue paths.
- Different AI behavior.
- Higher difficulty.
- New communication challenges.

---

# Adaptive Review

The AI Teacher continuously adjusts review difficulty.

Possible adaptations include:

- Faster speech.
- Richer vocabulary.
- Longer conversations.
- Fewer hints.
- More abstract topics.

---

# Review Sessions

Each review session should be:

- Short.
- Focused.
- Goal-oriented.
- Practical.

Recommended duration:

5–15 minutes.

---

# Review Frequency

Review frequency depends on learner performance.

Examples:

High mastery

↓

Less frequent review.

---

Low mastery

↓

More frequent review.

The objective is efficient learning rather than unnecessary repetition.

---

# Review Recommendations

After every lesson, quiz, mission, or simulation, the AI Teacher may recommend:

- Vocabulary review.
- Grammar review.
- Speaking practice.
- Writing practice.
- Dialogue replay.
- Simulation retry.

Recommendations should always have a clear educational purpose.

---

# AI Teacher Responsibilities

The AI Teacher should:

- Detect forgetting patterns.
- Recommend timely review.
- Personalize review content.
- Increase or decrease difficulty.
- Encourage consistency.

The AI should actively help learners maintain previously acquired knowledge.

---

# Progress Integration

Review performance updates:

- Vocabulary mastery.
- Grammar mastery.
- Communication competency.
- Learning Journey.
- Progress Dashboard.

Strong review performance reinforces learner competency over time.

---

# Design Principles

Every review activity should be:

- Personalized.
- Efficient.
- Contextual.
- Motivating.
- Communication-focused.

Learners should always understand why a review has been recommended.

---

# Success Definition

The Review System succeeds when learners retain and confidently use previously learned Chinese over long periods rather than forgetting content after completing lessons.

---

End of document.