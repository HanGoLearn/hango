# HanGo Development Roadmap

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the development roadmap for HanGo.

Its purpose is to organize the construction of the platform into controlled phases, ensuring that Claude implements features in the correct order without introducing functionality that depends on unfinished systems.

The roadmap converts the HanGo product vision, educational methodology, engineering architecture, and design specifications into an executable development sequence.

---

# Development Philosophy

HanGo should be built incrementally.

The objective is not to implement the complete long-term vision in the first release.

The objective is to create a stable MVP that proves the core learning experience:

- Structured scenario-based learning.
- Contextual lessons.
- Persistent AI Teacher.
- Basic speaking practice.
- Basic writing practice.
- Competency-based progress.

Every phase must produce a functional and testable result.

---

# Development Rules

Claude must follow these rules:

1. Complete phases in order.

2. Do not implement features from future phases early.

3. Do not modify the approved product structure without explicit authorization.

4. Use the documentation inside `/docs` as the source of truth.

5. Do not invent new modules, folders, entities, or features without approval.

6. Complete testing before marking a phase as finished.

7. Preserve existing functionality when adding new features.

8. Document important technical decisions.

9. Prioritize MVP stability over unnecessary complexity.

10. Stop and report any contradiction between documents before implementing.

---

# MVP Objective

The HanGo MVP must allow a learner to:

1. Create an account.

2. Complete onboarding.

3. Access a personalized Dashboard.

4. Navigate the Learning Journey.

5. Open a scenario and its lessons.

6. Complete a contextual lesson.

7. Ask the AI Teacher questions about the visible content.

8. complete basic speaking activities.

9. Complete basic writing activities.

10. Complete exercises, quizzes, and a lesson mission.

11. Receive feedback.

12. View competency-based progress.

The MVP is successful when this complete learning loop works reliably.

---

# MVP Learning Loop

```text
Register

↓

Complete Onboarding

↓

Receive Starting Recommendation

↓

Open Dashboard

↓

Enter Learning Journey

↓

Select Scenario

↓

Complete Lesson

↓

Use AI Teacher

↓

Practice Speaking

↓

Practice Writing

↓

Complete Quiz

↓

Complete Mission

↓

Receive Feedback

↓

Update Progress
```

---

# Phase 0 — Project Preparation

## Objective

Create the technical foundation of HanGo.

## Scope

- Initialize the application.
- Configure development tools.
- Configure environment variables.
- Create the initial project structure.
- Configure version control.
- Establish code quality standards.
- Prepare the database environment.
- Prepare testing infrastructure.

## Required Result

A clean project that runs locally and is ready for feature development.

---

# Phase 1 — Core Application Foundation

## Objective

Implement the shared application structure.

## Scope

- Global layout.
- Desktop navigation.
- Mobile navigation.
- Top bar.
- Responsive containers.
- Basic design tokens.
- Reusable component foundations.
- Loading states.
- Error states.
- Empty states.

## Required Result

Users can navigate through placeholder versions of all primary MVP sections.

Primary sections:

- Dashboard.
- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.
- Settings.

---

# Phase 2 — Authentication

## Objective

Allow users to securely create and access accounts.

## Scope

- Registration.
- Login.
- Logout.
- Password recovery.
- Email verification.
- Google authentication.
- Session management.
- Protected routes.
- User roles.
- Basic profile creation.

## Required Result

Users can create accounts, authenticate, maintain sessions, and access protected application areas.

---

# Phase 3 — Onboarding and Learner Profile

## Objective

Collect the information required to personalize the learning experience.

## Scope

- Learning goal selection.
- Current Chinese level.
- Preferred explanation language.
- Skill priorities.
- Daily study target.
- AI Teacher preferences.
- Initial learner profile.
- Optional initial assessment placeholder.
- Personalized starting recommendation.

## Required Result

Every new learner receives an initial profile and recommended starting scenario.

---

# Phase 4 — Content Data Foundation

## Objective

Create the structure required to store and retrieve HanGo educational content.

## Scope

Implement data models for:

- Levels.
- Domains.
- Scenarios.
- Scenario difficulty levels.
- Lessons.
- Vocabulary.
- Grammar.
- Dialogues.
- Dialogue lines.
- Exercises.
- Quizzes.
- Missions.
- Competencies.
- Learning objectives.
- Content relationships.

## Required Result

The backend can store, retrieve, and relate structured lesson content without hardcoding it in the frontend.

---

# Phase 5 — Learning Journey

## Objective

Implement the central structured learning path.

## Scope

- Learning Journey page.
- Domain filters.
- Scenario cards.
- Scenario statuses.
- Scenario progress.
- Scenario Detail page.
- Difficulty levels.
- Lesson list.
- Locked and available states.
- Continue learning behavior.
- Initial curriculum seed data.

## Required Result

A learner can browse available scenarios, select a level, and open a lesson.

---

# Phase 6 — Lesson Experience

## Objective

Implement the complete contextual lesson flow.

## Scope

Lesson steps:

1. Situation.
2. Dialogue.
3. Comprehension.
4. Vocabulary.
5. Grammar.
6. Guided Practice.
7. Speaking.
8. Writing.
9. Quiz.
10. Mission.
11. Reflection.

Additional requirements:

- Lesson progress.
- Step navigation.
- Autosave.
- Resume lesson.
- Pinyin toggle.
- Translation toggle.
- Sentence-level audio controls.
- Feedback states.
- Completion rules.

## Required Result

A learner can complete one fully functional lesson from beginning to end.

---

# Phase 7 — Exercise System

## Objective

Implement the core interactive practice system.

## MVP Exercise Types

- Multiple choice.
- True or false.
- Fill in the blank.
- Sentence ordering.
- Matching.
- Short written response.

## Scope

- Exercise rendering.
- Answer submission.
- Answer validation.
- Alternative accepted answers.
- Progressive hints.
- Immediate feedback.
- Retry behavior.
- Exercise progress.
- Result persistence.

## Required Result

Lessons can include interactive exercises that provide clear and educational feedback.

---

# Phase 8 — Quiz System

## Objective

Implement structured lesson and scenario quizzes.

## Scope

- Vocabulary questions.
- Grammar questions.
- Listening questions.
- Reading questions.
- Mixed quizzes.
- Quiz attempts.
- Scoring.
- Question feedback.
- Results summary.
- Review recommendations.

## Required Result

Learners can complete quizzes and have the results stored in their learning profile.

---

# Phase 9 — AI Teacher MVP

## Objective

Implement the persistent contextual AI Teacher.

## MVP Capabilities

- Text conversation.
- Explain visible lesson content.
- Explain selected dialogue lines.
- Explain grammar.
- Explain vocabulary.
- Generate examples.
- Generate short practice.
- Switch explanation language.
- Preserve current lesson context.
- Basic conversation history.

## Interface Scope

- Collapsed state.
- Compact side panel.
- Expanded panel.
- Full-screen mobile view.
- Context indicator.
- Mode selector.
- Suggested prompts.
- Text input.

## Initial Modes

- Tutor.
- Practice.
- Review.

Conversation and Challenge modes may be limited until voice functionality is implemented.

## Required Result

The learner can ask questions about the current page without copying the content manually.

---

# Phase 10 — Audio and Dialogue Playback

## Objective

Implement audio support for lesson content.

## Scope

- Dialogue audio.
- Sentence-level playback.
- Normal speed.
- Slow speed.
- Replay.
- Audio progress.
- Active dialogue-line highlighting.
- Text-to-Speech integration.
- Cached generated audio.
- Audio metadata storage.

## Required Result

Learners can listen to complete dialogues and individual sentences with consistent playback controls.

---

# Phase 11 — Speaking Lab MVP

## Objective

Provide basic oral production practice.

## MVP Practice Modes

- Pronunciation.
- Shadowing.
- Guided conversation.
- Scenario role play.

## Scope

- Microphone permission.
- Voice recording.
- Speech-to-Text.
- Recording playback.
- Transcript display.
- Basic pronunciation feedback.
- Basic fluency feedback.
- Speaking attempt history.
- Retry behavior.

## Required Result

Learners can record Chinese speech, receive understandable feedback, and repeat the activity.

---

# Phase 12 — Writing Lab MVP

## Objective

Provide structured Chinese writing practice.

## MVP Practice Types

- Sentence Builder.
- Short Message.
- Paragraph.
- Practical Writing.

## Scope

- Writing prompts.
- Writing editor.
- Autosave.
- Submission.
- AI correction.
- Grammar feedback.
- Vocabulary feedback.
- Naturalness feedback.
- Corrected version.
- Rewrite opportunity.
- Writing history.

## Required Result

Learners can produce Chinese writing and receive educational feedback that explains corrections.

---

# Phase 13 — Mission System

## Objective

Implement the final practical challenge for lessons.

## Scope

- Mission brief.
- Learner role.
- AI role.
- Communication objective.
- Success conditions.
- Text interaction.
- Basic voice interaction when available.
- Dynamic AI responses.
- Mission completion.
- Mission report.
- Retry with variations.

## Required Result

Learners can apply lesson content in a realistic interaction and receive competency-based feedback.

---

# Phase 14 — Progress and Competency System

## Objective

Measure and display meaningful learner development.

## MVP Competencies

- Listening.
- Speaking.
- Reading.
- Writing.
- Grammar.
- Vocabulary.
- Daily Communication.
- Travel Communication.
- Professional Communication when content exists.

## Scope

- Competency stages.
- Scenario mastery.
- Lesson completion.
- Vocabulary mastery.
- Grammar mastery.
- Quiz evidence.
- Speaking evidence.
- Writing evidence.
- Mission evidence.
- Strengths.
- Weaknesses.
- Recommendations.

## Required Result

The learner can understand what they can do, what needs improvement, and what should be practiced next.

---

# Phase 15 — Dashboard

## Objective

Connect all MVP systems into one personalized home experience.

## Scope

- Continue Learning.
- Daily goal.
- Study streak.
- AI recommendation.
- Learning Journey summary.
- Competency summary.
- Review recommendations.
- Quick practice actions.
- Recent meaningful achievement.

## Required Result

A returning learner can understand their status and continue studying with one primary action.

---

# Phase 16 — Review System

## Objective

Reinforce previously learned content.

## Scope

- Review queue.
- Vocabulary review.
- Grammar review.
- Dialogue review.
- AI-generated review activity.
- Review reason.
- Estimated duration.
- Review completion.
- Mastery adjustment.

## Required Result

HanGo can identify content requiring reinforcement and recommend focused review sessions.

---

# Phase 17 — Settings

## Objective

Allow learners to control relevant learning and account preferences.

## Scope

- Profile.
- Learning goal.
- Current level.
- Daily target.
- Explanation language.
- Correction style.
- AI Teacher preferences.
- Audio speed.
- Notifications.
- Appearance.
- Privacy.
- Account management.

## Required Result

Learners can understand and modify the settings that influence their HanGo experience.

---

# Phase 18 — Quality, Testing, and Stabilization

## Objective

Prepare the MVP for controlled release.

## Scope

- Unit testing.
- Integration testing.
- End-to-end testing.
- Authentication testing.
- Responsive testing.
- Accessibility testing.
- AI response testing.
- Audio testing.
- Data integrity testing.
- Security checks.
- Performance optimization.
- Error recovery.
- Bug fixing.

## Required Result

The complete MVP learning loop works reliably across supported devices.

---

# Phase 19 — Beta Release

## Objective

Release HanGo to a limited group of real learners.

## Scope

- Production deployment.
- Monitoring.
- Error tracking.
- Usage analytics.
- Learner feedback.
- Content feedback.
- AI quality feedback.
- Cost monitoring.
- Performance monitoring.

## Required Result

A controlled beta provides evidence about product usability, learning value, technical stability, and operational cost.

---

# Phase 20 — Public MVP Release

## Objective

Launch the stable HanGo MVP publicly.

## Scope

- Public landing page.
- Final onboarding.
- Subscription configuration if applicable.
- Legal documents.
- Support process.
- Production monitoring.
- Release communication.
- Initial marketing activation.

## Required Result

New learners can discover, register, study, practice, receive feedback, and track their progress independently.

---

# MVP Content Scope

The first MVP should not attempt to cover HSK 3–9 completely.

It should prove the methodology using a limited but coherent content set.

Recommended initial content:

## Scenario 1 — Restaurant

- Intermediate.
- Multiple lessons.
- Final mission.

## Scenario 2 — Hotel

- Intermediate.
- Multiple lessons.
- Final mission.

## Scenario 3 — Shopping

- Intermediate.
- Multiple lessons.
- Final mission.

## Optional Scenario 4 — Job Interview

- Upper Intermediate.
- Limited initial implementation.

The exact number of lessons will be defined in `mvp.md`.

---

# Features Excluded From the MVP

> **2026-09-05 audit note:** three items below have since shipped - see
> `mvp.md`'s matching audit note for detail: avatar systems (2026-08-30
> zodiac-animal avatars), a HanCoins economy (the closest real match to
> "complex gamification" - shop, achievements, coin-earning), and
> competitive rankings (the weekly leaderboard, 2026-08-30).

The MVP should not include:

- ~~Avatar systems.~~ **Built (2026-08-30) - see note above.**
- Virtual city.
- Social feed.
- Community.
- Live teachers.
- Classroom management.
- Teacher marketplace.
- ~~Complex gamification.~~ **Built in part (HanCoins economy, 2026-08-30) - see note above.**
- ~~Competitive rankings.~~ **Built (weekly leaderboard, 2026-08-30) - see note above.**
- Cantonese.
- Multiple learning languages.
- Native mobile applications.
- Advanced debate engine.
- Advanced presentation analysis.
- Fully autonomous AI curriculum generation.
- Complete HSK 3–9 curriculum.
- Complex subscription tiers.
- Enterprise features.

These may be considered after the core learning experience is validated.

---

# Post-MVP Priorities

After MVP validation, development may continue with:

## Version 1.1

- Improved AI Teacher memory.
- More scenarios.
- Better review scheduling.
- Additional exercise types.
- Improved audio quality.

## Version 1.5

- Real-time voice conversation.
- More advanced pronunciation feedback.
- Adaptive quizzes.
- Expanded missions.
- More detailed competency evidence.

## Version 2.0

- Advanced simulations.
- Debate practice.
- Presentation practice.
- Professional and academic pathways.
- HSK preparation mode.
- Content administration system.

## Future

- Additional languages.
- Teacher tools.
- Organizations.
- Classrooms.
- Community.
- Connected virtual learning environments.

---

# Phase Completion Requirements

A phase may only be marked complete when:

- All approved tasks are implemented.
- Acceptance criteria are satisfied.
- Tests pass.
- No critical bugs remain.
- Documentation is updated.
- Existing features remain functional.
- The result has been manually reviewed.

Partial implementation does not count as completion.

---

# Change Control

Any proposed roadmap change must include:

- Reason.
- Product impact.
- Technical impact.
- MVP impact.
- Dependencies.
- Updated documentation.

Claude must not change the roadmap independently.

---

# Success Definition

The HanGo Development Roadmap succeeds when Claude can build the platform phase by phase without guessing priorities, implementing future functionality prematurely, or losing alignment with the approved product vision.

---

End of document.