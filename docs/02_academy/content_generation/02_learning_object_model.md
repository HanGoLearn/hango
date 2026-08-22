# HanGo Learning Object Model (HLOM)

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

The HanGo Learning Object Model (HLOM) defines the standard structure for every educational resource used inside HanGo.

Every lesson, dialogue, vocabulary item, grammar explanation, simulation, assessment, and AI interaction is built using this common model.

The objective is consistency, scalability, and interoperability across the entire platform.

---

# Philosophy

Educational content should not exist as isolated pages.

Instead, every element should be part of an interconnected learning ecosystem.

Each learning object knows:

- What it teaches.
- Why it exists.
- What it depends on.
- What it unlocks.
- Which competencies it develops.

---

# Hierarchy

```
Level

↓

Domain

↓

Scenario

↓

Lesson

↓

Learning Object

↓

Activity
```

Every component inherits context from the level above it.

---

# Learning Object Structure

Every learning object contains the following sections.

---

## Metadata

General information.

Examples:

- ID
- Title
- Description
- Version
- Author
- Creation date
- Last updated

---

## Educational Information

Defines why the object exists.

Includes:

- Learning objective
- Communication objective
- Difficulty
- Estimated duration
- HSK reference
- Competencies developed

---

## Prerequisites

Defines previous knowledge required.

Examples:

Vocabulary:

预约

Grammar:

把

Scenario:

Restaurant Level 1

---

## Vocabulary

Vocabulary introduced.

Each entry includes:

- Characters
- Pinyin
- Meaning
- Part of speech
- Frequency
- Example sentence
- Audio
- Related words

---

## Grammar

Grammar structures used.

Each grammar point contains:

- Pattern
- Usage
- Explanation
- Examples
- Common mistakes
- Related grammar

---

## Functional Expressions

Natural expressions.

Examples:

不好意思……

麻烦你……

可以帮我……吗？

These are treated separately from grammar.

---

## Dialogue

Dialogue information.

Includes:

- Participants
- Context
- Audio
- Transcript
- Translation
- Speaking speed

---

## Activities

Every activity references:

- Target vocabulary
- Target grammar
- Target competency
- Difficulty
- Expected outcome

Activities may include:

Listening

Speaking

Writing

Reading

AI Conversation

Simulation

Quiz

---

## Mission

Defines the practical communication challenge.

Includes:

Goal

Success conditions

Difficulty

Evaluation criteria

---

## Assessment

Defines how learner performance is measured.

Includes:

Listening

Speaking

Writing

Grammar

Vocabulary

Communication success

---

## AI Instructions

Special instructions for the AI Teacher.

Examples:

Explain using English.

Create two additional examples.

Avoid introducing grammar above learner level.

Generate follow-up questions.

---

## Review Information

Supports long-term retention.

Includes:

Review interval

Review priority

Related lessons

Future scenarios

---

# Relationships

Learning Objects are interconnected.

Example:

Grammar

↓

Referenced by

Dialogue

↓

Referenced by

Speaking Activity

↓

Referenced by

Simulation

↓

Referenced by

Assessment

Nothing exists in isolation.

---

# Benefits

The Learning Object Model provides:

- Consistency
- Reusability
- Easier AI generation
- Easier maintenance
- Better analytics
- Personalized learning
- Faster content creation

---

# Future Expansion

Future versions may include:

- Multiple dialect support
- Video resources
- Community content
- Teacher-created content
- Marketplace content

All future resources must follow the Learning Object Model.

---

# Success Definition

The Learning Object Model succeeds when every educational resource inside HanGo can be created, understood, reused, and improved using a single consistent structure.

---

End of document.