# HanGo Audio Engine

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the Audio Engine responsible for all voice-related features inside HanGo.

The Audio Engine enables learners to listen, speak, receive pronunciation feedback, and interact naturally with the AI Teacher through voice.

Audio is one of the core learning experiences of HanGo.

---

# Audio Philosophy

Chinese is a spoken language.

Reading alone is insufficient.

Learners must repeatedly hear, imitate, produce, and receive feedback on spoken Chinese.

The Audio Engine should make speaking Chinese feel natural and enjoyable.

---

# Core Responsibilities

The Audio Engine manages:

- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- Pronunciation Analysis
- Audio Playback
- Voice Recording
- Conversation Audio
- Audio Streaming
- Audio Storage

---

# Audio Architecture

```
Frontend

↓

Audio Engine

↓

Speech Services

↓

AI Evaluation

↓

Storage

↓

Frontend
```

The Audio Engine coordinates all audio-related interactions.

---

# Audio Components

## Text-to-Speech

Converts Chinese text into natural speech.

Used in:

- Vocabulary
- Dialogues
- Grammar examples
- AI Teacher
- Simulations
- Missions
- Listening activities

---

## Speech-to-Text

Converts learner speech into Chinese text.

Used in:

- Speaking Lab
- AI Conversations
- Pronunciation practice
- Missions
- Simulations

Speech recognition should prioritize Mandarin Chinese.

---

## Pronunciation Analysis

Analyzes learner pronunciation.

Evaluation areas:

- Tone accuracy
- Initials
- Finals
- Rhythm
- Intonation
- Fluency
- Speech clarity

The objective is understandable communication rather than perfect native pronunciation.

---

## Voice Recording

Learners may record responses during:

- Speaking exercises
- Shadowing
- Missions
- Simulations
- AI conversations

Every recording may be stored for future review.

---

## Audio Playback

Supports:

- Normal speed
- Slow speed
- Sentence playback
- Loop playback
- Segment replay

Learners should have full playback control.

---

# Audio Sources

Audio may originate from:

Native recordings

↓

AI-generated voices

↓

Learner recordings

↓

External providers

All sources should provide consistent audio quality.

---

# Speaking Workflow

```
Learner Speaks

↓

Voice Recording

↓

Speech Recognition

↓

Pronunciation Analysis

↓

AI Evaluation

↓

Feedback

↓

Conversation Continues
```

Speaking practice should feel conversational rather than mechanical.

---

# Listening Workflow

```
Lesson

↓

Audio Playback

↓

Learner Listening

↓

Comprehension Activity

↓

Feedback
```

Listening activities should progressively reduce learner support.

---

# Voice Modes

The Audio Engine supports multiple playback modes.

---

## Normal Speed

Natural native speech.

---

## Slow Speed

Reduced speed while preserving natural pronunciation.

---

## Phrase Mode

Plays one sentence at a time.

---

## Shadowing Mode

Automatically pauses after each sentence for learner repetition.

---

## Repeat Mode

Continuously repeats selected audio.

---

# AI Teacher Voice

The AI Teacher should support voice conversations.

Capabilities:

- Speak naturally.
- Pause appropriately.
- React quickly.
- Maintain conversational rhythm.
- Support long conversations.

Voice interaction should feel like talking with a human tutor.

---

# ElevenLabs Integration

The Audio Engine should support external voice providers.

Possible uses:

- AI Teacher voice.
- Dialogue generation.
- Scenario characters.
- Mission participants.
- Simulation characters.

Different voices may represent different characters.

---

# Audio Quality Standards

Generated audio should be:

- Natural.
- Clear.
- Correctly pronounced.
- Tonally accurate.
- Emotionally appropriate.

Robotic voices should be avoided whenever possible.

---

# Pronunciation Feedback

The learner receives:

Overall pronunciation score

↓

Tone accuracy

↓

Problem syllables

↓

Suggested improvements

↓

Replay opportunities

Feedback should remain encouraging and educational.

---

# Audio Storage

Stored audio includes:

- Learner recordings.
- AI-generated audio references.
- Dialogue audio.
- Speaking history.

Large audio files should be stored outside the primary database.

Only metadata should remain in relational storage.

---

# Performance

Audio interactions should prioritize:

- Low latency.
- Fast playback.
- Smooth streaming.
- Minimal buffering.

Conversation delays should remain as short as possible.

---

# Accessibility

Audio features should support:

- Subtitles.
- Adjustable playback speed.
- Replay controls.
- Keyboard shortcuts.
- Visual recording indicators.

Learners should never depend exclusively on audio.

---

# Future Expansion

Future Audio Engine capabilities may include:

- Multiple AI voices.
- Regional Mandarin accents.
- Cantonese support.
- Emotional speech synthesis.
- Conversation interruption handling.
- Live pronunciation coaching.

The architecture should allow future expansion without redesign.

---

# Success Definition

The Audio Engine succeeds when learners naturally listen, speak, and interact with Chinese throughout HanGo while receiving immediate, accurate, and motivating audio feedback that accelerates spoken language acquisition.

---

End of document.