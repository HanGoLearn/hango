# HanGo

HanGo is an AI-powered Chinese learning platform designed to help learners achieve real communicative competence — not just memorize vocabulary or pass standardized exams. It teaches Chinese through realistic situations (restaurant, hotel, shopping, and more), progressive competency development, and continuous interaction with an AI Teacher that accompanies the learner throughout the entire experience. The HSK framework serves as the curricular backbone (HSK 3–9), but the primary goal is authentic, real-life communication.

## Current Development Status

FASE 1–16 are complete: authentication, onboarding, the full learning loop (Learning Journey, lesson engine, AI Teacher, Speaking Lab, Writing Lab, Missions, Progress, Settings), testing/stabilization, and a full visual redesign. FASE 9 (Audio Engine) is built (dialogue, vocabulary, grammar, and Han's own voice, all via OpenAI TTS) except a real-time voice conversation for the Speaking step, in progress. FASE 17 (Closed Beta Deployment) has not started.

See [`project/TASKS.md`](project/TASKS.md) for the authoritative, up-to-date status — it's the only file needed for day-to-day work; full historical detail lives in [`project/TASKS_ARCHIVE.md`](project/TASKS_ARCHIVE.md).

## Requirements

- [Node.js](https://nodejs.org/) 20.9 or later
- npm (bundled with Node.js)
- [PostgreSQL](https://www.postgresql.org/) 17 (local instance for development)

## Installation

```bash
npm install
```

## Environment Configuration

Copy the example file and fill in real local values:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored and never committed. Public variables (safe for the browser) must be prefixed with `NEXT_PUBLIC_`; everything else is private and validated server-side only. See `src/lib/env/client.ts` and `src/lib/env/server.ts`.

## Database Setup

HanGo uses PostgreSQL with Prisma as the ORM/database access layer.

1. Ensure a local PostgreSQL 17 server is running and reachable at the connection string set in `DATABASE_URL` (`.env.local`).
2. Create the database (if it doesn't exist yet):
   ```bash
   createdb hango
   ```
3. Apply migrations (see below).

### Migration Command

```bash
npm run db:migrate         # create + apply a new migration (development)
npm run db:migrate:deploy  # apply pending migrations without creating a new one
npm run db:generate        # regenerate the Prisma client after schema changes
```

### Seed Command

```bash
npm run db:seed
```

Other useful database commands:

```bash
npm run db:studio          # open Prisma Studio (database GUI)
```

## Development Command

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build Command

```bash
npm run build
npm run start   # serve the production build
```

## Lint Command

```bash
npm run lint
```

## Type-Check Command

```bash
npm run typecheck
```

## Format Commands

```bash
npm run format         # write formatting fixes
npm run format:check   # check only, no changes
```

## Test Command

```bash
npm test          # unit + smoke tests
npm run test:unit
npm run test:smoke
```

## Documentation

Full product, Academy methodology, engineering, and design documentation lives in [`docs/`](docs/README.md).

## Active Task List

The active, current-state task list — what's actually left to build — is [`project/TASKS.md`](project/TASKS.md). Full historical build detail (through FASE 16 and the complete visual redesign) lives in [`project/TASKS_ARCHIVE.md`](project/TASKS_ARCHIVE.md) (frozen; some of its "Complete"/"Skipped" labels drifted from reality before being caught — see the note near the top of `TASKS.md`).
