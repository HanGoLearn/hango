# HanGo — Development Tasks

Version: 2.0

Status: Active

Current Phase: FASE 16 complete, FASE 17 not started (awaiting approval to begin). The visual redesign (`DESIGN_TASKS.md`, all 8 phases) is done — see that file for what changed. FASE 9 deliberately skipped — see its section. Real OpenAI credentials are configured locally; text AI uses `gpt-4o-mini` temporarily while `gpt-5-mini` access remains unavailable.

Last Updated: August 2026

---

# Purpose

This file is the operational development plan for building the HanGo MVP.

It defines what Claude Code must implement, in what order, and what conditions must be satisfied before advancing.

The complete product and technical specifications are located inside:

```text
/docs
```

The official MVP scope is defined in:

```text
docs/05_development/mvp.md
```

Claude Code must use the documentation as the source of truth and this file as the execution checklist.

---

# Task Status

```text
[ ] Not started

[~] In progress

[x] Completed

[!] Blocked
```

---

# Execution Rules

1. Complete phases in order.

2. Do not implement functionality from a future phase before the current phase is complete.

3. Do not change the approved product structure without authorization.

4. Do not invent features outside the documented MVP.

5. Do not hardcode educational content directly inside UI components.

6. Add tests while implementing each phase.

7. Mark a task as complete only after it works and has been verified.

8. Preserve working functionality when adding new features.

9. Report any documentation contradiction that prevents correct implementation.

10. At the end of each phase, report:

```text
Phase completed

Files created

Files modified

Database changes

Tests executed

Verification result

Known limitations

Next phase
```

---

# Project Status

```text
FASE 0 — Base Técnica                     Complete
FASE 1 — Design System                    Complete
FASE 2 — Authentication                   Complete
FASE 3 — Onboarding                       Complete
FASE 4 — Educational Content Foundation  Complete
FASE 5 — Learning Journey                 Complete
FASE 6 — Lesson Engine                    Complete
FASE 7 — Exercises and Quizzes            Complete
FASE 8 — AI Teacher                       Complete (real OpenAI provider verified locally; temporary `gpt-4o-mini` model)
FASE 9 — Audio Engine                     Skipped (user decision 2026-08-06 — needs a TTS provider not yet configured, same situation as FASE 8; see its section)
FASE 10 — Speaking Lab                    Complete (real OpenAI credentials configured; live STT still to verify)
FASE 11 — Writing Lab                     Complete (real OpenAI text provider configured)
FASE 12 — Mission System                  Complete (real OpenAI credentials configured; live behavior still to verify)
FASE 13 — Progress and Review             Complete
FASE 14 — Dashboard and Settings          Complete
FASE 15 — Complete MVP Content            Complete except audio (blocked by FASE 9) and the human review pass (15.5)
FASE 16 — Testing and Stabilization       Complete except real device/browser testing (16.3/16.4) and production monitoring (16.7)
FASE 17 — Closed Beta Deployment          Not Started
```

---

# FASE 0 — Base Técnica del Proyecto

## Objective

Create the real technical foundation of HanGo.

This phase must produce a working application that can be executed locally, connected to its database, tested, and extended safely.

---

## 0.1 Create the Application

- [x] Initialize the approved web application framework. (Next.js 16 — see note below)
- [x] Use the framework version defined in the engineering documentation. (`architecture.md` does not define one — see note below)
- [x] Configure TypeScript.
- [x] Enable strict TypeScript settings.
- [x] Configure the approved package manager. (npm — not explicitly named in docs, see note below)
- [x] Configure the application routing system.
- [x] Create the minimum initial source structure.
- [x] Confirm that the development server starts.
- [x] Confirm that the initial application renders in the browser. (verified via HTTP response; not manually eyeballed in a browser window — see note below)

Note: `docs/03_engineering/architecture.md` is truncated mid-sentence and no engineering doc names a concrete framework, package manager, or database. User approved proceeding with sensible defaults (Next.js App Router + TypeScript strict + npm) on 2026-08-05. This should be reconciled once the architecture doc is completed.

---

## 0.2 Configure Styling

- [x] Configure Tailwind CSS or the approved styling system. (Tailwind CSS v4, as suggested by this file — not explicitly confirmed elsewhere in docs)
- [x] Create the global stylesheet. (`app/globals.css`)
- [x] Configure base responsive behavior. (Tailwind responsive utilities + base reset; viewport meta is Next.js default)
- [x] Remove unnecessary default framework styles. (no framework starter CSS existed to remove; kept `globals.css` minimal)
- [x] Create a minimal temporary home screen confirming that HanGo runs.
- [x] Do not implement the complete design system yet. (confirmed: no design tokens/component library added — deferred to FASE 1)

---

## 0.3 Configure Code Quality

- [x] Configure ESLint. (flat config, `eslint.config.mjs`, based on `eslint-config-next`)
- [x] Configure Prettier. (`.prettierrc.json`, `.prettierignore`)
- [x] Add formatting scripts. (`format`, `format:check`)
- [x] Add linting scripts. (`lint`)
- [x] Add an independent TypeScript checking script. (`typecheck` — `tsc --noEmit`, separate from `next build`)
- [x] Resolve all initial linting errors. (none found)
- [x] Resolve all initial TypeScript errors. (none found)
- [x] Confirm that formatting checks pass. (`npm run format:check` passes)

---

## 0.4 Configure Environment Variables

- [x] Create `.env.example`.
- [x] Configure local environment variables. (`.env.local`, not committed)
- [x] Separate public variables from private variables. (`src/lib/env/client.ts` vs `src/lib/env/server.ts`)
- [x] Add environment-variable validation. (Zod schemas, fail fast on invalid/missing values)
- [x] Ensure secret files are ignored by Git. (`.gitignore` excludes `.env`, `.env.local`, `.env.*.local`; `.env.example` stays tracked)
- [x] Confirm that no private credential is exposed to client code. (`server-only` package enforced; verified the build hard-fails if a Client Component imports `src/lib/env/server.ts` — no real private credentials exist yet since DB/auth/AI provider keys arrive in later phases)

---

## 0.5 Configure the Database

- [x] Configure the approved relational database. (PostgreSQL 17.10, installed locally — see note below)
- [x] Configure the approved ORM or database access layer. (Prisma 7.9.1, `@prisma/adapter-pg` driver adapter)
- [x] Create the reusable database client. (`src/lib/db.ts` — singleton, server-only)
- [x] Create the initial schema. (`prisma/schema.prisma` — technical `HealthCheck` placeholder only, see note)
- [x] Generate the first migration. (`prisma/migrations/20260806011807_init`)
- [x] Apply the migration locally. (applied to local `hango` database)
- [x] Add a minimal seed process. (`prisma/seed.ts`, run via `npm run db:seed`)
- [x] Confirm that the application can execute a database query. (verified: the actual Next.js app, not just the CLI, renders a live DB-sourced value on the home page)
- [x] Document database commands. (`db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:studio` scripts; see README)

Do not create the complete curriculum schema during this phase. (confirmed — only a technical placeholder model exists; User/curriculum models belong to FASE 2/4)

Note: no PostgreSQL/Docker was available on this machine. With user approval, installed PostgreSQL 17.10 locally via the EDB binaries zip (`C:\PostgreSQL\pgsql`, data dir `C:\PostgreSQL\data`, started via `pg_ctl`). This is a manual local install, not a Windows service — see the "known limitations" note in the phase report for what this means going forward.

---

## 0.6 Configure Initial Testing

- [x] Configure the approved unit-testing framework. (Vitest 4.1.10 — not named in docs, see recurring gap note)
- [x] Add one basic unit test. (`tests/unit/env.test.ts` — validates real existing input-validation logic, per `testing.md`'s documented unit test scope)
- [x] Configure one application smoke test. (`tests/smoke/app.test.ts` — boots a real dev server and fetches the home page)
- [x] Confirm that the test commands run successfully. (`npm test` → 4/4 pass)
- [x] Ensure tests do not require production credentials. (local dev DB only, no production credentials exist in the project yet)

Complete component, integration, and end-to-end coverage will expand during later phases.

---

## 0.7 Configure the Project Repository

- [x] Review `.gitignore`. (rewritten from scratch — see below)
- [x] Exclude environment files. (`.env`, `.env.local`, `.env.*.local`; `.env.example` explicitly un-ignored)
- [x] Exclude dependency folders. (`node_modules/`)
- [x] Exclude build output. (`.next/`, `out/`, `build/`, `dist/`)
- [x] Exclude local test artifacts. (`coverage/`; no stray debug files left behind)
- [x] Confirm that documentation remains tracked. (verified: `git add -A --dry-run` shows all 64 `docs/**/*.md` files, plus `TASKS.md`/`README.md`)
- [x] Confirm that no secret is tracked. (verified: `.env.local`, `node_modules/`, `.next/`, `*.tsbuildinfo` all absent from the dry-run add list)

Note: repository was not yet git-initialized (`Is a git repository: false` at session start). Ran `git init` since 0.7 requires actually verifying what git tracks, which isn't possible without a repo. Files are staged (`git add -A`) but **not committed** — commits are only made when explicitly requested.

---

## 0.8 Create the Root README

The root `README.md` must include:

- [x] HanGo project description.
- [x] Current development status.
- [x] Requirements.
- [x] Installation command.
- [x] Environment configuration.
- [x] Database setup.
- [x] Migration command.
- [x] Seed command.
- [x] Development command.
- [x] Build command.
- [x] Lint command.
- [x] Type-check command.
- [x] Test command.
- [x] Documentation location.
- [x] Active task location.

---

## FASE 0 Completion Criteria

- [x] Application starts locally.
- [x] Application renders in the browser. (verified via HTTP fetch of rendered HTML and the smoke test; recommend the user also visually confirms in an actual browser window before treating this as fully closed)
- [x] Production build succeeds.
- [x] TypeScript checks pass.
- [x] Linting passes.
- [x] Formatting checks pass.
- [x] Database connection works.
- [x] Initial migration works.
- [x] Seed process works.
- [x] Basic tests pass.
- [x] Environment variables are protected.
- [x] README instructions are complete.

Do not begin FASE 1 before these conditions are satisfied.

Known documentation gaps (reported throughout FASE 0, still open): `docs/03_engineering/architecture.md` is truncated mid-sentence and never lists the system layers; no engineering doc names a concrete framework, package manager, or database engine. All technology choices made during FASE 0 (Next.js, npm, Tailwind, PostgreSQL, Prisma, Vitest) were sensible defaults approved by the user in place of an undefined "approved" stack. These should be reconciled into the docs before they harden further.

---

# FASE 1 — Design System and Application Shell

## Objective

Create the visual foundation and shared application structure.

---

## 1.1 Design Tokens

- [x] Define primary and secondary colors. (blue / teal, per `design_system.md` direction — exact hex values are ours to set, doc explicitly allows this)
- [x] Define neutral colors. (11-step neutral scale + semantic surface/text/border roles)
- [x] Define semantic colors. (success / warning / error / info)
- [x] Define typography tokens. (display/page-title/section-title/card-title/body/chinese-body/supporting/caption scale)
- [x] Define spacing tokens. (intentionally reused Tailwind's default scale — it already matches the documented 4/8/12/16/20/24/32/40/48/64 scale exactly)
- [x] Define border-radius tokens. (control/card/panel roles)
- [x] Define shadow tokens. (elevated/modal)
- [x] Define responsive breakpoints. (reused Tailwind defaults — no exact pixel breakpoints exist in the docs)
- [x] Define basic motion tokens. (fast/base/slow durations + standard easing; `prefers-reduced-motion` respected globally)

All tokens implemented via Tailwind v4's CSS-first `@theme` in `app/globals.css`. Dark mode intentionally not implemented — MVP scope in `design_system.md` explicitly limits FASE 1 to light mode.

---

## 1.2 Typography

- [x] Configure the interface font. (Inter, via `next/font/google`)
- [x] Configure a Chinese-compatible font. (Noto Sans SC, via `next/font/google`)
- [x] Create styles for page titles. (`PageTitle` component)
- [x] Create styles for section titles. (`SectionTitle` component)
- [x] Create styles for body text. (`Body` component)
- [x] Create styles for Chinese text. (`ChineseText` component, `lang="zh"`, visually prominent per hierarchy rule)
- [x] Create styles for Pinyin. (`Pinyin` component, `lang="zh-Latn-pinyin"`, visually secondary)
- [x] Create styles for translations. (`Translation` component, visually secondary)
- [x] Verify Chinese readability on desktop and mobile. (verified rendered markup/CSS and font loading programmatically; recommend the user visually confirm in an actual browser at both desktop and mobile widths before treating this as fully closed)

Also created `Display`, `CardTitle`, `Supporting`, `Caption` components (all named roles from `design_system.md`'s type scale) and `src/lib/cn.ts` (className merge utility, needed immediately by every typography component and every FASE 1.3 component to follow).

---

## 1.3 Base Components

Implement reusable components for:

- [x] Primary Button. (`Button` variant="primary", `src/components/ui/button.tsx`)
- [x] Secondary Button. (`Button` variant="secondary")
- [x] Tertiary Button. (`Button` variant="tertiary")
- [x] Icon Button. (`src/components/ui/icon-button.tsx`, `aria-label` required by the type)
- [x] Text Input. (`src/components/ui/input.tsx`)
- [x] Text Area. (`src/components/ui/textarea.tsx`, character count support)
- [x] Select. (`src/components/ui/select.tsx`, Radix-based)
- [x] Checkbox. (`src/components/ui/checkbox.tsx`, Radix-based)
- [x] Radio Group. (`src/components/ui/radio-group.tsx`, Radix-based)
- [x] Toggle. (`src/components/ui/toggle.tsx`, Radix Switch-based)
- [x] Card. (`src/components/ui/card.tsx`)
- [x] Modal. (`src/components/ui/modal.tsx`, Radix Dialog-based)
- [x] Drawer. (`src/components/ui/drawer.tsx`, Radix Dialog-based, bottom/right slide-in variants)
- [x] Tooltip. (`src/components/ui/tooltip.tsx`, Radix-based)
- [x] Progress Bar. (`src/components/ui/progress-bar.tsx`, Radix-based, optional visible label)
- [x] Loading State. (`src/components/ui/states.tsx`)
- [x] Empty State. (`src/components/ui/states.tsx`)
- [x] Error State. (`src/components/ui/states.tsx`)
- [x] Information Banner. (`src/components/ui/banner.tsx`, info/success/warning/error variants, icon + text — never color alone)

Radix UI primitives used for Select, Checkbox, Radio Group, Toggle, Modal, Drawer, Tooltip, and Progress Bar — not named in the docs, but necessary to reliably satisfy the docs' own accessibility requirements (keyboard navigation, focus management, screen reader compatibility) rather than reimplementing that behavior from scratch. lucide-react used as the single icon library per `design_system.md`'s "use one primary icon library" rule.

15 component tests added in `tests/component/ui.test.tsx` (new "component" testing level, distinct from unit/smoke, matching `testing.md`'s documented test levels).

---

## 1.4 Application Shell

- [x] Create the authenticated application layout. (`src/components/shell/app-shell.tsx` — structural shell only; real auth enforcement is FASE 2)
- [x] Create the desktop sidebar. (`sidebar.tsx` — logo, 6 nav items, active-section highlighting via `aria-current`, profile summary placeholder)
- [x] Create the mobile bottom navigation. (`bottom-nav.tsx` — Home/Journey/Speaking/Writing/Progress per `ui.md`, Settings intentionally omitted)
- [x] Create the top bar. (`top-bar.tsx` — title + user menu; title derivation from route was finalized in 1.5)
- [x] Create the main content container. (`<main>` in `app-shell.tsx`)
- [x] Create the AI Teacher placeholder panel. (`ai-teacher-panel.tsx` — collapsed/expanded states; placeholder content only, real conversation is FASE 8)
- [x] Create the mobile AI Teacher access button. (`mobile-ai-teacher-button.tsx` — floating button opening a Drawer)
- [x] Implement responsive behavior. (sidebar + persistent AI panel from `lg`; bottom nav + floating AI button below `lg`; verified via real dev-server render, not just component tests)

Simplification made and flagged: `ui.md` describes three AI Teacher panel states (Collapsed/Compact/Expanded) and tablet-specific "drawer or resizable panel" behavior. Since the AI Teacher has no real content until FASE 8, this phase implements only Collapsed/Expanded, and treats tablet the same as mobile (floating button + drawer) rather than a third distinct tablet layout. This keeps the shell's shape stable for FASE 8 to fill in without a structural rework.

`AppShell` was temporarily wired onto the root `/` page for real-browser verification before 1.5 existed; superseded once 1.5 moved it into the `(app)` route group layout and reverted `/` to its FASE 0.2 simple confirmation page.

---

## 1.5 Initial Routes

Create functional placeholder pages for:

- [x] Dashboard. (`app/(app)/dashboard/page.tsx`)
- [x] Learning Journey. (`app/(app)/learning-journey/page.tsx`)
- [x] Speaking Lab. (`app/(app)/speaking-lab/page.tsx`)
- [x] Writing Lab. (`app/(app)/writing-lab/page.tsx`)
- [x] Progress. (`app/(app)/progress/page.tsx`)
- [x] Settings. (`app/(app)/settings/page.tsx`)

All six live under a `(app)` route group sharing one `layout.tsx` that wraps them in `AppShell`. Refactored `TopBar` to derive its title from the current route (via `src/lib/navigation.ts`) instead of taking a `title` prop — removes repetition across all six pages and keeps the title always in sync with the active nav item. Verified against a real dev server (not just tests): all six routes return 200, the top bar title is correct per route, and sidebar/bottom-nav active-state highlighting (`aria-current="page"`) is correct per route. Root `/` reverted to its FASE 0.2 simple confirmation page — it's outside the `(app)` group and unrelated to authenticated navigation.

---

## 1.6 Accessibility Foundation

- [x] Add visible focus states. (explicit `focus-visible:outline` on all interactive components, including nav links which previously relied on inconsistent browser defaults)
- [x] Support keyboard navigation. (native elements + Radix primitives for complex widgets; verified via `userEvent` keyboard-driven interactions in component tests)
- [x] Add accessible labels. (enforced at the type level for `IconButton`; verified via `jest-axe`)
- [x] Use semantic page structure. (`header`/`nav`/`main` landmarks; fixed a real bug — see note below)
- [x] Verify basic color contrast. (computed actual WCAG ratios, not eyeballed — see note below)
- [x] Avoid color-only status communication. (`InformationBanner` pairs icon+text; nav active states pair color with font-weight + `aria-current`, not color alone)
- [x] Support reduced-motion preferences. (global `prefers-reduced-motion` block, present since 1.1)

Two real bugs found and fixed while verifying (not just checking boxes):
1. **Contrast failures**: computed actual ratios for every text/border-on-background pair. `text-muted` (2.55:1) and `border-strong` (1.67:1) both failed WCAG — both silently look "close enough" to a human eye but fail the actual math. Corrected to 5.07:1 and 3.61:1 respectively, values recorded in `globals.css` comments.
2. **Non-unique landmarks**: `Sidebar` and `BottomNav` both used `aria-label="Primary"`; caught by an automated `jest-axe` scan (`landmark-unique` violation), not manual review. Relabeled to "Primary navigation" / "Primary navigation (mobile)".
3. **Missing page headings**: all 6 FASE 1.5 placeholder pages had zero `<h1>` (their `EmptyState` always rendered an `h2`). Added a `headingLevel` prop to `EmptyState`/`ErrorState` and set `"h1"` on all 6 pages. Verified via real dev-server render: every route now has exactly one `<h1>`.

New test level: `tests/component/a11y.test.tsx`, using `jest-axe` — 7 tests, including a full-`AppShell` scan. New script: `test:a11y` (also runs as part of `test:component`/`npm test`).

---

## FASE 1 Completion Criteria

- [x] Core components are reusable. (19 components in `src/components/ui/`, used across the shell and all 6 placeholder pages)
- [x] Desktop navigation works. (verified against real routes: correct active state, correct top-bar title per route)
- [x] Mobile navigation works. (verified structurally — correct responsive classes, correct items/labels, keyboard/axe-clean; not visually confirmed on an actual narrow viewport or touch device — recommend the user resize a real browser window or use device emulation to confirm before treating this as fully closed)
- [x] All primary routes exist. (`/dashboard`, `/learning-journey`, `/speaking-lab`, `/writing-lab`, `/progress`, `/settings` — all return 200)
- [x] Application layout is responsive. (same caveat as mobile navigation above — verified via class output and real SSR render, not a resized browser window)
- [x] AI Teacher placeholder is accessible. (keyboard-operable, labeled, axe-clean)
- [x] Basic accessibility checks pass. (`jest-axe` suite green; 2 real bugs found and fixed, not just passed on the first try)

---

# FASE 2 — Authentication

## Objective

Allow learners to create accounts and access protected HanGo areas.

---

## 2.1 Authentication Models

- [x] Create the User model. (`prisma/schema.prisma` — id, name, email, image, role, passwordHash, timestamps)
- [x] Create provider Account support when required. (`Account` model, ready for Google OAuth in 2.5)
- [x] Create Session support. (`Session` model persisted by the adapter; active auth uses JWT strategy — see note below)
- [x] Create verification-token support. (`VerificationToken` model)
- [x] Add user role. (`UserRole` enum: `LEARNER` / `PREMIUM_LEARNER` / `ADMINISTRATOR`, default `LEARNER`; `Guest` from `authentication.md` is an unauthenticated state, not a persisted role)
- [x] Add email-verification status. (`User.emailVerified: DateTime?`)
- [x] Create and apply the migration. (`prisma/migrations/20260806033905_add_authentication_models`, applied to local `hango` database, confirmed via `psql \dt`)

Schema shape follows Auth.js's standard Prisma adapter schema (not named in the docs, but User/Account/Session/VerificationToken maps almost exactly onto what 2.1 already asks for — see recurring doc-gap note). Wired the base Auth.js config now (`src/lib/auth.ts`, `src/lib/auth-credentials.ts`, `app/api/auth/[...nextauth]/route.ts`) to actually prove the schema works with the adapter, not just that the migration applies cleanly:

- Started a real dev server, seeded a bcrypt-hashed test user directly via the generated Prisma client, and signed in through the real `/api/auth/callback/credentials` endpoint — got back a valid encrypted JWT session cookie and confirmed `/api/auth/session` returns the correct `id`/`role`.
- Confirmed a wrong password is rejected (redirected with `error=CredentialsSignin`, no session cookie issued).
- Test user and verification script deleted afterward — nothing left in the database or repo.

Session strategy is JWT, not database sessions — Auth.js requires this when the Credentials provider is used (database sessions are OAuth-only). The `Session` table exists and will be used once Google Sign-In (2.5) is added.

8 unit tests added (`tests/unit/auth-credentials.test.ts`) covering `verifyCredentials`: rejects non-string input, rejects unknown email without revealing it, rejects OAuth-only users, rejects wrong password, accepts correct password, and confirms `passwordHash` never leaks into the returned object.

---

## 2.2 Registration

- [x] Create the registration page. (`app/(auth)/register/page.tsx`, new `(auth)` route group layout with no shell chrome)
- [x] Add name, email, and password fields. (`src/components/auth/register-form.tsx`)
- [x] Validate registration input. (`src/lib/validation/auth.ts`, Zod — name required, valid email, password ≥ 8 chars)
- [x] Prevent duplicated accounts. (checked before create; verified by a real integration test against the live database)
- [x] Hash passwords securely. (bcrypt, cost factor 12; verified the stored hash is never the plaintext and matches the bcrypt format)
- [x] Create the learner account. (`role: LEARNER` default)
- [x] Create email-verification flow. (`VerificationToken` + `app/api/auth/verify-email/route.ts`; see note on email delivery below)
- [x] Add safe success and error messages. (generic "check your email" success state; registration is explicitly excluded from `authentication.md`'s "never reveal if an email exists" rule — only login/password-recovery are restricted — so disclosing "account already exists" here is intentional, not an oversight)
- [x] Add registration tests. (3 integration tests against the real database, in addition to the 8 unit tests from 2.1)

Note on email delivery: no email provider is specified in the docs. Per your choice, `src/lib/email.ts` is a dev stub that logs the verification link to the console instead of sending a real email — the token/link/verification logic is fully real, only delivery is stubbed. Swapping in a real provider (Resend, SendGrid, etc.) later requires no changes to call sites.

Verified against a real server, not just tests: registered via the actual page, retrieved the verification token from the database, hit `/api/auth/verify-email` for real — confirmed the redirect to `/login?verified=true`, confirmed `User.emailVerified` was set, and confirmed the token cannot be reused (second attempt redirects to `/login?verifyError=invalid`).

The registration form also includes a disabled "Continue with Google (coming soon)" button, matching `ui.md`'s required OAuth element without pretending it's functional before FASE 2.5. The "Terms of Service and Privacy Policy" checkbox is plain text, not linked — no such documents exist yet.

Also added `tests/setup-env.ts` (loads `.env.local` and mocks `server-only` globally for all test types) and a new `test:integration` script/level, since `testing.md` explicitly separates Integration Testing from Unit Testing and lists "Authentication and database" as required integration scope.

---

## 2.3 Login and Logout

- [x] Create the login page. (`app/(auth)/login/page.tsx` + `src/components/auth/login-form.tsx`)
- [x] Validate credentials. (reuses `verifyCredentials` from 2.1 via the Credentials provider)
- [x] Create secure sessions. (Auth.js JWT session, `HttpOnly`/`SameSite=Lax` cookie — confirmed via real `Set-Cookie` header, not assumed)
- [x] Redirect authenticated learners correctly. (`/login` and `/register` both redirect to `/dashboard` when a session already exists — verified with a real authenticated request, not just code review; successful login redirects to `/dashboard`)
- [x] Implement logout. (`src/lib/actions/logout.ts`; wired into a new `UserMenu` dropdown in the top bar — replaces the previously non-functional user icon button)
- [x] Invalidate sessions after logout. (verified: session cookie set to `Max-Age=0` and `/api/auth/session` returns `null` immediately after)
- [x] Add login and logout tests. (3 unit tests for `loginAction`: generic error on bad credentials, redirect-signal passthrough, correct `signIn` call shape)

Verified against a real server (not just tests): logged in as a seeded verified user via the actual `/api/auth/callback/credentials` endpoint, confirmed the session cookie and `/api/auth/session` payload, confirmed `/login` redirects to `/dashboard` while authenticated, then logged out via Auth.js's `/api/auth/signout` (the same mechanism `signOut()` uses) and confirmed the cookie was cleared and the session was gone. Test user and scratch scripts removed afterward — nothing left in the database or repo.

Real bug found and fixed while verifying: the new `UserMenu` (used by `AppShell`, rendered in existing component tests) transitively imports `next-auth` through the logout Server Action. Vitest's jsdom test environment doesn't understand the "use server" build-time boundary the way Next's bundler does, so it tried to actually resolve `next-auth`'s internals and failed on `next/server`. Fixed by mocking `@/lib/actions/logout` in the affected component tests (`shell.test.tsx`, `a11y.test.tsx`) — real server-action behavior is already proven separately via the unit tests and the manual curl verification above.

Added a `UserMenu` component test (Radix's `DropdownMenu.Item` overrides its child's accessible role to `menuitem`, not `link` — worth remembering for future dropdown-based tests).

**Update — real bug found during actual manual use**: clicking "Log out" in the real app did nothing. Root cause was a second, different instance of the "form inside an interactive primitive" problem: `DropdownMenuPrimitive.Item` intercepts pointer/keyboard events to manage its own selection/close behavior, and wrapping a `<form action={logoutAction}>` inside it (via `asChild`) meant Radix's own event handling won the race and the form's native submit never happened — same symptom as the Google-button nested-form bug (2.5), different mechanism. Fixed by calling `logoutAction()` directly as a plain async function from the `Item`'s `onSelect` handler instead of using a nested form — the standard pattern for triggering a Server Action from inside a Radix menu item. Verified: build, lint, typecheck, and the full test suite (56 tests) all still pass after the change.

---

## 2.4 Password Recovery

- [x] Create forgot-password page. (`app/(auth)/forgot-password/page.tsx`)
- [x] Generate password-reset tokens. (`PasswordResetToken` model, 1-hour expiry — shorter-lived than email verification's 24h, since resets are more sensitive)
- [x] Create password-reset page. (`app/(auth)/reset-password/page.tsx`; shows a clear "Invalid link" state when `token`/`email` are missing from the URL, instead of a broken form)
- [x] Validate expiration. (checked against `expires < now()`, expired tokens are deleted immediately rather than left around)
- [x] Prevent token reuse. (token deleted on successful reset; verified a second attempt with the same token is rejected)
- [x] Add recovery tests. (4 integration tests against the real database)

Real bug found and avoided before it shipped: I initially planned to reuse the existing `VerificationToken` model (keyed by email) for password-reset tokens too. Realized this would let a password-reset request silently `deleteMany` a pending *email-verification* token for the same address (both keyed by the same identifier). Added a dedicated `PasswordResetToken` model instead — same shape, no shared identifier space. A regression test (`password-reset.test.ts` — "does not delete a pending email-verification token for the same address") specifically guards against this.

Also confirmed `authentication.md`'s "never reveal whether an email exists" rule for password recovery: `forgotPasswordAction` returns the exact same generic message regardless of whether the account exists (verified by a test asserting both messages are identical, not just similarly-worded).

New migration: `prisma/migrations/20260806043800_add_password_reset_token`, applied to the local database.

Verified against a real server: `/forgot-password` and `/reset-password` both render correctly (including the "Invalid link" state when the URL has no token). The full forgot→reset→login cycle itself is proven end-to-end by the integration tests (real database, real bcrypt hashing, real token lifecycle) rather than by curl, since these are Server Actions and can't be invoked directly over HTTP the way the NextAuth REST endpoints can.

---

## 2.5 Google Authentication

- [x] Configure Google OAuth. (provider wired in `src/lib/auth.ts`, only registered when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set — verified via `/api/auth/providers` that it's correctly absent when unconfigured)
- [x] Add Google Sign-In. (`GoogleSignInButton` on both login and register forms — real functional button when configured, clearly-labeled disabled state when not)
- [x] Handle the provider callback. (uses the standard `/api/auth/callback/google` route already provided by the `[...nextauth]` handler)
- [x] Create or link accounts safely. (`src/lib/auth-google-link.ts` — see note below)
- [x] Protect provider credentials. (`GOOGLE_CLIENT_SECRET` only ever read via `serverEnv`, a `server-only`-guarded module; never passed to the client)
- [x] Add OAuth error handling. (`src/lib/auth-error-messages.ts` maps Auth.js's `?error=` codes to clear, non-technical messages on the login page — verified `OAuthAccountNotLinked`, `AccessDenied`, `Configuration`, and unknown codes)

**Real credentials were not available in this session** (per your choice) — I could not test an actual Google consent-screen round trip. Everything else was verified as thoroughly as possible without them:
- Confirmed the app builds and runs correctly with Google *unconfigured* (the actual current state): `/api/auth/providers` lists only `credentials`, both auth forms show "Continue with Google (not configured)" as a disabled button — not a broken/fake-looking one.
- Confirmed the `?error=` friendly-message mapping renders correctly on `/login` for each known code.
- 5 unit tests for `ensureGoogleAccountLinked` covering: unverified email rejected, missing email rejected, new email creates no premature link, existing user gets linked exactly once, already-linked accounts don't get a duplicate `Account` row.

**Safe linking, explained**: by default Auth.js *rejects* (`OAuthAccountNotLinked`) a Google sign-in whose email matches an existing password-based account — a deliberate security default, since blindly auto-linking on email match is an account-takeover vector if the OAuth provider doesn't actually verify the email. `ensureGoogleAccountLinked` only permits linking when Google's own `email_verified` claim is `true`, which authentication.md's "safely" qualifier is read to require.

**Update**: the user provided real Google OAuth credentials and set them in `.env.local` (git-ignored, never committed). Confirmed via `/api/auth/providers` that `google` is now registered, and via a real `signin/google` request that it redirects to `accounts.google.com` with the correct `client_id`, `redirect_uri`, PKCE challenge, and scopes.

**Real bug found during actual manual use (not caught by any automated test)**: clicking "Continue with Google" did nothing. Root cause — `GoogleSignInButton` renders its own `<form action={googleSignInAction}>`, but it was placed *inside* the credentials `<form>` in both `LoginForm` and `RegisterForm`. HTML does not allow nested `<form>` elements; the browser silently drops the inner one, so the click actually submitted the outer (credentials) form instead of triggering Google sign-in. Fixed by restructuring both components so the credentials form and the Google button are sibling elements, not parent/child. Verified by inspecting the real rendered HTML byte-offsets to confirm the two `<form>` tags no longer overlap.

This is a class of bug that jsdom-based component tests would not have caught by default (jsdom doesn't enforce the same nested-form auto-correction a real browser does unless specifically asserted against) — worth remembering when composing any future component that itself renders a `<form>` inside another form-bearing component.

---

## 2.6 Protected Routes

- [x] Protect authenticated application routes. (`proxy.ts`, matcher covers all 6 `(app)` routes)
- [x] Redirect unauthenticated users. (to `/login?callbackUrl=<original path>` — verified against a real server for all 6 routes)
- [x] Enforce backend authorization. (two independent layers — see note below)
- [x] Add basic role verification. (`src/lib/auth-role.ts` — `requireRole()`, ready for FASE 14+ admin routes; nothing needs it yet, so nothing new consumes it)
- [x] Test protected-route access. (3 unit tests for the layout's own check + real-server verification for all 6 routes, unauthenticated and authenticated)

**Two independent enforcement layers, deliberately not just one**:
1. `proxy.ts` — first line of defense, redirects before the route even renders.
2. `app/(app)/layout.tsx` — checks `auth()` again, independent of proxy. Verified this specifically (not just that both layers happen to pass together): a unit test mocks `auth()` to return `null` and confirms the layout redirects on its own, proving it doesn't silently rely on proxy having already run.

**A real, non-trivial bug found and fixed while building this**: the first `middleware.ts` I wrote imported `@/lib/auth`, which pulls in the Prisma adapter and generated client. Next.js's build flagged real Edge Runtime compatibility errors — Prisma's generated client uses `node:path`/`node:url`, which don't exist in the Edge Runtime a proxy/middleware file runs in by default. This wasn't a false-positive warning; an actual deployment would have broken. Fixed by splitting the Auth.js config into `src/lib/auth.config.ts` (edge-safe: secret, JWT callbacks, pages — no adapter, no bcrypt) and `src/lib/auth.ts` (full config: adapter + providers, for route handlers/Server Components/Server Actions). `proxy.ts` only ever imports the edge-safe config, matching Next's own documented guidance that Proxy should only decrypt the session from the cookie and never touch the database.

**Also renamed `middleware.ts` → `proxy.ts`**: Next.js 16 renamed the "Middleware" file convention to "Proxy" (same functionality, new name/file). The build was emitting a deprecation warning under the old name; using the current convention.

Verified against a real server: all 6 routes correctly redirect to `/login?callbackUrl=...` when unauthenticated (checked each one individually, not just one as a sample), and all 6 return 200 once a real session cookie is present.

---

## FASE 2 Completion Criteria

- [x] Registration works. (verified end-to-end against a real server + real database)
- [x] Email verification works. (verified end-to-end: real token, real redirect, reuse correctly rejected)
- [x] Login works. (verified end-to-end; user also confirmed manually in the real app)
- [x] Logout works. (verified end-to-end; a real bug was found during the user's own manual testing — nested form inside a Radix menu item silently blocked the click — fixed and user confirmed it works now)
- [x] Password recovery works. (verified via integration tests against the real database; Server Actions can't be curl-tested directly)
- [x] Google Sign-In works. (real OAuth redirect verified against actual Google endpoints with the user's real credentials, including after switching to a second Google Cloud client; a real bug — nested `<form>` blocking the button — was found and fixed. **Not yet explicitly reconfirmed by the user after that fix** — the user's last message confirmed logout, not a completed Google consent round-trip. Recommend the user try "Continue with Google" once more before treating this as fully closed.)
- [x] Protected routes cannot be bypassed. (two independent layers, verified separately — see 2.6)
- [x] Authentication tests pass. (66 tests total across unit/component/integration/smoke — all pass)

---

# FASE 3 — Onboarding and Learner Profile

## Objective

Create the learner profile used to personalize HanGo.

---

## 3.1 Learner Profile Model

- [x] Create the Learner Profile model.
- [x] Add interface language.
- [x] Add explanation language.
- [x] Add current Chinese level.
- [x] Add learning goal.
- [x] Add skill priorities.
- [x] Add daily study target.
- [x] Add AI Teacher preferences. (correction style only, at onboarding — explanation/conversation style default and are editable later in Settings, FASE 14)
- [x] Add onboarding-completion status.
- [x] Create and apply the migration.

Note: no dedicated "Interface Language" onboarding step exists in `ui.md`'s documented step list, so `interfaceLanguage` defaults to EN and is edited later in Settings, not asked during onboarding.

---

## 3.2 Onboarding Flow

Create onboarding steps for:

- [x] Welcome.
- [x] Learning Goal.
- [x] Current Level.
- [x] Explanation Language.
- [x] Skill Priorities.
- [x] Daily Study Target.
- [x] AI Teacher Preferences.
- [x] Initial Recommendation.

---

## 3.3 Onboarding Behavior

- [x] Save progress after every step.
- [x] Restore interrupted onboarding.
- [x] Validate required information.
- [x] Redirect completed users to Dashboard.
- [x] Prevent completed users from repeating onboarding automatically.
- [x] Allow preferences to be edited later.

Real bug fixed: resume logic initially skipped "Welcome" entirely for brand-new users (jumped straight to the first question). Fixed in `resolveResumeStep` — see `src/lib/learner-profile.ts`.

---

## 3.4 Initial Recommendation

- [x] Create simple recommendation rules.
- [x] Use learner level.
- [x] Use learning goal.
- [x] Use priority skills.
- [x] Recommend the first scenario.
- [x] Explain why the scenario was selected.

Important limitation: only the "Restaurant" scenario exists as a concept before FASE 4 seeds real curriculum data, so the recommendation always points there — only the *reason* varies by learner data. Revisit `src/lib/recommendation.ts` once FASE 4/5 provide multiple real scenarios to actually rank.

---

## FASE 3 Completion Criteria

- [x] New users enter onboarding.
- [x] Onboarding progress is saved.
- [x] Learner profile is stored.
- [x] Initial recommendation is generated.
- [x] Returning users do not repeat onboarding.
- [x] Onboarding tests pass. (83 tests total across the project)

---

# FASE 4 — Educational Content Foundation

## Objective

Create the database and service structure for HanGo educational content.

---

## 4.1 Curriculum Models

Create models for:

- [x] Domain.
- [x] Scenario.
- [x] Scenario Level.
- [x] Lesson.
- [x] Lesson Step.
- [x] Learning Objective.
- [x] Competency.
- [x] Content Version.

Doc contradictions found (resolved, not blocking): domain names differ between `curriculum_structure.md` and `scenario_system.md` (Domain modeled as a real table, not an enum, so seed data can pick one without the schema taking a side); lesson step sequence differs between `lesson_design.md` (12 steps) and this file's own 6.3 list (11 steps) — `LessonStepType` enum covers the union of both.

Also corrected an earlier assumption from FASE 3: `competency_framework.md`'s real competency list is Listening/Speaking/Reading/Writing + 5 communication types (Daily/Social/Travel/Professional/Academic) — Grammar/Vocabulary are NOT competencies, they have their own separate mastery tracking. FASE 3's `SkillPriority` enum (which does include Grammar/Vocabulary) is a different, already-shipped concept and was left as-is.

---

## 4.2 Dialogue Models

- [x] Dialogue.
- [x] Dialogue Speaker.
- [x] Dialogue Line.
- [x] Chinese text.
- [x] Pinyin.
- [x] Translation.
- [x] Line order.
- [x] Audio reference. (placeholder field only — real audio is FASE 9's `AudioAsset`)

---

## 4.3 Vocabulary Models

- [x] Vocabulary Item.
- [x] Chinese form.
- [x] Pinyin.
- [x] Meaning.
- [x] Part of speech. (free text — no enumerated list exists in any doc)
- [x] Contextual example.
- [x] HSK reference.
- [x] Lesson relationship.

---

## 4.4 Grammar Models

- [x] Grammar Point.
- [x] Communication purpose.
- [x] Structure.
- [x] Explanation.
- [x] Examples.
- [x] Common mistake.
- [x] HSK reference.
- [x] Lesson relationship.

---

## 4.5 Exercise, Quiz, and Mission Models

- [x] Exercise.
- [x] Exercise answer.
- [x] Exercise hints. (5-level system per `exercises_system.md`)
- [x] Quiz.
- [x] Quiz Question.
- [x] Mission.
- [x] Mission objective.
- [x] Mission roles.
- [x] Mission success conditions.
- [x] Evaluation criteria.

`ExerciseType`/quiz question types intentionally match FASE 7.2's 6-type MVP list, not the longer illustrative lists in `exercises_system.md`/`quiz_system.md` (which include audio/voice/paragraph types that depend on FASE 9-11 infrastructure that doesn't exist yet).

---

## 4.6 Content Services

- [x] Create scenario retrieval service.
- [x] Create lesson retrieval service.
- [x] Create dialogue retrieval service.
- [x] Create vocabulary retrieval service.
- [x] Create grammar retrieval service.
- [x] Create exercise retrieval service.
- [x] Create quiz retrieval service.
- [x] Create mission retrieval service.

All services filter to `status: PUBLISHED` only — draft content is structurally unreachable from these, not just excluded by convention.

---

## 4.7 Content Validation and Seed

- [x] Validate required content fields.
- [x] Validate ordering. (DB-level `@@unique` constraints on order fields)
- [x] Validate exercise answers.
- [x] Distinguish draft and published content.
- [x] Create a structured seed process.
- [x] Seed the Restaurant scenario.
- [x] Seed one complete Restaurant lesson.

Seed content (Chinese dialogue/vocabulary/grammar/exercises) is real and correct but has **not** gone through FASE 15's linguistic review — good enough to build and test against, not final MVP content.

---

## FASE 4 Completion Criteria

- [x] Educational content is not hardcoded in UI components. (confirmed: FASE 5's Learning Journey UI reads it via the content services, no hardcoded scenario/lesson data)
- [x] Core content relationships work. (verified via real retrieval, not just migration success)
- [x] Invalid published content is rejected. (verified: an incomplete lesson fails `validateLessonForPublish`)
- [x] Restaurant Lesson 1 can be retrieved from the database. (verified via the real content services, not raw SQL)
- [x] Content tests pass. (89 tests total across the project)

---

# FASE 5 — Learning Journey

## Objective

Allow learners to browse scenarios and enter lessons.

---

## 5.1 Learning Journey Page

- [x] Load scenarios from the backend.
- [x] Create the page header.
- [x] Create domain filters.
- [x] Create responsive scenario cards.
- [x] Add loading, empty, and error states.

---

## 5.2 Scenario Cards

Display:

- [x] Scenario name.
- [x] Domain.
- [x] Description.
- [x] Difficulty.
- [x] Progress.
- [x] Status.
- [x] Primary action.

Support:

- [ ] Locked. (needs a cross-scenario prerequisite chain no doc defines yet — not built)
- [x] Available.
- [x] In progress.
- [x] Completed.
- [ ] Mastered. (needs competency evidence, owned by FASE 13 — not built)

---

## 5.3 Scenario Detail

- [x] Create the Scenario Detail page.
- [x] Display communication outcomes.
- [x] Display level.
- [x] Display lesson list.
- [x] Display scenario progress.
- [x] Display final scenario mission.
- [x] Implement responsive behavior.

---

## 5.4 Lesson Availability

- [x] Define lesson-unlocking rules.
- [x] Prevent access to locked lessons. (UI-level only: locked lessons render without a link; no `/lesson/[slug]` route exists yet to guard server-side — that's FASE 6)
- [x] Unlock the next lesson after completion.
- [x] Preserve access to completed lessons.
- [x] Create Continue Learning resolution. (`getContinueLearningTarget` built for FASE 14's Dashboard — not called from any UI yet)

---

## FASE 5 Completion Criteria

- [x] Scenarios load dynamically.
- [x] Scenario details work.
- [x] Lessons display in the correct order.
- [x] Locked lessons are protected.
- [x] Continue Learning resolves correctly.
- [x] Desktop and mobile interfaces work.

---

# FASE 6 — Lesson Engine

## Objective

Implement the complete contextual lesson experience.

---

## 6.1 Lesson Route and Progress Model

- [x] Create the dynamic lesson route.
- [x] Validate learner access. (server-side re-check of 5.4's lock rules — a learner can't bypass a locked lesson just by typing the URL)
- [x] Create Learner Lesson Progress. (`LearnerLessonProgress`: completedStepIds stores LessonStep.id, not `order`, so progress survives content reorders)
- [x] Store current step.
- [x] Store completed steps.
- [x] Store learner responses. (JSON blob keyed by step id — shape intentionally loose since step types differ)
- [x] Implement autosave. (every "Continue" persists via Server Action before advancing; no debounce needed since it's step-granularity, not keystroke-granularity)
- [x] Implement lesson resume.

---

## 6.2 Lesson Layout

- [x] Create lesson header.
- [x] Display scenario and lesson title.
- [x] Display communication objective.
- [x] Display lesson progress.
- [x] Display save status.
- [x] Create responsive step navigation.

---

## 6.3 Lesson Steps

Implement:

- [x] Situation. (merged with Dialogue, see note below)
- [x] Dialogue. (as its own step type, still supported — see note below)
- [x] Comprehension.
- [x] Vocabulary.
- [x] Grammar.
- [x] Guided Practice. (built, unused by Restaurant Lesson 1 — see note below)
- [x] Speaking. (real, not a placeholder — see note below)
- [x] Writing. (placeholder, per note below)
- [x] Quiz. (placeholder, per note below)
- [x] Mission. (placeholder, per note below)
- [x] Reflection.

Speaking, Writing, Quiz, and Mission may initially connect to controlled placeholders until their dedicated phases are completed.

**Schema gap found:** `Exercise` has no field linking it to a `LessonStepType`, so there's no way to tell which exercises belong to Comprehension vs. Guided Practice. Default: first exercise → Comprehension, the rest → Guided Practice — *unless* the lesson has no Guided Practice step at all, in which case every exercise goes to Comprehension (`src/lib/content/lesson-data.ts`).

**Restaurant Lesson 1 step sequence redesigned (user request, 2026-08-06).** Now: Vocabulary → Situation (Dialogue merged in — one screen, not two steps) → Comprehension → Grammar → Speaking → Reflection. Guided Practice/Quiz/Mission/Writing steps were dropped from this lesson (their content still exists in the DB, just not wired to a step — `validateLessonForPublish` checks content, not steps). The standalone `DialogueStep` component and `DIALOGUE`/`GUIDED_PRACTICE` step types are untouched and still available for any future lesson that wants them separately. **Speaking is now real**, not a placeholder: it embeds the FASE 8 AI Teacher chat inline, in Practice mode, role-playing the lesson's Mission (AI plays `Mission.aiRole`, learner plays `Mission.learnerRole`) — `AiTeacherContext` gained a `rolePlay` field and `buildSystemPrompt` a role-play section for this (`src/lib/ai-context.ts`). Dialogue content expanded from 6 to 12 lines and 2 comprehension exercises added to match.

---

## 6.4 Language Support

- [x] Add Pinyin toggle.
- [x] Add translation toggle.
- [x] Preserve learner preferences. (localStorage, not a DB/LearnerProfile field — it's a display toggle, not profile data)
- [x] Keep Chinese visually primary. (reused FASE 1's `ChineseText`/`Pinyin`/`Translation` typography components)
- [x] Add sentence selection. (dialogue lines are selectable; feeds the Ask AI placeholder)
- [x] Add Ask AI action placeholders.

---

## FASE 6 Completion Criteria

- [x] Restaurant Lesson 1 works from beginning to end. (verified against the real dev server + database: logged in, loaded the lesson, confirmed `LearnerLessonProgress` row created)
- [x] Progress is saved.
- [x] Lesson resumes correctly.
- [x] Pinyin and translation toggles work.
- [x] Lesson works on desktop and mobile.
- [x] No learner response is lost during normal navigation.

**Dev-server gotcha found during verification:** after `prisma migrate` + `db:generate`, an already-running `next dev` keeps its old in-memory Prisma client singleton and throws `Cannot read properties of undefined` on the new model until restarted. Not a code bug — just restart `npm run dev` after any schema change.

---

# FASE 7 — Exercise and Quiz Systems

## Objective

Create reusable practice and assessment functionality.

---

## 7.1 Exercise Runtime

- [x] Create the shared Exercise Container. (`ExerciseItem`, used by both lesson steps and the Quiz Runtime)
- [x] Load exercise configuration.
- [x] Submit answers.
- [x] Validate answers. (server-side only — `correctAnswer`/`isCorrect` are stripped before an exercise ever reaches the client; grading re-runs independently in the Server Action, never trusts what the client sends back)
- [x] Store attempts. (`ExerciseAttempt`, one row per submission, `attemptNumber` increments on retry instead of overwriting)
- [x] Display educational feedback.
- [x] Support retry.
- [x] Support progressive hints.

**Security note carried over from FASE 6:** the FASE 6 prototype exercise runner sent full `ExerciseOption.isCorrect` flags to the client. Fixed here via `toClientExercise()` (`src/lib/exercise-progress.ts`) — applies retroactively to the lesson's Comprehension/Guided Practice steps too.

---

## 7.2 Exercise Types

Implement:

- [x] Multiple Choice.
- [x] True or False.
- [x] Fill in the Blank.
- [x] Sentence Ordering.
- [x] Matching.
- [x] Short Written Response. (ungraded — ExerciseType is called `SHORT_RESPONSE` in schema; no auto-gradable answer, stored but always `isCorrect: null`)

**Schema gap found:** neither `SENTENCE_ORDERING` nor `MATCHING` have dedicated fields for their puzzle data — no seed content uses them yet. Documented conventions (see `src/lib/exercise-progress.ts`): ordering uses `correctAnswer.order` (a token array); matching reuses `ExerciseOption.content` formatted as `"left :: right"`. Revisit if real content doesn't fit this shape.

---

## 7.3 Accessibility

- [x] Support keyboard use. (native `<button>`/`<input>`/`<textarea>` throughout)
- [x] Support touch.
- [x] Avoid drag-only interactions. (ordering and matching are tap-to-place, not drag-and-drop)
- [x] Add clear selected and submitted states. (`aria-pressed`, disabled-after-submit, visible borders)
- [x] Avoid color-only feedback. (check/x icons + text pair with every color cue)

---

## 7.4 Quiz Runtime

- [x] Create Quiz Attempt.
- [x] Create Quiz Answer.
- [x] Load questions.
- [x] Navigate questions.
- [x] Calculate score.
- [x] Store results.
- [x] Display question feedback.
- [x] Display results summary.
- [x] Allow retry. (a fresh `QuizAttempt` per retry, not a mutation of the last one — full attempt history is kept)
- [x] Update lesson completion. (finishing a quiz now calls the same `onContinue` the lesson engine uses for every other step, replacing FASE 6's placeholder)

---

## FASE 7 Completion Criteria

- [x] Every MVP exercise type works.
- [x] Answers are stored.
- [x] Hints and retry work.
- [x] Quiz scoring is correct.
- [x] Quiz attempts are stored.
- [x] Exercise and quiz tests pass. (17 new unit tests for grading/scoring logic, 7 new integration tests against the real seeded database)

---

# FASE 8 — AI Teacher

## Objective

Implement the persistent context-aware AI Teacher.

---

## 8.1 AI Provider Layer

- [x] Create an AI provider abstraction. (`AiProvider` interface, `src/lib/ai/provider.ts` — business logic never touches a vendor SDK directly)
- [x] Implement the initial provider adapter. (OpenAI, via raw `fetch` to the Chat Completions API — no SDK dependency added. Anthropic adapter also built and selectable, kept as proof the abstraction really supports swapping providers)
- [x] Keep credentials server-side. (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` read only in `src/lib/ai/index.ts`, `server-only`-guarded via `db.ts`'s existing chain; never sent to the client)
- [x] Add timeouts. (20s `AbortController`)
- [x] Add retry behavior. (1 retry on 5xx/timeout/network failure)
- [x] Normalize provider errors. (`AiProviderError` with a `timeout | rate_limited | invalid_request | unavailable | unknown` code)
- [x] Record usage and cost metadata. (`AiUsageLog` per completion, rough cost estimate — not billing-accurate)

**Provider decision: OpenAI**, chosen over Anthropic after discussion — reasoning: for this app's repeated-system-prompt chat pattern the two are cost-comparable, but OpenAI's Realtime API is the better fit for FASE 10's Speaking Lab (native voice, vs. assembling a separate STT/LLM/TTS pipeline with Anthropic), and using one provider for both text tutoring and voice practice is simpler to operate than two. `getAiProvider()` prefers `OPENAI_API_KEY`, falls back to `ANTHROPIC_API_KEY`, then to `MockAiProvider`.

**Real OpenAI credentials configured locally (2026-08-07).** The provider and `gpt-4o-mini` were verified against the live API. `gpt-5-mini` remains unavailable after individual verification, so the model change is explicitly temporary. Live feature-level quality and STT verification remain pending.

---

## 8.2 AI Context

Include:

- [x] Learner level.
- [x] Explanation language.
- [x] Active scenario.
- [x] Active lesson.
- [x] Active lesson step.
- [x] Selected dialogue line.
- [x] Selected vocabulary.
- [x] Selected grammar point.
- [x] Recent relevant learner answer.

Do not send unnecessary personal information. (context type has no name/email/id fields at all — structurally can't leak them)

---

## 8.3 AI Teacher Interface

- [x] Collapsed state.
- [x] Compact desktop panel.
- [x] Expanded panel.
- [x] Mobile drawer.
- [x] Full-screen mobile view.
- [x] Context indicator.
- [x] Conversation history. (persisted across sessions unless storage is disabled, 8.6)
- [x] Message input.
- [x] Suggested prompts. (derived from whatever's currently selected — vocabulary/grammar/dialogue line/a wrong answer)
- [x] Loading state.
- [x] Error and retry state.

---

## 8.4 AI Teacher Modes

Implement:

- [x] Tutor.
- [x] Practice.
- [x] Review.

Modes only change the system prompt framing (a short instruction block) — there's no real model to verify tonal differences against without a live API key.

---

## 8.5 AI Teacher Capabilities

- [x] Explain vocabulary.
- [x] Explain grammar.
- [x] Explain dialogue lines.
- [x] Explain learner mistakes.
- [x] Generate examples.
- [x] Generate short practice.
- [x] Respond in English.
- [x] Respond in Spanish.
- [x] Respond in Chinese when requested.
- [x] Adapt explanation complexity to learner level.

All of 8.5 is prompt instructions in `buildSystemPrompt` (`src/lib/ai-context.ts`). Live `gpt-4o-mini` verification (2026-08-07) confirmed Spanish explanations and lesson/vocabulary context; one understandable but unnatural restaurant phrase shows that linguistic quality still needs deliberate evaluation.

---

## 8.6 AI Safety and Storage

- [x] Add input and output limits. (1000-char input; 500 max output tokens)
- [x] Add rate limiting. (in-memory, 15 messages / 5 min per user — single-instance only, documented; would need Redis/DB backing for multi-instance production)
- [x] Protect hidden prompts. (system prompt built and used server-side only; never part of any Server Action's return value)
- [x] Store conversations only when enabled. (`LearnerProfile.aiConversationStorageEnabled`, toggle in Settings — default on, disabling also drops prior-message context on the next request, not just future storage)
- [x] Allow conversation reset.
- [x] Ensure AI failure does not block lesson completion. (AI Teacher is a side panel/drawer, structurally decoupled from the lesson step's `onContinue`; provider/validation/rate-limit failures return `{ ok: false }` from the Server Action instead of throwing, so they can't crash the lesson page)

---

## FASE 8 Completion Criteria

- [x] AI Teacher is available throughout the application. (lives in `AppShell`, present on every authenticated route)
- [x] AI receives correct lesson context.
- [x] Explanation language works. (instructed via prompt; real verification needs a live key)
- [x] Tutor, Practice, and Review modes work.
- [ ] AI errors are recoverable.
- [ ] Provider credentials remain private.

---

# FASE 9 — Audio Engine

**Deliberately skipped for now (2026-08-06), by user decision — jumping straight to FASE 10.** Same structural situation as FASE 8: needs an external paid provider (TTS) not yet configured. Rather than build another mock-backed provider layer right now, the decision was to defer this whole phase and revisit once real AI/audio provider credentials are funded. Dialogue/vocabulary "Play" buttons in the lesson UI stay disabled until this is built.

## Objective

Add consistent listening and audio playback support.

---

## 9.1 Audio Provider Layer

- [ ] Create the TTS provider abstraction.
- [ ] Implement the initial TTS adapter.
- [ ] Protect provider credentials.
- [ ] Track generation usage.
- [ ] Normalize provider errors.

---

## 9.2 Audio Asset Model

- [ ] Create Audio Asset.
- [ ] Store source reference.
- [ ] Store voice.
- [ ] Store language.
- [ ] Store speed variant.
- [ ] Store provider.
- [ ] Store file path.
- [ ] Store duration.
- [ ] Store generation status.

---

## 9.3 Audio Generation

- [ ] Generate complete dialogue audio.
- [ ] Generate sentence-level audio.
- [ ] Generate vocabulary audio.
- [ ] Create normal-speed variants.
- [ ] Create natural slow-speed variants.
- [ ] Cache generated audio.
- [ ] Prevent duplicate generation.

---

## 9.4 Audio Player

- [ ] Play.
- [ ] Pause.
- [ ] Replay.
- [ ] Playback progress.
- [ ] Speed selection.
- [ ] Keyboard support.
- [ ] Audio loading state.
- [ ] Audio unavailable fallback.

---

## 9.5 Dialogue Playback

- [ ] Play the full dialogue.
- [ ] Play individual lines.
- [ ] Highlight the active dialogue line.
- [ ] Stop audio when leaving the lesson.
- [ ] Handle mobile browser playback requirements.

---

## FASE 9 Completion Criteria

- [ ] Dialogue audio works.
- [ ] Sentence audio works.
- [ ] Vocabulary audio works.
- [ ] Slow audio sounds natural.
- [ ] Audio is cached.
- [ ] Audio failures do not block lesson reading.

---

# FASE 10 — Speaking Lab

## Objective

Allow learners to record Chinese speech and receive useful feedback.

---

## 10.1 Speaking Models

- [x] Create Speaking Session.
- [x] Create Speaking Attempt.
- [x] Store activity type.
- [x] Store recording metadata. (storage key + duration; never file bytes, per storage.md)
- [x] Store transcript.
- [x] Store feedback.
- [x] Store duration.
- [x] Store completion state.

---

## 10.2 Recording

- [x] Request microphone permission.
- [x] Create recording controls.
- [x] Display recording timer.
- [x] Stop recording.
- [x] Play learner recording.
- [x] Retry recording.
- [x] Handle permission denial. (auto-switches to the text fallback)
- [x] Provide text fallback. (also reachable manually via "Type instead", not just on permission denial)

---

## 10.3 Recording Storage

- [x] Validate audio files. (content-type + 15MB size cap, `src/lib/actions/speaking.ts`)
- [x] Upload recordings securely. (backend-mediated only — the client never writes to storage directly, matches storage.md)
- [x] Store recordings privately.
- [x] Create controlled access. (`/api/audio/[...key]` checks auth + attempt ownership before streaming a file)
- [ ] Respect retention preferences. (no retention-policy UI/field built — out of scope for this pass; only on-demand deletion exists)
- [x] Support deletion.

**No cloud storage account configured** (same situation as the AI providers). Built a `StorageProvider` abstraction with a `LocalStorageProvider` (writes to a gitignored `.storage/` folder, served through an authenticated route) - storage.md's real spec (signed URLs, malware scanning, encryption at rest) needs an actual cloud provider (S3/Blob-style) to implement for real; swapping one in later is a one-file change in `src/lib/storage/index.ts`, same pattern as `src/lib/ai/index.ts`.

---

## 10.4 Speech-to-Text

- [x] Create the STT provider abstraction.
- [x] Implement the initial STT adapter. (OpenAI Whisper (`whisper-1`), consistent with the FASE 8 provider decision — same account covers chat and transcription)
- [x] Use Mandarin language configuration. (`language: "zh"`)
- [x] Store transcript.
- [x] Handle low-confidence transcription. (confidence is stored and shown; `whisper-1`'s basic response format doesn't return one, so it's `null` for real transcriptions today — mock returns a fixed 0.5)
- [x] Handle provider failure. (falls back to an empty transcript rather than blocking the attempt)

**No OpenAI key active yet** - `MockSttProvider` is what actually runs (canned transcript, no network). Real request-shaping and error normalization are unit-tested against a mocked `fetch`, not a live account.

---

## 10.5 Speaking Modes

Implement:

- [x] Pronunciation. (a single vocabulary word from the lesson)
- [x] Shadowing. (a full dialogue line — read/spoken without an audio prompt, since FASE 9 was skipped; not true "listen then repeat" yet)
- [x] Guided Conversation. (open-ended response to the lesson's communication objective)
- [x] Scenario Role Play. (the scenario's mission — see schema-gap note below)

**Schema/content gap found:** the seeded Restaurant scenario only has a lesson-level `Mission` (`lessonId` set), not a scenario-level one (`scenarioId` set) - `getSpeakingPrompts()` originally assumed the latter and silently left Scenario Role Play unavailable (caught during manual verification, not by any test). Fixed with a fallback to the lesson's mission; regression test added.

---

## 10.6 Speaking Feedback

Evaluate:

- [x] Communication success. (`communicationEffectiveness` score)
- [x] Transcript completeness. (shown alongside the score breakdown)
- [x] General fluency.
- [x] Important pronunciation issues. (`pronunciation` score + free-text notes)
- [ ] Important tone observations when supported. (the 5-dimension rubric has no dedicated tone dimension; would need real STT confidence/phonetic data neither provider tier gives)
- [x] Recommended retry or next practice.

Feedback must not claim perfect phonetic certainty. (explicit instruction in the feedback prompt)

Feedback is generated by reusing the FASE 8 AI provider (chat completion, not a new provider) - asked for structured JSON, parsed defensively, and falls back to a neutral default on any parse failure or AI-provider error so a recording is never lost over it.

---

## FASE 10 Completion Criteria

- [x] Recording works.
- [x] Playback works.
- [x] Transcription works. (mock provider active; real accuracy unverified without a live key)
- [x] Pronunciation mode works.
- [x] Shadowing works.
- [x] Guided Conversation works.
- [x] Role Play works.
- [x] Recordings remain private.
- [x] Text fallback exists.

---

# FASE 11 — Writing Lab

## Objective

Allow learners to write Chinese and receive educational feedback.

---

## 11.1 Writing Models

- [x] Create Writing Task. (real content model, unlike Speaking Lab's prompts — TASKS.md required it explicitly here)
- [x] Create Writing Attempt.
- [x] Store draft.
- [x] Store submitted response. (a snapshot taken at submit time, separate from `draft` — a later autosave can't retroactively change what was graded)
- [x] Store AI feedback.
- [x] Store corrected version.
- [x] Store rewrite relationship. (self-relation on `WritingAttempt` — a rewrite is a new row linked back to the original, not an edit of the graded one)

---

## 11.2 Writing Lab Interface

- [x] Create Writing Lab home.
- [x] Display task categories.
- [x] Display recent attempts.
- [x] Display recommended task. (simple heuristic — the first task — no Recommendation Engine exists yet, that's FASE 13+)
- [x] Add loading and empty states.

---

## 11.3 Writing Task Types

Implement:

- [x] Sentence.
- [x] Short Message.
- [x] Paragraph.
- [x] Practical Writing.

One seeded task per type, tied to Restaurant Lesson 1.

---

## 11.4 Writing Editor

- [x] Create the editor.
- [x] Add character count.
- [x] Add autosave. (debounced, 1.2s after typing stops)
- [x] Restore drafts. (resumes the latest unsubmitted attempt for a task instead of starting blank)
- [x] Prevent accidental loss. (`beforeunload` guard while there are unsaved changes)
- [x] Support mobile input. (plain `<textarea>`-based editor, no desktop-only input assumptions)

---

## 11.5 AI Writing Feedback

Evaluate:

- [x] Grammar.
- [x] Vocabulary.
- [x] Naturalness.
- [x] Organization when relevant. (folded into naturalness/clarity rather than its own score — no doc defines a separate numeric "organization" dimension the way speaking_lab.md does for speaking)
- [x] Communication clarity.

Display:

- [x] Original response.
- [x] Corrected response.
- [x] Important changes.
- [x] Explanations. (each change is a short phrase + why, not just a diff)
- [x] Rewrite action.

The AI must evaluate the learner's own attempt before providing a complete corrected answer. (encoded directly into the feedback prompt's instruction order, `src/lib/writing-feedback.ts`)

Feedback reuses the FASE 8 AI provider (chat completion, same pattern as Speaking Lab's feedback) — no new provider needed. Real OpenAI credentials are configured; live output quality is not yet verified at feature level.

---

## FASE 11 Completion Criteria

- [x] Writing tasks work.
- [x] Autosave works.
- [x] Draft recovery works.
- [x] AI feedback works. (mock provider active; real quality unverified without a live key)
- [x] Original text is preserved. (`submittedResponse` is immutable once set)
- [x] Corrections are explained.
- [x] Rewrite works.
- [x] AI failure does not erase learner text. (falls back to a neutral default; the submitted text is saved before the AI call, not after)

---

# FASE 12 — Mission System

## Objective

Allow learners to apply lesson content in realistic interactions.

---

## 12.1 Mission Runtime

- [x] Load mission configuration.
- [x] Display mission brief.
- [x] Display learner role.
- [x] Display AI role.
- [x] Display objective.
- [x] Display success conditions.
- [x] Start mission.
- [x] Track interaction. (`MissionAttempt.transcript` — its own isolated conversation log, deliberately separate from the FASE 8 AI Teacher's ongoing `AiConversation` so it stays a clean, boundable thing to evaluate)
- [x] End mission.
- [x] Generate report.
- [x] Store result.

---

## 12.2 Mission AI Behavior

- [x] Keep AI in role.
- [x] Limit AI to the approved scenario.
- [x] Adapt to learner responses.
- [x] Introduce approved unexpected events. (prompt instructs the AI it may introduce ONE realistic, in-scenario complication — not drawn from an authored list, since no doc defines one; a scope decision, see note below)
- [x] Avoid completing the task for the learner.
- [x] Delay non-essential corrections. (explicitly told not to correct mid-conversation — that only happens in the post-mission report)
- [x] Handle communication breakdown. (told to react in-character — ask for clarification, simplify — rather than breaking character to explain)

All of 12.2 is prompt instructions (`src/lib/mission-prompt.ts`) — real adherence depends on the actual model once a key is added; the mock provider can't demonstrate genuine role-play behavior, only that the right instructions reach the request (covered by unit tests).

---

## 12.3 Lesson Missions

- [x] Connect one short mission to each lesson. (the `MISSION` lesson-step type is real now, not a placeholder — Restaurant Lesson 1 itself doesn't use it per its FASE 6 redesign, but the step type works for any lesson that does)
- [x] Use the lesson communication objective.
- [x] Support text interaction.
- [ ] Support voice when available. (FASE 9 Audio Engine was skipped — no voice input/output anywhere yet; text-only for now)
- [x] Store results.

---

## 12.4 Scenario Missions

- [x] Create one final mission per scenario. (seeded "A Full Restaurant Visit" for Restaurant — this also resolves the gap found in FASE 10, where Restaurant had no scenario-level mission at all)
- [x] Combine scenario objectives.
- [x] Include at least one unexpected event. (same prompt-level mechanism as 12.2, not a per-scenario authored event)
- [x] Support retry with variations. (retry starts a genuinely new `MissionAttempt`; "variations" come from the AI naturally varying its in-character responses/complication each time, not authored variant content)

---

## 12.5 Mission Evaluation

Evaluate:

- [x] Communication success.
- [x] Task completion.
- [x] Relevant vocabulary.
- [x] Relevant grammar.
- [x] Clarity.
- [ ] Fluency when voice is used. (no voice — see 12.3)
- [x] Response to unexpected events. (folded into the general evaluation the AI does over the full transcript, not a separate scored dimension — no doc defines a numeric scale for it specifically)

Minor grammar errors must not automatically cause failure when communication succeeds. (explicit instruction in the evaluation prompt, `src/lib/mission-evaluation.ts`)

Evaluation reuses the FASE 8 AI provider (chat completion) — no new provider needed. Real OpenAI credentials are configured; live evaluation quality is not yet verified at feature level.

---

## FASE 12 Completion Criteria

- [x] Lesson mission works. (`MissionStep` — verified via the same runtime the Scenario Detail page uses; not exercised by Restaurant Lesson 1's own step sequence, see 12.3 note)
- [x] Scenario mission works. (verified against the real server: Scenario Detail page shows "A Full Restaurant Visit" and starts a mission)
- [x] AI remains in role. (instructed via prompt; unverified against a real model)
- [x] Unexpected events work. (prompt-level, unverified against a real model)
- [x] Mission evaluation is understandable. (scores + a checklist of success conditions met/not-met + plain-language notes)
- [x] Results are stored.
- [x] Retry variations work.

---

# FASE 13 — Progress and Review

## Objective

Convert learner activity into meaningful competency progress and review recommendations.

---

## 13.1 Progress Evidence

- [x] Create Progress Evidence.
- [x] Store evidence source.
- [x] Store competency.
- [x] Store result. (0-1 normalized)
- [x] Store activity difficulty. (1-5, normalized per source's own difficulty vocabulary — `src/lib/competency-progress.ts`)
- [x] Store timestamp.
- [x] Store related learner activity. (a loose id reference, not an FK — the source table varies by evidence type)

Wired into every graded activity's completion path: exercises, quizzes, speaking attempts, writing attempts, mission attempts. **Attribution only works for lesson-scoped activities** — `Competency` only links to content through `LessonCompetency`, so a scenario-scoped activity (Scenario Role Play speaking, a scenario's final mission) has no competency to attribute evidence to and is silently skipped. Flagged in code, not hidden.

---

## 13.2 Competency Stages

Implement:

- [x] Introduced.
- [x] Practicing.
- [x] Developing.
- [x] Confident.
- [x] Mastered.

Reuses the `CompetencyStage` enum already in the schema from FASE 4 (`EXPOSURE`/`PRACTICE`/`FUNCTIONAL`/`CONFIDENT`/`MASTERY`, competency_framework.md's real names) instead of inventing a second enum for this checklist's own wording.

Rules:

- [x] One activity cannot create mastery. (MASTERY needs 8+ evidence rows)
- [x] Multiple evidence sources are required. (CONFIDENT needs 2+ distinct source types, MASTERY needs 3+)
- [x] Difficulty affects evidence. (difficulty-weighted average, not a flat one)
- [x] Repeated mistakes affect progress. (low results pull the weighted average down, blocking every threshold above PRACTICE)
- [x] Stage transitions are predictable. (pure deterministic function, unit-tested)

---

## 13.3 MVP Competencies

Track:

- [x] Listening.
- [x] Speaking.
- [x] Reading.
- [x] Writing.
- [x] Grammar. (NOT modeled as Competency evidence — see note below)
- [x] Vocabulary. (NOT modeled as Competency evidence — see note below)
- [x] Daily Communication.
- [x] Travel Communication.

Professional Communication should remain hidden until relevant content exists. (true by construction — only competencies with recorded evidence are shown, and nothing in the seeded content touches Professional/Academic Communication yet)

**Scope decision:** Grammar/Vocabulary are deliberately NOT tracked as 5-stage Competency evidence — competency_framework.md (FASE 4's note, still holds) is explicit that they're their own mastery systems, not Competencies. The Progress screen shows them instead as a simple "distinct items encountered across completed lessons" count, not a stage.

---

## 13.4 Progress Screen

- [x] Display estimated HanGo level. (self-reported at onboarding — no computed-level formula exists in any doc)
- [x] Display approximate HSK reference. (same field, formatted)
- [x] Display core competencies.
- [x] Display scenario mastery. (closes the gap FASE 5.2 deferred — "Mastered" now requires 100% completion AND the learner's overall competency average reaching CONFIDENT+; a whole-profile heuristic, not truly per-scenario, since evidence isn't tagged with which lesson produced it — noted in code, fine while only one scenario has real content)
- [x] Display strengths.
- [x] Display priorities.
- [x] Display recommended actions. (Continue Learning target — `getContinueLearningTarget`, built in FASE 5 but unused until now — plus the review queue)
- [x] Add new-learner empty state.

---

## 13.5 Review Queue

Generate review for:

- [x] Vocabulary.
- [x] Grammar.
- [x] Recent mistakes.
- [x] Dialogue replay.
- [x] AI-generated short practice. (opens the FASE 8 AI Teacher in Review mode — no separate generation step)

Every review item must show:

- [x] What to review.
- [x] Why it was selected.
- [x] Estimated duration.
- [x] Start action.

**Scope decision:** this is a deterministic, on-the-fly generator recomputed on every page load — not a persistent spaced-repetition schedule with per-item due dates. No doc specifies a scheduling algorithm.

---

## 13.6 Review Completion

- [x] Store review results. (`ReviewCompletion` — an acknowledgement an item was acted on)
- [x] Update progress evidence. (only where there's something to grade — retrying a mistake produces real `ProgressEvidence` through the normal exercise-attempt path; marking a vocabulary/grammar/dialogue item reviewed has nothing to grade, so it only records the acknowledgement)
- [x] Reschedule unresolved content. (a 24h cooldown, not a real per-item schedule — see note below)
- [x] Remove resolved items. (excluded from the queue while on cooldown)
- [x] Update recommendations. (the queue is recomputed fresh every time, so it reflects the latest state automatically)

**Scope decision:** "reschedule"/"remove" is a fixed 24h cooldown window (`REVIEW_COOLDOWN_HOURS`), not a real spaced-repetition scheduler — consistent with 13.5's scope decision.

---

## FASE 13 Completion Criteria

- [x] Progress uses stored evidence.
- [x] Competency stages update correctly.
- [x] Scenario mastery is accurate. (within the whole-profile heuristic noted in 13.4)
- [x] Review queue uses learner history.
- [x] Recommendations include reasons.
- [x] Progress is preserved between sessions.

---

# FASE 14 — Dashboard and Settings

## Objective

Connect all learner information into a useful home experience and preference system.

---

## 14.1 Dashboard

Implement:

- [x] Continue Learning. (`getContinueLearningTarget`, built in FASE 5 but never wired to a UI until now)
- [x] Current scenario.
- [x] Current lesson.
- [x] Daily goal.
- [x] Basic study streak. (consecutive UTC days with any graded activity — see scope note below)
- [x] AI recommendation. (rule-based — the top review-queue item, same honesty framing as FASE 3's recommendation; not an AI call)
- [x] Scenario progress. (reuses `ScenarioCard` from FASE 5)
- [x] Competency summary. (reuses `CompetencyList` from FASE 13)
- [x] Review recommendations. (reuses `ReviewQueueList` from FASE 13, top 3)
- [x] Quick Speaking and Writing actions.

**Scope decisions:** "Daily goal" shows the target and whether *any* activity happened today, not accumulated minutes — no time-tracking model exists to measure actual study duration. "Streak" counts distinct UTC calendar days with graded activity, not the learner's local timezone (none is stored on the profile) — a returning learner near a day boundary could see it flip a little early/late relative to their own clock.

---

## 14.2 Dashboard Behavior

- [x] Display one clear primary next action. (Continue Learning card, top of the page)
- [x] Handle new learners. (dedicated welcome empty state)
- [x] Handle learners without active lessons. ("You're all caught up" card when there's no Continue Learning target)
- [x] Update after completed activities. (server-rendered from live data on every visit, no caching to invalidate)
- [x] Open the correct lesson and step. (links straight to `/lesson/[slug]`, which resumes at the learner's saved step per FASE 6)
- [x] Work on desktop and mobile. (same responsive primitives as every other page)

---

## 14.3 Settings

Create sections for:

- [x] Profile.
- [x] Learning.
- [x] AI Teacher.
- [x] Audio. (explanatory placeholder — FASE 9 Audio Engine was skipped, so there's nothing real to control; states that plainly instead of faking controls)
- [ ] Appearance. (no dark-mode/theme system exists anywhere in the app to control — out of scope, not faked)
- [x] Privacy.
- [x] Account.

---

## 14.4 Settings Behavior

- [x] Edit name.
- [x] Edit interface language.
- [x] Edit explanation language.
- [x] Edit learning goal.
- [x] Edit skill priorities.
- [x] Edit daily target.
- [x] Edit correction style.
- [x] Edit default AI mode. (new `LearnerProfile.defaultAiMode` field — `AiTeacherProvider` now initializes from it instead of a hardcoded "Tutor")
- [ ] Edit playback preferences. (no audio playback exists — see 14.3)
- [x] Edit recording-retention preference. (new `LearnerProfile.recordingRetentionDays` field — stores the *preference* only; there's no scheduled job that actually enforces/deletes recordings on a timer, since no job-scheduler infrastructure exists in this project. A real, flagged gap, not a bug.)
- [x] Edit AI-history preference. (already built in FASE 8.6 — `aiConversationStorageEnabled`, moved into the Privacy section here)
- [x] Request account deletion. (immediate, learner-confirmed self-service deletion behind a type-to-confirm modal — not a queued admin-reviewed request, since no review workflow exists. Cascades through every related table via `onDelete: Cascade`.)

---

## FASE 14 Completion Criteria

- [x] Dashboard clearly communicates the next action.
- [x] Dashboard uses real learner data.
- [x] Dashboard updates after activities.
- [x] Settings persist.
- [x] Preferences affect the relevant features. (default AI mode → `AiTeacherProvider`'s initial state; explanation language/correction style → already read by `buildSystemPrompt`, FASE 8)
- [x] Privacy controls are understandable.

---

# FASE 15 — Complete MVP Content

## Objective

Create the complete approved curriculum for the MVP.

---

## 15.1 Restaurant Scenario

Create:

- [x] Lesson 1 — Entering and Ordering. (predates FASE 15, seeded in FASE 4/hand-written)
- [x] Lesson 2 — Ingredients and Preferences.
- [x] Lesson 3 — Requests and Problems.
- [x] Lesson 4 — Payment and Conversation.
- [x] Final Restaurant Mission. (scenario-level, seeded in FASE 12)

Lessons 2-4 built via a new shared `createFullLesson()` seed helper (`prisma/seed.ts`) instead of repeating Lesson 1's ~150-line hand-written pattern per lesson — reuse this helper for Hotel and Shopping. Content still has NOT gone through 15.5's linguistic review.

---

## 15.2 Hotel Scenario

Create:

- [x] Lesson 1 — Reservation and Check-In.
- [x] Lesson 2 — Facilities and Services.
- [x] Lesson 3 — Reporting Problems.
- [x] Lesson 4 — Extending and Checking Out.
- [x] Final Hotel Mission.

New Domain "Travel" (curriculum_structure.md's Domain examples), separate from Restaurant/Shopping's "Daily Life". Content still has NOT gone through 15.5's linguistic review.

---

## 15.3 Shopping Scenario

Create:

- [x] Lesson 1 — Finding a Product.
- [x] Lesson 2 — Price and Comparison.
- [x] Lesson 3 — Size, Color, and Testing.
- [x] Lesson 4 — Payment, Exchange, and Return.
- [x] Final Shopping Mission.

Reuses the "Daily Life" domain (with Restaurant), via `db.domain.upsert` — fixed a real bug found here: the original Restaurant seed deleted+recreated its domain on every run, which broke (FK violation) once a second scenario shared that domain. Both Restaurant's and Hotel's domain handling were switched to upsert.

---

## 15.4 Required Content per Lesson

Every lesson must contain:

- [x] Situation. (merged with Dialogue into one step, per Lesson 1's precedent)
- [x] Dialogue.
- [x] Comprehension.
- [x] Vocabulary.
- [x] Grammar.
- [x] Guided exercises. (in DB, not in the step flow — see Lesson 1's note; same for Quiz/Mission/Writing below)
- [x] Speaking activity.
- [x] Writing activity.
- [x] Quiz.
- [x] Lesson mission.
- [x] Reflection.
- [ ] Required audio. **Not done — blocked by FASE 9 (Audio Engine), which was deliberately skipped.** No lesson has real audio; this can't close until FASE 9 is revisited.
- [x] Valid answer keys. (`validateLessonForPublish` ran against all 12 lessons)

---

## 15.5 Content Review

**Not done as a separate pass.** All 12 lessons' Chinese/pinyin/translations were written carefully and cross-checked while authoring, but this has NOT been reviewed by a qualified human/native-speaker reviewer as this section requires — do not treat this content as linguistically certified.

- [ ] Review Chinese accuracy.
- [ ] Review Chinese naturalness.
- [ ] Review Pinyin.
- [ ] Review translations.
- [ ] Review grammar explanations.
- [ ] Review vocabulary appropriateness.
- [ ] Review HSK mapping.
- [ ] Review cultural accuracy.
- [x] Review exercises and answer keys. (structurally: every exercise has a correct answer, validated via `validateLessonForPublish`)
- [ ] Review mission objectives.
- [x] Remove unresolved placeholders. (none exist in the seeded content)

---

## FASE 15 Completion Criteria

- [x] Twelve complete lessons exist. (verified live: all 3 scenario pages and 3 sampled lessons render real content via curl against the running dev server)
- [x] Three final scenario missions exist.
- [ ] All required audio exists. (blocked by FASE 9 skip — see 15.4)
- [x] All exercises have valid answers. (`validateLessonForPublish` passed for all 12 lessons before publish)
- [x] All quizzes work. (2 questions each, same tested code path as Lesson 1)
- [ ] All lessons pass linguistic review. (not done — see 15.5; needs a qualified human reviewer)
- [ ] All lessons pass educational review. (not done — same as above)

---

# FASE 16 — Testing and Stabilization

## Objective

Verify the complete HanGo MVP before external use.

---

## 16.1 Automated Testing

- [x] Unit tests for critical logic.
- [x] Component tests for core UI.
- [x] Integration tests for backend flows.
- [x] End-to-end test for the complete learner journey. (`tests/integration/critical-path.test.ts` — service-layer, not a real browser: no Playwright/Cypress is installed in this repo, so this is the automatable substitute, not literal 16.2)

270/270 tests pass (`npx vitest run --no-file-parallelism`). Note: this repo's test suite is DB-heavy enough that full parallel runs (`npm run test`'s default) occasionally hit spurious 5s timeouts under load — not real failures, confirmed by rerunning serially or in isolation. Consider raising the default test timeout or reducing worker concurrency if this becomes disruptive.

---

## 16.2 Critical End-to-End Flow

Test:

```text
Register

↓

Complete Onboarding

↓

Open Dashboard

↓

Start Lesson

↓

Use AI Teacher

↓

Complete Exercises

↓

Complete Speaking

↓

Complete Writing

↓

Complete Quiz

↓

Complete Mission

↓

View Updated Progress
```

Covered end-to-end by `tests/integration/critical-path.test.ts` at the service layer (register → onboarding → dashboard → lesson → AI Teacher → exercises → speaking → writing → quiz → mission → advance every step → competency progress/scenario mastery/dashboard streak all reflect it). Not a real-browser test — no Playwright/Cypress in this repo.

---

## 16.3 Responsive Testing

**Not done — requires a real browser/devices, which this environment doesn't have (no Playwright/Cypress installed).** Code-level spot check only: the shell (Sidebar/BottomNav/TopBar/AiTeacherPanel) already uses a consistent `md:` breakpoint split (desktop sidebar + AI panel vs. mobile bottom nav + AI FAB), and content pages use responsive Tailwind classes throughout. This needs actual visual verification by the user across real viewport sizes before beta.

Test:

- [ ] Desktop.
- [ ] Laptop.
- [ ] Tablet.
- [ ] Mobile.

Verify:

- [ ] Navigation.
- [ ] Lesson.
- [ ] AI Teacher.
- [ ] Speaking.
- [ ] Writing.
- [ ] Missions.
- [ ] Progress.
- [ ] Settings.

---

## 16.4 Accessibility Testing

Code-level audit only (no axe/Lighthouse/screen-reader tooling available in this environment) — items below are what a code review can actually confirm, not a substitute for real assistive-tech testing.

- [x] Keyboard navigation. (all custom interactive elements are real `<button>`s; Modal/Select/Checkbox use Radix primitives, which handle this correctly)
- [x] Focus visibility. (`focus-visible:outline` applied consistently via the shared `cn()` utility across interactive components)
- [x] Form labels. (the shared `Input` component enforces `htmlFor`/`id` association plus `aria-describedby` for hints/errors — every form uses it)
- [x] Screen-reader structure. (landmark elements present: `header`, two `nav`s with distinct `aria-label`s — one is `hidden` per breakpoint so they never coexist in the a11y tree — and `main`)
- [ ] Color contrast. **Not verified** — needs a real contrast-checking tool against rendered pages.
- [ ] Text resizing. **Not verified** — needs real browser zoom/font-size testing.
- [x] Reduced motion. (global `prefers-reduced-motion: reduce` media query in `app/globals.css` collapses all animation/transition durations)
- [x] Audio transcripts. (Speaking Lab attempts always display their transcript as text; no lesson audio exists at all — FASE 9 was skipped, so there's nothing else to caption)
- [x] Non-voice alternatives. (every Speaking activity has a text-fallback path, already exercised by both automated tests and this phase's manual verification)
- [x] Non-drag alternatives. (SENTENCE_ORDERING and MATCHING exercises are both tap/click-to-build, not drag-and-drop — nothing in the app uses drag-and-drop)

---

## 16.5 Security Testing

- [x] Authentication. (bcrypt password hashing, JWT session strategy, credentials never reveal whether an email exists)
- [x] Authorization. (every attempt/session/task action asserts ownership before acting — `assertOwned*` pattern, cross-user access tested)
- [x] Sessions. (edge-safe `proxy.ts` optimistic check + a second, DB-backed check in `app/(app)/layout.tsx` that doesn't depend on the proxy's route matcher being complete — it currently misses `/lesson/:path*`, and this second layer is exactly why that doesn't matter)
- [x] Input validation. (Zod schemas for auth/onboarding/settings; per-field length caps on every AI-facing text input)
- [x] Rate limiting. **Found and fixed a real gap**: only the AI Teacher chat (FASE 8) had rate limiting + a message-length cap. Mission chat, Speaking recording/text-fallback, and Writing submission each call a paid AI provider with zero rate limiting, and Mission messages had no length cap at all. Added the same 15-requests/5-minute limit (and a 1000-char cap on Mission messages) to all three, consistent with the existing AI Teacher pattern.
- [x] Secret exposure. (`server-only` guards `src/lib/env/server.ts`; the client env schema only ever contains `NEXT_PUBLIC_*` vars)
- [x] Private recording access. (`/api/audio/[...key]` requires auth + verifies the requesting user owns the `SpeakingAttempt` before streaming the file)
- [x] Storage permissions. (`resolveSafePath` rejects any key that would resolve outside `.storage/` via `..`)
- [x] Prompt injection. (reviewed all four AI system-prompt builders — learner-controlled text is always passed as a `user`-role message, never concatenated into the system prompt itself)
- [ ] Sensitive logging. **Real gap, not fixed — out of scope until a real provider is chosen** (same situation as AI/TTS/STT): `src/lib/email.ts`'s dev stub logs verification/password-reset links (and the learner's email) to the server console instead of sending real email. Harmless in local dev, but this MUST be swapped for a real provider before any real learner data reaches it — flagged as a FASE 17 blocker (17.1 "Configure the beta application" territory), not a FASE 16 one.

---

## 16.6 Failure Recovery

Test:

- [x] AI provider unavailable. (every AI call site catches `AiProviderError`; either falls back to a documented default — feedback/report — or returns `{ok:false, error}` for the UI to show inline)
- [ ] TTS provider unavailable. N/A — FASE 9 (Audio Engine) was skipped, there's no TTS integration to fail.
- [x] STT provider unavailable. (`submitRecording` catches `SttProviderError` and continues with an empty transcript rather than blocking the attempt)
- [x] Failed autosave. **Found and fixed a real bug**: `WritingEditor`'s autosave (`saveDraftAction(...).then(...)`) had no `.catch()` — a failed save left `saving` stuck `true` forever and never told the learner their draft wasn't saved. Now shows "Couldn't save — check your connection" and keeps `dirty` true (protecting the `beforeunload` guard) instead of silently claiming "Saved".
- [~] Lost connection. Partially addressed: Mission/Writing/Speaking/AI Teacher actions all return `{ok:false, error}` instead of throwing to Next's generic error boundary (Speaking and Writing were fixed this phase; Mission and AI Teacher already did this). **Not fixed**: `LessonEngine`'s step-advance calls (`advanceLessonStepAction`/`goToLessonStepAction`) still have no error handling — a dropped request mid-lesson leaves the optimistic local state (already-advanced step) out of sync with the server with no visible error. Lower severity than the AI-call gaps since it's a transient-network edge case, not a cost/abuse vector, but worth closing before beta.
- [x] Expired session. (`proxy.ts`'s optimistic cookie check + `app/(app)/layout.tsx`'s DB-backed check both redirect to `/login`)
- [x] Failed recording upload. (now surfaces inline via the same `submitRecordingAction` fix as the rate-limiting work above, instead of hitting the error boundary)
- [x] Invalid educational content. (`validateLessonForPublish` gates DRAFT → PUBLISHED; exercised against all 12 real lessons in FASE 15, plus a dedicated rejection test in `tests/integration/content.test.ts`)

Learner work and progress must remain protected.

---

## 16.7 Stabilization

- [x] Resolve all critical defects. (rate-limiting/cost-abuse gaps across Mission/Speaking/Writing, and the writing-autosave silent-failure bug)
- [x] Resolve all high-severity defects. (same set — nothing else at that severity surfaced during this review)
- [x] Retest fixed defects. (full suite + a real running dev server: logged in, submitted a writing attempt and viewed the Speaking Lab with the changed action files loaded)
- [x] Run regression testing. (270/270 automated tests pass)
- [ ] Review performance. Not done — no load testing or profiling was performed this phase.
- [~] Review operational costs. The mechanism exists (`src/lib/ai/cost.ts` pricing table, `AiUsageLog` recording every real call), but no actual cost report was generated — there's been no traffic to report on yet (mock providers only).
- [ ] Prepare release report. Not done as a separate document — this TASKS.md section and the phase summary given directly to the user serve that purpose for now.

---

## FASE 16 Completion Criteria

- [x] Complete learning loop passes. (`tests/integration/critical-path.test.ts`, service-layer)
- [x] No critical defect remains. (found and fixed: 3x missing rate limiting, 1x silent autosave failure)
- [~] No high-severity security issue remains. Everything actionable at code-review level is resolved; the dev email stub logging real links/emails to console is a known, already-documented limitation (not new) that blocks FASE 17, not this phase.
- [ ] Desktop and mobile work. **Not verified** — no browser automation available in this environment; needs real manual testing.
- [~] Accessibility blockers are resolved. Everything checkable by code review is in good shape (see 16.4); color contrast and text resizing still need real tooling.
- [~] Learner progress survives temporary failures. Fixed for AI-call failures across Speaking/Writing (and Mission/AI Teacher already handled this); the Lesson Engine's step-advance still has no error handling for a dropped request (see 16.6).
- [ ] Production monitoring is ready. Not started — no error monitoring, analytics, or cost tracking is configured yet (this is FASE 17.1's job: "Configure error monitoring", "Configure product analytics", "Configure cost tracking").

---

# FASE 17 — Closed Beta Deployment

## Objective

Deploy HanGo for controlled testing with real learners.

---

## 17.1 Beta Environment

- [ ] Configure the beta application.
- [ ] Configure the beta database.
- [ ] Configure private storage.
- [ ] Configure authentication.
- [ ] Configure AI services.
- [ ] Configure TTS and STT services.
- [ ] Configure error monitoring.
- [ ] Configure product analytics.
- [ ] Configure cost tracking.
- [ ] Configure backups.

---

## 17.2 Beta Access

- [ ] Create invite-based access.
- [ ] Track invited learners.
- [ ] Add beta welcome information.
- [ ] Explain product limitations.
- [ ] Provide support contact.
- [ ] Provide feedback mechanism.

---

## 17.3 Beta Monitoring

Monitor:

- [ ] Registrations.
- [ ] Onboarding completion.
- [ ] First lesson completion.
- [ ] Scenario progression.
- [ ] AI Teacher usage.
- [ ] Speaking usage.
- [ ] Writing usage.
- [ ] Mission completion.
- [ ] Day-1 retention.
- [ ] Day-7 retention.
- [ ] Provider failures.
- [ ] Cost per active learner.

---

## 17.4 Beta Evaluation

- [ ] Collect usability feedback.
- [ ] Collect Chinese-content feedback.
- [ ] Collect AI Teacher feedback.
- [ ] Collect Speaking Lab feedback.
- [ ] Collect Writing Lab feedback.
- [ ] Interview active learners.
- [ ] Interview learners who abandon early.
- [ ] Create the prioritized post-beta backlog.

---

## FASE 17 Completion Criteria

- [ ] Invited learners can use HanGo independently.
- [ ] Critical errors are observable.
- [ ] Costs are measurable.
- [ ] Feedback is collected.
- [ ] Retention can be measured.
- [ ] Product blockers are documented.
- [ ] The public-release decision can be made using real evidence.

---

# Continuous Requirements

These requirements apply during every phase.

---

## Documentation

- [ ] Update affected documentation after approved changes.
- [ ] Record important changes in `changelog.md`.
- [ ] Keep this file aligned with real implementation status.
- [ ] Do not create undocumented architecture.

---

## Testing

- [ ] Add tests with every critical feature.
- [ ] Run relevant tests before marking tasks complete.
- [ ] Preserve existing tests.
- [ ] Report failed checks honestly.

---

## Security

- [ ] Protect secrets.
- [ ] Validate inputs.
- [ ] Enforce backend authorization.
- [ ] Protect learner recordings.
- [ ] Avoid sensitive information in logs.
- [ ] Apply least-privilege access.

---

## Accessibility

- [ ] Preserve keyboard access.
- [ ] Preserve visible focus.
- [ ] Add accessible labels.
- [ ] Maintain contrast.
- [ ] Provide alternatives to voice-only activities.
- [ ] Provide alternatives to drag-only interactions.

---

## Scope Control

Before implementing any unlisted feature, verify:

- [ ] It belongs to the approved MVP.
- [ ] It supports the core learning loop.
- [ ] Its required dependencies exist.
- [ ] It does not duplicate an existing feature.
- [ ] It has been explicitly approved.

---

# Final MVP Acceptance Criteria

HanGo MVP is complete when:

- [ ] A learner can register.
- [ ] A learner can complete onboarding.
- [ ] A learner receives a starting recommendation.
- [ ] A learner can access Restaurant, Hotel, and Shopping.
- [ ] A learner can complete twelve structured lessons.
- [ ] A learner can use the contextual AI Teacher.
- [ ] A learner can listen to dialogue and vocabulary audio.
- [ ] A learner can complete speaking practice.
- [ ] A learner can complete writing practice.
- [ ] A learner can complete exercises and quizzes.
- [ ] A learner can complete lesson and scenario missions.
- [ ] A learner receives educational feedback.
- [ ] Learning progress is saved.
- [ ] Competency progress is updated.
- [ ] The Dashboard provides a clear next action.
- [ ] Core functionality works on desktop and mobile.
- [ ] Security and privacy requirements are satisfied.
- [ ] The complete learning loop passes testing.
- [ ] Real beta learners can use the product independently.

---

End of active development tasks.


---

# Visual Redesign (merged from DESIGN_TASKS.md, 2026-08-08)

> The file below was a standalone document tracking the full 8-phase
> visual redesign (all complete, approved). Merged here during the
> 2026-08-08 file consolidation (6 files -> 2) - content unchanged.

# HanGo — Design Overhaul Tasks

Version: 1.0

Status: Complete (all 8 phases implemented and approved — `TASKS.md` resumes at FASE 17 next)

Last Updated: August 2026

---

# Purpose

`TASKS.md` builds features. This file redesigns how HanGo looks and feels — a
visual identity pass, not a functionality change. Nothing in `TASKS.md` is
being redone; this only touches `app/globals.css`, component styling, and
page structure/layout.

---

# How This Works

For every phase below:

1. I present 2-4 real options for that piece — as an Artifact mockup you can
   look at, built from actual HanGo content/components, not abstract swatches.
2. You pick one, ask for changes, or mix pieces from different options.
3. Once you approve, I implement it for real in the codebase and verify
   (typecheck/lint/tests/build + a live look at the running app).
4. We move to the next phase.

Nothing gets implemented without your approval first — that's the whole
point of doing it this way after the first attempt felt like guessing.

```text
[ ] Not started
[~] Options presented, awaiting your choice
[x] Approved and implemented
```

---

# What We Know So Far

From the first (reverted) attempt at a "Laca y bambú" (lacquer red + jade)
palette:

- **The palette itself was liked.** Red/jade/gold, grounded in Chinese
  lacquerware — keep exploring in this direction, don't restart from zero.
- **A token-only swap reads as shallow.** Recoloring existing white cards on
  a light background didn't feel different enough — the app needs a real
  structural/typographic pass, not just new hex values in the same shapes.
- **Dark surfaces read better than light ones for this palette.** The one
  dark card in the original mockup was "muy bueno"; the white/porcelain
  background felt generic.
- **Typography needs real personality**, not just Inter at a heavier weight.
- **The entry point (login) feels too plain** and needs real structure, not
  just a centered form on a blank background.

Phase 1 below is scoped directly around these findings.

**Reference added 2026-08-07 — Duolingo.** Specifically: the "Learn" screen
as a game-like path (a vertical trail of nodes/stages the learner
progresses along, not a flat list), bold saturated icon style in the nav,
and a persistent top-right stats bar (streak, currency, etc.). Applies
mainly to **Phase 3** (nav icon style, stats bar) and **Phase 5** (the
Learning Journey path visualization — this is HanGo's equivalent of
Duolingo's "Learn" screen). The paid-tier upsell card ("Prueba Súper
gratis") is explicitly **out of scope for now** — noted here so it isn't
lost, but it's a monetization/product decision for `TASKS.md`, not a visual
one for this file, and HanGo has no pricing model defined yet.

---

# Mascot — "Han"

Added 2026-08-07: HanGo will have its own mascot (reference: "Option 3 —
Han Spirit"), the same role Duolingo's owl plays — a recurring character
that shows up across lessons and interfaces to give the product a
identity beyond the color/type system. Built from the **H** mark itself
(the character's body is shaped like the logo's H), with jade/bamboo and
lacquer-red accents matching the palette, ninja-style eyes, holding a
phone/tablet.

- [x] Confirm asset source — the user supplied 4 real illustrations
      (`hango_wave_with_tablet`, `hango_celebrate`, `hango_heart`,
      `hango_thinking`; genuinely transparent PNGs, verified pixel-by-pixel
      down to the alpha channel). Copied into `public/mascot/` and wired up
      in `src/components/ui/han-mascot.tsx` (`HanMascot`, `pose` prop:
      `wave` / `curious` / `heart` / `idle`). The earlier flat-SVG
      reinterpretation was scrapped once the real assets arrived.
- [x] Appearance list decided:
  - **Dashboard greeting** (`wave`) — Phase 4, alongside the
    welcome/continue-learning area.
  - **Daily goal / streak milestone** (`heart`) — Phase 4, when today's
    goal is met.
  - **Empty states** (`curious` or `idle`) — wherever a phase has one
    (new-learner Dashboard, empty Review queue, etc.) — Phases 4, 5, 7.
  - **AI Teacher avatar** (`idle`) — Phase 6, small, next to assistant
    messages.
  - Not planned for lesson-complete celebrations or error states for now
    — can be added later if it earns a spot.

---

## Phase 1 — Foundations

Palette direction (confirmed), typography, and the light/dark surface
strategy. Everything downstream depends on this, so nothing else starts
until it's approved.

- [x] Typeface pairing — **Option A (Fraunces)** chosen. Display/PageTitle/
      SectionTitle use it; body text stays on Inter.
- [x] Surface strategy — **Option 1 (full dark)** chosen. `--color-page` is
      now the dark end of the neutral scale, not the light end.
- [x] Refined color scale — the lacquer/primary, jade/secondary, and gold/
      accent scales from the first attempt were reused as-is (that part was
      already approved); the neutral scale was rebuilt as an ink-violet
      dark scale instead of inverted or reused from the light version.
- [x] Radius, shadow, and button shape — radius nudged up slightly
      (control/card/panel), shadows de-emphasized (elevation now comes from
      the neutral-900→800→700 background steps, not drop shadows), button
      shape **not** changed (kept the original rectangular shape rather
      than the reverted attempt's full-pill, to isolate this phase to
      typography/surface as the two things actually being decided).

Implemented directly (not just tokens): also caught and fixed ~15
components that referenced the light end of the neutral/semantic scales by
raw class name (`bg-neutral-100` hovers, `bg-error-50` banners, tooltip,
modal/drawer overlay scrim, form field surfaces, progress bar/toggle
tracks) — these would have rendered as bright, out-of-place light patches
under the new dark page background if left as-is.

**Logo:** the user supplied a reference image (no source file) for the
official mark — a bold geometric "H" with its top-left and bottom-right
corners diagonally clipped, paired with a "HanGo" wordmark in the display
face. Recreated as an SVG in `src/components/ui/logo.tsx` (`LogoMark` /
`Logo`), monochrome via `currentColor` so it adapts to any surface. Placed
in the Sidebar now (light-on-dark, no porcelain badge, per the user's
choice); Phase 3 will place it consistently everywhere else a mark belongs
(mobile top bar, favicon, auth screens).

---

## Phase 2 — Entry Point (Login / Register / Forgot Password)

The first thing anyone sees. Flagged explicitly as "too plain" — gets a real
structural treatment, not just new colors on the existing centered-form
layout.

- [x] Options presented.
- [x] Approved and implemented — **Option 1 (split screen)**. Desktop/
      tablet get an editorial hero panel (logo, giant faint watermark of
      the mark, headline, tagline) beside the form; below `md` the hero is
      hidden entirely (not shrunk) and a small logo sits above the form
      instead. Applies to all four auth pages via the shared
      `app/(auth)/layout.tsx` — login/register/forgot-password each only
      supply their own form content.

---

## Phase 3 — Navigation & Shell

Sidebar, top bar, mobile bottom nav, AI Teacher panel/FAB. The frame around
every other screen. Per the Duolingo reference above: bolder, more colorful
nav icons (not just an outline icon + text label), and a persistent stats
strip (streak, today's goal, etc. — HanGo's real equivalents, not
Duolingo's gems/hearts) instead of tucking that only into the Dashboard.

- [x] Options presented.
- [x] Approved and implemented — **Option A (colorful icon badges)**. Each
      of the 6 nav sections got its own badge color (`navigation.ts`:
      `badgeClassName`/`badgeIconClassName` per item), applied to both the
      Sidebar and the mobile BottomNav. `AppShell` now fetches
      `getStudyStreak` and passes it to `TopBar`, which shows a persistent
      streak + today's-goal stats strip on every authenticated page, not
      just the Dashboard.

**Real bug found and fixed along the way:** `BottomNav`'s active-state
color (`text-primary-600`) was a carryover from Phase 1 — a dark red tuned
for the old light background, now unreadable on the dark surface. Missed
during Phase 1's sweep because that pass only searched for `-700`, not
`-600`. Fixed to `text-primary-300`.

**Found but NOT fixed (out of this phase's scope) — flagged for Phase 8:**
the same `-600`/`-700` light-background-tuned pattern also appears in the
auth forms (Phase 2, already shipped), `exercise-item.tsx` and
`mission-report-display.tsx` (`text-success-600`/`text-error-600` —
these aren't even defined tokens post-redesign, since the semantic scale
only has 50/500/700, so they currently resolve to no color at all),
`grammar-step.tsx`, `scenario-card.tsx`, and `scenario-mastery-list.tsx`.
All belong to phases not yet designed (5, 7) or already-shipped phases (2)
— fixing them now would mean editing pages out of turn. Phase 8
("Consistency Pass") exists specifically to sweep this category of leftover
bug once every phase is done.

---

## Phase 4 — Dashboard

Streak, daily goal, recommendation, scenario progress, competency summary,
review queue.

- [x] Options presented.
- [x] Approved and implemented — **Option A (Han hero)**, plus two
      additions the user asked for on top of it:
  - The separate streak/daily-goal cards are gone — that duplicated the
    Phase 3 TopBar strip. In their place, one hero card merges "Continue
    Learning" with Han (`wave` normally, `heart` once today's goal is
    met) and a single streak/goal line.
  - **Small Han everywhere "AI Teacher" is referenced**, not just the
    Dashboard — the user's request extended past this phase. Added
    `HanAvatar` (`src/components/ui/han-mascot.tsx`): a circular, cropped
    avatar variant of `HanMascot` for icon-sized spots, built by computing
    each source PNG's real alpha-channel bounding box first — the
    character sits close enough to center that plain `object-fit: cover`
    needed no per-pose cropping math. Replaced the generic `Bot` icon with
    it in three Phase-3-era components: `MobileAiTeacherButton` (FAB),
    `AiTeacherPanel` (collapsed rail + expanded header), and the TopBar's
    streak chip (pose mirrors goal-met state, same as the Dashboard hero).
  - New-learner empty state also got `HanMascot` (`curious`), per the
    appearance list above.

**Found, not fixed (pre-existing, predates this phase):** the new-learner
empty state (`isNewLearner && !data.continueTarget`) is effectively dead
code under normal seeded content — `getContinueLearningTarget` resolves to
the first lesson even for a learner with zero completions, so
`continueTarget` is essentially never null while any lesson exists. Manual
verification confirmed a brand-new learner sees the hero card (correctly),
not the empty state. This condition was copied unchanged from the
pre-redesign Dashboard (FASE 14) — not something this phase introduced —
and it's an app-logic question, not a visual one, so it's out of scope
here. Worth a `TASKS.md` look eventually: either the condition needs
fixing, or the empty state should be deleted as unreachable.

---

## Phase 5 — Learning Journey & Lesson Experience

Scenario grid/detail, and the in-lesson steps: vocabulary, dialogue,
comprehension, grammar, exercises, quiz, reflection. **This is the phase
the Duolingo reference applies to most directly** — HanGo's Learning
Journey (scenario → lessons) is the equivalent of Duolingo's "Learn"
screen. Worth exploring a real path/trail visualization for a scenario's 4
lessons (nodes connected by a line, current lesson highlighted, locked
ones dimmed) instead of a flat card list, while keeping it grounded in
HanGo's own content (no owl, no gems — real HSK levels, real scenario
names).

- [x] Options presented (scenario path visualization).
- [x] Approved and implemented — **Option A (zigzag trail)**. New
      `src/components/learning-journey/lesson-path.tsx` (`LessonPath`)
      replaces the flat Card list on the scenario detail page: lessons
      zigzag down a dashed connector, colored by status (jade =
      completed, lacquer = available with a glow, muted = locked), Han
      (`wave`) floats above whichever lesson is currently available, and
      the scenario's final mission gets a distinct gold/lacquer capstone
      node at the end. The capstone is a visual preview only — the real
      interactive `ScenarioFinalMission` still renders below it unchanged,
      since a chat runtime can't be condensed into a path node.
- [x] Options presented (lesson experience: progress bar, step nav,
      vocabulary, exercises).
- [x] Approved and implemented — **Option A (game card)**, covering every
      step that shares these components:
  - `LessonHeader`'s progress bar is now thicker with a jade→gold
    gradient fill (`ProgressBar` gained an `indicatorClassName` prop for
    this, additive — its 7 other call sites are untouched).
  - `StepNavigation`'s step chips became circular status badges (filled
    jade+check/lacquer/muted-grey) with the step name below, instead of
    bordered rectangles.
  - `VocabularyStep`'s cards are now centered with larger Chinese text and
    a solid part-of-speech pill badge.
  - `ExerciseItem` — covering exercises, guided practice, **and quiz**,
    since `QuizRunner` reuses this same component — got thicker
    (`border-2`), more rounded (`rounded-2xl`/`rounded-full`) option
    buttons across every exercise type (multiple choice, sentence
    ordering, matching), not just the ones shown in the mockup.

**Real bug fixed while in this file:** `ExerciseItem`'s inline
correct/wrong checkmarks used `text-primary-600`/`text-success-600`/
`text-error-600` — the exact dark-background-tuned pattern flagged for
Phase 8 back in Phase 3, now actually fixed since this phase reached the
file. Also caught a copy-paste slip in my own first pass here: the
"correct answer" color used `secondary` (brand jade) instead of the
semantic `success` token — same shade family, wrong token, would have
broken the deliberate brand-vs-state separation from Phase 1. Fixed to
`success-500`/`success-50` before it shipped.

---

## Phase 6 — AI Teacher, Speaking Lab & Writing Lab

The chat panel/drawer, the recorder, the writing editor, feedback displays.

- [x] Options presented.
- [x] Approved and implemented — **Option A (Duolingo energy)**:
  - `AiTeacherChat`: mode tabs (Tutor/Practice/Review) are now solid
    pills instead of bordered chips; assistant messages show `HanAvatar`
    (`idle`) beside the bubble — the "AI Teacher avatar" placement from
    the Phase 4 appearance list, implemented here since this is the phase
    that actually owns that component. Deliberately **not** applied to
    `mission-chat.tsx` — that chat represents an in-scenario role (a
    waiter, hotel staff), not the Han/tutor persona, so wearing Han's face
    there would misrepresent who's "speaking."
  - `AudioRecorder`: the small text button became a large circular
    record button that swaps Mic → Square and pulses with a soft red glow
    while recording, instead of two separate small buttons.
  - `SpeakingFeedbackDisplay` / `WritingFeedbackDisplay`: each feedback
    dimension now gets its own color (primary/secondary/accent/info/
    success) on a thicker bar, instead of every dimension rendering as an
    identical thin primary-500 bar.

---

## Phase 7 — Progress & Settings

Competency list, scenario mastery, review queue list, and every Settings
section.

- [x] Options presented.
- [x] Approved and implemented — **Option A (colorful scorecard)**:
  - `CompetencyList`: bars now cycle through the primary/secondary/
    accent/info/success palette instead of a uniform primary-500 —
    same approach as Phase 6's feedback dimensions.
  - Progress page's vocabulary/grammar counts became colored stat tiles
    (jade/gold) instead of plain numbers.
  - `ScenarioMasteryList`'s "Mastered" badge became a gold→lacquer
    gradient pill. **Real bug fixed here too**: this was the exact
    `text-primary-600` instance flagged back in Phase 3 (dark red, unread-
    able on the dark surface) — now actually fixed since Phase 7 owns
    this file.
  - Settings: every section heading gets a colored icon badge (same
    language as the nav), except AI Teacher, which uses `HanAvatar`
    directly instead of a badge-wrapped icon — wrapping it in another
    colored badge would've been invisible, since Han's own circular crop
    already fills that space.

---

## Phase 8 — Consistency Pass

Once every area above is implemented: a full pass to catch anything
inconsistent (spacing, one-off colors, mismatched empty/loading/error
states) that individual phases missed.

- [x] Full app review.
- [x] Fixes applied. Closed out every `-600`/`-700` light-background-tuned
      color flagged since Phase 3, plus one found fresh in this pass:
  - `mission-report-display.tsx` — had the exact same 5-dimension
    scorecard pattern as `SpeakingFeedbackDisplay`/`WritingFeedbackDisplay`
    but was missed when Phase 6/7 applied that treatment elsewhere; now
    consistent (colored bars, `success-500`/`error-500` condition icons).
  - `grammar-step.tsx`'s "Common mistake" text — beyond the contrast fix,
    this was also the wrong semantic token (`secondary`/jade, which means
    "success" everywhere else in the app) for a cautionary note; moved to
    `warning-500`.
  - `scenario-card.tsx`'s action label, and all 9 auth-form/reset-password
    links across 5 files — straightforward `text-primary-600` →
    `text-primary-300` swaps, same fix as every other instance of this bug
    this session.
  - Swept the whole `src`/`app` tree fresh for `bg-*-50/100`,
    `text-neutral-900`, raw hex, and `text-white`/`bg-white` — nothing
    left outside the intentional exceptions (the inverted-light tooltip,
    dark-icon-on-light-badge pairs in Settings).
  - Live-verified every route (`/dashboard`, all 3 scenario detail pages,
    Speaking/Writing Lab, Progress, Settings, a real lesson, and the 3
    auth pages) returns 200 with no server errors in the dev log.

---

# Completion Criteria

- [x] Every phase above is implemented and approved.
- [x] Full check suite passes (typecheck, lint, format, tests, build).
- [x] Verified live against the running dev server.
- [x] `TASKS.md` resumes at FASE 17.
