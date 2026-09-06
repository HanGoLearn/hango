# HanGo API Architecture

Version: 2.0

Status: Official

Last Updated: 2026-09-05 (full rewrite - see audit note)

---

> **2026-09-05 audit note:** version 1.0 of this document described a
> versioned REST API (`/api/v1/`) with 16 functional "API modules"
> (User, Learning, Lesson, Vocabulary, Grammar, Dialogue, Exercise,
> Speaking, Writing, Mission, Quiz, AI Teacher, Simulation, Progress,
> Audio, Analytics). None of that was ever built - there is no `/api/v1`
> anywhere in the repository, and the real app doesn't expose a
> general-purpose REST API at all. This version replaces it with the real
> architecture.

---

# Purpose

This document defines how the frontend talks to the backend in HanGo.

Almost all of the "API" in this app is not a REST API - it's Next.js
**Server Actions**: plain async TypeScript functions, defined with `"use
server"`, that a Server or Client Component calls directly like a normal
function call. There is no separate request/response boundary to design,
version, or document per-feature the way a REST API needs - the function
signature *is* the contract, and TypeScript enforces it end to end.

A small number of real HTTP route handlers (`app/api/**/route.ts`) exist
for the cases Server Actions genuinely can't cover - see "Real Route
Handlers" below.

---

# Server Actions - the real "API" for everything else

Every learner-facing feature (lessons, vocabulary, grammar, exercises,
quizzes, missions, Speaking Lab, Writing Lab, AI Teacher chat, progress,
achievements, avatar/HanCoins, the leaderboard) is implemented as a Server
Action in `src/lib/actions/*.ts`, calling into a data-layer module in
`src/lib/*.ts` that talks to Prisma directly. A Client Component imports
the action and calls it like any other async function:

```ts
"use server";
export async function lookupVocabularyWordAction(input: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  // ...
}
```

Conventions used consistently across this codebase:

- **Auth check first.** Every action starts by reading `auth()` and either
  returning an `{ ok: false, error }` result or throwing, before touching
  any business logic.
- **A typed result union for expected failures.** Actions that can fail in
  ways the UI should show inline (validation, rate limits, an AI provider
  hiccup) return `{ ok: true; ... } | { ok: false; error: string }` rather
  than throwing - see any file under `src/lib/actions/` for the pattern.
  Only genuinely exceptional failures (no session, a programming error)
  throw.
- **Server Components fetch, Server Actions mutate.** A page or layout
  fetches its own data directly (calling data-layer functions, not an
  action) at render time; actions exist for things a Client Component
  triggers later (a button click, a form submit).
- **Role-gated actions call `requireRole([...])`** (`src/lib/auth-role.ts`)
  at the top, the same way every other action calls `auth()` - see
  `src/lib/actions/admin-ai-usage.ts` for the first real example (added
  2026-09-05, admin-only AI cost caps).

There is no API versioning concept here, because there's no wire format to
version - a breaking change to a Server Action is caught by TypeScript at
build time across every caller in the same repository.

---

# Real Route Handlers (`app/api/**/route.ts`)

These are the only real HTTP endpoints in the app. Each exists because the
thing it does genuinely isn't a Server Action:

| Route | Why it's a route, not an action |
|---|---|
| `app/api/auth/[...nextauth]/route.ts` | Auth.js's own required catch-all handler for the OAuth/credentials flow. |
| `app/api/auth/invalid-session/route.ts` | Signs out a session whose user no longer exists. Cookies can only be mutated from a Server Action or Route Handler, never from the Server Component (`app/(app)/layout.tsx`) that detects the problem - so it redirects here instead. |
| `app/api/auth/verify-email/route.ts` | The link target inside a real verification email - has to be a plain URL a mail client can open, not a function call. |
| `app/api/cron/weekly-leaderboard-payout/route.ts` | Triggered by an external scheduler (Vercel Cron, per `vercel.json`), authenticated via a `CRON_SECRET` bearer token - not something a logged-in learner's browser ever calls. |
| `app/api/audio/[...key]/route.ts` | Serves a cached audio file's bytes by storage key - a `<audio>`/`<source>` tag needs a real URL, not a function result. |
| `app/api/han/realtime/route.ts` | Negotiates the WebRTC SDP offer for a live voice session directly against OpenAI's Realtime API - a real HTTP exchange, not a data mutation. |
| `app/api/han/realtime/assessment/route.ts` | Per-turn text-completion planner called from inside an active voice session's client-side event loop, not from a UI action. |
| `app/api/han/speech/route.ts` | Returns a generated audio *file* (Han's spoken reply) for an `<audio>` element to play - same reasoning as the audio-serving route above. |
| `app/api/writing/handwritten/route.ts` | Accepts a multipart image upload (handwriting photos) - `FormData` file uploads go through a route, not a typed Server Action call. |

That's the complete list - nine routes, all narrowly scoped, none of them
a general-purpose CRUD API. If a new feature seems to need a new route
handler, the first question should be "could this be a Server Action
instead?" - it almost always can.

---

# Authentication

Real providers (`src/lib/auth.ts`): **Credentials** (email + password) and
**Google OAuth**, conditionally enabled when `GOOGLE_CLIENT_ID`/
`GOOGLE_CLIENT_SECRET` are set. Apple Sign-In and Microsoft Login are not
implemented and aren't planned for the near term - `docs/05_development/mvp.md`
explicitly excludes both.

Sessions use NextAuth's **JWT strategy** (`src/lib/auth.config.ts`,
`session: { strategy: "jwt" }`) - one signed, stateless session token, not
a separate access/refresh token pair. A role change in the database (see
`UserRole`/`requireRole()`) does not take effect for an already-issued
session until the user logs out and back in, since the JWT callback only
reads the user's role at sign-in time.

---

# Error handling

Route Handlers return `Response.json({ error: "..." }, { status })` with a
plain, learner-facing message - never a raw stack trace or Prisma error
string. Server Actions that use the `{ ok: false, error }` result pattern
follow the same rule. Internal details (which Prisma error code fired,
which provider failed) are logged server-side, not sent to the client.

---

# Rate limiting

There is no shared rate-limiting middleware. Instead, each cost-sensitive
data-layer function protects itself independently with an in-memory,
per-process `Map<userId, timestamp[]>` burst limiter (window + max
attempts, custom per feature) - deliberately not shared infrastructure,
see any file under `src/lib/*.ts` that calls a paid AI/TTS/STT provider
for the pattern. On top of that, a per-user daily USD spend cap
(`src/lib/ai-usage.ts`'s `checkDailyUsageCap`, added 2026-09-05) is
checked before every real paid call across ~20 AI/TTS/STT/vision surfaces,
configurable per feature from the admin dashboard.

---

# AI cost tracking

Every real (non-cached, non-mock-provider) paid AI/TTS/STT/vision call
records its estimated cost via `recordAiUsage()` (`src/lib/ai-usage.ts`)
into the `AiUsageLog` table, tagged with which of ~20 known features made
the call. An admin-only dashboard (gated by `requireRole(["ADMINISTRATOR"])`)
shows real spend and lets an administrator adjust each feature's daily cap.
See `src/lib/ai-usage.ts` and `src/lib/admin-ai-usage.ts` for the current
implementation - this area is under active development as of this
document's last update, so check those files directly for the latest
shape rather than trusting a static description here.

---

End of document.
