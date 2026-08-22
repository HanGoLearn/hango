# HanGo Development Milestones

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the official development milestones for HanGo.

Each milestone represents a concrete, verifiable product result.

A milestone is not complete because code exists.

A milestone is complete only when the expected functionality works, has been tested, and meets the documented acceptance criteria.

---

# Milestone Philosophy

HanGo should be developed through small, controlled releases.

Each milestone must:

- Produce a usable result.
- Reduce technical uncertainty.
- Preserve previous functionality.
- Be independently testable.
- Move the product closer to the complete MVP learning loop.

Claude Code must complete milestones in order unless an explicit project decision changes the sequence.

---

# Milestone Statuses

Each milestone may use one of these statuses:

```text
Not Started

In Progress

Blocked

Ready for Review

Completed
```

A milestone must not be marked as completed while critical defects remain.

---

# Milestone 0 — Project Foundation

Status: Not Started

## Objective

Create a stable technical base for HanGo development.

## Deliverables

- Application repository.
- Web application initialized.
- TypeScript configured.
- Code formatting configured.
- Linting configured.
- Environment variable structure.
- Database connection.
- Initial folder structure.
- Version control workflow.
- Basic test configuration.
- Local development instructions.

## Acceptance Criteria

- The project installs without errors.
- The development server starts correctly.
- The application loads in the browser.
- Linting runs successfully.
- Type checking runs successfully.
- The test command executes.
- Environment secrets are not committed.
- The documented project structure exists.

## Completion Evidence

- Successful local execution.
- Passing project checks.
- Initial repository commit.
- Updated setup documentation.

---

# Milestone 1 — Design System and Application Shell

Status: Not Started

## Objective

Create the shared visual foundation and authenticated application structure.

## Deliverables

- Design tokens.
- Typography configuration.
- Color roles.
- Spacing system.
- Button components.
- Form components.
- Card components.
- Feedback states.
- Loading states.
- Empty states.
- Desktop sidebar.
- Mobile bottom navigation.
- Top bar.
- Responsive application layout.
- AI Teacher placeholder panel.

## Acceptance Criteria

- Core components are reusable.
- Navigation works between primary sections.
- Active navigation states are visible.
- Desktop and mobile layouts are functional.
- Keyboard focus states are visible.
- Main screens have responsive placeholders.
- No feature-specific logic is implemented prematurely.

## Completion Evidence

- Component review.
- Desktop screenshots.
- Mobile screenshots.
- Accessibility smoke test.
- Responsive navigation test.

---

# Milestone 2 — Authentication

Status: Not Started

## Objective

Allow users to securely create accounts and access protected areas.

## Deliverables

- Registration.
- Login.
- Logout.
- Email verification.
- Password recovery.
- Google Sign-In.
- Session persistence.
- Protected routes.
- Basic user role support.
- Authentication error handling.

## Acceptance Criteria

- A new user can register.
- A registered user can log in.
- A logged-in user can log out.
- Protected routes reject unauthenticated access.
- Sessions persist correctly.
- Passwords are never stored in plain text.
- OAuth credentials remain server-side.
- Authentication errors do not expose sensitive account information.

## Completion Evidence

- Successful registration test.
- Successful login test.
- Protected route test.
- Password recovery test.
- Google authentication test.
- Session expiration test.

---

# Milestone 3 — Onboarding and Learner Profile

Status: Not Started

## Objective

Create the learner profile required for personalization.

## Deliverables

- Multi-step onboarding.
- Interface language selection.
- Explanation language selection.
- Chinese level selection.
- Learning goal selection.
- Skill priority selection.
- Daily study target.
- AI Teacher preferences.
- Learner profile persistence.
- Initial recommendation.

## Acceptance Criteria

- New users are directed to onboarding.
- Onboarding progress is saved.
- Required fields are validated.
- Learner preferences are stored.
- Returning users do not repeat completed onboarding.
- The system produces a starting recommendation.
- The learner can later modify relevant preferences.

## Completion Evidence

- New-user onboarding test.
- Interrupted onboarding recovery test.
- Profile persistence test.
- Recommendation generation test.

---

# Milestone 4 — Educational Content Foundation

Status: Not Started

## Objective

Implement the data structures required for HanGo learning content.

## Deliverables

Data models for:

- Domains.
- Scenarios.
- Scenario levels.
- Lessons.
- Lesson steps.
- Dialogues.
- Dialogue lines.
- Vocabulary.
- Grammar points.
- Exercises.
- Quizzes.
- Missions.
- Competencies.
- Learning objectives.
- Content versions.

Additional deliverables:

- Content retrieval services.
- Content validation.
- Seed data workflow.
- Initial Restaurant scenario structure.

## Acceptance Criteria

- Content is stored outside interface components.
- Relationships between content entities work.
- A scenario can contain lessons.
- A lesson can contain all required learning steps.
- Dialogue, vocabulary, grammar, exercises, quizzes, and missions can be retrieved.
- Invalid content is rejected.
- Existing content can be versioned.

## Completion Evidence

- Database migration.
- Seed execution.
- Content retrieval tests.
- Relationship tests.
- Validation tests.

---

# Milestone 5 — Learning Journey

Status: Not Started

## Objective

Allow learners to browse structured scenarios and open lessons.

## Deliverables

- Learning Journey screen.
- Scenario cards.
- Domain filters.
- Scenario statuses.
- Scenario progress.
- Scenario Detail screen.
- Difficulty display.
- Lesson list.
- Locked and available states.
- Continue Learning behavior.
- Restaurant scenario displayed from stored content.

## Acceptance Criteria

- The learner can open the Learning Journey.
- Scenario data comes from the backend.
- The learner can open a Scenario Detail page.
- Lessons display in the correct order.
- Locked content cannot be opened.
- Current progress is visible.
- The interface works on desktop and mobile.

## Completion Evidence

- Navigation test.
- Scenario retrieval test.
- Locked-state test.
- Responsive test.
- Progress display test.

---

# Milestone 6 — Core Lesson Experience

Status: Not Started

## Objective

Implement one complete lesson from start to finish.

## Deliverables

- Lesson header.
- Lesson step navigation.
- Situation step.
- Dialogue step.
- Comprehension step.
- Vocabulary step.
- Grammar step.
- Guided Practice step.
- Speaking placeholder step.
- Writing placeholder step.
- Quiz placeholder step.
- Mission placeholder step.
- Reflection step.
- Lesson progress.
- Autosave.
- Resume behavior.
- Pinyin toggle.
- Translation toggle.

## Acceptance Criteria

- One Restaurant lesson can be completed end to end.
- The learner can move through the lesson sequence.
- Completed steps remain marked.
- Lesson progress is saved.
- The learner can leave and resume.
- Pinyin and translation settings work.
- Chinese remains visually primary.
- Lesson content is loaded dynamically.

## Completion Evidence

- Complete lesson walkthrough.
- Autosave test.
- Resume test.
- Mobile lesson test.
- Content rendering test.

---

# Milestone 7 — Exercise Engine

Status: Not Started

## Objective

Implement reusable interactive exercise functionality.

## Deliverables

Exercise types:

- Multiple choice.
- True or false.
- Fill in the blank.
- Sentence ordering.
- Matching.
- Short written response.

System capabilities:

- Answer submission.
- Validation.
- Accepted alternatives.
- Hints.
- Retry.
- Immediate feedback.
- Result persistence.

## Acceptance Criteria

- Every MVP exercise type renders correctly.
- Answers are validated on the backend when appropriate.
- Feedback explains errors.
- Hints work progressively.
- Results are stored.
- Exercises support keyboard and touch interaction.
- Drag-dependent activities provide an accessible alternative.

## Completion Evidence

- Unit tests for validation.
- Integration tests for submissions.
- Accessibility test.
- Mobile interaction test.
- Result persistence test.

---

# Milestone 8 — Quiz System

Status: Not Started

## Objective

Implement lesson quizzes and result summaries.

## Deliverables

- Quiz renderer.
- Question navigation.
- Vocabulary questions.
- Grammar questions.
- Comprehension questions.
- Listening questions.
- Score calculation.
- Attempt storage.
- Question feedback.
- Results summary.
- Review recommendation.

## Acceptance Criteria

- The learner can complete a quiz.
- The score is calculated correctly.
- Results are stored.
- Feedback identifies important mistakes.
- Multiple attempts are supported.
- Quiz completion updates lesson progress.
- Quiz failure does not erase previous lesson work.

## Completion Evidence

- Score calculation tests.
- Attempt persistence tests.
- Quiz completion walkthrough.
- Error recovery test.

---

# Milestone 9 — AI Teacher MVP

Status: Not Started

## Objective

Implement a context-aware AI Teacher for text-based support.

## Deliverables

- Collapsed AI Teacher control.
- Desktop side panel.
- Expanded panel.
- Mobile AI Teacher view.
- Text conversation.
- Current context indicator.
- Tutor mode.
- Practice mode.
- Review mode.
- Suggested prompts.
- Vocabulary explanations.
- Grammar explanations.
- Dialogue explanations.
- Additional examples.
- Short generated practice.
- Session conversation history.
- AI loading and error states.

## Acceptance Criteria

- The AI Teacher is available from every core authenticated screen.
- It receives the active lesson context.
- It understands selected lesson content.
- It can explain in English or Spanish.
- It can respond in Chinese when requested.
- The learner does not need to copy visible lesson content.
- AI errors do not block lesson completion.
- Prompt templates and provider credentials remain server-side.

## Completion Evidence

- Context test.
- Explanation language test.
- Selected-content test.
- Mobile panel test.
- AI failure recovery test.
- Prompt security review.

---

# Milestone 10 — Audio Playback

Status: Not Started

## Objective

Add listening support to lesson content.

## Deliverables

- Text-to-Speech integration.
- Dialogue audio.
- Sentence-level audio.
- Vocabulary pronunciation.
- Play.
- Pause.
- Replay.
- Normal speed.
- Slow speed.
- Active dialogue-line highlighting.
- Audio generation caching.
- Audio metadata storage.
- Audio fallback states.

## Acceptance Criteria

- Complete dialogues can be played.
- Individual lines can be played.
- Vocabulary audio works.
- Slow audio remains understandable and natural.
- Generated audio is cached.
- The frontend exposes no private provider credentials.
- Audio failure does not prevent reading the lesson.
- Playback controls behave consistently.

## Completion Evidence

- Dialogue playback test.
- Sentence playback test.
- Cache test.
- Provider failure test.
- Mobile audio test.

---

# Milestone 11 — Speaking Lab MVP

Status: Not Started

## Objective

Enable basic Chinese speaking practice and feedback.

## Deliverables

- Microphone permission flow.
- Voice recording.
- Recording timer.
- Recording playback.
- Speech-to-Text.
- Transcript display.
- Pronunciation practice.
- Shadowing.
- Guided conversation.
- Scenario role play.
- Basic pronunciation feedback.
- Basic fluency feedback.
- Retry.
- Speaking attempt history.

## Acceptance Criteria

- The learner can record speech.
- The learner can hear the recording.
- The system produces a transcript.
- Feedback identifies the most important issues.
- The learner can retry.
- Failed speech processing preserves the recording when possible.
- Text alternatives remain available.
- Voice files remain private.

## Completion Evidence

- Microphone permission test.
- Recording test.
- Transcript test.
- Feedback test.
- Retry test.
- Privacy access test.

---

# Milestone 12 — Writing Lab MVP

Status: Not Started

## Objective

Enable structured Chinese writing practice and educational correction.

## Deliverables

- Writing Lab home.
- Sentence tasks.
- Short message tasks.
- Paragraph tasks.
- Practical writing tasks.
- Writing editor.
- Autosave.
- Submission.
- AI feedback.
- Original and corrected versions.
- Grammar observations.
- Vocabulary observations.
- Naturalness observations.
- Rewrite opportunity.
- Writing history.

## Acceptance Criteria

- The learner can write and save a response.
- Autosave works reliably.
- The AI evaluates the learner's own attempt.
- Corrections are explained.
- Original and corrected versions are distinguishable.
- The learner can rewrite and resubmit.
- AI failure does not erase the learner's text.

## Completion Evidence

- Autosave test.
- Submission test.
- Correction test.
- Rewrite test.
- AI failure recovery test.
- Mobile writing test.

---

# Milestone 13 — Mission System

Status: Not Started

## Objective

Allow learners to apply lesson content in realistic interactions.

## Deliverables

- Mission brief.
- Learner role.
- AI role.
- Communication objective.
- Success conditions.
- Text mission interaction.
- Voice mission interaction when available.
- Dynamic AI responses.
- Unexpected event support.
- Mission completion logic.
- Mission report.
- Retry with variation.
- Lesson mission.
- Scenario mission.

## Acceptance Criteria

- The learner understands the mission before starting.
- The AI remains in role.
- The interaction adapts to learner responses.
- Minor grammar errors do not automatically cause failure.
- Communication success is evaluated.
- Results update learning evidence.
- The learner can retry with a variation.
- Mission failures do not erase progress.

## Completion Evidence

- Lesson mission walkthrough.
- Scenario mission walkthrough.
- Role consistency test.
- Evaluation test.
- Retry variation test.

---

# Milestone 14 — Progress and Competency Profile

Status: Not Started

## Objective

Convert learner activity into meaningful competency progress.

## Deliverables

- Lesson completion tracking.
- Scenario completion tracking.
- Exercise evidence.
- Quiz evidence.
- Speaking evidence.
- Writing evidence.
- Mission evidence.
- Competency stages.
- Scenario mastery.
- Strengths summary.
- Weaknesses summary.
- Recommended next action.
- Progress screen.

## Acceptance Criteria

- Progress is based on stored evidence.
- One activity cannot incorrectly create mastery.
- Competency stages update predictably.
- Scenario mastery is visible.
- Recommendations include reasons.
- Learners can understand their strengths and priorities.
- Progress is preserved across sessions.

## Completion Evidence

- Competency calculation tests.
- Multi-evidence test.
- Progress persistence test.
- Recommendation test.
- Progress screen review.

---

# Milestone 15 — Personalized Dashboard

Status: Not Started

## Objective

Connect the learning systems into a useful returning-user experience.

## Deliverables

- Continue Learning.
- Current scenario.
- Current lesson.
- Daily target.
- Basic streak.
- AI recommendation.
- Scenario progress.
- Competency summary.
- Review recommendations.
- Quick practice actions.

## Acceptance Criteria

- The primary next action is clear.
- Continue Learning opens the correct lesson.
- Recommendations reflect learner data.
- Dashboard data updates after completed activities.
- Empty states work for new learners.
- The interface works on desktop and mobile.

## Completion Evidence

- New learner Dashboard test.
- Returning learner Dashboard test.
- Progress update test.
- Recommendation test.
- Responsive test.

---

# Milestone 16 — Review System

Status: Not Started

## Objective

Create focused reinforcement based on learner history.

## Deliverables

- Review queue.
- Vocabulary review.
- Grammar review.
- Recent mistake review.
- Dialogue replay.
- AI-generated short review.
- Review reason.
- Estimated duration.
- Completion tracking.
- Mastery adjustment.

## Acceptance Criteria

- The review queue uses learner evidence.
- Each review explains why it was selected.
- Review completion is stored.
- Repeated success can improve mastery.
- Repeated mistakes can reduce confidence appropriately.
- Review does not duplicate already-mastered content unnecessarily.

## Completion Evidence

- Queue generation test.
- Review completion test.
- Mastery adjustment test.
- Recommendation explanation test.

---

# Milestone 17 — Complete MVP Content

Status: Not Started

## Objective

Populate the MVP with the approved three-scenario curriculum.

## Deliverables

## Restaurant

- Four complete lessons.
- Four lesson missions.
- One scenario mission.

## Hotel

- Four complete lessons.
- Four lesson missions.
- One scenario mission.

## Shopping

- Four complete lessons.
- Four lesson missions.
- One scenario mission.

All content includes:

- Situations.
- Dialogues.
- Vocabulary.
- Grammar.
- Exercises.
- Speaking.
- Writing.
- Quizzes.
- Missions.
- Reflection.

## Acceptance Criteria

- All twelve lessons are complete.
- Content follows the approved educational standards.
- Chinese is accurate and natural.
- HSK mapping is documented.
- Audio exists where required.
- Exercises have valid answers.
- Missions evaluate the intended outcomes.
- No lesson contains unresolved placeholders.

## Completion Evidence

- Content review.
- Linguistic review.
- Educational validation.
- Full scenario walkthroughs.
- Content correction log.

---

# Milestone 18 — Settings and Privacy Controls

Status: Not Started

## Objective

Allow learners to control relevant preferences and account data.

## Deliverables

- Profile settings.
- Interface language.
- Explanation language.
- Learning goal.
- Skill priorities.
- Daily target.
- Correction style.
- AI Teacher preferences.
- Audio settings.
- Voice recording preference.
- AI history preference.
- Account deletion request.
- Privacy explanations.

## Acceptance Criteria

- Settings persist.
- Changes affect the relevant experience.
- Privacy options use clear language.
- Optional recording retention can be disabled.
- Account deletion can be requested.
- Sensitive changes require appropriate verification.

## Completion Evidence

- Settings persistence test.
- Preference behavior test.
- Privacy control test.
- Account deletion workflow test.

---

# Milestone 19 — Testing and Stabilization

Status: Not Started

## Objective

Validate the complete HanGo MVP before beta release.

## Deliverables

- Unit test coverage for critical logic.
- Integration tests.
- End-to-end tests.
- Authentication tests.
- Lesson flow tests.
- AI Teacher tests.
- Audio tests.
- Speaking tests.
- Writing tests.
- Mission tests.
- Progress tests.
- Responsive tests.
- Accessibility tests.
- Security review.
- Performance review.
- Error recovery review.
- Bug resolution.

## Acceptance Criteria

- The complete learning loop passes end-to-end.
- No critical defects remain.
- No high-severity security issue remains.
- Core flows work on desktop and mobile.
- Learning progress survives temporary failures.
- Accessibility blockers are resolved.
- Performance is acceptable for beta use.
- Operational monitoring is active.

## Completion Evidence

- Test report.
- Bug report.
- Security checklist.
- Accessibility checklist.
- Performance report.
- Release readiness review.

---

# Milestone 20 — Closed Beta

Status: Not Started

## Objective

Validate HanGo with a controlled group of real learners.

## Deliverables

- Production-like deployment.
- Invite-based access.
- Error monitoring.
- Product analytics.
- AI usage monitoring.
- Audio usage monitoring.
- Cost monitoring.
- Feedback collection.
- Support process.
- Beta issue backlog.

## Acceptance Criteria

- Invited learners can register and study independently.
- Core activity data is collected.
- Critical errors trigger alerts.
- User feedback can be submitted.
- AI and audio costs are measurable.
- The development team can diagnose failures.
- No major privacy or security incident occurs.

## Completion Evidence

- Beta usage report.
- Learner feedback summary.
- Cost report.
- Error report.
- Prioritized improvement backlog.

---

# Milestone 21 — Public MVP Release

Status: Not Started

## Objective

Release the stable HanGo MVP to its initial target audience.

## Deliverables

- Public production deployment.
- Landing page.
- Registration access.
- Legal documents.
- Privacy policy.
- Terms of service.
- Support contact.
- Monitoring.
- Analytics.
- Backup verification.
- Release communication.
- Optional simple subscription.

## Acceptance Criteria

- New learners can discover and use HanGo without manual assistance.
- Production services are monitored.
- Legal and privacy information is available.
- Backups are active and tested.
- Support responsibilities are defined.
- The complete learning loop works in production.
- Operational costs remain measurable.

## Completion Evidence

- Production release checklist.
- Backup restoration test.
- Monitoring validation.
- Public onboarding test.
- Release approval.

---

# Milestone Dependencies

The following dependencies must be respected:

```text
Project Foundation

↓

Application Shell

↓

Authentication

↓

Onboarding

↓

Content Foundation

↓

Learning Journey

↓

Lesson Experience

↓

Exercises and Quizzes

↓

AI Teacher

↓

Audio

↓

Speaking and Writing

↓

Missions

↓

Progress

↓

Dashboard and Review

↓

Complete Content

↓

Stabilization

↓

Beta

↓

Public Release
```

A dependent milestone should not begin while its required foundation is unstable.

---

# Parallel Work

Some work may proceed in parallel after the required foundations exist.

Examples:

- Content creation may continue while interface features are developed.
- Speaking and Writing Lab development may proceed in parallel after AI and storage foundations are stable.
- Testing should occur continuously rather than only at Milestone 19.
- Deployment preparation may begin before final stabilization.
- Branding and marketing preparation may proceed independently of core engineering.

Parallel work must not create conflicting implementations.

---

# Milestone Review Checklist

Before approving any milestone, verify:

- All deliverables exist.
- Acceptance criteria are satisfied.
- Tests pass.
- No critical bug remains.
- Existing features still work.
- Documentation is updated.
- Security and privacy implications were considered.
- Desktop and mobile behavior were reviewed.
- The result matches the approved MVP scope.

---

# Scope Protection

When a proposed task does not belong to the active milestone, Claude Code must:

1. Identify the milestone where the task belongs.

2. Avoid implementing it prematurely.

3. Record it in the appropriate backlog or future milestone.

4. Continue with the active milestone.

This prevents uncontrolled scope expansion.

---

# Success Definition

The HanGo milestone system succeeds when the project advances through clear, testable product outcomes without skipping dependencies, losing alignment, or expanding the MVP unnecessarily.

---

End of document.