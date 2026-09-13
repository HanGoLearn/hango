# HanGo bilingual interface — technical plan

Status: Phases 1–3 implemented and production-build verified (2026-09-10)

## Product boundary

HanGo supports Spanish (`es`) and English (`en`) as **interface locales**.
This project deliberately does not change Han Tutor or Han Companion: their
prompts, personality, memory, voice, transcription, response-language logic,
and pedagogy are frozen. Learning Journey Speaking and Speaking Lab also keep
their existing conversation engines; later phases may translate their UI only.

The existing concepts remain independent:

- `LearnerProfile.interfaceLanguage`: app chrome and localized product copy.
- `LearnerProfile.explanationLanguage`: Han's existing explanation preference.
- Mandarin learning material: Simplified Chinese, pinyin, pronunciation, and
  assessment behavior.

## Architecture

### Routing

- Learner-facing pages use a required locale prefix: `/es/...` and `/en/...`.
- `/` and legacy unprefixed learner URLs redirect through `proxy.ts` using:
  locale cookie -> weighted `Accept-Language` -> Spanish default.
- `/api/...` remains locale-neutral.
- `/admin/...` remains unprefixed and Spanish-only for the private owner MVP.
- Locale-aware pages live under `app/[locale]`; the admin has an independent
  root layout so it is not coupled to learner localization.
- Authentication protection is evaluated after stripping the locale prefix;
  unauthenticated callbacks preserve the full localized destination.

### Locale persistence

- Cookie: `hango-locale`, one-year lifetime, same-site lax.
- Explicit switching changes the URL and cookie immediately.
- When a learner profile already exists, explicit switching also updates
  `interfaceLanguage`; it never modifies `explanationLanguage`.
- New email registrations carry the locale through verification and password
  recovery links. New profiles initialize `interfaceLanguage` from the route
  locale without adding a redundant onboarding question.
- After credentials or Google sign-in, a server-side handoff resolves the
  saved profile language and preserves the requested private destination. This
  retains an explicit choice on a new device while leaving
  `explanationLanguage` independent.

### Translation sources

- `src/i18n/config.ts`: supported locales, parsing, and route helpers.
- `src/i18n/messages/{es,en}.ts`: symmetric, typed dictionaries.
- `src/i18n/get-dictionary.ts`: server-only lazy dictionary loading.
- UI components receive only the dictionary section they need; dictionaries
  are not bundled wholesale into interactive client components.
- A structural-parity test prevents one locale from shipping missing keys.

Brand terms stay stable: HanGo, Han, HanCoins, Han Vocabulary, HSK, and pinyin.

## Delivery phases

### Phase 1 — Foundation and acquisition flow

- [x] Locale-prefixed routing and compatibility redirects.
- [x] Correct dynamic `<html lang>` and localized marketing metadata.
- [x] Persistent ES/EN switcher.
- [x] Full public landing in Spanish and English, including interactive demo.
- [x] Login, registration, password recovery, and reset UI in both languages.
- [x] Localized validation/action feedback for the authentication flow.
- [x] Verification and reset links preserve locale.
- [x] Admin remains isolated and Spanish-only.
- [x] Han systems untouched.

### Phase 2 — Learner shell and onboarding

- [x] Centralize learner links, redirects, announcement destinations, and
  localized revalidation so they retain locale without an intermediate
  compatibility redirect.
- [x] Localize onboarding, its embedded placement exam, sidebar, bottom
  navigation, user menu, Dashboard, and Settings.
- [x] Make the route locale the initial `interfaceLanguage` when a profile is
  created and retain the explicit profile choice across devices after login.
- [x] Keep `explanationLanguage` independent and preserve Han's prompts,
  personality, memory, voice, transcription, response-language logic and
  pedagogy unchanged.
- [x] Preserve the separation between Han Tutor, Han Companion, Learning
  Journey Speaking and Speaking Lab after locale-prefixed routing; route-based
  tutor visibility and activity attribution strip the locale before matching.

Phase 2 verification: production build, typecheck, dictionary parity, scoped
ESLint, 661 unit tests, 60 component tests, 260 passing integration tests, and
the smoke test. Two unrelated pre-existing integration test issues remain: a
stale handwritten-writing evaluator mock (5 assertions) and a 30-request
placement-audio rate-limit case that exceeds its 15-second timeout. Neither
affected module was modified by this phase.

### Phase 3 — Core learner surfaces (complete)

- [x] Localize Progress, Achievements, Leaderboard and shop, including their
  empty states, rewards, avatar catalog, HanCoin explanation and operational
  purchase/equip errors.
- [x] Localize the global achievement and HanCoin celebrations without
  changing unlock, payout or seen-state behavior.
- [x] Localize Speaking Lab UI chrome in Spanish and English: mode selection,
  recording controls, shadowing, contextual and free-topic practice, feedback,
  learner-facing errors and the internal QA harness. Generated feedback and
  authored Mandarin/pinyin content remain verbatim.
- [x] Localize Writing Lab UI chrome without changing prompts, handwriting
  analysis, evaluation, scoring or attribution.
- [x] Localize Han Vocabulary chrome. This remains deliberately separate from
  Han Tutor and Han Companion behavior.

Speaking Lab verification: production build, typecheck, scoped ESLint, 663
unit tests and 63 component tests pass. Its protected route also correctly
preserves the localized callback when no session is present. The real-browser
content inspection still requires an authenticated learner session; no login
credentials were automated during QA.

Writing Lab verification: production build, typecheck, scoped ESLint, 664
unit tests and 64 component tests pass. Its handwritten, translation and custom
writing interfaces are localized while operational values and evaluator output
remain intact. The protected ES route preserves
`callbackUrl=/es/writing-lab`; real-browser content inspection still requires
an authenticated learner session.

Han Vocabulary verification: production build, typecheck, scoped ESLint, 665
unit tests and 65 component tests pass. Search controls, benefits, known errors,
frequency labels and result-card headings are localized both in the Han hub and
the Dashboard entry point. Generated definitions/examples remain verbatim and
continue to follow the independently configured explanation language. Its
protected ES route preserves `callbackUrl=/es/han`; authenticated visual QA is
still pending.

### Phase 4 — Authored curriculum content

- Add normalized translation rows for scenario, lesson, dialogue translation,
  vocabulary meaning, grammar explanation, exercise instruction, and mission
  display fields.
- Keep Chinese, pinyin, ordering, HSK references, scoring, and shared Mandarin
  audio in the base records; do not duplicate them by locale.
- Add coverage reporting and an English fallback while content is migrated.

Phase 4A foundation completed 2026-09-11: normalized relations and locale-aware
read paths now cover the Learning Journey hierarchy and missions. The existing
English content is the canonical fallback; a real database coverage report
tracks every untranslated record. The next batch extends the same pattern to
lesson-body content before Spanish authoring is populated scenario by scenario.

Phase 4B completed 2026-09-11: dialogue, vocabulary, authored grammar,
exercise, quiz and writing-task display copy now use the same normalized model
and locale-aware learner reads. Mandarin, pinyin, audio, correct/reference
answers, scores and generated evaluator content remain shared. Phase 4C is the
Spanish authoring pass, performed in scenario-sized reviewable batches and
measured by the coverage command.

Phase 4C parallel interface work completed 2026-09-11: all fixed lesson chrome
now comes from structurally identical Spanish and English dictionaries,
including step navigation, controls, exercises, quizzes, missions, speaking,
reflection and results. This does not translate authored curriculum rows or
generated feedback. Claude owns the current pilot JSON authoring pass; it must
complete validation and dry-run import before any database write is applied.

The first 16 authored Phase 4C scenarios were validated, database-dry-ran and
atomically imported by 2026-09-12: 11,524 fields across 9,430 normalized
translation rows. The exchange validator distinguishes extra Spanish accents
from source pinyin, supports exact matching shared rows across additive batches
exported from a common baseline, and retains strict conflict rejection.
Coverage is now 16/41 scenarios and 64/164 lessons. Remaining scenarios
continue to use canonical English fallback until individually validated,
dry-run and approved for import.

### Phase 5 — User communications

- Add Spanish/English variants for announcements, HanCoin grant messages,
  account emails, and product notifications.
- Deliver the variant matching `interfaceLanguage`; keep the admin composer in
  Spanish while allowing both recipient-language versions.

### Phase 6 — QA and release

- Dictionary parity, no-raw-key, routing, auth-callback, and locale-persistence
  tests.
- Visual QA at mobile/desktop widths for text expansion and interactive states.
- Accessibility checks for document language, labels, focus, and screen-reader
  names.
- SEO checks for canonical URLs, language alternates, and localized metadata.
- Analytics segmentation by interface locale without changing learning metrics.

## Definition of done

- Every learner-facing route has a stable `/es` and `/en` form.
- Switching language never changes Han's behavior or explanation preference.
- No screen mixes interface languages except intentional Chinese/pinyin examples
  and stable brand names.
- Direct, refreshed, shared, verification, reset, and protected links preserve
  locale.
- Missing translations fail tests before release rather than leaking keys.
- Existing unprefixed links remain compatible until their Phase 2 migration is
  complete.
