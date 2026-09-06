# HanGo System Architecture

Version: 1.1

Status: Official (completed 2026-09-05 - see audit note)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** this document was found cut off mid-sentence,
> ending right after "HanGo consists of the following main layers:" with
> no layer list and nothing after it. The "High-Level Architecture" section
> onward is newly written to describe the real, current stack - everything
> before it (Purpose, Architecture Philosophy) was already accurate and is
> unchanged.

---

# Purpose

This document defines the global technical architecture of HanGo.

The objective is to describe how the different components of the platform interact to create an AI-powered Chinese learning ecosystem.

---

# Architecture Philosophy

HanGo is designed as a modular AI-native learning platform.

The architecture must support:

- Interactive learning.
- AI-powered tutoring.
- Personalized learning paths.
- Dynamic content.
- Real-time conversations.
- Audio processing.
- Long-term scalability.

The system should allow independent evolution of each component without requiring major redesigns.

---

# High-Level Architecture

HanGo consists of the following main layers:

## 1. Routing (Next.js App Router)

`app/` holds every route, organized into route groups that each get their
own layout:

- `(auth)` - login, register, password reset. No shared app shell.
- `(app)` - the authenticated learner app (Dashboard, Learning Journey,
  Speaking/Writing Lab, Progress, Settings, Han, Shop, Leaderboard,
  Achievements). `app/(app)/layout.tsx` enforces real authentication and
  onboarding-completion on every request (a Server Component check, not
  just an edge proxy) before rendering `AppShell`.
- `onboarding` - the post-registration wizard, its own route outside `(app)`.
- A small number of real HTTP endpoints under `app/api/**` - see
  `api.md` for the complete list and why each one is a route instead of a
  Server Action.

## 2. UI layer (React Server + Client Components)

`src/components/`, organized by feature (one folder per major surface -
`shell`, `lesson`, `speaking`, `writing`, `ai-teacher`, `han`, `avatar`,
`achievements`, `admin`, `marketing`, plus a shared `ui` folder of design-
system primitives). Server Components fetch data directly at render time;
Client Components (`"use client"`) handle interactivity and call Server
Actions for mutations. There is no separate client-side data-fetching
library (no React Query/SWR) - Next's own request-scoped `React.cache()`
handles per-request de-duplication where the same data is needed by
multiple components in one render (see `project/db-operations-optimization.md`
for the real history of where and why this was applied).

## 3. Business logic / data layer

`src/lib/` - one file per feature area (`ai-teacher-data.ts`,
`speaking-data.ts`, `writing-data.ts`, `mission-data.ts`,
`vocabulary-lookup-data.ts`, `ai-usage.ts`, etc.), each talking to Prisma
directly. `src/lib/actions/*.ts` holds the thin `"use server"` wrappers
these are called through from Client Components (auth check, input
validation, converting a thrown error into a typed `{ ok, error }`
result) - see `api.md` for the full convention.

## 4. Database (PostgreSQL via Prisma)

`prisma/schema.prisma` - one schema, ~65 models, covering the full
curriculum (Scenario/Lesson/Dialogue/Vocabulary/Grammar/Exercise/Quiz/
Mission), learner progress/evidence, the points & leveling system, the
HanCoins economy, achievements, the placement exam, and (added
2026-09-05) AI-usage cost tracking (`AiUsageLog`/`AiUsageCap`). `src/lib/db.ts`
exports one shared `PrismaClient` (built with the `@prisma/adapter-pg`
driver adapter, `max: 20` connection-pool size) - see `database.md` for
connection-pool detail. Real migrations live in `prisma/migrations/`, one
folder per change, hand-written when Prisma's own interactive prompt
can't run non-interactively (e.g. adding a required column to a non-empty
table).

## 5. External AI/voice services, always behind a provider abstraction

Business logic never imports an AI/TTS/STT SDK directly - it calls
`getAiProvider()` (`src/lib/ai/`), `getTtsProvider()` (`src/lib/tts/`), or
`getSttProvider()` (`src/lib/speech/`), each of which picks a real
provider (OpenAI, with Anthropic and a free Mock provider as fallbacks -
the Mock provider is what makes it possible to run the entire test suite,
and even a local dev server, without any API key configured) - see
`ai_architecture.md`. Live voice conversations (Han Companion, the
Speaking placement exam) are the one exception that talks to an external
API somewhat more directly: a WebRTC session negotiated against OpenAI's
Realtime API via `app/api/han/realtime/route.ts`.

Every real (non-cached, non-mock) paid call is cost-tracked: `src/lib/ai-usage.ts`
records it and enforces a per-user, per-feature daily USD cap, configurable
from an admin-only dashboard (`requireRole(["ADMINISTRATOR"])`) - added
2026-09-05, see `ai_architecture.md` for the current shape.

## 6. File storage

Audio files (dialogue lines, vocabulary/grammar pronunciation, Han's
spoken replies) are stored outside the database via `getStorageProvider()`
(`src/lib/storage/`) - today, the only real provider writes to a local,
gitignored `.storage/` folder (no cloud object storage is configured yet).
Files are content-addressed (`src/lib/audio-content-key.ts` hashes the
exact text being spoken) so identical text across different rows, or
across a full database reseed, reuses one already-paid-for file instead
of regenerating it - see `storage.md` and `audio_engine.md`.

## 7. Authentication & authorization

NextAuth (Auth.js) v5, JWT session strategy, Credentials + conditional
Google OAuth - see `authentication.md`. Authorization has two independent
layers: `app/(app)/layout.tsx` (a database-backed check that a session's
user still exists and has completed onboarding) and `requireRole()`
(`src/lib/auth-role.ts`, first used for a real gate 2026-09-05 by the
admin AI-usage dashboard).

## 8. Testing & CI

Four test tiers (`tests/unit`, `tests/component`, `tests/integration`,
`tests/smoke`), all real - integration tests run against a real database,
not mocks; only the AI/TTS/STT provider boundary is mocked, or left to
fall back to the free Mock provider automatically. `.github/workflows/ci.yml`
(added 2026-09-05) runs the full suite against a real Postgres service
container on every push/PR - see `testing.md`.

---
