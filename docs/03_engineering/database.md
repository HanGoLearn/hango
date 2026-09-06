# HanGo Database Architecture

Version: 1.0

Status: Official

Last Updated: August 2026

> **2026-09-05 audit note:** the generic "six domains" framing isn't
> contradicted by anything real (the schema has grown to ~65 models across
> many more areas than that, but no specific count was claimed here to be
> wrong). Entirely silent on the real connection setup worth knowing:
> `src/lib/db.ts` uses the `@prisma/adapter-pg` driver adapter with
> `max: 20` pooled connections (raised from `pg`'s default of 10 on
> 2026-08-30 after observed contention), and the database is currently
> reached via Prisma Postgres's **direct**, unpooled endpoint rather than
> its pooled one - a known, not-yet-applied optimization for the app's
> serverless deployment shape (see `project/db-operations-optimization.md`
> for detail).

---

# Purpose

This document defines the database architecture of HanGo.

The database stores all persistent information required by the platform while keeping educational content, user progress, AI interactions, and application data organized and scalable.

The database should support long-term growth without requiring structural redesign.

---

# Database Philosophy

The database should be:

- Normalized.
- Scalable.
- Modular.
- Consistent.
- Secure.
- Optimized for reading and writing.

Educational content and user data should remain independent.

---

# Core Database Domains

The database is divided into six major domains.

```
Authentication

↓

Users

↓

Learning

↓

Content

↓

AI

↓

System
```

---

# Authentication Domain

Responsible for identity management.

Main entities:

- Users
- Accounts
- Sessions
- OAuth Providers
- Verification Tokens

Responsibilities:

- Login
- Registration
- Authentication
- Session validation

---

# User Domain

Stores learner information.

Entities:

- User Profile
- Preferences
- Subscription
- Learning Settings
- Language Settings
- Notifications

Examples:

Preferred language

Daily goal

Learning streak

Timezone

Current level

---

# Learning Domain

Tracks learner progression.

Entities:

- Learning Journey
- Current Lesson
- Completed Lessons
- Scenario Progress
- Competency Progress
- Review Schedule

The Learning Domain represents the learner's educational state.

---

# Content Domain

Stores all educational resources.

Entities:

- Levels
- Domains
- Scenarios
- Lessons
- Vocabulary
- Grammar
- Dialogues
- Exercises
- Speaking Activities
- Writing Activities
- Missions
- Quizzes

Content should be reusable across multiple lessons whenever possible.

---

# Assessment Domain

Stores learner evaluations.

Entities:

- Quiz Attempts
- Mission Attempts
- Speaking Evaluations
- Writing Evaluations
- Simulation Results
- Assessment Reports

Historical records should never be overwritten.

---

# AI Domain

Stores AI-related information.

Entities:

- AI Conversations
- Conversation Context
- AI Feedback
- Personalized Recommendations
- Generated Exercises
- Generated Dialogues

The AI Domain supports personalization and continuity.

---

# Audio Domain

Stores audio metadata.

Entities:

- Audio Files
- Pronunciation Recordings
- Voice Models
- Audio Transcriptions

Large audio files should be stored externally.

Only metadata should remain inside the database.

---

# Analytics Domain

Stores learning metrics.

Entities:

- Study Sessions
- Daily Activity
- Time Spent
- Lesson Completion
- Speaking Time
- Writing Time
- AI Usage

Analytics should improve personalization without exposing private learner information.

---

# System Domain

Stores application configuration.

Entities:

- Feature Flags
- System Settings
- AI Configuration
- Supported Languages
- Application Versions

---

# Entity Relationships

Example hierarchy:

```
User

↓

Learning Journey

↓

Scenario

↓

Lesson

↓

Activities

↓

Assessment

↓

Competency Update
```

Every educational interaction contributes to learner progress.

---

# Content Relationships

Educational content should remain interconnected.

Example:

Vocabulary

↓

Grammar

↓

Dialogue

↓

Exercise

↓

Mission

↓

Quiz

↓

Simulation

Each object may be reused across multiple lessons.

---

# AI Relationships

The AI Teacher should access:

User

↓

Current Lesson

↓

Current Scenario

↓

Vocabulary Mastery

↓

Grammar Mastery

↓

Conversation History

↓

Recommendations

The AI should always understand learner context before generating responses.

---

# Data Integrity

The database should enforce:

- Primary keys.
- Foreign keys.
- Referential integrity.
- Cascade rules where appropriate.
- Soft deletion for educational records.

No orphan records should exist.

---

# Performance Strategy

The database should support:

- Efficient indexing.
- Pagination.
- Optimized joins.
- Read-heavy educational queries.
- Fast learner progress retrieval.

Performance should remain stable as the platform grows.

---

# Backup Strategy

Regular backups should include:

- User data.
- Learning progress.
- Educational content.
- AI history.

Backups should be automated and periodically verified.

---

# Security

Sensitive information should be protected.

Examples:

Passwords

Refresh Tokens

OAuth Credentials

Subscription Information

Personally Identifiable Information

Sensitive data should never be stored in plain text.

---

# Future Expansion

The database should support future features.

Examples:

- Multiple languages.
- Community discussions.
- Teacher Portal.
- Classroom Management.
- Marketplace.
- Certificates.
- Live Classes.

Expansion should require minimal structural changes.

---

# Success Definition

The Database Architecture succeeds when HanGo can reliably store educational content, learner progress, AI interactions, and platform data while remaining scalable, secure, and maintainable throughout the platform's growth.

---

End of document.