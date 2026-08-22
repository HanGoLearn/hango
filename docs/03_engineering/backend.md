# HanGo Backend Architecture

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the backend architecture of HanGo.

The backend is responsible for coordinating all platform services, managing educational logic, communicating with AI providers, storing learner progress, and serving educational content.

The backend is the central orchestration layer of HanGo.

---

# Backend Philosophy

The backend should be:

- Modular.
- Scalable.
- Secure.
- Stateless whenever possible.
- Easy to maintain.
- AI-ready.

Business logic should always reside in the backend rather than the frontend.

---

# Core Responsibilities

The backend manages:

- Authentication.
- User profiles.
- Learning progression.
- Educational content.
- AI Teacher.
- Speaking evaluations.
- Writing evaluations.
- Progress tracking.
- Recommendations.
- Notifications.

---

# Backend Modules

HanGo is divided into independent backend modules.

```
Authentication

↓

User Management

↓

Learning Engine

↓

Content Engine

↓

Assessment Engine

↓

Progress Engine

↓

AI Engine

↓

Audio Engine

↓

Notification Engine

↓

Analytics Engine
```

---

# Authentication Module

Responsibilities:

- User login.
- Registration.
- Session management.
- Permission validation.
- OAuth integration.

The module should never contain educational logic.

---

# User Management Module

Responsible for:

- User profile.
- Preferences.
- Learning goals.
- Language settings.
- Subscription status.

---

# Learning Engine

Responsible for:

- Learning Journey.
- Lesson progression.
- Unlock rules.
- Recommendations.
- Review scheduling.

This module controls how learners move through HanGo.

---

# Content Engine

Responsible for:

- Lessons.
- Vocabulary.
- Grammar.
- Dialogues.
- Exercises.
- Missions.
- Quizzes.

The engine retrieves educational content according to learner context.

Educational content should remain independent from application logic.

---

# Assessment Engine

Responsible for:

- Quiz evaluation.
- Mission evaluation.
- Competency updates.
- Mastery calculations.
- Progress scoring.

---

# Progress Engine

Responsible for:

- Learning Journey updates.
- Competency profile.
- Vocabulary mastery.
- Grammar mastery.
- Achievement tracking.
- Learning statistics.

---

# AI Engine

The AI Engine coordinates every AI interaction.

Responsibilities:

- AI Teacher conversations.
- Grammar explanations.
- Vocabulary explanations.
- Exercise generation.
- Lesson recommendations.
- Writing corrections.
- Speaking evaluations.
- Personalized tutoring.

The AI Engine communicates with external AI providers.

---

# Audio Engine

Responsible for:

- Text-to-Speech.
- Speech-to-Text.
- Pronunciation analysis.
- Audio playback management.
- Voice generation.

The backend normalizes audio requests before sending them to external providers.

---

# Notification Engine

Responsible for:

- Study reminders.
- Review reminders.
- Achievement notifications.
- Learning streaks.
- AI recommendations.

Notifications should always support learning objectives.

---

# Analytics Engine

Responsible for:

- Learning analytics.
- Completion rates.
- Common learner mistakes.
- AI usage.
- Feature usage.
- Educational effectiveness.

Analytics should improve the platform without affecting learner privacy.

---

# Request Flow

Typical request flow:

```
Frontend

↓

API

↓

Authentication

↓

Business Module

↓

Database

↓

External Services (if needed)

↓

Response

↓

Frontend
```

Every request should follow a predictable lifecycle.

---

# Error Handling

The backend should:

- Validate input.
- Return meaningful errors.
- Log unexpected failures.
- Prevent application crashes.
- Never expose internal system information.

Errors should always be recoverable whenever possible.

---

# Background Jobs

Long-running operations should execute asynchronously.

Examples:

- AI content generation.
- Audio generation.
- Progress recalculation.
- Notifications.
- Report generation.

Background processing should not block the user experience.

---

# Caching

Frequently accessed data should be cached.

Examples:

- Lessons.
- Vocabulary.
- Grammar explanations.
- User preferences.
- Dashboard summaries.

Caching should reduce latency and external API costs.

---

# Logging

The backend should log:

- Errors.
- API requests.
- AI requests.
- Performance metrics.
- Security events.

Logs should support debugging without exposing sensitive learner information.

---

# Scalability

The backend should support future expansion.

Future modules may include:

- Community.
- Teacher Portal.
- Course Marketplace.
- Multiple Languages.
- Enterprise Learning.
- Classroom Management.

The architecture should allow adding new modules without major refactoring.

---

# Security Responsibilities

The backend is responsible for:

- Authentication validation.
- Authorization.
- Input validation.
- Rate limiting.
- API protection.
- Secure data access.

Security should be enforced centrally.

---

# Success Definition

The Backend Architecture succeeds when it provides a reliable, scalable, and maintainable foundation capable of supporting millions of learning interactions while keeping educational logic centralized and AI services efficiently integrated.

---

End of document.