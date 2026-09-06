# HanGo Frontend Architecture

Version: 1.0

Status: Official

Last Updated: August 2026

> **2026-09-05 audit note:** too abstract to check against real code - no
> mention of Next.js App Router, React Server/Client Components, or
> `src/components/`'s real organization. Its linear "Frontend Structure"
> and "Navigation" lists also omit entire shipped route groups/features
> (leaderboard, shop, achievements, placement exam, Welcome to Chinese,
> the admin dashboard) - see `docs/01_product/navigation.md` for the real
> current nav, and `architecture.md` (completed 2026-09-05) for the
> concrete stack.

---

# Purpose

This document defines the frontend architecture of HanGo.

The frontend is responsible for delivering a fast, intuitive, and immersive learning experience while integrating seamlessly with AI-powered features.

Its primary objective is to allow learners to focus on learning Chinese rather than learning how to use the application.

---

# Frontend Philosophy

The frontend should feel:

- Fast.
- Clean.
- Modern.
- Educational.
- Interactive.
- AI-first.

Every screen should reduce cognitive load and maximize learning efficiency.

---

# Core Principles

## Simplicity

Interfaces should present only the information necessary for the current learning activity.

Avoid unnecessary buttons and distractions.

---

## Consistency

Every page should follow the same visual language.

Navigation, spacing, typography, colors, and interactions should remain consistent throughout the platform.

---

## AI Always Available

The AI Teacher is a permanent part of the experience.

Regardless of the page the learner is visiting, the AI Teacher should always be accessible.

The learner should never need to leave the current lesson to ask a question.

---

## Mobile First

Every interface should function correctly on:

- Desktop.
- Laptop.
- Tablet.
- Mobile devices.

The learning experience should remain consistent across all screen sizes.

---

# Frontend Structure

The application is organized into feature modules.

```
Application

↓

Authentication

↓

Dashboard

↓

Learning Journey

↓

Lesson

↓

Speaking Lab

↓

Writing Lab

↓

Progress

↓

Settings

↓

AI Teacher
```

---

# Main Layout

The desktop application follows a three-column layout.

```
------------------------------------------------------------

Navigation

↓

Sidebar


Main Learning Area


AI Teacher Panel

------------------------------------------------------------
```

Navigation remains available while maximizing learning space.

---

# Mobile Layout

On mobile devices:

- Bottom navigation replaces the sidebar.
- AI Teacher opens as a floating panel.
- Lessons use full-screen mode.
- Speaking activities prioritize microphone access.

---

# Dashboard

The dashboard displays:

- Current lesson.
- Learning streak.
- Progress.
- AI recommendations.
- Continue learning.
- Upcoming reviews.

The learner should immediately know what to do next.

---

# Learning Journey

The Learning Journey displays:

- Current level.
- Domains.
- Scenarios.
- Lessons.
- Completion status.

Navigation should clearly indicate progression.

---

# Lesson Interface

Each lesson follows the same layout.

```
Lesson Header

↓

Situation

↓

Dialogue

↓

Vocabulary

↓

Grammar

↓

Exercises

↓

Speaking

↓

Writing

↓

Mission

↓

Reflection
```

The learner always understands their current position.

---

# Speaking Lab

The Speaking Lab includes:

- Conversation interface.
- Microphone controls.
- Pronunciation feedback.
- AI conversation.
- Speaking history.

Speaking should feel like talking to a tutor rather than completing an exercise.

---

# Writing Lab

The Writing Lab includes:

- Writing editor.
- AI corrections.
- Suggestions.
- Rewriting options.
- Progress feedback.

---

# Progress Page

Displays:

- Competency profile.
- Learning Journey.
- Scenario completion.
- Vocabulary mastery.
- Grammar mastery.
- AI recommendations.

Progress should focus on communication ability.

---

# AI Teacher Panel

The AI Teacher remains persistent.

Functions include:

- Ask questions.
- Explain grammar.
- Explain vocabulary.
- Continue conversations.
- Generate exercises.
- Review mistakes.
- Practice speaking.

The AI should always know the learner's current lesson context.

---

# Navigation

Primary navigation includes:

- Home.
- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.

Secondary navigation includes:

- Settings.
- Profile.
- Notifications.

Navigation depth should remain minimal.

---

# State Management

Frontend state includes:

User State

- Authentication.
- Preferences.
- Current lesson.

Learning State

- Progress.
- Competencies.
- Current activity.

AI State

- Conversation.
- Context.
- Feedback.

Application State

- Theme.
- Language.
- Notifications.

---

# Performance

Frontend should prioritize:

- Fast loading.
- Smooth transitions.
- Efficient rendering.
- Lazy loading where appropriate.
- Minimal waiting during AI interactions.

---

# Accessibility

HanGo should support:

- Keyboard navigation.
- Screen readers.
- Adjustable font sizes.
- High contrast mode.
- Captions for audio.
- Responsive layouts.

---

# Offline Behavior

When internet access is unavailable:

Users should still be able to:

- Review downloaded lessons.
- Read vocabulary.
- Practice previously downloaded exercises.

AI features may be unavailable until connectivity returns.

---

# Frontend Responsibilities

The frontend should:

- Display educational content.
- Capture learner interactions.
- Communicate with backend services.
- Display AI responses.
- Present learning progress.
- Maintain smooth user experience.

Business logic should remain in the backend whenever possible.

---

# Success Definition

The Frontend Architecture succeeds when learners experience a seamless, intuitive, and engaging platform that allows them to focus entirely on learning Chinese while the technology remains invisible.

---

End of document.