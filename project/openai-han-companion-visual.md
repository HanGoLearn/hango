# Prompt for the OpenAI session — Han Companion's visual redesign

> Paste this whole document as one message to the OpenAI/Codex session
> working on `han-voice-conversation.tsx` / `han-realtime.ts`. This is a
> visual/UX request, not new realtime logic — the audio pipeline this needs
> already exists (see below); the ask is a new presentational variant.

## Context

Han Companion (2026-08-31) is a new, voice-only way to talk to Han —
no chat, no text box, nothing typed at all. It currently reuses
`HanVoiceConversation`'s existing `variant="immersive"` (a gradient card
with a static person icon, a caption of the live transcript, mic/end
buttons). The user explicitly dislikes this look ("no como el fondo ese
que le has puesto que no me gusta") and wants something closer to
OpenAI's own voice UI: a circle/orb that sits still and calm when nobody
is talking, and visibly reacts to the actual sound while Han is speaking
— not a static icon, not a waveform bar chart, a living circle.

Non-negotiable constraints from the user, verbatim intent:
- **Zero text/chat UI** in this view — no message list, no transcript
  caption, no text input, nothing typed or read as a chat.
- **One button to start/enable audio.** Beyond that, keep controls to the
  minimum actually needed (see "Open question" below - don't over-add UI).
- Must look genuinely polished — this is explicitly why the user wants
  your help instead of Claude's plain gradient card.

## What already exists that you should reuse, not reinvent

- **Real-time audio level data already exists in this exact file** -
  `han-voice-conversation.tsx` already runs a Web Audio API
  `AudioContext`/`AnalyserNode` pipeline on **both** directions of audio:
  - The learner's own mic input (`audioAnalyserRef`,
    `startVoiceSignalAnalysis`) - used today for barge-in detection.
  - **Han's own remote/output audio** (`remoteAudioAnalyserRef`,
    `remoteAudioGainRef`, `startRemoteAudioAnalysis`) - this is the signal
    the new orb should react to while Han is speaking. It's computed
    already; it's just never been exposed to the UI as a visual before.
  - `rmsFromTimeDomainSamples` (`src/lib/speech/realtime-turn-guard.ts`)
    is the existing helper that turns raw samples into a loudness value -
    reuse it (or the same technique) to drive the orb's animation instead
    of writing a second RMS/frequency-analysis implementation.
  - `state: "idle" | "connecting" | "listening" | "thinking" | "speaking"`
    is already tracked and updated throughout the component - the orb's
    calm-vs-reactive behavior should key off `state === "speaking"`
    (Han's turn) vs. everything else, not a new state machine.

- **`variant` prop, not a new component.** `HanVoiceConversation` already
  branches its render on `variant: "compact" | "immersive"`. Add a third,
  e.g. `variant: "orb"`, rather than modifying `"immersive"` in place -
  `"immersive"` is also used by Speaking Lab's Free Topic Practice
  (`src/components/speaking/free-topic-practice.tsx`), which the user has
  not asked to change and should keep its current look untouched.

- **Where it plugs in**: `HanCompanionView`
  (`src/components/han/han-hub.tsx`) is the only consumer that should pass
  the new `variant="orb"`. It already wires `voice`, `explanationLanguage`,
  `context`, `mode="PRACTICE"`, `open`, `appendMessage`,
  `onActiveChange` - the new variant should accept the exact same props
  `"immersive"` does today, just render differently. No changes needed to
  `HanCompanionView` itself beyond the `variant` value, unless the visual
  design calls for a new prop (e.g. an explicit "no captions" flag - your
  call).

## The ask

1. A new `variant="orb"` render branch in `HanVoiceConversation`:
   - A circle, centered, that is visually calm/static (subtle idle motion
     is fine - a slow breathing pulse, not literally frozen) while
     `state !== "speaking"`.
   - While `state === "speaking"`, the circle reacts to Han's actual
     output audio level in real time (the remote analyser data already
     computed) - scale, glow, waveform-deform, whatever reads as
     "genuinely responding to this sound," matching the quality bar of
     OpenAI's own Advanced Voice Mode circle.
   - No gradient card background like the current `"immersive"` variant -
     propose your own visual treatment (dark, minimal, whatever fits
     HanGo's palette - `primary` #c42a3e, `secondary` #6e9271, `accent`
     #c7972e, page background near `#17140f` dark / `#f1eeea` light, see
     `app/globals.css`).
   - One button to start the conversation (equivalent to today's "Start
     conversation"). Once active, some way to end it is still required
     (see open question below) - but no text, no transcript, no typed
     input anywhere in this variant.
   - Reasonable non-text state feedback (e.g. a subtly different orb
     color/motion for "connecting" vs "listening" vs "speaking") is fine
     and encouraged - just never as literal readable text/captions.

2. Wire `HanCompanionView` (`han-hub.tsx`) to pass `variant="orb"` instead
   of `"immersive"`, and remove the free-text "what do you want to
   practice" input's surrounding chat-adjacent framing if your design
   calls for presenting it differently (the underlying
   `generateCustomScenarioAction` call and `RolePlayContext` wiring stay
   as-is - this request is about the live-conversation visual, not the
   scenario-generation feature).

## Open question - confirm with the user before finalizing

"Un botón para activar audio, nada más" could mean literally one button
ever (no separate end/mute control), or "no chat/text, just this button
plus whatever minimal controls are actually needed." A voice conversation
needs *some* way to end it - confirm which the user means before locking
the control layout. A sensible default if you can't reach them: one
prominent start button; once active, a single, unobtrusive way to end
(even the same button re-purposed, e.g. tap the orb itself to end) rather
than adding back a row of icon buttons.
