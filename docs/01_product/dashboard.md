# HanGo Dashboard

Version: 1.1

Status: Official (sections rewritten 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** this document had no "Real Implementation"
> reconciliation note at all, unlike most of its siblings in this folder,
> and its section-by-section specifics didn't match the real page in
> almost any detail - invented sections ("AI Teacher Recommendation" as
> its own panel, "Competency Overview" with example scores, "Review
> Practice"/"Vocabulary Review" quick-access links that don't exist) and,
> more importantly, **complete silence on HanCoins, the avatar shop, the
> leaderboard, and achievements** - the app's entire gamification/retention
> layer, each with a real, dedicated card on the actual page. Sections
> 1-8 below have been rewritten against `app/(app)/dashboard/page.tsx` and
> `src/lib/dashboard-data.ts` directly. Purpose/Philosophy/Design
> Principles/Success Definition above and below are unchanged.

---

# Purpose

The Dashboard is the central home experience of HanGo.

Its purpose is to provide learners with a clear overview of their learning journey, current progress, recommended activities, and immediate next actions.

The Dashboard should help learners begin each study session with confidence and direction.

---

# Core Philosophy

The Dashboard should answer four questions:

1. Where am I in my learning journey?

2. What should I do next?

3. How am I improving?

4. How can I continue progressing?

The learner should never feel lost inside the platform.

---

# Main Dashboard Components

The Dashboard contains several key sections.

---

# 1. Hero: Continue Learning + Today's Status

## Purpose

One combined block that answers "where am I" and "what's next" together,
instead of two separate sections.

Displays:

- The learner's continue-learning target (scenario/lesson/next activity),
  computed the same way "next lesson" is computed on the Learning Journey
  page itself - not a separately-generated recommendation.
- Current study streak, with a "streak at risk" nudge if today isn't
  logged yet.
- A daily-goal chip.
- A 7-day activity dot-strip (which recent days had study activity).

---

# 2. Quick Actions

## Purpose

Fast, lesson-independent entry points for the three practice modes that
don't require picking a specific lesson first: Speaking practice, Writing
practice, and the Welcome to Chinese page. Visually de-emphasized relative
to the hero - these are shortcuts, not the primary call to action.

---

# 3. Learning Journey Progress

## Purpose

One aggregate progress bar for the whole curriculum (not per-scenario
detail - that lives on the Learning Journey page itself).

---

# 4. Review Recommendations

## Purpose

Support retention with a short queue of previously-seen content due for
review (vocabulary, grammar, past mistakes, dialogue lines) - see
`review_system.md` for how this queue is really built (a fixed-type,
time-based cooldown, not adaptive spaced repetition).

---

# 5. Sidebar: General Level, Words of the Day, Leaderboard, Achievements, Avatar/Shop, Competency Summary

## Purpose

A column of smaller cards, each a teaser linking to its own full page:

- **General Level** - the learner's earned point total (0-2000), mapped
  to an HSK-style label. This is the real headline progress metric,
  distinct from any per-scenario mastery percentage.
- **Words of the Day** - a small rotating vocabulary sample at the
  learner's level.
- **Leaderboard teaser** - top 3 + the learner's own rank, linking to the
  full leaderboard.
- **Achievements teaser** - unlock count + recently-unlocked icons,
  linking to the full achievements page. Real achievement copy comes from
  a fixed code catalog, not generated per learner.
- **Avatar / HanCoins teaser** - current HanCoins balance and the
  learner's chosen avatar, linking to the Shop (`/tienda`).
- **Competency Summary** - a compact view of the same competency data the
  Progress page shows in full.
- A rotating "Han's tip" line.

---

# Personalization

The Dashboard changes depending on the learner.

Examples:

Beginner learner:

More guidance and structured recommendations.

Advanced learner:

More independent challenges and complex tasks.

Professional learner:

More business communication content.

---

# Dashboard Design Principles

The Dashboard should be:

## Simple

Avoid overwhelming users with excessive information.

---

## Action-Oriented

Every element should lead toward a meaningful learning action.

---

## Personal

The experience should feel unique to each learner.

---

## Motivating

Progress should be visible and encouraging.

---

# Information Priority

The Dashboard prioritizes:

1. Next learning action.

2. Current progress.

3. AI recommendations.

4. Long-term growth.

Secondary information should not distract from learning.

---

# Future Possibilities

Future versions may include:

- Learning goals.
- Calendar integration.
- Study reminders.
- Community progress.
- Personalized learning plans.

---

# Success Definition

The Dashboard succeeds when learners always know:

Where they are.

What they should practice.

Why it matters.

How they are improving.

---

End of document.