# HanGo Design System

Version: 2.0

Status: Official

Last Updated: 2026-08-21

---

# Changelog

**2.0 (2026-08-21)** — Grounded in the real implementation. Version 1.0 was written before any visual work existed and got two structural calls wrong once real design work started: it recommended a blue primary color ("avoid overuse of red") and light mode as the MVP baseline with dark mode optional/later. Neither held up once the actual brand asset — Han, the mascot — was used as the source of truth for color instead of an abstract recommendation. This version replaces the Color System, Theme Support, Typography, Border Radius, Shadow, and Motion sections with the real, shipped token values (`app/globals.css`), and adds a new **Implemented Component Patterns** section documenting the concrete patterns validated on the Dashboard (the project's designated reference screen — see `project/learning-journey-optimization.md`) so future screens extend the same system instead of improvising a new one. Sections not yet exercised by real screens (Speaking/Writing Lab audio controls, AI Teacher panel, Missions) are left as directional guidance, unchanged.

---

# Purpose

This document defines the visual system used throughout HanGo.

Its purpose is to ensure that every screen, component, interaction, and learning experience feels consistent, accessible, modern, and aligned with the HanGo brand.

The Design System combines:

- Color.
- Typography.
- Spacing.
- Borders.
- Shadows.
- Icons.
- Motion.
- Visual states.
- Responsive behavior.

---

# Design Objective

HanGo should feel like a calm, intelligent, and modern learning environment.

The interface should support concentration and communication practice without creating unnecessary visual noise.

The learner's attention should remain focused on:

- Chinese content.
- The current activity.
- The AI Teacher.
- Learning progress.
- The next action.

---

# Core Visual Principles

## Calm

The interface should use controlled contrast, sufficient white space, and limited decorative elements.

---

## Clear

Every screen should establish a clear hierarchy.

The learner should immediately understand:

- Where they are.
- What they are learning.
- What they should do next.

---

## Consistent

The same visual rules should apply throughout the application.

Buttons, cards, inputs, messages, progress indicators, and learning content should behave consistently.

---

## Accessible

Visual choices must support readability, keyboard interaction, screen readers, and adequate color contrast.

---

## Responsive

The system must work across:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

---

# Color System

Two complete themes exist, both derived from the real mascot artwork (`public/mascot/*.png`: crimson-red ear/heart, sage-green leaf, porcelain body, warm charcoal screen) rather than an independently invented palette. All hex values below are the actual tokens in `app/globals.css`'s `@theme` block (dark) and its `@media (prefers-color-scheme: light)` / `[data-theme="light"]` blocks (light) — not aspirational.

Every color role is a CSS custom property, which is what makes theme-switching a pure token swap: components reference `var(--color-*)` (via Tailwind's generated utilities, e.g. `bg-primary-500`), never a literal hex value, so redefining the variable in the light-theme block is enough for every existing component to adapt with zero class-name changes.

## Primary — "Tinta Cálida" wine / "Porcelana" crimson

Anchored to the mascot's ear/heart red.

| Theme | 500 (anchor) |
|---|---|
| Dark (Tinta Cálida) | `#c42a3e` |
| Light (Porcelana) | `#b8233a` |

Used for: primary buttons, active navigation, key progress indicators, AI Teacher accents. A deliberately crimson-leaning red, kept visually distinct from the orange-red error state so the two are never confused.

## Secondary — sage green

Anchored to the mascot's leaf sprig.

| Theme | 500 (anchor) |
|---|---|
| Dark | `#6e9271` |
| Light | `#4f7a57` |

Used for: secondary actions, Speaking Lab's nav badge (at the darker `-700` step — see Implemented Component Patterns below), supporting highlights.

## Accent — gold

| Token | Dark | Light |
|---|---|---|
| accent-500 | `#c7972e` | `#c7972e` (unchanged) |
| accent-300 | `#e3b65c` | `#886720` (theme-specific — see note) |

Used sparingly: milestones, HSK badges, the streak chip. **accent-300 is the one step that needs its own light-theme value**, because it's used as plain text/numerals directly on the page background (`TopBar`'s streak count, `CompetencyList`'s bar-color cycle) rather than only as a fill — the dark-theme value measures 9.72:1 there but only 1.68:1 against the light page, so light mode uses a darker `#886720` (4.64:1) instead.

## Neutral

The neutral ramp is where the two themes genuinely diverge — it isn't a lightened/darkened copy, it inverts, because `neutral-900`/`neutral-800`/`neutral-700` are the literal page/surface/elevated backgrounds and `neutral-50`/`neutral-0` are the literal text colors. In dark mode 900 is near-black and 0 is white; in light mode 900 is porcelain-light and 0 is near-black.

| Step | Dark (Tinta Cálida) | Light (Porcelana) |
|---|---|---|
| 0 | `#ffffff` | `#13100c` |
| 50 | `#f1eeea` | `#242017` |
| 300 | `#a7977e` | `#5b503a` |
| 400 | `#988567` | `#7a6c4e` |
| 700 | `#342d23` | `#e7e3da` |
| 800 (surface) | `#241f18` | `#fcfcfb` |
| 900 (page) | `#17140f` | `#f3f1ed` |

Every text-role pairing is contrast-verified against its own theme's page background: dark theme text-primary 15.88:1 / text-secondary 6.45:1 / text-muted 5.15:1; light theme text-primary 14.39:1 / text-secondary 7.02:1 / text-muted 4.56:1. All clear WCAG AA for normal text.

**This inversion is the root cause of every contrast bug found so far** (see "The on-color-token rule" below) — any component that pairs an inverting neutral step with a brand-color fill that does *not* invert (primary/secondary/accent/info stay roughly the same lightness in both themes) will fail contrast in whichever theme the pairing flips the wrong way.

## Semantic Colors

| Role | 500 (dark) | 500 (light) |
|---|---|---|
| Success | `#2f8f52` | not yet re-tuned |
| Warning | `#c97a1f` | `#9b5e18` (contrast-solved, 2026-08-21) |
| Error | `#d14a2e` | not yet re-tuned |
| Info | `#2f5bc0` | not yet re-tuned |

Used for: success (correct answers, completed lessons), warning (activities needing attention, at-risk streaks), error (failed requests, incorrect answers), info (tips, AI recommendations, decoupled from the primary brand red so a fourth signal stays available). Must never be the only way information is communicated — pair with an icon or text label.

**Known gap:** success/error/info were only contrast-verified for the dark theme when the palette was built. Warning-500 was the first of the four actually used as plain text on the page background (the Dashboard's streak-at-risk nudge) and needed its own light-theme value once measured (`2.96:1` on light — failed AA — vs. `9b5e18` at `4.64:1`). **Before using success/error/info-500 as text on a page/surface background in the light theme, measure it first** — don't assume it clears AA just because warning didn't.

## Semantic Surface / Text / Border Aliases

Components should reference these, never a raw palette step, so a theme switch needs no component changes anywhere:

- `--color-page` → `neutral-900`
- `--color-surface` → `neutral-800`
- `--color-elevated` → `neutral-700`
- `--color-text-primary` → `neutral-50`
- `--color-text-secondary` → `neutral-300`
- `--color-text-muted` → `neutral-400`
- `--color-border` → `neutral-700`
- `--color-border-strong` — independently contrast-solved per theme (not aliased to a neutral step), since it exists specifically to clear WCAG 1.4.11's 3:1 non-text contrast minimum: `#91846e` dark (5.01:1), `#8f836c` light (3.31:1).

These aliases are declared once. Because CSS custom properties resolve at compute time, redefining `neutral-900` etc. in the light-theme block is enough — the aliases never need their own redeclaration.

## Fixed (theme-invariant) tokens

- `--color-on-color-light: #faf7f2` — text/icons on a medium-to-dark colored fill (primary-500, info-500, secondary-700).
- `--color-on-color-dark: #1c1712` — text/icons on a light colored fill (accent-500, secondary-300).

Warm-tinted, not pure `#fff`/`#000`, to match the palette family. Never redefined per theme — see the rule below for why that's the point.

---

# Theme Support

HanGo ships two full themes:

- **"Tinta Cálida" (Warm Ink)** — dark, the default. Renders with zero JavaScript, zero cookie, no `data-theme` attribute — it's simply the `@theme` block's literal values.
- **"Porcelana" (Porcelain)** — light. Applies automatically on `prefers-color-scheme: light` when the learner hasn't made an explicit in-app choice, or explicitly via `[data-theme="light"]` (wins regardless of OS preference).

Switching is a **cookie**, not `next-themes` or any client-side library: every route in this app already hits the database per request (nothing is statically prerendered), so `app/layout.tsx` reads the theme cookie server-side via `cookies()` and renders the correct `data-theme` attribute directly in the SSR HTML — correct on first paint, no flash of the wrong theme, no client JS required for correctness. `src/components/shell/theme-toggle.tsx` is the only client-side piece: it writes the cookie and updates `data-theme` immediately for instant feedback, using the same `useSyncExternalStore` pattern already established for `src/components/lesson/lesson-display-prefs.tsx` (a plain `useState` + `useEffect` hits this codebase's `react-hooks/set-state-in-effect`/`react-hooks/immutability` lint rules — match that existing pattern rather than reinventing one).

`data-theme` must stay on `<html>` specifically, never move to an inner wrapper — Radix UI's Dialog/DropdownMenu/Select/Tooltip portal to `document.body`, and while a Portal escapes the *React* tree, `<html>` is still an ancestor in the real *DOM* tree, so the attribute keeps cascading correctly to portaled content only as long as it stays there.

The hierarchy and semantic meaning of colors is consistent across both themes — dark mode is not a simple inversion of light mode. Brand colors (primary/secondary/accent) stay roughly the same lightness in both; only the neutral ramp (and therefore page/surface/text) actually inverts.

---

# Typography

Real font stack (`app/globals.css`):

- **Interface font** (`--font-interface`): Inter, falling back to system UI fonts. Used for navigation, buttons, labels, settings, system messages — everything except the exceptions below.
- **Chinese content font** (`--font-chinese`): Noto Sans SC, falling back to the interface font. Used for vocabulary, dialogues, grammar examples, reading content, writing feedback.
- **Display font** (`--font-display`): Fraunces, falling back to Georgia / Songti SC / serif. Used *only* for Display, Page Title, and Section Title — a deliberate accent restricted to three roles, not a wholesale font swap, so it reads as intentional rather than inconsistent.

## Type Scale

| Role | Size | Line height |
|---|---|---|
| Display | 2.75rem | 1.15 |
| Page Title | 1.875rem | 1.25 |
| Section Title | 1.375rem | 1.3 |
| Card Title | 1.125rem | 1.4 |
| Body | 1rem | 1.6 |
| Chinese Body | 1.125rem | 1.9 |
| Supporting | 0.875rem | 1.5 |
| Caption | 0.75rem | 1.4 |

Chinese Body gets a taller line-height (1.9 vs. Body's 1.6) — Chinese characters need more vertical breathing room than Latin text at a comparable size.

Each role has a matching component in `src/components/ui/typography.tsx` (`Display`, `PageTitle`, `SectionTitle`, `CardTitle`, `Body`, `ChineseText`, `Supporting`, `Caption`, plus `Pinyin`/`Translation`) — use the component, not a raw `text-*` utility, so a future scale change stays centralized.

## Chinese Text Rules

Chinese characters should receive sufficient line height and spacing.

Pinyin and translations must remain visually secondary to the Chinese text.

Recommended hierarchy:

```
Chinese characters

Pinyin

Translation
```

Chinese text should always remain the most prominent element.

## Font Weight

Use limited font weights: Regular, Medium, Semibold. Bold only when necessary. Avoid excessive use of bold text.

---

# Spacing System

Intentionally reuses Tailwind's default scale — it already matches the documented base unit exactly (4px / 0.25rem), so no override is defined in `app/globals.css`.

```
4
8
12
16
20
24
32
40
48
64
```

Use smaller spacing for: related labels, pinyin and translation, input labels and fields, icons and text.

Use larger spacing for: separate lesson sections, different cards, major page regions, independent activities.

---

# Layout System

## Desktop Layout

```
Navigation Sidebar

Main Content Area

AI Teacher Panel
```

The main content area remains the visual priority. The AI Teacher panel may be collapsed, expanded, or full-screen.

## Tablet Layout

The sidebar may collapse. The AI Teacher opens as an overlay or resizable panel.

## Mobile Layout

- Bottom navigation.
- Full-width content.
- Floating AI Teacher access.
- Full-screen speaking and writing experiences.

---

# Container Widths

Reading and lesson content should not stretch excessively across large screens. Use controlled content widths for grammar explanations, dialogues, reading passages, writing feedback.

Wide layouts may be used for: Dashboard, Progress, Learning Journey maps, Speaking interfaces.

---

# Borders

Borders should be subtle. Use borders to separate content, define inputs, show selected states, distinguish cards. Avoid heavy borders throughout the interface.

---

# Border Radius

Real tokens (`app/globals.css`), shared by both themes:

| Token | Value | Used for |
|---|---|---|
| `--radius-control` | 0.5rem (8px) | Inputs, compact controls |
| `--radius-card` | 0.875rem (14px) | Standard cards |
| `--radius-panel` | 1.25rem (20px) | Major panels (hero, AI Teacher container) |

Kept moderate on purpose — friendlier than a sharp scale, but not full-pill everywhere, so shape stays a deliberate accent rather than the whole visual identity. Full-pill (`rounded-full`) is reserved for single-line status chips (see "Pills vs. blocks" below), not general containers.

---

# Shadows

Shadows communicate elevation, but the *mechanism* differs by theme:

- **Dark theme**: shadows barely read against a dark surface, so elevation comes primarily from the neutral background steps (`page` → `surface` → `elevated`, i.e. 900 → 800 → 700), not from a drop shadow. `--shadow-elevated`/`--shadow-modal` exist but are deliberately subtle (`rgb(0 0 0 / 0.24)` etc.).
- **Light theme**: the background-step trick barely works when surface/page are both near-white, so light mode redefines both shadow tokens with real, visible, warm-tinted shadows (`rgb(80 60 30 / …)`) instead of a neutral grey — matching the palette family rather than looking like an unrelated Bootstrap default.

Use shadows for: floating AI Teacher panel, modal windows, dropdown menus, elevated cards, temporary overlays. Avoid strong decorative shadows.

---

# Icon System

Icons should be simple, consistent, recognizable, accessible, suitable for small sizes. One primary icon library throughout the MVP (`lucide-react`).

Icons should not replace text when meaning may be unclear.

---

# Motion and Animation

Real tokens (`app/globals.css`), shared by both themes:

| Token | Value |
|---|---|
| `--duration-fast` | 120ms |
| `--duration-base` | 200ms |
| `--duration-slow` | 320ms |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Short, smooth, predictable — motion should never block a learning action. `prefers-reduced-motion: reduce` collapses every animation/transition duration to near-zero globally (`app/globals.css`), so this doesn't need to be re-implemented per component.

---

# Implemented Component Patterns

Validated on the Dashboard (`app/(app)/dashboard/page.tsx`) and the AI Teacher bubble (`src/components/shell/ai-teacher-bubble.tsx`) — extend these patterns to new screens rather than inventing new ones, and update this section when a genuinely new pattern is validated elsewhere.

## Hero panel

A `rounded-panel` block with a soft two-color gradient background (`bg-linear-to-br from-primary-500/10 to-secondary-500/10`) and no border — not a `Card`. Reserved for the page's single clear "primary action," so it reads as categorically different from everything else on the page rather than just the first item in a stack.

## Entry-point panel

A `Link`-wrapped `rounded-panel` with a visible border and a hover state (`hover:border-primary-500/40`), containing a section title, a chevron-right icon, and an **aggregate** stat (e.g. a `ProgressBar` showing "18 of 52 lessons complete") — never a full list of the underlying items. This is the Dashboard's core "glanceable summary vs. full detail" split: if a domain already has its own dedicated page (Learning Journey, Progress), the Dashboard shows one aggregate + a link there, not a duplicate of that page's content. The Learning Journey panel is the reference implementation.

## Scorecard

`rounded-panel border-none bg-elevated p-5 shadow-none` — separation from the page comes from the `elevated` background step, not a border or shadow. Used for a glanceable stat block (General Level, Competency Summary). Optionally `Link`-wrapped to its own detail page (General Level → Progress), matching the entry-point panel's "summary here, detail there" logic at smaller scale.

## Pills vs. blocks

`rounded-full` chips (icon + short text) are reserved for **single-line status signals only** — streak count, today's-goal met/not-met, an active-tab indicator. The moment content needs two lines (a title plus an explanatory reason, for example), move it out of the pill row into its own `rounded-control` or `rounded-panel` block instead of stretching the pill — a wrapped rounded-full pill's curved ends read as broken against multi-line content. (The Dashboard's "Suggested next" moved from a pill into its own block for exactly this reason once it started showing the recommendation's `reason` field alongside its title.)

## Quick actions (de-emphasized)

No `Card` wrapper — a small colored icon-badge (`rounded-full` at 15% fill opacity, e.g. `bg-secondary-500/15 text-secondary-300`) plus a text label, for secondary/utility links that shouldn't visually compete with the hero's primary CTA.

## The on-color-token rule

Text/icons sitting on top of a **solid brand-color fill** (`bg-primary-500`, `bg-accent-500`, a nav badge, a solid active-state background) must use `text-on-color-light` / `text-on-color-dark` — the two fixed, theme-invariant tokens — never `text-neutral-0` / `text-neutral-900`. The neutral extremes invert between themes by design (0 = white in dark mode, near-black in light mode), so pairing them with a fill that does *not* invert silently drops below WCAG AA in whichever theme the combination flips the wrong way. This was the single most common real bug found while building the dual-theme system — confirmed instances (`Button`'s primary variant, `Checkbox`'s check icon, and every one of `navigation.ts`'s nav badges except Settings, which is neutral-on-neutral and correctly needs no fix — the exact count has grown as nav items were added since this was first measured, most recently to eight total items with the 2026-08-30/31 addition of Han and Shop) — all found via measured contrast ratios, not visual inspection.

## Wash-vs-solid-fill rule

A translucent color wash (`bg-primary-500/15`) combined with a **fixed-shade** text color (e.g. `text-primary-100`) cannot stay legible across a theme switch: the wash's *rendered* color depends on what's behind it, which itself inverts between themes, so a text shade tuned for one theme's wash can measure as low as 1.02:1 (effectively invisible) in the other. Anything that must invert reliably — an active nav link, a selected list item — should use a **solid fill + an on-color token** instead of a wash + a fixed shade. (`Sidebar`'s active link and `Select`'s highlighted item both moved from a wash to a solid `bg-primary-500` fill for this reason.)

## Dashboard query-cost discipline

Every Dashboard addition is checked against `src/lib/dashboard-data.ts`'s existing `Promise.all` before it's built — a new visual element must either reuse data already fetched there (or in `AppShell`'s per-request cache) or explicitly justify a new query. This isn't a purely visual rule, but it has shaped which Dashboard ideas shipped as designed and which shipped in a reduced, zero-query form (e.g. the streak-at-risk nudge and the "today's goal" indicator are intentionally binary, not proportional, because no field tracks actual minutes studied today without a new query).

## Floating widget (non-modal)

Han's entry point (`AiTeacherBubble`, 2026-08-21) — a fixed-position circular trigger (`right-4`, vertical offset shifting from `bottom-20` on mobile to `md:bottom-4` at the `md` breakpoint to clear the mobile bottom nav — position isn't identical across screen sizes, just consistently reachable) opening a Radix `Dialog` with **`modal={false}` and no `Overlay`**, so the page stays fully visible and interactive behind it. This is deliberately a different primitive from `Drawer` (also Dialog-based, but modal, with a scrim, used for page-blocking mobile sheets like nav/filters) and `Modal` (fully blocking) — reach for the non-modal pattern only for a persistent, glanceable companion the learner can ignore without dismissing, never for a flow that needs the learner's full attention before they can do anything else. Sizing is responsive from one component, not a desktop/mobile split: near-full-screen with margins below `sm`, an anchored compact card (`w-96`, `max-h-[70vh]`) from `sm` up.

## Optimistic UI over slow server actions

A control that triggers a Server Action must never gate its own visible open/close/success state behind that action's network round-trip — `await theServerAction()` before `setOpen(true)` means *any* slowness on the server (a cold connection, a slow query) directly delays what should be an instant click response. Update the visible state first, let the server call run in the background, and only gate the specific follow-up action that genuinely depends on the server call's result (Han's bubble opens immediately; sending a message stays disabled via a separate `resetting` flag only until the background conversation-clear actually finishes, so a message can never race ahead with stale context attached). Found via a real user report ("por qué demora tanto en abrir? se tarda 10-15seg") traced to `openTeacher()` awaiting a full DB round-trip before revealing the panel at all.

---

# Interaction States

Every interactive element must support: Default, Hover, Focus, Active, Selected, Disabled, Loading, Success, Error.

Focus states must remain clearly visible for keyboard users.

---

# Loading States

Loading states should indicate what is happening — generating an AI response, evaluating pronunciation, loading a lesson, saving progress, generating audio.

Use skeleton loaders, progress indicators, clear status messages. Avoid indefinite loading without explanation.

---

# Empty States

Empty states should explain why no content exists and what the learner should do next.

Example: "No writing activities completed yet. Start your first Writing Lab practice."

---

# Feedback States

Feedback should be immediate and educational.

### Correct

Confirmation, brief explanation when useful, continue action.

### Incorrect

What needs improvement, explanation, retry option, ask AI option.

Avoid visually aggressive error states for normal learning mistakes.

---

# Audio Visual Language

Audio components should share consistent controls: play, pause, replay, speed, sentence selection, record, stop recording, playback learner audio.

Recording states must be visually clear.

---

# AI Teacher Visual Language

The AI Teacher should feel integrated with the application. The panel includes: current mode, conversation area, text input, microphone control, expand/collapse controls, context indicator, suggested actions.

The AI Teacher should not visually overpower the lesson.

---

# Progress Visual Language

Progress should communicate competence rather than only completion.

Supported visualizations: progress bars, mastery levels, competency summaries, scenario status, skill trends.

Avoid excessive charts in the MVP.

---

# Accessibility Standards

The Design System must support: sufficient color contrast, visible focus indicators, text alternatives for icons, keyboard navigation, screen reader labels, reduced-motion preferences, scalable text, captions and transcripts for audio.

Every new color pairing added to the app must be contrast-checked against the theme(s) it will actually render in — see the "Known gap" note under Semantic Colors for a real example of a pairing that looked fine in one theme and failed in the other.

---

# Responsive Rules

Every component must define behavior for desktop, tablet, and mobile. Content should not be hidden merely because the screen is smaller — the interaction may change, but the learning capability must remain available.

---

# Design Tokens

Colors, typography, spacing, radius, shadows, motion duration are all real CSS custom properties in `app/globals.css`, generated as Tailwind v4 `@theme` utilities. Breakpoints and z-index reuse Tailwind's defaults — no project-specific override exists for either. Components use tokens (`bg-page`, `text-text-secondary`, `rounded-panel`) rather than isolated hardcoded values.

---

# MVP Scope

Both themes ship together, from the Dashboard onward — dark ("Tinta Cálida") is the default; light ("Porcelana") is a fully-supported, contrast-verified alternative, not a later-phase addition. (Version 1.0 of this document recommended the opposite sequencing before any real design work existed; that recommendation didn't survive contact with the actual mascot-derived palette.)

For the MVP, the Design System must otherwise provide: core color roles, Chinese-compatible typography, standard spacing scale, responsive layout, basic semantic states, essential iconography, minimal purposeful animation, accessible interactive states.

---

# Success Definition

The HanGo Design System succeeds when every part of the platform feels visually consistent, supports focused learning, adapts across devices, and allows new features to be added without redesigning the visual language.

---

End of document.
