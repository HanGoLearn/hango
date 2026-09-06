# HanGo Changelog

Version: 1.0

Status: Official (frozen since [0.0.4] - see audit note)

Last Updated: August 2026

> **2026-09-05 audit note:** every real entry stops at `[0.0.4]`
> (2026-08-07/08) and is about documentation/project-file reorganization,
> not a shipped product feature - despite substantial feature work since
> (the zodiac avatar + HanCoins economy, Welcome to Chinese, the placement
> exam, handwritten writing, the 2026-09-05 AI-usage-cost-tracking system
> and CI pipeline), none of it was ever logged here. This document's own
> "Documentation Synchronization" guidance (below, in the "should update"
> checklists) still names `tasks.md` (`docs/05_development/tasks.md`) as a
> file to keep in sync - that file was deleted 2026-09-05 as a stale
> duplicate of the real live status doc, root-level `project/TASKS.md`.
> Any future entry should reference `project/TASKS.md` instead.

---

# Purpose

This document records significant changes made to HanGo.

Its purpose is to preserve a clear history of product, architecture, educational, design, development, and release decisions.

The changelog should help the team understand:

- What changed.
- When it changed.
- Why it changed.
- Which parts of the project were affected.
- Whether migration or follow-up work is required.

This document is not a substitute for Git history.

Git records code changes.

The changelog records meaningful project changes.

---

# Changelog Principles

Every changelog entry should be:

- Clear.
- Concise.
- Traceable.
- Relevant.
- Written after the change is approved.

Do not record every minor edit.

Record changes that affect:

- Product scope.
- MVP scope.
- Architecture.
- Data models.
- Educational methodology.
- Content structure.
- Design system.
- User experience.
- External providers.
- Security.
- Privacy.
- Deployment.
- Public releases.

---

# Entry Format

Each release or important project update should use this format:

```text
## [Version] — YYYY-MM-DD

### Added

### Changed

### Fixed

### Removed

### Security

### Migration Notes

### Documentation
```

Only include sections that contain relevant changes.

---

# Change Categories

## Added

Use for new:

- Features.
- Modules.
- Screens.
- Content.
- Integrations.
- Data models.
- Capabilities.

---

## Changed

Use for modifications to existing:

- Behavior.
- Scope.
- Architecture.
- Design.
- Learning methodology.
- Content structure.
- Provider configuration.
- Progress logic.

---

## Fixed

Use for corrections to:

- Bugs.
- Invalid content.
- Broken flows.
- Incorrect calculations.
- Inaccurate Chinese.
- Accessibility problems.
- Security defects.

---

## Removed

Use for:

- Deleted features.
- Deprecated modules.
- Removed files.
- Unsupported behavior.
- Eliminated integrations.

The reason for removal should be included when relevant.

---

## Security

Use for changes involving:

- Authentication.
- Authorization.
- Data protection.
- Secrets.
- File access.
- Rate limiting.
- Vulnerability remediation.
- Privacy controls.

Sensitive security details should not be described publicly if they could create risk.

---

## Migration Notes

Use when a change requires:

- Database migration.
- Environment variable changes.
- Provider reconfiguration.
- Content migration.
- Storage migration.
- Manual deployment actions.
- Learner data transformation.

---

## Documentation

Use for important updates to the official project documentation.

Minor grammar or formatting corrections do not require an entry.

---

# Versioning

HanGo should use semantic versioning:

```text
Major.Minor.Patch
```

Example:

```text
1.4.2
```

---

## Major Version

Increase when introducing:

- Large incompatible changes.
- Major product restructuring.
- Significant architecture replacement.
- Breaking API changes.
- Fundamental curriculum redesign.

Example:

```text
1.0.0 → 2.0.0
```

---

## Minor Version

Increase when adding backward-compatible functionality.

Examples:

- New scenario.
- New Speaking Lab mode.
- New AI Teacher capability.
- New interface language.
- New progress feature.

Example:

```text
1.1.0 → 1.2.0
```

---

## Patch Version

Increase for backward-compatible fixes.

Examples:

- Bug corrections.
- Content corrections.
- Minor performance improvements.
- Small accessibility fixes.
- Security patches without product restructuring.

Example:

```text
1.2.0 → 1.2.1
```

---

# Pre-Release Versions

Before the first public stable release, HanGo may use:

```text
0.x.x
```

Recommended stages:

```text
0.1.0 — Internal Prototype

0.2.0 — Alpha

0.3.0 — Closed Beta

0.9.0 — Public Release Candidate

1.0.0 — First Stable Public Release
```

Pre-release identifiers may also be used:

```text
0.3.0-beta.1

0.3.0-beta.2

1.0.0-rc.1
```

---

# Release Types

## Internal Development Update

Used for meaningful internal progress that is not released to learners.

May include:

- Architecture completion.
- Database foundation.
- Design-system implementation.
- First complete lesson.

---

## Alpha Release

Used for early functional validation.

Expected characteristics:

- Incomplete content.
- Limited users.
- Known non-critical defects.
- Experimental integrations.

---

## Closed Beta Release

Used for invited learners.

Expected characteristics:

- Complete core learning loop.
- Monitoring enabled.
- Controlled support.
- Measurable usage and cost.

---

## Public MVP Release

Used for the first public version.

Expected characteristics:

- Stable core experience.
- Legal documents.
- Production monitoring.
- Backups.
- Support process.
- Security review.

---

## Hotfix Release

Used for urgent fixes.

Examples:

- Authentication failure.
- Data-loss risk.
- Major lesson blockage.
- Security defect.
- Production outage.

Hotfixes should remain narrowly scoped.

---

## Content Release

Used when publishing:

- New scenarios.
- New lessons.
- Dialogue improvements.
- Grammar corrections.
- Vocabulary corrections.
- Quiz corrections.
- Mission updates.
- Audio updates.

Content-only changes may use patch or minor versions depending on their impact.

---

# Entry Requirements

Every formal release entry should include:

- Version.
- Date.
- Release type.
- Summary.
- Relevant changes.
- Migration requirements.
- Known limitations when applicable.
- Related milestone when applicable.

---

# Change Approval

Changes affecting the following require explicit approval before being recorded as final:

- MVP scope.
- Product modules.
- Official folder structure.
- Architecture.
- Database model.
- Authentication strategy.
- AI provider.
- Audio provider.
- Educational methodology.
- Competency model.
- Pricing.
- Privacy behavior.
- Production deployment.

Claude Code must not independently approve these changes.

---

# Documentation Synchronization

When a significant change is approved, update all affected documents.

Examples:

## New MVP Feature

Update:

- `mvp.md`
- `roadmap.md`
- `milestones.md`
- `project/TASKS.md` (corrected 2026-09-05 - the docs/05_development/tasks.md this used to say was deleted as a stale duplicate)
- `testing.md`
- Relevant product or engineering document
- `changelog.md`

## Architecture Change

Update:

- Relevant `03_engineering` document.
- `deployment.md` when necessary.
- `testing.md` when necessary.
- `project/TASKS.md` (corrected 2026-09-05 - see the note above).
- `changelog.md`.

## Curriculum Change

Update:

- Relevant `02_academy` documents.
- `mvp.md` when scope changes.
- Content tasks.
- Testing requirements.
- `changelog.md`.

Documentation must not contradict the implemented system.

---

# TASKS.md Relationship

The file:

```text
/project/TASKS.md
```

tracks active operational work. (Relocated from repo root to `/project` on
2026-08-07 — see the `[0.0.2]` entry below.)

This changelog records completed and approved meaningful changes.

Example workflow:

```text
Task added to /project/TASKS.md

↓

Task implemented

↓

Tests completed

↓

Task approved

↓

Relevant documentation updated

↓

Change recorded in changelog.md
```

Do not record unfinished tasks as completed changes.

---

# Changelog Maintenance Rules

- Keep newest entries at the top.
- Do not rewrite historical entries without reason.
- Correct factual mistakes transparently.
- Do not delete past release entries.
- Mark reverted changes explicitly.
- Link changes to versions.
- Include migration notes when required.
- Avoid vague descriptions such as “improvements” without context.
- Do not expose secrets or private learner data.
- Do not include confidential provider credentials.

---

# Reverted Changes

When a released change is reverted, add a new entry.

Example:

```text
### Reverted

- Reverted the new lesson navigation introduced in version 0.4.0 because it caused progress loss on mobile.
```

Do not silently remove the original entry.

---

# Deprecated Features

When functionality will be removed later, record it as deprecated.

Example:

```text
### Deprecated

- Deprecated the legacy audio-generation endpoint. It will be removed in version 1.5.0.
```

Include:

- Replacement.
- Expected removal version.
- Required migration.

---

# Breaking Changes

Breaking changes must be clearly identified.

Example:

```text
### Breaking Changes

- Replaced the lesson progress data structure. Existing development databases must run migration 20260805_lesson_progress_v2.
```

Breaking changes should include explicit migration instructions.

---

# Known Limitations

Release entries may contain a Known Limitations section.

Use it for accepted issues that do not block release.

Example:

```text
### Known Limitations

- Speaking feedback may be less accurate in noisy environments.
- Safari may require an additional interaction before audio playback.
```

Critical defects must never be presented only as known limitations.

---

# Initial Project Record

## [0.0.1] — 2026-08-05

Release Type: Project Documentation Foundation

### Added

- Established the official HanGo company documentation.
- Defined the product vision and MVP.
- Defined the Academy learning system.
- Defined the engineering architecture.
- Defined the MVP design system.
- Defined the development roadmap.
- Defined milestones and executable tasks.
- Defined testing and deployment strategies.
- Added the official changelog process.

### Changed

- Reduced the MVP design documentation to five essential files:
  - `branding.md`
  - `design_system.md`
  - `components.md`
  - `ui.md`
  - `ux_principles.md`

- Clarified the distinction between:
  - `docs/05_development/tasks.md`
  - Root-level `TASKS.md`

### Documentation

- Completed the initial documentation foundation required before implementation.
- Established `/docs` as the official project knowledge base.
- Established root-level `TASKS.md` as the active execution board.

### Migration Notes

- No software migration is required.
- Future implementation must follow the approved documentation and folder structure.

---

## [0.0.2] — 2026-08-07

Release Type: Project Organization

### Summary

FASE 1–16 and the full visual redesign (`DESIGN_TASKS.md`) are complete.
With the repo root accumulating several operational planning documents,
moved them into a dedicated folder to keep root-level clutter to genuinely
root-required files (tool configs, `README.md`, `CLAUDE.md`, `AGENTS.md`).

### Changed

- Moved from repo root into `/project`:
  - `TASKS.md`
  - `DESIGN_TASKS.md`
  - `PROMPT_CONTINUACION.md` (new — a continuation prompt for resuming
    work in a fresh session)
  - `TASKS_CIERRE_BETA.md` (new — a concrete, decisions-already-made
    version of FASE 17 for reaching closed beta)
- This supersedes the `[0.0.1]` decision to keep `TASKS.md` at repo root —
  see the "TASKS.md Relationship" section above for the current location.
- Updated `README.md`'s two links to `TASKS.md` accordingly.

### Documentation

- `README.md`.
- This file (`changelog.md`).

### Migration Notes

- No software migration required — these are project-management documents
  only, not referenced by application code at build or runtime.
- Doc-comments inside component files that informally mention
  "DESIGN_TASKS.md" by name (not as a clickable link) were **not** updated
  to the new path — there are ~12 of them, and they're prose references to
  the document, not broken links.

---

## [0.0.3] — 2026-08-07

Release Type: Project Organization

### Summary

`project/TASKS.md` had drifted significantly from the real state of the
code — most notably it still claimed FASE 9 (Audio Engine) was skipped
and no voice input/output existed anywhere, while the codebase actually
had a substantial, working Han voice system (`app/api/han/speech/route.ts`,
`app/api/han/realtime/route.ts`, live voice conversation in the AI Teacher
chat, a Settings audio panel) that no task document ever recorded. This
happened because the user works with more than one AI assistant on this
codebase in parallel, and only one of them was keeping this file current.

### Changed

- Archived the full FASE 0–16 historical `TASKS.md` content, unmodified,
  as `project/TASKS_ARCHIVE.md`.
- Rewrote `project/TASKS.md` to track only remaining/active work, verified
  against the real codebase rather than trusted from the prior document:
  FASE 9's real status, the new "Lesson Interactivity Upgrade" work
  (Vocabulary/Situation steps becoming AI- and voice-interactive, agreed
  with the user 2026-08-07), and the previously-known FASE 15.5/16.3/
  16.4/16.7/17 gaps.
- Updated `README.md`'s task-list link description to point to both files
  and flag that the archive's "Complete"/"Skipped" labels aren't fully
  trustworthy for voice/audio-related work.

### Migration Notes

- No software migration required.
- FASE 0–8, 10–16 in the new `TASKS.md` were carried forward from the
  archive without a fresh line-by-line re-audit (only FASE 9 and the new
  Lesson Interactivity work got one this pass) — if future work depends on
  a specific "Complete" phase, verify against the code first per the
  lesson recorded at the top of the new `TASKS.md`.

---

## [0.0.4] — 2026-08-08

Release Type: Project Organization

### Summary

`project/` had grown to 6 planning documents (`TASKS.md`,
`TASKS_ARCHIVE.md`, `DESIGN_TASKS.md`, `PROMPT_CONTINUACION.md`,
`TASKS_CIERRE_BETA.md`, `PROMPT_OPENAI_FASE_F.md`) as work accumulated
across many sessions. User feedback, verbatim: "no entiendo por que
creas tantos tasks, nos estamos mareando... hay tantos que hasta yo me
mareo" (too many files, actively confusing to track). Consolidated down
to 2.

### Changed

- Merged `DESIGN_TASKS.md` (the closed, 8-phase visual redesign record)
  into `project/TASKS_ARCHIVE.md` as a new section, content unchanged.
- Merged `TASKS_CIERRE_BETA.md` (the concrete FASE 17 beta-launch plan)
  into `project/TASKS.md` directly as its FASE 17 section, correcting two
  lines that had gone stale since it was written (OpenAI is now
  connected; FASE 9 audio is now mostly built, not skipped).
- Folded `PROMPT_CONTINUACION.md`'s durable content (working conventions,
  AI provider status) into a new "Working conventions" section at the top
  of `project/TASKS.md` - the rest of that file had gone stale enough
  (pre-redesign, pre-audio, wrong AI model) that keeping it as a separate
  document was actively misleading rather than useful.
- Deleted `PROMPT_OPENAI_FASE_F.md` - a single-use handoff message for
  one task, already delivered to the user in conversation; its content
  duplicated what's already in `TASKS.md`'s Phase F section, which
  remains the source of truth.
- Updated `README.md`'s two references accordingly.

### Migration Notes

- No software migration required — these are project-management
  documents only, not referenced by application code at build or
  runtime.
- `project/` now contains exactly 2 files: `TASKS.md` (active, read this
  one) and `TASKS_ARCHIVE.md` (frozen historical detail, rarely needed).

---

# Future Entry Template

Copy this structure for future releases:

```markdown
## [0.0.0] — YYYY-MM-DD

Release Type: Development / Alpha / Beta / Production / Hotfix / Content

### Summary

Brief description of the release.

### Added

- New functionality.

### Changed

- Modified functionality.

### Fixed

- Corrected defects.

### Removed

- Removed functionality.

### Security

- Security-related changes.

### Migration Notes

- Required migrations or configuration changes.

### Documentation

- Documents updated.

### Known Limitations

- Accepted non-blocking limitations.
```

---

# Release Entry Example

```markdown
## [0.2.0] — 2026-10-15

Release Type: Alpha

### Summary

Introduced the first complete Restaurant lesson and contextual AI Teacher prototype.

### Added

- Restaurant Lesson 1.
- Dialogue rendering.
- Vocabulary and grammar sections.
- Multiple-choice exercises.
- Text-based AI Teacher.
- Lesson progress autosave.

### Changed

- Updated lesson navigation to use ordered lesson steps.
- Updated the learner profile to store explanation language.

### Fixed

- Corrected incorrect Pinyin in two dialogue lines.
- Fixed progress loss after browser refresh.

### Migration Notes

- Run the learner-profile migration.
- Add the AI provider environment variables.

### Documentation

- Updated `database.md`.
- Updated `ai_architecture.md`.
- Updated `tasks.md`.
- Updated `testing.md`.

### Known Limitations

- Audio playback is not available in this release.
- Speaking and Writing Lab remain placeholders.
```

---

# Changelog Acceptance Criteria

This changelog system is correctly maintained when:

- Every formal release has an entry.
- Significant scope changes are recorded.
- Breaking changes include migration notes.
- Security changes are documented safely.
- Documentation updates remain traceable.
- Historical releases are preserved.
- Root tasks and completed releases are not confused.
- Current implementation and official documentation remain aligned.

---

# Success Definition

The HanGo changelog succeeds when any developer or project owner can understand how the platform evolved, why important decisions were made, and what operational actions are required for each release.

---

End of document.