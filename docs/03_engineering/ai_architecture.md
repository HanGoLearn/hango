# HanGo AI Architecture

Version: 1.0

Status: Official (audit note added 2026-09-05)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** the "AI Orchestrator" and six named "AI
> Components" (Conversation/Evaluation/Recommendation/Content Generation/
> Simulation/Memory Engine) below don't exist as modules - no
> orchestrator, and no file or component named after any of those engines
> anywhere in the codebase. What's real and does match the doc's
> provider-abstraction intent: `src/lib/ai/index.ts`'s `getAiProvider()`
> factory (OpenAI → Anthropic → Mock fallback chain), mirrored by
> `getTtsProvider()`/`getSttProvider()` - business logic never imports a
> vendor SDK directly. Missing entirely: the real AI-cost-tracking system
> (`src/lib/ai-usage.ts`, added 2026-09-05) - every real paid call across
> ~20 features is logged with an estimated cost, and a per-user daily USD
> cap is enforced, configurable from an admin-only dashboard. See
> `api.md`'s "AI cost tracking" section for the current shape.

---

# Purpose

This document defines the artificial intelligence architecture that powers HanGo.

Artificial Intelligence is the core of the platform.

Rather than acting as a chatbot, AI operates as multiple specialized services working together to deliver a personalized Chinese learning experience.

---

# AI Philosophy

The AI should behave as an intelligent educational ecosystem.

Each AI component has a specific responsibility.

No single AI model should perform every task.

The architecture should allow replacing models without redesigning the application.

---

# High-Level AI Architecture

```
User

↓

Frontend

↓

Backend

↓

AI Orchestrator

↓

Specialized AI Services

↓

Response

↓

Frontend
```

The AI Orchestrator decides which AI service should process every request.

---

# AI Components

HanGo is composed of multiple AI systems.

```
AI Teacher

↓

Conversation Engine

↓

Evaluation Engine

↓

Recommendation Engine

↓

Content Generation Engine

↓

Simulation Engine

↓

Memory Engine
```

Each component has a different responsibility.

---

# AI Teacher

The AI Teacher is the learner's permanent tutor.

Responsibilities:

- Explain grammar.
- Explain vocabulary.
- Answer questions.
- Guide lessons.
- Provide hints.
- Correct mistakes.
- Encourage learners.
- Adapt explanations.

The AI Teacher always knows:

- Current lesson.
- Current scenario.
- Learner level.
- Competencies.
- Previous mistakes.

---

# Conversation Engine

Responsible for natural conversations.

Supports:

- Daily conversations.
- Role play.
- Speaking practice.
- Free conversation.
- Lesson conversations.
- Simulation conversations.

The Conversation Engine prioritizes natural communication over perfect grammar.

---

# Evaluation Engine

Responsible for evaluating learner performance.

Evaluates:

- Speaking.
- Writing.
- Missions.
- Simulations.
- Communication effectiveness.

Produces:

- Scores.
- Feedback.
- Recommendations.

---

# Recommendation Engine

Responsible for personalization.

Inputs:

- Completed lessons.
- Weak competencies.
- Mistakes.
- Review history.
- Learning goals.

Outputs:

- Recommended lessons.
- Recommended reviews.
- Speaking practice.
- Writing practice.
- Simulations.

---

# Content Generation Engine

Responsible for generating educational content.

Possible outputs:

- Dialogues.
- Exercises.
- Missions.
- Quizzes.
- Additional examples.
- Personalized practice.

Content generation must always follow HanGo educational standards.

---

# Simulation Engine

Responsible for realistic communication scenarios.

Supports:

- AI role playing.
- Dynamic conversations.
- Unexpected events.
- Mission evaluation.

Every simulation should feel different.

---

# Memory Engine

Responsible for maintaining learner context.

Stores:

- Current lesson.
- Conversation history.
- Vocabulary mastery.
- Grammar mastery.
- Learning preferences.
- Recent mistakes.

Memory should improve personalization while avoiding unnecessary information retention.

---

# AI Request Flow

Every AI request follows this process.

```
User Request

↓

Authentication

↓

Load Learner Context

↓

Determine AI Service

↓

Generate Response

↓

Evaluate Response

↓

Store Interaction

↓

Return Response
```

---

# Context Loading

Before generating any response, the AI should receive:

User information:

- Current level.
- Current lesson.
- Current scenario.
- Language preference.

Learning information:

- Vocabulary mastered.
- Grammar mastered.
- Weak competencies.
- Review schedule.

Conversation information:

- Previous messages.
- Current activity.

---

# AI Prompt Strategy

Every AI request should contain:

System Context

↓

Educational Context

↓

Lesson Context

↓

Learner Context

↓

User Request

↓

Generation Rules

This ensures consistent educational behavior.

---

# Model Selection

Different AI models may be used for different tasks.

Examples:

Conversation

Large Language Model.

---

Grammar Explanation

Reasoning model.

---

Pronunciation Analysis

Speech model.

---

Writing Evaluation

Language model.

---

Content Generation

Creative language model.

The architecture should allow replacing providers without changing application logic.

---

# AI Provider Abstraction

External AI providers should never be accessed directly by business logic.

All requests pass through the AI Orchestrator.

Benefits:

- Easier provider replacement.
- Better monitoring.
- Cost control.
- Unified prompts.
- Consistent responses.

---

# Personalization

AI responses should adapt according to:

- Learner level.
- Communication competency.
- Lesson progress.
- Learning history.
- Preferred explanation language.

No two learners should receive identical educational experiences.

---

# Cost Optimization

AI requests should minimize unnecessary usage.

Strategies include:

- Prompt optimization.
- Context compression.
- Conversation caching.
- Reuse previous evaluations.
- Select smaller models for simpler tasks.

The system should always balance educational quality with operational cost.

---

# Monitoring

AI services should monitor:

- Response time.
- Success rate.
- Cost.
- User satisfaction.
- Failure rate.

Metrics should support continuous improvement.

---

# Failure Handling

If an AI provider becomes unavailable:

The system should:

- Retry the request.
- Switch providers when available.
- Notify the learner appropriately.
- Preserve the learning session.

AI failures should never cause application failure.

---

# Future Expansion

Future AI services may include:

- AI Debate Partner.
- AI Pronunciation Coach.
- AI Story Generator.
- AI Writing Mentor.
- AI Vocabulary Coach.
- AI Exam Simulator.

New services should integrate through the AI Orchestrator.

---

# Success Definition

The AI Architecture succeeds when every learner experiences intelligent, personalized, reliable, and natural educational support while the underlying AI infrastructure remains modular, scalable, and provider-independent.

---

End of document.