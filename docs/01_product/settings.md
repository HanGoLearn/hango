# HanGo Settings

Version: 1.1

Status: Official (rewritten 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** almost every field this document described
> was either wrong in specifics or entirely invented (a bilingual
> explanation-language toggle, an editable post-onboarding Chinese level,
> playback speed/audio difficulty controls, AI conversation-style personas,
> adaptive/manual difficulty, password/subscription/notification settings
> - none of these exist), and it omitted two real sections outright
> (Avatar, Appearance). The sections below have been rewritten against the
> real page, `app/(app)/settings/page.tsx` (7 sections: Profile, Avatar,
> Learning, Han, Appearance, Privacy, Account).

---

# Purpose

This document defines the personalization and configuration options available to HanGo users.

The purpose of settings is to adapt the learning experience according to the learner's goals, preferences, and needs.

---

# Core Philosophy

Settings should improve the learning experience.

They should not create unnecessary complexity.

The system should provide enough personalization to make learning effective while maintaining simplicity.

---

# Real Settings Sections

The Settings page has exactly seven sections, in this order:

---

# 1. Profile

Display name (used in-app) and account nickname (reserved for a future
leaderboard handle, editable independently of display name).

---

# 2. Avatar

The learner's chosen zodiac-animal avatar and equipped accessories
(2026-08-30). Not a settings toggle so much as a shortcut into the same
customization the Shop page offers.

---

# 3. Learning

One combined form covering:

- Interface language (EN/ES - the UI chrome language).
- Explanation language (EN/ES/ZH - a single mutually-exclusive choice for
  how Han explains concepts, not a bilingual "Chinese + X" toggle).
- Learning goals and skill priorities (set during onboarding, editable
  here).
- Daily study target (minutes).
- Correction style: `IMMEDIATE` / `AFTER_CONVERSATION` / `ONLY_IMPORTANT`
  - the real three options; there is no separate "explanation style" or
  "conversation style" (friendly/professional/strict) setting.

Current Chinese level is set once during onboarding (via the optional
placement exam or a self-assessment) and is not editable from Settings.

---

# 4. Han

- Response mode: `TEXT_ONLY` / `TEXT_AND_AUDIO` / `AUDIO_ONLY`.
- Voice: fixed to "cedar" - there is no voice-selection control.
- Conversation-memory toggle (whether AI Teacher chat history is stored
  and reused as context).

There is no playback-speed, audio-difficulty, or AI-personality control
anywhere in the app.

---

# 5. Appearance

Theme: light, dark, or match system - the same control as the toggle in
the top bar on every page.

---

# 6. Privacy

Recording-retention period (days) for Speaking Lab voice recordings. That
is the only privacy control on this page today.

---

# 7. Account

A single delete-account action. There is no password, subscription, or
notification-preferences control here - HanGo has no subscription tiers
or notification system today.

---

# Design Principles

Settings should be:

## Simple

Avoid overwhelming users with too many options.

---

## Useful

Every setting should improve personalization.

---

## Understandable

Users should clearly understand the effect of changing a setting.

---

# Future Possibilities

Future settings may include:

- Personal learning plans.
- Custom AI Teacher personalities.
- Cultural interests.
- Industry-specific vocabulary.

---

# Success Definition

Settings succeed when every learner feels that HanGo adapts naturally to their personal learning journey.

---

End of document.