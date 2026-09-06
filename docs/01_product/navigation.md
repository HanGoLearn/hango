# HanGo Navigation System

Version: 1.1

Status: Official (corrected 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** this document said HanGo has five primary
> sections. The real app (`src/lib/navigation.ts`'s `primaryNavItems`,
> rendered identically in the desktop sidebar and mobile bottom nav) has
> **eight**: Dashboard, Learning Journey, Speaking Lab, Writing Lab,
> **Han**, Progress, **Shop**, Settings. "Han" and "Shop" sections have
> been added below, and the fictional "AI Teacher side panel"/"persistent
> button" model has been replaced with the real floating-bubble +
> dedicated-page design. Settings was also missing from the "five primary
> sections" framing even though it's a real primary-nav item (it's just
> mobile-nav-only-omitted, not absent from the app).

---

# Purpose

This document defines the navigation structure of HanGo.

The navigation system should allow learners to easily access all important learning areas while maintaining a simple and focused experience.

The learner's attention should always remain on learning Chinese.

---

# Navigation Philosophy

The navigation should follow three principles:

1. Learning should be the center of the experience.

2. Important actions should always be accessible.

3. The interface should minimize unnecessary complexity.

---

# Main Navigation Structure

HanGo contains eight primary sections, in this order (`src/lib/navigation.ts`):

```
Dashboard

Learning Journey

Speaking Lab

Writing Lab

Han

Progress

Shop

Settings
```

The mobile bottom nav shows the same seven sections minus Settings
(reached from the account menu instead).

---

# 1. Home

## Purpose

The central dashboard of the learner.

The Home section provides:

- Current learning status.
- Recommended activities.
- AI Teacher suggestions.
- Quick access to learning modules.

The user starts their study session here.

---

# 2. Learning Journey

## Purpose

The main curriculum path.

The learner accesses:

- Scenarios.
- Levels.
- Lessons.
- Activities.

Structure:

```
Learning Journey

↓

Scenario

↓

Difficulty Level

↓

Lesson

↓

Activity
```

Example:

```
Learning Journey

↓

Restaurant

↓

Intermediate

↓

Ordering Food

↓

Dialogue Practice
```

---

# 3. Speaking Lab

## Purpose

Dedicated speaking practice environment.

The learner accesses:

- Pronunciation training.
- Shadowing.
- Conversations.
- Role plays.
- Interviews.
- Debates.

The Speaking Lab should allow quick practice without requiring a full lesson.

---

# 4. Writing Lab

## Purpose

Dedicated writing development environment.

The learner accesses:

- Writing exercises.
- Corrections.
- Rewrite practice.
- Professional writing.
- Advanced compositions.

---

# 5. Han

## Purpose

The dedicated hub for every Han-branded AI feature - its own primary-nav
slot since 2026-08-31 (Han is the app's real competitive differentiator,
not a secondary utility). `src/components/han/han-hub.tsx` has four named
entry points:

- **Han Tutor** - the same text/voice chat that's also reachable as a
  floating bubble from anywhere else in the app (see "Floating Han Access"
  below).
- **Han Companion** - voice-only, with cross-session personal memory (a
  fixed set of facts extracted from finished conversations, read back
  later) - a distinct mode from Tutor, not just a different label on the
  same feature.
- **Han Vocabulary** - a standalone word/phrase lookup tool, independent
  of any lesson.
- **Han Class** - a locked "Coming soon" teaser.

---

# 6. Progress

## Purpose

Show learner development.

The learner accesses:

- Competency profile.
- Learning Journey progress.
- General Level (earned points mapped to an HSK-style label).
- Strengths.
- Weaknesses.
- Recommendations.

---

# 7. Shop

## Purpose

The HanCoins economy - spend coins earned from lessons, achievements, and
the weekly leaderboard payout on avatar customization (`app/(app)/tienda`).
Added 2026-08-30 alongside the avatar/zodiac-animal system and the
leaderboard.

---

# Floating Han Access

Han Tutor is also reachable without leaving the current page: a floating,
non-modal bubble (`AiTeacherBubble`, rendered in the shared app shell) is
present on every authenticated page. There is no persistent panel/drawer
with Collapsed/Compact/Expanded states - that was an earlier design this
document previously described; the real implementation is the floating
bubble plus the dedicated Han hub page above.

---

# Lesson Navigation

Inside a lesson, navigation should be linear but flexible.

Recommended structure:

```
Introduction

↓

Vocabulary

↓

Grammar

↓

Dialogue

↓

Listening

↓

Speaking

↓

Writing

↓

Exercises

↓

Mission

↓

Evaluation
```

The learner can review previous sections but should have a recommended progression.

---

# Content Navigation

Users should be able to access:

- Previous lessons.
- Completed scenarios.
- Review activities.
- Saved content.

However, navigation should always encourage progression.

---

# Mobile Navigation

The navigation system should support mobile devices.

Important considerations:

- Essential sections remain accessible.
- Learning activities prioritize full-screen focus.
- AI Teacher remains easy to open.
- Speaking activities require microphone access.

---

# Desktop Navigation

**Real layout** (`src/components/shell/app-shell.tsx`): two columns, not
three - there is no persistent third "AI Teacher" column.

```
------------------------------------------------

Sidebar       Main Content

Menu          Learning Area

------------------------------------------------
```

Han is reachable via its own sidebar item, or via the floating bubble
that overlays the main content area - see "Floating Han Access" above.

---

# Navigation Rules

The system should avoid:

- Too many menu items.
- Confusing categories.
- Duplicate pathways.
- Deep navigation trees.

Every section should have a clear purpose.

---

# Future Expansion

Future modules may include:

- Community.
- Courses.
- Cultural Content.
- Dictionary.
- Media Library.

New sections should only be added if they improve the learning experience.

---

# Success Definition

The navigation system succeeds when learners can immediately understand:

Where they are.

What they can do.

Where they should go next.

---

End of document.