# HanGo Lesson Creation Pipeline

Version: 1.0

Status: Aspirational — not implemented (2026-09-05 audit)

Last Updated: August 2026

> **This 10-stage pipeline does not exist as an operational system.** Real
> lessons are written directly as TypeScript data in `prisma/seed.ts`'s
> `createFullLesson()` calls - no separate authoring tool, review queue, or
> staged pipeline runs between writing content and it being live. See
> `01_content_principles.md`'s audit note for the same finding in more
> detail, including the 2026-08-14 removal of the one real AI-generation
> fallback this project ever had. Keep this document as a design reference,
> not as a description of how a lesson actually gets made today.

---

# Purpose

This document defines the process used to create every learning unit inside HanGo.

The objective is to ensure that every lesson follows the same educational standards, maintains consistency across levels, and contributes directly to the learner's communication competency.

---

# Creation Philosophy

A HanGo lesson is designed around communication.

The process does not begin with vocabulary lists or grammar rules.

It begins with a question:

"What should the learner be able to do after completing this lesson?"

The creation process follows:

```
Communication Goal

↓

Scenario

↓

Learning Objectives

↓

Learning Objects

↓

Practice

↓

Mission

↓

Evaluation

```

---

# Lesson Creation Stages

Every lesson passes through the following stages:

```
1. Define Learning Goal

↓

2. Define Scenario

↓

3. Define Competencies

↓

4. Select Language Content

↓

5. Build Learning Objects

↓

6. Create Practice Activities

↓

7. Create Communication Mission

↓

8. Create Assessment

↓

9. Validate Content

↓

10. Publish Lesson

```

---

# Stage 1: Define Learning Goal

Every lesson must have a clear communication outcome.

The objective must describe an ability, not a topic.

Incorrect:

"Learn restaurant vocabulary."

Correct:

"Order food, ask questions about ingredients, and make requests politely in a restaurant."

---

# Stage 2: Define Scenario

Every lesson belongs to a realistic situation.

Examples:

Daily Life:

- Restaurant.
- Shopping.
- Transportation.
- Health.

Professional:

- Interview.
- Meeting.
- Negotiation.

Academic:

- Presentation.
- Discussion.
- Research.

The scenario determines the vocabulary, grammar, dialogue, and mission.

---

# Stage 3: Define Competencies

Each lesson must specify which competencies it develops.

Possible competencies:

## Listening

Understanding spoken Chinese.

## Speaking

Producing meaningful communication.

## Reading

Understanding written Chinese.

## Writing

Producing written Chinese.

## Vocabulary

Acquiring and using words.

## Grammar

Applying structures naturally.

## Cultural Understanding

Understanding appropriate communication behavior.

---

# Stage 4: Select Language Content

Language content is selected according to the communication goal.

Includes:

- Vocabulary.
- Grammar.
- Expressions.
- Sentence patterns.
- Cultural notes.

Content must be useful for completing the scenario.

---

# Stage 5: Build Learning Objects

All lesson components must follow the HanGo Learning Object Model.

Possible objects:

- Vocabulary Object.
- Grammar Object.
- Dialogue Object.
- Exercise Object.
- Listening Object.
- Speaking Object.
- Writing Object.
- Mission Object.
- Quiz Object.

Each object must have:

- Purpose.
- Difficulty.
- Relationship with the lesson objective.
- Evaluation method.

---

# Stage 6: Create Practice Activities

Practice must move progressively from understanding to communication.

Required progression:

```
Recognition

↓

Controlled Practice

↓

Guided Production

↓

Independent Production

```

Examples:

Recognition:

Identify vocabulary.

Controlled Practice:

Complete sentences.

Guided Production:

Create responses with support.

Independent Production:

Communicate freely.

---

# Stage 7: Create Communication Mission

Every lesson ends with practical application.

The mission must require the learner to use the lesson content.

Requirements:

- Realistic scenario.
- Clear objective.
- Relevant vocabulary.
- Relevant grammar.
- Communication challenge.

The learner should feel they accomplished something useful.

---

# Stage 8: Create Assessment

Assessment verifies whether the learner achieved the lesson objective.

Assessment may include:

- Quiz.
- Speaking evaluation.
- Writing evaluation.
- Mission performance.

The assessment should measure practical ability.

---

# Stage 9: Validate Content

Before publishing, every lesson must be reviewed.

Validation includes:

Language:

- Correct Chinese.
- Natural expressions.
- Appropriate difficulty.

Pedagogy:

- Clear objective.
- Logical progression.
- Effective practice.

Experience:

- Engaging.
- Useful.
- Motivating.

---

# Stage 10: Publish Lesson

A lesson becomes available only after passing validation.

Published lessons must contain:

- Complete learning objects.
- Audio.
- Exercises.
- Mission.
- Assessment.
- AI Teacher support.

---

# AI-Assisted Creation

AI may assist with:

- Generating examples.
- Creating dialogues.
- Creating exercises.
- Suggesting variations.
- Creating additional practice.

However, AI-generated content must always follow HanGo standards.

---

# Content Reusability

Every learning object should be reusable.

Examples:

Vocabulary:

Can appear in future reviews.

Grammar:

Can appear in advanced contexts.

Dialogues:

Can become speaking simulations.

Exercises:

Can become adaptive practice.

Missions:

Can be repeated with increased difficulty.

---

# Lesson Consistency

All HanGo lessons should maintain:

- Similar structure.
- Progressive difficulty.
- Consistent terminology.
- Consistent evaluation.

The learner should always understand how HanGo lessons work.

---

# Success Definition

The Lesson Creation Pipeline succeeds when HanGo can consistently create high-quality lessons at scale while maintaining the educational philosophy of competency-based Chinese learning.

---

End of document.