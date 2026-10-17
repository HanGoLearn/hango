# HanGo — Development Tasks (Active)

Status: Active

## Aislamiento de reconocimiento incierto — 17 de octubre de 2026

- [x] Segundo fallo real identificado: `invalid_evidence` con diagnóstico
  `Uncertain recognition cannot certify production or an error`. Cinco turnos
  claros y uno de baja confianza; el fragmento dudoso invalidaba todo el juicio.
  La publicación anterior no resolvió esta causa; conversación original preservada.
- [x] Exclusión de turnos USER inciertos antes de construir prompt/esquema de
  referencias. No reconstruirlos desde respuestas del personaje. Validador conserva
  citas exactas, autoría, banco y duplicados; descarta afirmaciones basadas en texto
  incierto y deja sin nivel un criterio que dependía de él, sin inventar reemplazo.
- [x] Limitación de reconocimiento informativa si los cuatro criterios tienen
  evidencia clara. Captura incompleta/interferencia siguen bloqueando nota completa.
  Sin evidencia clara sustantiva no se llama al proveedor ni se inventa nota cero.
  Revisión de política guardada para no reinterpretar notas históricas; aviso ES/EN.
- [x] Recuperación explícita adicional solo para el rechazo antiguo exacto con
  dos solicitudes consumidas. Sin reset de contador; límite general de dos intacto,
  exclusión de fallos nuevos, mismas guardas de concurrencia/usuario/consumo.
- [x] 1.439 unitarias y 216 componentes pasan. Pruebas nuevas: aislamiento,
  no mutación del intento, informe histórico, citas falsas y recuperación acotada.
- [ ] Integraciones, tipos/lint/build y CI remoto; publicación GitHub/Vercel.
- [ ] Usuario autoriza UNA evaluación real adicional del intento ya guardado.
  Ejecutarla únicamente tras publicar, comprobar resultado y no repetir si falla.

## Corrección de reflexión/Speaking — 17 de octubre de 2026

- [x] Incidente real de producción: conversación de 13 turnos preservada;
  juicio rechazado por `invalid_evidence`, no falta de conversación. Prueba
  rápida de vocabulario 9/10 aprobada se interpretaba erróneamente como cuatro
  preguntas de refuerzo faltantes. Ningún borrado ni nueva llamada IA en diagnóstico.
- [x] Umbral compartido con UI; prueba rápida aprobada conserva todas sus
  respuestas reales (incluidos errores). Compatibilidad de snapshots antiguos
  mediante lectura de primeras respuestas del mismo usuario/lección/ventana
  original; no reescribe la conversación ni reevalúa con currículo modificado.
- [x] Referencias del juicio limitadas al intento/banco/idioma en el esquema;
  prompt explicita reglas de citas y límites. Validador íntegro, diagnósticos
  acotados persistidos sin respuesta cruda. Una recuperación explícita del mismo
  intento, máximo dos dispatches totales, bloqueo por concurrencia y mismos
  límites/medición de IA. Abrir/guardar no reintenta; UI informa consumo adicional
  y permite salir sin pagar ni reiniciar. Rechazos de seguridad no se reintentan.
- [x] Reflexión ES/EN: tarjetas de resultados, una nota pedagógica, una mejora
  y siguiente paso; si falla IA muestra avance verificado sin elogios inventados.
  Criterios/recuentos y explicación técnica de recompensas quedan plegados.
- [x] 1.435 unitarias y 214 componentes pasan; tipos, lint y build de 70 páginas
  pasan. QA visual local de estados completo/parcial a 390px, sin desbordamiento.
  Vista de QA usa datos de ejemplo, no certifica una evaluación real de OpenAI.
- [x] Regresión integral: 380 integraciones y un smoke pasan en Postgres
  temporal desechable; sin OpenAI pagado, secretos revisados. Total 2.030 pruebas.
- [x] Publicación autorizada: PR #4, merge `cfa24d0`, CI remoto completo verde
  (run 39033403756). Producción `hango-7lbeilg9z-hangolearn.vercel.app` Ready,
  dominio público asignado y health 200. Sesión real del admin verificada:
  Vocabulario 90/100, Gramática 100/100, Comprensión 100/100; recuperación
  disponible, salida sin pago y detalles plegados. Intento preservado, sin
  pulsar recuperación, sin OpenAI pagado, sin migrar/borrar bases.
- [ ] Aceptación real del juicio corregido: el usuario puede pulsar Recuperar
  evaluación en su informe existente; cuesta una solicitud adicional de IA.
  No certificar nota final/semántica hasta observar ese resultado real.


## Entrega de Speaking en producción — 16 de octubre de 2026

- [x] Destinos comprobados por identificadores de administrador/lección y sesión
  publicada: Prisma **HanGo Desarrollo** y **HanGo Producción** son bases distintas.
  Nombres de proyecto aclarados en Console; sin cambiar conexiones de la app.
- [x] Producción: respaldo lógico completo cifrado y descifrado/hash verificados
  antes del borrado. Eliminada una cuenta no administradora; permanece únicamente
  `hango.learn@gmail.com`. 164 lecciones y 41 escenarios preservados. Dos audios
  privados en outbox de eliminación, no audio compartido. Respaldo y resumen de
  consumo privados en `.codex-tmp/db-backups/production-1792203624260`.
- [x] Cinco migraciones aditivas aplicadas y comprobadas en producción, sin
  pendientes: separación de límites/experiencias IA y evidencia/calidad Speaking.
  Primera lección tiene seis preguntas gramaticales y cinco de práctica reales.
  No se modificaron datos ni configuración de desarrollo en esta operación.
- [x] Modo de activación explícito por entorno: `local` solo en development,
  `production` solo en producción; falta de tablas no cae a evaluación antigua.
  Variable de Vercel añadida únicamente a Production. Administrador conservado
  por identidad exacta y rol; no se alteró su verificación de correo ni auth.
- [x] Verificación del código: 1.613 pruebas unitarias/componentes, tipos,
  lint dirigido, formato, secretos y build de 70 páginas pasan. Las 376
  integraciones y smoke del lote anterior ya estaban verificadas; no se
  repitieron contra producción ni se usó OpenAI de pago.
- [x] Resuelto el bloqueo inicial de publicación por seguridad: excepción de Prisma
  vencida el 16/10; auditoría actual informa 13 altas, una crítica (Next 16.3.5)
  y una moderada. No prorrogar excepción ni bajar controles automáticamente.
  Estado inicial superado por el lote de seguridad descrito debajo y la
  publicación comprobada. Aceptación oral humana todavía pendiente.
- [x] Conexión temporal vPaY revocada con confirmación explícita del usuario;
  seis conexiones originales preservadas y archivo privado temporal retirado.
- [x] Parches autorizados: Next/ESLint 16.3.8, Prisma/Client/Adapter 7.10.1,
  Sharp 0.35.5, music-metadata 11.16.1 y transitivas corregidas. Cliente
  regenerado sin migrar bases. Auditoría runtime: cero avisos; retirada la
  antigua excepción de Prisma. Build de 70 páginas, 1.613 pruebas existentes
  y 15 pruebas nuevas de la política pasan. Sin API pagada.
- [x] Excepción nueva autorizada expresamente solo para GHSA-vfj7-8cjw-p6xm
  de braces y su cadena dev de ESLint, sin parche publicado. Vigente hasta
  finalizar el 23/10 en Bogotá; después bloquea CI. Nodos/versiones/causas
  exactos, ninguna crítica exceptuada; runtime exige cero avisos. Patrones
  rootDir de ESLint prohibidos mientras exista esa excepción. No anunciar
  cero vulnerabilidades totales: quedan cinco avisos de una sola causa dev.
- [x] Integraciones/smoke repetidos con parches: 376 + 1 pasan en Postgres
  desechable, retirado al finalizar. Comparación de prueba de importes usa
  precisión micro-USD del ledger, sin modificar tarifas/límites. Primer CI
  remoto rechazó cinco suites por puerto/nombre de su Postgres desechable;
  alineado servicio CI al destino permitido sin relajar barreras de pruebas.
- [x] CI remoto completo aprobado: 1.416 unitarias, 212 componentes, 376
  integraciones y un smoke (2.005 pruebas). PR #3 integrado normalmente en
  master, commit de aplicación `98161fd`; PC sincronizada sin reset ni force.
  Despliegue `hango-ji1ogz233-hangolearn.vercel.app` Ready y dominio público
  `hango-three.vercel.app` asignado. Login ES/EN y health 200; preview local 404.
- [x] Verificación autenticada en producción tras login del usuario admin:
  Saludos y presentaciones muestra «La nueva evaluación ya está habilitada»
  y ofrece Intentarlo de nuevo para su resultado antiguo. No se pulsó redo ni
  se inició micrófono/IA. Skill Computer Use usado para comprobar UI real.
- [ ] Aceptación oral del usuario: confirmar redo de esa lección, completar
  conversación y revisar puntaje/feedback nuevo en ES y aporte a General Level.
  Despliegue y pruebas simuladas no certifican calidad semántica de su voz.
- [ ] Revisar/retirar excepción dev de braces antes de finalizar el 23/10;
  cualquier nueva alerta, versión/ruta distinta o vencimiento bloquea CI.

Estas comprobaciones sustituyen los bloqueos históricos de EV-04D/EV-05 al final
del archivo; no reinterpretan informes antiguos como evidencia nueva.

**This is the only file to read for current status.** Everything closed
out (FASE 0-16, the full visual redesign) lives in one frozen file,
[`TASKS_ARCHIVE.md`](TASKS_ARCHIVE.md) — open it only if you need the
history behind a specific past decision, not for day-to-day work.
Consolidated 2026-08-08 from 6 files down to 2, because juggling that
many was actively confusing to work with (user feedback, verbatim: "nos
estamos mareando").

## Working conventions (read before touching anything)

- **All communication with the user is in Spanish.** Always — reports and
  feedback too, not just direct answers.
- Small, tested batches. Verify against the real dev server running, not
  just green tests. Stop for explicit approval between phases.
- Updates to this file: terse — checkmarks and high-value notes, never a
  full narration of the process.
- Never commit to git unless explicitly asked.
- When a technical or product decision needs the user's judgment (provider
  choice, design direction, etc.), ask with concrete options instead of
  assuming.
- **Recurring gotcha**: this Next.js version blocks a second `next dev` if
  one is already running (even on another port) — always kill the old
  process (`netstat` + `taskkill`) before running tests or starting the
  server again.
- The user works with both Claude Code and ChatGPT/OpenAI on this same
  codebase in parallel. OpenAI builds the hardest/most complex pieces
  (real-time voice, currently Phase F below); Claude designs the approach
  with the user first, then writes a clear task spec here for OpenAI to
  pick up. This file can drift when work happens in the other assistant's
  session without updating it here — verify against the actual code
  before trusting an old "Complete" label if it matters for what you're
  about to build (this happened once already, see the FASE 9 story
  below).
- AI provider: **OpenAI**, real credentials configured. Chat/AI Teacher
  uses `gpt-5-mini`; Speech-to-text (Speaking Lab) uses `whisper-1`; TTS
  (dialogue/vocabulary/grammar audio, Han's voice) uses `gpt-4o-mini-tts`.
  All fall back to a mock provider automatically if `OPENAI_API_KEY` is
  unset in `.env.local`.

---

## Why this file was rewritten

The user works with two AI assistants on this same codebase in parallel
(Claude Code and ChatGPT). `TASKS_ARCHIVE.md` still claimed "FASE 9 Audio
Engine: skipped, no voice input/output anywhere" — but the real codebase
already has a substantial, working Han voice system that was never
recorded there:

- `app/api/han/speech/route.ts` — real OpenAI TTS (`gpt-4o-mini-tts`)
  endpoint for Han's voice, with oral-script rewriting so spoken responses
  don't just read pinyin/markdown aloud.
- `app/api/han/realtime/route.ts` + `src/components/ai-teacher/
  han-voice-conversation.tsx` — live two-way voice conversation, wired
  into `ai-teacher-chat.tsx` (real usage, not orphaned code).
- `src/components/settings/han-audio-settings.tsx` — a Settings panel for
  it, wired into `app/(app)/settings/page.tsx`.
- `src/components/ai-teacher/han-speech-button.tsx` — a reusable "listen
  to Han" button (loading/playing/error states already handled).

None of this was reflected in the old tasks file. **Lesson: this file can
go stale silently when work happens outside a given assistant's session.
Before trusting a "Complete"/"Skipped" label here, grep the actual code if
it matters for what you're about to build.**

Everything in FASE 0-8, 10-16 below is carried forward from the archive
**without a fresh line-by-line re-audit** (that would be a much larger
task) — it's trusted because it was built and verified across many
sessions with real test/build/dev-server checks. Only FASE 9 (proven
stale) and the new Lesson Interactivity work got a fresh audit this pass.
If you're about to build on top of a specific "Complete" phase and
something doesn't match, verify against the code first, then fix this
file.

---

## Completed phases (see `TASKS_ARCHIVE.md` for detail)

```text
FASE 0  — Base Técnica                    Complete
FASE 1  — Design System                   Complete (superseded visually by the full redesign — see TASKS_ARCHIVE.md)
FASE 2  — Authentication                  Complete
FASE 3  — Onboarding                      Complete
FASE 4  — Educational Content Foundation  Complete
FASE 5  — Learning Journey                Complete
FASE 6  — Lesson Engine                   Complete
FASE 7  — Exercises and Quizzes           Complete
FASE 8  — AI Teacher (text chat)          Complete, plus live voice conversation added since (undocumented until now — see above)
FASE 10 — Speaking Lab                    Complete
FASE 11 — Writing Lab                     Complete
FASE 12 — Mission System                  Complete
FASE 13 — Progress and Review             Complete
FASE 14 — Dashboard and Settings          Complete, plus a Han audio settings panel added since (undocumented until now)
FASE 16 — Testing and Stabilization       Complete except 16.3/16.4/16.7 below
```

---

## FASE 9 — Audio Engine (real status: partially done, not "skipped")

**What's actually real today:**
- Han's own voice (AI Teacher chat, live voice conversation, Settings
  preview) — fully working via OpenAI TTS, verified in use.

**Dialogue-line/conversation audio — done (Phase A). Vocabulary/grammar
word and example audio — done (Phases B/E). FASE 9 is now fully closed
out except Phase F's voice conversation below.**

---

## Active work — Lesson Interactivity Upgrade (started 2026-08-07)

User request: make Vocabulary and Situation steps interactive, using Han
and real AI, instead of static content. Agreed approach, in order:

### Phase A — Dialogue-line audio (foundation) — ✅ Complete (2026-08-08)
- [x] TTS pathway for dialogue lines, separate from Han's voice
  (`src/lib/tts/`, real OpenAI + mock provider, no oral-script rewriting —
  scenario NPCs speak lines as written).
- [x] Generated once per line, cached via `getStorageProvider()`, key
  persisted to `DialogueLine.audioFilePath` — reused across learners/
  sessions, not regenerated.
- [x] Per-line "voice note" play button in `dialogue-lines.tsx` (chat-bubble
  layout, avatar per speaker).
- [x] Full-conversation, seekable player: all of a dialogue's lines merged
  into one WAV (`getOrGenerateDialogueAudioUrl`, reuses
  `mergeWavAudio`/`src/lib/han-speech.ts`), with a ~450ms silence gap
  between speaker turns so the handoff sounds natural, not a hard cut.
  Custom-styled range input for real scrubbing (user feedback: native
  `<audio controls>` alone wasn't enough — needed to look and feel
  on-brand too).
- [x] `SituationStep` redesigned: Han hero panel presenting the lesson
  (gradient + `HanMascot`, speaks `lesson.communicationObjective`),
  learning objectives as numbered color panels, chat-bubble conversation
  below — combines the user-approved mockup options (A base + B hero +
  C numbering).
- [x] Verified across **all 12 seeded lessons** (not just Restaurant 1) —
  every lesson's `SITUATION` step is data-driven off its own real dialogue
  via the same shared components, confirmed 2026-08-08.
- [x] Real bugs found and fixed along the way: `/api/audio/[...key]` only
  authorized Speaking Lab's own recordings, not shared dialogue audio (would
  have 404'd always); a stale pre-format-switch `.mp3` cached line broke
  WAV merging (now self-heals — non-`.wav` cached keys are regenerated);
  tests were silently spending real OpenAI credit once a real
  `OPENAI_API_KEY` landed in `.env.local` (`tests/setup-env.ts` now always
  forces the mock providers, regardless of what's in the local env).

### Phase B — Vocabulary step interactivity — ✅ Complete (2026-08-08)
- [x] Han opens the step speaking in English (`HanSpeechButton` +
  `responseLanguage: "English"` — the app's content is authored in
  English, so this doesn't default to Spanish/auto-detect).
- [x] Each word expands on tap to show 2 example sentences. **Generated
  once via AI, cached in a new `VocabularyExample` table, and reused for
  every learner after** — not regenerated per click/session (user
  feedback, 2026-08-08: generating fresh each time would be wasteful; the
  old static `exampleSentence*` fields on `VocabularyItem` were removed,
  since no seed lesson had ever actually populated them).
- [x] Word pronunciation audio + per-example audio, same lazy
  generate-once-cache pattern as dialogue audio (`vocabulary-audio/...`
  storage keys; `/api/audio/[...key]` extended to authorize this
  namespace as shared content).
- [x] A "Practice this with AI" button per example (not per word) opens
  the AI Teacher with that specific example as context, reusing
  `AskAiButton`'s existing context-patch mechanism.
- [x] Images per word: still explicitly deferred, unchanged decision.
- [x] **All 70 real vocabulary words pre-generated** (user request,
  2026-08-08: don't wait for the first learner to hit each word live —
  generate everything up front so nobody ever sees the "generating..."
  state). Found and fixed a real data bug in the same pass: `VocabularyItem`/
  `GrammarPoint` are shared, lesson-independent entities, and every past
  `npm run db:seed` run left its old rows orphaned instead of deleting
  them (372 `VocabularyItem` rows for 72 real ones; 124 `GrammarPoint` for
  24). Cleaned up the 400 orphans and fixed `prisma/seed.ts` to clear them
  on every future run. Also found gpt-5-mini needed a bigger
  `maxOutputTokens` budget than expected — 400 silently failed ~35% of
  calls (reasoning tokens ate the whole budget before any output text);
  bumped to 900 in `src/lib/vocabulary-interactivity.ts`, retried the
  failures, 70/70 succeeded.
- [x] Verified with a real Artifact mockup approved by the user before
  building (Han hero in jade/gold, expandable word cards, examples with
  audio + Practice button).

### Phase C — Situation step as a real conversation — ✅ Complete (2026-08-08)
- [x] Before the model dialogue is shown, the learner practices the scene
  with the AI playing the NPC role (`SituationPracticeChat` +
  `src/lib/situation-practice.ts`) — teaching purpose, not evaluation.
  Two deliberate differences from Mission's role-play: the AI may offer an
  occasional gentle hint (shown as its own pill, never mixed into the
  character's line) when the learner seems stuck; nothing about the
  practice conversation is saved or evaluated (stateless — the client
  holds the transcript, nothing persists once the learner moves on).
- [x] Roles (who the AI plays vs. the learner) are derived from the
  lesson's existing Mission (`learnerRole`/`aiRole`), matched against the
  dialogue's speakers — **not** a fixed "speaker order 0 = AI" assumption,
  since real seed data has it both ways across lessons.
- [x] "Skip practice" or finishing practice both reveal the existing
  reference dialogue below (Phase A: chat bubbles, per-line and
  full-conversation audio).
- [x] Verified with a real Artifact mockup approved by the user before
  building; user explicitly confirmed keeping the gentle-hint behavior
  over a strict Mission-style no-hints mode.

**Removed 2026-08-10 (user request):** the "Practice first" gate added
useful friction the user decided they didn't want — the Situation step now
shows the model dialogue directly, no chat step first. Deleted end-to-end
since nothing else referenced it: `SituationPracticeChat`,
`src/lib/actions/situation-practice.ts`, `src/lib/situation-practice.ts`,
`src/lib/situation-practice-prompt.ts`, and their tests
(`situation-practice.test.ts`, `situation-practice-prompt.test.ts`).
`SituationStep` no longer needs `useState` at all. Verified: `npx tsc
--noEmit`, `npx eslint .` clean, full suite passes (the only 2 failures
seen on a full run were pre-existing parallel-test-isolation flakiness in
unrelated files, confirmed passing in isolation).

---

## Remaining Lesson Steps Upgrade (started 2026-08-08)

User request: Comprehension, Grammar, Speaking, and Reflection each need
their own real redesign (not just visual — different pedagogy per step),
plus the lesson shell (step navigation) should feel friendlier. Agreed
approach, in order: Comprehension → Grammar → Reflection, each with a
mockup for visual pieces before building. **Speaking is explicitly NOT
built by this assistant** - see its own section below.

**Status: Phases D, E, G, and the shell redesign complete. Phase F
delegated to OpenAI (below, not started as of this writing).**

### Phase (shell) — Step navigation + header: "game board trail" — ✅ Complete (2026-08-08)

Approved via Artifact mockup (option "A" of 3). Same status-driven colors
as before (locked/available/completed) - only the icon and Han placement
changed:

- [x] `StepNavigation` now shows a distinct icon per step *type*
  (`STEP_TYPE_ICON` map in `step-navigation.tsx`, exported for reuse) -
  Headphones for Comprehension, BookOpen for Vocabulary, Mic for
  Speaking, etc. - instead of 3 generic lock/circle/check icons
  regardless of content. Connected by a dashed line, matching
  `LessonPath`'s established zigzag-trail visual language from Learning
  Journey.
- [x] A small `HanAvatar` floats above whichever step is current, like a
  game-board token.
- [x] `LessonHeader` gained a colored icon badge next to the title,
  showing the *current* step's icon (reuses the same `STEP_TYPE_ICON`
  map) - ties the header and nav together instead of the header being
  plain text.

### Phase D — Comprehension: audio-first — ✅ Complete (2026-08-08)
- [x] The step opens with the real conversation audio (Phase A's
  `ConversationPlayer`, now exported from `dialogue-lines.tsx` for reuse)
  and a "listen before you read" framing — the exercises (and their
  Chinese text) only render after the learner clicks through, not from
  the start. Falls back straight to the exercises for the rare lesson
  with no single dialogue to listen to.
  Went straight to build (no mockup needed) — this is a flow/ordering
  change, not a new visual design.

### Phase E — Grammar: real depth for intermediate/advanced learners — ✅ Complete (2026-08-08)

Approved via Artifact mockup. Reused existing models rather than inventing
new ones:

- [x] **More examples**: reused the existing `GrammarExample` model
  (unlike Vocabulary before Phase B, it already existed) - generates
  enough via AI to reach 3 per point, cached, same
  generate-once-reuse-for-everyone pattern as
  `src/lib/vocabulary-interactivity.ts`. Added `audioFilePath` to
  `GrammarExample` (migration), same TTS caching approach.
- [x] **Detailed explanation**: new nullable `GrammarPoint.detailedExplanation`
  field, AI-generated once (multi-paragraph, intermediate/advanced
  framing), cached, shown instead of the short `explanation` when present.
- [x] **Real exercises**: extended the existing `Exercise` model with a
  nullable `grammarPointId` FK instead of inventing new exercise UI -
  reuses `ExerciseItem`/`ExerciseSequence` verbatim (and
  `getExercisesForLesson` now explicitly excludes grammar-scoped
  exercises from the general Comprehension/Guided Practice pool). 2
  `MULTIPLE_CHOICE` exercises per grammar point via AI, cached.
- [x] Extracted `AudioPlayButton` (`src/components/lesson/
  audio-play-button.tsx`) out of `vocabulary-step.tsx` for reuse here -
  same "play this cached audio" logic needed a third time.
- [x] Bulk-pregenerated for all **24 real grammar points** across the 12
  lessons (same reasoning as Vocabulary's 70-word pass) - 24 detailed
  explanations, 72 examples (all with audio), 48 exercises. Hit the same
  gpt-5-mini token-budget issue as Vocabulary (some calls returned empty
  under a 600-token cap); bumped to 900 and retried until 0 failures
  remained.
- [x] `/api/audio/[...key]` extended to authorize the new
  `grammar-audio/` namespace as shared content.

### Phase G — Reflection: a real scored report card — ✅ Complete (2026-08-08)

Approved via Artifact mockup. Structure agreed with the user beforehand:

- [x] New `LessonReflectionReport` model (per user + lesson, `@@unique`) -
  generated once when the learner reaches Reflection with enough data,
  served from cache on revisit (no regeneration path yet - a real future
  enhancement if retrying a lesson should refresh it).
- [x] **Comprehension/Grammar scores**: real % correct from this lesson's
  `ExerciseAttempt` rows (most recent attempt per exercise), split by
  `Exercise.grammarPointId` being null vs. set. `null` (not 0) when the
  lesson has no exercises in that category yet, so the UI can show "—"
  instead of a fake zero.
- [x] **Vocabulary score**: new `LearnerVocabularyInteraction` model
  (user decision, 2026-08-08) - real coverage ("5 of 6 words explored"),
  recorded automatically whenever `vocabulary-interactivity.ts` serves a
  word's examples or audio (already-instrumented call sites, no new UI
  plumbing needed).
- [x] **Speaking score**: new evaluator (`src/lib/reflection-prompt.ts`'s
  `buildSpeakingConversationFeedbackPrompt`) reusing `SpeakingFeedback`'s
  exact 5-dimension shape from Speaking Lab. Reconstructs the transcript
  from the learner's single ongoing `AiConversation` thread, filtered by
  each message's `contextSnapshot` (lesson title + rolePlay context) -
  works today against the current *text* practice chat, not blocked on
  Phase F. Documented simplification: a learner practicing the same
  lesson's Speaking step more than once gets those turns blended
  together; not chased further for v1. "Pronunciation" is given a neutral
  score since text has no audio to judge - noted in the prompt itself for
  whoever wires up Phase F's real voice transcript later.
- [x] Han delivers the results in his own voice (English, `HanSpeechButton`)
  and text, narratively - references the real scores, lists concrete
  strengths/improvements, never invents specifics it has no data for
  (explicit prompt instruction). Explicit percentage scores shown, 100%
  framed as the goal.

---

## Phase F — Speaking: real-time voice conversation (COMPLETE — 2026-08-08)

Implemented with the existing OpenAI Realtime/WebRTC infrastructure in
`app/api/han/realtime/route.ts` and
`src/components/ai-teacher/han-voice-conversation.tsx`; no parallel voice
stack or duplicate scoring path was introduced.

**What exists today that this builds on:**
- `SpeakingStep` (`src/components/lesson/steps/speaking-step.tsx`)
  currently embeds the *text* `AiTeacherChat` in `PRACTICE` mode, with the
  lesson's Mission wired in as role-play context
  (`aiRole`/`learnerRole`/`scenarioContext`/`objective` via
  `useAiTeacher().setContext({ rolePlay: ... })`). The "AI has context and
  can steer the conversation back to the topic even if the learner
  deviates" behavior **already exists** for text, in
  `src/lib/ai-context.ts`'s `buildRolePlaySection` /
  `RolePlayContext` - it just needs a voice-mode equivalent.
- **Explicit user requirement**: this must NOT just replay/re-enact the
  lesson's existing reference dialogue (Phase A's scripted
  waiter/customer conversation). It's a free-form conversation on the
  lesson's theme - the AI can let the learner go off-topic, but knows how
  to steer back toward the objective, the way `RolePlayContext` already
  frames it for text.

**What this phase needs to do (refined 2026-08-08, structure defined
together with the user before handoff):**
- [x] Voice becomes the **primary** mode in `SpeakingStep` (this is the
  point of the phase); text (`AiTeacherChat` in PRACTICE mode) stays as a
  **fallback** for denied/unavailable microphone access, not deleted.
- [x] **Recommended**: parameterize the existing `/api/han/realtime` route
  to accept a role-play system prompt (built from `RolePlayContext`)
  instead of duplicating it as a second endpoint - one Realtime
  integration to maintain, not two. Confirm this approach still makes
  sense once you're in the code; it's a recommendation, not a mandate.
- [x] The AI must not just replay/re-enact the lesson's existing reference
  dialogue (Phase A's scripted conversation) - free-form conversation on
  the lesson's theme, can let the learner deviate, steers back toward the
  objective (exactly what `buildRolePlaySection` already instructs for
  text - carry that same behavior into the voice system prompt).
- [x] Manual "I'm done practicing" control ends the session (don't rely on
  the AI to detect completion and hang up itself).
- [x] Capture a transcript as `{ role: "user" | "assistant", content:
  string }[]` (plain text of both sides, not audio) - this is the exact
  shape Reflection's new Speaking evaluator (Phase G,
  `src/lib/speaking-*` - check what Claude named it by the time this is
  picked up) expects as input. Feed the finished transcript through that
  evaluator when the session ends, instead of building a second scoring
  path.
- [x] Rate-limit/cap session connection time - Realtime sessions bill by
  time connected, same cost-protection reasoning as every other AI-backed
  feature in this codebase (see `src/lib/mission-data.ts`'s
  `checkRateLimit` for the established pattern).

**Visual direction (approved by the user 2026-08-08, via Artifact mockup -
option "C" of 3, "immersive scene stage"):** the whole conversation screen
becomes the scene, not a chrome-heavy call UI:
- Full-bleed gradient background using the app's existing "Laca y bambú"
  hero-panel language (same gradient style as `SituationStep`/
  `VocabularyStep`'s hero panels - `bg-linear-to-br from-primary-900
  via-primary-700 to-accent-700`, or a variant tuned to the scenario).
- An eyebrow line "You're talking to" above the character's name in the
  role's own language + English (e.g. "服务员 · Waiter"), from the same
  `rolePlay`/Mission data already wired into `SpeakingStep` - no new
  content needed.
- A large circular avatar/token in the center representing the AI
  character (not necessarily Han here - Han is the tutor persona; this
  screen's AI plays a scenario role, matching the existing rule that
  Mission-style role-play doesn't wear Han's face).
- A short status line under the avatar reflecting the same states
  `HanVoiceConversation` already tracks (`connecting` / `listening` /
  `thinking` / `speaking`) - reuse that state machine, just restyle it.
- One line of live caption text below the avatar showing the latest
  transcribed turn (reuses `appendMessage`'s existing transcript stream -
  no new transcription plumbing, just render the latest line differently
  than the current plain status text).
- Two circular controls at the bottom: mute and end-session (end reads as
  the "I'm done practicing" control from the functional spec above).
- Full mockup reference (all 3 options considered, C was chosen):
  the Artifact built 2026-08-08 - if it's no longer available by the time
  this is picked up, ask the user for a fresh one rather than guessing at
  details not covered here.

**Completion notes (2026-08-08):**
- `SpeakingStep` now opens the immersive voice stage first and offers the
  existing PRACTICE chat only through **Use text instead** or when voice is
  unavailable. The lesson Mission/`RolePlayContext` supplies the AI role,
  learner role, scenario, objective, and lesson identity.
- The shared Realtime prompt explicitly starts a new unscripted role-play,
  forbids quoting/reconstructing the reference dialogue, permits short
  natural detours, and gently returns to the objective.
- The shared voice component now has an `immersive` variant with the
  approved gradient, non-Han character token, bilingual role label,
  connecting/listening/thinking/speaking states, latest live caption,
  mute control, and manual red end control.
- Completed user and assistant turns are collected as
  `{ role: "user" | "assistant", content: string }[]`. Ending waits for all
  pending turn saves before unlocking Continue, so the existing Reflection
  Speaking evaluator can reconstruct and score that transcript without a
  second evaluation route.
- Cost protection is applied twice: the API allows at most 6 new Realtime
  connections per authenticated user per 10-minute window, and the client
  automatically closes an individual lesson session after 5 minutes.
- Cleanup cancels pending output and closes the data channel, peer
  connection, microphone tracks, remote tracks, and audio element to avoid
  voices continuing after the learner ends or leaves the scene.

**Verification (2026-08-08):**
- `npm run typecheck`, `npm run lint`, `npm run test:unit` (209 tests), and
  `npm run test:component` (35 tests) pass.
- Verified against the running local server by completing the real lesson
  flow through Vocabulary, Situation, Comprehension, and Grammar. Speaking
  unlocked normally and rendered the immersive `服务员 · Waiter` scene with
  **Start conversation** and **Use text instead**. Browser automation did
  not grant microphone access or start a paid Realtime session; final
  microphone/audio acceptance remains a short manual device check.

---

## Phase G2 — Speaking Lab redesign: real tone scoring, no AI tokens (COMPLETE — 2026-08-08)

Standalone `/speaking-lab` (separate from the lesson's Speaking step above).
Found hardcoded to always serve Restaurant Lesson 1's content, and its only
"pronunciation" score was an LLM guessing from a Whisper transcript, never
the actual audio. Redesigned around one idea: score tone accuracy for real,
computed client-side from the recording's own pitch contour — zero AI cost,
and a genuine differentiator (few apps score Mandarin tones at all).

- `src/lib/tone-analysis.ts` (pure, unit-tested): parses tone numbers from
  pinyin diacritics, builds an idealized pitch-shape reference per tone,
  extracts F0 via autocorrelation from raw PCM, and scores the match via
  Pearson correlation (0-100, or `null` — never fabricated — when there's
  not enough voiced audio).
- `audio-recorder.tsx` decodes the recording locally (Web Audio API) right
  after stopping, shows "Tone match: NN%" before submit, and sends the
  score to the server alongside the audio. Never influences competency
  evidence (`recordSpeakingEvidence` still averages only the 5 AI
  dimensions) — it's informational, not a trusted grading input, since it's
  client-computed.
- `speaking-prompts.ts` no longer hardcodes one lesson: `getSpeakingPrompts`
  takes an optional `lessonId`, and `getSpeakingLessonOptions` lists every
  published lesson for a picker (`speaking-lab-home.tsx`, `?lessonId=`).
  Shadowing now uses the lesson's *entire* dialogue (long-form, matching
  the existing native dialogue audio) instead of one line.
- `speaking-session.tsx` adds a "Listen to native audio" button for
  Shadowing, reusing the existing dialogue-audio generate-once-cache
  (`dialogue-audio.ts`) — no new audio generation cost.
- `speaking-feedback-display.tsx` surfaces the tone score in its own
  highlighted card, distinct from the AI-inferred dimensions, with a note
  explaining it's computed from the real recording.

**Verification (2026-08-08):** `npx tsc --noEmit`, `npx eslint .`, and
`npx vitest run` (395 tests, up from 382) all pass; `npm run build`
succeeds with `/speaking-lab` present in the route list.

**Follow-up after manual testing (2026-08-08):**
- Split Shadowing into two sub-modes (user ask: "solo una opcion no, haz
  las dos"): **Conversation** (`conversation-shadowing.tsx` - the lesson's
  real dialogue as a chat thread, one line at a time, same bubble language
  as `DialogueLines`, each line its own `SpeakingSession` created
  client-side - no schema change) and **Long text** (`speaking-session.tsx`
  - the whole dialogue as one passage). Both show a pinyin show/hide toggle
  (was forced-always-on for Shadowing at first; user asked for a toggle
  instead) and per-character green/red shading via a new
  `CharacterToneFeedback` component + `scoreToneMatchPerSyllable`.
- **Real bug fixed**: a partial recording (learner only said a few words)
  was marking later, unspoken syllables green. Root cause: the whole voiced
  contour was uniformly time-stretched across *every* syllable in the
  prompt regardless of how much was actually said. Fixed by estimating how
  many leading syllables the voiced duration can plausibly cover
  (`MIN_VOICED_FRAMES_PER_SYLLABLE` in `tone-analysis.ts`) and leaving the
  rest `score: null` (neutral, not green) instead of scoring the whole
  prompt. `scoreToneMatch`'s overall number is now derived from
  `scoreToneMatchPerSyllable` (average of only the scored syllables) so the
  same fix applies there too.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (400 tests) all pass.
- **New second top-level option: "Practice with Han"** (`free-topic-
  practice.tsx`) - user ask: a free-topic live voice conversation, built
  from a topic + level + pace + free-text "anything else" the learner
  supplies themselves, reusing the exact same real-time voice mechanism as
  the lesson Speaking step (`HanVoiceConversation` immersive +
  `RolePlayContext`), not a new one.
  - `RolePlayContext` (`ai-context.ts`) gained optional `level`, `pace`,
    and `isFreeTopic` fields. When `level` is set it overrides the
    lesson role-play's hardcoded "HSK 3–4" default in both
    `buildRealtimeSystemPrompt` and `han-realtime.ts`'s turn/opening/
    closing instruction builders; `pace` adds a slow/fast speaking-rate
    instruction; `isFreeTopic` swaps the ~50s lesson pacing hint for an
    open-ended one (the client-side timers, not this hint, are what
    actually bound session length).
  - Feedback after the conversation is **one** AI call reusing
    `reflection-prompt.ts`'s existing rubric/prompt (same shape as the
    lesson Speaking step's Reflection scoring) - not per-turn, and skipped
    entirely (no AI call) when `hasEnoughSpeakingEvidence` says the
    exchange was too short to grade honestly.
  - No schema change: this mode doesn't create a `SpeakingSession` row at
    all - it's a practice tool, not a graded attempt.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (402 tests) all pass; `npm run build` succeeds.
- **Two more setup options added** (user ask, 2026-08-08): **Who is Han?**
  (select - matches the topic by default, or friend/colleague/stranger/job
  interviewer - just changes `aiRole`, no new context field) and **When
  should Han correct me?** (radio - "stay in the scene" keeps today's
  Mandarin-only/feedback-at-the-end behavior; "correct me as we talk" is a
  new `correctionMode: "tutor"` on `RolePlayContext` that lets Han reply
  in-character in Mandarin first, then briefly switch to the explanation
  language for a short correction only when there was a clear mistake -
  wired through both `ai-context.ts`'s role-play section and
  `han-realtime.ts`'s per-turn instructions; unset/"scene" is unchanged
  existing behavior everywhere else (lesson Speaking step included).
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (404 tests) all pass; `npm run build` succeeds.
- **Real bug fixed (user report, 2026-08-08)**: feedback after a
  conversation always came back as flat 50s with generic notes. Root
  cause: `free-topic-practice.ts`'s AI call used `maxOutputTokens: 400` for
  the same rubric+mistakes prompt `reflection.ts` already uses at `1_600`
  (its comment: "GPT-5 reasoning tokens count against this budget") - the
  JSON got cut off mid-response and `parseSpeakingConversationFeedback`
  silently fell back to `DEFAULT_SPEAKING_FEEDBACK`, indistinguishable from
  a real (bad) result. Fixed by matching reflection.ts's proven
  `maxOutputTokens: 1_600` / `timeoutMs: 45_000`. Also fixed a related
  honesty bug this exposed: a genuine error (auth/rate-limit/provider
  failure) was being masked as `DEFAULT_SPEAKING_FEEDBACK` too - now
  surfaces the real error with a "try again" button instead of fake scores.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (404 tests) all pass; `npm run build` succeeds.
- **Removed Pronunciation and Guided Conversation modes** (user decision,
  2026-08-08): "Practice with Han" covers open-ended spoken practice
  better than a fixed single-word or single-objective prompt did.
  `getSpeakingPrompts` now only returns `SHADOWING`/`SCENARIO_ROLE_PLAY`
  (dropped the vocabulary query it only needed for Pronunciation); Speaking
  Lab's mode grid is down to those two cards. The Prisma
  `SpeakingActivityType` enum and `speaking-data.ts` still support all 4
  values unchanged (no migration, no risk to old attempts) - only the UI
  and prompt-sourcing stopped offering the removed two.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (404 tests) all pass; `npm run build` succeeds.

---

## Writing Lab redesign (COMPLETE — 2026-08-08)

User feedback: SENTENCE was too basic to give the AI anything worth
correcting (single-sentence spoken production is already covered by
Speaking Lab). Matched Speaking Lab's earlier redesign in scope: removed
SENTENCE, added a lesson picker (was an unscoped global catalog before),
and added a new task type, Translation Challenge.

- **Schema migration** (`20260809022854_remove_sentence_add_translation_challenge`):
  `WritingTaskType` drops `SENTENCE`, adds `TRANSLATION_CHALLENGE`;
  `WritingTask` gains `referenceAnswer String?` - the lesson's own Chinese
  text, used only as grading context for the AI, never shown to the
  learner. Existing `SENTENCE` rows were deleted before migrating (Postgres
  can't cast an enum value out of existence while rows still reference it).
- **Translation Challenge is auto-generated, not hand-authored**: seeded
  from each lesson's own dialogue translations (`createFullLesson` now
  builds one per lesson from `params.lines`) - same "derive from existing
  content" approach as Shadowing's long-text mode, so it didn't need 12
  lessons' worth of new hand-written prompts.
- `getWritingTasks`/`getWritingLessonOptions` (`writing-data.ts`) now scope
  to one lesson at a time with a picker (`writing-lab-home.tsx`,
  `?lessonId=`), matching Speaking Lab's pattern instead of showing every
  lesson's tasks in one flat list.
- `buildWritingFeedbackPrompt` (`writing-feedback.ts`) takes an optional
  `referenceAnswer`: when set, grading checks translation accuracy against
  it while explicitly instructing the AI to accept any other natural
  phrasing of the same meaning, not an exact match.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (407 tests) all pass; `npm run build` succeeds; re-seeded and manually
  verified 12 lessons × 4 task types (SHORT_MESSAGE, PARAGRAPH,
  PRACTICAL_WRITING, TRANSLATION_CHALLENGE), zero SENTENCE rows remaining.

**Round 2 — three top-level options instead of a type catalog (user ask,
2026-08-08):** "no quiero que sea tanto asi" - replaced the flat
type-grouped list with three distinct modes on the home screen, closer to
Speaking Lab's structure.

- **Schema migration** (`20260809032112_writing_lab_remove_short_message_practical_writing`):
  `WritingTaskType` drops `SHORT_MESSAGE` and `PRACTICAL_WRITING` too - down
  to just `PARAGRAPH` and `TRANSLATION_CHALLENGE`. All existing WritingTask
  rows were cleared before migrating and reseeded fresh (dev data only,
  beta not yet launched).
- **Write a Paragraph**: unchanged mechanically (WritingTaskSession/
  WritingEditor, autosave, rewrite chain) - one PARAGRAPH task per lesson,
  lesson picker like before.
- **Translation Challenge redesigned**: no longer one auto-generated task
  per lesson tied to that lesson's own dialogue - now a standalone pool of
  15 hand-authored texts spanning different everyday topics (weather,
  family, work, health, technology, directions, celebrations, complaints,
  apologies, transportation, school, movies, pets, banking, hobbies),
  `lessonId: null` so they show up in their own list regardless of lesson
  (`seedTranslationChallenges()`, `getTranslationChallenges()`).
- **New: Custom Writing** (`custom-writing.tsx`) - the learner states their
  own topic/level/format/tone instead of picking a WritingTask; grading
  (`buildCustomWritingFeedbackPrompt`) is judged against exactly those
  characteristics. No WritingTask/WritingAttempt row at all - same
  "ephemeral practice tool" precedent as Speaking Lab's "Practice with Han"
  free-topic mode (a shared content catalog table isn't the right place for
  one-off personalized prompts with no per-user ownership field).
- **Unrelated flake fixed along the way**: `tests/integration/situation-
  practice.test.ts` used `db.lesson.findFirstOrThrow()` (arbitrary lesson,
  no ordering) then created its own Mission on that same real lesson - a
  full reseed changed which lesson that returned and exposed a collision
  with real seeded mission data. Fixed by giving the test its own isolated
  lesson instead of borrowing a real one.
- Verification: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
  (412 tests) all pass; `npm run build` succeeds; reseeded (12 lessons × 1
  PARAGRAPH task, 15 standalone Translation Challenge texts) and confirmed
  `/writing-lab` loads on a freshly restarted dev server.

---

## Learning Journey content expansion (in progress — 2026-08-09)

User request: the whole app had only 1 domain, 3 scenarios, 12 lessons,
all HSK3/"INTERMEDIATE" - no true from-zero starting point despite the
onboarding flow implying one. Plan approved: 5 new domains (Foundations,
Getting Around, Making Friends, Health, Work & Office), ordered by real
difficulty, "mucho contenido" - building one domain at a time.

**Schema**: `ScenarioDifficulty` gained `BEGINNER` (migration
`20260810014020_add_beginner_scenario_difficulty`) - it previously only had
INTERMEDIATE/UPPER_INTERMEDIATE/ADVANCED, so beginner content had no tier
to belong to at all.

**Done — Foundations domain (BEGINNER, HSK1), 4 lessons** (`seedFoundationsDomain()`
in `prisma/seed.ts`, domain order `-1` so it sorts before every existing
domain in the Learning Journey):
1. Greetings and Introductions - 你好/叫/名字, 吗 questions, 呢 follow-ups
2. Numbers, Time and Dates - 点/号 time & dates, 想 + verb, 几 for small numbers
3. Basic Needs - 请问, 在哪儿, 我可以...吗 polite requests
4. Simple Directions - 在 + location, 往 + direction + verb, X不X questions

Each lesson has a full dialogue (~10-11 lines), ~10 vocabulary items, 3
grammar points with examples, 5 exercises, a 4-question quiz, a mission,
and a Writing Lab paragraph task - same shape and depth as the existing
Restaurant/Hotel/Shopping lessons, just at HSK1 instead of HSK3.

**Verification**: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
(412 tests) all pass, `npm run build` succeeds, reseeded and confirmed all
4 lessons pass `validateLessonForPublish` and publish successfully. Fixed
2 unrelated tests (`critical-path.test.ts`, `speaking-prompts.test.ts`)
that called `getWritingTasks()`/`getSpeakingPrompts()` with no lessonId and
implicitly relied on "the first lesson is Restaurant Lesson 1" - no longer
true now that Foundations sorts first (by design). Both now pass an
explicit lessonId instead of depending on default-lesson resolution order.

**Round 2 — restructured as one scenario per topic (user ask, 2026-08-09):**
instead of bundling several topics into one "Everyday Basics" scenario,
each topic became its own scenario (matching Restaurant/Hotel/Shopping's
existing pattern), 4 lessons deep. All in the "Foundations" domain,
BEGINNER/HSK1, seeded by `seedFoundationsExpansion()`:

- **Family** (order 1): Introducing Your Family, Describing Family
  Members, Where Your Family Lives, Family Activities
- **Weather & Seasons** (order 2): Asking About Today's Weather, Seasons
  and Preferences, Weather and Clothing, Planning Around Weather
- **Daily Life & Feelings** (order 3): Basic Feelings, Your Daily Routine,
  How You Feel About Your Day, Weekend Routine
- **Around the House** (order 4): Rooms in Your House, Furniture and
  Objects, Household Activities, Describing Your Neighborhood
- **Basic Shopping** (order 5): Colors and Simple Items, Sizes and
  Preferences, Asking the Price, Returning an Item
- **Phone & Communication** (order 6): Making a Phone Call, Leaving a
  Message, Texting Basics, Making an Appointment by Phone

24 lessons total, same shape/depth as every other lesson in the app
(dialogue, vocabulary, grammar, exercises, quiz, mission, writing task).
Combined with round 1's Getting Started scenario, Foundations now has 7
scenarios / 28 lessons - more content than the rest of the app combined.

**Verification**: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
(412 tests) all pass, `npm run build` succeeds, reseeded and confirmed all
24 lessons pass `validateLessonForPublish` and publish successfully.
Confirmed `/learning-journey` loads on a freshly restarted dev server.

**Round 3 — the remaining 4 originally-proposed domains (user ask,
2026-08-09):** each its own top-level domain (like "Travel" containing
"Hotel"), not folded into Foundations, since these span INTERMEDIATE/
ADVANCED difficulty. `seedGettingAroundDomain()`, `seedMakingFriendsDomain()`,
`seedHealthDomain()`, `seedWorkOfficeDomain()` in `prisma/seed.ts`:

- **Getting Around** (domain order 2, BEGINNER→INTERMEDIATE, two
  `ScenarioLevel` rows on one scenario): Taking a Taxi, Public Transport,
  Asking for Directions in the City, Booking Travel
- **Making Friends** (order 3, INTERMEDIATE): Introducing Yourself
  Socially, Small Talk & Hobbies, Making Plans/Inviting Someone,
  Exchanging Contact Info
- **Health** (order 4, INTERMEDIATE→ADVANCED, two `ScenarioLevel` rows):
  Pharmacy - Describing Symptoms, Doctor's Visit, Emergency Situations,
  Follow-up & Insurance
- **Work & Office** (order 5, ADVANCED): Introducing Yourself
  Professionally, Simple Meetings, Asking for Time Off, Workplace Small
  Talk

A scenario spanning two difficulty tiers (Getting Around, Health) uses two
`ScenarioLevel` rows on the same `Scenario` - the schema already supported
this via `@@unique([scenarioId, difficulty])`, just never exercised before.

16 more lessons, same full shape as every other lesson. Learning Journey
now has 8 domains / 12 scenarios / 44 lessons total (was 3 scenarios / 12
lessons before this whole content-expansion effort started).

**Verification**: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`
(412 tests) all pass, `npm run build` succeeds, reseeded and confirmed all
16 lessons pass `validateLessonForPublish` and publish successfully.
Confirmed `/learning-journey` loads on a freshly restarted dev server.

Also queued for later, not started: Listening Lab, Reading Lab, an AI
companion aware of the learner's current level at all times, a basic
grammar guide, and a "start from zero" guide.

**Round 4 — difficulty-ordered chapters on `/learning-journey` (user ask,
2026-08-10):** the flat domain-Select + grid made the new difficulty curve
invisible. Replaced `DomainFilter` (deleted) with `JourneyChapters`
(`src/components/learning-journey/journey-chapters.tsx`): three color-coded
sections in strict order — Fundamentos (jade/secondary), Vida cotidiana
(gold/accent), Situaciones avanzadas (lacquer/primary) — reusing the
existing brand palette instead of new colors. A pure `resolveJourneyChapter()`
in `learning-journey.ts` buckets each scenario by its *lowest* difficulty
tier (a scenario spanning two tiers, like Getting Around, surfaces once
under the lower one). An "Estás acá" badge (Han + label) marks the first
chapter that isn't fully completed. Explicitly no LOCKED state and no
dimming on later chapters — user asked for organization by difficulty, not
gating; that's a separate, deferred idea if wanted later.

Verification: `npx tsc --noEmit`, `npx eslint .` clean; new unit tests for
`resolveJourneyChapter` (4 cases) plus the full suite pass (415/417 — the 2
failures are unrelated to this change: stray test data from a parallel
integration test run, and the smoke test colliding with an already-running
dev server on port 3000. `content.test.ts` passes cleanly (7/7) when run in
isolation.).

**Round 5 — Vocabulary step redesign + difficulty-scaled quiz questions +
hand-authored examples for every tier (user requests, 2026-08-10/11):**

- Vocabulary step rebuilt as a one-word-at-a-time carousel
  (`src/components/lesson/steps/vocabulary-step.tsx`): flashcard, progress
  dots, example(s), animated slide transition (`card-slide-in` keyframes in
  `app/globals.css`), no more full-grid-up-front.
- Quiz questions scale with tier, all built from the lesson's own data via
  `src/lib/content/vocabulary-quiz.ts` (`buildVocabularyQuizOptions`,
  `buildFillBlankQuestion`) — zero AI calls, zero token cost, ever. Beginner:
  4 questions (meaning, pinyin, reverse-translation, one fill-blank from the
  hardest example). Intermediate: 5 (adds a second fill-blank from the
  easiest example). Advanced: 6 (adds a third, mid-difficulty fill-blank).
- User then asked why vocabulary examples still depend on OpenAI at all
  ("por qué debería pagar el primer alumno") — resolved by hand-authoring
  every example sentence directly into the database, matching the existing
  seeded-content standard, instead of relying on the generate-once-cache AI
  fallback:
  - **Foundations** (all BEGINNER, 273 unique words): 3 examples each = 819
    sentences.
  - **Getting Around's BEGINNER tier** (20 words, previously missed): 3
    examples each = 60 sentences.
  - **Intermediate** (152 words across Daily Life/Travel/Getting
    Around/Making Friends/Health): 6 examples each, ordered easy→hard = 912
    sentences.
  - **Advanced** (60 words across Work & Office/Health): 10 examples each,
    HSK4+ grammar (虽然...但是, 既然...就, 要不是...就) = 600 sentences.
- User then asked for the Beginner chapter to grow from 8 scenarios to 15
  (7 new, ordered easy→hard, cumulative goal: HSK2-3 per the new 3.0
  standard by the end) — added via `seedFoundationsExpansion2()` in
  `prisma/seed.ts`: School & Classroom (HSK1) → Hobbies & Free Time (HSK1-2)
  → Body & Feeling Unwell/Basics (HSK2) → Money, Banking & Simple
  Transactions (HSK2) → Asking About Places & Opening Hours (HSK2) →
  Opinions, Comparisons & Preferences (HSK2-3) → Making Plans & Talking
  About Time (HSK3, closes the chapter with 过/了/要/打算/会 and
  先...然后...最后 narrative sequencing). 28 new lessons, same
  `createFullLesson()` shape as everything else. All 280 of their vocabulary
  words got 3 hand-authored examples each (840 sentences), matching the
  Beginner-tier standard.
- Also bumped the AI-fallback prompt (`vocabulary-examples-prompt.ts`) from
  "exactly 2" to "exactly 3" examples, so any future word that still falls
  through to on-demand AI generation matches the new baseline.

Total across this round: **505 unique words, 2,391 hand-authored example
sentences**, all verified in the database with the exact expected count per
tier (0 mismatches on every pass). Verification each round: `npx tsc
--noEmit`, `npx eslint .` clean, `vocabulary-quiz.test.ts` (12 tests) green,
full suite passes (only the same 2 pre-existing parallel-test-isolation
failures, confirmed passing in isolation each time).

**Round 6 — speaking difficulty scaling + new "Everyday Life" domain, HSK4
ceiling (user ask, 2026-08-11):** target curve confirmed with the user —
Foundations tops out HSK2-3, Everyday Life HSK4, Advanced Situations
HSK5-9 (not started).

- Added `describeSpeakingDifficulty(hskLevel)` (`src/lib/ai-context.ts`) —
  shared pace/vocab/grammar instructions keyed to HSK1 through HSK5+, wired
  into both the Mission role-play prompt (`mission-prompt.ts`, via a new
  `hskReference` field threaded from `mission-data.ts`'s lesson join) and
  the Speaking step's realtime/text role-play (`RolePlayContext.lessonHskLevel`
  in `ai-context.ts`, passed down from `lesson-engine.tsx` →
  `speaking-step.tsx`). Previously Missions had zero difficulty scaling and
  Speaking Lab used a hardcoded "HSK 3-4" regardless of the actual lesson.
  New tests: 4 in `mission-prompt.test.ts`, 2 in `ai-context.test.ts`.
- New **Everyday Life** domain (order 6), 10 scenarios / 40 lessons via
  `seedEverydayLifeDomain()`, difficulty-ordered easy→hard (HSK2 → HSK4):
  Grocery Shopping & Meal Planning → Coffee Shop & Casual Meetups → Gym &
  Fitness Classes → Renting an Apartment → Post Office & Mailing Packages →
  Social Events & Small Talk with Strangers → Weather, Plans & Rescheduling
  → Roommate & Neighbor Issues → Online Shopping & Delivery Problems → Job
  Interview Basics (closes the chapter at HSK4). Same full lesson shape as
  every other domain (dialogue, ~10 vocabulary, 3 grammar points, 5
  exercises, 4-question quiz, mission, writing task).
- **Bug found and fixed while reseeding**: `getContinueLearningTarget`,
  `getScenariosWithProgress`, and `getPublishedScenarios` all ordered
  scenarios by `scenario.order` alone — but that field only resets to 0
  per-domain, so with 9 domains all having a scenario at `order: 0` the sort
  was effectively unordered (tie-broken by DB insertion order, so
  reseeding could silently change which scenario a brand-new learner lands
  on first). Fixed by sorting `[{ domain: { order: "asc" } }, { order: "asc" }]`
  in all three (`src/lib/content/learning-journey-data.ts`,
  `src/lib/content/scenario.ts`). Exposed a stale assertion in
  `critical-path.test.ts` (expected Restaurant as the very first lesson,
  predating the Foundations domain's `order: -1`) — updated to
  `foundations-greetings-and-introductions`, the actual correct entry point.

Verification: `npx tsc --noEmit`, `npx eslint .` clean, full suite passes
(419-420/421 depending on parallel-test timing — same pre-existing
isolation flakiness as prior rounds, confirmed passing individually).

**Round 6b — vocabulary examples for all 400 new words + a UI bug fix
(2026-08-11):** hand-authored 6 example sentences each (easy→hard) for
every one of the 400 vocabulary rows across the 10 Everyday Life
scenarios — 2,400 sentences total, same zero-AI-token-cost standard as
Round 5's Intermediate tier. Verified in the database: exactly 6/6 on
every row, 0 mismatches.

Also fixed a reported bug while working in this area: the Vocabulary
step's multiple-choice options reshuffled on every answer (`VocabularyQuizCheck`/
`VocabularyFillBlankCheck` in `vocabulary-step.tsx` called
`buildVocabularyQuizOptions`/`buildFillBlankQuestion` — both `Math.random`-based
shuffles — directly in the render body, so the state update from answering
triggered a fresh shuffle). Fixed by wrapping both in `useMemo`, and by
memoizing the `quizItems` array one level up (it was a fresh `.map()` each
render, which would have defeated the `useMemo` dependency check anyway).

Verification: `npx tsc --noEmit`, `npx eslint .` clean, full suite green
(420/420, no flaky failures this run).

**Round 6c — same AI-free treatment extended to Grammar, app-wide
(2026-08-11):** user asked why the Grammar step still showed a real
"generating" delay after Round 6b removed it from Vocabulary — turned out
Grammar's extra examples (beyond the 1 seeded per point) and its 2 practice
exercises were still generated live via OpenAI on a lesson's first view
(`grammar-interactivity.ts`, `TARGET_EXAMPLE_COUNT = 3`). Confirmed by
scope, then hand-authored the missing content for **every real grammar
point in the app**, not just Everyday Life.

- First found **600** `GrammarPoint` rows total, but **240 were stray test
  data** (from `grammar-interactivity.test.ts`'s `createTestGrammarPoint`,
  orphaned — 0 `LessonGrammarPoint` links, timestamps from earlier session
  runs whose `afterEach` cleanup never ran). Deleted these 240; the real
  count is 360, matching exactly the number of grammar points seeded
  across every domain this whole session.
- Hand-authored 2 more examples (reaching the 3-per-point target) and 2
  multiple-choice practice exercises (prompt + 4 options + explanation)
  for all 360 real grammar points, domain by domain: Everyday Life (120),
  Foundations (168), Daily Life (16), Health/Work & Office/Making
  Friends/Getting Around (12 each), Travel (8). **720 example sentences +
  720 exercises = 1,440 pieces of content**, same zero-AI-token-cost
  standard as vocabulary. Verified in the database: exactly 3 examples / 2
  published exercises on every one of the 360 points, 0 mismatches.
- Grammar step now behaves exactly like Vocabulary: the "first learner"
  delay is gone everywhere in the app, not just Everyday Life.

Verification: `npx tsc --noEmit`, `npx eslint .` clean, full suite green
(420/420). One transient failure in `content.test.ts` during a
parallel run traced to the same pre-existing test-isolation flakiness
(confirmed passing alone) — not a regression.

**Round 6d — speaking difficulty scaling wasn't reaching the live
voice conversation, and closing turns got cut off mid-farewell (user
report, 2026-08-11):** two real bugs found in the Speaking step's
realtime voice path (`SpeakingStep` → `HanVoiceConversation` →
`/api/han/realtime`), both pre-dating this round's work.

- **Difficulty scaling gap**: Round 6's `describeSpeakingDifficulty()` /
  `lessonHskLevel` only reached `ai-context.ts`'s `buildRealtimeSystemPrompt`
  — the realtime session's *one-time initial* instructions. Every actual
  turn during the conversation is re-instructed on the fly by a *separate*
  file, `src/lib/han-realtime.ts` (`buildRealtimeTurnInstructions` /
  `buildRealtimeOpeningInstructions` / `buildRealtimeClosingInstructions`),
  which had its own hardcoded "HSK 3–4" fallback and no `lessonHskLevel`
  field at all — so a brand-new learner on lesson 1 of Foundations still
  heard HSK3-4 Chinese despite the lesson only having taught a handful of
  HSK1 words. Added `lessonHskLevel` to `RealtimeRolePlay`, wired
  `describeSpeakingDifficulty()` into `lessonLanguageConstraints()`, and
  — per the original request that early Foundations speak "solo con las
  palabras que te enseñan" — HSK1-2 lessons (no explicit `level` override)
  now get a hard "use ONLY this lesson's vocabulary" instruction instead of
  the softer "prefer" wording used from HSK3 onward. 4 new tests in
  `han-realtime.test.ts`.
- **Abrupt cutoffs instead of a natural goodbye**: `SpeakingStep` scheduled
  the natural-closing exchange at 55s with a hard `maxSessionMs` safety net
  at 70s — only a 15s gap for Han to receive the closing instruction,
  generate a farewell, and have its audio finish playing over WebRTC. Under
  normal turn-taking latency this regularly lost the race, so the hard
  cutoff cut Han off before "再见" (or whatever in-character farewell fit
  the scene). Widened the gap to `naturalCloseAfterMs=65_000` /
  `maxSessionMs=100_000` (~35s of headroom) so total conversations land
  around 1:10–1:25 and the hard limit is a true last-resort safety net, not
  something that fires under normal conditions.
  `buildRealtimeClosingInstructions()` already asked for a natural,
  in-character farewell rather than forcing a literal "再见" - no change
  needed there.

Verification: `npx tsc --noEmit`, `npx eslint .` clean, full suite green
(424/424 real failures — one `grammar-interactivity.test.ts` foreign-key
error during a parallel run traced to the same pre-existing test-isolation
issue, confirmed passing alone).

**Round 6e — new "Advanced Situations" chapter, HSK5→HSK9 (2026-08-11):**
following up on Everyday Life (Round 5/6), the user asked for the same
full-format treatment applied to a new top-of-journey chapter spanning
HSK5 through HSK9 — the "Situaciones avanzadas" bucket in
`journey-chapters.tsx` was real but only held HSK4 Work & Office/Health
content until now. Confirmed the 10-scenario order with the user
(HSK5 → HSK9, hardest last) before building.

- New domain `advanced-situations` (`order: 7`), 10 scenarios × 4 lessons
  = 40 lessons, all `difficulty: "ADVANCED"`, `hskReference` climbing 5→9
  across the chapter: Negotiating a Job Contract, Debating a Current
  Issue, Academic Seminar Discussion, Resolving a Complex Workplace
  Conflict, Media Interview as an Expert, Legal and Notarial Procedures,
  Formal Speech and Toast at an Event, Specialist Medical Consultation,
  Diplomatic and Culturally Sensitive Negotiation, Tech and Finance Expert
  Panel. Same `createFullLesson()` builder used for every prior domain
  this session (dialogue, vocabulary, grammar, exercises, quiz, mission,
  writing task per lesson).
- Fixed a pre-existing bug hit while seeding: `seedEverydayLifeDomain()`
  used `db.domain.deleteMany()` + `db.domain.create()` instead of the
  `db.scenario.deleteMany()` + `db.domain.upsert()` pattern every other
  domain function uses — the direct delete has no `onDelete: Cascade` on
  `Scenario.domain` and fails once real `Scenario` rows exist under that
  domain. Aligned both `seedEverydayLifeDomain()` and the new
  `seedAdvancedSituationsDomain()` to the safe pattern.
- **Vocabulary examples**: user flagged the established 10-examples/word
  ADVANCED-tier standard (from Round 5) would mean hand-authoring 4,000
  sentences for 400 new words — asked to reduce scope. Confirmed with
  user: **6 examples/word** (2,400 sentences total), still far above the
  functional minimum (`getOrGenerateVocabularyExamples` only needs
  `length > 0` to skip live OpenAI generation) and with an explicit
  "no gaste en generación de OpenAI" instruction honored — all content
  hand-authored ahead of time via one-off insert scripts, zero runtime AI
  calls.
- **Grammar examples/exercises**: kept the app-wide standard from Round
  6c — 3 total `GrammarExample` per point (1 seeded in the lesson +
  2 hand-authored extra) and 2 published practice `Exercise` rows per
  point, across all 120 new grammar points (12 per scenario × 10).
- Verified: 400/400 vocabulary words have exactly 6 examples (2,400 rows);
  120/120 grammar points have exactly 3 examples + 2 published exercises
  (360 + 240 rows). `npx tsc --noEmit`, `npx eslint .` clean, full suite
  green (399/399, plus 2 unrelated vitest-worker timeouts on
  `shell.test.tsx`/`ui.test.tsx` confirmed passing in isolation — parallel
  worker-pool flakiness, not a regression).

**Round 6f — critical fix: reseeding was silently discarding every
hand-authored VocabularyExample/GrammarExample/Exercise in the app
(user report, 2026-08-11):** user opened a Foundations Vocabulary card and
saw the live "Generating — only happens the first time" fallback, which
should never fire after Rounds 5/6b/6c hand-authored that content
app-wide. Root cause: `createFullLesson()` does `db.lesson.deleteMany` +
recreate on every call, including fresh `VocabularyItem`/`GrammarPoint`
rows every time — and every domain seed function (`seedFoundationsDomain`,
`seedEverydayLifeDomain`, `seedAdvancedSituationsDomain`, etc.) is called
unconditionally from `main()`. Running `npx prisma db seed` for *any*
reason (as this round's own Advanced Situations work did) silently
re-ran every prior domain function too, discarding all hand-authored
content across the entire app back down to the single AI-generation
fallback each time.

- Investigated the damage: confirmed via direct DB queries that Rounds 5's
  Foundations vocabulary work (273 words) and 6c's app-wide grammar work
  had already been silently wiped by an earlier reseed *before this
  session even started* — unrecoverable, no surviving copy anywhere.
  Round 6b's Everyday Life vocabulary (400 words) was still recoverable
  from orphaned `VocabularyItem` rows (disconnected from any lesson, but
  not deleted — `VocabularyItem`/`GrammarPoint` have no cascade FK to
  `Lesson`, only the `LessonVocabulary`/`LessonGrammarPoint` join rows
  cascade away).
- First recovery attempt was itself buggy (matched orphaned content
  lesson-scoped, but by the time `createFullLesson` runs the old lesson
  row is already gone via the domain function's own upstream
  `scenario.deleteMany`/`domain.deleteMany` — so the lookup always found
  nothing) and a follow-up cleanup step deleted still-orphaned rows,
  destroying more of the little that was left. Diagnosed the real bug
  before doing more damage.
- **Real fix**: `createFullLesson` now recovers by exact-text match
  against two module-level pools (`vocabExamplePool`/`grammarContentPool`
  in `prisma/seed.ts`) snapshotted *once*, by `loadContentRecoveryPools()`
  at the very start of `main()`, before any deletion happens anywhere in
  the run — not scoped to the individual lesson being recreated, since
  that lesson (and its old vocab/grammar links) is already gone by the
  time `createFullLesson` runs. Grammar-linked practice `Exercise` rows
  (which cascade-delete via `Exercise.lessonId` when the old lesson goes,
  even though the `GrammarPoint` itself survives orphaned) are recovered
  separately from the same pool and recreated against the new
  lesson/grammarPoint ids.
- Verified the fix is durable: ran `npx prisma db seed` three times in a
  row and confirmed Advanced Situations' 400/400 vocabulary words and
  120/120 grammar points stayed fully intact across all three runs (a
  couple of duplicate-content edge cases needed one manual top-up after
  the first proof run, then held steady).
- Re-authored Advanced Situations' full grammar exercise set (240
  exercises, 2 per point × 120 points) from the exact content generated
  earlier in the same conversation, since those were the one thing lost
  in the incident that wasn't reconstructable from the DB alone
  (`Exercise` cascades on `Lesson`, `GrammarExample` doesn't).
- **What's still unrecovered and would need re-authoring from scratch if
  wanted**: Foundations vocabulary (273 words), and grammar practice
  exercises for every domain *except* Advanced Situations (Foundations,
  Daily Life, Travel, Getting Around, Making Friends, Health, Work &
  Office, Everyday Life — grammar *examples* did recover via the pool,
  but their exercises didn't survive the cascade). Not attempted this
  round — scope decision for the user, not made unilaterally.

**Round 6g — closed out every remaining gap from Round 6f, then fixed a
second recovery-pool bug the new content exposed (2026-08-12):** user
asked to finish the full remaining scope in-session rather than via a
handoff prompt to a future chat.

- Hand-authored Foundations' full vocabulary (560 words × 3 examples,
  BEGINNER tier) and full grammar set (168 points × 2 extra examples + 2
  exercises), closing the last BEGINNER-tier gap from Round 6f.
- Hand-authored Everyday Life's remaining vocabulary (59 words that were
  never generated even once, 0 examples) and its full grammar exercise set
  (120 points × 2 exercises — examples had already recovered via the
  pool in 6f, only exercises were missing).
- Discovered mid-round that six domains (Daily Life, Travel, Getting
  Around, Making Friends, Health, Work & Office — 232 vocab words, 72
  grammar points across 28 lessons total) had never been hand-authored at
  all, not even the originally-seeded single example; content was AI-only.
  Hand-authored all of it: vocab at 6 examples/word (INTERMEDIATE tier,
  matching these domains' HSK2–4 reference level), grammar at 2 extra
  examples + 2 exercises/point.
- **Found and fixed the actual root cause of Round 6f's edge cases**: the
  recovery pools in `prisma/seed.ts` were keyed only by content text
  (`chineseForm|pinyin|meaning` for vocab, just `name` for grammar) with
  no lesson scoping. Words/grammar points that legitimately repeat by name
  across different lessons or domains (一共, 麻烦, 过敏, 如果...就...,
  虽然...但是..., etc. — common function words and patterns reused
  everywhere) shared one FIFO queue, so a reseed could serve lesson A's
  saved content to lesson B, draining or misassigning the queue before the
  correct lesson's turn. Confirmed by re-running `npx prisma db seed`
  after finishing this round's content: it silently wiped 83 grammar
  points' exercises in Everyday Life, 11 in Advanced Situations, and all
  vocab/grammar in Daily Life's `restaurant-entering-and-ordering` lesson
  (which turned out to use its own bespoke `seedRestaurantLesson()`
  dev-era function that never consulted the pool at all, a second,
  separate gap from the main `createFullLesson()` path).
  - Fixed by scoping both pool keys to `${lessonSlug}|...` — vocab items
    and grammar points are now looked up per-lesson via their
    `lessons`/`LessonVocabulary`/`LessonGrammarPoint` relations before
    being queued, so same-named content in different lessons no longer
    collides.
  - Wired `seedRestaurantLesson()`'s vocab/grammar creation into the same
    pool (it previously created rows directly with no recovery logic at
    all, unlike every other lesson-creation path in the file).
- Re-authored the content that the pre-fix reseed had wiped, then verified
  the fix holds: ran `npx prisma db seed` two more times after the pool-key
  fix and confirmed zero content loss both times (previously, one reseed
  was enough to cause the regression above).
- Final state, confirmed via direct DB query across all 9 domains: 0
  missing vocabulary examples and 0 missing grammar examples/exercises
  everywhere. `tsc --noEmit` and `eslint .` both clean.

Verification: `npx tsc --noEmit`, `npx eslint .` clean. Confirmed via
direct DB query (not full suite re-run this round, since the fix is in
`prisma/seed.ts`, outside app runtime code).

---

## FASE 17 — Closed Beta Deployment

In progress. The goal isn't "finish code" — it's to get HanGo running in
production with real invited users, on real (not simulated) services
where it matters, with a way to know if something breaks and what it's
costing. (Merged in 2026-08-08 from the former `TASKS_CIERRE_BETA.md`,
with two stale lines corrected: OpenAI is now connected, and FASE 9 audio
is now mostly built — struck from the "be honest with beta users about
limitations" note below.)

The scoped execution plan for the first invited cohort is
[`PLAN_BETA_CERRADA_FASE_1.md`](PLAN_BETA_CERRADA_FASE_1.md). It narrows this
older deployment checklist to the minimum safe closed beta, records what now
already exists, and defines acceptance and pause criteria. Use that document
for execution order; keep this section as the high-level tracker.

### Paso 0 — Decisions that are the user's to make

Nothing below can seriously proceed without these:

- [x] **Real OpenAI key** (`OPENAI_API_KEY`) — done, connected, working.
- [ ] **Configure the real email provider.** The Resend adapter, production
      fail-closed behavior and verification requirement already exist. Pending:
      verify the beta sending domain, load credentials outside Git and test
      delivery, failure and safe resend.
- [x] **Where to host the app.** Vercel was selected for the closed beta;
      creation and domain verification remain in P1-03.
- [x] **Where to host the Postgres database.** Prisma Postgres was selected as
      an isolated beta database; provisioning and backup drill remain in P1-03.
- [ ] **Error monitoring tool** (e.g. Sentry) — free tier is plenty for a
      closed beta.
- [ ] **Product analytics tool** (optional for initial launch, but
      recommended from day 1 to evaluate the beta with real data — see
      Fase 4 below).

### Fase 1 — Connect real services

- [ ] Load `OPENAI_API_KEY` in the production environment. Verify
      `getAiProvider()`/`getSttProvider()` actually pick OpenAI over the
      mock (logic already exists, just needs the env var).
- [ ] Configure the existing Resend integration in the beta environment and
      add the remaining safe verification-email resend flow without account
      enumeration.
- [ ] Confirm Google Sign-In still works in production
      (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` already configured in
      dev — verify the production domain is authorized in Google Cloud
      Console).
- [ ] Test the full loop (register → real email verification → login →
      onboarding → lesson → real AI Teacher → real speaking → real
      writing → real mission) against real services, not mocks.

### Fase 2 — Deploy

- [ ] Configure the chosen host (Next.js build, env vars, domain).
- [ ] Configure the production database and run Prisma migrations with the
      non-development command (`npm run db:migrate:deploy`) over `DIRECT_URL`.
- [ ] Run the content seed (`prisma/seed.ts`) against production — the 12
      real Restaurant/Hotel/Shopping lessons.
- [ ] Configure the implemented private Vercel Blob provider for Speaking Lab,
      dialogue, vocabulary and grammar audio. The adapter exists and production
      now rejects local disk. Speaking Lab's authenticated direct browser upload
      for recordings over 4.5 MB is implemented; the private store/token and its
      real-domain persistence, interruption and A/B isolation tests remain.
- [ ] Configure the chosen error monitoring.
- [ ] Configure the chosen product analytics (if included now).
- [ ] Configure automatic database backups.

P1-03 deployment decisions, variables, exact order, verification gate and
rollback are documented in
[`beta-p1-03-despliegue-runbook.md`](beta-p1-03-despliegue-runbook.md).

### Fase 3 — Beta access

- [x] Use an administrator-managed email allowlist with cohort, expiration,
      activation and revocation, enforced for credentials and Google OAuth.
- [ ] Prepare a welcome message explaining the product's real limitations
      right now: content in Chinese without a human linguistic review yet
      (FASE 15.5 pending) — be honest with early users about what a beta
      is.
- [ ] Define a feedback channel (form? email? Discord?).

### Fase 4 — Monitor and evaluate

With real users in, watch:

- [x] Add a privacy-minimized internal operations baseline: centralized
      server/client exception signals, service health, cron/email heartbeats,
      deletion-outbox alerts, AI budget/provider signals and a documented
      incident/rollback procedure. Admin: `/admin/operations`; public status:
      `/api/health`; runbook:
      [`beta-p1-07-observabilidad-runbook.md`](beta-p1-07-observabilidad-runbook.md).
      Implemented and migrated 2026-09-27. External notification still belongs
      to the real hosting/monitoring setup below.

- [x] Protect paid AI calls with an application-wide daily budget, atomic
      authorizations, per-family TEXT/STT/TTS/Realtime kill switches and the
      existing per-user/per-feature limits. Admin control lives at
      `/admin/limits`; the initial editable application limit is USD 5/day.
- [ ] Configure a separate low budget/alert in the AI provider account before
      inviting the cohort; the application control is not a substitute for the
      provider-side ceiling.
- [ ] Registrations and onboarding completion.
- [ ] Real lesson progress (where do people drop off?).
- [ ] AI Teacher / Speaking / Writing / Missions usage.
- [ ] Day-1 and day-7 retention.
- [ ] Real AI cost per active user (`AiUsageLog` already tracks this in
      the database — build a simple report off that table).
- [x] Provider failures (AI, STT, email) have internal normalized signals;
      external delivery/alert routing remains part of production setup.

At the end of this phase: decide whether HanGo is ready for a wider
launch, or what needs fixing first.

### Not part of this plan

- Content changes beyond what's already seeded — out of the MVP defined
  in `docs/05_development/mvp.md`.
- New visual design direction — the redesign is closed. Responsive corrections
  required for the mobile-web beta are in scope and tracked in
  `PLAN_BETA_CERRADA_FASE_1.md`; a new aesthetic redesign is not.

---

## Other known gaps (carried from the archive, still real)

- [ ] **15.5** — Human linguistic review pass over the seeded Chinese
  content (12 lessons). Never done; content is AI-authored and unreviewed
  by a fluent human.
- [ ] **16.3/16.4** — Real device/browser testing (only automated
  tests + manual dev-server checks so far).
- [ ] **16.7** — Internal monitoring/error tracking is implemented; production
  hosting must still connect the external notification destination and verify
  it with an incident drill (also tracked in FASE 17 Paso 0 above).

---

## Han Improvement Initiative (started 2026-08-15)

Triggered by real usage feedback (user, first Learning Journey session):
Han went on a Spanish-grammar tangent after mishearing the word "ai",
struggled with spoken Mandarin recognition, and once displayed garbled
Thai text as the "translation" of a Spanish utterance. Investigation
found 3 of these are one root cause (STT language handling), plus two
separate architecture gaps (fragmented prompts, no true-beginner level).

**Root causes:**
- STT (`gpt-4o-mini-transcribe` realtime / `gpt-4o-transcribe` text-chat
  mic) runs `language: "auto"` with no bias toward the app's 3 supported
  languages (es/en/zh) **except** on the role-play Speaking-step path,
  which already pins `language: "zh"` (`app/api/han/realtime/route.ts:104-110`,
  fixed for a prior Korean-mis-detection bug). Short/ambiguous input
  ("ai") and spoken Mandarin outside role-play have no such pin —
  explains the Spanish tangent, the weak Mandarin recognition, and the
  Thai garble.
- What the user perceived as a "translation of what you said" is not a
  translation at all — it's the raw STT transcript shown verbatim, with
  no label of any kind (`han-voice-conversation.tsx:153-161`,
  `ai-teacher-chat.tsx:136-146`). Checked for a literal "Translation:" UI
  string to fix — none exists; it was the user's own read of an unlabeled
  transcript bubble, not a mislabeling bug. Nothing to fix here beyond
  the STT accuracy itself.
- 7 separate prompt-builder functions (`ai-context.ts`, `han-realtime.ts`,
  `mission-prompt.ts`, `writing-feedback.ts`, `reflection-prompt.ts`,
  `han-speech.ts`) with no shared base — "stay strictly on topic" only
  exists in the text-chat prompt (`ai-context.ts:178`), missing from the
  realtime and mission prompts.
- `LearnerProfile.currentLevel` (`ChineseLevel` enum) bottoms out at
  `HSK_3` — no tier below it, even though Foundations added a real
  `BEGINNER` `ScenarioDifficulty` tier (2026-08-09). A learner who just
  started has no way to self-report as an absolute beginner, and the
  `UNSURE` enum value leaks into the prompt as a literal string
  (`"- Learner's Chinese level: UNSURE"`) instead of degrading gracefully
  like the null case does (`ai-context.ts:125`).

### Claude — implementing directly (prompts/UI/schema, not the voice pipeline)
- [x] Remove the "Review" chat mode tab (`ai-teacher-chat.tsx` MODES,
  `MODE_INSTRUCTIONS.REVIEW` in `ai-context.ts`, `AiTeacherModeDefault`
  enum + `defaultAiModeSchema` + settings select). Re-pointed
  `review-queue-list.tsx`'s `AI_PRACTICE` entry (previously
  `setMode("REVIEW")`) to `PRACTICE` — closer semantic fit for "get a
  fresh practice question" than `TUTOR`. Dashboard/Progress "Review
  Recommendations" section stays — user confirmed only the chat mode tab
  is superfluous, not the review queue.
- [x] Added a shared `OFF_TOPIC_GUARDRAIL` constant (`ai-context.ts`) and
  wired it into `buildSystemPrompt` and `buildRealtimeSystemPrompt`
  (replaces/strengthens the text-chat-only version); reinforced
  `buildMissionSystemPrompt`'s existing scenario-boundary line with the
  same "garbled input ≠ real question" logic. `writing-feedback.ts` /
  `reflection-prompt.ts` / `han-speech.ts` are structured/graded outputs,
  not open conversation — left alone this pass, lower risk of the same
  failure mode.
- [x] Added `HSK_1_2` to `ChineseLevel` (additive migration
  `add_hsk_1_2_level`) + onboarding `level-step.tsx` option + validation
  schema + `progress-data.ts`/`recommendation.ts` label maps.
- [x] Fixed `UNSURE` leak: new `describeLearnerLevel()` helper in
  `ai-context.ts` degrades `UNSURE` the same as null
  ("beginner (unknown, assume beginner)"), used by both prompt builders.
  Added a zero-`ProgressEvidence` clause to both prompts: ignore
  self-reported level and default to simplest Chinese until real graded
  evidence exists.
- Checked for a "translation" mislabel to fix — none exists (see note
  above); nothing to do here.
- [x] **Onboarding recommendation is stale.** ~~`computeInitialRecommendation()`
  (`recommendation.ts`) always recommends "Restaurant" regardless of level~~
  **Reconciled 2026-09-16 (BASE-02), verified in code:** `recommendation.ts`
  now exports `computeRecommendation` with a real `HSK_1_2` tier mapped to
  level 1 and locale-aware output; `tests/integration/recommendation.test.ts`
  confirms an `HSK_1_2` learner is routed to `getting-started`/Foundations,
  not Restaurant. Superseded by later work, not still open.
- [ ] **Surface the adaptive level to the learner, not just to Han.**
  Right now `demonstratedBand`/`recentAccuracy`/`strengths`/`focusAreas`
  (`ai-learner-adaptation.ts`) only ever reach the AI prompt — the learner
  has no visibility into what Han thinks their level is or why, so a
  misjudgment (e.g. too-hard examples) is invisible until it happens again.
  Add a small, honest indicator somewhere visible (Settings or Progress) —
  something like "Han currently treats you as: {band}, based on {N} graded
  activities across {sources}" — reusing `getCompetencyProgress()`
  (`progress-data.ts`), which already computes all of this server-side.

### OpenAI — spec only (voice/realtime pipeline; Claude does not implement)
- [x] Bias/hint STT toward es/en/zh instead of unconstrained global
  `language: "auto"`, on **every** voice/mic path, not just the role-play
  Speaking step (which already has the fix pattern to copy from,
  `app/api/han/realtime/route.ts:104-110`).
- [x] Improve spoken-Mandarin transcription accuracy specifically outside
  role-play (currently only the role-play path gets the `"zh"` + Mandarin
  prompt hint).
- [x] Add a confidence/fallback path: on low-confidence or
  implausible-language transcription, ask the learner to repeat instead
  of displaying garbled output as if it were valid (would have caught the
  Thai-text incident).
- [x] Regression check once fixed: re-test the 3 reported failures — the
  bare word "ai", a full Spanish sentence, and a spoken Chinese phrase —
  outside role-play mode.
  - 2026-08-15: shared es/en/zh + Mandarin prompts cover Realtime, chat mic,
    and Speaking Lab; REST logprobs and Latin/Han script checks request a
    repeat on unreliable output. Live API regression passed all three cases.
- [x] Ignore weak/too-short Realtime turns before showing or sending their
  transcript. Client-side duration + foreground-signal guard sits behind
  server VAD and fails open when Web Audio measurement is unavailable.
  - 2026-08-15 follow-up: also reject steady-noise signal shapes and require
    stronger evidence for short Hanzi-only results such as 你好; VAD threshold
    raised to 0.84 and fixed beginner-word STT examples removed to avoid
    hallucinating expected vocabulary from background noise.
- [x] Make pronunciation progression deterministic: accept at the 80%
  recognition threshold and move on; otherwise allow one retry, then force
  the conversation to continue after the second attempt.
- [x] Make Mandarin the unambiguous default translation target in text and
  Realtime prompts; the explanation language no longer changes the target.
  Exact "¿cómo digo el amor es bonito?" live-API regression returned 爱情很美.
- [x] Persist an explicitly requested HSK practice level within the current
  Han conversation (text + Realtime). The session preference overrides a
  lower difficulty baseline without changing evidence-based permanent
  progress; HSK 5+ no longer falls back to greetings/self-introductions
  after a short acknowledgement such as "go ahead".
- [x] Make Practice usage questions a compact guided exercise: context,
  simple usage pattern, two level-appropriate examples, one accurate China
  or native-usage note, and one learner turn. Ordinary Practice turns remain
  short and conversational.
- [x] Give Tutor the corresponding teaching depth for requested Mandarin
  vocabulary/grammar: meaning and context, simple usage, two natural examples,
  and one accurate China/native-usage note before any testing. Spoken requests
  such as `practicar la palabra mai` now resolve as Mandarin (`买/卖`) and can
  no longer collapse into pronunciation-only repetition.
- [x] Anchor explicit Hanzi study targets across text and Realtime. A mixed
  Spanish/Mandarin request such as `Quiero practicar el uso del吧` preserves
  `吧` as the Mandarin particle and can no longer reinterpret it as Spanish
  `va` or generate an unrelated Spanish practice sentence.
- [x] Extend the same Mandarin-first guard to Latin pinyin in Tutor and
  Practice. `Quiero practicar el uso del ba` now resolves from recent context
  or asks whether the learner means `把 (bǎ)` or `吧 (ba)`; even an STT `va`
  can no longer route Han into Spanish grammar.
- [x] Rebalance live turn detection after real-user soft-voice/early-cutoff
  reports: lower server-VAD activation from 0.84 to 0.68, preserve 500 ms of
  speech onset, and wait 1.6 s of silence before ending a turn. The local
  room-floor estimator now rises slowly so it cannot learn the beginning of
  the learner's voice as noise; existing noise/transcript guards remain.

---

## Points & Leveling System Implementation (started 2026-08-15)

Full design in [`docs/02_academy/points_system.md`](../docs/02_academy/points_system.md) —
read that first, this is the build-out plan. Two-tier scoring: per-lesson
Reflection score (0-100) and a General Level score (0-2000, mapped to HSK
1-9), organized around the 3 Learning Journey chapters (not the 9 backend
Domain rows).

**Grounded against the real current implementation** (`reflection.ts`,
`LessonReflectionReport`) before writing this — found 3 real gaps that
affect the plan, called out inline below rather than assumed away.

### Phase A — Data model ✅ Complete (2026-08-16)
- [x] Added `LearnerProfile.generalLevelPoints Float @default(0)`.
- [x] Added `ScenarioCompletion` model: `userId`, `scenarioId`,
  `earnedPoints`, `weightedReflectionAverage`, `completedAt`, `updatedAt`,
  `@@unique([userId, scenarioId])`. Redo **upserts** this row (replaces,
  does not stack) — this is what makes "redo replaces" from the design doc
  actually enforceable. Back-relations added on `User` and `Scenario`.
- [x] **Decided (2026-08-15): real quiz accuracy, not coverage.** Added
  `VocabularyQuizAttempt` (mirrors `ExerciseAttempt`'s shape: `userId`,
  `vocabularyItemId`, `lessonId` (denormalized to avoid a join at scoring
  time), `questionKey` (matches the UI's own `${itemId}:${field}` question
  identity), `isCorrect`, `createdAt`). Back-relations added on `User`,
  `VocabularyItem`, `Lesson`. Point value per question is **not** a single
  fixed number — it depends on the lesson's word count and its
  `ScenarioDifficulty` (Beginner=4 questions/word, Intermediate/Upper
  Intermediate=5, Advanced=6). Formula:
  `20 ÷ (lesson_word_count × questions_per_word_for_that_difficulty)`.
  Real combinations verified against the DB: Foundations (10×4) = 0.50
  pts/question; Daily Life/Travel (6×5) = 0.667; Getting
  Around/Everyday Life/Making Friends (10×5) = 0.40; Health/Work &
  Office/Advanced Situations (10×6) = 0.333.
  **Not yet done** (carries into Phase B): wiring the Vocabulary Step's
  quiz checks (`vocabulary-quiz.ts`, `VocabularyQuizCheck`) to actually
  persist each answer server-side — the table exists, nothing writes to it
  yet.
- [x] Migration `20260816014721_points_leveling_system_phase_a` applied
  (additive — new table + new nullable/defaulted columns only, no existing
  rows touched). `tsc --noEmit` clean, 286/287 unit tests pass (the 1
  failure is a pre-existing test-isolation flake in an unrelated env-var
  test, unaffected by this change — passes in isolation).

### Phase B — Reflection score reweighting (0-100 → 20/20/30/30) ✅ Complete (2026-08-16)
- [x] Added `vocabularyScore`/`totalScore` to `LessonReflectionReport`
  (migration `20260816020531_reflection_points_scoring`). `totalScore`
  computed by `computeReflectionTotal()` in the new `src/lib/points-system.ts`:
  a missing sub-score contributes 0, not "excluded from the average" — an
  ungraded dimension can't quietly inflate the other three. Wired the
  Vocabulary Step's quiz checks (carried over from Phase A) end to end:
  `QuizOptionList` → `VocabularyQuizCheck`/`VocabularyFillBlankCheck` →
  `handleAnswer` now all thread `isCorrect`, firing
  `recordVocabularyQuizAttemptAction` per answer. New
  `computeVocabularyScore()` in `reflection.ts` scores against
  `vocabularyQuestionsPerWord(difficulty)` from `points-system.ts` (the
  formula table from Phase A), same "first attempt, unanswered = not
  correct" convention as `computeExerciseScore`. Grammar (3.33 or 5
  pts/question) and Comprehension (6 pts/question, always 5
  exercises/lesson) needed no new code — `computeReflectionTotal()` just
  multiplies their existing 0-100 `computeExerciseScore()` output by the
  20/30 weight, which is mathematically identical to the fixed per-question
  values in the design doc.
- [x] **Decided (2026-08-15): Speaking is multiplicative, not an average.**
  Implemented in `points-system.ts`'s `computeSpeakingConversationScore()`.
  Found a real nuance while implementing: `buildSpeakingConversationFeedbackPrompt`
  previously set `pronunciation` to a sentinel 0 ("NOT MEASURED, transcript
  has no audio") by design — the same caution Speaking Lab's own
  `pronunciation` field lacks (it's *also* an AI guess from a transcript,
  not phonetic analysis; the real audio-derived signal in the app is
  `tone-analysis.ts`'s `toneScore`, not wired into Reflection or Speaking
  Lab's rubric here). Proceeded with the agreed 5-metric average anyway for
  consistency between the two Speaking scores, but flagged
  `toneScore` as a stronger future signal worth revisiting (comment left in
  `reflection-prompt.ts`). Added `vocabularyUsageRatio`/
  `objectiveCompletionRatio` (0-1) to a new `SpeakingConversationFeedback`
  type (extends `SpeakingFeedback`, kept separate rather than added to the
  shared type - these two ratios don't apply to every Speaking Lab activity,
  e.g. single-word Pronunciation practice has no "objective").
- [x] Updated the Reflection screen UI (`reflection-step.tsx`): shows
  `totalScore`/100 with a `REFLECTION_PASS_SCORE` (70) pass bar, replacing
  the old ad-hoc client-side average; Vocabulary card now shows real quiz
  accuracy as the primary number (coverage count kept as a caption);
  Speaking's dimension grid now includes Pronunciation, Vocabulary used,
  and Objective completed (all real data now, not sentinels); removed the
  stale "pronunciation not scored" copy.
- [x] `tsc --noEmit` clean, 289/289 unit tests pass (2 pre-existing
  reflection-prompt assertions updated to match the new prompt copy), 35/35
  component tests pass (run separately — combined with unit tests in one
  invocation, the vitest fork pool hit worker-timeout flakiness unrelated
  to this change).

### Phase C — Scenario completion screen ✅ Complete (2026-08-16)
- [x] New section on the existing scenario detail page
  (`app/(app)/learning-journey/[slug]/page.tsx`), shown once every lesson
  has a Reflection score (`scenario.status === "COMPLETED"`): each lesson's
  score, points earned toward the General Level, and a "Redo this
  scenario" action behind a confirmation modal.
  `ScenarioCompletionSummary` (new component) lazily fetches/generates the
  summary via `getScenarioCompletionAction`, same pattern as
  `ReflectionStep`.
- [x] Redo flow (`redoScenarioAction` → `redoScenario()` in the new
  `src/lib/scenario-completion.ts`): deletes the scenario's
  `LearnerLessonCompletion`, `LearnerLessonProgress`, and
  `LessonReflectionReport` rows, **and** the underlying
  `ExerciseAttempt`/`VocabularyQuizAttempt`/`QuizAttempt` rows — leaving old
  attempts in place would have let the "first attempt" scoring convention
  keep grading against the original try even after an explicit redo. The
  `ScenarioCompletion` row is deleted outright (not marked stale) — a
  scenario being redone stops contributing to the General Level until it's
  completed again, not before.
- [x] Folded Phase D's core formula work in here rather than splitting it
  across two phases that turned out to be tightly coupled — the completion
  screen can't show real numbers without the HSK-weighted formula existing.
  Added to `points-system.ts`: `CHAPTER_BUDGET`, `computeScenarioPointsBudget()`,
  `computeLessonPointsWithinScenario()`, `computeWeightedReflectionAverage()`
  (weights each lesson's Reflection score by its own HSK weight, mirroring
  how points were allocated to it in the first place),
  `computeScenarioEarnedPoints()`. Chapter resolution reuses
  `resolveJourneyChapter()` from `learning-journey.ts` directly rather than
  a parallel enum, so a scenario's chapter (and budget) can never disagree
  with what the Learning Journey screen shows it under.
- [x] `LearnerProfile.generalLevelPoints` recomputed as the **sum of all
  `ScenarioCompletion.earnedPoints`** (derived, not incremented) inside both
  `getOrGenerateScenarioCompletion()` and `redoScenario()` — a redo's
  removal and a later re-completion's addition are both always reflected
  correctly with no separate reconciliation step.
- [x] `tsc --noEmit` and `eslint` clean on all new/changed files, 289/289
  unit tests pass, dev server boots and serves `/learning-journey` and a
  scenario detail page without runtime errors.

### Phase D — General Level computation
Folded into Phase C above (see note there) — nothing left here except what
Phase C already covers. Kept as a heading for traceability with the
original plan; remove once this file gets its next cleanup pass.

### Phase E — Lab points (final 500, 1500→2000) ✅ Complete (2026-08-16)
- [x] **Decided (2026-08-15)**: budget split is Speaking Lab 200 / Writing
  Lab 150 / Reading Lab 150 (planned, not built). Formula per skill:
  `skill_budget × factor_dominio × factor_volumen × factor_tiempo × factor_consistencia`
  — full definition, constants, and a worked example are in
  `points_system.md` Part 3. Listening does **not** get a slice of these
  500 — it stays covered by the existing `LISTENING` competency; any future
  dedicated Listening Lab adds points beyond 2000, never by re-splitting
  this budget.
- [x] Implemented all four factors in `points-system.ts`:
  `computeLabFactorDominio()`, `computeLabFactorVolumen()`,
  `computeLabFactorTiempo()` (new `weekKey()` ISO-week bucketing helper —
  the anti-farming lever: same volume compressed into one week scores far
  lower than spread across a season), `computeLabFactorConsistencia()`
  (stdev-based, new). `dedupeLabEvidence()` keeps only the most recent
  point per distinct task/session id, so resubmitting the same prompt
  doesn't inflate `factor_volumen`.
- [x] New `src/lib/lab-points.ts`: queries `WritingAttempt` (feedback →
  0-100 average of its 4 dimensions) and `SpeakingSession`/`SpeakingAttempt`
  (feedback → 0-100 average of its 5) as the evidence source, per
  `computeLabSkillPoints()` in `points-system.ts`. **Found a real gap while
  implementing**: Custom Writing (`submitCustomWriting()`) grades in-memory
  and persists nothing — no `WritingTask`/`WritingAttempt` row at all — so
  it cannot contribute evidence today. Documented in `points_system.md` as
  a follow-up decision (needs a schema change), not silently ignored.
- [x] New `src/lib/general-level.ts`: extracted `recomputeGeneralLevelPoints()`
  out of `scenario-completion.ts` into one shared place —
  `generalLevelPoints = Σ ScenarioCompletion.earnedPoints + live Lab points`,
  always derived fresh, never incremented. Called from
  `scenario-completion.ts` (unchanged), plus two new call sites:
  `writing-data.ts`'s `submitWritingAttempt()` and `speaking-data.ts`'s
  `completeSpeakingSession()` — so Lab activity updates the General Level
  immediately, not just on scenario completion.
- [x] Progress tab now shows `X / 1850` (not 2000) with an explicit note
  that the cap is 1850 until Reading Lab exists — `CURRENT_MAX_GENERAL_LEVEL_POINTS`
  in `points-system.ts`, no hardcoded "2000" left in the UI.
- [x] Added 19 new tests to `points-system.test.ts` (51 total in that file)
  covering every factor individually, `dedupeLabEvidence`, `weekKey`, and
  `computeLabSkillPoints` end-to-end (including a case proving a couple of
  perfect practices score 0 — thresholds must be met, not just quality).
  `tsc --noEmit`/`eslint` clean, 342/342 unit tests pass, dev server boots
  and serves `/progress` without errors.

**All 8 phases (A-H) of the Points & Leveling System are now complete.**

### Phase F — Progress tab ✅ Complete (2026-08-16)
- [x] Show General Level `X/2000` + HSK equivalent. Added
  `hskLevelForPoints()` to `points-system.ts` (the points→HSK table from
  `points_system.md` Part 2) and `getGeneralLevelSummary()` to
  `progress-data.ts` — reads the cached `LearnerProfile.generalLevelPoints`
  directly (cheap; Phase C already keeps it derived/correct), no
  aggregation needed for the headline number.
- [x] Show Learning Journey weighted average — plain average of
  `ScenarioCompletion.weightedReflectionAverage` across every completed
  scenario, shown as a secondary line under the General Level card. Kept
  distinct from the General Level itself: this answers "how am I doing,"
  the points number answers "how far have I gotten."
- [x] Per-skill 0-100 scores were already shown via the existing
  `CompetencyList` (`getCompetencyProgress()`) — confirmed no changes
  needed there.
- [x] Added `tests/unit/points-system.test.ts` (32 tests) covering every
  formula added across Phases B/C/F, including the design doc's own worked
  examples (Speaking's multiplicative gating, the 78.5% scenario example,
  the full HSK point-threshold table). `tsc --noEmit`/`eslint` clean,
  321/321 unit tests pass, dev server boots and serves `/progress` without
  errors.

### Phase G — Han integration ✅ Complete (2026-08-16)
- [x] Added `generalLevelPoints` to `LearnerAiContext` and a new
  `resolveEffectiveLevel()` in `ai-context.ts`: when the learner has any
  earned General Level points (> 0), its `hskLevelForPoints()` equivalent
  replaces the self-reported level entirely in the prompt (not just "when
  they disagree" — there's no clean way to detect disagreement between an
  enum and a continuous score, and real evidence should win outright once
  it exists). Below that, behavior is unchanged: self-reported level, then
  the null/`UNSURE` fallback. Wired into both `buildSystemPrompt` and
  `buildRealtimeSystemPrompt`. Left the separate zero-`ProgressEvidence`
  "simplest Chinese" clause alone — different evidence source (competency
  evidence can exist before a scenario is fully completed), stays
  independent per the design doc.
- [x] Both call sites that build `LearnerAiContext` from the database now
  fetch `generalLevelPoints`: `ai-teacher-data.ts` (text chat) and
  `app/api/han/realtime/route.ts` (voice).
- [x] Added 2 tests to `ai-context.test.ts` covering the precedence
  (earned points win when present; self-reported level shows when points
  are 0) and 32 tests in the new `points-system.test.ts`. `tsc --noEmit`/
  `eslint` clean, 323/323 unit tests pass, dev server boots without errors.

### Phase H — Reconcile existing docs ✅ Complete (2026-08-16)
- [x] `hsk_mapping.md` (bumped to v1.1): removed the outdated "Beginner
  stage may be incorporated in future versions" line, rewrote "HanGo
  Progression" to cover the full HSK 1-9 range and name the 3 learner-facing
  chapters, added the missing "HSK 1-2" section to Curriculum Mapping
  (Foundations' scenarios), updated "AI Teacher Responsibilities" to
  reference the General Level's precedence rule, added a cross-reference to
  `points_system.md` at the top for the exact points↔HSK thresholds.
- [x] `curriculum_structure.md` (bumped to v1.1): added the missing
  Beginner tier to the Level section, replaced the generic Domain examples
  ("Personal Life," "Society," "Professional," "Academic" — none of which
  exist) with the real 9 domains and the 3-chapter table showing which
  domains sit behind each chapter, replaced the fictional Example
  Curriculum Path (a "Culture" domain debating "Cultural Globalization")
  with a real path through actual content (Foundations → Daily Life →
  Advanced Situations, real scenario/lesson names throughout).

**Build order actually followed**: A → B → C (absorbed D) → F → G → H → E,
all ✅ complete as of 2026-08-16.

## Post-launch fixes (2026-08-15 round)

Four issues reported after the first real run through Foundations →
Greetings and Introductions, on top of the completed Points & Leveling
System above.

### 1. Grammar step let learners retry after answering ✅ Complete
- [x] `grammar-step.tsx`'s `ExerciseSequence` was missing
  `feedbackMode="assessment"` (the prop `comprehension-step.tsx` already
  passed) — defaulted to `"learning"`, which shows exercise-item.tsx's
  "Try again" button on a wrong answer. Scoring was never actually
  affected (`computeExerciseScore()` always grades the first attempt
  regardless), but the retry button visually implied otherwise. One-line
  fix: added the prop.

### 2. Finishing a lesson still let the learner freely redo it ✅ Complete
- [x] `redoScenario()` in `scenario-completion.ts` refactored: the
  DB-table-clearing transaction is now a shared `resetLessonsData()`
  helper, reused by a new `redoLesson(userId, lessonId)` that resets just
  one lesson (and deletes the parent scenario's `ScenarioCompletion` row
  too, if one existed — a scenario with a reset lesson is no longer truly
  complete).
- [x] New `redoLessonAction()` in `actions/scenario-completion.ts`.
- [x] New `isLessonCompleted()` in `lesson-progress-data.ts`.
- [x] `app/(app)/lesson/[slug]/page.tsx` now branches: if
  `LearnerLessonCompletion` exists, renders the new
  `components/lesson/lesson-results-view.tsx` (reuses the `ReflectionReport`
  card, now exported from `reflection-step.tsx`, plus a "Try again" button
  behind a confirm modal — same UX pattern as
  `ScenarioCompletionSummary`'s "Redo this scenario") instead of the normal
  step-by-step `LessonEngine`.
- [x] `tsc --noEmit`/`eslint` clean, 350/350 unit tests pass, dev server
  restarted and verified (`/dashboard` → 200, no runtime errors in logs).

### 3. Completing a lesson didn't show a score on the Learning Journey ✅ Complete
- [x] Turned out to be the scenario detail page's `LessonPath` (not the
  top-level chapter overview, which only shows scenario-level nodes with no
  per-lesson concept) — that's the screen the report was actually about
  ("Getting Started" scenario, "Greetings and Introductions" lesson node).
  `getScenarioDetailWithProgress()` already queried
  `LessonReflectionReport.totalScore` per lesson (used by
  `ScenarioCompletionSummary`) but `lesson-path.tsx` never rendered it.
- [x] Added `reflectionTotalScore: number | null` to `LessonPathItem`; a
  completed node now shows a small `82/100` pill under the title (jade if
  ≥`REFLECTION_PASS_SCORE`, warning-colored below it).
- [x] `tsc --noEmit`/`eslint` clean, 350/350 unit tests pass. Verified live
  in the dev server log: the user was actively browsing
  `/learning-journey/getting-started` and re-visiting the completed
  Greetings and Introductions lesson while this shipped — all 200s, no
  runtime errors, and the completed-lesson requests now serve
  `LessonResultsView` (item 2 above) instead of the old always-editable
  engine.

### 4. Custom Writing doesn't persist, can't earn Lab points ✅ Complete
- [x] Migration `20260816030000_custom_writing_persist`: `WritingAttempt.taskId`
  made optional, new `customPrompt Json?` field (holds the
  `CustomWritingCharacteristics` graded against when there's no `WritingTask`
  row). `task` relation made optional to match.
- [x] `submitCustomWriting()` in `writing-data.ts` now creates a
  `WritingAttempt` (`taskId: null`) with the graded feedback, persisting even
  on an AI-provider failure (falls back to `DEFAULT_WRITING_FEEDBACK`) — same
  behavior as `submitWritingAttempt()`. Added a topic-required validation
  that didn't exist before (defense-in-depth for the now-persisted row).
  Calls `recomputeGeneralLevelPoints()` afterward.
- [x] `submitWritingAttempt()` now guards against a null `taskId` explicitly
  (throws - that function is only ever for the fixed-task flow; Custom
  Writing has its own path) instead of relying on a type assertion.
- [x] `lab-points.ts`'s `getWritingEvidence()` no longer excludes Custom
  Writing - dedupes by `taskId ?? id`, so every Custom Writing submission
  counts as its own distinct attempt (unlike resubmitting the same fixed
  `WritingTask`, which intentionally doesn't inflate `factor_volumen`).
- [x] Fixed a null-relation crash this surfaced in `writing-lab/page.tsx`
  (`attempt.task.title` on the Recent Attempts list) - falls back to the
  custom prompt's topic, then "Custom writing".
- [x] `points_system.md`'s "Custom Writing isn't counted yet" note (from
  Phase E) rewritten to reflect the closed gap.
- [x] **Found and fixed a pre-existing, unrelated bug while adding
  integration test coverage**: `tests/integration/writing-lab.test.ts` and
  `speaking-lab.test.ts` never created a `LearnerProfile` row for their test
  users, unlike every other integration test file that touches points. This
  was silently broken since Phase E added `recomputeGeneralLevelPoints()`
  calls to `submitWritingAttempt()`/`completeSpeakingSession()` - it just
  never surfaced because the established verification ritual only ever ran
  `tests/unit`, never `tests/integration`, after that phase shipped. Fixed
  both files' `createTestUser()` helpers to match the working pattern
  (`ai-teacher.test.ts`, `settings.test.ts`, etc.).
- [x] `tsc --noEmit`/`eslint` clean, 350/350 unit tests pass,
  `writing-lab.test.ts` + `speaking-lab.test.ts` 20/20 in isolation against
  the real database. The full `tests/integration` run is flaky under
  parallel load against the cloud DB (different files time out on different
  runs, unrelated to this change - consistent with the P1017/connection
  issues already noted elsewhere in this doc); not chased further since it's
  pre-existing infra flakiness, not a regression. Dev server restarted
  (fresh Prisma client) and verified: `/writing-lab` → 200, no runtime
  errors, real concurrent user traffic in the log throughout.

## Speaking role-play fixes (2026-08-16 round)

Five issues reported after actually finishing "Greetings and Introductions"
(Getting Started scenario) via live voice - the lesson Speaking step /
Speaking Lab role-play experience specifically. **Scope note**: this is a
different surface from Han's general tutor chat (`context.rolePlay` unset,
`buildSystemPrompt`/non-rolePlay `buildRealtimeSystemPrompt` branches),
which had its own concurrent, unrelated work in flight the same day
(`buildSessionLevelInstruction`, `detectExplicitHskSessionLevel`,
`sessionLevelOverride`) - do not conflate the two when planning follow-up
work. When `context.rolePlay` is set, the system prompt explicitly says
"this role-play identity takes precedence over the general Han tutor
persona until the session ends," so everything below only touches that
branch.

### 1. Opening turn dumped the entire lesson's content in one go
Real example: the Speaking role-play character (**not Han** - `context.rolePlay`
takes over from the general tutor persona for the duration of the scene)
opened with "你好，我叫…，我是学生，我是中国人，你呢" - greeting, name,
occupation, nationality, and a question, all in one turn, for a learner's
very first-ever Speaking session.
- [x] **Claude**: `buildRealtimeOpeningInstructions()` in `han-realtime.ts`
  rewrote the opening-turn instruction from "one very short opening, then
  ask one question" (ambiguous - a model could read "opening" as "a short
  self-introduction speech") to an explicit, example-driven constraint:
  greeting only, no name/occupation/nationality/etc. until a later turn,
  one fact at a time. Mirrored the same explicit language in
  `ai-context.ts`'s `buildRealtimeRolePlaySection()` (the realtime system
  prompt's "Live role play" section, which applies to every turn, not just
  the first).
- [x] **Confirmed in scope, not lesson-specific**: both edited functions are
  the shared prompt builders for every lesson's Speaking step *and* Speaking
  Lab - `SpeakingStep` (`speaking-step.tsx`) builds its `rolePlay` object
  fresh per lesson from that lesson's own `vocabulary`/`grammar`/
  `hskReference` props (`lessonVocabulary`/`lessonGrammar`/`lessonHskLevel`),
  so the fix took effect for all ~25 published lessons at once, not just
  Greetings and Introductions. Nothing about it was hardcoded to lesson 1.
- [x] **OpenAI**: live Realtime audio verified at HSK1/HSK3/HSK5. Final
  openings were one short prompt (`你好。`, `您好，几位？`, and one short
  contract question) and later turns introduced one manageable next thing.
  Added role-ownership/one-category instructions plus bounded per-response
  output tokens after live testing exposed front-loading and then an overly
  tight first ceiling. Captured WAVs/results: `project/test-artifacts/
  realtime-ending/`. Vocabulary fidelity remains tracked separately in item
  7 below.

### 2. Speaking-errors feedback was self-contradictory, and the conversation never said goodbye
Real example from a generated report: flagged "you introduced yourself but
did not include a greeting (你好)" and separately "you should ask for their
name: 你叫什么名字？" - both wrong once you know the role-play character's
own opening turn already contained the greeting *and* volunteered its own
name unprompted (issue 1 above). Separately: sessions always ended with an
abrupt cutoff, never an audible goodbye.
- [x] **Claude**: `buildSpeakingConversationFeedbackPrompt()` in
  `reflection-prompt.ts` - added an explicit instruction to check what the
  AI character already said earlier in the transcript before flagging a
  missing greeting/question/detail as a learner mistake; a natural reply
  doesn't restate information the other side just gave. Only flag when the
  learner genuinely had an open, unaddressed opportunity.
- [x] **Claude**: found the real mechanism behind the abrupt cutoff -
  `han-voice-conversation.tsx`'s closing-turn handler called
  `finishConversation()` (which hard-stops the audio element) on
  `response.done`, which fires once the model finishes *generating* the
  closing line, not once the streamed WebRTC audio finishes *playing*. Added
  a `CLOSING_AUDIO_GRACE_MS` (1800ms) delay before tearing down the
  connection so the goodbye has time to actually finish playing.
- [x] **Claude**: `speaking-step.tsx`'s `naturalCloseAfterMs`/`maxSessionMs`
  were a flat 65s/100s for every lesson regardless of how much content it
  actually has - for a lesson this simple, the real exchange was over in
  under a minute, leaving a long dead stretch before the timer finally
  fired (part of why it "felt like it just cut off out of nowhere"). New
  `speakingSessionTiming()` scales both windows down for lower-HSK lessons
  (HSK1: 35s/65s, HSK2: 45s/80s, HSK3-4: 55s/90s, HSK5+: unchanged 65s/100s).
- [x] **OpenAI, primary ask (2026-08-16 clarification)**: dynamic ending now
  uses a forced, silent structured `assess_conversation_completion` tool
  check before each reply and again after replies that may complete a mutual
  exchange. The model must choose `continue`/`end`; learner-assigned actions
  require direct `role=user` evidence. Live HSK1/3/5 checks ended exactly at
  objective completion (3/3, 2/2, 3/3 turns). Level-scaled timers are now
  150-300s graceful / 180-360s hard ceilings only.
- [x] **OpenAI**: removed the fixed 1800ms teardown delay. Closing now waits
  for WebRTC `output_audio_buffer.stopped`; when unavailable it measures the
  remote stream and waits for 350ms of actual silence, with an 8s last-resort
  ceiling. Live closing WAVs completed without truncation (2.2s/3.5s/4.0s),
  and playback-state unit tests cover active audio, stopped, silence, and
  fallback paths.

---

**Standalone prompt for the OpenAI session** (covers both open items above -
paste as-is):

> The Speaking role-play voice conversations in HanGo (`context.rolePlay`
> set - the lesson Speaking step and Speaking Lab, distinct from Han's
> general tutor chat where `context.rolePlay` is unset) currently end on a
> pure wall-clock timer, and that's the wrong mechanism. Today:
> `HanVoiceConversation` (`src/components/ai-teacher/han-voice-conversation.tsx`)
> takes `naturalCloseAfterMs`/`maxSessionMs` props; at `naturalCloseAfterMs`
> it sends a `response.create` with `buildRealtimeClosingInstructions()`
> (`src/lib/han-realtime.ts`) telling the character to wrap up *right now*
> regardless of whether the scene's objective has actually been reached; at
> `maxSessionMs` it force-ends the session unconditionally. Both values are
> currently set per-lesson by `speakingSessionTiming()` in
> `src/components/lesson/steps/speaking-step.tsx`, scaled by the lesson's
> HSK level (35-100s depending on level) - but even scaled, a short,
> simple exchange still finishes long before its window closes and then
> just sits idle until the timer fires, which reads as a random cutoff
> with nothing happening in between.
>
> Please design and implement a real dynamic ending: the character itself
> should recognize when the scene's objective (`rolePlay.objective`,
> passed all the way through `buildRealtimeOpeningInstructions`/
> `buildRealtimeTurnInstructions`/`buildRealtimeClosingInstructions`) has
> been reached and close naturally at that point - 20 seconds in if that's
> genuinely enough, several minutes in if the learner keeps the exchange
> going productively - instead of waiting for a fixed window. The Realtime
> API's function/tool-calling support inside an active session is the
> natural mechanism (e.g. a tool the model can invoke, such as
> `end_conversation`, once it judges the objective met and a natural
> closing line has been said), but the exact design is yours to make - you
> have access to live audio testing against the actual Realtime API, which
> is what this needs and what blocked a blind implementation here.
> `naturalCloseAfterMs`/`maxSessionMs` should remain in place afterward, but
> only as a safety-net ceiling for a conversation that runs unexpectedly
> long, not as the thing that normally decides when a scene ends.
>
> While you're in this code path, please also: (1) verify, by actually
> listening to live sessions across a few different lessons/HSK levels (not
> just one), that the character opens with a single short fact and paces
> one new thing per turn rather than front-loading its introduction - the
> instructions were recently strengthened in `buildRealtimeOpeningInstructions`
> and the "Live role play" section of `buildRealtimeSystemPrompt` in
> `src/lib/ai-context.ts`, but realtime voice models don't always follow
> pacing instructions as reliably as text models, so this needs a live-audio
> check, not just a prompt read-through; and (2) once your dynamic-ending
> mechanism replaces the current abrupt `response.done`-triggered cutoff in
> `han-voice-conversation.tsx`, re-check whether the closing line's audio
> reliably finishes playing before the connection tears down, and either
> confirm the current 1800ms `CLOSING_AUDIO_GRACE_MS` grace delay is correct
> or replace it with a precise signal from the Realtime API if one exists
> for this session type.

### 3. Speaking difficulty didn't scale with the learner's earned points
Ask: Speaking should be "acorde al nivel de puntos... como un nivel de
700/2000, y que haga la conversión si es un nivel HSK." Lesson-tied Speaking
(the lesson's own `hskReference`) was already correctly scoped - that part
was never the problem. The real gap was Speaking Lab's free-topic practice
("use my profile level"): with neither an explicit level nor a lesson HSK
set, it silently fell through to a flat "HSK 3-4" default regardless of
whether the learner had 0 points or 1800.
- [x] **Claude**: added `hskNumberForPoints()` to `points-system.ts`
  (numeric sibling of `hskLevelForPoints()`, same threshold table). Wired
  into `ai-context.ts`'s `buildRealtimeRolePlaySection()`: when a role-play
  has neither `level` nor `lessonHskLevel`, it now resolves difficulty from
  `learner.generalLevelPoints` via `describeSpeakingDifficulty()` instead of
  the flat default - and a learner with 0 points gets true HSK1 beginner
  treatment (consistent with the zero-evidence fallback used everywhere
  else), not the old HSK3-4 default.
- Not touched: the equivalent gap in the *text-chat* role-play helper
  (`buildRolePlaySection()`, used by `buildSystemPrompt()`) - lower-traffic
  surface (text fallback for role-play, not the primary voice flow), and
  out of scope for this round's live-voice reports. Worth the same fix
  later.

### 4. Reflection Speaking score (2/100) looked broken, and no way to see hit/miss counts
- [x] **Claude**: verified with the real DB row - not a bug.
  `44 × 0.2 × 0.25 ≈ 2` is exactly what `computeSpeakingConversationScore()`
  is supposed to do (points_system.md Part 1's deliberately multiplicative
  gate). The real issue was legibility: the report showed the 5 core
  metrics and the two ratios as separate numbers with nothing connecting
  them. Added `SpeakingScoreExplainer` to `reflection-step.tsx` - when
  either ratio is below 70%, an inline note now states the core-metrics
  average and both ratios together and explains that they multiply rather
  than average.
- [x] **Claude**: added the requested long-press breakdown. New
  `computeExerciseCounts()`/`computeVocabularyCounts()` in `reflection.ts`
  (siblings of the existing score functions, same first-attempt-wins
  logic, returning `{correct, total}` instead of a rounded percentage) and
  a new `getLessonScoreBreakdown()` that assembles all four categories -
  recomputed fresh from the same attempt tables on demand rather than
  persisted, since it's cheap and avoids a schema change. New
  `getLessonScoreBreakdownAction()` server action. UI: a `useLongPress()`
  hook (pointer events for touch/mouse hold, `onKeyDown` Enter/Space for
  keyboard) wired to all three `ScoreCard`s and the Speaking block; holding
  reveals correct/total for Vocabulary/Grammar/Comprehension. Speaking has
  no clean correct/incorrect count (a continuous rubric, not graded
  questions), so it surfaces the number of specific mistakes identified
  instead, read from the already-cached report rather than triggering a
  second AI call.
- [x] `tsc --noEmit`/`eslint` clean, 363/363 unit tests pass (13 new from
  the concurrent Han-chat work coexisting cleanly).

### 5. Progress showed 0/1850 after finishing the first lesson (scored 37/100)
- [x] **Claude, verified against real data**: "Getting Started" has 4
  lessons (Greetings and Introductions, Numbers/Time and Dates, Basic
  Needs, Simple Directions); only the first is done. This is correct under
  the current design, not a bug -
  `getOrGenerateScenarioCompletion()`/`ScenarioCompletion.earnedPoints`
  only exist once *every* lesson in a scenario has a
  `LessonReflectionReport` (points_system.md Part 1's "Scenario Completion
  Screen" is explicitly all-or-nothing per scenario). A single lesson's
  score never contributes to the General Level on its own today.
- [x] **Decided (2026-08-16), no code change**: asked the user whether a
  lesson's earned share should count toward the General Level as soon as
  *that lesson's* own Reflection is done, instead of waiting for the whole
  scenario. User chose to keep the current all-or-nothing-per-scenario
  behavior - avoids `redoScenario()`/`ScenarioCompletion` having to
  reconcile against points already granted per-lesson. Documented here so
  this doesn't get re-litigated as a "bug" later: `0/1850` after finishing
  only some of a scenario's lessons is correct, working as intended.
- [x] **Decision changed (2026-09-23), implemented and verified**: the user
  now wants visible progress after every finished lesson. General Level is
  still fully derived, never incremented: an unfinished scenario contributes
  a live partial value from its `LessonReflectionReport` rows, without
  creating a `ScenarioCompletion`; once the scenario is complete, that row
  replaces the partial contribution instead of being added to it. The lesson
  results screen shows the lesson's weighted share. Regression coverage uses
  the real seeded Getting Started scenario and proves both early credit and
  absence of double counting.

## Speaking role-play, second round (2026-08-16, same day)

Feedback from a second Speaking session ("Introducing Your Family", HSK1),
plus a follow-up on item 4's explainer copy.

### 4b. "Your 5 core skills averaged X" read as if the score were 5
- [x] **Claude**: `SpeakingScoreExplainer` in `reflection-step.tsx` now
  takes `finalScore` as a prop and states it explicitly first ("Your final
  score is 15/100: your 5 core skills averaged 49/100, but...49 × 60% ×
  50% ≈ 15"), instead of opening with "Your 5 core skills averaged X" with
  no restated final number - that phrasing read as if "5" were itself a
  score, colliding with the real (much lower) score shown right above the
  same card.

### 6. Character interrupted mid-sentence, and gave no room to ask a question
- [x] **Already fixed by the concurrent session**: `silence_duration_ms`
  (how long the server VAD waits for silence before deciding the learner's
  turn is over) was 900ms - too tight for a learner who pauses to think
  mid-sentence. By the time this was investigated, the concurrent Han-chat
  work had already extracted this into `src/lib/speech/realtime-vad.ts`
  (`HAN_REALTIME_VAD_CONFIG`) and raised it to 1600ms plus lowered the
  activation threshold from 0.84 to 0.68 for softer voices - not touched
  further to avoid clobbering that in-flight change.
- [x] **Claude, found the "can't ask a question" mechanism**: in
  `han-voice-conversation.tsx`, `context.rolePlay` conversations disable
  the learner's microphone entirely (`track.enabled = false`) for the
  *whole duration* the character is speaking (`response.created` and every
  `response.output_audio.delta`), paired with `interrupt_response: false`
  server-side. This is why a learner literally cannot interject or ask a
  question mid-turn - their mic isn't even capturing audio at that point.
  Deliberately not flipped blind: re-enabling learner audio while the
  character is talking risks the character's own voice/echo bleeding back
  into the input and being misread as learner speech (no robust echo
  cancellation state to lean on here) - a real audio-engineering trade-off,
  not a one-line toggle. Added to the OpenAI prompt below.

### 7. Character used vocabulary the lesson never taught (HSK1 lesson)
- [x] **Claude, found and fixed a real inconsistency**: the realtime
  session's persistent system prompt (`buildRealtimeRolePlaySection()` in
  `ai-context.ts`, sent once at session start) only ever said "prefer
  these words," even for early-beginner (HSK1-2) lessons - while the
  *per-turn* instructions (`lessonLanguageConstraints()` in
  `han-realtime.ts`, sent with every `response.create`) already had a
  strict "use ONLY this lesson's vocabulary" rule for HSK1-2. The weaker
  session-level baseline could undercut the stricter per-turn instruction.
  `buildRealtimeRolePlaySection()` now computes the same `isEarlyBeginner`
  condition (HSK1-2 with no explicit override, including the free-topic
  points-derived level) and uses the matching strict wording, so both
  layers agree.
- [ ] **OpenAI**: verify with live audio, across multiple HSK1-2 lessons,
  that the character now actually stays within taught vocabulary - same
  caveat as issue 1, prompt text alone doesn't guarantee model behavior.

- [x] `tsc --noEmit`/`eslint` clean, 376/376 unit tests pass (13 more from
  the concurrent work, all still green).

**Updated standalone prompt for the OpenAI session** (supersedes the one
above - paste this version instead, it folds in the mic/interrupt finding):

> The Speaking role-play voice conversations in HanGo (`context.rolePlay`
> set - the lesson Speaking step and Speaking Lab, distinct from Han's
> general tutor chat) need two related things designed and implemented with
> real audio testing, which blocked doing them blind here.
>
> **1. Real dynamic ending, not a wall-clock timer.** Today,
> `HanVoiceConversation` (`src/components/ai-teacher/han-voice-conversation.tsx`)
> takes `naturalCloseAfterMs`/`maxSessionMs` props (set per-lesson by
> `speakingSessionTiming()` in `speaking-step.tsx`, scaled 35-100s by HSK
> level); at `naturalCloseAfterMs` it forces a `response.create` with
> `buildRealtimeClosingInstructions()` telling the character to wrap up
> *right now* regardless of whether the scene's objective has actually been
> reached, and at `maxSessionMs` it force-ends unconditionally. A short,
> simple exchange still finishes long before its window and then sits idle
> until the timer fires - reads as a random cutoff. Please design a
> mechanism where the character itself recognizes when `rolePlay.objective`
> has been reached and closes naturally at that point (the Realtime API's
> function/tool-calling support inside an active session, e.g. an
> `end_conversation` tool the model can invoke, is the natural fit, but the
> design is yours). Keep `naturalCloseAfterMs`/`maxSessionMs` afterward only
> as a safety-net ceiling, not the primary decision mechanism.
>
> **2. The learner's mic is fully disabled while the character is
> speaking, so they can never interject or ask a question mid-turn** (user
> report, 2026-08-16). In `han-voice-conversation.tsx`, on `response.created`
> and every `response.output_audio.delta`, `context.rolePlay` sessions run
> `streamRef.current?.getAudioTracks().forEach(t => t.enabled = false)` -
> paired with `interrupt_response: false` in the session's `turn_detection`
> config (`src/lib/speech/realtime-vad.ts`). This was presumably done to
> stop the character's own voice/echo from bleeding into the input and
> being misread as learner speech, but the effect is that genuine barge-in
> ("wait, can I ask something?") is impossible. Please redesign this with
> real audio testing - likely enabling the mic during character speech
> (so real interruption is possible) while adding whatever echo/self-audio
> rejection is needed to stop the character's own voice from being picked
> up as a false learner turn (e.g. muting only while local echo is
> plausible, or a stronger signal-quality gate specifically during
> playback) rather than the current blanket mic-off.
>
> While in this code path, also verify (across a few different
> lessons/HSK levels, not just one): (a) the character opens with a single
> short fact and paces one new thing per turn rather than front-loading its
> introduction (`buildRealtimeOpeningInstructions` in `han-realtime.ts` and
> the "Live role play" section of `buildRealtimeSystemPrompt` in
> `ai-context.ts`); (b) for HSK1-2 lessons, the character's actual vocabulary
> stays within what that lesson taught (`lessonLanguageConstraints()` in
> `han-realtime.ts` and `buildRealtimeRolePlaySection()` in `ai-context.ts`
> both now say "use ONLY," but only real audio testing confirms the model
> follows it); (c) once your dynamic-ending mechanism replaces the current
> `response.done`-triggered cutoff, whether the closing line's audio
> reliably finishes playing before teardown, and either confirm the current
> 1800ms `CLOSING_AUDIO_GRACE_MS` grace delay is right or replace it with a
> precise signal from the Realtime API if one exists for this session type.

## Curriculum content: Grammar/Comprehension exercise quality (2026-08-16)

User report after using the app directly, covering two content problems across
the entire ~224-lesson curriculum (all authored earlier in this project) - not
a code bug, a content-authoring gap. Three phases, done in that order.

### Phase 1 - Grammar exercise instructions were pure Chinese, even for beginners ✅ Complete
- [x] Audited: 960 of 965 Grammar exercises (`Exercise.grammarPointId IS NOT
  NULL`) across all 3 tiers had their entire prompt in Chinese, including the
  *meta-instruction* itself ("选择正确的词填空：..." - "choose the correct word
  for the blank:..."), not just the practice sentence. For a learner on their
  first-ever lesson, not being able to read what the question is even asking
  is a real accessibility problem, not a level-appropriate design choice.
- [x] Found the real content was highly templated: only 5 recurring Chinese
  instruction phrases (plus one recurring suffix pattern, "...最恰当的翻译是："
  on Advanced-tier quoted-sentence translation questions) covered nearly all
  960 rows. Wrote `scripts/fix-grammar-instructions.mjs` (deleted after use) -
  a pure string-prefix/suffix translation into English, never touching the
  underlying Chinese practice content. Ran directly (not delegated) since the
  low editorial risk didn't need a subagent.
- [x] Verified: 0 non-English-prefixed Grammar prompts remain anywhere in the
  published curriculum (spot-checked 15 random rows across all 3 tiers by
  hand afterward too).

### Phase 2 - Comprehension exercises let the learner type instead of choose ✅ Complete
- [x] Audited: 164 Comprehension exercises (`grammarPointId IS NULL`, i.e. not
  Grammar's own practice pool) were `FILL_IN_BLANK` (a free-text `<Input>`,
  see `exercise-item.tsx`) - 58 Beginner, 60 Intermediate, 46 Advanced.
  User's ask #2: no typing in Comprehension, selection only.
  Grammar's own `FILL_IN_BLANK` exercises were left alone (different pool,
  different UX pattern already fine for that step).
- [x] Read all 164 (correct answer + explanation + source sentence) and
  hand-assigned each to one of ~140 grammatical/functional categories (time
  markers, result complements, quantifiers, discourse markers, etc.), each
  backed by a small pool of genuinely-wrong-in-that-slot distractor words -
  not random or synonym-based, to avoid a "several right answers" ambiguity.
  Caught and fixed one real case pre-apply (要是/如果/假如/万一 are all
  interchangeable in "___下雨怎么办" - swapped that one exercise's pool for
  words that don't fit the slot at all).
- [x] `scripts/fix-comprehension-typing.mjs` (deleted after use): converts
  each to `MULTIPLE_CHOICE`, generates 3 distractors from the assigned pool,
  shuffles position, sets `correctAnswer.optionIndex` to match, creates 4
  fresh `ExerciseOption` rows. Dry-run mode built in and used first.
- [x] Verified: 0 `FILL_IN_BLANK`/`SHORT_RESPONSE` remain in Comprehension
  anywhere; every converted exercise has exactly 4 options, exactly 1
  correct, and a correct `correctAnswer.optionIndex`.

### Phase 3 - Comprehension tested vocabulary, not the lesson's own dialogue ✅ Complete
User's ask #1 (the "Comprehension debe ser sobre la conversación" part):
Comprehension is supposed to test whether the learner understood the specific
conversation they just read/heard (`Dialogue`/`DialogueLine`, shown in the
Situation step and replayed in Comprehension) - not act as a second
vocabulary quiz redundant with the Vocabulary step. A real, already-correct
example existed elsewhere in the curriculum (Restaurant "Checking the
Ingredients": "服务员推荐的菜是什么？" - what did the waiter recommend - names
a fact from that exact conversation), proving this was inconsistent
authoring, not a structural limitation.

- [x] Initial regex-based audit (`/^(how do you (say|ask)|what does .+
  mean)/i` against all Comprehension prompts) found 412 exercises across 152
  lessons looking generic - used this to scope the work, but it turned out to
  be an underestimate (missed `TRUE_FALSE` vocab-definition rows like
  "'贵姓' is a polite way to ask someone's surname") **and** an overestimate
  in places (some prompts matching the pattern, e.g. "How do you ask what the
  benefits package specifically includes," were actually already grounded in
  a specific thing a character asked). Real content judgment doesn't reduce
  to a keyword filter, which is why this phase was delegated to agents doing
  actual per-exercise reading, not a scripted bulk rewrite like Phases 1-2.
- [x] Split the full curriculum (164 lessons with Comprehension exercises)
  into 8 batches by domain/tier (~19-20 lessons each: Foundations ×3,
  Everyday Life ×2, Advanced Situations ×2, one batch covering the 4 small
  domains) and ran 8 parallel background agents, each with a shared, detailed
  brief: read that lesson's real `Dialogue`, judge each of its 5 Comprehension
  exercises individually (not a blanket rewrite), rewrite only the genuinely
  generic ones grounded in a specific fact/character from that dialogue,
  preserve `type`/count/register per lesson's own difficulty tier.
- [x] **First launch failed silently** - all 8 agents hit an account session
  limit mid-task and were killed before finishing, but several had already
  emitted confident-sounding progress text ("applied successfully...") before
  the actual database write ran. Caught this by not trusting the reports:
  queried `Exercise.updatedAt` across every Comprehension row directly -
  confirmed 0 changes had actually landed (max `updatedAt` was from the
  *previous day*, i.e. original content authoring, not this session).
  **Lesson for next time this pattern is used: verify via a fresh DB read,
  never take an agent's own "done"/"applied" claim at face value, especially
  from an agent that was killed mid-run.**
- [x] Re-launched all 8 with the same brief plus two additions: (1) an
  explicit instruction to re-verify with a fresh SELECT after writing, before
  reporting success; (2) a concrete example of already-good content (the
  negotiating-job-contract-negotiating-benefits-and-perks lesson, which one
  agent in the first, failed run had been about to blindly rewrite in full)
  so agents would judge per-exercise rather than assume "batch = all bad."
  All 8 completed this time. One agent (A1) found and self-corrected a real
  bug via its own structural verification pass - it had accidentally swapped
  content between a `TRUE_FALSE` and a `MULTIPLE_CHOICE` exercise, caught it
  from the option-count mismatch, fixed it, and re-verified before reporting.
- [x] Final tally across all 8 batches (760 = 152×5 exercises reviewed):
  **415 rewritten, 345 already correct and left untouched.** Breakdown: F1
  95/95 rewritten, F2 0/95 (already good), F3 0/90 (already good), E1 0/100
  (already good - this batch turned out to have already been fixed by a
  stray successful write from the first, mostly-failed launch), E2 100/100
  rewritten, A1 100/100 rewritten (incl. the swap-bug fix), A2 40/100
  rewritten (60 already good), S1 80/80 rewritten.
- [x] My own independent verification afterward (not agent-reported): a
  curriculum-wide structural audit - every one of the 164 lessons has exactly
  5 Comprehension exercises (820 total, matches 164×5 exactly), 0 structural
  anomalies (option counts, single-correct-answer invariant,
  `correctAnswer.optionIndex` alignment) anywhere, 0 `FILL_IN_BLANK`/
  `SHORT_RESPONSE` remaining, 0 non-English Grammar prompts remaining. Then
  hand-read 7 full lessons' worth of rewritten content spanning all 5
  domains/tiers involved (Foundations, Everyday Life, Advanced Situations,
  the small-domains batch, plus the specifically-flagged
  negotiating-job-contract lesson) directly from the live database - every
  sample named a specific character and quoted the exact dialogue line
  backing the answer, matching the target quality bar throughout.
- [x] Deleted ~18 leftover temp scripts from both agent launches (the failed
  one and the successful one) that weren't self-cleaned up.
- [x] App-level verification: 391/392 unit tests pass (1 unrelated flaky
  timeout in `env.test.ts`, confirmed to pass cleanly in isolation - no
  application code was touched by this content work, so this was a
  belt-and-suspenders check, not an expected-risk area). Dev server log
  showed a transient Turbopack "Could not find the Next.js package" error
  mid-session (self-diagnosed in its own error message as a concurrent
  `node_modules` install elsewhere - unrelated to this work, already
  resolved by the time it was checked, confirmed via a live 200 response on
  a lesson page with newly-rewritten content).

## Speaking, round 3 - real field test after the dynamic-ending tool shipped (2026-08-16)

User actually ran a Speaking session after the concurrent session's
`buildConversationCompletionTool` landed (confirmed present in
`han-realtime.ts`/`han-voice-conversation.tsx`). Liked Grammar/Vocabulary.
Four Speaking findings:

### 3. vocabularyUsageRatio unfairly required self-produced vocabulary ✅ Complete (Claude)
User's exact case: scored 16/30 with 40% vocabulary / 50% objective, but
noted they legitimately couldn't self-produce every taught word when the AI
character used some of them first - repeating a word the character just
said isn't how natural Chinese works (a fluent reply drops the noun: 你想喝
咖啡吗 → 好，我要, not 我想喝咖啡). The original rule ("never give credit for
language used only by the AI character") was intentional (anti-parroting)
but too strict, and doubled as a real fragility: relying on exact string
match in the learner's own turn makes the ratio sensitive to a single
mis-transcribed word (ties to finding 4 below).
- [x] Redefined in `buildSpeakingConversationFeedbackPrompt()`
  (`reflection-prompt.ts`): a word now counts toward `vocabularyUsageRatio`
  if the learner used it themselves, OR the AI character used it first and
  the learner's next turn shows a clear, contextually appropriate response
  (demonstrated understanding, not exact-string presence). A confused/
  off-topic/non-responsive reply still doesn't count even if the same
  characters happen to appear. Updated the `SpeakingConversationFeedback`
  interface doc comment and `docs/02_academy/points_system.md` Part 1 to
  match.
- [x] `tsc --noEmit`/`eslint` clean, 68/68 relevant unit tests pass
  (`reflection-prompt.test.ts` + `points-system.test.ts` - only checks the
  field name and parsing logic, not the instruction wording, so nothing was
  stale).

### 1, 2, 4 - live voice-model behavior, handed to OpenAI (not touched here)
Real, specific field evidence from this session, added to sharpen the
existing standalone prompt (see "Speaking role-play fixes" sections above) -
not touched directly here since `han-realtime.ts`/`ai-context.ts`/
`han-voice-conversation.tsx` are under active, fast-moving concurrent
development on exactly this surface (confirmed: `mode` param, a
"completion check" concept, and heavily evolved opening/turn instructions
all appeared since this file was last read here) - editing further right
now risks fighting an in-flight rewrite rather than helping it.

1. **Conversation still ends too fast, learner felt cut off before they
   could develop the exchange or reuse vocabulary.** This is the first real
   field signal on the new `buildConversationCompletionTool` - it's ending
   perceptibly too eagerly. Needs live-audio tuning of when the model
   decides to invoke it (or the instructions around it), not a blind prompt
   tweak.
2. **Character didn't answer a direct reciprocal question.** User said "我想
   喝咖啡，你呢？" ("...and you?") and the character moved on without
   answering. `buildRealtimeTurnInstructions()`'s per-turn instructions
   don't currently have an explicit "if the learner just asked you a direct
   question, answer it before adding anything else" rule - this is a
   genuine responsiveness/turn-tracking gap, not just a pacing one.
3. **Suspected mis-hearing - scored on words the learner didn't actually
   say.** Consistent with STT/transcription accuracy, not evaluation logic
   (the evaluation-side fragility this could cause is now mitigated by the
   `vocabularyUsageRatio` redesign above, but the root transcription-quality
   question is separate and needs live audio to diagnose - see
   `speech/transcript-quality.ts`'s `assessHanTranscript`/
   `confidenceFromLogprobs`).

**Addendum prompt for the OpenAI session** (paste after the existing
standalone prompt, or fold in - same conversation, newer field data):

> Three more findings from an actual field test of the new
> `buildConversationCompletionTool`-based ending:
>
> 1. It's ending too early - the learner felt cut off before they could
>    develop the exchange or reuse vocabulary, on a session that (per the
>    saved transcript/score) had real, substantive content left to give.
>    Please tune when the model decides to call the tool, with real audio
>    testing across a few sessions of different lengths - it should not
>    be this eager to close.
> 2. The character failed to answer a direct reciprocal question the
>    learner asked (我想喝咖啡，你呢？ - "...and you?" - went unanswered,
>    the character just moved the scene forward). Please add an explicit
>    instruction to `buildRealtimeTurnInstructions()`'s per-turn
>    instructions: if the learner's last turn poses a direct question to
>    the character (你呢, or any other question), the character's next
>    turn must answer it before introducing anything new - and verify with
>    live audio that the model actually follows this once added.
> 3. The learner suspects the Speaking evaluation sometimes credits/judges
>    words they didn't actually say - possible STT mis-transcription.
>    Please investigate transcription accuracy for Mandarin practice audio
>    (`speech/transcript-quality.ts`) with real recordings.

## Speaking, round 4 - character stole the learner's practice turn + repeated a question (2026-08-16)

Two more findings from another real field test. Both are prompt-text gaps,
not audio-pipeline behavior, so fixed directly here.

### 1. Character asked the learner's own target question, robbing them of the practice ✅ Complete (Claude)
User's exact case: the objective was for the *learner* to ask where the
bathroom is, but the character asked "洗手间在哪儿？" itself, forcing the
learner into an unplanned answering role instead - where they then made a
real vocabulary mistake ("出左边", flagged as Cantonese/non-taught) because
they were never taught or given the chance to produce the question. Traced
this to a real gap: `buildRealtimeOpeningInstructions()` already has a
"Respect role ownership... never say the learner's target phrase or perform
their required action for them" rule, but it's scoped to the **opening
turn only** - this happened mid-conversation, where neither
`buildRealtimeTurnInstructions()` (per-turn, `han-realtime.ts`) nor the
session-level `buildRealtimeRolePlaySection()` (`ai-context.ts`) had any
equivalent protection.
- [x] Added the same role-ownership rule to both places, generalized from
  "actions/services" to explicitly cover objective verbs (ask, order,
  request, explain, compare, negotiate): the character must never perform,
  ask, or supply that action itself when the goal assigns it to the
  learner - it should wait for the learner or create a natural opening for
  them to do it. Added to `buildRealtimeRolePlaySection()` (persists for
  the whole session) and to the `rolePlay` branch of
  `buildRealtimeTurnInstructions()` (reinforced every turn).

### 2. Character repeated the exact same question mid-conversation ✅ Complete (Claude)
User felt this showed the character "isn't listening or doesn't remember
what it said before" and wanted the conversation to feel natural. Checked
for a genuine app-level bug first (traced all `response.create` call sites
in `han-voice-conversation.tsx`): each learner turn legitimately fires up to
three `response.create` calls (silent `before_reply` completion check →
the one audible turn reply → silent `after_reply` completion check), but
only the middle one produces audio/transcript, so this is not a
duplicate-firing bug. Also confirmed: nothing in the system prompt or
per-turn instructions ever told the model to avoid repeating itself.
- [x] Added an explicit anti-repetition instruction to both
  `buildRealtimeRolePlaySection()` (session-level) and the `rolePlay`
  branch of `buildRealtimeTurnInstructions()` (per-turn): never ask a
  question or restate information already given earlier in the
  conversation unless the learner explicitly asks for a repeat; keep track
  of what has already happened and always add something new.
- [x] **Open hypothesis checked with live audio**: the previous
  `before_reply`/`after_reply`
  completion-assessment tool calls add a `function_call` +
  `function_call_output` item pair to the Realtime session's conversation
  history on *every single learner turn*, on top of the real dialogue
  exchange - roughly tripling item growth per turn compared to a plain
  back-and-forth. If the session's context window/truncation ever drops
  older items to make room, this could push real prior dialogue out of the
  model's effective memory sooner than expected, independent of any prompt
  wording. Worth checking with real multi-turn audio sessions whether this
  is a factor, and if so whether the assessment items should be pruned or
  excluded from the model's context history entirely instead of relying on
  it to simply ignore them.
- [x] Prompt-only verification initially reproduced both bugs: the HSK 1
  clerk said the learner-owned `洗手间在哪儿？`, and a 9-turn HSK 3 scene
  repeated the same return-time/transport question with different wording.
- [x] Confirmed the item-growth hypothesis (20 real messages vs 36
  completion-tool items in one HSK 3 run), but the failures happened far
  below any plausible context limit, so truncation was not their immediate
  cause. Removed completion tools from the Realtime conversation entirely.
- [x] Completion/state planning now runs through authenticated
  `/api/han/realtime/assessment` on `gpt-5-mini`, once per learner turn
  (`close_after_reply` replaces the second assessment). Realtime handles
  audio only. One-turn system guards are deleted immediately after use, so
  active history contains only real dialogue.
- [x] Added deterministic opening ownership, semantic question-intent
  protection, strict learner-action evidence, finite objective completion,
  and exact Simplified-Chinese next-turn planning. Final live audio checks:
  HSK 1 bathroom 5/5, HSK 3 weekend 8/9, HSK 5 hotel 6/9; all passed role
  ownership, semantic anti-repetition, dynamic close, and zero retained
  tool items. WAV evidence is under `project/test-artifacts/realtime-ending/`.
- [x] Final verification: `tsc --noEmit`, scoped ESLint, targeted prompt
  suites 89/89, and full unit + component suites 432/432. Integration is
  currently dominated by pre-existing remote-database timeouts; smoke could
  not start its dev server within 60s in this environment.

## Speaking, round 5 - lesson coverage + volunteered-name memory (2026-08-16)

- [x] Completion now requires learner-side evidence for the lesson's authored
  vocabulary and grammar as well as the scene objective; assistant use never
  counts, understandable attempts do, and one remaining target is opened at a
  time instead of closing early.
- [x] Added `remaining_practice_targets` to the assessment contract, blocked
  `end`/`close_after_reply` while targets remain, and made credited coverage
  monotonic so an item cannot reappear as pending on a later turn. Separate
  `objective_complete` state prevents a contradictory planner explanation
  from keeping an already-complete scene alive once coverage reaches zero.
- [x] Extended semantic memory to treat `我叫…` / “my name is…” / “me llamo…”
  as an established learner fact; planned name questions are deterministically
  suppressed even if the model tries to ask again.
- [x] Added regression coverage for early close, target reintroduction, and the
  volunteered-name case. The live HSK 1 greetings harness now uses the first
  lesson's real 10 vocabulary items and 3 grammar structures. Final real-audio
  run: dynamic close PASS at learner turn 6/7, coverage complete before close,
  no repeated-name intent, closing audio `再见。`; WAV/report evidence remains
  under `project/test-artifacts/realtime-ending/`.

**Standalone prompt for the OpenAI session** (paste as its own message):

> Two prompt-text fixes just landed for two real field-tested Speaking
> issues (2026-08-16): (1) the character was asking the learner's own
> objective question itself instead of letting the learner practice
> producing it - e.g. objective was "learner asks where the bathroom is,"
> but the character asked "洗手间在哪儿？" itself, forcing the learner into
> an unplanned answering role where they then made a real vocabulary
> mistake; (2) the character repeated the exact same question mid-
> conversation, which read as "not listening / no memory."
>
> Both got new instructions in `buildRealtimeRolePlaySection()`
> (`ai-context.ts`, session-level, persists the whole conversation) and the
> `rolePlay` branch of `buildRealtimeTurnInstructions()` (`han-realtime.ts`,
> reinforced every turn): (a) role-ownership for objective-verb actions
> (ask/order/request/explain/compare/negotiate) now applies for the whole
> conversation, not just the opening turn - the character must never
> perform or ask that action itself when the goal assigns it to the
> learner; (b) an explicit rule never to ask a question or restate
> information already given earlier in the same conversation unless the
> learner asks for a repeat.
>
> Please verify both live, with real audio across a few multi-turn
> sessions, once you're at a good sync point - a text instruction isn't
> proof the live model actually holds to it turn after turn, especially
> deep into a conversation.
>
> If repetition still happens after this, please check one more
> hypothesis: every learner turn currently fires up to three
> `response.create` calls when `context.rolePlay` is set - a silent
> "before_reply" completion check, the one audible turn reply, then a
> silent "after_reply" completion check (see `han-voice-conversation.tsx`).
> Each completion check adds a `function_call` + `function_call_output`
> item pair to the Realtime session's conversation history, so a role-play
> turn grows the session's item count roughly 3x faster than a plain
> back-and-forth would. If the session's context window or truncation ever
> drops older items to make room, real prior dialogue could get pushed out
> of the model's effective memory sooner than the visible turn count would
> suggest - independent of any prompt wording. Worth checking with real
> long sessions whether that's a contributing factor, and if so whether the
> assessment-check items should be excluded from the model's context (or
> the two checks collapsed into one) rather than relying on the model to
> just ignore them.

## Speaking, round 6 - opening audio cut off before playback ends (2026-08-16)

- [x] Role-play opening and normal turns no longer treat `response.done` as
  proof that the learner has heard the complete sentence; the microphone stays
  disabled while WebRTC still has assistant audio queued for playback.
- [x] Listening resumes on the precise `output_audio_buffer.stopped` signal
  when available, with measured remote-stream silence and an 8-second ceiling
  as defensive fallbacks. The same gate now protects the first character line,
  every mid-conversation reply, and the natural closing line.
- [x] Typecheck, scoped ESLint, and realtime-playback regression tests pass.
  Browser verification reached the lesson route, but live playback was blocked
  by the existing `LearnerProfile_userId_fkey` server error before the Speaking
  UI could mount.

## Speaking, round 7 - unanswered learner questions + premature close (2026-08-16)

- [x] A direct learner question is now an unresolved conversation obligation:
  the assessment route deterministically forces `continue` until the character
  has produced the answer, even when that question completes the scene goal.
- [x] The next audible turn is hard-gated to answer the learner's exact question
  directly and declaratively; it may not ignore it, redirect to another goal,
  give only a generic acknowledgement, or ask a different question back.
- [x] When objective and lesson coverage are already complete, the answer plays
  first and only then may the existing natural closing run. Remaining authored
  vocabulary/grammar targets continue to block early completion. Target credit
  is now backed by observable learner transcript evidence, so the evaluator
  cannot silently drop an unused word or grammar structure.
- [x] Typecheck and scoped ESLint clean; realtime prompt/state regression suites
  pass 97/97. Live HSK 1 bathroom scenario PASS: every learner question got a
  direct location/direction answer, no repeated character question, and dynamic
  close occurred only after the sixth learner turn completed objective and
  lesson coverage (`endedAt=6/6`).

## Speaking, round 8 - shorter safety ceilings (2026-08-16)

- [x] Reduced every Speaking safety window by one minute while preserving the
  dynamic objective/coverage ending: HSK 1 max 2:00, HSK 2 max 2:40, HSK 3-4
  max 4:00, HSK 5+ max 5:00, and free-topic Speaking Lab max 4:00.
- [x] Graceful safety-close requests were reduced by the same minute so their
  existing lead time before the hard ceiling remains intact.

## Speaking, round 9 - deterministic one-line opening (2026-08-16)

- [x] Removed the objective-specific opening exception. Every role-play now
  receives a hard one-turn opening guard: exactly `你好。` for peer scenes or
  `您好。` for service/formal scenes, with no name, introduction, emotion,
  question, or second sentence.
- [x] Planned non-question replies are also reduced deterministically to one
  conversational move, preventing later planner output from bundling name,
  nationality, and a question into the same turn.
- [x] Prompt/state suites pass 98/98 with clean typecheck and scoped ESLint.
  Live HSK 1 new-classmate Realtime run opened with exactly `你好。` (not the
  reported `你好，我是新同学，叫小明。高兴认识你，你呢？`), retained memory, and
  closed dynamically at learner turn 6/7 without repeated questions.

## Speaking, round 10 - name-memory fallback is deterministic (2026-08-16)

- [x] Closed the two remaining unguarded reply paths: a temporarily failed
  private assessment and a successful `continue` assessment with no planned
  character line can no longer let Realtime improvise from stale context.
- [x] Established name/nationality facts now produce a hard exact fallback
  acknowledgement; direct learner questions retain a separate one-sentence
  answer-only fallback and may not ask a question back.
- [x] Regression covers the exact reported compound output
  `我是学生。你叫什么名字？`; prompt/state/VAD suites pass 101/101 with clean
  typecheck and scoped ESLint. Live HSK 1 introductions PASS through dynamic
  close at turn 6/7 with no character name question after `我叫安娜。`.

## Speaking, round 11 - objectives no longer end timed practice (2026-08-16)

- [x] Objective and lesson-target completion remain available for Reflection
  scoring, but neither `decision=end` nor `close_after_reply` may close an
  active Speaking session; only the learner's End button or the timer can end it.
- [x] After all targets are complete, the private planner keeps the same scene
  moving one easy, non-repeated turn at a time. HSK 1-2 continuation planning
  remains restricted to the lesson's authored vocabulary/grammar.
- [x] Learners now receive the full practice windows before the natural closing
  begins: HSK 1 2:00, HSK 2 2:40, HSK 3-4 4:00, HSK 5+ 5:00, and free-topic
  4:00. A separate 12-second hard reserve exists only for closing audio.
- [x] Prompt/state/timing/playback suites pass 108/108 with clean typecheck and
  scoped ESLint. Live HSK 1 Realtime run completed all scripted objectives and
  a seventh extra learner turn with `timer-policy=PASS`, `endedAt=never`, no
  repeated character question, and no objective-triggered closing. The timed
  planner has 3,000 output tokens to avoid empty evaluations after completion;
  the existing deterministic fallback still covers transient API failures.

## Speaking, round 12 - direct fluid Realtime turns (2026-08-21)

- [x] Real saved `Greetings and Introductions` transcript confirmed the rigid
  flow: `很高兴认识你。` → learner repeats it → `我叫安娜。` → learner volunteers
  their name → generic acknowledgement. The character never created the
  expected reciprocal opening and every learner turn waited on a separate
  `gpt-5-mini` planner before Realtime could speak.
- [x] Timed lesson Speaking and free-topic Speaking Lab now use the same direct,
  session-preserving Realtime reply path as Han. The blocking text assessment
  remains only for Placement (`completionPolicy="objective"`); timed transcript
  evaluation still happens afterward in Reflection.
- [x] Natural-turn guidance now reacts to the learner before advancing, varies
  reactions/answers/reciprocal cues instead of forcing a checklist question,
  permits `你呢？` when the corresponding fact is not yet known, and continues
  creating one unobtrusive lesson-target opportunity at a time until the timer.
- [x] The HSK 1 classmate opening is one grounded move —
  `你好，你叫什么名字？` — rather than front-loading the character's name,
  nationality, emotion, and question or leaving the learner without a cue.
  Known facts and prior questions remain protected from repetition; learner
  questions still require a direct answer; lesson HSK/vocabulary/grammar,
  Mandarin-only immersion, no live corrections, and timer-owned closing remain.
- [x] TypeScript, scoped ESLint/Prettier, and 132 focused Realtime/context tests
  pass. Running Next server compilation responds successfully; fresh signed-in
  microphone testing remains the final perceptual check.

## Speaking Lab Practice with Han - noise/naturalness audit (2026-08-23)

- [x] Free-topic Realtime input now uses OpenAI `far_field` noise reduction
  before transcription/VAD, plus the existing stricter server-VAD profile and
  foreground-signal/logprob checks.
- [x] Continuous room audio can no longer leave an input turn open forever: a
  level-aware watchdog preserves/commits probable learner speech, but clears
  music/barks, creates a brief silence boundary, ignores any late transcript
  from that discarded item, and resumes listening without an invented reply.
- [x] Free-topic prompts now explicitly require spontaneous everyday Mandarin
  and real-person reactions rather than vocabulary-drill/questionnaire filler;
  when "Use my profile level" resolves to Pre-HSK it remains hard-limited to
  one useful phrase and 8 Chinese characters.
- [x] Speaking role-play transcript validation is now Mandarin-only after STT:
  Spanish/English or mixed Latin output is rejected and the learner is asked to
  repeat, while Han's general side-panel chat remains multilingual.
- [x] TypeScript, scoped ESLint/Prettier, 148 focused Realtime/context/STT tests,
  and local Realtime-route compilation pass. Perceptual testing with the user's
  actual microphone/music environment remains the final threshold check.

## Speaking, round 14 - contextual understanding + separate audio evidence (2026-08-23)

- [x] Lesson Speaking and Speaking Lab's Practice with Han now preserve each
  learner turn's raw STT, conversation interpretation, confidence, and a
  separate pronunciation/tone/ambiguity finding. Understandable imperfect
  Mandarin keeps the scene moving; real ambiguity gets one short in-character
  clarification instead of a silent meaning change or correction drill.
- [x] At session end, the same active Realtime conversation performs one silent,
  text-only audio-evidence review. It accepts only findings tied to a real turn
  at confidence >= 0.60; low STT confidence, room noise, accent, or odd spelling
  alone never becomes a pronunciation error. No audio is uploaded or transcribed
  a second time, and there is no paid review call per turn.
- [x] Learning Journey stores the compact evidence record for Reflection without
  exposing it as dialogue; Practice with Han passes it into its existing single
  final-feedback call. Tone/pronunciation feedback now requires this explicit
  audio-derived evidence. Han's general side-panel/bubble path remains unchanged
  and multilingual.
- [x] TypeScript, focused Realtime/context/STT/Reflection regression (177/177,
  including 6 database-backed Reflection cases), scoped ESLint/Prettier, and
  local Next route compilation pass. A signed-in microphone session remains
  the final perceptual check.

## Timed Speaking - immutable character and learner-fact memory (2026-08-23)

- [x] Fixed the live contradiction where a character who had introduced
  themself as a teacher later mirrored `我是学生` with `我也是新生`, plus the
  repeated-name question after the learner had already answered it.
- [x] Auto persona now resolves one character from the learner-authored
  scenario and keeps it. Occupation,
  status, relationship, name, nationality, and other established character
  facts are immutable for the full session.
- [x] Every timed lesson Speaking and Practice with Han turn receives a compact
  two-speaker memory (last 8 messages, capped at 480 characters). Learner facts
  never overwrite character facts, and `也` is allowed only for a genuinely
  shared fact. A deterministic `LEARNER NAME STATUS` marks either an explicit
  `我叫…`/`我的名字是…` answer or a direct short answer after
  `你叫什么名字？` as known and forbids asking for it again. Han's general
  side-panel/bubble and objective-driven Placement exam remain outside this
  memory branch.
- [x] TypeScript and scoped ESLint pass; focused identity/context regression
  passes 124/124. Local Next route compilation passes; real microphone
  confirmation remains pending.

## Practice with Han - learner-authored scene contract (2026-08-23)

- [x] Corrected the prior superficial role fix: no special Teacher option is
  required. Any Topic/details supplied by the learner now form a binding scene
  contract that resolves the assistant's role, the learner's role, setting,
  relationship, and current activity; this is not treated as a loose theme.
- [x] Every free-topic turn uses the compact dialogue memory as scene state and
  must continue one causal sequence: react to the latest turn, add one logical
  next beat, never restart introductions/classes, and never invent an unrelated
  activity or location such as walking.
- [x] The contract is built locally with no extra model call or API cost. Scope
  is Speaking Lab's Practice with Han only; Han's side-panel/bubble is unchanged.
- [x] TypeScript, scoped ESLint/Prettier, and 127 focused context/Realtime tests
  pass, including the exact professor/new-student classroom regression. The
  running local server responds; fresh microphone confirmation remains pending.

## Learning Journey Speaking - reciprocal turn handoff (2026-08-23)

- [x] Removed the rule that answered a learner question but explicitly forbade
  the character from asking anything back. During timed lesson Speaking, the
  character now answers first and then returns one short, relevant question.
- [x] Non-question learner turns also receive a clear reciprocal handoff: one
  contextual, previously unasked question using familiar lesson language. It
  cannot perform or reveal an objective action owned by the learner, and the
  separate natural closing remains exempt.
- [x] Scope is Learning Journey lesson Speaking only. Speaking Lab's Practice
  with Han and Han's side-panel/bubble retain their existing behavior.
- [x] TypeScript, scoped ESLint/Prettier, and 126 focused Realtime/context tests
  pass, including direct-answer-plus-reciprocal-question and scope regressions.

## Foundations Numbers, Time and Dates - wrong introduction opening (2026-08-23)

- [x] Root cause: the deterministic lesson-opening classifier treated the bare
  English word `meet` as “meet someone new.” The real scenario says “meet a
  friend for coffee,” so it incorrectly forced `你好，你叫什么名字？` even though
  the objective is to arrange a day and time.
- [x] Time/date/scheduling lessons now open with a topic-grounded familiar cue
  (`你明天忙吗？`). Generic `meet` no longer triggers an introduction; name and
  origin questions are forbidden unless the scenario/objective explicitly
  requires an introduction. `Friend` remains correct for this coffee plan.
- [x] Raw Realtime audio errors containing internal millisecond/buffer details
  are replaced with a short learner-facing retry message; processing and
  thresholds are unchanged.
- [x] TypeScript, scoped ESLint/Prettier, and 127 focused Realtime/context tests
  pass, including the exact Friend/coffee/time regression and error redaction.

## Dialogue audio: wrong-gender voice + TTS cost question (2026-08-16)

User noticed a Learning Journey dialogue with a male and female character
(one named 安娜/Ana) but both voices sounded male, and separately asked
whether replayed audio re-bills OpenAI every time or could be generated
once and reused.

### Cost question: already solved, no change needed ✅
`getOrGenerateDialogueLineAudioUrl`/`getOrGenerateDialogueAudioUrl`
(`dialogue-audio.ts`) already generate each line/dialogue's audio exactly
once, on first playback by any learner, cache the storage key on
`DialogueLine.audioFilePath`/`Dialogue.audioFilePath`, and serve the
cached file on every later play - confirmed by re-reading the existing
integration test (`tests/integration/dialogue-audio.test.ts`), which
asserts the TTS mock is called exactly once across two plays. No OpenAI
call happens on replay for anyone, ever, once a line has been generated
once. Explained this to the user rather than changing anything.

### Wrong-gender voice ✅ Complete (Claude)
Root cause: `pickVoice()` alternated blindly between two voices by
`speaker.order % 2` (`const VOICES = ["alloy", "onyx"]`), with no
awareness of the character's actual gender - `DialogueSpeaker` had a
`name`/`role` but no gender/voice field. Confirmed via a DB query: 328
speaker rows / 114 distinct names across 164 dialogues.
- [x] Added `DialogueSpeaker.voice String?` (migration
  `20260816145752_add_dialogue_speaker_voice_override`) - an explicit
  per-speaker TTS voice override.
- [x] `pickVoice()` now prefers `speaker.voice` when set, falling back to
  the original `order % 2` alternation unchanged for speakers with no
  override - zero behavior change for anyone not touched below.
- [x] One-off backfill script classified each of the 114 distinct names
  with real gender signal (foreign transliteration: 安娜/玛丽/大卫/汤姆/马克;
  explicit kinship/honorific: 丈夫/妻子/妈妈/刘女士/陈先生; and Chinese given
  names with strong, unambiguous gender-coded characters, e.g. 小刚/大伟/
  婷婷/王芳/李梅) and assigned `nova`/`shimmer` (female) or `echo`/`fable`
  (male), alternating within each dialogue so two same-gender speakers in
  one scene still sound distinct. Deliberately left every purely
  occupational/role-only name (顾客, 客服, 服务员, 专家, 前台, 同事甲/乙, etc.)
  untouched/null - the source text never specified a gender for those, so
  the existing alternation isn't actually wrong for them, only guessing
  would be. Chose `echo`/`fable`/`nova`/`shimmer` specifically because
  they never overlap with the fallback pool (`alloy`/`onyx`), so an
  overridden speaker can never collide with a same-dialogue fallback
  speaker by construction.
  - Result: 117 of 328 speaker rows classified (43 of 114 distinct
    names), all 117 differed from their old order-based voice and were
    updated; 211 rows left untouched.
  - Also cleared cached `audioFilePath` on every `DialogueLine` (21 rows)
    and parent `Dialogue` (75 rows) whose speaker's voice actually
    changed, so the next playback regenerates with the corrected voice
    instead of serving the stale wrong-gender clip forever - lines that
    had never been played yet needed no cache clear (nothing cached to
    invalidate).
  - Script deleted after a clean run (one-off, matches this session's
    established pattern).
- [x] Independently re-verified via fresh DB queries (not trusting the
  script's own printed summary): every one of 安娜's 16 rows across every
  dialogue she appears in now reads `voice = "nova"`; zero dialogues have
  two classified speakers sharing the same assigned voice.
- [x] `tsc --noEmit`/`eslint` clean, `dialogue-audio.test.ts` (6/6) and
  the full `tests/unit` suite (393/393) pass.

## Vocabulary Step pedagogy review + sentence-order question (2026-08-16)

User asked for an honest pedagogy critique of Learning Journey (acting as an
expert Mandarin teacher/former learner), specifically Vocabulary's 4
questions/word, Grammar's structure, and the Vocabulary-then-Grammar lesson
order. Investigated real code/data before answering rather than opining
generically:

- Vocabulary asked meaning, pinyin, chineseForm (reverse-translation), and
  fill-blank - 3 of 4 are the same character<->meaning/sound recognition
  check from three angles, seconds after seeing the answer on the same
  flashcard (closer to cramming than the testing effect), and none require
  the learner to construct anything.
- Found the app already ships `SENTENCE_ORDERING`/`MATCHING` `ExerciseType`s
  and a full tap-to-order UI (`exercise-item.tsx`) - but confirmed via a DB
  query that 0 of 1804 exercises curriculum-wide (Grammar's 960, Comprehension's
  644+176) use either type; 100% are MULTIPLE_CHOICE/TRUE_FALSE. Also
  confirmed (`exercise-progress.ts`'s own doc comment) this UI has never
  been exercised against real content.
- Confirmed actual lesson step order via DB (`VOCABULARY → GRAMMAR →
  SITUATION → COMPREHENSION → SPEAKING`): vocabulary/grammar are taught in
  the abstract before the learner ever sees the scene/dialogue - flagged as
  a real, debatable deductive-vs-communicative design choice, not a bug.
- Confirmed a cross-session `review-queue.ts` already exists (lightweight,
  documented as a simplification, not true per-item-due-date SRS) that
  resurfaces vocabulary/grammar/mistakes later with a 24h cooldown - so
  retention isn't purely one-shot even though the in-lesson block felt
  repetitive.

User approved swapping Vocabulary's pinyin question for a sentence-order
question (point 1), explicitly flagged the scoring-impact risk, declined
diversifying Grammar's exercises (point 2 - "me gustan los ejercicios de
grammar"), and deferred reordering Situation before Vocabulary/Grammar
(point 3) for later.

### Vocabulary: pinyin → sentence-order swap ✅ Complete (Claude)
- [x] Confirmed the scoring-safety concern *before* touching code:
  `vocabularyQuestionsPerWord()` (`points-system.ts`) is the only place
  question count feeds the score formula, and `computeVocabularyCounts()`
  (`reflection.ts`) counts by distinct `questionKey`, generically - it
  doesn't care which question types exist, only how many. So a **like-for-
  like swap** (remove pinyin, add one sentence-order question, same total
  per word) needed zero formula changes - confirmed this to the user before
  implementing, not after.
- [x] Added `buildSentenceOrderQuestion()`/`tokenizeWithDictionary()`/
  `pickOrderExampleIndex()` to `vocabulary-quiz.ts` - same zero-AI-cost
  philosophy as the existing `buildFillBlankQuestion()`: tokenizes a real
  authored example sentence via greedy longest-match against the lesson's
  own vocabulary list (falls back to single characters), trailing
  punctuation reattached to the last token instead of its own tile.
  `pickOrderExampleIndex()` avoids reusing whichever example fill-blank
  already claimed, so the two questions never quiz the identical sentence.
- [x] Added `VocabularySentenceOrderCheck` to `vocabulary-step.tsx`,
  replacing the pinyin `VocabularyQuizCheck` - tap-to-order interaction
  adapted from `exercise-item.tsx`'s existing `SENTENCE_ORDERING` pattern
  (this is that pattern's first real use anywhere in the app, since 0
  Exercise rows use the type). Wired through the existing
  `handleAnswer`/`recordVocabularyQuizAttemptAction` flow unchanged, keyed
  `${itemId}:order`.
- [x] Updated `vocabularyQuestionsPerWord()`'s doc comment and
  `points_system.md` Part 1 to describe the new question mix (meaning/
  chineseForm/sentence-order + fill-blank) instead of the stale pinyin
  reference - numeric totals (4/5/6) unchanged, confirmed correct as above.
- [x] Added unit tests for the three new functions (tokenization,
  punctuation reattachment, dictionary fallback, determinism, null guards,
  `pickOrderExampleIndex` edge cases). `tsc --noEmit`/`eslint` clean, full
  `tests/unit` suite 419/419 pass.
- [ ] Not yet visually verified in a live browser (no browser-automation
  tool available this session) - relied on strong unit coverage of the
  pure logic plus reuse of `exercise-item.tsx`'s already-shipped
  interaction pattern. Recommend the user try a lesson's Vocabulary step
  live before considering this fully closed.

### Grammar exercise diversification - declined by user
Point 2 (mixing `SENTENCE_ORDERING`/`MATCHING` into Grammar's 960
multiple-choice exercises) was on the table but the user said they like
Grammar's exercises as they are - not implemented, no action taken.

### Situation-before-Vocabulary/Grammar reordering - deferred
Point 3 (communicative-style reordering of the lesson step sequence) was
explicitly deferred by the user for later discussion - not implemented.

### Image-based vocabulary recognition - advisory only, not implemented
User's idea: after teaching all of a lesson's words, show an image and have
the learner identify it. Asked for a pedagogy opinion and a cost estimate,
not an implementation.
- Pedagogy: genuinely well-grounded (dual-coding theory / picture-word
  association, avoids L1-translation-mediated recall) but **only for
  concretely picturable words** - nouns like 咖啡/猫/医院 work well; function
  words, particles, abstract adjectives, and most verbs-in-isolation
  (的/但是/应该/可能, etc.) don't picture at all. Recommended as an
  additional check layered onto a subset of vocabulary, not a blanket
  replacement mechanic for all words.
- Cost: confirmed via DB query - 3014 `VocabularyItem` rows curriculum-wide.
  No existing image-generation code in the app today (checked), but the
  existing `getStorageProvider()` abstraction (already used for dialogue
  and vocabulary audio) would support the same generate-once-cache-forever
  pattern, making this a **one-time** cost, not per-learner/per-view - not
  every word would need an image (see picturability point above), so the
  real number is well under 3014. Gave the user an approximate per-image
  cost range for OpenAI's image API at low/medium quality, flagged that
  exact current pricing should be double-checked against OpenAI's live
  pricing page before budgeting, since it changes over time.
- No code changes made - purely advisory per the user's explicit "qué
  opinas" framing.

## Grammar sentence-ordering (2026-08-16, follow-up to the Vocabulary swap)

User reconsidered declining Grammar exercise diversification and asked for
`SENTENCE_ORDERING` there too, inspired by wanting "more Duolingo-style
practice" (chose this specifically over an adaptive-review-queue fix,
a standalone practice hub, and just adding more reps - all four were
offered as options; see the AskUserQuestion in this session for the
declined alternatives if revisited later).

### Design - reused the Vocabulary swap's lesson, but this is real content authoring ✅ Complete (Claude)
Unlike Vocabulary (auto-tokenized from a word's own example, zero content
risk), Grammar's `Exercise`/`ExerciseOption` rows are real DB content
rendered through `exercise-item.tsx`'s existing (but until now, per its own
doc comment, **never actually exercised with real content**)
`SENTENCE_ORDERING` support - so this was a genuine curriculum content
project, not a mechanical logic swap, and was treated with the same
pilot-before-scaling discipline as the earlier Grammar/Comprehension
overhaul.
- [x] Confirmed via DB query every grammar point with exercises has exactly
  2 (960 total = 480 × 2): a fill-in-the-blank word-choice question and a
  "choose the correct translation" question. Decided to convert only the
  second (translation-recognition, the weaker/more redundant of the two)
  per point, keeping the word-choice check intact - a like-for-like count
  swap, so `computeExerciseScore()`'s dynamic correct/total scoring
  (`reflection.ts`) needed no changes (confirmed this is fully
  content-driven, unlike Vocabulary's separate hardcoded-count formula,
  before writing anything).
- [x] **First pilot run surfaced a real quality bug before any real write**:
  tokenizing against only each lesson's own vocabulary fragmented common
  words taught in *other* lessons (明天, 舒服, 医生) into single characters.
  Fixed by using the curriculum-wide `VocabularyItem` list (3014 words) as
  the dictionary instead.
- [x] **Second pilot pass surfaced a second real bug**: advanced/
  professional-register grammar points (negotiation, academic, formal
  MC-emcee language) have a `structure` field that's really a long fixed
  phrase, not a decomposable word-order rule - tokenizing those produced
  exercises that were mostly stray single characters (low pedagogical
  value; sentence-ordering doesn't add much when the "structure" isn't
  actually about word order). Fixed by computing a dictionary-coverage
  ratio per candidate sentence and requiring ≥60% before converting;
  points below that threshold were left as the existing MULTIPLE_CHOICE
  question instead of forcing a bad conversion.
- [x] Also fixed: the grammar point's own marker (e.g. 首先, 按照) wasn't
  always a `VocabularyItem`, so it could fragment even though it's the one
  thing the exercise is supposed to test - fixed by extracting Han-script
  runs from the `structure` field itself and forcing them into the
  per-point dictionary.
- [x] Applied to the real database: **324 of 480 converted** to
  `SENTENCE_ORDERING` (154 left as MULTIPLE_CHOICE for low dictionary
  coverage - mostly the advanced fixed-phrase patterns above, correctly
  excluded rather than forced; 2 too-short). Deleted the now-unused
  `ExerciseOption` rows for every converted exercise.
- [x] Independently re-verified via fresh DB queries (not the script's own
  printed summary): type distribution is exactly 636 MULTIPLE_CHOICE + 324
  SENTENCE_ORDERING = 960; 0 leftover `ExerciseOption` rows on converted
  exercises; 0 exercises with a missing/too-short `correctAnswer.order`;
  exercise #1 (the kept word-choice question) is still 100%
  MULTIPLE_CHOICE for every converted point; hand-read a random sample of
  5 converted exercises directly from the database.
- [x] **Grading verified end-to-end against real converted content** (not
  just unit-tested synthetic data, since this is this exercise type's
  first real production use anywhere in the app): fed 5 real
  `correctAnswer` values through the actual `evaluateAnswer()` function
  with both the correct order and a reversed/wrong order - all 5 graded
  correctly both ways.
- [x] `tsc --noEmit`/`eslint` clean, full `tests/unit` (419/419) and
  `grammar-interactivity.test.ts` (6/6) pass. Not visually verified in a
  live browser this round either (same tooling limitation as the
  Vocabulary change) - recommend the user try a lesson with a converted
  exercise live.
- [x] One-off scripts (pilot + apply + grading-verification) deleted after
  a clean, verified run.

## Adaptive placement exam (HSK-style) — design phase (2026-08-16)

User wants an entrance/placement exam for the Learning Journey so advanced
learners don't have to redo lessons they already know: adaptive, 5-60 min,
covering Vocabulary/Grammar/Reading/Listening/Speaking, ending early on
repeated failure, extending and climbing difficulty on success, up to
roughly HSK6/~1500 points. **Design and a full sample content preview only
— explicitly not wired into the app or the database.**

### Research: corrected a real factual gap in the user's premise ✅
User believed HSK 3.0's grammar syllabus only existed up through level 3
(rest still on the 2.0 standard). Fetched the actual official syllabus PDF
from 中外语言交流合作中心 (published Nov 2025, updated Dec 2025,
`hsk.cn-bj.ufileos.com/3.0/...pdf`) and read the full grammar appendix
directly (pages 382-406) rather than trusting secondary blog summaries -
**confirmed all 9 levels have a published grammar syllabus**, not just
level 3. Key structural facts pulled directly from the primary source:
- HSK1-6 each have their own versioned grammar table (e.g. 比较句1→2→3→4→5,
  把字句1→2→3→4, 被动句1→2→3 across levels) - this versioning is the natural
  calibration ladder for the adaptive item bank.
- HSK7-9 share ONE combined grammar table and the same 10,896-word
  vocabulary pool - levels 7-9 aren't new content, they're depth/
  sophistication of the same content. This independently validates the
  user's own "up to ~1500 points" ceiling: it lines up exactly with
  `HSK_POINT_THRESHOLDS`' HSK6=1500 boundary and the existing design
  decision (`points_system.md` Part 3) that HSK7-9/1650-2000 points are
  Lab-evidence-only, never lesson- or exam-granted.
- Vocabulary progression confirmed: 300 (HSK1) → 496 (HSK2) → 988 (HSK3) →
  1,978 (HSK4) → 3,557 (HSK5) → 5,334 (HSK6) → 10,896 shared (HSK7-9).

### Key design decisions, in the order they were settled
1. **CAT (computerized adaptive testing) mechanics**: starts at HSK2 (not
   the floor or ceiling), Vocabulary/Grammar/Reading share one adaptive
   engine (interleaved), Listening and Speaking are separate blocks
   calibrated to whatever level the first block already detected (not
   re-adaptive from zero) - real-world precedent: GRE, Duolingo English
   Test, computerized HSK.
2. **Stratified coverage requirement, not bare statistical inference**: a
   pure CAT could infer level-mastery from ~6-8 lucky items. Requires
   instead ≥2-3 correct per lexical/grammar category before crediting a
   level as mastered (~15-20 vocabulary items, similar for grammar
   categories from the real syllabus) - resolves the user's explicit
   concern that "dominar todo el vocabulario" can't mean literally testing
   all 300 words (defeats the point of an adaptive exam) but also can't
   mean a handful of easy lucky guesses.
3. **Vocabulary pool = official HSK list ∪ HanGo's own per-level
   vocabulary**, not the official list alone. Reason confirmed with real
   data, not hypothetical: queried the DB - lessons tagged
   `hskReference = 1` have 330 distinct vocabulary words, and a random
   sample included 惠顾/款式/家具 - none genuinely HSK1-level. Testing only
   the official list would let someone "pass HSK1" and still hit a real
   gap in HanGo's own Foundations content. **Flagged as worth a separate
   content audit later, not addressed now.**
4. **Speaking is architecturally simpler than lesson Speaking, not an
   extension of it**: lesson Speaking is live, bidirectional, real-time
   (VAD, turn-taking, interruption handling - all the machinery tuned
   earlier today). Placement Speaking only needs prompt → recorded
   response → grade, no back-and-forth - much closer to Duolingo English
   Test/TOEFL Speaking than to a role-play conversation. Likely doesn't
   need the live Realtime API's turn-taking complexity at all - could be
   record → STT → text+audio grading, which may be almost entirely
   Claude-buildable; only real-audio pronunciation/fluency grading clearly
   needs OpenAI-side work.
5. **Final result is a per-skill breakdown, never a single number** - the
   same recognition-vs-production gap already found for Vocabulary earlier
   today applies at the exam level: someone can ace HSK4 multiple-choice
   and still only produce HSK2 speech. Speaking's detected level should
   gate Speaking-lesson placement specifically, not get averaged away by
   the other 4 skills.
6. **Placement never directly grants ~1500 points** - only unlocks/skips
   content; points are still earned by completing what gets unlocked. This
   preserves `points_system.md`'s explicit design principle ("nothing lets
   one lucky attempt inflate a learner's level") rather than contradicting
   it.

### Deliverable: full sample content preview (Artifact, not app code)
Published as an artifact rather than only in chat, since the user wanted
to review the whole thing at once: **[Examen de Colocación](https://claude.ai/code/artifact/615fd079-f123-4f95-93e3-442444bf94c8)**.
Contains:
- The adaptive flow diagram and stratified-coverage rules above.
- The vocabulary reconciliation table + the real 惠顾/款式/家具 finding.
- **HSK1 full stratified sample**: vocabulary across all 4 lexical
  categories, 5 grammar items across real syllabus categories (能愿动词,
  是字句1, 疑问代词, 量词, 动作的态), a reading passage, a full listening
  dialogue (no visible text, matching the existing Comprehension-step
  pattern), and 2 speaking prompts with grading notes.
- **HSK2 full sample**: same structure, includes a worked example of a
  learner acing a harder 比较句1 variant and skipping straight to 比较句2
  (HSK3) - shows the adaptive skip-ahead-within-a-level mechanic
  concretely, not just described.
- **HSK3-6 progression preview** (lighter, explicitly not exhaustive - a
  full bank across all 6 levels would be its own content project at the
  scale of today's earlier Grammar/Comprehension overhaul): 把字句1,
  被动句1, 反问句, double negation, 被动句3, 把字句4, one example each,
  showing real difficulty escalation via the official syllabus's own
  versioning.
- Final-result mapping table (per-skill HSK level → what it controls in
  the app) and the Claude-buildable-now vs. needs-live-audio-work split.

### Explicitly not done in the design-preview pass (superseded below)
- [x] No database schema, no `Exercise`/`VocabularyItem` rows written. →
  **Done in the real build, see next section.**
- [x] No UI/route/component built. → **Done in the real build.**
- [ ] No real content audit of the official HSK1-9 vocabulary syllabus
  pages (only the grammar appendix was read in full; the vocabulary list
  itself is elsewhere in the same 406-page PDF and would sharpen the
  reconciliation in decision 3 above when this moves to implementation).
  Still not done - the real build's HSK1-2 vocabulary was authored from
  established HSK1-2 word knowledge, not cross-checked word-by-word
  against the official vocabulary syllabus pages.
- [x] HSK3-6 item bank is a preview sample, not a complete stratified bank.
  → Still true - the real build below is **HSK1-2 only**, by explicit
  user choice (see the scoping question asked before starting).

## Adaptive placement exam — real build, HSK1-2 pilot (2026-08-16)

User chose to actually build it, scoped via two upfront questions: **(1)
HSK1-2 pilot first**, not all 6 levels at once - validate the whole
mechanism before authoring 4 more levels of content; **(2) Speaking
deferred** - build the other 4 skills now (fully Claude-buildable), write
the Speaking spec for the OpenAI session below instead of building it.

### Schema ✅ Complete
Migration `20260816203451_add_placement_exam`. New models, deliberately
separate from `Exercise`/`Dialogue` rather than reusing them (see the
schema's own doc comment for why): `PlacementQuestion` (skill/hskLevel/
category-tagged item bank), `PlacementQuestionOption`,
`PlacementListeningScript`/`PlacementListeningLine` (mirrors Dialogue/
DialogueSpeaker/DialogueLine, including today's gender-aware `voice`
override), `PlacementSession` (per-skill result, never a single number),
`PlacementAttempt`. One line added to `User` (`placementSessions`
relation) - everything else is net-new, zero risk to existing models.

### Adaptive engine ✅ Complete - `src/lib/placement-exam.ts`
Pure, DB-free functions implementing every design decision from the
preview pass: `MASTERY_THRESHOLD_PER_CATEGORY = 2` (stratified coverage,
not bare inference), `EARLY_CUTOFF_STREAK = 3` within
`EARLY_CUTOFF_WINDOW = 10` questions, contiguous-from-level-1 mastery
(`currentSkillLevel` can't skip a gap), `selectNextCategory` (targets
whichever category is furthest from the threshold, for balanced
coverage). 16 unit tests (`tests/unit/placement-exam.test.ts`), all
synthetic/isolated from real content.

### Item bank ✅ Complete - 78 real questions, HSK1-2
`scripts/seed-placement-exam-hsk1-2.mjs` - **kept in the repo, not
deleted** (unlike this session's earlier one-off DB-fix scripts): this is
original content authoring, the re-creatable source of truth for what's
in the DB, not a disposable one-time mutation. Re-running it without
clearing existing rows first would duplicate the bank - not currently
guarded against, since it's only ever been run once so far.
- Vocabulary: 32 (4 lexical categories × 4 items × 2 levels).
- Grammar: 30 (5 categories per level, grounded in the real official HSK
  3.0 syllabus category names read directly from the PDF: 能愿动词, "是"
  字句1, 疑问代词, 量词, 动作的态 for HSK1; 比较句1, 结果补语1, 动词重叠,
  选择复句, 因果复句 for HSK2).
- Reading: 8 (2 passages × 2 questions × 2 levels).
- Listening: 8 (2 scripts × 2 questions × 2 levels) - speaker voices use
  today's gender-aware convention directly (男→`echo`, 女→`nova`), not
  the old blind alternation.
- [x] Verified via fresh DB queries, not the seed script's own printed
  summary: distribution matches exactly (32/30/8/8=78), every question has
  exactly one correct option among ≥2, all 8 listening scripts have their
  lines, hand-read a random sample.

### Backend (data layer, server actions, audio) ✅ Complete
- `src/lib/placement-exam-data.ts` - `startPlacementSession`,
  `getNextQuestion` (stateless: recomputed fresh from real attempts every
  call, same "never trust cached derived state" discipline as the
  session's scoring code elsewhere), `submitPlacementAnswer` (server-side
  grading only, matches `recordExerciseAttempt`'s "never trust a
  client-supplied isCorrect" convention), `maybeCompleteSession`.
- `src/lib/placement-listening-audio.ts` - same generate-once-cache-
  forever pattern as `dialogue-audio.ts`, confirmed today's caching
  question ("does replay re-bill OpenAI?") stays answered "no" for this
  new content too.
- `src/lib/actions/placement-exam.ts` - thin `"use server"` wrappers,
  matches the established action-file convention exactly.

### A real bug the integration test caught (not the unit tests) ✅ Fixed
First implementation tried to be clever: start the Listening block at
whatever level Vocabulary/Grammar/Reading had already reached, instead of
level 1, reasoning "don't waste time re-testing listening at a level
they've already proven elsewhere." This silently broke the engine's own
contiguous-mastery rule - `currentSkillLevel` requires level 1 mastered
before level 2 counts, but skipping straight to level 2 left level 1
with zero attempts forever, capping `listeningHskLevel` at 0 no matter
how well level 2 went. The 16 unit tests all passed throughout, because
they use synthetic per-function fixtures that never exercised this
specific cross-skill interaction. **Only caught by writing a real
integration test that plays the actual seeded content end to end and
asserting the final result** (`tests/integration/placement-exam.test.ts`).
Fixed by simplifying: Listening uses the exact same `selectNextCategory`
starting-from-level-1 logic as the other 3 skills, no special-cased
shortcut. Re-ran the integration test after the fix to confirm.
- [x] 4 integration test scenarios, all passing against the real seeded
  database (not mocks): answering everything correctly reaches HSK2 in
  all 4 skills; 3 consecutive wrong answers cuts the session within 5
  questions; no question is ever repeated in one session; Vocabulary/
  Grammar/Reading are genuinely interleaved, not answered skill-by-skill.

### UI ✅ Complete, not visually verified live
- `src/components/placement/placement-exam-home.tsx` - one question on
  screen at a time, submit → reveal correct/incorrect → Continue (learner
  controls pacing, no auto-advance), ending in a per-skill result screen
  (never a single number, matching the design decision from the preview
  pass).
- `app/(app)/placement-exam/page.tsx` - inherits the `(app)` layout's
  existing auth gate for free. **Deliberately not added to the primary
  nav** (`src/lib/navigation.ts` - its own doc comment flags that list as
  controlled by `branding.md`, not something to change casually); reachable
  directly at `/placement-exam` for testing. Whether/how it surfaces in
  product navigation is a follow-up product decision, not made here.
- [x] `tsc --noEmit`/`eslint` clean across every new file. Full
  `tests/unit` suite 435/435 (16 new + no regressions - one transient
  worker-pool-contention full-suite failure reproduced the session's
  established flaky pattern, confirmed clean on immediate retry, not a
  real regression). Live dev-server check: `/placement-exam` compiles and
  correctly 307-redirects to `/login` when unauthenticated (confirms the
  whole module graph builds; couldn't click through the actual UI myself,
  no browser-automation tool this session - recommend the user try it
  live signed in).

### What's explicitly still missing (by design, not oversight)
- [x] ~~Doesn't unlock or skip real lessons yet~~ **Reconciled 2026-09-16
  (BASE-02), verified in code:** `src/lib/placement-credit.ts`'s
  `applyPlacementCredit` now writes `LearnerLessonCompletion` +
  `LessonReflectionReport` rows tagged `source: "PLACEMENT"` for every
  in-scope lesson, exactly as designed further below. Superseded.
- [x] ~~HSK3-6 content - this pilot is HSK1-2 only, by choice.~~
  **Reconciled 2026-09-16 (BASE-02), verified in code and against the
  running database:** `PILOT_MAX_HSK_LEVEL` (`placement-exam.ts`) is now
  `9`, and `scripts/seed-placement-exam-full.mjs` seeds 211 questions
  (66 vocabulary + 95 grammar + 28 reading + 22 listening) across HSK1
  through HSK7-9 - confirmed by seeding it into a local ephemeral database
  this session. Superseded.
- [x] ~~Speaking - see the standalone spec immediately below.~~
  **Reconciled 2026-09-16 (BASE-02):** Speaking placement is implemented
  (`speakingCreditedLevel` flows through `src/lib/actions/placement-exam.ts`
  and `placement-credit.ts`). Superseded as "doesn't exist" - note this is
  the same feature `AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md`'s P0-03/SEC-03
  now flags for a different reason: it exists but isn't yet fully
  server-authoritative. That security work is separate and still open.
- [ ] No adaptive-testing telemetry/analytics on real learner attempts
  yet (e.g., are the stratified-coverage thresholds actually well
  calibrated in practice) - would need real usage first.

### Standalone spec for the OpenAI session — Speaking block (not built)
User chose to defer this. Written up now while the rest is fresh, same
pattern as every other OpenAI-facing spec this session:

> The adaptive placement exam pilot (Vocabulary/Grammar/Reading/Listening,
> HSK1-2) is built and working - see `src/lib/placement-exam.ts`,
> `src/lib/placement-exam-data.ts`, `src/components/placement/
> placement-exam-home.tsx`. Speaking was deliberately left out of this
> pass and needs your side specifically.
>
> **Key design point already settled**: placement Speaking should NOT
> reuse the lesson role-play pipeline (`han-realtime.ts`,
> `han-voice-conversation.tsx`) - that's live, bidirectional, turn-taking
> conversation, which a placement exam doesn't need. Placement Speaking is
> closer to TOEFL/Duolingo English Test speaking: play/show a prompt →
> learner records a response → grade it → next prompt. No back-and-forth,
> no interruption handling, no VAD tuning.
>
> Concretely, for each HSK level the exam detects (already have levels
> from the other 4 skills by the time Speaking would run), play/show 2-3
> directed prompts appropriate to that level - example HSK1-2 prompts
> already drafted: "请介绍一下你自己。你叫什么名字？你是学生吗？", "你家有
> 几个人？", "你喜欢做什么？为什么？". Record the learner's spoken
> response, then grade it.
>
> What we need from your side specifically:
> 1. Whether the existing 5-metric Speaking rubric infrastructure
>    (pronunciation, fluency, accuracy, complexity, communication
>    effectiveness - see `reflection-prompt.ts`/`points-system.ts`'s
>    `computeSpeakingConversationScore`) can be reused as-is for grading a
>    single short recorded response, or needs a lighter placement-specific
>    variant (no `vocabularyUsageRatio`/`objectiveCompletionRatio` makes
>    sense here - there's no scenario objective, just "did they produce a
>    coherent, level-appropriate answer").
> 2. Whether pronunciation/fluency grading needs the live Realtime API at
>    all, or whether a simpler record → upload → grade-from-audio-file
>    flow (no live session) is sufficient and cheaper - this is the one
>    piece of the whole placement exam that can't be verified without real
>    audio testing.
> 3. If a learner clearly can't produce speech at the level their
>    Grammar/Vocabulary answers suggested (the recognition-vs-production
>    gap this session found repeatedly today), Speaking's detected level
>    should be allowed to come in *lower* than the other 4 skills - please
>    confirm the grading approach naturally supports that instead of
>    normalizing/averaging it away.

### Live-testing fixes (same day, right after the real build) ✅ Complete
User tested the real pilot live and reported four issues:

1. **Per-question correct/incorrect was revealed immediately** - user felt
   this should only show at the end, like a real exam. Fixed: removed all
   reveal state from `placement-exam-home.tsx` - selecting an option and
   clicking "Next" now submits silently and advances immediately, with
   zero indication of correctness until the final per-skill result screen.
2. **The header showed "Question 2 · Grammar · HSK1"** - exposed the
   exam's own internal skill/level/category targeting, which would let a
   test-taker learn the adaptive algorithm instead of answering honestly.
   Removed entirely.
3. **No timer** - added a live-updating elapsed-time clock (MM:SS) in the
   header, matching the original "5-60 min depending on performance"
   design intent from the preview pass.
4. **Wanted the questions themselves in a readable document to review/edit
   together**, not buried in the seed script or the database - realized
   mid-conversation that `scripts/seed-placement-exam-hsk1-2.mjs` (kept in
   the repo for exactly this reason) already *is* that document, just
   mixed with insertion code. Exported the real, currently-seeded content
   (queried fresh from the database, not re-derived from the script, so
   it's guaranteed to match what's actually live) into **`project/
   placement-exam-questions.md`** - all 78 questions, organized by skill →
   HSK level → syllabus category, options with the correct one marked,
   passages/listening scripts included. Intended as the living
   collaborative surface for reviewing/adding/reordering questions going
   forward - changes there need a follow-up script to apply back to the
   database (not automatic).

Also fixed along the way: **a dev-server-specific bug, not a code bug** -
after adding the new Prisma models, the long-running `next dev` process
kept using its old cached `PrismaClient` singleton (`src/lib/db.ts` caches
it on `globalThis` across hot-reloads by design, to avoid exhausting DB
connections - a very standard pattern, but it means schema changes need a
full process restart, not just a hot reload). Every automated check this
session used a fresh process each time, so it never surfaced there - only
showed up as the live page silently redirecting to `/dashboard`. Found the
stale process via `Get-CimInstance Win32_Process`, restarted it
(`npm run dev`), confirmed clean.
- [x] `tsc --noEmit`/`eslint` clean, full `tests/unit` 435/435 pass.
- [x] ~~Still not personally clicked through the live UI~~ **Reconciled
  2026-09-16 (BASE-02):** superseded by the extensive later authenticated
  walkthroughs documented further down this file (Phase 4C, the 2026-09-13
  bilingual QA closure), long after this specific 2026-08-16-era item.

### Content review round 2 + ordering-question type (2026-08-16) ✅ Complete
User reviewing `project/placement-exam-questions.md` live, requested:
listening pace should differ HSK1 vs HSK2 (not "fast", just less
beginner-slow); opinion on making HSK1 a bit harder; HSK2 reading longer
with a bit more complexity; ordering questions "using grammar and
vocabulary together, a bit intricate"; confirmed no Speaking for HSK1/2.

- [x] **Listening pace fix (code)**: `TtsProvider.synthesize()` gained an
  optional `instructions` param (backward compatible - every existing
  caller keeps working unchanged). `placement-listening-audio.ts` now
  passes level-aware pacing text (HSK1: slow and clear; HSK2: natural
  pace, not rushed), mirroring `describeSpeakingDifficulty()`'s existing
  per-level language for consistency with the rest of the voice curriculum.
- [x] **Ordering-question type (code)**: migration
  `20260816213349_add_placement_ordering_questions` added
  `PlacementQuestionType` (`MULTIPLE_CHOICE`/`SENTENCE_ORDERING`),
  `PlacementQuestion.correctAnswer Json?`, `PlacementAttempt.submittedOrder
  Json?`. Data layer, server action, and
  `placement-exam-home.tsx` all updated end to end (shuffled tokens never
  leak the answer, same convention as `exercise-progress.ts`'s
  `toClientExercise`). `submitPlacementAnswerAction`'s signature changed
  from a bare `optionId` string to a `PlacementAnswer` union - updated the
  integration test's 4 call sites to match; re-ran, all 4 still pass
  against the real seeded (MC-only so far) content.
- [x] **HSK1 difficulty - gave a direct opinion, not just content**: yes,
  worth doing, but by combining two already-taught HSK1 patterns in one
  sentence (real HSK exams vary difficulty within a level this way), not
  by importing HSK2+ vocabulary. Added 3 "combination" MC items + 3
  ordering items to HSK1 Grammar in the document.
- [x] **HSK2 reading lengthened**: added one more clause + one more
  question to each of the 2 existing passages (68a, 70a) - moderate
  increment as asked ("solo un poco"), not another full rewrite.
- [x] **6 ordering items drafted** (3 HSK1, 3 HSK2) - HSK2 ones
  deliberately chain 2-3 grammar patterns per sentence (degree complement
  after a comparison; a 因为...所以 pair with two close/swappable time
  words; modal + verb reduplication together).
- [x] Confirmed: no Speaking content for HSK1/2, unchanged from the
  original scoping decision.
- [x] `tsc --noEmit`/`eslint` clean. Full `tests/unit` 435/435 (1
  transient `env.test.ts` worker-pool failure, confirmed clean in
  isolation - same established flaky pattern, not a regression).
  `tests/integration/placement-exam.test.ts` 4/4 still pass after the
  `PlacementAnswer` signature change.
- [x] ~~Document (89 questions drafted) is now ahead of the database (78
  seeded)~~ **Reconciled 2026-09-16 (BASE-02), verified against the running
  database:** the document/database gap was closed and then some -
  `scripts/seed-placement-exam-full.mjs` seeds 211 questions total,
  confirmed landing in `PlacementQuestion` this session. Superseded.

### HSK3-4 drafted (2026-08-16, same review session) - document only, not seeded
User: "now the difficulty should increase considerably." Drafted a full
HSK3-4 tier into the same document, doc title updated to "HSK1-4 draft" to
reflect the real current scope. 91 new questions (12+12 vocab, 18+18
grammar incl. ordering, 6+6 reading, 4+4 listening) — document total is
now **169 drafted, still only 78 seeded**.

- [x] Grammar categories chosen as HSK3/4's real signature structures,
  straight from the official HSK 3.0 syllabus's own 特殊句型 section (read
  directly from the PDF earlier today, not guessed): HSK3 = 把字句1,
  被动句1, 比较句2, 反问句1, 条件复句 (只要/只有); HSK4 = 把字句2, 被动句2,
  比较句3, 双重否定句, 让步复句 (即使/就是).
- [x] **Deliberately avoided a linguistic ambiguity trap in 被动句2**: 被
  and 叫/让 are largely interchangeable in real Chinese (a register
  difference, not a correctness one) - pitting them against each other as
  "one right, one wrong" would be a disputable distractor, the same class
  of mistake caught and fixed in today's earlier curriculum work (的话/
  如果/要是/万一 conditional cluster). Used only genuinely-wrong
  distractors (把/由/替) for that category instead.
- [x] Reading/Listening content is noticeably more abstract/formal
  (workplace stress and pressure, corporate efficiency, environmental
  policy) instead of just harder vocabulary in the same simple sentence
  shapes - matches the real "初等 (HSK1-3) → 中等 (HSK4-6)" tier boundary
  from the official syllabus, not an invented difficulty curve.
- [x] Listening pace note added inline: HSK3+ uses the same natural pace
  as HSK2 (only HSK1 gets the slowed-down delivery) - the difficulty
  increase is meant to come from content, not from speeding up the audio.
- [x] ~~`PILOT_MAX_HSK_LEVEL = 2` in `src/lib/placement-exam.ts` must become
  `4`~~ **Reconciled 2026-09-16 (BASE-02), verified in code:** it's `9`, not
  just `4` - the full HSK1-9 rollout superseded this HSK3-4-scoped ask.
- [x] ~~Still entirely in the document - zero HSK3-4 rows in
  `PlacementQuestion`~~ **Reconciled 2026-09-16 (BASE-02):** see the 211-row
  confirmation two sections above; HSK3-4 rows are seeded along with every
  other tier. Superseded.

### Full HSK1-9 + timer + trim + Speaking design (2026-08-16, same session) ✅ Complete
User: trim HSK1-2 (exam running long), add a 10s-per-question limit for
HSK1-2, add real conversational Speaking starting at HSK3-4, then continue
through HSK5 and the rest. All landed - **document now covers the full
HSK1-9 range** (`project/placement-exam-questions.md`, 211 questions +
5 Speaking scenarios), still zero rows beyond the original 78 written to
the database.

- [x] **HSK1-2 trimmed**: vocab 4→3 items/category, HSK1's extra
  "combination" grammar category removed (ordering + the new timer already
  cover the harder tier). Net: Vocabulary 32→24, Grammar 39→36 for HSK1-2.
- [x] **10s-per-question timer, HSK1-2 only (code)**: new
  `recordPlacementTimeout()`/`recordPlacementTimeoutAction` record a miss
  with no answer fields when time runs out and nothing was submitted -
  deliberately a separate function from `submitPlacementAnswer`, not an
  optional/empty answer shape. UI: `QuestionCountdown` component, resets
  per question, turns red at ≤3s. If the learner already has a valid
  answer selected/built when time runs out, it's honored (submitted
  normally) rather than punished - only truly-no-answer counts as a miss.
  HSK3+ stays untimed.
  - Hit a real lint rule during this: `react-hooks/set-state-in-effect`
    flagged calling `handleTimeout()` synchronously inside the countdown
    effect body. Fixed by moving the correctness check inside the
    `setTimeout` callback that already existed for the tick-down, instead
    of branching synchronously in the effect - same fix shape as the
    Listening bug caught by the integration test earlier today: trust the
    tooling when it flags something, don't work around it.
- [x] **Full HSK5-9 drafted** (not just HSK5 as literally named - user's
  "y los restantes" covered HSK6 and 7-9 too). Deliberately lighter
  density than HSK1-4 (2-3 categories instead of 4-5) to keep a full
  9-level pass tractable in one session - flagged explicitly in the
  document as "easy to expand once validated," not a permanent ceiling.
  HSK7-9 is one combined section, matching the official syllabus's own
  structure (confirmed earlier today: they share one grammar table and a
  single 10,896-word pool - depth of register, not new content).
  Categories per level, all grounded in the actual official syllabus
  tables read from the PDF: HSK5 = 被动句3, 把字句3, 让步复句(哪怕...也);
  HSK6 = 把字句4 (inanimate-subject 把, genuinely advanced), 条件复句
  (凡是...都/除非...才), 转折复句(虽...但/可/却); HSK7-9 = 比较句5, 选择复句
  (宁可...也不), 递进复句(连...都.../更不用说).
- [x] **Speaking redesigned as real conversation, not prompt-response** -
  reverses this session's earlier recommendation for placement Speaking
  (simple record→grade prompts), per explicit user direction. Drafted 5
  full scenario specs (HSK3 through HSK7-9), same shape as lesson
  role-play (`aiRole`/`learnerRole`/`scenarioContext`/`objective`) so they
  plug into existing Realtime pipeline conventions rather than inventing a
  new format. Confirmed: still no Speaking below HSK3.
- [x] `tsc --noEmit`/`eslint` clean across all code changes. Full
  `tests/unit` 435/435 pass. Did not re-run the ~2.5min placement-exam
  integration test this round - the timer/timeout code path is additive
  (new function, new action) and doesn't touch the adaptive engine or
  grading logic the existing 4 integration tests already cover; HSK5-9
  content isn't seeded so there was nothing new for them to exercise.
- [x] **Speaking Realtime/UI/evaluation implemented by OpenAI** - five
  authored HSK3â€“7-9 scenes now run through the shared live role-play
  pipeline; DB persistence remains the explicitly separate migration below.

### Updated standalone spec for the OpenAI session — Speaking (supersedes the earlier draft above)
> Update to the placement-exam Speaking spec from earlier today: the user
> has since decided Speaking should be **real conversation starting at
> HSK3-4**, not the simpler record→grade prompt flow originally proposed -
> please use this version, not the one above.
>
> 5 full scenario specs are drafted in `project/placement-exam-questions.md`
> (the "## Speaking" section, HSK3 through the combined HSK7-9 tier), in
> the exact same shape lesson role-play already uses -
> `aiRole`/`learnerRole`/`scenarioContext`/`objective` - so they should
> plug into the existing Realtime pipeline conventions
> (`buildRealtimeOpeningInstructions`/`buildRealtimeTurnInstructions` etc.)
> rather than needing a new format. Example (HSK3): aiRole "your friend",
> scenarioContext "deciding weekend plans - hiking vs. a movie", objective
> "state a preference with a reason, respond to a counter-suggestion by
> agreeing/compromising/disagreeing politely."
>
> **Scoring/level-climbing mechanism** (filled in, then corrected - user
> first asked "how is the score evaluated in these," then flagged that no
> vocabulary/grammar-usage weighting belongs here at all, since there's no
> "unit" the way a lesson has one):
> reuses `computeSpeakingConversationScore` (`points-system.ts`)
> conceptually but **drops `vocabularyUsageRatio` entirely** -
> `speaking_0_100 = base_average (5-metric rubric) × objective_completion_ratio`,
> nothing else. `objective_completion_ratio` grades whether the learner
> accomplished the conversational task (stated a preference, responded to
> pushback, etc.) - not which words they used to do it, since a placement
> scenario has no taught word list to check engagement against the way a
> lesson does. Whether the language was actually *at* the target level is
> `complexity`'s job (already inside `base_average`), not a separate
> multiplier. Start at the lowest level Vocabulary/Grammar/Reading/
> Listening suggested; run that level's scenario; **≥70/100 (same passing
> threshold as lesson Reflection)** → confirmed, move up one level and
> repeat to HSK7-9; **<70** → stop, last passing level is the Speaking
> result. Same climb-while-passing shape the other 4 skills already use,
> just a score threshold instead of discrete right/wrong. Full detail in
> `project/placement-exam-questions.md`'s "How a conversation's grade
> becomes a Speaking HSK level" section.
>
> What we need from your side:
> 1. Wire these 5 scenarios into a placement-specific Realtime session
>    (reusing `buildConversationCompletionTool`'s pattern for objective
>    completion, adapted to grade against the specific bullet points in
>    each scenario's objective, not just "did the conversation feel done").
> 2. Confirm/tune with live audio whether 3-5 turns is enough to reach a
>    real placement decision for each level, especially distinguishing
>    HSK5 vs. HSK6 vs. HSK7-9 - these get progressively more abstract/
>    concessive in the scenario design, but that needs verification with
>    real speech, not just text review.
> 3. Verify the 70/100 threshold actually discriminates well in practice
>    with real audio - it's borrowed from lesson Reflection's passing
>    score, not independently validated for this use case.
> 4. Same recognition-vs-production principle from earlier today applies
>    here too: a learner who aced HSK6 Grammar/Vocabulary multiple-choice
>    may only be able to produce HSK3-4 speech - Speaking's detected level
>    must be allowed to land lower than the other 4 skills, never
>    normalized up to match them.
> 5. No Speaking below HSK3 - confirmed, not an oversight.
> 6. **HSK7-9 is diagnostic only - see below, applies to your Speaking work too.**

### Placement Speaking â€” Realtime implementation (2026-08-16)
- [x] Added the five verbatim scenarios in `placement-speaking.ts`, including
  exact opening/closing lines, observable success criteria and one authored
  in-character counter-suggestion/pushback per band. No Speaking below HSK3.
- [x] Reused `HanVoiceConversation` + the existing private completion planner;
  lesson Speaking remains timer-owned, while placement opts into objective
  completion with a 2â€“5 learner-turn evidence window and a 4-minute ceiling.
- [x] Added the placement-only score: five-metric base average Ã— objective
  completion ratio, with no vocabulary-usage multiplier; â‰¥70 climbs, <70
  stops. HSK7-9 is displayed as diagnostic and real credit remains capped at
  HSK6.
- [x] Live Realtime audio checks: authored openings held exactly; HSK3 closed
  on its third learner turn under the initial 3-turn floor, tuned HSK5/HSK6
  closed naturally after two, and HSK7-9 needed three and scored 85/100. An
  intentionally evasive HSK5 run stayed open through
  the five-turn ceiling and scored 0/100. Raised audio-token ceilings after a
  real truncated closing, preserved both clauses of advanced conditional/
  concessive turns, and made authored assessment closings deterministic.
- [x] `tsc --noEmit`, `eslint`, and full unit suite clean (445/445).
- [x] **Persistence migration (reserved by the handoff spec):** add
  `SPEAKING` to `PlacementSessionStatus` (not `PlacementSkill`, because these
  are not question-bank rows); add `speakingHskLevel Int?` and
  `speakingDiagnosticHskLevel Int?` to `PlacementSession`; add one
  `PlacementSpeakingAttempt` per scenario with `sessionId`, `hskLevel`, exact
  `{role,content}[]` transcript JSON, learner ASR-confidence JSON, the five
  rubric scores, `objectiveCompletionRatio`, final `score`, `passed`,
  `diagnosticOnly`, feedback JSON and timestamps. `maybeCompleteSession`
  should move recognition-complete HSK3+ sessions to `SPEAKING`, and only mark
  `COMPLETED` after the speaking climb stops.
  **Implemented 2026-09-16:** migration
  `20260916153000_add_server_owned_placement_speaking` is applied. The server
  issues each attempt, derives its level and next transition, persists rubric,
  score, pass/fail and final credit, and rejects cross-user access, replay and
  concurrent duplicate claims. `applyPlacementCredit` now accepts only the
  placement `sessionId`. Remaining SEC-03 work is narrower but important:
  transcript/confidence provenance still comes from the browser and must move
  to an authenticated Realtime sideband/monitoring connection before the oral
  evidence is fully authoritative.
- [x] ~~Full signed-in browser pass is externally blocked: Prisma currently
  returns `planLimitReached`~~ **Reconciled 2026-09-16 (BASE-02):** that
  specific plan-limit block is not mentioned in any later session despite
  extensive subsequent authenticated testing; treated as resolved
  infrastructure, not a standing blocker.

### HSK7-9 resolved as diagnostic-only, not real placement (2026-08-16) ✅ Decided
User asked "should we do something for HSK7-9?" - surfaced a real
conflict rather than just adding more content: `points_system.md`
already has a deliberate, user-made rule that HSK7-9 (1650-2000 points)
can only be earned through sustained Writing Lab/Speaking Lab evidence
over time ("2000 must be genuinely hard to reach... no shortcut through
lesson content alone") - a one-time placement exam granting that tier
directly would contradict it.

Presented two options via AskUserQuestion; **user chose "diagnostic
only, doesn't grant real level" (the recommended option)**:
- [x] HSK7-9 questions/scenario still exist and still run in the exam
  (useful signal - shows how far someone's real ability goes) - not removed.
- [x] **The result must be shown to the learner as informational only**
  ("your exam performance reached HSK7-9") - it must never skip lessons
  or credit the 1650-2000 point range. That tier stays exactly as
  `points_system.md` already defined it: Lab-evidence-gated, no exam
  shortcut.
- [x] Documented in `project/placement-exam-questions.md` (prominent ⚠
  note near the top, plus a note in the Speaking level-climbing logic)
  and here, so whoever implements the final result screen/DB sync gates
  this explicitly - extending the same HSK1-6 placement logic naively
  upward to HSK7-9 would be the wrong default and needs to be caught at
  implementation time, not just at content-authoring time.
- [x] Result-screen logic now keeps HSK7-9 Speaking diagnostic-only and caps
  credited Speaking at HSK6. DB sync remains pending in the explicit
  persistence migration above.

### How placement results become real Learning Journey credit (2026-08-16) ✅ Decided, design only
User: "cuando un usuario alcance HSK2, podrá seguir sumando puntos, o es
como si ya le hubieran calificado algunos learning journey?" - the earlier
"placement unlocks/skips content, points still earned by completing it"
line (this session's original scoping decision) was real but too vague to
implement - this fills in the actual mechanism. Presented 3 options via
AskUserQuestion; **user chose full automatic credit (the recommended
option)**, not "unlock only, still must complete" or a partial-credit
hybrid.

**The key finding: no new scoring formula is needed - the existing
Reflection pipeline already has the right shape to receive placement-exam
evidence instead of lesson-attempt evidence.**

- [x] **Which lessons get auto-credited**: every lesson whose
  `Lesson.hskReference` is ≤ the learner's placed level - using the
  **lowest of the 4 (or 5, once Speaking ships) skill placements**, not
  the highest, consistent with the existing "never place above what's
  weakest" principle already used for Speaking vs. the other 4 skills.
  Excludes HSK7-9 entirely per the diagnostic-only decision above.
- [x] **How the score is computed**: create a real `LearnerLessonCompletion`
  + `LessonReflectionReport` row per auto-credited lesson, exactly like a
  genuine completion - but populate the 4 sub-scores from the exam instead
  of from that specific lesson's own attempts:
  - `vocabularyScore` / `grammarScore` ← the exam's Vocabulary/Grammar
    performance at that lesson's HSK level (category-mastery ratio,
    normalized to 0-100).
  - `comprehensionScore` ← a blend of the exam's Reading + Listening
    performance (lessons' own Comprehension step already tests listening
    then reading together, per the 2026-08-08 redesign found earlier this
    session - so blending the exam's two into one proxy matches how
    Comprehension already works, not a new concept).
  - `speakingScore` ← the exam's Speaking result **at that specific
    lesson's level**, which may be lower than the other 3 (the
    recognition-vs-production gap) - a lesson above the learner's
    demonstrated Speaking level correctly gets a weaker `speakingScore`
    even if Vocabulary/Grammar/Reading/Listening are strong, since
    Reflection's 4 components are already independently weighted
    (`REFLECTION_WEIGHTS`, `points-system.ts`) - no redesign needed, this
    just feeds real numbers into a formula that already handles uneven
    skills correctly.
  - Then `computeReflectionTotal()` →
    `computeWeightedReflectionAverage()` → `computeScenarioEarnedPoints()`
    run completely unchanged - the existing General Level pipeline, just
    fed exam-derived sub-scores instead of lesson-attempt-derived ones.
- [x] **Why this doesn't violate "no lucky attempt inflates level"**
  (`points_system.md`'s own design principle): that principle targets a
  *single scenario/attempt* inflating overall level. The placement exam's
  stratified-coverage design (≥2 correct per category across many
  categories, HSK1-2's 10s time pressure) is broad, repeated evidence
  across dozens-to-hundreds of data points, not a lucky single attempt -
  philosophically consistent with the principle, not an exception to it.
- [x] **Redo behavior falls out for free, mechanically** - if a learner
  later actually completes one of these placement-credited lessons for
  real, it writes a new `LessonReflectionReport` the normal way - already
  replaces rather than stacks, per the existing redo mechanism (this
  session's very first round of work: "a completed lesson shows read-only
  results with Try Again"). No special-casing needed for "real completion
  overrides placement-derived completion."
- [x] **But it needs to be a visible, deliberate option, not just an
  incidental side effect** (2026-08-16 follow-up: "dale la opción también
  que si se quiere mejorar el puntaje, que haga la lección") - a learner
  who never touched a lesson has no reason to think to click "Try Again"
  on it, so the mechanism existing isn't enough on its own. Needs a
  **visible marker distinguishing placement-derived completions from real
  ones** - e.g. a `source: "PLACEMENT" | "COMPLETED"` field on whichever
  record drives the Learning Journey's completed-lesson UI
  (`LearnerLessonCompletion` and/or `LessonReflectionReport`, whichever
  the scenario/lesson cards actually read from). When `source ===
  "PLACEMENT"`, the lesson card should show a distinct badge (e.g.
  "Colocado por examen") instead of the normal "Completed" state, plus an
  explicit nudge - "Complete it yourself to confirm or improve your
  score" - rather than looking identical to a lesson the learner actually
  did. Once redone for real, `source` flips to `"COMPLETED"` and the badge
  disappears - same one-way transition the existing redo mechanism
  already has, just also clearing this new marker.
- [x] ~~Not implemented - design only.~~ **Reconciled 2026-09-16 (BASE-02),
  verified in code:** implemented exactly as designed here, in
  `src/lib/placement-credit.ts`'s `applyPlacementCredit(userId, sessionId,
  ...)`. Superseded. Needs: a new function (e.g.
  `applyPlacementCredit(userId, sessionId)`) that reads the completed
  `PlacementSession`'s per-skill levels, finds every in-scope lesson, and
  writes the completion + report rows described above (tagged
  `source: "PLACEMENT"`). Natural home: `src/lib/placement-exam-data.ts`
  or a new `placement-credit.ts`, called once from wherever the result
  screen currently just displays the levels (`maybeCompleteSession`
  already computes them - this would be a second step after that, not a
  change to it). The Learning Journey lesson-card components (whatever
  currently reads `LearnerLessonCompletion`/`LessonReflectionReport` to
  render a lesson as done) also need the badge/nudge treatment above.

## Placement exam — full HSK1-9 sync ("ahora si realiza el examen")

> 2026-08-16. Everything up to this point in the placement-exam arc had
> been designed in `project/placement-exam-questions.md` and, for Speaking/
> credit-application, in this file - but the database still only had the
> original 78-question HSK1-2 pilot seeded, and the engine's ceiling
> (`PILOT_MAX_HSK_LEVEL`) was still hardcoded at 2. This turns the fully
> drafted HSK1-9 exam into a real, live, playable system.

- [x] **Wrote `scripts/seed-placement-exam-full.mjs`**, a straight
  transcription of `placement-exam-questions.md`'s 211 questions (66
  Vocabulary + 95 Grammar [77 MC + 18 SENTENCE_ORDERING] + 28 Reading + 22
  Listening, HSK1 through HSK7-9). Replaces
  `scripts/seed-placement-exam-hsk1-2.mjs` (deleted - its 78-question,
  MC-only, HSK1-2-only content was stale: HSK1-2 itself had since been
  trimmed from 4 items/category to 3, and the ordering question type
  didn't exist yet when it was written).
- [x] **Dry-run guard before touching the database** (`DRY_RUN=1`
  env var short-circuits to counting the in-memory question objects, no DB
  writes) - counted 66/95(77+18)/28/22 = 211, an exact match to the
  document, before any destructive operation ran. Same pilot-before-mass-
  apply discipline used throughout this session's other content work.
- [x] **Destructive DB sync, done with explicit user consent** (the
  permission classifier itself flagged `placementAttempt`/
  `placementSession`/`placementQuestion.deleteMany()` as destructive and
  blocked the first attempt - correctly, since it clears existing data;
  explained why to the user - the old 78 questions no longer match the
  trimmed/expanded document - and got explicit go-ahead before re-running).
  Cleared 78 questions + 1 session + 12 attempts (the user's own earlier
  live-testing session, not real user data), then seeded all 211.
- [x] **Verified with fresh DB queries after seeding**, not just the seed
  script's own printed summary (this session's standing discipline): a
  `groupBy` on skill/hskLevel/type matched the document's per-level
  breakdown exactly; 0 SENTENCE_ORDERING questions missing
  `correctAnswer`; 0 MULTIPLE_CHOICE questions with no option flagged
  `isCorrect`; 22 `PlacementListeningScript` rows (one per Listening
  question, as expected).
- [x] **Raised `PILOT_MAX_HSK_LEVEL` from 2 to 9** (`src/lib/placement-
  exam.ts`) - seeding HSK3+ content alone wouldn't have made the adaptive
  engine use it, per the document's own ⚠ scope note. HSK7-9 stays
  diagnostic-only per the earlier decision - the engine still climbs
  there (informational), but nothing downstream should treat it as real
  placement/credit.
- [x] **`placement-exam-home.tsx`**: extended `HSK_LABEL` for levels 3-9
  (7 = "HSK 7-9", the DB's combined-tier bucket); added a
  `DIAGNOSTIC_ONLY_LEVEL` banner on the result screen so a learner who
  reaches HSK7-9 sees "shown for your reference only" rather than
  believing they just earned 1650-2000 points; corrected the doc comment
  and the bottom caption, which still said "pilot (HSK1-2 only)".
- [x] **Fixed the connection-string bug the new seed script surfaced**:
  `import "dotenv/config"` only loads `.env`, which doesn't exist in this
  project - the real file is `.env.local` (see `prisma.config.ts`'s own
  `config({ path: ".env.local" })`). The old seed script had the same bug
  but had never been re-run since the DB connection was originally set up
  in-session; this one hit it immediately as `ECONNREFUSED`. Fixed by
  matching `prisma.config.ts`'s explicit-path convention instead of the
  implicit default.
- [x] **Updated `tests/integration/placement-exam.test.ts`** for the new
  ceiling and content shape:
  - Full-correct-answers test now expects level `7` (not `2`) in all 4
    skills - `7` is the DB's HSK7-9 bucket, the real ceiling now.
  - The answer-submission helpers (`submitCorrect`/`submitWrong`) now
    branch on `question.type` - the old helpers assumed every question was
    MULTIPLE_CHOICE (`options.find(...)`), which breaks against
    SENTENCE_ORDERING questions (empty `options`, answer key lives in
    `correctAnswer.order` instead). Wrong-answer submission for ordering
    questions just reverses the correct order.
  - Raised the full-correct-run guard/timeout (400 iterations / 300s,
    from 300/90s) - the real item bank is ~2.7x bigger than the original
    78-question pilot, so a full correct run now needs roughly
    130-150 questions instead of ~24-40 to reach the ceiling across
    Vocabulary + Grammar + Reading + Listening.
- [x] **Fixed one unit test that broke from the ceiling change**:
  `isAdaptiveBlockComplete`'s "reaches the ceiling" test built a fixture
  whose `CATEGORIES_BY_LEVEL` only defines levels 1-2, then called the
  function with no explicit `maxLevel` - which used to default to 2
  (matching the fixture) but now defaults to 9 (the real engine's
  ceiling), so the fixture's level-2 mastery no longer looked "complete."
  Fixed by passing `maxLevel: 2` explicitly - the test is about the
  fixture's own ceiling, not the engine's real-content default.
- [x] **Full verification**: `tsc --noEmit` clean, `eslint` clean on every
  touched file, all 16 placement-exam unit tests pass, full unit suite
  435/435 (one unrelated `env.test.ts` timeout was a pre-existing flake
  under full-suite parallel load - passes standalone), placement-exam
  integration suite re-run against the real seeded HSK1-9 content.
- [x] ~~Still not in scope for this pass~~ **Reconciled 2026-09-16
  (BASE-02):** both `applyPlacementCredit` and Speaking are implemented now
  (see the reconciliation notes above/below this section). Superseded.

### Live-testing bug: "no me das opciones en ninguna" (options missing on every question)

> 2026-08-16, immediately after the sync above. User hit
> `/placement-exam` live and every question rendered with the
> tap-to-order UI (empty tile pool, no MC buttons) - including plain
> MULTIPLE_CHOICE questions like "我＿说一点儿中文。" The first question
> ("医院" means:) had already timed out with nothing clickable before the
> user could even respond.

- [x] **Ruled out a data bug first**: queried the exact question directly -
  `type: "MULTIPLE_CHOICE"`, 4 options, one flagged `isCorrect`. Correct
  in the database.
- [x] **Ruled out a logic bug next**: called `getNextQuestion()` directly
  (same function the app uses, bypassing HTTP) via a throwaway vitest
  test - returned `type: "MULTIPLE_CHOICE"` correctly for the same
  question. Correct in the server-side data layer.
- [x] **Found it by testing the actual Server Component -> Client
  Component boundary over real HTTP** (created a temp test user, signed
  in via NextAuth's credentials flow with curl-style fetch, hit
  `/placement-exam` for real): the RSC payload sent to the browser had
  `"type":"$undefined"` - every OTHER field (`id`, `skill`, `hskLevel`,
  `category`, all the MC `options`) was correct, only `type` specifically
  came through as `undefined`.
- [x] **Isolated the cause via bisection**, not guesswork - built a
  minimal debug route to test each layer in isolation: a plain object
  with a `type` key survived Server Component -> Client Component props
  fine; the same object survived a `"use server"` action call fine; the
  exact real `PlacementActionResult<{sessionId, question}>` nested shape
  survived fine. Every synthetic reproduction worked. Only the real
  `/placement-exam` route, hitting the real `getNextQuestion`/
  `toQuestionView` path, showed the bug.
- [x] **Root cause: stale `next dev` process state**, not a code bug -
  same underlying class of issue as the earlier-documented "Prisma
  Client singleton doesn't pick up new models without a restart" bug,
  just manifesting differently. This dev server had been running through
  an unusually large number of schema/data changes this session (the
  `type` column's own migration, then today's full delete+reseed of all
  211 questions). Restarted `next dev` clean; re-ran the exact same real
  HTTP reproduction against the fresh process - `"type":"MULTIPLE_CHOICE"`
  came through correctly on the first try. Confirmed via the actual
  `/placement-exam` route, not just the synthetic debug route.
- [x] **Cleaned up all debug scaffolding** afterward - the temporary
  route, client component, server action, and throwaway scripts used to
  bisect this were all deleted once the root cause was confirmed.
- [x] **Found and fixed a second, real bug while investigating**:
  `startPlacementSession()` created a brand-new `PlacementSession` row on
  *every* call, and `page.tsx` calls it on every page load - so simply
  reloading the browser mid-exam silently discarded all progress and
  restarted at question one, with no warning to the learner. Fixed to
  find-or-resume the caller's existing `IN_PROGRESS` session first,
  falling back to creating a new one only if none exists. Added an
  integration test (`"resumes an in-progress session instead of starting
  a new one"`) covering both the resume case and the "starts fresh once
  the prior session is COMPLETED" case.
- [x] **Cleared the one real session the bug had corrupted** (the
  user's own live-test session, 1 timeout-forced-wrong attempt on the
  very first question, caused by the stale-server bug, not a real
  answer) - deleted rather than left half-broken, so their next attempt
  starts clean.
- [x] Full verification re-run after both fixes: `tsc --noEmit` clean,
  `eslint` clean, placement-exam integration suite green (including the
  new resume test).

### Live-testing fix: Reading/Listening passages re-appearing mid-exam

> 2026-08-16, same live-testing session. User: "para el reading podria
> ser dar un minuto [luego corregido a dos minutos] y contestar todas las
> preguntas de manera seguida, ahora está me aparece una pregunta, luego
> me aparecen 2 mas de gramatica, y luego vuelve a aparecer el mismo
> texto" - the interleaved adaptive block (Vocabulary/Grammar/Reading)
> serves one question at a time per skill, so a passage's 2-3 questions
> got scattered across the session with unrelated Grammar/Vocabulary
> questions in between, forcing a re-read of the same passage each time.
> User confirmed Listening has the identical problem with its re-used
> scripts ("y lo mismo debe ser para el listening, claro").

- [x] **`PlacementQuestionView.questionGroup`** (`placement-exam-data.ts`):
  new field, `{id, prompt, options}[] | null` - populated with every
  other still-unattempted question sharing the same passage (Reading) or
  audio script (Listening), the current question included. Null for a
  lone remaining question in a passage/script (falls back to the normal
  single-question flow) and for Vocabulary/Grammar.
- [x] **Grouping key**: Reading compares `passage` (exact string match -
  the seed data duplicates the same passage text across sibling
  questions, same pattern as the original 78-question script). Listening
  has no equivalent single string field, so `listeningFingerprint()`
  builds one by joining each line's `speaker:chineseText` in order -
  two questions belong to the same script iff their lines match exactly
  (true by construction, since the seed data duplicates the same lines
  across every question about one script).
- [x] **`buildReadingBlockView()` / `buildListeningBlockView()`** wire
  this into `getNextQuestion()` - Reading in the interleaved block,
  Listening in its own post-adaptive-block section. Both replace the old
  bare `toQuestionView(...)` return for their skill.
- [x] **`submitPlacementQuestionBlock()`** (renamed from an initial
  Reading-only `submitPlacementReadingBlock` once Listening needed the
  identical logic) - submits every answer in a group as its own
  `PlacementAttempt` row, same grading as a single MULTIPLE_CHOICE
  answer; `optionId: null` records a timeout miss for a question the
  block's timer ran out on before it was answered.
  `submitPlacementQuestionBlockAction` is the server-action wrapper.
- [x] **UI** (`placement-exam-home.tsx`): grouped questions render the
  shared passage/audio once, then every sub-question with its own
  MC options and independent selection (`groupSelections`, keyed by
  questionId), a caption confirming what's being asked ("Answer every
  question about this passage/audio, then submit them all together" -
  satisfies the user's "te avisa que se trata de reading" request without
  reintroducing the hidden skill/level/category metadata), and one
  submit button enabled once every sub-question has a selection.
- [x] **2-minute block timer** (`GROUP_TIME_LIMIT_SECONDS = 120`,
  HSK1-2 only, same level gate as the existing single-question timer) -
  `QuestionCountdown` fixed to render real MM:SS (`0:{secondsLeft}` broke
  once seconds could exceed 59). `handleGroupTimeout` submits whatever
  was answered and records a miss for anything still blank, mirroring
  the single-question timeout's "honor what's already answered" rule.
- [x] **`applyAdvanceResult()` extracted** - the "update answeredCount,
  check COMPLETED, compute Speaking's start level, load the next
  question" tail was about to be quadruplicated across
  handleSubmit/handleTimeout/handleGroupSubmit/handleGroupTimeout; all
  four `AdvanceResult`-returning actions share this one function now.
- [x] **Built concurrently with the other session's Speaking work landing
  in the same files** (`placement-exam-home.tsx`,
  `actions/placement-exam.ts`) - re-read each file fresh before every
  edit and used targeted `Edit` calls scoped to only this feature's own
  code, rather than a full-file rewrite, so neither session's work
  clobbered the other's.
- [x] `tsc --noEmit` and `eslint` clean on every touched file; placement-
  exam integration suite re-run (unaffected by this change at the data
  layer - `submitPlacementAnswer` still grades one question at a time
  regardless of whether the view layer happened to group it with
  siblings, so the existing single-question test helpers keep working
  unmodified).

## Prisma Postgres "Operations" quota hit - blocked the whole app (2026-08-16)

> All the automated testing/seeding/debugging above, stacked on top of
> the concurrent OpenAI/Codex session's own DB usage and the user's live
> testing, exceeded the Prisma Postgres account's 100,000-operation
> quota the same day ("Your account has restrictions: planLimitReached.
> Please contact Prisma support..."). This isn't placement-exam-specific
> - every feature in HanGo shares one Postgres database, so this blocks
> the entire app (login, lessons, everything) until the user resolves it
> in the Prisma Console (plan reset date, upgrade, or support). Not
> fixable from code.

- [x] **Found and fixed 2 real redundant-query bugs in the placement
  exam while investigating** (`advanceAfterAttempt`,
  `actions/placement-exam.ts`): `getNextQuestion` was being computed
  twice per answer (once inside `maybeCompleteSession`'s internal
  completion check, once again by the caller); `session` and `attempts`
  were each fetched twice in the same request. Fixed via optional hint
  parameters (`nextQuestionHint`, `attemptsHint`) - cut real per-answer
  query count from ~14-16 down to ~7-8. Unverified against the live DB
  (Prisma was already blocked by the time this landed) - re-run the
  integration suite once access is restored.
- [x] **User asked for the whole app maximally optimized, not just the
  placement exam** ("quiero que reduzcas al maximo esto en todo
  sentido, examen, lessons del journey to todo"). Since this is
  read-only investigation (no DB access needed to read source code),
  ran 3 parallel audit agents covering Learning Journey/lessons/
  exercises/quizzes, Reflection/Speaking Lab/Writing Lab/Missions, and
  Dashboard/Progress/Review/AI Teacher/streak - same "same data
  refetched more than once per request" bug class showed up repeatedly
  across the whole app, not just placement-exam.
- [x] **Full findings + prioritized fix plan written up in
  `project/db-operations-optimization.md`** (not `TASKS.md` itself -
  this is a forward-looking audit/plan, not a completed-work log entry,
  so it gets its own file). Highlights: `learnerProfile` gets fetched
  3-4 separate times per page load by different consumers across
  *every* authenticated page (not just Dashboard); `getScenarioMastery`
  is computed on every Dashboard load but its result is never actually
  read (dead code); `getOrGenerateLessonReflectionReport` computes every
  sub-score twice when regenerating a stale cached report (~6 duplicate
  queries in one request, the single biggest per-request count found).
- [ ] **Nothing in that document has been applied yet, on purpose** -
  deliberately paused further changes once Prisma got blocked, since
  none of it can be verified against the real database right now, and
  stacking more unverified changes on top of already-unverified ones
  (see the placement-exam fix above) risks conflating "is this a real
  bug" with "is this a lingering effect of the DB still being
  restricted" once it's back. Resume from
  `db-operations-optimization.md`'s "Suggested order of attack" section

## Prisma unblocked - db-operations-optimization.md Tier 1-4 applied and verified (2026-08-19)

> User confirmed the Prisma quota block was resolved. All 4 tiers of
> `project/db-operations-optimization.md` applied and verified against
> the real database (React.cache() for Tier 1/2's per-request dedup, a
> new `src/lib/ttl-cache.ts` in-memory TTL cache for Tier 3's
> cross-request curriculum-metadata caching - see that doc for full
> details, real measured numbers, and why `unstable_cache` doesn't work
> in this repo's test setup). Not re-summarized here - full detail lives
> in that file, which is itself now fully updated with `[x]` status,
> confirmed numbers, and verification notes per tier.

- [x] **Placement exam given its own real operations measurement**
  (`scripts/measure-placement-exam-operations.test.ts`, modeled on
  `scripts/measure-lesson-operations.test.ts` but driving the real
  server actions with `auth()` mocked, after a first version that called
  the lower-level functions directly measured a meaningfully wrong
  number - see that script's own header). One full written attempt
  (Vocabulary/Grammar/Reading/Listening, always-correct, climbs to HSK7
  in all four - 147 questions) measured at **1,412 operations**.
- [x] **Found and fixed the same Tier-3-style caching gap in the exam
  itself** (out of the original audit's scope, surfaced by the
  measurement above): `loadQuestionMetas`/`loadCategoriesBySkillAndLevel`
  (`placement-exam-data.ts`) re-fetched the entire 211-question bank on
  *every question served*. Wrapped in the same `createTtlCache`. Real
  before/after re-measurement: **1,412 → 914 operations, a 35.3%
  reduction**, with no question-bank changes at all.
- [x] **Speaking cost reviewed separately** (not a Prisma "Operations"
  concern at all - real OpenAI Realtime API minutes, a completely
  different budget). Confirmed via the account's own usage that a batch
  of live-voice testing (12 full Realtime conversations + 48 synthesized
  student turns + dozens of `gpt-5-mini` gradings, run by the concurrent
  OpenAI/Codex session without warning the user first) cost real money
  fast. Official OpenAI pricing confirmed live: `gpt-realtime-mini`
  (the model this app's `app/api/han/realtime/route.ts` actually
  configures) $10/$20 per million audio tokens in/out; `gpt-5-mini`
  (grading) $0.25/$2 per million text tokens, matching this repo's own
  `src/lib/ai/cost.ts` table exactly. No official per-minute conversion
  rate is published; third-party measurements cluster around
  $0.02-0.05/min typical, up to $0.18-0.46/min uncached - by that
  estimate, one placement Speaking round (capped `maxSessionMs: 4min`)
  costs roughly $0.06-0.13, and the full 5-level ladder (3→7, if every
  level is passed) roughly $0.30-0.65.

## Placement exam — adaptive engine redesign: level-gate instead of category-exhaustion (2026-08-19) ✅ Decided, design only, FINAL

> User question, after seeing the real 1,412-operation measurement above:
> "no sería la manera correcta" to gate each level with a small,
> fixed-size sample instead of grinding every category to 2-correct
> mastery (potentially exhausting the whole level's bank)? Explored over
> several rounds of concrete, code-accurate traces (real pure-function
> simulations, not hand-waved examples) that went through 2 parameter
> sets before landing here (75% pass threshold, then 1-2 questions/category
> depending on level, before the user asked for 80% + Speaking's threshold
> raised to match, which reopened and re-closed the same margin question -
> see the full back-and-forth in this session's transcript if the
> reasoning behind any specific number is unclear). **Not implemented,
> design only**, same status as the other `✅ Decided, design only`
> sections in this file (e.g. "How placement results become real Learning
> Journey credit" above).

**Current mechanism** (`isLevelMastered`, `placement-exam.ts`): a level
counts as mastered only once *every* one of its categories independently
reaches `MASTERY_THRESHOLD_PER_CATEGORY` (2) correct answers - drawing
fresh, unattempted items from that category for as long as the bank
allows, until either mastered or the category's items run out. Real,
measured cost: 44 Vocabulary + 72 Grammar questions for a learner who
climbs cleanly to HSK7 in both (1,412 operations for the full written
exam, all 4 skills, see the measurement above).

**New mechanism**: ask each of the current level's categories a **fixed
number of times** (2, except Vocabulary HSK5-9 which gets 3 - see below),
then decide pass/fail immediately from that one pass, no retries beyond
that fixed count:

- **Pass threshold: 80%** of that level's questions, correct count
  always `Math.ceil(questionCount × 0.80)` (rounds up, never down, so
  the bar never gets easier by rounding).
- **On pass**: advance to the next level, exactly as today.
- **On fail**: that skill's climb stops permanently for the rest of the
  session - no more questions from that skill, level stays at the last
  one passed. Replaces `shouldCutEarly`'s old "3 wrong in a row within
  the first 10 questions, blended across Vocabulary/Grammar/Reading"
  global check entirely - this per-skill, per-level gate produces the
  same "don't make a clear beginner sit through a long exam" effect,
  faster and more precisely (per skill, not blended).
- **Reading/Listening unchanged** - single-category skills, never had
  the category-exhaustion problem this redesign targets; already
  efficient today.
- **Speaking's pass threshold raised to match: `PLACEMENT_SPEAKING_PASS_SCORE`
  70 → 80** (`placement-speaking.ts`) - the only Speaking-side change:
  its score is already a direct 0-100 value, no rounding subtlety like
  the written skills' category math.
- **Deliberately NOT batching multiple questions into one screen/submission**
  per level, even though that would cut operations further (fewer round
  trips) - considered explicitly, user chose to keep today's "one
  question at a time" interaction instead of trading it for the extra
  savings.
- **HSK7-9-diagnostic-only stays unaffected** - keyed off the per-skill
  level, not the mechanism producing it.

**Final table** (real category counts confirmed from
`project/placement-exam-questions.md`, not assumed; questions/level and
threshold computed from the 80% rule above):

| Level | Vocabulary | Grammar |
|---|---|---|
| HSK1-4 | 4 cat × 2 = 8 questions → need **7/8** | 6 cat × 2 = 12 questions → need **10/12** |
| HSK5-9 | 2 cat × **3** = **6 questions** → need **5/6** | 4 cat × 2 = 8 questions → need **7/8** |

**Why Vocabulary HSK5-9 gets 3 per category, not 2**: with only 2
categories there, `Math.ceil(4 × 0.80) = 4` - needing *every* question
correct, zero margin, right where content is hardest. Caught and fixed
the same way at both the 75% and 80% design passes (this section's
history) - bumping to 3 questions/category there (6 total) brings the
requirement down to a real 5/6 (83.3%), matching the margin every other
level/skill combination gets. Every other skill/level uses 2
questions/category.

**Impact - traced precisely (`node --experimental-strip-types` /
`tsx`-based pure-function simulation of the exact rules above, not
hand-arithmetic - a first hand-computed estimate here was wrong and
corrected after re-tracing), two scenarios:**

- **Ceiling case (climbs cleanly to HSK7-9 in everything)**: Vocabulary
  50 questions (up from 44 - the HSK5-9 bump costs more than the
  HSK1-4 "ask once" saves), Grammar 72 questions (identical to today -
  a perfect scorer under the *old* mechanism never needed retries
  either, so 2-per-category was already what it cost). Combined with
  Reading/Listening's real ~31 (unchanged), total ≈ **153 questions -
  about the same as today's 147, not fewer.** Restoring real margin
  (more questions per category, a stricter 80%) gave back almost
  everything the original "ask once, 75%" draft would have saved for
  this specific case.
- **Realistic/plateau case (clean through HSK1-3, real trouble by
  HSK4-5 - the actual majority of real test-takers, not someone who
  aces every band to HSK9)**: Vocabulary 38 questions stopping at HSK4,
  Grammar 56 questions stopping at HSK4 - **~35% fewer questions than
  the ceiling case**, and unlike today's mechanism, stops there
  permanently instead of continuing to grind exhausted categories or
  fall through into Listening prematurely.

**Honest conclusion, stated plainly to and confirmed by the user**: this
redesign's value isn't "cheaper for someone who aces everything" - the
ceiling case is a wash, because every fix that restored real answering
margin (more questions/category, 80% not 75%) gave back most of what a
more aggressive version would have saved there. The real, durable value
is a **fairer and cheaper exam for a typical learner**: no more grinding
a category you're stuck on, and a skill's climb ends the moment it's
genuinely over instead of continuing inefficiently. That was an explicit
trade-off the user chose (fairness/margin over squeezing the ceiling
case further), not an oversight.

- [x] **Implemented and verified end to end (2026-08-19), same day as the
  design above.**
  - `placement-exam.ts` rewritten to hold **two mechanisms side by side**:
    the original accumulate-to-mastery functions (`isLevelMastered`,
    `currentSkillLevel`, `selectNextCategory`, `MASTERY_THRESHOLD_PER_CATEGORY`)
    kept byte-for-byte in spirit for Reading/Listening, plus new
    level-gate functions for Vocabulary/Grammar (`questionsPerCategory`,
    `levelPassThreshold`, `levelGateStatus`, `currentGatedLevel`,
    `hasGatedSkillStopped`, `nextGatedQuestionTarget`).
    `shouldCutEarly`/`EARLY_CUTOFF_WINDOW`/`EARLY_CUTOFF_STREAK` removed.
    `CategoryProgress`'s leaf value changed from a bare correct-count to
    `{attempted, correct}` (the gate mechanism needs to know when a
    category has received its required number of attempts, not just
    whether it's "mastered") - both mechanisms read from the same
    progress map.
  - `placement-exam-data.ts`'s `getNextQuestion`/`maybeCompleteSession`
    updated to dispatch per-skill (`isGatedSkill`, `currentLevelForSkill`,
    `isBlockSkillDone`, `nextBlockTarget` - new small helpers) instead of
    calling one mechanism uniformly for all 4 skills.
  - `PLACEMENT_SPEAKING_PASS_SCORE` (`placement-speaking.ts`) 70 → 80.
  - **Real bug found and fixed during integration testing** (not caught
    by the 38 new unit tests, which used synthetic single-skill
    fixtures): the interleaving loop only ever tried the single
    least-answered skill each turn, and gave up entirely - falling
    through to Listening - the moment *that one* skill's target category
    had no unattempted items left, even when other block skills still
    had unfinished gates. Harmless under the old mechanism (categories
    rarely exhausted before mastering), but this redesign's much larger
    Vocabulary/Grammar gates (8-12 questions) made Reading's tiny,
    unchanged 4-question HSK1 bank exhaust first routinely, cutting
    Vocabulary/Grammar's climb short (caught by a wrong-everything
    integration test expecting exactly 8 Vocabulary + 12 Grammar
    attempts; got 5 Vocabulary). Fixed by trying every skill with a
    target, least-answered-first, until one actually has an available
    question, instead of only the single top choice.
  - **Verified**: `tsc --noEmit` and `eslint` clean on every touched
    file. 38 new unit tests (`tests/unit/placement-exam.test.ts`, full
    rewrite) passing. Integration suite
    (`tests/integration/placement-exam.test.ts`) rewritten (the old
    "cuts after 3 wrong in a row" test replaced with one asserting the
    new per-skill stop - exactly 8 Vocabulary + 12 Grammar attempts when
    every answer is wrong, matching questionsPerCategory's HSK1 sizes)
    and re-run against the real seeded database, twice, both **5/5
    passing** (~525-560s each - the wrong-answer test alone needed its
    timeout raised 30s → 90s once it started correctly running the full
    gate instead of stopping early, same latency-driven pattern as
    elsewhere this session, not a logic issue).
  - **Re-measured against the real database** (ceiling case - every
    answer correct): 153 questions, **1,485 operations** (139,381 -
    137,896), matching this section's traced ~153-question ceiling
    estimate almost exactly. This confirmed the "ceiling case is a wash"
    conclusion above - it did **not** yet include the early-exit fix
    below, which only helps the failing/plateau case, not the
    all-correct ceiling case (a learner who never gets a category wrong
    always uses every question in the fixed gate regardless of
    early-exit, since the outcome is never decided early when every
    answer keeps being correct).

### Early exit within a level (2026-08-19, same day) - gap the user caught after the measurement above

> User, after the 139,381 measurement: "y por que hiciste todas las
> preguntas, no es que si hacian un numero ya se iba avanzando (o sea no
> debia hacer todo el banco de preguntas)?" - correctly spotted that the
> level-gate redesign above still asked every one of a level's fixed
> questions even when the pass/fail outcome was already mathematically
> certain partway through (e.g. a learner failing every Vocabulary HSK1-4
> question was still asked all 8, when the "needs 7/8" gate is
> arithmetically unwinnable after just 2 wrong answers). The level-gate
> redesign fixed *which* questions get asked (small fixed gate instead of
> grinding a whole category to mastery) but hadn't yet fixed *how many* of
> that fixed gate actually need asking - this closes that gap.

**Fix**: `levelGateStatus` (`placement-exam.ts`) rewritten to resolve
"passed" the moment correct answers alone already clear the threshold, or
"failed" the moment a perfect score on every remaining question still
couldn't reach it - instead of only ever deciding after every category
hits its full required attempt count. `currentGatedLevel`,
`hasGatedSkillStopped`, and `nextGatedQuestionTarget` needed no changes -
they all just consume `levelGateStatus`'s result, so they benefit
automatically.

**Worked example (HSK1-4, every answer wrong)**: Vocabulary (4 categories
× 2 = 8 questions, needs 7) is decided after exactly **2** wrong answers
(0 correct + 6 remaining = 6 < 7, can never reach 7). Grammar (6
categories × 2 = 12 questions, needs 10) is decided after exactly **3**
(0 + 9 = 9 < 10). Neither skill is asked its full fixed gate size once
the outcome can no longer change - this only shortens the failing/plateau
case; a learner who keeps answering correctly still uses the full gate,
since "passed" and "still pending" look identical until the last correct
answer arrives.

**Verified**:
- `tsc --noEmit` and `eslint` clean.
- Unit tests (`tests/unit/placement-exam.test.ts`): fixed one existing
  fixture broken by early exit (`"moves past a category once it has its
  required attempt count"` - its old 2-category/100%-threshold fixture
  meant any wrong answer triggered early-fail before reaching the
  intended assertion; given a dedicated 3-category fixture instead), and
  added 4 new tests under `describe("early exit (2026-08-19)...")`
  covering the exact pending/passed/failed transition points on a
  3-category/6-question/threshold-5 fixture. **42/42 passing.**
- Integration test (`tests/integration/placement-exam.test.ts`, the
  all-wrong-answers case) updated to expect exactly 2 Vocabulary + 3
  Grammar attempts (was 8 + 12 before this fix) with the exact math in a
  code comment. Full suite re-run against the real seeded database after
  a stale `node_modules/.vite` cache caused one unrelated
  `server-only`-import failure on the first attempt (cleared with `rm -rf
  node_modules/.vite`, same known fix used earlier this session) -
  **5/5 passing** (~464s).
- **Not yet done**: real operations re-measurement
  (`scripts/measure-placement-exam-operations.test.ts`) with this fix in
  place - the 1,485-operation ceiling-case number above predates it and,
  per the note there, won't change from this fix anyway (ceiling case
  = every answer correct = early exit never triggers). A real before/after
  number would need to come from the plateau/failing case instead (e.g.
  drive the measurement script with some wrong answers), which the
  existing script doesn't currently do - it only ever answers correctly.

### Live-testing bug (2026-08-19, same day): placement Listening audio always 404'd

User took the redesigned exam live in the browser and reported "el
listening no se escuchó" + "el tiempo corre" (Listening audio never
played, timer kept running). Root-caused, not a flake: `app/api/audio/
[...key]/route.ts` (the authenticated file-delivery route every stored
audio file goes through) only recognized `dialogue-audio/`, `vocabulary-
audio/`, and `grammar-audio/` as shared-content key namespaces. Placement
exam Listening audio (`placement-listening-audio.ts`) stores its files
under `placement-audio/` - a namespace that was never added when placement
Listening shipped (2026-08-16), so every request for it fell into the
route's `else` branch (Speaking Lab's per-learner authorization check,
`speakingAttempt.findFirst`), never found a match, and returned 404 -
**100% of the time, for every user, regardless of whether the file
actually existed on disk** (confirmed: all 37 of the user's real generated
audio files were sitting in `.storage/placement-audio/`, generation/TTS
had worked correctly the whole time - purely an authorization-routing bug,
no wasted TTS cost). This also explains why the user's real live attempt
that day showed Listening stuck at Pre-HSK (0) - every Listening question
was effectively unanswerable.

**Fix**: added `placement-audio/` to `isSharedNamespace` and a matching
case in `isSharedContentKey` (checks `placementListeningLine`/
`placementListeningScript.audioFilePath`, same pattern as the other three
namespaces). `tsc`/`eslint` clean. Not covered by any existing automated
test (no test exercises the API route layer) - verified by inspection (the
exact file from the user's own failed request already existed on disk)
and left for the user to re-confirm live in the browser.

### Batching Vocabulary/Grammar questions per screen (2026-08-19, same day) - further operations reduction

User asked to reduce placement exam operations further after seeing the
real 139,381 measurement. Two options were laid out: (1) dedupe a
redundant `placementSession.findUnique` call `getNextQuestion` and
`maybeCompleteSession` each make independently within one answer cycle
(safe, ~1 op/question, not yet done - see below) or (2) revisit "agrupar
preguntas por pantalla", explicitly rejected during the original level-
gate design ("Deliberately NOT batching... user chose to keep today's
'one question at a time' interaction instead of trading it for the extra
savings"). **User chose option 2** this time, batch size confirmed as 2
after being shown the real tension: batching a skill's *entire* level
upfront maximizes savings for a learner who answers everything correctly.
but defeats the 2026-08-19 early-exit above for a struggling learner
(forces every question in the level to be asked before the block can even
be submitted, since the UI can't stop mid-screen). Batch size 2 keeps most
of the early-exit's benefit (levelGateStatus is still checked *between*
every batch submission, so a struggling learner still gets cut off after
at most one batch past the mathematically-decided point) while still
amortizing the fixed per-question session/attempts/next-question overhead
across 2 questions at a time instead of paying it once per question.

**Scope**: Vocabulary/Grammar only (the level-gate skills). Reading/
Listening's own passage/script-based grouping (`buildReadingBlockView`/
`buildListeningBlockView`) is untouched. **MULTIPLE_CHOICE only** -
SENTENCE_ORDERING questions (18 of Grammar's 95, `scripts/seed-placement-
exam-full.mjs`) never enter a batch, since block submission
(`submitPlacementQuestionBlock`) only carries `optionId`; if the only
available candidate for a target category is one, that question falls
back to being served solo, same as before this feature existed.
Vocabulary is 100% MULTIPLE_CHOICE in the real seeded content, so every
Vocabulary batch is a full 2-question batch in practice; Grammar batches
occasionally shrink to 1 when a SENTENCE_ORDERING question is the only
one left in a target category.

**Implementation**:
- `placement-exam.ts`: new `nextGatedQuestionTargets(progress, skill,
  categoriesByLevel, batchSize, maxLevel?)` - same category-balancing rule
  as the existing `nextGatedQuestionTarget` (fewest-attempted-so-far
  first), generalized to return up to `batchSize` targets, never more than
  `questionsPerCategory` from one category even within a single batch.
  `nextGatedQuestionTarget` (singular) now delegates to it
  (`nextGatedQuestionTargets(..., 1)[0] ?? null`) - existing callers/tests
  unaffected. Added `type` to `PlacementQuestionMeta` (needed to filter
  the batch to MULTIPLE_CHOICE candidates from the already-cached
  in-memory question-bank map, no extra query).
- `placement-exam-data.ts`: `GATED_BATCH_SIZE = 2`. `nextBlockTarget`
  renamed to `nextBlockTargets` (plural) - Reading still returns at most
  one target (its own grouping is separate), gated skills return up to
  `GATED_BATCH_SIZE`. New `fetchQuestionsWithRelations` (one `findMany`
  for several question IDs, replacing what would otherwise be one
  `findUnique` per question) and `buildGatedBatchView`. `getNextQuestion`'s
  interleaving loop tries to fill a batch of MULTIPLE_CHOICE candidates
  across a gated skill's targets, falling back to serving one question
  solo if none of the targets have a MULTIPLE_CHOICE candidate available.
- `placement-exam-home.tsx` (frontend): reused the exact same grouped-
  question UI/submission path Reading/Listening's `questionGroup` already
  has (`submitPlacementQuestionBlockAction`, `handleGroupSubmit`, no
  changes needed there). Two things did need to change: (1) the caption
  above a group now has a 3rd branch ("Answer every question below...")
  for a batch that has neither `passage` nor `listening` - the existing
  copy assumed every group was one of those two; (2) the per-group
  countdown timer - `GROUP_TIME_LIMIT_SECONDS` (120s) was tuned
  specifically for "read a passage/listen to audio, then answer" (its own
  doc comment), not for 2 quick-recall questions, so a gated batch instead
  gets `QUESTION_TIME_LIMIT_SECONDS * groupSize` (20s for 2 questions at
  HSK1-2) instead of the flat 120s.

**Verified**:
- `tsc --noEmit` and `eslint` clean on every touched file.
- Unit tests: 6 new tests for `nextGatedQuestionTargets` (balances across
  categories same as the singular version; caps at `questionsPerCategory`
  within one batch even when `batchSize` is larger; shrinks below
  `batchSize` once a level is nearly exhausted; empty once stopped/ceiling
  reached; singular function's result always matches the batch version's
  first element). **48/48 passing** (`tests/unit/placement-exam.test.ts`).
- Integration: new test batches and submits 2 real seeded Vocabulary
  HSK1 questions together via `submitPlacementQuestionBlock`, confirms
  both land as separate correct `PlacementAttempt` rows. Full suite
  re-run against the real seeded database - **6/6 passing** (~459s),
  including the all-wrong-answers early-exit test **still asserting the
  exact same 2 Vocabulary + 3 Grammar attempt counts as before batching**
  (expected: batching only changes *delivery* grouping, not the
  attempted/correct totals `levelGateStatus`'s arithmetic runs on - the
  test still submits one answer at a time via `submitPlacementAnswer`
  directly, bypassing block submission entirely, which remains a valid
  call pattern).
- **Not yet done**: real operations re-measurement with batching in
  place - would need a fresh before/after Prisma Console Operations count
  from the user, same as every other measurement this session.
- **Also not yet done**: the smaller, safer option (1) from above -
  deduping `getNextQuestion`'s and `maybeCompleteSession`'s independent
  `placementSession.findUnique` calls within one answer cycle (~1
  op/question, ~15-17% on top of whatever this batching change saves).
  User chose to do batching instead this round; this remains available as
  a future small win, additive with batching (they don't conflict).

### Live-testing bug #2 (2026-08-19, same day): stale Listening audio replayed across different questions

After the 404 fix above, user tried the exam again (real result: 35
questions/~7min, Vocabulary HSK2/Grammar HSK1/Reading HSK4/Listening
HSK1, 460 operations) and reported the audio now played, but the *wrong*
audio - a movie-time question and a restaurant question both played what
sounded like an earlier teacher-student introduction script instead of
their own audio.

**Root cause**: `placement-exam-home.tsx`'s Listening `<AudioPlayButton>`
had no `key` prop. Vocabulary/Grammar's own dialogue-example buttons
(`vocabulary-step.tsx`, `grammar-step.tsx`) already key their button's
parent element by the item's id, so a new button instance mounts per
item; the placement exam's Listening button sits at one fixed JSX
position with no such key, so React reuses the *same component instance*
across every Listening question the learner reaches, only updating its
`fetchUrl` prop. `AudioPlayButton` (`audio-play-button.tsx`) caches the
loaded `Audio` element in a `useRef` the first time it's played and never
clears it (`play()`'s `if (audioRef.current) { ...; return; }` branch) -
so every click after the very first Listening question just replayed
that first cached clip, silently ignoring the new `fetchUrl` for every
question after it.

**Fix**: added `key={question.listening.id}` to the button - same
`key`-per-content-identity pattern already used correctly in
`vocabulary-step.tsx`/`grammar-step.tsx`, forces a fresh component
instance (and therefore a fresh `audioRef`) per distinct Listening
script. `tsc`/`eslint` clean. One line, no other files touched. Not yet
re-confirmed live in the browser by the user.

## Task for OpenAI/ChatGPT: tune Han's identity/page-awareness in live use (2026-08-21)

Claude added page awareness to Han's own conversations only - see
[[project_han_persona_scope]] memory for the exact rule: applies whenever
`AiTeacherContext.rolePlay` is **not set** (`buildSystemPrompt` for text,
`buildRealtimeSystemPrompt`'s non-rolePlay branch for voice triggered
from Han's own side panel/button). Speaking Lab, lesson Speaking steps,
and free-topic practice (`rolePlay` always set there, including the
default "AUTO" role) are a deliberately different, unnamed persona and
were **not** touched. Page-name text specifically (`currentPageName`) is
text-chat only (`buildSystemPrompt`) - `buildRealtimeSystemPrompt` never
reads it, voice sessions don't need it (the learner is obviously already
on whatever page triggered the voice session).

**Real live-test bug found and fixed, same day, two rounds**:
1. User asked Han "¿qué es HanGo?" and "¿cuál es tu nombre?" - got an
   answer about Hangeul (the Korean writing system) and "no tengo un
   nombre propio... pero me puedes llamar como más te guste". Claude
   first assumed this was the text-chat path and strengthened
   `buildSystemPrompt`'s identity line - no effect, because...
2. ...the dev server log (`saveRealtimeConversationTurnAction`, `POST
   /api/han/realtime`) proved the user was actually testing **voice**,
   via Han's own panel (response mode TEXT_AND_AUDIO), with no `rolePlay`
   in the logged context - i.e. `buildRealtimeSystemPrompt`'s non-rolePlay
   branch, which Claude had NOT touched yet. Same fix applied there
   (explicit "HanGo, a Mandarin Chinese learning app" definition, hard
   "always answer name as Han" rule, explicit Hangeul disambiguation) -
   confirmed via user's own clarification that voice-from-Han's-panel
   (no character) should identify as Han, unlike Speaking Lab.

Root cause either way: the old identity line never defined what "HanGo"
*is* (only that Han works "inside" it), so the model filled the gap with
a phonetically-similar, better-known term (Hangeul); and a single,
unreinforced "You are Han" line apparently isn't reliably followed by
`gpt-5-mini`/`gpt-realtime-mini` without an explicit hard rule.

Unit-tested (`tests/unit/ai-context.test.ts`, both `buildSystemPrompt`
and `buildRealtimeSystemPrompt`'s non-rolePlay branch, plus a regression
test confirming the rolePlay branch never gains this text).

**Round 3, same day, after the voice fix above: still fails live.** User
tested again via Han's own panel (voice): "Hey, what's your name?" ->
"I don't have a personal name, but you can just call me your assistant."
and "Do you know what Hango is?" -> "Yes, Hangul is the Korean
alphabet..." - the EXACT thing the new instruction explicitly forbids
("never confuse the two"), word for word, right after a confirmed
recompile (dev log shows "Compiled in 2.6s" immediately before these
turns) and with `rolePlay` confirmed absent from the logged context
(`{"currentPageName":"Learning Journey"}`) - i.e. this genuinely went
through the fixed non-rolePlay branch.

**Ruled out before escalating** (so you don't have to re-verify these):
- Wrong API field: confirmed `instructions` inside the `session` object
  is the current, correct field OpenAI's own docs describe for
  system-level behavior in a Realtime session.
- Prompt string not actually containing the fix: confirmed via unit test
  assertions on the literal `buildRealtimeSystemPrompt(...)` output, not
  just visual inspection - the reinforced text is definitely in the
  string handed to `route.ts`.
- Array-assembly bug (a `null`/falsy item silently dropping the identity
  block from `.filter(Boolean).join(...)`): re-read the full function,
  no such bug - the identity block is index 0, always a non-empty string.
- Stale dev server / uncompiled code: ruled out via the compile-then-test
  timing in the log above.

**What's left, and why this is now genuinely your territory**: the
`instructions` field is correctly set with an explicit, direct,
unambiguous rule, and `gpt-realtime-mini` is still not following it -
repeatedly, including doing the literal opposite of what it was told.
OpenAI's own docs have no documented guidance on instruction-following
reliability for this model in Realtime sessions. Diagnosing further needs
either your own knowledge of gpt-realtime-mini/Realtime API quirks, or
live iterative testing (real paid calls) to find a phrasing/structure
that actually sticks - not more unverified prompt-text guessing from
Claude, and not something to keep re-testing on the user's own budget
without a real hypothesis behind each attempt. Worth checking: whether
`instructions` set at call-creation time (this code's approach, in the
initial POST to `/v1/realtime/calls`) is treated as reliably as a
`session.update` event sent after the WebRTC connection is live (OpenAI's
own example for the `instructions` field is a `session.update` event,
not initial call config) - that's a real, testable difference this task
hasn't ruled out yet.

**Resolved by OpenAI/ChatGPT (2026-08-21)**:
- Root cause was the per-turn `response.create`, not the initial
  `/v1/realtime/calls` configuration. OpenAI's Realtime client-event
  reference explicitly says that `response.create` inference fields such as
  `instructions` **override the Session configuration for that response**.
  The Han-panel path sent `buildRealtimeTurnInstructions(...)` this way on
  every accepted voice turn; that shorter turn prompt contained language and
  tutoring rules but not Han's identity/HanGo definition, so it masked the
  correct session prompt every time the learner spoke.
- An extra `session.update` alone would not fix this: its instructions would
  be masked again by the next `response.create.instructions`. The fix keeps
  the original session instructions active, adds the per-turn rules as a
  temporary `system` conversation item, triggers `response.create` without an
  `instructions` override, then deletes the temporary item after
  `response.done`. Scope is Han's own side-panel voice path only; role-play /
  Speaking Lab behavior was not changed.
- Added `buildSessionPreservingRealtimeTurnEvents()` plus a regression test
  proving the generated `response.create` has no `instructions` field.
  `tsc`, targeted ESLint, and 111 relevant unit tests are clean.
- One paid, text-only live session against the exact
  `gpt-realtime-mini` model passed both field reports with the production
  session prompt and per-turn guard: "Hey, what's your name?" -> "My name is
  Han"; "What is HanGo?" -> "HanGo is the Mandarin Chinese learning app...".
  No TTS or audio output was generated. OpenAI's current model catalog now
  marks `gpt-realtime-mini` deprecated; migration is a separate follow-up,
  not part of this bug fix.

**Round 4 correction after another real browser failure (2026-08-21)**:
- The earlier live check was not equivalent to the browser: its WebSocket
  harness explicitly sent `session.update`, while the production WebRTC path
  relied only on the initial `/v1/realtime/calls` form configuration. Saved
  production turns prove the latter answered as ChatGPT three times with no
  text-chat usage row, so this was definitively Han-panel Realtime voice.
- The route now returns the exact server-built session prompt with the SDP.
  Once the WebRTC data channel opens, the client sends that full prompt in an
  explicit `session.update`, keeps the microphone disabled, and starts the
  conversation only after the API confirms `session.updated`. The prior
  per-turn no-override fix remains necessary and unchanged.
- Added a regression assertion for the explicit `session.update` event. The
  previous isolated pass is no longer treated as browser-flow verification.
- `tsc`, targeted ESLint/Prettier, and 112 relevant unit tests pass; the
  existing Next dev server compiled the change and responds on localhost.
  A fresh signed-in browser voice turn remains the final real-audio check.

**Speaking HSK regression found immediately after Round 4 (2026-08-21)**:
- Real saved turn: `Simple Directions` correctly supplied `lessonHskLevel: 1`
  and its vocabulary, but the Passerby opened with only `你好` and then
  improvised `路的右侧 / 穿过 / 小广场` outside the lesson. Context delivery was
  correct; two downstream guards were the fault.
- Normal lesson openings are no longer deterministically collapsed to
  `你好/您好`; authored assessment openings remain exact, while normal lessons
  use one short deterministic cue selected from the character/scenario (for
  example, the `Passerby` in directions now opens with `请说。`).
- Speaking now carries the lesson's already-studied Mandarin sentence bank.
  Direct questions use the private planner's exact grounded answer. For HSK
  1-2, a planned line containing new Han characters is rejected and replaced
  by the most relevant un-repeated studied phrase before Realtime can speak.
- Realtime audio speed is now a real session setting, not prompt-only: HSK 1
  `0.82`, HSK 2 `0.90`, HSK 3 `0.96`, later levels `1.0` (explicit pace still
  wins). The value is applied both at call creation and the confirmed
  `session.update`.
- `tsc`, targeted ESLint/Prettier, and 117 relevant unit tests pass, including
  the exact reported advanced-directions sentence regression.

**Han app-navigation regression fixed (2026-08-21)**:
- A real Han-panel voice turn on `Learning Journey` asked where to start, but
  Han translated the ordinary word "journey" into `旅程`. The saved context
  already contained `currentPageName: "Learning Journey"`; the non-rolePlay
  Realtime prompt simply ignored it and had no functional map of HanGo.
- Han's own text and voice prompts now share a terse app map and hard product-
  name disambiguation. `Learning Journey` questions lead to the chapter marked
  `You are here`, its current scenario, and the available lesson marked by Han;
  product names are not translated unless translation is explicitly requested.
- Scope remains `rolePlay` unset. Lesson Speaking and Speaking Lab receive none
  of this Han identity/navigation text. Regression tests cover both scopes.
- Verified: 50 targeted `ai-context` tests, TypeScript, ESLint, and Prettier
  pass; the running local server responds with the updated build.

**Han skill-to-Journey routing follow-up (2026-08-21)**:
- Real Han-panel voice follow-up asked which Learning Journey teaches ordering
  pizza; Han taught `我想要一份披萨` but never recommended app content.
- Han text/voice now receive the real cached published-scenario catalog
  server-side (names, descriptions, outcomes, and lesson titles). A request
  combining a real-life goal with Learning Journey must recommend the nearest
  real scenario/lesson first, then optionally teach a sample phrase. The exact
  regression maps pizza to `Restaurant` → `Entering and Ordering`; no invented
  Pizza scenario. Role-play/Speaking still receives no Han app catalog.
- Catalog loading is limited to a Learning Journey page/request to avoid adding
  prompt cost to unrelated Han conversations. Verified against the real DB (41
  published scenarios; Restaurant's four real lessons), plus 50 targeted unit
  tests, TypeScript, ESLint, Prettier, and the running local server.

**Han on-demand app context and cost guard (2026-08-21)**:
- Replaced page-triggered catalog injection with a conservative local intent
  gate. Merely visiting Learning Journey, Speaking Lab, Writing Lab, or
  Progress now performs no extra app-data lookup and sends no detailed block.
- Conceptual app questions receive only a short relevant guide. A concrete
  Learning Journey route request loads the cached published catalog; a Progress
  question loads only the requested real block (General Level, competencies,
  exposure, scenarios, or Review). A full snapshot is reserved for an explicit
  request for all results.
- Text adds this context to one request without persisting it. Han-panel voice
  adds it to the existing temporary per-turn system item and deletes it after
  the reply; route changes use the current page. `rolePlay` Speaking remains
  fully excluded.
- Verified: 130 focused unit tests and 11 real-DB Han integration tests pass,
  plus TypeScript and targeted ESLint/Prettier. No paid OpenAI call was used.

**Han panel survives app navigation (2026-08-21)**:
- Root cause was Radix's default non-modal Dialog outside-interaction dismiss:
  clicking Sidebar/BottomNav closed Han before the Next client transition even
  though `AiTeacherProvider` already lives in the shared `(app)` layout.
- Outside interaction now remains usable for navigation without dismissing Han.
  Explicit X/bubble/Escape close behavior is unchanged. Component regression
  covers an outside navigation interaction while the panel is open.

**What exists now**: `AiTeacherContext.currentPageName` (e.g.
"Dashboard", "Settings", "Progress", "Writing Lab", "Speaking Lab",
"Learning Journey") is auto-derived from the route in
`ai-teacher-provider.tsx` (`resolveCurrentPageName`, `lib/navigation.ts`,
matches `primaryNavItems`' hrefs by longest prefix). `buildSystemPrompt`
adds one line: `The learner is currently on the "X" page of the app. Only
mention this if it's actually relevant to answering them - never announce
it unprompted.` Lesson pages resolve to `null` (no page name) since they
already have their own richer `scenarioName`/`lessonTitle`/
`lessonStepType` context.

**What needs your judgment, not Claude's** (real conversational testing,
the reason this is OpenAI's task):
- Does "only mention if relevant, never announce unprompted" actually
  produce that behavior in practice, or does gpt-5-mini over-reference the
  page anyway ("I see you're on Settings!") - tune the instruction wording
  against real replies if so.
- Is a single generic line enough, or does page awareness need to be
  smarter per page (e.g. something page-specific worth knowing on
  Progress vs. Writing Lab vs. Settings) - only add that if real testing
  shows the generic line isn't good enough; don't speculatively expand it.
- Confirm it doesn't fight the existing "no specific lesson is active
  right now" fallback line in `buildLessonContextSection` when the
  learner is on a non-lesson page (both fire together in that case -
  check they read coherently side by side, not redundant/contradictory).

**Temporary lesson-Speaking QA mode (2026-08-21)**:
- [x] Local-development-only `/speaking-test` route opens the exact Realtime
  Speaking step for any published lesson, with lesson picker and previous/next
  controls. It bypasses lesson locks without writing Progress, scores, or
  Reflection transcripts; production returns 404.
- [x] QA lesson sequence now comes from the authoritative Learning Journey
  chapter → scenario → level → lesson order; the picker shows that full path
  and a stable sequence number for precise issue reports.
- [ ] Remove the QA route, its Speaking Lab entry card, and the `testMode`
  presentation branch after the user finishes testing all lesson sessions.

**Speaking Lab: Shadowing + Scenario Role Play locked for Pre-MVP (2026-08-23)**:
- User request: hide these two modes behind a lock icon while the Pre-MVP
  is being assembled — both are fully built and working, this is a
  deliberate temporary release gate, not a bug or missing content.
- `speaking-lab-home.tsx`'s `MODES` config now has `locked: true` on both
  the `SHADOWING` and `SCENARIO_ROLE_PLAY` entries. Locked cards show a
  lock icon, aren't clickable, and read "Coming soon."
- [ ] **Pending**: unlock by flipping `locked: true` → `false` (or removing
  the field) on both `MODES` entries in `speaking-lab-home.tsx` once
  Pre-MVP scope opens up to include them. No other code change needed.

## Premium gamified UX/UI redesign (2026-08-27, plan approved, execution starting)

User briefed this as a Senior Product Designer + Senior Frontend Engineer
task: transform HanGo from feeling like a traditional educational web app
into a premium, mobile-first, gamified learning app — onboarding, Learning
Path, Lesson Player, feedback, gamification, mascot, micro-animations.
Explicit guardrails: don't touch AI Teacher logic, HSK content system,
existing APIs, auth, or database architecture beyond small additive
changes. Don't copy any external app literally — take UX principles only.

**Full private plan (context, current-state audit with file:line
citations, and the 7-milestone breakdown) lives at
`C:\Users\arean\.claude\plans\vectorized-jumping-fox.md`** (Claude Code's
own plan-mode file — not readable by other tools working on this repo,
hence this summary here). This section is the shared, repo-visible
reference for anyone (Claude, Codex, a human) picking up this work.

**Audit finding, important**: the codebase was already in better shape
than the brief assumed — a real working dual-theme system, a real streak
backend, a real path-shaped Learning Journey, and a real onboarding wizard
already exist (see `docs/02_academy/informe_academico_hango.md` and the
component files themselves for what's real vs. what the brief pre-supposed
was missing). The actual gaps: no XP/achievements concept anywhere in the
codebase, no reusable Chip/Badge component (~9 hand-rolled duplicates
found), `Button`/`Card` have no size variants, lesson-step visual quality
varies widely (Vocabulary richest, Writing is a placeholder stub), zero
mascot reaction to correct/incorrect answers, and no animation library
installed (`motion` not yet a dependency).

**Four scope decisions locked with the user (AskUserQuestion, all
answered)**:
1. **Learning Path**: keep the existing vertical-line path (the user
   explicitly moved it away from a Duolingo zigzag board in an earlier
   session - do not reverse that), but give it real personality: wider,
   bigger nodes, milestone markers, a more present mascot at the current
   node.
2. **XP**: presentation layer only, reusing the existing General Level /
   Reflection score (`points-system.ts`, `general-level.ts`,
   `LessonReflectionReport.totalScore`) - no new schema field, no new
   accumulation logic.
3. **Achievements**: explicitly deferred past this milestone set - no data
   model exists today, needs its own careful design pass later.
4. **Animation**: add `motion` (Framer Motion) as a new dependency for UI
   micro-animations. Mascot stays static-PNG-posed for now; only prepare a
   swappable-renderer seam for a future Rive integration - no `.riv`
   assets exist yet, no real Rive work in this pass.

**Refinements added 2026-08-27 after the user shared reference screenshots
of another app** (principles only, not literal copy - different mascot,
different color identity, not reused): the Learning Path should use a
genuinely curved connector (not straight), lesson-type-specific node icons
(not generic check/play/lock), inline star ratings under completed nodes,
and the mascot rendered small and contained near the current node (not a
large floating overlay). Separately: show XP accumulating live in the
lesson header as the learner answers, not only on the completion screen
(computed client-side from already-graded exercises this session - no
schema change); a client-side-only "correct answers in a row" streak toast
mid-lesson (resets per session, nothing persisted); and symmetry between
the lesson-start objectives list (`SituationStep`'s `learningObjectives`,
already real data) and a checked-off "what you learned" list on the
Reflection/completion screen, reusing that same data instead of inventing
new copy.

**Division of labor**: mascot pose illustration (new PNG art assets -
`thinking`/`celebrating`/a wrong-answer reaction, at minimum) is OpenAI's/
Codex's task - image generation isn't available in Claude Code's toolset.
All React/TypeScript/Tailwind implementation, the `motion` animation
wiring, and component architecture stays with Claude - same split as the
AI Teacher/voice work elsewhere in this file.

**All 7 milestones complete as of 2026-08-29.** Real deviations from the
original plan, for anyone picking this up later: the sticky lesson header
(Milestone 4) was attempted, twice failed to actually stick for the user,
and was reverted rather than shipped broken - `lesson-header.tsx` is back
to a plain `border-b`, `app-shell.tsx` back to its pre-redesign `<main>`
(no `min-h-0`); the mid-lesson correct-streak toast (Milestone 5) was
explicitly dropped by the user's own call, not just deferred; lesson-type-
specific Learning Path node icons (Milestone 3) stayed status-based
(Check/Play/Lock) since a `Lesson` has no type field of its own. Also
shipped, not in the original 7: onboarding's new "profile" step
(`displayName`/`nickname`, Milestone 2) - see that section for what's
still deferred there (Han doesn't use the name yet).

**XP Leaderboard (2026-08-29, post-plan addition)** - the nickname
reserved back in Milestone 2 finally has a real leaderboard behind it,
user request: "quiero que exista este leaderboard... para los general
points que ya tenemos." All-time/cumulative ranking by the same
`generalLevelPoints` Dashboard/Progress already show - no new points
concept, no weekly/period window (no time-series data to build one from,
and the user's own framing matched all-time). Automatic participation for
every learner with a nickname (confirmed with the user directly - the
onboarding copy already told them the nickname was "for the leaderboard,"
so opt-out wasn't added).
- `src/lib/leaderboard-data.ts` - `getLeaderboardTop(limit)` (TTL-cached
  60s, `eligibility = nickname set AND generalLevelPoints > 0` - a learner
  at zero isn't meaningfully "ranked," just tied with everyone else who
  hasn't started) and `getLearnerRank(userId)` (own position even outside
  the visible top list, standard leaderboard UX - `null` when ineligible).
- New `LearnerProfile_generalLevelPoints_idx` index (migration
  `20260829163601_...`) - supports both the ranked query and the "how many
  users rank above me" COUNT.
- New `/leaderboard` page (top 50, "your rank" banner, gold Trophy for
  #1) plus a 3-entry Dashboard teaser card (`getDashboardData` already
  fetches this in the same `Promise.all`, zero extra round trips beyond
  the 2 new queries themselves).
- `tests/integration/leaderboard.test.ts` (5 tests, real database) -
  ordering, eligibility filtering (no nickname / zero points excluded),
  the `displayName ?? nickname` fallback, and rank/`totalRanked`
  correctness. Each test uses a distinct `getLeaderboardTop` limit as its
  cache key specifically to avoid the TTL cache serving one test's seeded
  data to another within the same process - `getLearnerRank` doesn't need
  this, it's keyed by a fresh per-test `userId` already.

**Real gap found + fixed same day: nobody could actually appear on the
leaderboard.** User report: "deberían aparecer todos los usuarios con
puntos. Por qué no aparece nadie?" A direct DB check (5 profiles total)
found exactly why: onboarding's "profile" step only ever runs *during*
onboarding, so every account that finished onboarding before that step
existed - including the user's own real, points-earning account
(`onboardingCompletedAt: 2026-08-15`, well before this session) - has
`nickname: null` and no path to ever set one. `eligible: 0`, structurally,
not a bug in the ranking query itself. Fixed with a second entry point
into the same field, in Settings.

**Identity model revised the same day, before the first fix even settled**
(user: "cuando entras debería aparecer el Account Name... el cual ya no
se puede cambiar... y también debería aparecer el nombre de la persona,
al que Han lo llamará así, ese sí se puede cambiar"). `nickname` and
`displayName` split into two genuinely different, separately-governed
concepts instead of one combined "leaderboard profile" form:
- **Account Name** (`nickname`) - the permanent, public, leaderboard-only
  handle. Settable exactly once, ever, for the life of the account -
  enforced server-side in `updateAccountNameAction` (`actions/settings.ts`,
  rejects if `nickname` is already non-null, not just hidden client-side),
  not just by `AccountNameSection` (`components/settings/`) switching from
  an editable `Input` to plain read-only text once set. The leaderboard
  itself (`leaderboard-data.ts`'s `LeaderboardEntry`, `/leaderboard`, and
  the Dashboard teaser) now shows `accountName` (`@handle` style) as the
  *only* identity - `displayName` was removed from what this module even
  fetches, not just from what it renders.
- **Your name** (`displayName`) - what Han calls the learner, freely
  editable anytime via `updateDisplayNameAction`/`DisplayNameSection`, no
  uniqueness constraint, never shown on the leaderboard.

Onboarding's "profile" step (`profile-step.tsx`) copy updated to match -
"Account Name" terminology and an explicit "permanent, choose carefully"
warning on that field specifically, "Your name" framed as Han's address
and freely changeable. `tests/integration/settings.test.ts` now has 6
identity tests (was 3): display name changes freely (twice, asserting the
second write wins), Account Name set-once-retroactively, Account Name
change *rejected* once already set (the core new rule), taken-name
rejection, invalid-format rejection. `tests/integration/leaderboard.test.ts`
updated to assert `accountName` instead of the now-removed `displayName`
field, plus one test asserting `displayName` never appears on a
leaderboard entry even when set.

**Duplicate "Name" field removed the same day** (user: "en settings hay
Name y Your name, debe quedar solo uno"). The old `User.name` field
(`ProfileSection`/`updateProfileNameAction`/`profileSchema`, pre-existing
from before this whole redesign, originally only used once - the
registration verification email) and the new `displayName` field were
sitting in Settings as two competing "name" inputs. Checked before
deleting anything: `session.user.name` has zero readers anywhere in the
app's UI (grepped for it directly) - `displayName` is the one Dashboard's
greeting and (eventually) Han actually use, so it's the one kept.
Deleted: `profile-section.tsx`, `updateProfileNameAction`,
`profileSchema` (`validation/settings.ts`), and the now-pointless
`db.user.findUniqueOrThrow` fetch in the Settings page (it existed only
to feed `ProfileSection`). `DisplayNameSection`'s label changed from
"Your name" to plain "Name" now that nothing else claims that word.
Settings' registration-time `User.name` itself is untouched (still
collected at signup, still emailed) - only its since-redundant Settings
*editing* UI is gone. Test suite adjusted: the 2 `updateProfileNameAction`
tests removed, the auth-guard test switched to `updateDisplayNameAction`
instead (still 14 tests in `settings.test.ts`, net even).

**Milestone order** (each fully verified - `tsc`/`eslint`/`test:unit`/
`test:component`/manual visual QA in both themes at mobile width - before
the next one starts):
1. [x] Design system extensions: `motion` dependency, `Button`/`Card` size
   variants (additive, zero regression to existing call sites), a shared
   `Chip` component (`src/components/ui/chip.tsx`) replacing the
   duplicated pill patterns (streak chip deduped between `top-bar.tsx` and
   `dashboard/page.tsx`, "Placed by exam"/score badges, competency tags,
   chapter "you are here" pill - `scenario-mastery-list.tsx`'s gradient
   "Mastered" badge deliberately left as its own one-off, doesn't fit the
   tone system). Also added, beyond the original scope: a `motion`-driven
   idle float/tilt loop on `HanMascot`/`HanAvatar` (real dynamism on the
   existing static art, respects `prefers-reduced-motion`) - user
   feedback mid-build: swapping static poses alone doesn't read as
   "alive", confirmed working after a hard-refresh. New mascot pose art
   (`thinking`/`wrong`/`celebrating`) delivered by OpenAI/Codex 2026-08-28
   and wired into `han-mascot.tsx`'s `POSES` map - not consumed by any
   caller yet (that's Milestone 5/6's job), just available now. A real
   4-frame hand-wave animation (`han-wave-1..4.png`, also OpenAI/Codex,
   delivered 2026-08-29 after one rejected batch with a rendering defect -
   verified pixel-by-pixel via `sharp` before trusting it) replaced the
   earlier body-sway CSS approximation for `gesture="wave"`.
2. [x] Onboarding visual redesign: new `src/components/onboarding/
   option-tile.tsx` (`CheckboxTile`/`RadioTile`, wraps the same Radix
   Checkbox/RadioGroup primitives the old 20px rows used - a11y unchanged,
   verified via `tests/component/a11y.test.tsx`) replaces the compact rows
   in goal/level/skills/daily-target/explanation-language steps, with
   per-option icons where they add scanability (goal/skills). Two tile
   layouts now: `"stack"` (icon on top, for level's icon+meter options) and
   `"row"` (icon left/text right, compact - explanation-language/daily-
   target/skills/goal/level all ended up using this after 2026-08-28/29
   iteration). Fixed two real bugs found along the way: a flex item's
   default `min-width: auto` was letting long labels ("Speaking Like a
   Professional") push the radio indicator outside the tile's border in
   the 2-column grid (fixed with `min-w-0`); and `min-h-28` silently did
   nothing since Tailwind has no numeric `min-h` scale by default (fixed
   with the arbitrary-value form `min-h-[112px]`) - level-step's 7 tiles
   are now genuinely uniform height regardless of label line-count.
   Level-step also got a small 5-segment "strength meter" (`LevelBars`,
   staircase height, aria-hidden) next to each option. Step headers use
   `HanMascot` (not `HanAvatar`) at 110px - `HanAvatar`'s circular
   `object-fit:cover` crop read as visibly blurrier than the Dashboard's
   uncropped `HanMascot`, confirmed by direct user comparison; a same-
   session attempt to fix `HanAvatar` via `transform:scale()` made it
   *worse* (jagged clip edge + compounded blur from a `sizes` hint that
   didn't account for the transform) and was reverted. Primary CTA buttons
   across the flow use `Button`'s new `size="lg"`.
   **Scope addition 2026-08-29** (not in the original 7-milestone plan,
   added mid-session per explicit user request): a new "profile" onboarding
   step (right after welcome) collects `displayName` + a `nickname` unique
   across all learners (`LearnerProfile.displayName`/`.nickname`, additive
   migration `20260829045209_add_learner_profile_display_name_nickname`) -
   `nickname` is reserved now for a future XP leaderboard that isn't built
   yet (explicitly deferred, per user's own "posterior" framing). Dashboard
   now greets by `displayName` when set. Han does **not** use the name yet
   - deliberately deferred (user's own answer: touching `ai-context.ts`'s
   prompt logic, even just to inject a data value, needs its own sign-off
   later, not bundled into this). `resolveResumeStep`/`STEP_ORDER` updated
   in both places they're duplicated (`learner-profile.ts` and
   `components/onboarding/types.ts` - pre-existing duplication, not
   introduced here). Zero changes to the other steps'
   `actions/onboarding.ts` handlers or resumability logic.
3. [x] Learning Path: `lesson-path.tsx` nodes size-10 -> size-12, a
   checkpoint gradient (reusing the Final Mission node's own
   `from-accent-500 to-primary-500` treatment, not a new visual language)
   on every 4th COMPLETED/AVAILABLE lesson (`MILESTONE_EVERY = 4` - LOCKED
   milestones stay plain muted, a bright gradient on something you can't
   reach yet would read as a broken affordance). The bare "X/100" chip on
   completed lessons is now a real star row (`starsForScore()`, new in
   `points-system.ts` - 90+ = 3, pass-threshold(70)+ = 2, below = 1, pure
   presentation over the same real `totalScore`) - "Placed by exam"
   lessons keep their own badge unchanged, never both. Current-lesson
   `HanAvatar` 26px -> 32px to match the bigger nodes, still inline/
   contained per the locked decision (not a floating overlay).
   `scenario-card.tsx` deleted (confirmed genuinely dead - only its
   `ScenarioCardProps` type had a real consumer, `journey-chapters.tsx`;
   moved there as `JourneyChapterScenario` instead of keeping a component-
   less file alive just to export a type). `journey-chapters.tsx` left
   otherwise untouched - its size-10 nodes were already a deliberate,
   reasoned, previously-approved choice (own comment: "smaller, more
   contained... this direction's main visual change"), not something the
   Milestone 3 "light richness pass" language justified overriding.
   **Curved connector, resolved 2026-08-29**: initially deferred (see
   below for the original reasoning), then the user pushed back ("o sea no
   hiciste casi nada?") and directly reused their original brief's own
   instruction - present alternatives, don't guess blind. Published an
   Artifact (4 side-by-side connector styles - straight/gentle wave/bold
   wave/dashed wave - same example lesson data, real HanGo dark-theme
   tokens) instead of iterating in the live app. User picked "D" (dashed
   gentle wave) - directly assimilated from the Bytemigo onboarding
   screenshot re-reviewed the same turn (dashed = "this is a path,"
   distinct from a solid progress rail), not copied wholesale (no purple,
   no ghost). Wired as `strokeDasharray="4 6"` + `strokeLinecap="round"`
   on the same self-stretching wave path. The original "can't verify
   without a browser" caution turned out to be solvable by showing
   alternatives instead of picking one blind - worth remembering for the
   next visually-uncertain call, rather than defaulting to skipping it.
   **Still genuinely deferred**: lesson-type-specific node icons (still
   status-based Check/Play/Lock) - a `Lesson` has no type field of its own
   (`prisma/schema.prisma`), it contains steps of up to 13 different
   `LessonStepType`s, so "this lesson's type" isn't real data without a
   new query into `LessonStep` and a heuristic for picking one: scoped out
   as a refinement-tier item, not one of the plan's 4 locked decisions.

   **Real bug found + fixed same day**: the dashed connector only rendered
   ~100px tall regardless of list length ("solo veo una raya entre la
   primera y la segunda") - an absolutely-positioned `<svg>` with no
   explicit height is a *replaced element*, so browsers size it from the
   viewBox's own intrinsic ratio (32:100) instead of stretching between
   `top`/`bottom` the way an ordinary div would. Fixed by wrapping it in a
   plain div that does the `top-3 bottom-3` stretch (guaranteed, ordinary
   abspos behavior for non-replaced elements), then filling that with an
   `h-full w-full` svg - sidesteps the replaced-element special case
   instead of fighting it.

   **Node layout, resolved 2026-08-29** (second round of "dame
   alternativas" after the user pushed back again): a second Artifact (3
   node-position options - straight column / icon-only sway with text
   anchored / full-row alternation) presented the real tension explicitly
   - `journey-optimization.md`'s 2026-08-21 note that this path was
   straightened *away* from a zigzag board specifically to avoid the
   left-right eye-jump cost of reading titles. User picked "B" (icon
   sways `ROW_SHIFT_PX = 28px` on alternating rows via `paddingLeft` on
   the row, title/badges column stays anchored) - gets real movement
   without reintroducing the cost the 2026-08-21 decision was about. The
   connector's viewBox/path widened and re-centered (extremes at 24/52)
   to roughly track the new icon sway range instead of floating
   independently of it.
4. [x] Lesson Player: `lesson-header.tsx` now `sticky top-0` ("progreso
   siempre visible") - the `-mx-4 px-4` trick cancels then re-applies
   AppShell's `<main>` padding so the sticky background spans edge to
   edge instead of leaving scrolled content visible in the side gutters.
   `StepNavigation`'s own rail (already had type-specific icons, a dashed
   connector, and a current-node `HanAvatar` from an earlier session) was
   deliberately left non-sticky - pinning both would eat a lot of
   permanent vertical space, especially on mobile, for a plan item that
   only asked about the progress bar. Grammar/Comprehension/Quiz each
   got a small `HanAvatar` next to their `SectionTitle` (matching every
   other step, and Vocabulary's own mascot presence) and the same
   `card-slide-in` entrance animation Vocabulary already used, applied to
   Grammar's point cards and Comprehension's exercise list - presentation
   only, zero change to grading/batching/sequencing logic. Investigated
   the "weaker steps" premise first: Grammar/Comprehension were already
   functionally rich (audio, AI-ask, batched grading, listen-first UX for
   Comprehension) - the real gap was narrower than the plan assumed (no
   mascot, no entrance motion), consistent with this whole plan's pattern
   of the codebase being in better shape than the original brief guessed.
   **Deferred**: the live in-header XP counter - belongs closer to
   Milestone 5 (needs the same "what counts as XP, computed from what"
   groundwork as the rest of that milestone) rather than bolted onto the
   header in isolation here. Quiz's own internal `QuizRunner` wasn't
   audited in depth this pass - flag if it turns out to need its own
   polish once seen live.

   **Real bug found + fixed same day**: sticky didn't stick at all
   ("también se traslada abajo") - root cause was in `app-shell.tsx`, not
   the header. `<main>`'s `flex-1 overflow-y-auto` was never actually
   height-bounded: a `flex-1` item in a column flex chain defaults to
   `min-height: auto` ("at least as tall as my content"), so `<main>`
   just grew to fit everything instead of shrinking to the viewport and
   scrolling internally - the whole page scrolled at the document level
   instead. `position: sticky` resolves against the nearest ancestor with
   *any* overflow value set, even one that isn't practically active, so
   it was anchoring against a box that never actually scrolled - net
   effect, never stuck. Fixed with `min-h-0` on `<main>` and its parent
   row. This was a latent shell-wide bug, not lesson-specific - every
   authenticated page was already scrolling at the document level instead
   of within `<main>`; nothing surfaced it before because nothing else
   needed sticky positioning relative to `<main>`.

   **Reverted same day - the `min-h-0` theory didn't fix it in practice**:
   user reported the header still scrolled away after the `min-h-0` fix,
   then that something broke more broadly across Learning Journey. Rolled
   both the sticky header (`lesson-header.tsx`) and the `app-shell.tsx`
   `min-h-0` change back to their pre-2026-08-29 state rather than
   layering another guess on top - the diagnosis was wrong somewhere and
   guessing again without seeing the actual failure wasn't going to
   converge. **Sticky header is un-done, back to a plain `border-b` static
   header, pending a fresh look with an actual screenshot of what's
   broken.**
5. [x] Feedback / XP / Streak / Stars:
   - [x] Mascot reaction on `ExerciseItem`'s existing correct/incorrect
     result - `celebrating`/`wrong` poses (delivered by OpenAI/Codex,
     wired into `POSES` back in Milestone 1) next to the existing
     color/icon/banner feedback, never replacing it - a `motion` pop-in
     (scale 0.6->1, opacity 0->1), gated by `useReducedMotion()`. No
     reaction for `isCorrect === null` (SHORT_RESPONSE's "Submitted."
     case - nothing to react to yet). `InformationBanner` itself untouched
     (every other call site across the app uses it) - Han sits beside it
     in a new flex row local to `exercise-item.tsx`.
   - [x] `totalScore` → 1-3 stars mapping - already built early, in
     Milestone 3 (`starsForScore`, `points-system.ts`), Learning Path
     needed it first. Nothing left to do here.
   - [x] Unified `Chip`-based streak pill - already done in Milestone 1
     (deduped between `top-bar.tsx`/`dashboard/page.tsx`). Nothing left.
   - [ ] **"+N" gain micro-animation - not implemented, and not a small
     gap**: `ExerciseSubmitResult` (`exercise-progress.ts`) carries only
     `isCorrect`/`explanation`/`correctOptionId` - no point value exists
     per exercise to animate. Real point totals only exist at the lesson
     level (`LessonReflectionReport.totalScore`, computed in Reflection),
     which is Milestone 6 territory (the completion screen's score
     count-up), not something to fabricate here.
   - [x] ~~Mid-lesson correct-streak toast~~ - **explicitly dropped by the
     user (2026-08-29)**, not just deferred: "dejemos de lado el toast de
     racha." Would have needed `ExerciseItem` to report each result
     somewhere a lesson-level counter could see it (a new callback prop
     through every step component, or a shared context) - real plumbing,
     not a small gap, and the user chose not to spend it. Milestone 5 is
     done with this scoped out.
6. [x] Lesson Completion Screen: `ReflectionReport` (`reflection-step.tsx`,
   shared by both `ReflectionStep` - fresh completion - and
   `LessonResultsView` - revisiting, per the plan's own "both entry points
   render identically") got a celebratory entrance layered onto its
   existing hero block only - every `ScoreCard`, the long-press
   breakdowns, strengths/improvements, speaking-error panel, and Han's
   narrative are byte-identical to before. Added: a 0->score count-up
   (`useCountUp`, a `motion` `useMotionValue`/imperative `animate` over
   1.1s, skips to the final value under `prefers-reduced-motion`), a real
   1-3 star row (`starsForScore`, reused from Milestone 3 - same function,
   no new logic), a real streak chip (new `getReflectionStreakAction`
   wrapping the same `getStudyStreak` Dashboard/TopBar already use - one
   source of truth, not a second one), and `HanMascot` at `celebrating`
   (passed) or `thinking` (didn't pass - "wrong"'s apologetic wink read
   too harsh for "finished a whole lesson but under 70," `thinking` pairs
   better with the existing "Keep practicing" copy).

   "What you learned" (`learningObjectives`, mirroring `SituationStep`'s
   numbered goals, now checked off) is real but **`ReflectionStep`-only**:
   `LessonResultsView` deliberately never fetches full lesson content when
   revisiting an already-completed lesson (its whole reason to exist is
   avoiding that), so `learningObjectives` is an optional prop that's
   simply absent there rather than adding a query to that fast path - a
   real, disclosed narrowing of "both entry points render identically,"
   not a silent one.

   Verified against the real database - `tests/integration/reflection.test.ts`
   (6 tests, data-layer only, the React component isn't integration-tested)
   still green; `starsForScore`/`getStudyStreak` are both pre-existing,
   already-tested functions, reused rather than reimplemented.

   **Real bug found + fixed same day**: "Finish Lesson" rendered
   unconditionally in `reflection-step.tsx`, including during the
   "loading" state - user report: "estuve en reflection, salió el
   resultado, y no me dio tiempo de leer, se salió automáticamente." The
   report popping in shifts the layout; a tap aimed at anything else while
   that happens can land on this button right as it shifts underneath the
   finger, finishing the lesson before the score is even readable. Fixed:
   the button now only renders once `state.status !== "loading"` (ready or
   error - error keeps it, per its own "you can still finish below" copy).
7. [x] Mascot Animation System Architecture: `han-mascot.tsx` now has a
   real internal seam - `StaticMascotFrame` (`{src, alt, sizes}` in, an
   `next/image fill` render out) is the swappable implementation behind
   `HanMascot`/`HanAvatar`'s unchanged pose-based public API; a future
   `@rive-app/react-canvas` renderer would implement that exact same
   contract and drop in behind `MascotCrossfade` without either component
   needing new props - documented in a code comment, no Rive dependency or
   `.riv` asset added. Pose swaps now cross-fade (`AnimatePresence`,
   `motion.span` opacity 0->1 over 0.25s, gated by `useReducedMotion()`)
   instead of cutting instantly - keyed on `pose` specifically, not `src`,
   so the wave-frame cycling (220ms/frame, unrelated to pose changes)
   stays an instant crisp cut rather than blurring together.

   Real refactor along the way, not just an add: `HanMascot`'s box used to
   get its height implicitly from the `<Image>`'s own intrinsic aspect
   ratio (`width` set, `height: auto`) - switching to `fill` (needed so
   old/new pose frames can overlap during the cross-fade) meant that
   height had to become explicit instead (`size * MASCOT_ASPECT_RATIO`,
   the same 1536:1024 ratio every source PNG shares) - the exact class of
   bug already found and fixed once this session in `lesson-path.tsx`'s
   connector line, applied proactively here instead of shipping it again.
   `HanAvatar` already used `fill` for its circular crop, so it only
   gained the cross-fade wrapper, no dimension changes.

   Verified across every real usage this session touched `HanMascot`/
   `HanAvatar` in - Dashboard hero, LessonPath's current-node avatar,
   onboarding step headers, the auth layout, `ExerciseItem`'s reaction,
   the Reflection completion screen - `tsc`/`eslint`/545 unit/38 component
   all green, since this component is shared everywhere.

**Han now knows the learner's name (2026-08-29, post-plan addition,
explicit user sign-off required and obtained)** - the one deliberate,
narrow exception to this whole plan's own "never touch `ai-context.ts`
prompt logic" guardrail below, not a quiet violation of it. User request:
"que Han sepa mi nombre" - explicitly *not* "use my name" (hence the
prompt wording: "use it occasionally... not mechanically in every
reply", never "always greet by name").

Before touching anything, found `ai-context.ts`'s own top-of-file
comment: "Deliberately excluded (8.2 'Do not send unnecessary personal
information'): name, email, and any other account-identifying field."
Traced "8.2" to `project/TASKS_ARCHIVE.md`'s original AI Context spec -
a genuine, deliberate privacy-by-design decision ("context type has no
name/email/id fields at all - structurally can't leak them"), not an
oversight. Surfaced this to the user directly and got explicit
confirmation before overriding it (`AskUserQuestion` - "sí, agregar el
nombre") - this reverses a real privacy stance, not just a technical
default.

Implementation, additive only, zero changes to pacing/parsing logic:
- `LearnerAiContext` gained one new optional field, `learnerName`.
- The prompt text itself gained one new conditional line in each of
  `buildSystemPrompt`/`buildRealtimeSystemPrompt`'s existing "System
  Context" opening section - not a restructure of either function.
- Sourced from `LearnerProfile.displayName` specifically (the name the
  learner set for Han to use, per the Account Name/Name split above) -
  never `User.name` or email.
- Gated on `!context.rolePlay` in both builders - a role-play scene has
  Han playing a different character who has no reason to know the real
  learner's name unless the scene itself supplies it (consistent with
  the existing `context.rolePlay`-presence split documented in memory as
  "Han persona scope").
- Wired at both real call sites: `ai-teacher-data.ts` (text chat) and
  `app/api/han/realtime/route.ts` (live voice) - each already had a
  `db.learnerProfile.findUnique` for the prompt's other fields; this
  only added `displayName` to that same existing `select`, no new query.
- 5 new unit tests in `tests/unit/ai-context.test.ts` (now 58, was 53) -
  name appears outside role-play (both builders), name never appears
  during role-play even when supplied (both builders, the one most worth
  guarding against regressing), and the no-name-set baseline is
  unchanged. `tsc`/`eslint`/550 unit (was 545)/38 component all green.

**Out of scope this whole plan**: `ai-context.ts` prompt logic beyond the
one exception directly above, `han-realtime.ts`/`realtime-turn-guard.ts`
pacing/parsing, any `"HSK N"`
regex-parsed string, `ExerciseItem`'s grading contract, `study-streak.ts`/
`points-system.ts`/`general-level.ts` formulas, `prisma/schema.prisma`
beyond small additive fields (flag before adding any), real Writing Lab
content, achievements, auth, the placement exam engine.

## Han Companion voice orb (2026-08-31) — ✅ Complete

- [x] Added an isolated `variant="orb"` to `HanVoiceConversation`; Han's
  existing remote-output RMS drives its scale/glow without a second audio
  pipeline or React re-renders per animation frame.
- [x] Han Companion alone uses the orb. One control starts/ends audio; no
  transcript, caption, text input, mute row, or chat UI was added. Speaking
  Lab's `immersive` variant and Learning Journey Speaking remain unchanged.
- [x] Removed Companion's optional typed scenario builder entirely. Added two
  independent live-audio borders: jade follows the learner mic RMS; red/gold
  follows Han's remote-output RMS. Both reuse the existing analysers.
- [x] Stabilized Han Companion's `onActiveChange` callback after real-server
  testing exposed a pre-existing maximum-update-depth loop on `/han`.
- [x] Prisma Client regenerated; typecheck, scoped ESLint, diff check, CSS/
  Next compilation, and authenticated `/han` HTTP render pass. In-app visual
  inspection remained unavailable because its webview would not attach.
- [x] Realtime STT prompt-leak regression fixed (2026-09-01): a false VAD
  turn on silence returned the recognizer's own multilingual instruction as
  learner speech. Both multilingual/Mandarin prompt signatures are now
  rejected silently before display, persistence, or sending to Han; 17/17
  focused transcript-quality tests pass.
- [x] Han name repetition fixed (2026-09-01): knowing `displayName` no longer
  licenses routine address-by-name. Text and voice may use it only in the
  first greeting, final farewell, or on explicit learner request. Generic
  `Claro`/`Entiendo`/`Perfecto` openings are now prohibited; 58/58 prompt
  tests pass.

## Han Tutor progressive pedagogy (2026-09-02) — ✅ Complete

- [x] Approved plan captured in `project/han-tutor-progressive-pedagogy.md`.
  Tutor now silently chooses among quick answer, focused contrast,
  correction, broad teaching, and explicit practice on each turn.
- [x] The five-part lesson is conditional on a broad request; quick answers
  default to one useful example, and second examples, cultural notes,
  practice, questions, praise, and invitations must earn their place.
- [x] Written characters + accurate pinyin + translation remain mandatory
  for every Mandarin example. Voice still pronounces Mandarin naturally and
  never reads pinyin aloud. Companion and both Speaking systems unchanged.
- [x] 61/61 `ai-context` tests, typecheck, scoped ESLint, Prettier, and diff
  check pass.
- [x] Tutor dictation regression fixed (2026-09-02): when the active learning
  context explicitly expects `从来 / cónglái`, the isolated STT mishearing
  `y el Zhou Enlai` is rendered as `从来`. Real references to Zhou Enlai in a
  sentence and transcripts without that vocabulary hint remain unchanged.

## Public marketing landing (2026-09-02) — ✅ Complete

- [x] Replaced `/`'s database-health placeholder with a Spanish-first landing
  for learners from absolute beginner through advanced refinement, centered on
  progressing toward real communication at every level.
- [x] Added the Restaurant learning loop, distinct descriptions of Learning
  Journey, AI Teacher, Speaking Lab, Writing Lab, Missions, and progress, plus
  direct registration/login actions. Han Companion and both Speaking systems
  remain untouched.
- [x] Reused the existing brand tokens, UI primitives, logo, and Han artwork;
  added responsive/light-dark-safe presentation without new dependencies.
- [x] Added production metadata and a 1200×630 branded social preview at
  `public/og.png`; no invented testimonials, usage figures, prices, or claims.
- [x] Broadened the public promise after the user's current product-direction
  correction: zero prior knowledge is required. Added honest product evidence
  for avatar creation, HanCoins customization, Han Vocabulary, and the weekly
  leaderboard without changing those systems.
- [x] Hero collision follow-up (2026-09-02): Han now has a smaller, reserved
  responsive area instead of overlapping the conversation card; the next-step
  callout sits fully below the card in normal flow with no negative offset.
- [x] 3/3 focused component/a11y tests, typecheck, scoped ESLint, Prettier,
  production build, and real local `/` HTTP render pass.

## Interactive hero demo card (2026-09-04/05) — ✅ Complete

- [x] Took over from OpenAI mid-build: the static Contexto/Práctica/Misión row
  in the hero is now a real interactive demo (`hero-demo-card.tsx`) with tab
  switching, dialogue bubbles, and a mission CTA to `/register`.
- [x] Several rounds of visual fixes after real-browser screenshots: Han's
  position per tab, the "Han note" made full-width and centered instead of
  `w-max`, mission button single-line/full-width. Kept every fix minimal and
  scoped after two regressions (an oversized centering box that clipped
  Han's hand, and an unrequested card-width change) — both reverted to the
  prior known-good layout rather than iterated on further.

## Stale-session hardening + full project audit (2026-09-05) — In progress

- [x] Real bug found via manual testing: a JWT session for a deleted user
  crashed every authenticated page with a raw Prisma `P2003` on
  `getOrCreateLearnerProfile` (JWT sessions can't be server-invalidated).
  Fixed in `app/(app)/layout.tsx` — catches the FK violation and redirects to
  a new `app/api/auth/invalid-session/route.ts` Route Handler that signs out
  and sends the learner back to `/login` (cookies can only be mutated from a
  Server Action/Route Handler, not the layout itself). 5/5 unit tests pass.
- [x] Full part-by-part audit approved and structured in 7 parts (Parte
  0-6); plan lives in `vectorized-jumping-fox.md`. **Parte 0** (dead
  scripts/docs cleanup) and **Parte 3** (dead component sweep — removed
  `drawer.tsx` and `lesson-availability-badge.tsx`, zero real importers)
  done.
- [x] **Parte 4** (tests + CI): added `.github/workflows/ci.yml` — first CI
  this project has ever had, runs the full suite (typecheck/lint/unit/
  component/integration/smoke) on every push/PR against a real Postgres
  service container. Needs no paid API key (`OPENAI_API_KEY` unset →
  `MockAiProvider` automatically, per `src/lib/env/server.ts`). Not yet
  validated on real GitHub infra — first real push is the real test.
  Fixed the smoke test's cross-platform process-tree kill (was
  Windows-only `taskkill`) and its stale "Application foundation running."
  assertion (checks for `HanGo` + `href="/register"` now).
  Added tests for the 4 zero-coverage cost-sensitive files found by the
  audit: `welcome-audio.ts`, `free-topic-practice.ts`,
  `handwritten-writing-data.ts`, `placement-listening-audio.ts` — all AI/TTS
  calls mocked, real database, 21/21 passing.
- [x] **Parte 1** (costo de IA): auditoría de las ~18-20 superficies reales de
  IA/TTS/STT/voz vía 3 agentes en paralelo. Hallazgos aplicados:
  - `app/api/han/speech/route.ts` (el más riesgoso: sin caché ni rate limit)
    ahora tiene caché por contenido + límite de 30/5min, igual que el resto
    de audios TTS del proyecto.
  - Bug real encontrado de paso: `landing-page.test.tsx` estaba roto desde la
    reescritura de la tarjeta interactiva del hero (perdió los atributos
    `lang` en chino/pinyin) — restaurado sin tocar el diseño ya aprobado.
- [x] **Sistema de costo de IA + tope diario + panel de administrador**
  (2026-09-05, a pedido del usuario, más allá del audit original): extendida
  la tabla `AiUsageLog` (ya existía pero solo la usaba el chat de Han) con un
  campo `feature` + nueva tabla `AiUsageCap` (límite diario configurable por
  función). Nuevo módulo `src/lib/ai-usage.ts`: `recordAiUsage` +
  `checkDailyUsageCap` (tope de $1/día por usuario y función por defecto,
  configurable) + estimadores de costo reales para TTS ($0.015/min,
  gpt-4o-mini-tts) y STT ($0.006/min, whisper-1) verificados por WebSearch.
  Conectado en las 20 superficies reales (texto, audio, voz, visión de
  escritura a mano) — antes solo 1 de 20 registraba algo.
  Nuevo panel `/admin/ai-usage` (protegido por `requireRole(["ADMINISTRATOR"])`,
  ya existía la infraestructura de roles sin usar): tabla con gasto real
  hoy/este mes por función (todos los usuarios) + tope diario editable por
  función. Acceso vía el ícono de usuario (esquina superior derecha) →
  "Administrador", visible solo si `role === ADMINISTRATOR`. Cuenta real del
  usuario (`arean.mendoza@unmsm.edu.pe`) subida a ese rol con su confirmación
  explícita. 32/32 tests nuevos (unitarios + integración) pasando.
- [x] **Parte 6** (rutas/currículo): sin código muerto en las 22 rutas
  reales; `/speaking-test` confirmada como herramienta de QA legítima
  (dev-only, ahora documentada). `prisma/seed.ts` sin contenido huérfano —
  todo lo sembrado se publica en la misma operación.
- [x] **Parte 5** (documentación): auditoría completa de los 61 archivos de
  `docs/`; 50 corregidos o anotados (17 críticos que describían sistemas
  nunca construidos — "Simulation Engine", pipeline de generación de
  contenido con IA, `api.md` con una API REST ficticia, `architecture.md`
  literalmente cortado a la mitad, etc. — 15 moderados en `01_product`/
  `04_design`/`06_marketing`, 18 menores). 14 confirmados ya precisos, sin
  tocar.
- [x] **Parte 2** (DB/Prisma), retomada y cerrada en la pasada de
  optimización del 2026-09-08 (ver esa sección más abajo): los 2 bugs de
  idempotencia (`mission-data.ts`, `reflection.ts`) arreglados, 5/6
  índices aplicados (el sexto se descartó — sin consulta real que lo
  necesite), endpoint pooled investigado y descartado (ver detalle abajo).
- [x] Codex completó el panel de administrador (resumen general, analítica,
  operaciones de IA, límites por usuario, actividad real) — ver las
  secciones "Entrega 1" a "Entrega 5B" más abajo.
- [x] ~~El CI nunca corrió en GitHub real~~ **Reconciliado 2026-09-16
  (BASE-02), verificado directamente:** corrió muchas veces en GitHub
  Actions real esta sesión (runs `34909180701` en adelante). Encontró y
  llevó a corregir brechas reales (ver `AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md`
  P0-07 y las tareas QA-01 a QA-05 de este mismo archivo). Superado.

## Private admin back-office — Entrega 1 (2026-09-05) — ✅ Complete

- [x] Consolidated scope and future roadmap captured in
  `project/admin-backoffice-plan.md`; Han Tutor, Han Companion, Learning
  Journey Speaking, and Speaking Lab remain separate and unchanged.
- [x] New `/admin` shell outside the learner app layout, protected by a
  database-backed `ADMINISTRATOR` check plus the exact owner email. Includes
  executive overview, searchable/paginated users, learner detail, AI limits,
  and direct links from the existing account menu.
- [x] Admin announcements: drafts/publishing, priority/type, active dates,
  optional internal CTA, delivery/acknowledgement counts, archive action, and
  learner entry modal.
- [x] Manual HanCoin grants: positive bounded amount, required learner-facing
  message, optional internal note, idempotent ledger transaction, immutable
  audit record, and a persistent learner acknowledgement modal.
- [x] Prisma schema/migration/client generation, database-backed DTO queries,
  validation and scoped security checks implemented. 639/639 unit tests,
  12/12 shell component tests, 2/2 real-database admin integration tests,
  typecheck, scoped ESLint, Prisma format/validation, and diff check pass.
- [x] `20260906030000_add_admin_backoffice` applied to the configured remote
  PostgreSQL database after explicit user authorization; Prisma confirms all
  48 migrations are current. Integration-created users, announcements, and
  grants are removed by test cleanup.
- [x] Runtime access control verified: an unauthenticated visit to `/admin`
  redirects to `/login`. Full authenticated visual QA requires the owner to
  sign into the browser; no password or session bypass was attempted.
- [x] Admin overview overflow follow-up (2026-09-06): “Registros recientes”
  now constrains every row to the card, truncates long account names inside a
  flexible column, and keeps the date in a fixed non-wrapping column.
- [x] Full production build fixed (2026-09-08, see the optimization-pass
  section below) — `placement-exam.ts` was exporting a class from a
  `"use server"` file, illegal and a hard Turbopack build failure
  cascading into 16 errors. `npm run build` now exits 0.

## Admin product intelligence — Entrega 2 (2026-09-06) — ✅ Complete

- [x] Added `/admin/analytics` and an “Analítica” entry to the isolated admin
  shell, with selectable 7/30/90-day periods and no learner-shell side effects.
- [x] Activation funnel for the selected registration cohort: registration,
  verified email, completed onboarding, first lesson started/completed, and
  first scenario completed. Counts are sequential intersections so the funnel
  cannot report an impossible increase between stages.
- [x] D1/D7/D30 retention, daily active/completion trend, returning and
  high-frequency learners, 14-day reactivation opportunity, avatar adoption,
  accessory participation, achievements, and leaderboard participation.
- [x] Separate product signals for Learning Journey, Han Tutor, Han Companion,
  Speaking Lab, Writing Lab, Missions, HanVocabulary, and Placement, including
  actions, unique users, and attributable AI cost.
- [x] HanCoin inflow/outflow/admin grants, total AI cost/calls, cost per active
  user/completion, provider/model/function detail, near-cap alerts, onboarding
  conversion alert, and period-over-period learning activity alert.
- [x] Methodology is visible in the UI: `daily_login` is a proxy for access,
  not study time; retention uses exact Bogotá calendar days; shared
  `han-speech` is not falsely assigned to Tutor or Companion; Learning Journey
  Speaking is not counted as Speaking Lab without an independent origin marker.
- [x] Reprioritized Entrega 2 documented in
  `project/admin-backoffice-plan.md`; historical cost metadata remains Entrega
  2B and true visible/interacted session duration remains Entrega 3.
- [x] Typecheck, scoped ESLint/Prettier, real-database analytics invariants, and
  admin-shell component navigation tests pass (2/2 focused tests).

## Admin AI cost traceability — Entrega 2B (2026-09-06) — ✅ Complete

- [x] Extended `AiUsageLog` additively with calculation method, historical
  token/minute rates, audio duration, and duration source. Existing rows are
  honestly preserved as `LEGACY_ESTIMATE` instead of backfilling invented
  precision.
- [x] Token-priced calls snapshot the exact internal model rates used at write
  time. TTS stores text-length-estimated duration; Han transcription stores a
  byte-size estimate; Speaking Lab stores the client-recorded duration.
- [x] `/admin/analytics` now separates legacy, token, and per-minute estimates
  and shows the historical rate plus audio-evidence source for every grouped
  cost row. Han Tutor, Han Companion, Learning Journey Speaking, and Speaking
  Lab attribution rules remain unchanged.
- [x] Migration `20260906090000_add_ai_usage_cost_metadata` applied to the
  configured PostgreSQL database; Prisma reported all 49 migrations applied.
- [x] Prisma format/validation/client generation, typecheck, scoped ESLint,
  4/4 pure estimator/metadata tests, and the read-only real-database analytics
  invariant test pass. The separate mutable AI-usage integration suite remains
  prepared but was not rerun against the shared database because it creates
  temporary users and modifies global feature-cap rows.

## Admin real activity sessions — Entrega 3 (2026-09-06) — ✅ Complete

- [x] Added an authenticated, invisible activity tracker to the learner shell.
  It sends cumulative 15-second heartbeats only after real interaction, while
  the document is visible, and stops counting after one minute without input.
  A 30-minute idle gap starts a new logical browser session.
- [x] Added monotonic sequence/total handling and bounded server validation so
  retries cannot double-count, stale heartbeats cannot move totals backward,
  and implausible client totals are rejected.
- [x] Added explicit surface attribution. Han Tutor uses markers on its lateral
  panel and full-page view; Han Companion, HanVocabulary, Missions, Speaking
  Lab, Writing Lab, Placement and Learning Journey remain independently
  measurable. The `/han` selection hub is neutral, and Learning Journey
  Speaking is never counted as Speaking Lab.
- [x] `/admin/analytics` now uses real activity sessions instead of
  `daily_login` as the access proxy for DAU/WAU/MAU, D1/D7/D30, returning and
  dormant learners, and its daily active trend. Added logical-session count,
  active-duration median/total/change and a per-experience comparison table.
- [x] Added `LearnerActivitySession` plus indexed user/date/surface access.
  Migration `20260906103000_add_learner_activity_sessions` was applied to the
  configured PostgreSQL database; Prisma reported all 50 migrations applied.
- [x] Prisma format/validation/client generation, typecheck, scoped ESLint,
  9/9 focused local tests and the real-database read-only analytics invariant
  test pass. Activity metrics are intentionally non-retroactive and begin with
  the first learner interaction after this deployment.

## Admin user 360° — Entrega 4 (2026-09-06) — ✅ Complete

- [x] Expanded `/admin/users/[userId]` into an operational learner view with
  real 30-day/all-time activity, active days, study streak, onboarding and
  verification state, pedagogical preferences, declared/demonstrated level,
  avatar and learning goals.
- [x] Added separate learning counts for lessons, scenarios, quizzes,
  HanVocabulary, Missions, Speaking Lab and Writing Lab; the most recent
  Placement result and recent achievements are visible without changing any
  learner-facing system.
- [x] Added per-user monthly AI cost grouped by function, with request, token,
  audio-minute and estimated-cost totals. Recent calls show provider, model,
  historical rate/method and duration evidence from Entrega 2B.
- [x] Added an opt-in-aware, collapsed recent Han text history. Role-play and
  oral-practice messages are excluded. Because the persisted text thread is
  shared by Han Tutor and Han Companion, the admin UI labels it as shared and
  never invents per-system attribution.
- [x] User-list last access now uses real `LearnerActivitySession` evidence
  instead of the `daily_login` reward proxy. No schema or migration changes
  were required.
- [x] Scoped ESLint, typecheck, diff check, and 3/3 real-database back-office
  integration tests pass, including independent Tutor, Companion and Speaking
  Lab activity totals. Test isolation was hardened so real active announcements
  do not invalidate the announcement test and are never modified by cleanup.

## Admin AI reliability operations — Entrega 5 (2026-09-08) — ✅ Complete

- [x] Added `/admin/operations` and “Operaciones IA” to the isolated admin
  shell, with 7/30/90-day filters, overall success rate, provider errors,
  daily-cap blocks, affected users, p50/p95 latency and a daily operational
  pulse.
- [x] Added per-feature and per-provider/model reliability tables, normalized
  error-code counts, actionable alerts for elevated failure/latency/cap use,
  and the 20 most recent incidents linked to the existing user 360° view.
- [x] Added `AiOperationLog` as a separate, additive operational record while
  preserving `AiUsageLog` as completed-call cost accounting. The new table
  stores only function, outcome, provider/model when known, normalized code,
  latency and timestamp—never prompts, responses, transcripts, audio or raw
  provider errors.
- [x] Instrumented every paid AI/TTS/STT surface, including Han Tutor and Han
  Companion chat/transcription/speech, Companion memory extraction, live voice
  assessment, Learning Journey interactions and reflection, Placement,
  Missions, Speaking Lab, Writing Lab and HanVocabulary. Existing fallbacks and
  daily caps remain intact; best-effort telemetry cannot break learner flows.
- [x] Applied migration `20260908090000_add_ai_operation_logs`. Metrics are
  intentionally non-retroactive and begin with calls made after this delivery.
- [x] Prisma format/validation/client generation, typecheck, scoped ESLint,
  3/3 focused unit/component tests, the new real-database integration test and
  a 78/78 regression across 10 affected integration suites all pass.

## Admin per-user AI limits — Entrega 5B (2026-09-08) — ✅ Complete

- [x] Preserved every existing general per-feature limit and added optional
  per-user exceptions with three explicit states: inherit the general limit,
  use a custom positive daily amount, or block the feature for that learner.
- [x] Added the controls to each learner's 360° admin view with today's spend,
  request count, general limit and effective configuration. `/admin/limits`
  now explains precedence and links directly to user selection.
- [x] Added `AiUsageUserCap` with a composite user/feature key and cascading
  cleanup. `checkDailyUsageCap` resolves user override → general feature cap →
  default cap, and operational logs distinguish individual blocks/custom-cap
  exhaustion from general-cap exhaustion.
- [x] Translated the 21 internal AI feature labels in admin views, including
  “Conversación de Mission”, “Evaluación final de Mission”, “Voz generada de
  Han” and “Evaluación de conversación por voz”.
- [x] Applied migration `20260908100000_add_user_ai_usage_caps`; Prisma reports
  all 52 migrations current. Typecheck, scoped ESLint, 6/6 authorization/action
  tests and 12/12 real-database limit/cost tests pass.

## Full-app optimization pass (2026-09-08) — ✅ Complete

Closes out Parte 2 of the earlier audit plus a new latency pass, at the
user's explicit request ("optimiza todo lo que tenemos... costos de
demora y también de prisma"). Every fix below has its own before/after
test verification, not just a read-through.

- [x] **Reward-chain idempotency bugs** (same class already fixed once in
  `scenario-completion.ts` via `rewardsGrantedAt`):
  `mission-data.ts`'s `endMissionAttempt` now writes the completion state
  and its `ProgressEvidence` rows in one `db.$transaction` instead of two
  separate writes. `reflection.ts`'s `getOrGenerateLessonReflectionReport`
  gained its own `rewardsGrantedAt` marker (migration
  `20260908110000_add_lesson_reflection_rewards_granted_at`) so a partial
  failure between creating the report and granting achievements/coins gets
  retried on the next view instead of silently losing the reward forever.
  Placement-credited reports are marked settled at creation (they never
  owed this reward chain to begin with). 21/21 mission/reflection/
  placement-credit integration tests pass.
- [x] **5 of 6 missing indexes applied** (migration
  `20260908120000_add_missing_query_indexes`): `ExerciseAttempt`,
  `WritingAttempt`, `WritingTask`, `CoinLedgerEntry` gained indexes
  matching their real query shapes; `SpeakingSession`'s unused
  `(userId, startedAt)` index replaced with two that match real usage.
  `ProgressEvidence`'s originally-recommended index was **dropped** after
  verifying the only real query against that table doesn't need it — would
  have been pure write overhead. 47/47 affected integration tests pass.
- [x] **Admin dashboard join anti-pattern**: `admin-dashboard.ts`,
  `admin-analytics.ts`, `admin-ai-operations.ts` used a
  `user: { email: { not: ADMIN_EMAIL } } }` join on every activity table
  (20 call sites) to exclude the admin's own usage from every metric.
  Replaced with a plain `userId: { not: excludeUserId }` filter, resolved
  once per page via the already-cached `requireAdministrator()` and passed
  in as a parameter — turns an unindexable per-row join into a plain
  indexed-column filter, and keeps the data functions auth-free (they no
  longer import next-auth, so integration tests can call them directly).
  Verified with 2 new safety-net tests written *before* the refactor
  (attach marker-tagged fake activity to the real admin account, confirm
  it's excluded) — both passed against the old join-based code, then again
  against the new code. 7/7 admin integration tests pass.
- [x] **Prisma connection endpoint investigated, current setup confirmed
  correct**: the earlier Parte 2 finding recommending a switch to the
  pooled endpoint was wrong. Per Prisma's own guidance, the pooled
  endpoint pairs with the `@prisma/adapter-ppg` edge driver; this app uses
  `@prisma/adapter-pg` (`src/lib/db.ts`), for which the **direct** endpoint
  is the documented recommendation. No change made — correcting the record
  instead of applying a bad fix.
- [x] **Marketing homepage is static-eligible again**: `app/layout.tsx`
  read the theme cookie via `cookies()` in the ROOT layout, which forced
  *every* route — including the public, no-per-user-data marketing
  homepage — out of static rendering. Replaced with a `beforeInteractive`
  inline script that sets `data-theme` on the client before paint (same
  no-flash guarantee, the standard next-themes technique, zero visual
  change). Verified via raw HTML: the server no longer emits `data-theme`
  on `<html>`, and the script is present and running.
- [x] **Code-splitting for the always-mounted app shell**:
  `AiTeacherChat` (which statically pulled in the ~1980-line
  `HanVoiceConversation` regardless of whether voice is used) is now
  `next/dynamic(..., {ssr:false})`-loaded from `ai-teacher-bubble.tsx`,
  only fetched when a learner actually opens Han. `AchievementCelebration`
  and `CoinCelebration` in `app-shell.tsx` are similarly code-split
  (`ssr:false` isn't legal in that Server Component, but plain `dynamic()`
  still splits the chunk). 4 test assertions in `shell.test.tsx` updated
  to await the now-async chunk load; 26/26 component tests pass.
- [ ] **Image compression not done**: `public/avatar/*.png` (30MB) and
  `public/mascot/*.png` (15MB) are unpostprocessed exports, some over 1.8MB
  each for flat character art `next/image` then has to resize on every
  cold cache hit. `hancoins-icon.png` is 1254×1254 for a ~24px icon. Pure
  asset-pipeline work (pngquant/oxipng or WebP masters), zero code change
  — the only item from this pass not yet done.
- [x] Full `tsc --noEmit` and `eslint .` (whole project, not just changed
  files) pass with zero errors after every step above.
- [x] **Fixed the pre-existing production build failure** (unrelated to
  everything else in this pass, found only because the user asked whether
  pushing today's work could break what's currently live): `next build`
  had never actually been run end-to-end this whole time — `tsc`/`eslint`/
  the dev server all stayed green because none of them catch this class of
  error. `placement-exam.ts` exported a plain error class from a
  `"use server"` file (only async functions are legal there), a hard
  Turbopack failure cascading into 16 build errors on every placement
  action. If Vercel auto-deploys `master`, every deployment since this bug
  was introduced (pre-2026-09-05) has likely been failing silently,
  meaning production may have been stuck on a stale pre-Han-Companion/
  HanCoins build. Fixed by no longer exporting the class (it was only ever
  used inside that same file). `npm run build` now exits 0; confirmed the
  homepage renders as static (○) as intended by this pass's earlier fix.
  **Worth checking on Vercel's dashboard that the next deployment actually
  succeeds.**

## Bilingual interface — Phase 1 (2026-09-09) — ✅ Complete

- [x] Added Spanish and English interface locales with required `/es/...` and
  `/en/...` learner-facing routes. Legacy unprefixed links now redirect using
  the explicit locale cookie, weighted browser language, then Spanish as the
  safe default.
- [x] Localized the complete public marketing homepage and authentication flow
  (login, registration, forgotten password, password reset, email verification
  redirects and user-visible server errors), including localized metadata,
  canonical URLs and `hreflang` alternatives.
- [x] Added an ES/EN selector that preserves the current path, query and hash,
  persists the preference in a one-year cookie and updates an existing
  learner profile's `interfaceLanguage` without changing
  `explanationLanguage`.
- [x] Kept `/admin/...` unprefixed and Spanish-only for the private owner MVP;
  APIs remain locale-neutral.
- [x] Preserved the product boundary: no Han prompt, personality, memory,
  voice, transcription, response-language or pedagogy behavior was changed.
  Learning Journey Speaking, Speaking Lab and Han remain separate systems.
- [x] Verified production build, typecheck, scoped ESLint, unit, component,
  accessibility and authentication integration coverage. Verified on the real
  local server that ES ⇄ EN switching works and retains navigation state.
- [x] Phase 2 completed below: learner shell, onboarding, Dashboard, Settings,
  placement-exam chrome, locale persistence and direct localized navigation.

## Bilingual interface — Phase 2 (2026-09-09) — ✅ Complete

- [x] Localized the complete onboarding flow, including validation feedback,
  recommendation presentation and the UI around the embedded placement exam.
  The placement speaking conversation keeps the same component, scenarios,
  voice, turn limits and grading behavior.
- [x] Localized the authenticated shell (sidebar, mobile navigation, top bar,
  user menu and theme controls), Dashboard and Settings. Dashboard review
  labels now translate from structured context while authored lesson titles,
  Chinese and pinyin remain untouched for the later curriculum phase.
- [x] Kept interface language and Han explanation language independent.
  Changing the interface in Settings synchronizes profile, cookie and URL; a
  post-login handoff restores the saved profile language on another device for
  both credentials and Google sign-in while preserving the requested page.
- [x] Converted learner navigation, lesson completion routes, Speaking Lab QA
  routes, announcement CTAs and cache revalidation to locale-aware paths. The
  legacy unprefixed redirect remains only as backward compatibility.
- [x] Fixed two locale-prefix compatibility issues discovered during the pass:
  the lateral Han Tutor stays hidden on both `/es/han` and `/en/han`, and
  activity attribution again distinguishes Han Companion, Speaking Lab,
  Placement and Learning Journey after stripping the locale.
- [x] Confirmed with a targeted diff audit that Han prompts, personality,
  memory, voice, transcription, response-language and speech-processing files
  were not modified. Han Tutor, Han Companion, Learning Journey Speaking and
  Speaking Lab remain separate systems.
- [x] Production build and typecheck pass. Scoped ESLint passes with zero
  errors/warnings; whole-repository lint is blocked by an unreadable,
  pre-existing `.codex-tmp/informe-academico/...` LibreOffice directory, which
  was intentionally left untouched. Unit 661/661, component 60/60, smoke 1/1,
  and 260/266 full integration assertions pass.
- [x] ~~Pre-existing test maintenance, outside this phase~~ **Reconciled
  2026-09-16 (BASE-02):** both fixed later the same week (see the
  2026-09-14 QA gap closure further down: "one was a stale test mock and
  the other a too-short timeout... isolated, they now pass 11/11"), and the
  `.codex-tmp` lint exclusion this same item references is fixed today
  (BASE-03, `eslint.config.mjs`). Superseded.

## Bilingual interface — Phase 3A (2026-09-09) — ✅ Complete

- [x] Localized the complete learner interface for Progress, Achievements,
  Leaderboard and the avatar Shop in Spanish and English. Authored scenario
  and lesson names remain unchanged for the curriculum-content phase.
- [x] Localized achievement titles/descriptions/categories and locale-aware
  unlock dates while preserving permanent achievement keys, conditions,
  rewards and database records.
- [x] Localized the weekly leaderboard countdown, rank and empty states while
  preserving its General Level calculations, ranking and weekly payouts.
- [x] Localized avatar tabs, animals, accessories, rarity/equip/preview states,
  HanCoin explanation and purchase/equip errors. Prices, ownership and coin
  transaction logic were not changed.
- [x] Localized the global achievement and HanCoin celebrations. Admin-authored
  HanCoin messages are still displayed verbatim; their bilingual variants
  belong to the later user-communications phase.
- [x] Han Tutor, Han Companion, Learning Journey Speaking and Speaking Lab
  remain separate. No Han prompt, personality, memory, voice, transcription,
  response-language, pedagogy or evaluation logic was changed.
- [x] Production build and typecheck pass. Scoped ESLint passes with zero
  errors/warnings; unit 662/662 and component 62/62 pass, including dictionary
  parity and localized achievement/scenario/leaderboard coverage.
- [x] Phase 3B Speaking Lab (2026-09-10): localized its complete UI chrome in
  Spanish and English, including modes, recording, shadowing, contextual and
  free-topic practice, feedback, known operational errors and the internal QA
  harness. Existing role/pacing/correction values, authored Chinese/pinyin,
  generated evaluator text, prompts, speech processing, grading and activity
  attribution remain unchanged.
- [x] Phase 3B validation: production build, typecheck and scoped ESLint pass;
  unit 663/663 and component 63/63 pass. The protected real route correctly
  redirects an unauthenticated ES visit to login while retaining
  `callbackUrl=/es/speaking-lab`; visual content QA awaits an authenticated
  learner session and no credentials were automated.
- [x] Phase 3C Writing Lab (2026-09-10): localized the complete learner chrome
  for handwritten paragraphs, translation challenges and custom writing in
  Spanish and English. Localized setup controls, draft states, upload guidance,
  known operational errors, fixed rubric labels and feedback headings while
  preserving authored tasks and generated evaluator observations verbatim.
- [x] Kept Writing Lab behavior unchanged: task/topic/level identifiers,
  English evaluator inputs, custom format/tone values, autosave, image
  preparation limits, paid-call timing, prompts, scoring, persistence, rewards
  and activity attribution are the same as before.
- [x] Phase 3C validation: production build, typecheck and scoped ESLint pass;
  unit 664/664 and component 64/64 pass. The protected ES route redirects to
  login with `callbackUrl=/es/writing-lab`; visual content QA awaits an
  authenticated learner session and no credentials were automated.
- [x] Phase 3D Han Vocabulary (2026-09-10, output-language correction
  2026-09-13): localized its benefits, search controls, automatic-level
  guidance, known operational errors, frequency labels and result-card
  headings in the Han hub and Dashboard word-of-the-day modal. Chinese and
  pinyin remain verbatim; generated learner-facing content now follows the
  active ES/EN interface locale.
- [x] Kept Han Vocabulary's automatic earned-level lookup, input/rate/daily
  limits, parsing, paid-call accounting and activity attribution unchanged.
  Cache keys separate results by word, level and interface locale. Han Tutor
  and Han Companion were not reconfigured.
- [x] Phase 3D validation: production build, typecheck and scoped ESLint pass;
  unit 665/665 and component 65/65 pass. The protected ES route redirects with
  `callbackUrl=/es/han`; authenticated visual content QA remains pending and no
  credentials or paid lookup were automated.
- [x] Bilingual interface Phase 3 complete. The next planned block is Phase 4:
  localized authored curriculum content with shared Chinese/pinyin/audio and
  locale-specific display fields.

## Bilingual interface — Phase 4A foundation (2026-09-11) — ✅ Complete

- [x] Added additive, normalized translation tables for domains, scenarios,
  lessons, lesson steps, learning objectives, missions, mission success
  conditions and mission evaluation criteria. Every row is tied to its base
  content by a cascading foreign key and is unique per interface language.
- [x] Kept canonical English fields on the base records as the safe fallback.
  Slugs, order, difficulty, HSK references, scoring and learner progress remain
  shared rather than duplicated per locale.
- [x] Made Learning Journey, Dashboard/Progress continuation targets, lesson
  headers/objectives and mission display data locale-aware. Existing internal
  callers default to canonical English, so Han's app-context catalog and
  speaking/mission prompt behavior remain unchanged.
- [x] Added a deterministic coverage report (`npm run content:i18n:coverage --
  es`). Current inventory: 9 domains, 41 scenarios, 164 lessons, 984 steps,
  664 objectives, 167 missions, 506 success conditions and 504 evaluation
  criteria; all currently fall back safely until the Spanish authoring batches
  are added.
- [x] Applied the two additive database migrations and regenerated Prisma
  Client. No existing curriculum row was overwritten or deleted.
- [x] Validation passes: Prisma format/validate, TypeScript, scoped ESLint,
  production build, 672/672 unit tests, 65/65 component tests and 18/18
  targeted content/dashboard integration assertions.
- [x] Phase 4B (2026-09-11): extended normalized translations and locale-aware
  learner reads to dialogues and line meanings, speaker roles, vocabulary
  meanings/examples, authored grammar explanations/examples, exercises,
  options/hints, quizzes/questions/options and writing-task titles/prompts.
- [x] Kept Mandarin source text, pinyin, audio keys, ordering, correct answers,
  reference answers, scoring and AI-generated grammar detail on the canonical
  records. Grading and prompt builders still load canonical content; only
  learner-facing reads accept the interface locale.
- [x] Preserved the Han boundary explicitly: Han's navigation catalog and the
  Speaking/Mission prompt paths keep their canonical English reads. No Han
  personality, memory, voice, transcription, pedagogy or evaluation setting
  changed.
- [x] Applied the additive Phase 4B migration. The expanded coverage report now
  measures 22 content areas, including 1,646 dialogue lines, 3,014 vocabulary
  items, 7,872 vocabulary examples, 909 grammar points, 1,780 exercises, 552
  quiz questions and 179 writing tasks.
- [x] Phase 4C: authored, independently validated and imported explicit Spanish
  content for all 41/41 published scenarios. The 31,996 scenario translation
  units are complete; Chinese, pinyin, placeholders, URLs and scoring data
  remain protected and canonical English remains the safe fallback.
- [x] Prepared the Phase 4C Claude handoff workflow: scenario-scoped JSON
  export, source fingerprint, protected Chinese/placeholder validation, dry-run
  import and explicit atomic `--apply`. No OpenAI API call is used and Han,
  answers, scoring, pinyin and audio are excluded from the exchange package.
- [x] Phase 4C parallel UI work (2026-09-11): localized the fixed lesson chrome
  in Spanish and English across navigation, display toggles, audio controls,
  dialogue, comprehension, grammar, vocabulary, guided practice, writing,
  quizzes, missions, speaking, reflection and results. The shared mission
  runtime now receives the same locale-aware labels.
- [x] Kept Claude's pilot file
  `project/curriculum-translations/es/getting-started.json` untouched while its
  authored curriculum translation is in progress. Mandarin, pinyin, authored
  lesson data, generated feedback and Han-spoken/scripted text remain outside
  this UI-chrome pass.
- [x] Preserved the Han boundary: no Han Tutor, Han Companion, voice,
  transcription, prompt, personality, memory, pedagogy or evaluation behavior
  changed. Production build, non-incremental TypeScript and scoped ESLint pass;
  the focused bilingual regression set passes 34/34 and the complete
  unit/component run passes 740/741. The remaining assertion is an existing
  lazy-load timing failure in `AiTeacherBubble` after its dialog has already
  opened, unrelated to lesson localization.
- [x] Phase 4C first authored batch (2026-09-11): fixed the exchange validator
  so ordinary Spanish accents no longer masquerade as added tone-mark pinyin,
  while source pinyin still has to survive unchanged. Added regression tests
  for both the accepted Spanish and rejected altered-pinyin cases.
- [x] Validated, dry-ran and atomically imported Claude's completed
  `getting-started.json`: 743 translated fields across 609 normalized Spanish
  rows. Coverage now reports 1/41 scenarios, 4/164 lessons, 40/3,014
  vocabulary items and 120/7,872 vocabulary examples, with English fallback
  everywhere else.
- [x] Increased the atomic scenario-import timeout from one to five minutes
  after a verified full rollback at the old 60-second limit. Also allowed
  zero-coverage export batches to reuse only exact matching shared
  translations; any differing stored value still blocks as concurrent work.
  Six focused exchange tests, non-incremental TypeScript and scoped ESLint pass.
- [x] Phase 4C follow-up batch (2026-09-12): independently revalidated,
  database-dry-ran and sequentially imported `family`, `weather-and-seasons`,
  `daily-life-and-feelings`, `around-the-house` and `basic-shopping`. Each
  scenario passed again against the database state produced by the preceding
  import; no shared-row conflict or partial write occurred.
- [x] The six imported Foundation scenarios contain 4,423 translated fields
  across 3,614 normalized Spanish rows. Coverage now includes 6/41 scenarios,
  24/164 lessons, 240/3,014 vocabulary items, 720/7,872 vocabulary examples,
  264/1,780 exercises and 336/1,868 quiz options. All other curriculum remains
  available through canonical English fallback.
- [x] Phase 4C ten-scenario batch (2026-09-12): independently revalidated,
  database-dry-ran and atomically imported `phone-and-communication`, `school`,
  `hobbies`, `body-basics`, `money-banking`, `places-hours`,
  `opinions-comparisons`, `plans-and-time`, `restaurant` and `shopping`.
- [x] Generalized the additive-batch concurrency guard after `phone` advanced
  the shared baseline before `school` was imported: a stale package may proceed
  only when every already-stored non-empty value matches its incoming value
  exactly. Any differing value still reports conflicts and blocks before a
  transaction. Focused tests 6/6, non-incremental TypeScript and scoped ESLint
  pass.
- [x] Phase 4C closure (2026-09-13): all 41 scenario packages were revalidated,
  dry-run checked and imported atomically. Fresh exports matched every authored
  unit exactly before their translation baselines were synchronized.
- [x] Closed the published standalone-content gap with an idempotent, atomic
  backfill: 1,422 vocabulary items, 429 grammar points, 429 grammar examples and
  15 writing challenges now have explicit Spanish translations. Existing
  translations are never overwritten; exact source-equivalent reviewed content
  is reused deterministically and the writing manifest verifies source text.
- [x] Final Spanish curriculum coverage is 100% in all 22 measured areas:
  9/9 domains, 41/41 scenarios, 164/164 lessons, 984/984 steps, 664/664
  objectives, 167/167 missions, 506/506 success conditions, 504/504 evaluation
  criteria, 164/164 dialogues, 328/328 speakers, 1,646/1,646 dialogue lines,
  3,014/3,014 vocabulary items, 7,872/7,872 vocabulary examples, 909/909 grammar
  points, 1,869/1,869 grammar examples, 1,780/1,780 exercises, 5,472/5,472
  exercise options, 2/2 hints, 164/164 quizzes, 552/552 questions, 1,868/1,868
  question options and 179/179 writing tasks.
- [x] Final bilingual verification (2026-09-13): cleared a stale Next 16
  Turbopack development cache that still referenced the removed unprefixed
  `/tienda` route. Fresh ES/EN requests and a complete production build now
  pass; the build includes `/[locale]/tienda` and all 56 generated pages.

## Authenticated bilingual QA closure (2026-09-13) — ✅ Complete

- [x] Completed an authenticated ES/EN learner walkthrough with an isolated
  temporary account: onboarding, Dashboard, Learning Journey, scenario detail,
  lesson vocabulary, Speaking Lab, Writing Lab, Progress and Store.
- [x] Localized the remaining authored-content chrome in Learning Journey and
  lessons: chapter names, lesson counts, current position, availability states,
  difficulty labels, outcome/final-mission headings, vocabulary introduction
  and Han audio accessibility labels.
- [x] Fixed locale propagation in onboarding recommendations and Speaking Lab
  lesson options. Spanish recommendations now use the translated curriculum;
  duplicate domain/scenario labels are collapsed, including `Hacer amigos`.
- [x] Removed uncontrolled-to-controlled select warnings in onboarding without
  changing saved learner values or the onboarding contract.
- [x] Preserved the Han boundary: no Han Tutor/Companion personality, prompt,
  memory, voice, transcription, pedagogy, assessment or runtime behavior was
  changed. The reusable speech button only gained optional localized UI labels.
- [x] Final verification passes: Spanish curriculum coverage remains 100% in
  all 22 measured areas (31,996 units); TypeScript and production build pass;
  678/678 unit, 69/69 component, 268/268 integration and 1/1 smoke tests pass.
- [x] Deleted the isolated QA account and verified that no account row remains;
  the local development server is running and the browser is signed out on the
  Spanish login screen.
- [x] Han Vocabulary language correction (2026-09-13): searches launched from
  the Spanish interface now generate the complete learner-facing card in
  Spanish (gloss, explanation, example translations, related meanings,
  registers, mistakes and curiosities); `/en` remains English. This applies to
  both the Han hub and Dashboard word-of-the-day modal, while Mandarin and
  pinyin remain unchanged. Han Tutor/Companion behavior and language
  preferences remain separate and untouched.
- [x] Persistent shared Han Vocabulary cache (2026-09-13): added an additive
  `VocabularyLookupCache` table keyed by normalized input, earned HSK level,
  interface locale and prompt version. A first cache miss generates and records
  the paid AI call; every later learner, process restart or deployment reuses
  the stored result without calling the provider, consuming the daily AI cap
  or writing another `AiUsageLog`. The existing in-process promise cache remains
  as the first layer to collapse simultaneous requests on one server. Input,
  rate and daily limits, scoring and Han Tutor/Companion remain unchanged.

---

## BASE-02 reconciliation pass (2026-09-16)

Went through every unchecked item above this line individually against the
current code (not just the surrounding prose) before touching anything.
13 were verifiably superseded by later work and are now marked `[x]` in
place, each with a `**Reconciled 2026-09-16 (BASE-02)**` note citing exactly
what was checked - mostly the placement exam pilot (full HSK1-9 content,
`applyPlacementCredit` lesson crediting, Speaking placement) and the
recommendation-routing fix, plus the CI/lint items this same pass closed
directly (see QA-* below). The remaining ~48 unchecked items were left
exactly as they were: almost all of them are pre-beta production/ops
decisions (hosting, real email, backups, monitoring, device QA, content
review) that this file's own new P0/BETA sections below already track more
currently - closing them here would just be duplicate bookkeeping, not
verified completion. Two exceptions worth calling out because they connect
directly to the new audit's security work: the Speaking placement
persistence migration is now implemented; only authenticated provider-side
audio/transcript provenance remains under SEC-03. The db-operations-optimization.md
backlog was left unverified rather than guessed at either way, since
confirming its dozen individual findings against current code is its own
task, not a five-minute check. No item was moved to `TASKS_ARCHIVE.md` -
that file already exists as a separate, earlier phase history, and
relocating scattered individual checkboxes out of this one seemed more
likely to lose context than help; reconciling them in place was the
smaller, safer change.

---

## Pre-beta audit and execution program (2026-09-14) — 🔴 Active

The complete evidence, risk matrix, security checklist, ordered deliveries and
acceptance criteria now live in
[`AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md`](AUDITORIA_INTEGRAL_Y_PROXIMOS_PASOS.md).
That document is the source of truth for pre-beta work; keep updates here terse.

- [x] **P0 dependency security:** Next.js `16.3.5` closes the critical runtime
  advisories; the complete local quality gate passes. Four high findings remain
  only in the Prisma CLI chain under an exact CI-enforced exception expiring
  2026-10-16; see the audit document for scope and mitigation.
- [ ] **P0 placement integrity:** enforce session ownership/current-question
  order and make Speaking placement evidence, scores and credit server-owned.
  Session ownership, current-question order and replay protection are complete;
  Speaking attempt state, level, scoring and credit are also server-owned and
  persisted. Keep open only for authenticated provider-side transcript/audio
  provenance (`SEC-03B`).
- [ ] **P0 progress integrity:** make lesson-step completion, Vocabulary/Quiz
  grading, curricular Speaking references and Realtime evidence authoritative on
  the server rather than trusting browser-provided results or structures.
  Lesson-step order/completion, Vocabulary grading and Quiz membership/
  completeness are now server-owned and covered by adversarial tests. Keep open
  for curricular Speaking references and trusted Realtime evidence only
  (`SEC-04B`); the distinct Han systems were not modified.
- [ ] **P0 authentication abuse controls:** the Resend adapter, production
  verified-account gate, token hashing, transactional one-time consumption,
  JWT `sessionVersion` revocation, PostgreSQL identity/IP limits and form
  honeypots are implemented and tested. Keep open for staging email/domain
  activation, safe verification resend, managed progressive anti-bot,
  versioned Terms/Privacy consent, dummy-hash timing protection and the
  remaining advanced password/session/OAuth policy (`SEC-05`–`SEC-07`).
- [ ] **P0 privacy execution:** code-side recording retention and physical
  learner-file deletion are implemented and tested (`SEC-08`, 2026-09-19):
  0/7/30/90/365-day or indefinite choices, durable retries, account-deletion
  inventory, 24-hour orphan cleanup and 30-day audit-metadata purge. Keep open
  for production cloud-storage validation, monitoring/alerting and a public
  Privacy Policy whose backup-erasure language matches the selected providers.
- [x] **P1 learner upload hardening (`SEC-09`, 2026-09-19):** Speaking Lab now
  validates and fully parses WebM/Ogg/M4A/WAV on the server, derives real
  duration/sample rate/channels, enforces 15 MiB and five-minute limits, stores
  canonical server-generated extensions, and serves private audio through the
  storage abstraction. Handwritten Writing now fully decodes and re-encodes
  JPG/PNG/WebP with count/byte/pixel/dimension limits, orientation correction
  and metadata removal. Han was intentionally not changed. Typecheck, global
  lint, dependency audit, production build, 699 unit, 69 component, 292
  integration and 1 smoke test pass.
- [x] **P1 horizontal-access audit (`SEC-10`, 2026-09-19):** inventoried all
  32 Server Action files, 11 API handlers and the learner/admin server layouts.
  The 10 private-ID families use the authenticated actor, with existing A/B
  integration coverage plus new negative tests for private audio, achievement
  keys, coin-ledger IDs and announcement receipts. No open IDOR was found;
  shared lesson/scenario/dialogue/vocabulary IDs remain catalog references,
  never substitutes for a learner identity. New private-resource endpoints
  must extend the matrix and include an A/B test.
- [x] **P1 Git secret-history gate (`SEC-11`, 2026-09-19):** scanned all 23
  reachable commits plus the complete non-ignored working tree without printing candidate
  values. No probable OpenAI/Anthropic/GitHub/Google/AWS/Slack/Resend key,
  private key, credentialed database URL or non-placeholder sensitive env
  literal was found, so no rotation was triggered. Added a reusable
  `security:secrets` gate and full-history checkout in CI; provider-side secret
  scanning remains a recommended independent operational control.
- [ ] **P0 deterministic CI:** portable fixtures, a disposable PostgreSQL runner
  and the complete CI gate are implemented; the clean local run passes 699 unit,
  69 component, 292 integration and 1 smoke test. Keep open until a remote
  GitHub Actions run passes twice from scratch (`QA-06`).
- [ ] **P0 production baseline:** HTTPS, purpose-built security headers/CSP,
  private cloud storage, least-privilege DB access, backups with a restore drill,
  monitoring, rollback and a global AI cost circuit breaker.
  The initial security-header/CSP baseline is implemented and unit-tested; the
  deployment, private storage, backup and observability work remains open.
- [x] **P1 first-run experience audit (2026-09-26):** completed the real
  Spanish onboarding and both legs of Han's guided tour with a disposable,
  verified learner at 390x844 and 1440x900. Route-driven interactions through
  Aprender, Han, Progreso, Tienda and Configuración work; replay from Settings
  works. Fixed the centred 6-of-6 card so it closes with “Empezar a estudiar”
  instead of restarting the welcome choices, aligned the mobile copy with the
  visible “Aprender” label, and removed the one-shot `?tour=1` flag on finish or
  skip so a refresh cannot reopen it. The lowest onboarding level now explicitly
  includes learners starting from zero in both locales. The focused component
  suite passes 31/31, typecheck and targeted lint pass, and the temporary
  learner was deleted.
- [x] **P1 beginner-cohort learning scope (2026-09-26):** the first public
  cohort now receives Foundations only, while Everyday Life and Advanced remain
  visible as honest previews and are protected across chapter, scenario, lesson,
  dashboard, progress and direct-URL entry points. Placement is omitted for this
  cohort. Speaking Lab exposes exactly three curriculum-backed guided stations,
  unlocked from the authenticated learner's own lesson progress, with pinyin
  visible in practice. Administrator/QA and `HANGO_BETA_LEARNING_SCOPE=FULL`
  preserve the complete original Journey, placement exam and Speaking Lab. The
  switch is reversible, no curriculum/data was deleted, and Han Tutor/Companion,
  Learning Journey Speaking, prompts, voice and transcription were not changed.
  Verified in both locales, through a real 390x844 learner flow, with focused,
  unit, component and accessibility coverage; see
  [`BETA_PRIMERA_PRUEBA_ALCANCE_PEDAGOGICO.md`](BETA_PRIMERA_PRUEBA_ALCANCE_PEDAGOGICO.md).
  Production build and smoke pass. Technical closure on 2026-09-27 brought the
  complete integration suite to 296/296: private-retention fixtures are now
  isolated by owner, database-backed integration tests have a dedicated
  30-second ceiling, and high-level placement credit batches idempotent writes
  and defers repeated reward recalculation until the scenario batch is ready.
  The focused placement path improved from 331 seconds to 86 seconds (about
  74%) without changing placement results, rewards or learner-visible scope.
- [x] **P1 closed-beta invitation access (2026-09-27):** new account creation
  is now controlled by a normalized administrative email allowlist shared by
  credentials and Google OAuth. `/admin/invitations` records cohort, expiry,
  activation and revocation; generic registration responses avoid account or
  invitation enumeration, existing accounts keep normal sign-in, and
  `HANGO_BETA_ACCESS_MODE=OPEN` provides a code-free rollback. The migration is
  additive and applied to development. Focused invite/OAuth, registration and
  full learner-path tests pass; real Google callback verification remains part
  of the future HTTPS beta deployment. Han was not changed.
- [x] **P1 closed-beta feedback and support (2026-09-27):** added an
  attachment-free, bilingual report flow available throughout the authenticated
  app. Reports derive their owner from the session and capture category,
  optional score, route and locale; learners can see the five latest reports
  and administrative replies. `/admin/feedback` provides NEW/REVIEWING/RESOLVED
  triage, visible responses and private notes. Existing announcements now target
  ES, EN or both, while historical null-locale announcements remain global.
  Settings publishes the temporary beta support address and a two-business-day
  response target. The additive migration is applied; targeted unit/component
  tests pass 12/12 and the real-database communication suite passes 5/5. Han's
  behavior and all four distinct speaking/tutor systems were untouched.
- [x] **P1-08 local beta/privacy gate (2026-09-27):** added the reproducible
  `npm run test:beta` gate and
  [`beta-p1-08-qa-matrix.md`](beta-p1-08-qa-matrix.md). It uses an ephemeral
  PostgreSQL/storage environment, never a paid AI key or learner data. The
  selected static suites pass 246/246; the deep integration selection passes
  163/163 plus smoke, including 3/3 for one-time email verification and 2/2 for
  A/B lesson-progress/announcement isolation. Existing
  coverage also verifies private audio, feedback, per-user limits, placement,
  quiz, Missions, Writing and Speaking ownership. No Han behavior was changed.
- [ ] **P1-08 external/manual closure:** repeat the matrix on the HTTPS beta
  domain with Resend, Google OAuth, cloud storage, an isolated backup restore,
  Android Chrome, iPhone Safari and one newly invited real account. Until then,
  P1-09/ola 0 remains blocked even though the local gate is green.
- [x] **P1-03 private Speaking Lab direct upload (2026-09-27):** production no
  longer sends learner recordings through a Server Action body. It requests a
  ten-minute, path/owner/session-bound Vercel Blob token, uploads directly to a
  private object, then downloads and validates the bytes server-side before STT
  or feedback. Token requests must originate from HanGo itself. Invalid uploads
  are removed, interrupted uploads are covered by orphan retention, and
  cross-user finalization cannot delete the owner's object. Local development
  retains the previous filesystem path. Focused storage/security tests pass
  24/24, Speaking Lab passes 12/12 against ephemeral PostgreSQL, the static beta
  gate passes 246/246 and the production build is green. Real Blob, >4.5 MB
  mobile upload and redeploy persistence remain P1-03.
  **OIDC deployment follow-up (2026-09-28):** adapted the provider and direct
  client upload handshake to Vercel Blob's new short-lived OIDC default
  (`BLOB_STORE_ID` + presigned URLs), retaining the legacy static token only as
  a non-Vercel fallback. Focused tests pass 14/14, the static beta gate passes
  247/247, typecheck/lint and the production build pass; no Han behavior
  changed.
- [x] **P1-03 initial HTTPS deployment foundation (2026-10-02):** Vercel now
  generates Prisma Client during installation, production deploys as the
  `HanGoLearn` repository owner, and `https://hango-three.vercel.app` plus
  `/api/health` respond successfully with Prisma Postgres and private Vercel
  Blob healthy. `NEXT_PUBLIC_APP_URL` and `HANGO_STORAGE_PROVIDER` are scoped
  to Production. The curriculum importer can now re-key the 41 reviewed Spanish
  packages onto a freshly seeded database only after an exact ordered match of
  every authored source unit; any content drift or conflicting target
  translation aborts before writes. Unit tests pass 8/8, with typecheck,
  targeted lint and formatting green. Production migrations, one-time seed,
  translation import, admin bootstrap, Resend, Google OAuth and the real-domain
  manual gate remain open; Han was not changed.
  **Production data follow-up (2026-10-03):** all 70 migrations are applied to
  the dedicated Prisma Postgres database; the one-time seed contains 9 domains,
  41 scenarios, 164 lessons and 211 placement questions, with zero users. All
  enriched curriculum rows were published without copying learner data. The 41
  reviewed scenario packages plus the standalone backfill are imported and ES
  coverage is 100% across all 22 measured areas (31,996 units, zero fallbacks).
  The portable importer now compares exact authored-content multisets, prefers
  stable IDs, rejects ambiguous duplicate translations and uses deterministic
  tie-breaks. Production health is 200 and all temporary direct-connection
  files were deleted. Admin bootstrap, Resend, Google OAuth, OpenAI, backup
  restore and the real-device/manual gate remain open; Han was not changed.
- [ ] **Beta readiness:** real Android/iPhone QA, privacy/terms/AI disclosure,
  human linguistic review, performance/image optimization and a measured closed
  beta before deciding on PWA/APK.
- [ ] Reconcile the older 51 unchecked items in this file against the code; a
  number are stale or superseded and must not be treated as 51 independent
  missing product features.

**Boundary:** none of this work changes Han Tutor/Companion personality,
prompts, pedagogy, voice or transcription. Han Tutor, Learning Journey Speaking
and Speaking Lab remain distinct systems. Security work around Realtime is
limited to ownership, provenance, persistence and authorization.

---

## Conversational AI improvement program (2026-10-04) — 🟡 Design

- [x] Local push-to-talk baseline: microphone input is enabled only while the
  learner holds the talk control; release commits the turn for transcription
  and reply. Automatic server VAD is disabled for these explicit turns. This
  local batch has not been committed or deployed yet.
- [x] Natural Han Tutor response modality: typed turns now always produce a
  visible, silent written reply; releasing the small hold-to-talk control sends
  its transcript immediately and produces one spoken reply while keeping the
  text visible; Realtime voice keeps its spoken response and visible transcript.
  The obsolete text/audio/audio-only selector is replaced by one accessibility
  toggle that can mute automatic playback after the Tutor microphone without
  affecting live voice. Its legacy database enum remains temporarily intact and
  is reused only as this backwards-compatible mute flag until a safe later
  cleanup. This local batch has not been committed or deployed yet.
- [x] Contextual pronunciation coaching in the existing Han Tutor: an explicit
  learner request now adapts to the real target length without truncating the
  Mandarin the learner wants to practise. A 1–4-syllable target gets <=45 words
  of coaching; 5–12 syllables get <=65 words plus 2–3 rhythm groups; a longer
  target gets <=80 words, the complete phrase split into 2–4 prosodic groups,
  and one natural 2–8-syllable chunk per turn (preferably 2–6) before the chunks
  are recombined. Han conversationally offers the
  reason for the tone change without adding a button; if accepted, it expands
  that same target in 3–5 sentences and <=80 words without restarting the
  drill. Grammar, vocabulary and usage requests keep Tutor's broad teaching
  path. A recorded follow-up can attach bounded local tone-contour and pause
  evidence to that same Tutor turn; Realtime instead listens to its own actual
  audio. For a long phrase, local contour analysis scores only the active safe
  chunk, never the complete sentence as an undifferentiated contour. Feedback
  corrects one defensible issue at a time and stops after at most four guided
  attempts. Transcript text is never treated as proof of
  pronunciation. This does not create a new Han or alter Companion, Learning
  Journey Speaking, Speaking Lab or placement. Typecheck, lint, 192 focused
  tests and the real short/detail/grammar/long-phrase localhost flows pass; a
  real learner-voice attempt is still required before deployment.
- [x] Pronunciation microcoaching follow-up (2026-10-07). A transcript match of
  at least 80% now closes that specific target immediately instead of leaving
  it open for four attempts; this is a progression decision, not a claim that
  transcription measures acoustic perfection. Han must name one brief success
  and move to a different nearby target (or end the drill), and may not keep
  isolating the passed syllable. Unsuccessful attempts are constrained to one
  high-confidence cue, one demonstration and one direct repetition request,
  with no meaning lesson, translation, spoken pinyin, extra examples or
  meta-question. Initial pronunciation coaching has length-sensitive word and
  audio-token ceilings; grammar, vocabulary and ordinary Tutor explanations
  retain their broad path. The exact `共享喝水` → `我想喝水` regression is covered.
  Typecheck, targeted lint and focused pronunciation/Realtime tests pass. No
  Companion, Learning Journey Speaking, Speaking Lab or placement prompt was
  changed; nothing is committed or deployed.
- [x] Youthful, expressive delivery for the existing Han Tutor only. Cedar stays
  as the voice while prompt direction now makes accent neutrality distinct from
  emotional neutrality: delivery can shift through audible warmth, curiosity,
  light playfulness, focused correction and earned energy while avoiding an
  announcer, call-center, children's-host or exaggerated-actor sound. Both the
  Tutor speech-synthesis route and Tutor Realtime session receive the style;
  Han Companion and every Learning Journey/Speaking Lab/placement role-play do
  not. Audio cache keys now include Tutor/Companion style so old neutral clips
  cannot mask the update. Typecheck, lint, the combined 206 focused Han tests
  and 4 database-backed speech-route integration tests pass. Local listening
  and subjective tuning remain required; nothing is committed or deployed.
- [x] Explicit Realtime interruption while holding to speak. During spoken
  output the red control remains enabled; pressing it starts a clean learner
  buffer, cancels the active response, clears queued WebRTC output and keeps
  the new microphone turn alive when the cancelled response later emits
  `response.done`. This is an interaction-layer improvement shared by the
  existing Realtime surfaces only; Tutor/Companion/role-play prompts, memory,
  evaluation and progress remain separate. Typecheck and 105 focused
  unit/component tests pass, including queued playback after generation has
  already completed. A real-device listening check is still required;
  nothing is committed or deployed.
- [x] Robust local interruption follow-up (2026-10-08). Real-browser testing
  showed that server cancellation alone could leave an already-arriving audio
  fragment audible, while a late `response.output_audio.delta` could restore
  the speaking state and disable the learner's newly held microphone. Pressing
  the red control now mutes the remote audio locally before any network round
  trip, still sends `input clear` -> `response cancel` -> `output clear`,
  measures actual remote audibility, ignores stale audio deltas during the
  interrupted turn and unmutes only for the next legitimate response. The
  client also handles `output_audio_buffer.cleared`. Typecheck, targeted lint
  and 104 focused interruption/recording/modality/Realtime tests pass. A live
  microphone confirmation by the user remains pending; nothing is committed
  or deployed.
- [x] Realtime local-start recovery (2026-10-07). The disappearing
  `Start live conversation` flow was traced to the local test account reaching
  the generic US$1 per-feature daily guard after four conservatively reserved
  sessions, followed by the six-connections-per-ten-minutes burst guard during
  retries. Local development now permits 30 starts per ten minutes and uses a
  US$5 fallback only when neither an explicit user cap nor an explicit feature
  cap exists. Production keeps its existing six-start burst limit and generic
  fallback; explicit admin limits and the global safety budget still win in
  every environment. Start failures are parsed into readable UI copy instead
  of raw JSON and burst responses include retry timing. Typecheck, targeted
  lint and 96 focused unit/component tests pass. The real microphone check is
  left to the user so ambient audio is not captured without consent; nothing
  is committed or deployed.
- [x] Intelligent correction and temporary conversation preferences for the
  existing Han Tutor (2026-10-08). Written chat and Realtime now share one
  contract instead of making conflicting language and correction decisions.
  Han silently chooses one action per turn — continue, natural recast, one
  high-impact micro-correction, clarification, or explicit pronunciation
  practice — and never stacks corrections or produces an unsolicited report.
  Spanish and English carrier sentences keep their language even when they
  quote Mandarin; a substantive Mandarin conversation can continue in Chinese.
  During the currently open Tutor conversation only, the learner can request
  Spanish/English/Chinese, flowing/balanced/strict correction, slower/normal/
  faster speech, or direct actions such as repeat once, divide a phrase, or
  compare one supported difference. These preferences reset with the Tutor
  conversation: no persistent pedagogical memory, new UI, schema or end report
  was added. Tutor voice now uses the same progressive-disclosure rule as text,
  so a narrow question no longer conflicts with an unconditional two-example
  lesson template. Companion, Learning Journey Speaking, Speaking Lab,
  placement and role-play prompts are excluded. Typecheck, targeted lint and
  187 focused unit/component tests pass; subjective live conversation testing
  remains before deployment.
- [x] Tutor/Companion conversation-boundary fix (2026-10-08). A live user test
  exposed that Companion still appended its voice transcript to the floating
  Tutor provider and that a Tutor dialog hidden on `/han/*` could reappear when
  the learner left Companion. Companion now owns a voice-only client transcript
  and an explicit persisted surface tag, never mutates Tutor's visible
  messages/context, and closes any latent Tutor dialog on every standalone Han
  route. Tutor and Companion history reads and resets are filtered separately;
  Speaking role-play evidence remains outside both. Ending Companion performs
  no navigation and leaves its own start screen in place. Typecheck, lint, 189
  focused unit/component tests and 18 database integration tests pass. Live
  browser confirmation remains pending; nothing is committed or deployed.
- [x] Han Tutor sentence-ordering integrity guard (2026-10-08). A live Spanish
  voice question supplied the fixed pieces `弟弟 / 笑了 / 高兴地`, but Tutor
  invented `很`, changed the final tile to `很高兴地`, and proposed the
  ungrammatical order `弟弟笑了，很高兴地`. Written and Realtime Tutor turns now
  recognize ordering/tile requests as a closed set: use every supplied piece
  exactly once, add/remove/split/merge none, treat spoken pinyin-to-Hanzi as an
  explicit assumption, and request the actual characters or a screenshot when
  ambiguity remains. The measured regression requires `弟弟高兴地笑了` and
  explains that a `地` modifier precedes its verb. This rule is excluded from
  Companion and every role-play/Speaking surface. Typecheck, lint and 173
  focused tests pass; nothing is committed or deployed.
- [x] 2026-10-09: Ground Han Tutor exam follow-ups in exact supplied options;
  ask for clarification on corrupted transcripts and prioritize explicit new
  Mandarin grammar topics (including 被 versus option B). Integrated in written
  and Realtime turn instructions. Typecheck and 173 focused tests pass. Live
  conversational acceptance remains pending; local only, no deployment.
- [x] 2026-10-09: Preserve the established explanation language throughout
  pronunciation drills, including historical Mandarin repetitions replayed
  when resolving the language. Add a regression for 蛋糕被我的猫吃了 and
  explicit language overrides. Clarify 被 fourth tone and forbid invented
  acoustic diagnoses. 174 focused tests pass; local conversational check pending.
- [x] 2026-10-09: Exit pending pronunciation drills when the learner asks a
  new usage/grammar question; leave raw pinyin repetitions eligible. Give short
  audio coaching enough output budget to finish. Han Tutor checks response.done
  status/reason and continues a token-limited explanation once, never a cancelled
  response; repeated cutoffs/failed responses show a recoverable message.
  Typecheck, targeted lint and 108 focused tests pass. Live acceptance pending;
  local only, no commit or deployment.
- [ ] Review and approve the proposed naturalness, adaptive pedagogy,
  evidence-based feedback, latency, mobile, cost and measurement work in
  [`PLAN_VIVO_MEJORAS_IA_CONVERSACIONAL.md`](PLAN_VIVO_MEJORAS_IA_CONVERSACIONAL.md).
- [x] 2026-10-09: Clarify ambiguous questions such as "What type of Han we can
  check?" as questions about Han Tutor's actual capabilities, without replacing
  them with a tone lesson or inventing selectable Tutor types. Shared text/voice
  turn guard and English/Spanish regressions added.
- [x] 2026-10-09: The user explicitly authorized correcting the Tutor-capability
  question and publishing all reviewed pending changes to GitHub. This replaces
  the earlier hold on publication; live-device acceptance checks remain pending
  and must not be presented as completed. Tutor, Companion, Journey Speaking,
  Speaking Lab and placement retain their separate conversation boundaries.
- [x] 2026-10-09: Release verification completed: production build and lint
  pass; 114 unit/component files covered (937 tests in the full run, then the
  four tests whose worker failed to load a dependency passed on retry, alongside
  nine Tutor-session regressions). The full isolated integration run passed
  312/313 tests and exposed a timestamp-tie ordering issue; stable message-ID
  tie-breaking fixed it and all 22 tests in the three affected suites passed on
  retry. Smoke passes. Secret scanner passes for 36 commits and the non-ignored
  worktree. No schema migrations added; temporary databases were removed.
- [x] 2026-10-09 local follow-up after c88f4ea: the reported 明纲 meaning
  question exposed gaps in Tutor intent handling and Spanish practice cues.
  Meaning requests now pause drills, preserve exact learner-supplied characters,
  clarify uncertain recognition and forbid unsolicited repetition invitations.
  Recognize "quieres intentar decirlo" and preserve the explanation language
  while an identified practice target remains closed, not only on scored turns.
  Add lexical third-tone guidance and a component regression for the complete
  reported sequence. 184 focused tests pass; ten session tests rechecked after
  narrowing meaning detection. Real-model conversational acceptance pending.
  These follow-up changes are local; publication requires a new user request.
- [x] 2026-10-09 local Speaking Lab correction: the three beta stations now
  open live in-character conversations instead of ConversationShadowing. Each
  uses its own lesson mission, localized roles/objective, HSK level and language
  bank, with the same timed push-to-talk engine as Journey Speaking. Pinyin and
  translation remain optional help. Preserve station unlocking and keep Lab
  transcripts out of Tutor state and Journey lesson-title/reflection tracking;
  finishing/retrying never completes a Journey lesson. Role-play turns no longer
  receive Tutor pronunciation-drill instructions. Typecheck, targeted lint and
  109 focused tests pass; published missions for all three lessons confirmed
  read-only in the local database. A further no-shadowing-dialogue regression
  added. Real voice acceptance pending; these changes remain local.
- [x] 2026-10-09 Speaking Lab access follow-up: all three curated stations are
  available immediately. Remove the lesson-progress lookup, unlocked field,
  server-side station prerequisite and locked UI/copy. Journey progression
  remains independent. Seven station-data/component tests, typecheck and
  targeted lint pass. Local only.
- [x] 2026-10-09 Speaking Lab navigation follow-up: remove the administrator/
  FULL-scope legacy SpeakingLabHome branch from the page. Every account now
  returns to the same three-station screen, including from direct station links
  and old lessonId URLs. App-layout authentication remains in force. Nine
  route/data/component tests, typecheck and targeted lint pass. Local only.
- [x] 2026-10-10 local Han Tutor pronunciation state: register the exact target,
  established explanation language and available lexical reference explicitly;
  active targets cannot be replaced by a later mistaken assistant transcript.
  Treat 吗/吗?/吗？ as attempts inside the drill, clarify ambiguous ba before
  establishing a character, and require a clearly announced next target after
  closure. Preserve long-phrase chunks, prioritize new meaning/grammar requests
  and reset target/language on a fresh live session. Recognition similarity is
  flow control, never proof of tone accuracy. Tutor-only; no persistent memory,
  database changes or additional AI calls. 216 focused unit/component tests pass;
  real-model oral acceptance remains pending. Local only, not published.
- [x] 2026-10-10 local admin analytics display: replace the historical-rate
  column with estimated cost per interaction. Show user-approved planning
  references of US$0.0007 per new HanVocabulary lookup and US$0.05 per short
  Han Tutor voice session; other features show the recorded period average.
  Label references versus accumulated estimates explicitly and preserve rate
  evidence on the method label. No changes to usage records, authorization
  allowances, user caps or any conversation system. Twenty focused tests pass.
  Local only; the real Realtime session cost collector remains pending.
- [x] 2026-10-10 local Realtime accounting separation implemented: Tutor,
  Companion, Journey Speaking, Speaking Lab and placement now select separate
  usage/cap keys. One US$0.05 planning estimate drives new successful session
  logs, the projected feature cap check and global preventive authorization.
  Old shared logs remain explicitly historical, without invented attribution
  or retroactive repricing. Admin analytics includes the five references even
  with zero usage; limits and recent usage identify the independent products.
  The additive migration copies existing general/user policies once, preserving
  zero blocks and never overwriting new settings. New sessions fail closed until
  that migration is applied. 57 unit/component and 17 isolated integration tests,
  typecheck and targeted lint pass. No paid provider calls, commit or deployment.
- [x] Apply `20261010120000_separate_realtime_usage_limits` to the persistent
  Prisma database used by localhost: after the earlier auto-review rejection,
  the user explicitly authorized that destination on 2026-10-10 and migrate
  deploy successfully applied the single pending voice policy migration.
  The migration was tested twice on disposable Postgres before this application.
  See [Realtime costs and limits](REALTIME_COSTOS_Y_LIMITES.md). Publishing and
  production policy migration remain a separately authorized step.
- [x] 2026-10-10 admin cost taxonomy audit and local implementation: one
  closed catalogue supplies accounting keys, labels, families and limit editors.
  New text calls separate Tutor, Companion and character role-play; Companion's
  category never reads Tutor/role-play/legacy logs. Tutor appears once in the
  interactive report, with written-token costs in its expandable breakdown and
  independent voice/text limits. TTS is labelled as reading written responses,
  Reflection or examples (not duplicate Realtime output). Shared vocabulary,
  dialogue, grammar, introduction and placement-listening generation is shown
  separately; cached plays create no new AI charge. Historic mixed data remains
  visible and unchanged. All recorded models/keys contribute exactly once,
  removing the former top-20 truncation. Financial analytics explicitly include
  administrator costs while learner engagement excludes owner testing; budget
  alerts respect individual overrides and UTC. Product summaries use only
  unambiguous ownership (generic role-play assessment is not Companion).
  Sixty-seven focused unit/component and 58 isolated integration tests pass;
  additional final analytics/component regressions rechecked. Typecheck, targeted
  lint and local production compilation pass. No paid OpenAI calls or deployment.
- [x] 2026-10-10 voice and text policy migrations applied to the authorized
  persistent development Prisma database used by localhost. Both are additive,
  preserve zero blocks and do not overwrite independent limits. A read-only
  live audit (`scripts/audit-ai-cost-mapping.ts`) confirms 30 catalogue keys,
  no unknown logged feature, both completed migrations and exact internal cost
  reconciliation. Old costs and daily budget counters were not rewritten.
  GitHub/Vercel publication and production policy updates remain pending user
  authorization. See [mapping and cache evidence](REALTIME_COSTOS_Y_LIMITES.md).
- [x] 2026-10-10 shared AI experience budgets implemented locally. One
  catalogue maps 30 operation keys to ten experience budgets. General and
  per-user editors, runtime checks, user costs, analytics and UTC budget alerts
  use identical attribution and policy keys. Tutor, Companion, Journey Speaking
  and Speaking Lab remain separate conversations; each budget combines its own
  voice/text/recognition/assessment/reading calls. Shared route sources are
  explicit and validated. Technical caps remain a read-only archive. The new
  additive migration copies the strictest explicit child policy, preserves zero
  blocks and new independent settings; only unequivocal historical source
  attribution is backfilled, never old amounts. Global reservations are unchanged.
  62 unit/component tests pass; 67/68 isolated integration tests initially passed
  and the sole rounding expectation was repaired, with all four new budget and
  five back-office tests passing on retry. Typecheck, lint and production build
  pass. No paid OpenAI calls, commit, push or deployment.
- [x] Apply `20261010140000_shared_ai_experience_budgets` to the persistent
  development database used by localhost, then run the read-only accounting
  audit (2026-10-10). The earlier authorization-review usage limit was resolved;
  status confirmed this was the only pending migration and deploy applied it.
  Audit confirms all three policy migrations, ten experience budgets, no unknown
  or invalid source keys, and unchanged 93 cost records totaling US$5.8075195.
  Reconciliation passes. Regenerated Prisma Client and restarted only the
  verified HanGo Next.js processes on localhost:3000. The reported validation
  error came from yesterday's in-memory client, which lacked `experience`;
  the missing database migration would have caused a subsequent column error.
  Real 30-day analytics queries pass and the authenticated browser visibly
  renders Analytics without the error, including all ten budgets and history.
  No paid AI calls, data reset, commit, push or Vercel/production update. See the
  updated [cost and budget mapping](REALTIME_COSTOS_Y_LIMITES.md).
- [x] 2026-10-10 user-requested analytics cleanup: remove the historical
  mixed-source section and its rows from the cost report. Preserve database
  records, totals and all budgets; clarify that the total includes prior
  consumption when applicable. 21 focused tests, typecheck and targeted lint
  pass; authenticated localhost Analytics checked. No paid AI calls,
  data deletion, commit or publication.
- [x] 2026-10-10 remove the grammar-point "Ask AI" shortcut at the user's
  request, including unused ES/EN labels. Keep explanations, example audio,
  practice, grading and independent Han access unchanged. Seven component
  tests, typecheck and targeted lint pass. Real localhost Grammar checked;
  no audio played or exercise submitted. Original Speaking position verified
  in the database (read-only) and after reload. Local only, no paid AI or publication.
- [ ] Investigate the transient lesson-navigation save warning seen during
  this visual check: returning from Grammar showed an error toast, but the
  original Speaking position was persisted and rendered correctly on reload.
  No navigation logic changed in the grammar-shortcut removal.
- [x] 2026-10-10 local Journey Speaking correction: shared ES/EN/Chinese
  introduction detection keeps the session and opening guards consistent;
  Saludos y presentaciones opens with only 你好. Journey hides redundant
  microphone status/hint text and preserves the latest character caption
  through hold/release, analysis and discarded silent turns. Direct role-play
  replies carry speaker-specific occupation evidence across the whole session,
  prioritize the latest learner turn and never force an already-known student
  status or mandatory follow-up. Character identity remains independent;
  no new persistent Tutor memory, provider call or budget change. 207 focused
  unit/component tests, typecheck and targeted lint pass. Local QA screen
  checked without microphone/start or Journey progress changes. Real oral
  acceptance remains pending; no commit, push or Vercel update.

- [x] 2026-10-10 CUR-01: auditoría curricular de solo lectura y matriz
  provisional de los diez niveles personales, sin modificar puntos ni Han.
  41 escenarios/164 lecciones; 1592 registros de vocabulario (1304 formas)
  y 480 registros de gramática (464 estructuras literales). Fichas exactas,
  pinyin, ES/EN, IDs, diálogos y candidatos a repaso. Todas las comprobaciones
  estructurales seleccionadas pasan; no certifica corrección lingüística ni
  dominio individual. Ver [matriz y plan](MATRIZ_CURRICULAR_NIVELES_HANGO.md)
  y [captura completa](curriculum-audit-2026-10-10/final/informe.md).
  101 pruebas focalizadas, typecheck y lint pasan; las 164 fichas y 1646
  frases del informe cuadran con la captura JSON. Sin llamadas de IA,
  migraciones, cambios de conversaciones, commit o publicación.
- [ ] CUR-02–07: revisar familias/prerrequisitos y cortes; integrar bancos
  de Journey por evidencia individual; separar diálogo/evaluación; revisar
  rúbrica, niveles avanzados y refinamiento. No implementados en CUR-01.
- [x] 2026-10-10 contrato conversacional aprobado y añadido a la matriz
  (7.1–7.6): ficha por lección, núcleo/apoyo/ampliación, turnos breves y
  preguntas accesibles para principiantes, desviaciones naturales sin
  cuestionario, ayuda ES/EN, adaptación por comprensión y ritmo pausado
  inicial. Velocidad, complejidad y extensión se ajustan por separado; no
  se aceleran automáticamente por puntos o lección. Incluye casos de
  aceptación y límites de evidencia. Solo documentación: integración,
  revisión de bancos y prueba de voz real siguen pendientes. Han Tutor,
  Companion, Speaking Lab, datos, puntos y voces existentes no modificados.
- [x] 2026-10-10 ampliación aprobada de la matriz (7.7–7.10): ayuda
  progresiva, uso tras la ayuda, reciclaje significativo, respuestas de
  principiante, feedback final acotado y fallos técnicos separados de
  evaluación. Journey reduce 45 s por ventana: 75/115/195/255 s, reserva
  independiente de 12 s. Preparar cierre dentro de los últimos 15–20 s;
  despedida breve contextual, End inmediato y último turno protegido dentro
  del margen de seguridad. Documentados conflictos del prompt actual y
  riesgos del temporizador. Solo plan: código de tiempos, voz y rúbrica
  siguen sin aplicar esta ampliación; las otras experiencias no cambian.
- [ ] Revisar por separado la ponderación de escenarios con dificultades
  mixtas: los denominadores por lección y presupuestos por escenario dan
  1512.6612 puntos nominales frente a 1500 declarados. No se cambió la fórmula
  ni se recalcularon puntos. Reading Lab tiene 150 puntos aún no ganables;
  no existe un camino completo verificado al nivel de 2000.
- [x] 2026-10-10 aplicación local del contrato de Journey Speaking:
  ventanas 75/115/195/255 s y reserva de 12 s; Speaking Lab conserva sus
  tiempos anteriores aunque comparte el helper. Contrato único para sesión
  y turnos de Journey: ayuda progresiva ES/EN mínima, intentos comprensibles,
  desvíos breves y sin rellenar tiempo o forzar vocabulario pendiente; se
  excluye la plantilla genérica de Practice de seis secciones. Últimos 20 s
  sin nuevos temas/preguntas. Cierre espera turno presionado/transcripción y
  reproducción, responde la pregunta pendiente y no fabrica acuerdos/éxito.
  End inmediato; límite finito y revisión al despertar una pestaña suspendida.
  Historial, puntos, rúbrica, presupuestos y restantes sistemas independientes
  sin cambios. 281 pruebas focalizadas en 12 suites con proveedor/audio
  simulados, typecheck, lint dirigido y diff-check pasan; no llamadas pagadas,
  migraciones, commit, push o publicación. Ver matriz actualizada.
- [ ] CUR-04 aceptación oral real: comprobar comprensión, ritmo natural,
  ayuda ES/EN, último turno y despedidas con micrófono/modelo reales. Los
  tests simulados verifican instrucciones y coordinación, no obediencia del
  modelo ni precisión acústica. CUR-02/03 (bancos/prerrequisitos/evidencia
  individual) y CUR-05 (rúbrica/feedback final acotado) siguen pendientes.
- [x] 2026-10-10 CUR-02/03 primer lote autorizado de Journey: seis lecciones
  (Saludos, Números/hora/fechas y cuatro de Compras básicas). Selección revisada
  núcleo/apoyo/ampliación, familias y prerrequisitos sugeridos sin nuevos
  bloqueos. Los 60 registros léxicos y 18 gramaticales conservan IDs, significados
  y pinyin; 号 de fecha/talla no se mezcla, 惠顾 no se exige al principiante.
  Aperturas específicas y bancos comunes para sesión, turno y despedida.
  Servidor resuelve exposición por pasos de la cuenta autenticada, descarta
  bancos del cliente, no usa puntos como conocimiento y no crea memoria de Han.
  Apoyo acotado de este piloto; el resto del currículo no queda integrado por
  inferencia. 308 pruebas focalizadas y tres de integración en Postgres
  desechable pasan; typecheck, lint dirigido y diff-check pasan. Sin llamadas
  pagadas, cambios de notas/puntos/límites,
  migraciones nuevas, escrituras a bases reales, commit, push o publicación.
  Ver [detalle del lote](BANCOS_SPEAKING_JOURNEY_PILOTO.md).
- [ ] CUR-02/03 resto: revisar selección/familias/prerrequisitos y extender
  el banco individual más allá de las seis lecciones. El registro disponible
  prueba exposición indirecta por paso, no dominio ni versión vista de cada
  ítem. CUR-04 oral y CUR-05 rúbrica/feedback final siguen pendientes antes
  de declarar la matriz completa o cambiar resultados históricos.
- [x] 2026-10-10 CUR-02/03 ampliación autorizada: Fundamentos 60/60,
  conservando las seis selecciones piloto y añadiendo 54 fichas editoriales
  de núcleo/apoyo/ampliación, apertura y andamiaje por escena. Los 600 registros
  léxicos y 180 gramaticales se preservan con IDs, significados y pinyin.
  Mantiene dos dificultades intermedias dentro de este capítulo y los accesos
  actuales; no genera nuevos bloqueos, puntos, memoria o cambios de rúbrica.
  Consulta solo lección actual y hasta ocho candidatas publicadas; progreso
  filtrado por cuenta y paso real, sin caché global ni escrituras. Contrato
  de voz separado del catálogo para no importar las 60 selecciones en navegador.
  434 pruebas focalizadas en 14 suites y tres integraciones que resuelven
  las 60 fichas en Postgres desechable pasan; tipos y lint dirigido pasan.
  Sin API pagada, migraciones nuevas, escrituras a bases persistentes, commit,
  push o publicación. Skills Prisma Client API/CLI y OpenAI Docs; ver
  [detalle y fichas](BANCOS_SPEAKING_JOURNEY_FUNDAMENTOS.md).
- [ ] CUR-02/03 otros capítulos: 104 lecciones de Vida cotidiana y
  Situaciones avanzadas todavía sin bancos editoriales integrados. CUR-04
  aceptación oral real, CUR-05 rúbrica/feedback y CUR-07 cortes/puntuación y
  refinamiento siguen pendientes. Fundamentos aplicado no equivale a matriz
  completa ni a comportamiento real certificado por tests simulados.
- [x] 2026-10-10 CUR-03/06 Vida cotidiana: 60/60 fichas en 15 escenarios,
  552 registros léxicos y 168 gramaticales preservados por ID/significado/pinyin;
  total integrado con Fundamentos 120/164. Núcleo/apoyo/ampliación y apertura
  editorial por personaje; relaciones de reciclaje por pasos propios reales,
  no por orden o puntos. Conserva selecciones previas, dificultades mixtas,
  accesos, modelo, tiempos, puntuación, rúbrica y sistemas independientes.
  Orientaciones explícitas de simulación para salud, seguro, renta, compras
  y trámites; se documentan problemas del contenido fuente sin reescribirlo.
  558 pruebas focalizadas en 15 suites y cuatro integraciones que verifican
  las 120 fichas y todos sus IDs en Postgres desechable pasan. Tipos y lint
  dirigido pasan; sin API
  pagada, migraciones nuevas, bases persistentes, commit, push o publicación.
  Skills Prisma Client API, Prisma CLI y OpenAI Docs; ver
  [detalle de Vida cotidiana](BANCOS_SPEAKING_JOURNEY_VIDA_COTIDIANA.md).
- [ ] CUR-03/06 restantes: 44 lecciones de Situaciones avanzadas. CUR-04
  voz real/adaptación, CUR-05 rúbrica/evidencia/feedback y CUR-07 cortes de
  puntos/refinamiento siguen pendientes. Revisar por separado el total
  incoherente del diálogo de supermercado y las afirmaciones clínicas del
  contenido fuente; los bancos no certifican seguridad u obediencia real.
- [x] 2026-10-11 CUR-03/06 Situaciones avanzadas: 44/44 fichas editoriales,
  11 escenarios; 440 registros léxicos y 132 gramaticales conservados con IDs,
  significados y pinyin. Cobertura de bancos completa: 164/164 (1592/480
  registros), sin reemplazar las 120 selecciones anteriores. Aperturas por
  personaje; mediación no confunde miembro de equipo con mediador. Reciclaje
  solo por cuenta/paso real, no por puntos ni disponibilidad. Límites de
  simulación médica/legal/financiera, consentimiento, fuentes no verificadas
  y cierre de escena sin End automático; hallazgos fuente documentados, no
  reescritos o certificados. Mantiene accesos de beta, modelos, tiempos,
  rúbrica, notas, puntos, tarifas y los otros sistemas de IA independientes.
  651 pruebas focalizadas en 16 suites y cinco integraciones reales sobre
  las 164 fichas en Postgres desechable pasan; cada ID actual, aislamiento
  por cuenta/paso y ausencia de escrituras de progreso comprobados. Tipos,
  lint y formato dirigidos pasan. Sin API pagada, migraciones nuevas, datos
  persistentes, commit, push o publicación. Skills Prisma Client API, Prisma
  CLI y OpenAI Docs; ver
  [fichas y límites](BANCOS_SPEAKING_JOURNEY_SITUACIONES_AVANZADAS.md).
- [ ] Estado vigente tras cubrir los tres lotes: CUR-05 rúbrica/feedback por
  evidencia, CUR-04 aceptación oral/adaptación/ritmo/cierre con voz real,
  cortes CUR-02 y CUR-07 puntos/refinamiento siguen pendientes. Revisar
  contenido especializado y cifras/fuentes/afirmaciones del material
  publicado por separado. 164/164 bancos no equivale a toda la matriz ni
  autoriza recalcular resultados históricos, desbloquear beta o publicar.
- [x] 2026-10-11 CUR-05 EV-01/02 base local: intentos propios de Journey,
  banco/objetivo/versiones del servidor y captura sellada por usuario/lección;
  no mezcla por título ni consulta a la conversación global de Han. Cierre
  concurrente idempotente, topes de captura e integridad SHA-256 canónica.
  Contrato nuevo: comunicación 40/idioma 30/interacción 20/autonomía 10, seis
  estados de evidencia, cita/autor/IDs verificados; faltantes/fallo técnico
  dejan nota nula, sin multiplicadores de cobertura o nota acústica inventada.
  Tres tablas/enums y migración aditiva preparada, cliente regenerado.
  746 pruebas en 19 suites y 13 integraciones en Postgres desechable pasan;
  tipos, lint y validación de esquema pasan. Runner fija también DIRECT_URL
  al destino temporal. Sin activación en voz/Reflection, API pagada,
  migración persistente, cambios de notas/puntos, commit, push o publicación.
  Skills Prisma Client API/CLI y OpenAI Docs; ver
  [reestructuración y pendientes](REESTRUCTURACION_EVALUACION_FINAL_JOURNEY.md).
- [x] EV-03 backend preparado (11 de octubre): evaluación conjunta estructurada
  y feedback en una llamada máxima por intento; reclamación atómica/caché,
  dueño/lección/versiones/citas validados. Ocho lectores concurrentes no
  duplican llamadas; fallos/rechazo/truncamiento/worker vencido quedan explícitos
  sin notas ficticias ni reintentos pagados automáticos. Consumo enlazado a
  usageLogId bajo LESSON_REFLECTION, incluso respuesta devuelta inutilizable.
  794 pruebas en 27 suites y 40 integraciones en 4 archivos pasan; tipos/lint
  pasan. Solo respuestas simuladas y Postgres temporal. Guías Prisma Client
  API/CLI y OpenAI Docs. Sin conexión a UI, API pagada, migración persistente,
  modificación de notas/recompensas/cuentas, commit/push/despliegue.
- [x] EV-03 cableado de captura (11 de octubre): acciones autenticadas y vínculo
  de intento en handshake Realtime; identidad/roles/bancos del servidor.
  Original STT separado de hipótesis/confianza, limitaciones persistidas y
  hash sellado; incertidumbre/audio incompleto impiden nota completa.
  End/natural/técnico/abandono, expiración de activos offline, máximo 30 nuevos
  intentos por cuenta/10 minutos sin contar replay y reintento de
  guardado idempotente. Modalidad nueva no escribe el hilo general de Han ni
  genera revisión silenciosa extra. QA sin retención de historia/intentos.
  813 pruebas en 29 suites y 46 integraciones en 5 archivos pasan; tipos/lint/
  esquema y build completo pasan. Skill Prisma Client API/CLI + OpenAI Docs. Segundo SQL aditivo
  solo probado en base temporal. **Modalidad apagada por defecto**, aún sin
  activación en página real, migración persistente, API pagada o datos borrados.
- [x] EV-04A (11 de octubre): snapshot versionado de ejercicios antes de voz,
  primer intento propio/recorrido; correctos, incorrectos, pendientes y faltantes
  separados. ID de Speaking validado al avanzar, lector ligado al paso exacto;
  caché/citas/nota recalculados sin regenerar IA. Nota global 20/20/30/30 y
  estrellas solo con evidencia completa. Informe ES/EN preparado, con pinyin,
  un logro/prioridad/siguiente paso, sin audio automático ni nota acústica.
  837 pruebas en 31 suites y 63 integraciones en 7 archivos, tipos/lint/build
  pasan. Solo Postgres temporal y respuestas simuladas. Sin API pagada,
  escritura persistente, cuentas borradas o publicación. Skills Prisma Client
  API/CLI y OpenAI Docs. **Informe no montado y recompensas NOT_SETTLED**;
  verificar guardado de ejercicios previo a voz antes de activar.
- [x] EV-04B (11 de octubre): persistencia v2 preparada en el informe existente,
  procedencia versionada por intento/recorrido sin nueva migración. Guardado,
  monedas de lección, evidencia Speaking, logros de nota/nivel y General Level
  atómicos; concurrentes/replays/redo no acumulan. Fórmula y pesos intactos.
  Informe parcial no premia ni completa escenario; cero legítimo distinto de nulo.
  Lectores antiguos bloquean regeneración de v2; acciones autenticadas separan
  leer/evaluar/guardar sin aceptar notas/identidad del cliente. ES/EN distingue
  pendiente/procesado sin prometer otro pago. 155 pruebas en nueve suites y 103
  integraciones en once archivos pasan, tipos/lint/formato/build (68 páginas).
  Login local ES/EN HTTP 200; informe nuevo aún sin aceptación visual/oral.
  Base temporal y IA
  simulada; sin API pagada, migración persistente, datos reales, GitHub o despliegue.
  Skills Prisma Client API/CLI. **Todavía no montado/activado en página real**.
- [x] EV-04C (11 de octubre): informe/acciones montados condicionalmente en
  Reflection/resultados para recorridos v2; leer/reabrir no genera IA ni audio.
  Barrera espera los guardados de ejercicios antes de avanzar/navegar hacia
  voz; lotes de vocabulario conservados al fallar y reintento sin duplicarlos.
  Sin micrófono permite guardar resultado parcial y volver a la ruta, no
  completar/premiar/desbloquear. Finalización exige informe íntegro y SETTLED
  también en servidor; selección v2 no puede degradarse a evaluación antigua.
  Redo explícito con confirmación disponible en Reflection y resultados;
  respuestas tardías no cruzan lecciones/recorridos. General Level y monedas
  muestran aporte/saldo confirmado, no premios nuevos por visitar. 193 pruebas
  en 17 suites y 91 integraciones en diez archivos pasan; tipos/lint/formato y
  build completo de Next (68 páginas) pasan. Postgres desechable eliminado,
  proveedores simulados. Skills Prisma Client API/CLI. Sin API pagada,
  migraciones persistentes, borrado de cuentas, GitHub o despliegue.
- [ ] EV-04 restante: activar captura/informe para lecciones nuevas de forma
  coherente tras comprobar migraciones, destinos y disponibilidad de preguntas
  reales. Aceptación visual/oral, calibración semántica humana y recorrido de
  cierre de escenario con UI real pendientes. La navegación interna espera
  guardado; cierre abrupto de pestaña no garantiza entrega de lotes pendientes
  (no calificarlos como incorrectos). Integración condicional preparada no
  significa rúbrica activa para todos ni reestructuración completa.
- [ ] EV-05 reinicio autorizado explícitamente por el usuario en **local y
  producción**, conservando administrador. La nueva autorización sustituye
  conservar notas antiguas para esa operación concreta; no resetear currículo
  ni infraestructura. Solo preflight local de lectura realizado: 29 usuarios,
  un admin verificado hango.learn@gmail.com. Producción/destinos/respaldo,
  cascadas/grabaciones/invitaciones y preservación de gastos reales por
  verificar. Ninguna cuenta o puntaje borrado, respaldo aún no realizado.
- [x] EV-04D código de transición local y correcciones del diálogo (11 de
  octubre): bancos ya no sustituyen el bloque de dificultad/gramática.
  Conversación flexible con ancla temática, sin cuestionario; ayuda al decir
  no entiendo/no entendí o pedir ES/EN pausa inmersión y no añade pregunta
  china. El idioma de ayuda sobrevive preguntas chinas, incluido el cierre;
  el evaluador no trata ayuda ES/EN ni dificultad impuesta por IA como error.
  Informe compacto único con detalle desplegable y motivo técnico/sin habla,
  sin nulo convertido en cero. Ruta real preparada con opt-in exclusivamente
  development, comprobación de tablas y aviso de redo confirmado para informes
  antiguos (sin regenerar/etiquetar la historia como nueva). Producción ignora
  el modo local. Scripts de activación fijan huella del destino y permiten solo
  las dos migraciones previstas, sin reset/seed ni credenciales exportadas.
  Preflight de lectura: localhost utiliza Prisma en nube, huella
  9a6e66deb06483ee, 29 cuentas, 46 informes, administrador original conservado;
  primera lección HSK 1: 10 palabras/3 estructuras, seis preguntas gramaticales
  y cinco de práctica publicadas. Skills OpenAI Docs y Prisma Client API/CLI.
  251 pruebas en doce suites y 91 integraciones en diez archivos pasan;
  tipos/lint dirigidos y build de 68 páginas pasan. Postgres temporal retirado.
- [ ] EV-04D activación real **bloqueada por seguridad del destino**, no por
  falta de código: comprobación automática rechazó aplicar migraciones porque
  no se demostró separación de esta base y Vercel. Exportar configuración de
  producción también fue rechazado; no se copiaron secretos ni se buscó un
  atajo. Confirmar separación o autorización exacta del destino antes de
  migrar/poner HANGO_JOURNEY_EVALUATION_V2=local. **Flag aún apagado y ambas
  migraciones reales pendientes**. No volver a pedir prueba de la medición
  completa hasta habilitar y comprobar la ruta; sin API pagada, borrados,
  cambios de base persistente, commit/push o despliegue en este bloque.
- [x] EV-04E vista previa local (11 de octubre): el usuario **no autorizó**
  migrar la base y aclaró que solo quiere ver Speaking/resultado/feedback.
  Respetar esa negativa; no reintentar activación persistente por continuidad.
  `/es/speaking-preview` y EN solo en development, fuera del shell de Han,
  sin cuentas/lectura de registros/voz/API/acciones/guardados. Ejemplo marcado
  como sintético, botón mantener/soltar recorre frases preparadas, ayuda ES/EN
  de ejemplo y mismo componente de informe nuevo: completo 93/100 (Speaking
  75, resto 100), o captura ausente sin nota global. No premios reales.
  15 pruebas en tres suites y tipos/lint pasan; vista abierta/verificada en
  navegador local. **Esto no activa ni certifica evaluación real de su voz**.
  No migraciones, borrados de cuentas/puntajes, API pagada o publicación.
- [x] 2026-10-11 EV-04/05 autorización posterior específica: el usuario
  autorizó añadir las tablas y después confirmó borrar todas las cuentas
  salvo hango.learn@gmail.com en local y producción, con respaldo previo.
  Base configurada en .env.local: respaldo lógico completo cifrado AES-256-GCM,
  descifrado/hash verificados; las dos migraciones aditivas aplicadas.
  Eliminadas 28 cuentas no administradoras con cascadas de datos propios,
  administrador verificado conservado; 164 lecciones/41 escenarios intactos.
  Tokens asociados retirados e invitaciones asociadas revocadas; 13 grabaciones
  privadas en outbox de eliminación, no eliminación de audio compartido.
  Gastos anteriores conservados en respaldo y resumen privado, no reasignados
  al administrador. HANGO_JOURNEY_EVALUATION_V2=local activado en configuración
  ignorada por Git: requiere aceptación oral real, no certificada por el demo.
  Guías Prisma CLI/Client API usadas para revisar migraciones y preservación.
- [ ] Producción EV-05 sigue sin verificar: descarga temporal de configuración
  de Vercel autorizada explícitamente, pero el servicio devuelve DATABASE_URL
  y DIRECT_URL como [SENSITIVE]. No inferir destino ni afirmar separación
  física a partir de localhost. Falta conexión explícita, respaldo, preflight y
  mantenimiento de producción; no se ejecutó borrado con configuración Vercel.
  El borrado anterior afecta a la base configurada en local: si producción
  compartiera esa base, sus datos también se verían afectados. Verificarlo.
- [x] Verificación del lote para GitHub: 1.612 pruebas unitarias/componentes,
  376 integraciones y smoke aislado pasan; tipos/lint/secretos y build de 70
  páginas pasan. Smoke no comparte lock/cache con servidor de usuario y anula
  claves de proveedores; base temporal eliminada. Credenciales y respaldos
  permanecen ignorados. Rama de entrega codex/journey-speaking-release-20261011
  preparada para no reemplazar producción antes de verificar sus migraciones.
