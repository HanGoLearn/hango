# HanGo Development Tasks

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the official executable task list for building the HanGo MVP.

It converts the approved roadmap, milestones, engineering architecture, design system, and MVP scope into concrete development tasks.

Claude Code must use this document as the operational checklist during implementation.

---

# Execution Rules

Claude Code must follow these rules:

1. Complete tasks in order.

2. Do not begin tasks from a future milestone when the current milestone has unfinished dependencies.

3. Do not create new modules, files, entities, or features without explicit approval.

4. Use the documents inside `/docs` as the source of truth.

5. Mark a task as complete only after implementation and verification.

6. Run the required checks after every meaningful change.

7. Preserve existing functionality.

8. Do not replace working architecture without documenting the reason.

9. Do not hardcode educational content inside interface components.

10. Stop and report contradictions before continuing.

---

# Task Status

Use the following task states:

```text
[ ] Not started

[~] In progress

[x] Completed

[!] Blocked
```

A task may be marked completed only when:

- The implementation exists.
- The result works.
- Relevant tests pass.
- No known critical defect remains.
- Documentation has been updated when necessary.

---

# Current Project Status

```text
Planning: Active

Development: Not Started

Testing: Not Started

Beta: Not Started

Production: Not Started
```

---

# MILESTONE 0 — Project Foundation

Objective:

Create a stable technical foundation for HanGo.

---

## 0.1 Repository and Project Initialization

- [ ] Create the HanGo source repository.
- [ ] Initialize the web application.
- [ ] Configure TypeScript.
- [ ] Configure the approved package manager.
- [ ] Create the initial application structure.
- [ ] Configure version control.
- [ ] Create `.gitignore`.
- [ ] Add the initial README.
- [ ] Confirm that the application starts locally.

---

## 0.2 Code Quality

- [ ] Configure ESLint.
- [ ] Configure Prettier.
- [ ] Configure import ordering.
- [ ] Configure TypeScript strict mode.
- [ ] Add scripts for linting.
- [ ] Add scripts for formatting.
- [ ] Add scripts for type checking.
- [ ] Confirm that all initial quality checks pass.

---

## 0.3 Environment Configuration

- [ ] Create the environment variable template.
- [ ] Separate public and private environment variables.
- [ ] Add local development variables.
- [ ] Document required environment variables.
- [ ] Verify that secrets are excluded from version control.
- [ ] Add environment validation at application startup.
- [ ] Confirm that missing required variables produce clear errors.

---

## 0.4 Database Foundation

- [ ] Select and configure the approved relational database.
- [ ] Configure the ORM or database access layer.
- [ ] Create the initial database connection.
- [ ] Create the first migration.
- [ ] Add database scripts.
- [ ] Add local seed support.
- [ ] Confirm that migrations run successfully.
- [ ] Confirm that the application can read from the database.

---

## 0.5 Testing Foundation

- [ ] Configure the unit testing framework.
- [ ] Configure component testing.
- [ ] Configure integration testing.
- [ ] Configure end-to-end testing.
- [ ] Add one initial test for each testing level.
- [ ] Add test scripts.
- [ ] Confirm that all initial tests run successfully.

---

## 0.6 Development Documentation

- [ ] Document installation.
- [ ] Document local startup.
- [ ] Document environment configuration.
- [ ] Document database migration commands.
- [ ] Document test commands.
- [ ] Document code quality commands.
- [ ] Document the approved folder structure.

---

## Milestone 0 Completion Check

- [ ] Application installs successfully.
- [ ] Application starts locally.
- [ ] Database connection works.
- [ ] Linting passes.
- [ ] Formatting passes.
- [ ] Type checking passes.
- [ ] Tests execute.
- [ ] Secrets are protected.
- [ ] Setup documentation is complete.

---

# MILESTONE 1 — Design System and Application Shell

Objective:

Create the shared visual foundation and application structure.

---

## 1.1 Design Tokens

- [ ] Create color tokens.
- [ ] Create typography tokens.
- [ ] Create spacing tokens.
- [ ] Create border-radius tokens.
- [ ] Create shadow tokens.
- [ ] Create breakpoint tokens.
- [ ] Create motion tokens.
- [ ] Create z-index tokens.
- [ ] Prevent arbitrary visual values when an approved token exists.

---

## 1.2 Typography

- [ ] Configure the interface font.
- [ ] Configure a Chinese-compatible font.
- [ ] Define page-title styles.
- [ ] Define section-title styles.
- [ ] Define body-text styles.
- [ ] Define Chinese-text styles.
- [ ] Define Pinyin styles.
- [ ] Define translation styles.
- [ ] Confirm readability on desktop and mobile.

---

## 1.3 Base Components

- [ ] Implement Primary Button.
- [ ] Implement Secondary Button.
- [ ] Implement Tertiary Button.
- [ ] Implement Icon Button.
- [ ] Implement Text Input.
- [ ] Implement Text Area.
- [ ] Implement Select.
- [ ] Implement Checkbox.
- [ ] Implement Radio Group.
- [ ] Implement Toggle.
- [ ] Implement Card.
- [ ] Implement Modal.
- [ ] Implement Drawer.
- [ ] Implement Tooltip.
- [ ] Implement Progress Bar.
- [ ] Implement Information Banner.
- [ ] Implement Loading Indicator.
- [ ] Implement Skeleton.
- [ ] Implement Empty State.
- [ ] Implement Error State.

---

## 1.4 Component States

For every interactive component:

- [ ] Implement default state.
- [ ] Implement hover state.
- [ ] Implement focus state.
- [ ] Implement active state.
- [ ] Implement selected state when applicable.
- [ ] Implement disabled state.
- [ ] Implement loading state.
- [ ] Implement success state when applicable.
- [ ] Implement error state when applicable.

---

## 1.5 Application Layout

- [ ] Implement authenticated application shell.
- [ ] Implement desktop navigation sidebar.
- [ ] Implement mobile bottom navigation.
- [ ] Implement top bar.
- [ ] Implement main content container.
- [ ] Implement responsive layout behavior.
- [ ] Implement user menu placeholder.
- [ ] Implement AI Teacher placeholder panel.
- [ ] Implement floating AI Teacher button for mobile.
- [ ] Ensure the main content remains visually primary.

---

## 1.6 Placeholder Routes

Create functional placeholder routes for:

- [ ] Dashboard.
- [ ] Learning Journey.
- [ ] Speaking Lab.
- [ ] Writing Lab.
- [ ] Progress.
- [ ] Settings.
- [ ] AI Teacher full-screen view when required.

---

## 1.7 Accessibility Foundation

- [ ] Add visible keyboard focus states.
- [ ] Add accessible labels.
- [ ] Add semantic landmarks.
- [ ] Confirm keyboard navigation.
- [ ] Confirm touch target sizes.
- [ ] Support reduced-motion preferences.
- [ ] Confirm sufficient contrast.
- [ ] Avoid color-only status communication.

---

## Milestone 1 Completion Check

- [ ] All core components are reusable.
- [ ] Navigation works.
- [ ] Active route is visible.
- [ ] Desktop layout works.
- [ ] Mobile layout works.
- [ ] AI Teacher placeholder is accessible.
- [ ] Focus states are visible.
- [ ] No feature-specific business logic was added prematurely.

---

# MILESTONE 2 — Authentication

Objective:

Allow learners to securely create accounts and access HanGo.

---

## 2.1 Authentication Data Model

- [ ] Create User entity.
- [ ] Create Account entity for external providers when required.
- [ ] Create Session entity when required.
- [ ] Create verification-token support.
- [ ] Add user role field.
- [ ] Add email verification state.
- [ ] Add account creation timestamps.
- [ ] Create migration.
- [ ] Test authentication relationships.

---

## 2.2 Registration

- [ ] Create registration page.
- [ ] Add name field.
- [ ] Add email field.
- [ ] Add password field.
- [ ] Add terms acceptance.
- [ ] Validate registration input.
- [ ] Prevent duplicate accounts.
- [ ] Hash passwords securely.
- [ ] Create user account.
- [ ] Trigger email verification.
- [ ] Display safe success and error states.

---

## 2.3 Login

- [ ] Create login page.
- [ ] Validate credentials.
- [ ] Create authenticated session.
- [ ] Redirect authenticated users correctly.
- [ ] Preserve safe intended destination when appropriate.
- [ ] Add loading state.
- [ ] Add generic authentication errors.
- [ ] Prevent account-existence disclosure.

---

## 2.4 Logout

- [ ] Add logout action.
- [ ] Invalidate session.
- [ ] Clear local authenticated state.
- [ ] Redirect to login.
- [ ] Confirm protected content is no longer accessible.

---

## 2.5 Email Verification

- [ ] Create verification token.
- [ ] Send verification email.
- [ ] Create verification route.
- [ ] Validate token.
- [ ] Mark email as verified.
- [ ] Handle expired tokens.
- [ ] Support resending verification.
- [ ] Prevent token reuse.

---

## 2.6 Password Recovery

- [ ] Create forgot-password page.
- [ ] Generate reset token.
- [ ] Send reset email.
- [ ] Create password-reset page.
- [ ] Validate token.
- [ ] Update password securely.
- [ ] Invalidate existing reset token.
- [ ] Consider invalidating existing sessions.
- [ ] Use generic recovery messages.

---

## 2.7 Google Authentication

- [ ] Configure Google OAuth.
- [ ] Add Google Sign-In button.
- [ ] Handle authorization callback.
- [ ] Create or link user account safely.
- [ ] Protect provider credentials.
- [ ] Handle cancelled authentication.
- [ ] Handle OAuth errors.
- [ ] Verify redirect URLs by environment.

---

## 2.8 Protected Routes

- [ ] Create authentication middleware.
- [ ] Protect authenticated routes.
- [ ] Redirect unauthenticated users.
- [ ] Prevent authenticated users from unnecessarily reopening login.
- [ ] Enforce authorization on backend endpoints.
- [ ] Add basic role checks.

---

## 2.9 Session Management

- [ ] Configure secure cookies.
- [ ] Configure session expiration.
- [ ] Configure refresh behavior when applicable.
- [ ] Protect against session fixation.
- [ ] Verify logout invalidation.
- [ ] Test multiple-device behavior.
- [ ] Add clear expired-session handling.

---

## Milestone 2 Completion Check

- [ ] Registration works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Email verification works.
- [ ] Password recovery works.
- [ ] Google authentication works.
- [ ] Sessions persist safely.
- [ ] Protected routes are enforced.
- [ ] Authentication errors are secure.
- [ ] Relevant tests pass.

---

# MILESTONE 3 — Onboarding and Learner Profile

Objective:

Create the learner profile required for personalization.

---

## 3.1 Learner Profile Data Model

- [ ] Create Learner Profile entity.
- [ ] Add interface language.
- [ ] Add explanation language.
- [ ] Add current Chinese level.
- [ ] Add main learning goal.
- [ ] Add skill priorities.
- [ ] Add daily study target.
- [ ] Add onboarding completion state.
- [ ] Add AI Teacher preferences.
- [ ] Create migration.
- [ ] Test user-profile relationship.

---

## 3.2 Multi-Step Onboarding

- [ ] Create onboarding layout.
- [ ] Create progress indicator.
- [ ] Create Welcome step.
- [ ] Create Learning Goal step.
- [ ] Create Current Level step.
- [ ] Create Explanation Language step.
- [ ] Create Skill Priorities step.
- [ ] Create Daily Target step.
- [ ] Create AI Teacher Preferences step.
- [ ] Create Recommendation step.
- [ ] Add Back and Continue actions.
- [ ] Add validation by step.

---

## 3.3 Onboarding Persistence

- [ ] Save progress after each step.
- [ ] Restore interrupted onboarding.
- [ ] Prevent loss after refresh.
- [ ] Mark onboarding as completed.
- [ ] Redirect completed users to Dashboard.
- [ ] Prevent repeated onboarding unless manually restarted.

---

## 3.4 Starting Recommendation

- [ ] Define MVP recommendation rules.
- [ ] Use selected level.
- [ ] Use learning goal.
- [ ] Use skill priorities.
- [ ] Recommend an initial scenario.
- [ ] Recommend a daily study target.
- [ ] Explain the recommendation.
- [ ] Persist the recommendation when appropriate.

---

## Milestone 3 Completion Check

- [ ] New users enter onboarding.
- [ ] Every onboarding step works.
- [ ] Progress survives interruption.
- [ ] Learner profile is stored.
- [ ] Recommendation is generated.
- [ ] Completed users reach Dashboard.
- [ ] Relevant settings can later be edited.

---

# MILESTONE 4 — Educational Content Foundation

Objective:

Implement the structured content model required by HanGo.

---

## 4.1 Core Curriculum Entities

- [ ] Create Domain entity.
- [ ] Create Scenario entity.
- [ ] Create Scenario Level entity.
- [ ] Create Lesson entity.
- [ ] Create Lesson Step entity.
- [ ] Create Learning Objective entity.
- [ ] Create Competency entity.
- [ ] Create Content Version entity.
- [ ] Create required relationships.
- [ ] Create migration.

---

## 4.2 Dialogue Entities

- [ ] Create Dialogue entity.
- [ ] Create Dialogue Speaker entity.
- [ ] Create Dialogue Line entity.
- [ ] Store Chinese text.
- [ ] Store Pinyin.
- [ ] Store translation.
- [ ] Store line order.
- [ ] Store audio metadata relationship.
- [ ] Validate dialogue ordering.

---

## 4.3 Vocabulary Entities

- [ ] Create Vocabulary Item entity.
- [ ] Add Chinese form.
- [ ] Add Pinyin.
- [ ] Add meaning.
- [ ] Add part of speech.
- [ ] Add contextual example.
- [ ] Add lesson relationship.
- [ ] Add level or HSK reference.
- [ ] Add audio metadata relationship.

---

## 4.4 Grammar Entities

- [ ] Create Grammar Point entity.
- [ ] Add communication purpose.
- [ ] Add structure.
- [ ] Add explanation.
- [ ] Add examples.
- [ ] Add common mistake.
- [ ] Add lesson relationship.
- [ ] Add level or HSK reference.

---

## 4.5 Exercise Entities

- [ ] Create Exercise entity.
- [ ] Add exercise type.
- [ ] Add instruction.
- [ ] Add prompt.
- [ ] Add correct answer structure.
- [ ] Add accepted alternatives.
- [ ] Add hints.
- [ ] Add explanation.
- [ ] Add lesson relationship.
- [ ] Add sequence order.

---

## 4.6 Quiz Entities

- [ ] Create Quiz entity.
- [ ] Create Quiz Question entity.
- [ ] Add question types.
- [ ] Add scoring weight.
- [ ] Add answer structure.
- [ ] Add feedback.
- [ ] Add lesson relationship.
- [ ] Add question ordering.

---

## 4.7 Mission Entities

- [ ] Create Mission entity.
- [ ] Add mission type.
- [ ] Add context.
- [ ] Add learner role.
- [ ] Add AI role.
- [ ] Add objective.
- [ ] Add success conditions.
- [ ] Add allowed interaction modes.
- [ ] Add evaluation criteria.
- [ ] Add lesson or scenario relationship.

---

## 4.8 Content Services

- [ ] Create domain retrieval service.
- [ ] Create scenario retrieval service.
- [ ] Create lesson retrieval service.
- [ ] Create dialogue retrieval service.
- [ ] Create vocabulary retrieval service.
- [ ] Create grammar retrieval service.
- [ ] Create exercise retrieval service.
- [ ] Create quiz retrieval service.
- [ ] Create mission retrieval service.
- [ ] Add authorization where required.

---

## 4.9 Content Validation

- [ ] Validate required fields.
- [ ] Validate lesson-step order.
- [ ] Validate dialogue-line order.
- [ ] Validate correct answers.
- [ ] Validate mission objectives.
- [ ] Validate content references.
- [ ] Reject incomplete published content.
- [ ] Distinguish draft and published content.

---

## 4.10 Seed Data

- [ ] Create structured seed format.
- [ ] Seed the Restaurant domain and scenario.
- [ ] Seed four Restaurant lesson records.
- [ ] Seed one initial complete lesson.
- [ ] Seed vocabulary.
- [ ] Seed grammar.
- [ ] Seed dialogue.
- [ ] Seed exercises.
- [ ] Seed quiz.
- [ ] Seed mission.
- [ ] Confirm repeatable seed execution.

---

## Milestone 4 Completion Check

- [ ] Content is not hardcoded in UI components.
- [ ] All core entities exist.
- [ ] Relationships work.
- [ ] Validation rejects malformed content.
- [ ] Seed data loads.
- [ ] One complete lesson can be retrieved.
- [ ] Versioning foundation exists.

---

# MILESTONE 5 — Learning Journey

Objective:

Allow learners to browse scenarios and enter lessons.

---

## 5.1 Learning Journey Page

- [ ] Create Learning Journey route.
- [ ] Load scenarios from backend.
- [ ] Implement page header.
- [ ] Implement domain filters.
- [ ] Implement responsive scenario grid.
- [ ] Implement loading state.
- [ ] Implement empty state.
- [ ] Implement error state.

---

## 5.2 Scenario Card

- [ ] Display scenario name.
- [ ] Display domain.
- [ ] Display description.
- [ ] Display difficulty.
- [ ] Display progress.
- [ ] Display status.
- [ ] Display primary action.
- [ ] Support locked state.
- [ ] Support available state.
- [ ] Support in-progress state.
- [ ] Support completed state.
- [ ] Support mastered state.

---

## 5.3 Scenario Detail Page

- [ ] Create Scenario Detail route.
- [ ] Load scenario data.
- [ ] Display scenario header.
- [ ] Display communication outcomes.
- [ ] Display difficulty level.
- [ ] Display lesson list.
- [ ] Display final scenario mission.
- [ ] Display progress.
- [ ] Add responsive behavior.

---

## 5.4 Lesson Availability

- [ ] Define lesson unlocking rules.
- [ ] Display first available lesson.
- [ ] Lock future lessons when required.
- [ ] Unlock next lesson after completion.
- [ ] Prevent direct unauthorized access to locked lessons.
- [ ] Preserve access to completed lessons.

---

## 5.5 Continue Learning

- [ ] Store current scenario.
- [ ] Store current lesson.
- [ ] Store current lesson step.
- [ ] Create Continue Learning resolver.
- [ ] Link Dashboard placeholder to correct lesson.
- [ ] Handle users without active progress.

---

## Milestone 5 Completion Check

- [ ] Scenarios load from stored content.
- [ ] Scenario cards work.
- [ ] Scenario Detail works.
- [ ] Lesson ordering is correct.
- [ ] Locked content is protected.
- [ ] Continue Learning resolves correctly.
- [ ] Desktop and mobile layouts work.

---

# MILESTONE 6 — Core Lesson Experience

Objective:

Implement one complete lesson from beginning to end.

---

## 6.1 Lesson Route and Loader

- [ ] Create lesson route.
- [ ] Load lesson by scenario and lesson identifier.
- [ ] Validate learner access.
- [ ] Load all lesson-step metadata.
- [ ] Handle missing lessons.
- [ ] Handle unpublished lessons.
- [ ] Add loading state.
- [ ] Add error state.

---

## 6.2 Lesson Header

- [ ] Display scenario name.
- [ ] Display lesson title.
- [ ] Display communication objective.
- [ ] Display progress.
- [ ] Display save status.
- [ ] Add exit action.
- [ ] Add responsive behavior.

---

## 6.3 Lesson Step Navigation

- [ ] Display ordered steps.
- [ ] Highlight current step.
- [ ] Mark completed steps.
- [ ] Allow review of completed steps.
- [ ] Prevent invalid skipping.
- [ ] Support mobile compact navigation.
- [ ] Preserve learner position.

---

## 6.4 Situation Step

- [ ] Display location.
- [ ] Display participants.
- [ ] Display context.
- [ ] Display communication objective.
- [ ] Add Continue action.
- [ ] Keep text concise.

---

## 6.5 Dialogue Step

- [ ] Render speakers.
- [ ] Render dialogue lines.
- [ ] Display Chinese text.
- [ ] Add Pinyin toggle.
- [ ] Add translation toggle.
- [ ] Add sentence selection.
- [ ] Add audio control placeholders.
- [ ] Add Ask AI action placeholder.
- [ ] Preserve current line.

---

## 6.6 Comprehension Step

- [ ] Render comprehension questions.
- [ ] Submit answers.
- [ ] Validate answers.
- [ ] Display immediate feedback.
- [ ] Persist result.
- [ ] Allow retry when appropriate.

---

## 6.7 Vocabulary Step

- [ ] Render vocabulary items.
- [ ] Display Chinese.
- [ ] Display Pinyin.
- [ ] Display meaning.
- [ ] Display part of speech.
- [ ] Display example.
- [ ] Add audio placeholder.
- [ ] Add difficult-item action.
- [ ] Add Ask AI placeholder.

---

## 6.8 Grammar Step

- [ ] Display communication purpose.
- [ ] Display structure.
- [ ] Display lesson example.
- [ ] Display additional examples.
- [ ] Display common mistake.
- [ ] Add practice action.
- [ ] Add Ask AI placeholder.

---

## 6.9 Guided Practice Step

- [ ] Render exercise list.
- [ ] Show one exercise at a time or approved grouped layout.
- [ ] Display progress.
- [ ] Display hint action.
- [ ] Display submit action.
- [ ] Display feedback.
- [ ] Persist results.

---

## 6.10 Speaking Placeholder Step

- [ ] Display speaking objective.
- [ ] Display model sentence.
- [ ] Display future recording area.
- [ ] Allow temporary completion for prototype.
- [ ] Clearly label unavailable functions during early development.

---

## 6.11 Writing Placeholder Step

- [ ] Display writing objective.
- [ ] Display writing prompt.
- [ ] Add basic text editor.
- [ ] Save temporary response.
- [ ] Allow temporary completion for prototype.

---

## 6.12 Quiz Placeholder Step

- [ ] Display quiz overview.
- [ ] Connect to quiz system placeholder.
- [ ] Prevent false scoring before quiz implementation.
- [ ] Allow controlled prototype completion.

---

## 6.13 Mission Placeholder Step

- [ ] Display mission brief.
- [ ] Display learner role.
- [ ] Display objective.
- [ ] Display future interaction area.
- [ ] Allow controlled prototype completion.

---

## 6.14 Reflection Step

- [ ] Display achieved objective.
- [ ] Display vocabulary practiced.
- [ ] Display grammar practiced.
- [ ] Display competency placeholder.
- [ ] Display next action.
- [ ] Mark lesson complete.

---

## 6.15 Lesson Progress and Autosave

- [ ] Create Learner Lesson Progress entity.
- [ ] Store current step.
- [ ] Store completed steps.
- [ ] Store step responses.
- [ ] Add autosave.
- [ ] Display saving state.
- [ ] Display saved state.
- [ ] Recover from temporary save failure.
- [ ] Resume lesson correctly.

---

## Milestone 6 Completion Check

- [ ] One complete Restaurant lesson works end to end.
- [ ] Lesson data is dynamic.
- [ ] Progress is saved.
- [ ] Resume works.
- [ ] Pinyin toggle works.
- [ ] Translation toggle works.
- [ ] Desktop and mobile lesson interfaces work.
- [ ] Temporary placeholders are clearly isolated.

---

# MILESTONE 7 — Exercise Engine

Objective:

Implement reusable exercise types.

---

## 7.1 Exercise Runtime

- [ ] Create shared Exercise Container.
- [ ] Load exercise configuration.
- [ ] Track active exercise.
- [ ] Track answer state.
- [ ] Submit answer.
- [ ] Validate answer.
- [ ] Display feedback.
- [ ] Persist attempt.
- [ ] Support retry.
- [ ] Support hints.

---

## 7.2 Multiple Choice

- [ ] Render answer options.
- [ ] Support single selection.
- [ ] Add keyboard controls.
- [ ] Validate selected option.
- [ ] Display correct state.
- [ ] Display incorrect state.
- [ ] Disable changes after confirmed submission when required.

---

## 7.3 True or False

- [ ] Render two clear options.
- [ ] Support keyboard selection.
- [ ] Validate answer.
- [ ] Display explanation.
- [ ] Persist attempt.

---

## 7.4 Fill in the Blank

- [ ] Render sentence and blank.
- [ ] Support Chinese text input.
- [ ] Normalize accepted input carefully.
- [ ] Support accepted alternatives.
- [ ] Validate answer.
- [ ] Display correction.
- [ ] Preserve learner answer.

---

## 7.5 Sentence Ordering

- [ ] Render movable words or phrases.
- [ ] Support drag and drop.
- [ ] Support touch.
- [ ] Support keyboard alternative.
- [ ] Add reset action.
- [ ] Validate order.
- [ ] Display correct structure.

---

## 7.6 Matching

- [ ] Render paired items.
- [ ] Support click-to-match.
- [ ] Support touch.
- [ ] Avoid drag-only dependency.
- [ ] Validate matches.
- [ ] Display unresolved items.
- [ ] Persist attempt.

---

## 7.7 Short Written Response

- [ ] Render prompt.
- [ ] Add text area.
- [ ] Validate required content.
- [ ] Support exact validation when appropriate.
- [ ] Support AI evaluation later without blocking MVP foundation.
- [ ] Preserve response.
- [ ] Display feedback.

---

## 7.8 Hints

- [ ] Support multiple hint levels.
- [ ] Track hint usage.
- [ ] Display remaining hints.
- [ ] Avoid immediately revealing full answer.
- [ ] Persist hint usage for evaluation.

---

## Milestone 7 Completion Check

- [ ] All approved exercise types work.
- [ ] Validation is correct.
- [ ] Results are stored.
- [ ] Hints work.
- [ ] Retry works.
- [ ] Keyboard and touch interactions work.
- [ ] Accessibility alternatives exist.

---

# MILESTONE 8 — Quiz System

Objective:

Implement quizzes and result summaries.

---

## 8.1 Quiz Attempt Model

- [ ] Create Quiz Attempt entity.
- [ ] Create Quiz Answer entity.
- [ ] Store start time.
- [ ] Store completion time.
- [ ] Store score.
- [ ] Store attempt number.
- [ ] Store question results.
- [ ] Create migration.

---

## 8.2 Quiz Runtime

- [ ] Load quiz.
- [ ] Start attempt.
- [ ] Render question.
- [ ] Navigate between questions.
- [ ] Track answers.
- [ ] Prevent accidental answer loss.
- [ ] Submit quiz.
- [ ] Calculate score.
- [ ] Store results.
- [ ] Handle incomplete submission.

---

## 8.3 Question Types

- [ ] Support vocabulary questions.
- [ ] Support grammar questions.
- [ ] Support comprehension questions.
- [ ] Support listening questions.
- [ ] Support reading questions.
- [ ] Reuse exercise components when appropriate.

---

## 8.4 Quiz Results

- [ ] Display total score.
- [ ] Display question-level feedback.
- [ ] Display strong areas.
- [ ] Display priority mistakes.
- [ ] Display review recommendation.
- [ ] Allow retry.
- [ ] Update lesson completion conditions.

---

## Milestone 8 Completion Check

- [ ] Quiz starts and completes.
- [ ] Score calculation is correct.
- [ ] Attempts are stored.
- [ ] Feedback is educational.
- [ ] Retry works.
- [ ] Quiz completion updates lesson progress.
- [ ] Temporary failures do not erase previous lesson data.

---

# MILESTONE 9 — AI Teacher MVP

Objective:

Implement the persistent context-aware AI Teacher.

---

## 9.1 AI Provider Abstraction

- [ ] Create AI provider interface.
- [ ] Implement initial provider adapter.
- [ ] Store credentials server-side.
- [ ] Add timeout handling.
- [ ] Add retry policy.
- [ ] Add provider error normalization.
- [ ] Add usage logging.
- [ ] Add cost metadata when available.

---

## 9.2 AI Teacher Context

- [ ] Define AI context object.
- [ ] Include learner level.
- [ ] Include explanation language.
- [ ] Include active route.
- [ ] Include active scenario.
- [ ] Include active lesson.
- [ ] Include active lesson step.
- [ ] Include selected dialogue line.
- [ ] Include selected vocabulary or grammar item.
- [ ] Include recent relevant learner answer.
- [ ] Avoid sending unnecessary personal data.

---

## 9.3 AI Teacher Interface

- [ ] Implement collapsed state.
- [ ] Implement compact side panel.
- [ ] Implement expanded panel.
- [ ] Implement mobile drawer.
- [ ] Implement full-screen view.
- [ ] Implement conversation history.
- [ ] Implement message composer.
- [ ] Implement suggested prompts.
- [ ] Implement context indicator.
- [ ] Implement loading state.
- [ ] Implement error state.
- [ ] Implement retry action.

---

## 9.4 AI Teacher Modes

- [ ] Implement Tutor mode.
- [ ] Implement Practice mode.
- [ ] Implement Review mode.
- [ ] Display active mode.
- [ ] Preserve mode during the session.
- [ ] Define separate system instructions by mode.
- [ ] Prevent unauthorized prompt override.

---

## 9.5 AI Teacher Capabilities

- [ ] Explain vocabulary.
- [ ] Explain grammar.
- [ ] Explain dialogue lines.
- [ ] Explain exercise errors.
- [ ] Generate additional examples.
- [ ] Generate short practice.
- [ ] Respond in English.
- [ ] Respond in Spanish.
- [ ] Respond in Chinese when requested.
- [ ] Adjust explanation complexity to learner level.

---

## 9.6 AI Conversation Storage

- [ ] Create AI Conversation entity.
- [ ] Create AI Message entity.
- [ ] Store session history when enabled.
- [ ] Respect privacy preference.
- [ ] Allow conversation reset.
- [ ] Avoid logging hidden prompts.
- [ ] Avoid storing unnecessary provider data.

---

## 9.7 AI Safety and Reliability

- [ ] Add input limits.
- [ ] Add output limits.
- [ ] Add rate limiting.
- [ ] Add prompt-injection resistance.
- [ ] Validate structured responses where used.
- [ ] Add fallback message.
- [ ] Ensure AI failure does not block lesson progress.
- [ ] Log failures without sensitive content.

---

## Milestone 9 Completion Check

- [ ] AI Teacher is available in all core authenticated sections.
- [ ] It understands active context.
- [ ] Selected content is passed correctly.
- [ ] Language preference works.
- [ ] Tutor, Practice, and Review modes work.
- [ ] Errors are recoverable.
- [ ] Provider credentials remain private.
- [ ] Usage is measurable.

---

# MILESTONE 10 — Audio Playback

Objective:

Add listening support to dialogues and vocabulary.

---

## 10.1 Audio Provider Abstraction

- [ ] Create TTS provider interface.
- [ ] Implement initial provider adapter.
- [ ] Protect provider credentials.
- [ ] Normalize provider errors.
- [ ] Track generation usage.
- [ ] Track cost metadata when available.
- [ ] Support future provider replacement.

---

## 10.2 Audio Data Model

- [ ] Create Audio Asset entity.
- [ ] Add source text reference.
- [ ] Add language.
- [ ] Add voice identifier.
- [ ] Add speed variant.
- [ ] Add provider.
- [ ] Add storage path.
- [ ] Add duration.
- [ ] Add generation status.
- [ ] Add timestamps.
- [ ] Create migration.

---

## 10.3 Audio Generation

- [ ] Generate dialogue audio.
- [ ] Generate line-level audio.
- [ ] Generate vocabulary audio.
- [ ] Support normal-speed variant.
- [ ] Support natural slow-speed variant.
- [ ] Cache generated audio.
- [ ] Avoid duplicate generation.
- [ ] Handle failed generation.
- [ ] Store metadata.

---

## 10.4 Audio Player

- [ ] Implement play.
- [ ] Implement pause.
- [ ] Implement replay.
- [ ] Implement progress.
- [ ] Implement duration.
- [ ] Implement speed selection.
- [ ] Implement loading state.
- [ ] Implement unavailable state.
- [ ] Ensure keyboard accessibility.

---

## 10.5 Dialogue Playback

- [ ] Play full dialogue.
- [ ] Play individual line.
- [ ] Highlight active line.
- [ ] Move highlight with playback.
- [ ] Preserve selected line.
- [ ] Stop correctly when changing lessons.
- [ ] Handle mobile audio restrictions.

---

## Milestone 10 Completion Check

- [ ] Dialogue playback works.
- [ ] Sentence playback works.
- [ ] Vocabulary audio works.
- [ ] Slow audio is natural.
- [ ] Audio is cached.
- [ ] Failures have fallbacks.
- [ ] Private credentials are not exposed.

---

# MILESTONE 11 — Speaking Lab MVP

Objective:

Enable voice recording, transcription, and basic feedback.

---

## 11.1 Speaking Data Model

- [ ] Create Speaking Session entity.
- [ ] Create Speaking Attempt entity.
- [ ] Store activity type.
- [ ] Store prompt.
- [ ] Store recording metadata.
- [ ] Store transcript.
- [ ] Store feedback.
- [ ] Store duration.
- [ ] Store completion state.
- [ ] Create migration.

---

## 11.2 Recording Interface

- [ ] Request microphone permission.
- [ ] Explain permission denial.
- [ ] Implement Record state.
- [ ] Implement Recording state.
- [ ] Implement Stop action.
- [ ] Implement Processing state.
- [ ] Implement Completed state.
- [ ] Implement Error state.
- [ ] Display timer.
- [ ] Allow recording playback.
- [ ] Allow retry.

---

## 11.3 Recording Storage

- [ ] Upload recording securely.
- [ ] Validate file type.
- [ ] Validate file size.
- [ ] Store recording privately.
- [ ] Store metadata.
- [ ] Generate controlled access URL.
- [ ] Respect recording retention preference.
- [ ] Support deletion.

---

## 11.4 Speech-to-Text

- [ ] Create STT provider interface.
- [ ] Implement initial provider adapter.
- [ ] Use Mandarin language hints.
- [ ] Transcribe learner recording.
- [ ] Store transcript.
- [ ] Handle low-confidence transcription.
- [ ] Allow learner to report inaccurate transcript.
- [ ] Handle provider failure.

---

## 11.5 Pronunciation Practice

- [ ] Display model word or sentence.
- [ ] Play model audio.
- [ ] Record learner attempt.
- [ ] Compare expected and transcribed content.
- [ ] Provide general clarity feedback.
- [ ] Identify important syllable issues when supported.
- [ ] Provide basic tone observations when supported.
- [ ] Offer retry.

---

## 11.6 Shadowing

- [ ] Play model sentence.
- [ ] Add pause or repetition flow.
- [ ] Record learner repetition.
- [ ] Compare completeness.
- [ ] Evaluate basic timing.
- [ ] Evaluate general fluency.
- [ ] Display feedback.
- [ ] Allow another attempt.

---

## 11.7 Guided Conversation

- [ ] Create conversation setup.
- [ ] Select scenario.
- [ ] Select difficulty.
- [ ] Start turn-based AI conversation.
- [ ] Record learner turn.
- [ ] Transcribe learner turn.
- [ ] Send transcript to AI.
- [ ] Generate AI reply.
- [ ] Play or display AI reply.
- [ ] Preserve session history.
- [ ] End session.
- [ ] Generate summary.

---

## 11.8 Scenario Role Play

- [ ] Select role.
- [ ] Display communication objective.
- [ ] Keep AI in character.
- [ ] Support voice input.
- [ ] Support text fallback.
- [ ] Introduce simple scenario variation.
- [ ] End role play.
- [ ] Generate feedback.

---

## 11.9 Speaking Feedback

- [ ] Evaluate communication success.
- [ ] Evaluate basic fluency.
- [ ] Evaluate transcript completeness.
- [ ] Evaluate important pronunciation issues.
- [ ] Limit feedback to useful priorities.
- [ ] Explain uncertainty.
- [ ] Avoid presenting scores as perfect phonetic truth.
- [ ] Recommend next practice.

---

## Milestone 11 Completion Check

- [ ] Recording works.
- [ ] Playback works.
- [ ] Transcription works.
- [ ] Pronunciation practice works.
- [ ] Shadowing works.
- [ ] Guided conversation works.
- [ ] Role play works.
- [ ] Retry works.
- [ ] Recordings remain private.
- [ ] Text fallback exists.

---

# MILESTONE 12 — Writing Lab MVP

Objective:

Enable writing practice and educational correction.

---

## 12.1 Writing Data Model

- [ ] Create Writing Task entity.
- [ ] Create Writing Attempt entity.
- [ ] Store prompt.
- [ ] Store response.
- [ ] Store draft state.
- [ ] Store submitted state.
- [ ] Store AI feedback.
- [ ] Store corrected version.
- [ ] Store rewrite relationship.
- [ ] Create migration.

---

## 12.2 Writing Lab Home

- [ ] Create Writing Lab route.
- [ ] Display task categories.
- [ ] Display recent attempts.
- [ ] Display recommended task.
- [ ] Add empty state.
- [ ] Add loading state.
- [ ] Add responsive behavior.

---

## 12.3 Writing Task Types

- [ ] Implement sentence task.
- [ ] Implement short-message task.
- [ ] Implement paragraph task.
- [ ] Implement practical-writing task.
- [ ] Add difficulty.
- [ ] Add target length.
- [ ] Add optional vocabulary.
- [ ] Add optional grammar target.

---

## 12.4 Writing Editor

- [ ] Implement editor.
- [ ] Add character count.
- [ ] Add autosave.
- [ ] Display save status.
- [ ] Restore draft.
- [ ] Preserve text after refresh.
- [ ] Prevent accidental loss.
- [ ] Support mobile input.

---

## 12.5 AI Writing Feedback

- [ ] Send learner attempt for evaluation.
- [ ] Evaluate grammar.
- [ ] Evaluate vocabulary.
- [ ] Evaluate naturalness.
- [ ] Evaluate organization when relevant.
- [ ] Evaluate communication clarity.
- [ ] Generate corrected version.
- [ ] Explain important changes.
- [ ] Avoid excessive correction.
- [ ] Preserve original text.

---

## 12.6 Feedback Interface

- [ ] Display original response.
- [ ] Display corrected response.
- [ ] Highlight important differences.
- [ ] Display feedback categories.
- [ ] Add Ask AI action.
- [ ] Add Rewrite action.
- [ ] Add New Task action.

---

## 12.7 Rewrite Flow

- [ ] Create rewrite from previous attempt.
- [ ] Preserve original feedback.
- [ ] Allow resubmission.
- [ ] Compare improvement.
- [ ] Store attempt relationship.
- [ ] Update writing evidence.

---

## Milestone 12 Completion Check

- [ ] Writing tasks work.
- [ ] Autosave works.
- [ ] Draft recovery works.
- [ ] AI feedback works.
- [ ] Corrections are explained.
- [ ] Original text is preserved.
- [ ] Rewrite works.
- [ ] AI failure does not erase learner content.

---

# MILESTONE 13 — Mission System

Objective:

Implement practical scenario-based missions.

---

## 13.1 Mission Runtime

- [ ] Load mission configuration.
- [ ] Display Mission Brief.
- [ ] Display learner role.
- [ ] Display AI role.
- [ ] Display objective.
- [ ] Display success conditions.
- [ ] Start mission session.
- [ ] Track conversation.
- [ ] Track task completion.
- [ ] End mission.
- [ ] Generate report.
- [ ] Store result.

---

## 13.2 Mission AI Behavior

- [ ] Define mission system prompt.
- [ ] Keep AI in role.
- [ ] Limit AI to scenario context.
- [ ] Adapt to learner responses.
- [ ] Introduce approved unexpected event.
- [ ] Avoid solving the task for the learner.
- [ ] Avoid unnecessary corrections during interaction.
- [ ] Detect communication breakdown.
- [ ] Support recovery prompts.

---

## 13.3 Lesson Missions

- [ ] Connect one mission to each lesson.
- [ ] Use lesson communication objective.
- [ ] Limit duration to approximately 2–5 minutes.
- [ ] Evaluate lesson target.
- [ ] Support text interaction.
- [ ] Support voice when available.
- [ ] Store result.

---

## 13.4 Scenario Missions

- [ ] Connect one final mission to each scenario.
- [ ] Combine scenario outcomes.
- [ ] Include at least one unexpected event.
- [ ] Limit duration to approximately 5–10 minutes.
- [ ] Evaluate communication across multiple objectives.
- [ ] Support retry with variation.

---

## 13.5 Mission Evaluation

- [ ] Evaluate communication success.
- [ ] Evaluate task completion.
- [ ] Evaluate relevant vocabulary use.
- [ ] Evaluate relevant grammar use.
- [ ] Evaluate clarity.
- [ ] Evaluate fluency when voice is used.
- [ ] Avoid failing for minor errors when communication succeeds.
- [ ] Generate strengths.
- [ ] Generate priority improvement.
- [ ] Generate next recommendation.

---

## Milestone 13 Completion Check

- [ ] Lesson mission works.
- [ ] Scenario mission works.
- [ ] AI remains in role.
- [ ] Unexpected events work.
- [ ] Evaluation reflects communication success.
- [ ] Retry variation works.
- [ ] Results are stored.
- [ ] Progress is not erased after failure.

---

# MILESTONE 14 — Progress and Competency Profile

Objective:

Convert learner activity into meaningful progress.

---

## 14.1 Progress Evidence Model

- [ ] Create Progress Evidence entity.
- [ ] Store evidence source.
- [ ] Store competency.
- [ ] Store result.
- [ ] Store confidence.
- [ ] Store timestamp.
- [ ] Store related activity.
- [ ] Create migration.

---

## 14.2 Competency Calculation

- [ ] Define stages:
  - [ ] Introduced.
  - [ ] Practicing.
  - [ ] Developing.
  - [ ] Confident.
  - [ ] Mastered.
- [ ] Define minimum evidence requirements.
- [ ] Prevent mastery from one activity.
- [ ] Weight recent evidence appropriately.
- [ ] Consider activity difficulty.
- [ ] Consider repeated mistakes.
- [ ] Make calculation deterministic where possible.
- [ ] Test stage transitions.

---

## 14.3 Tracked Competencies

- [ ] Listening.
- [ ] Speaking.
- [ ] Reading.
- [ ] Writing.
- [ ] Grammar.
- [ ] Vocabulary.
- [ ] Daily Communication.
- [ ] Travel Communication.
- [ ] Professional Communication only when relevant content exists.

---

## 14.4 Scenario Mastery

- [ ] Define scenario mastery rules.
- [ ] Use lesson completion.
- [ ] Use quiz evidence.
- [ ] Use mission evidence.
- [ ] Use speaking and writing evidence.
- [ ] Display current status.
- [ ] Prevent premature mastery.

---

## 14.5 Progress Screen

- [ ] Create Progress route.
- [ ] Display estimated HanGo level.
- [ ] Display approximate HSK reference.
- [ ] Display core competencies.
- [ ] Display scenario mastery.
- [ ] Display strengths.
- [ ] Display priorities.
- [ ] Display recommendations.
- [ ] Add empty state for new learners.
- [ ] Add responsive behavior.

---

## 14.6 Recommendations

- [ ] Generate recommendation from learner evidence.
- [ ] Include action.
- [ ] Include reason.
- [ ] Include estimated duration.
- [ ] Link to relevant activity.
- [ ] Avoid arbitrary recommendations.
- [ ] Avoid recommending unavailable content.

---

## Milestone 14 Completion Check

- [ ] Evidence is stored.
- [ ] Competencies update predictably.
- [ ] Mastery requires multiple evidence sources.
- [ ] Scenario status is accurate.
- [ ] Recommendations include reasons.
- [ ] Progress survives sessions.
- [ ] Progress interface is understandable.

---

# MILESTONE 15 — Personalized Dashboard

Objective:

Connect the learner's current state to one clear home experience.

---

## 15.1 Dashboard Data Service

- [ ] Load current lesson.
- [ ] Load current scenario.
- [ ] Load daily target.
- [ ] Load study streak.
- [ ] Load competency summary.
- [ ] Load review queue.
- [ ] Load AI recommendation.
- [ ] Handle new users.
- [ ] Handle users with no active lesson.

---

## 15.2 Continue Learning

- [ ] Display current scenario.
- [ ] Display current lesson.
- [ ] Display lesson objective.
- [ ] Display progress.
- [ ] Display estimated duration.
- [ ] Open correct lesson and step.
- [ ] Handle completed scenario.

---

## 15.3 Daily Goal

- [ ] Define daily progress calculation.
- [ ] Display target.
- [ ] Display completed progress.
- [ ] Display remaining action.
- [ ] Avoid punitive messaging.

---

## 15.4 Study Streak

- [ ] Define study-day criteria.
- [ ] Calculate current streak.
- [ ] Display streak.
- [ ] Avoid excessive loss messaging.
- [ ] Handle timezone correctly.

---

## 15.5 AI Recommendation Card

- [ ] Display recommended action.
- [ ] Display reason.
- [ ] Display estimated duration.
- [ ] Link to activity.
- [ ] Handle no recommendation.

---

## 15.6 Dashboard Summaries

- [ ] Display Learning Journey summary.
- [ ] Display competency summary.
- [ ] Display review recommendations.
- [ ] Display quick-practice actions.
- [ ] Display new-user empty states.
- [ ] Ensure primary action remains visually dominant.

---

## Milestone 15 Completion Check

- [ ] New learner Dashboard works.
- [ ] Returning learner Dashboard works.
- [ ] Continue Learning opens correctly.
- [ ] Recommendations use learner data.
- [ ] Daily goal updates.
- [ ] Dashboard updates after activities.
- [ ] Desktop and mobile layouts work.

---

# MILESTONE 16 — Review System

Objective:

Reinforce content based on learner history.

---

## 16.1 Review Queue

- [ ] Create Review Item entity when required.
- [ ] Generate vocabulary review items.
- [ ] Generate grammar review items.
- [ ] Generate recent-mistake items.
- [ ] Generate dialogue replay items.
- [ ] Add reason for review.
- [ ] Add estimated duration.
- [ ] Avoid duplicate active items.

---

## 16.2 Vocabulary Review

- [ ] Display target word.
- [ ] Support recognition activity.
- [ ] Support production activity.
- [ ] Play audio.
- [ ] Store result.
- [ ] Update mastery evidence.

---

## 16.3 Grammar Review

- [ ] Display communication purpose.
- [ ] Display contextual example.
- [ ] Generate short practice.
- [ ] Store result.
- [ ] Update mastery evidence.

---

## 16.4 Recent Mistake Review

- [ ] Retrieve repeated errors.
- [ ] Show original context.
- [ ] Explain correction.
- [ ] Generate new example.
- [ ] Test learner again.
- [ ] Mark resolved only after evidence.

---

## 16.5 AI-Generated Review

- [ ] Generate short review from approved learner evidence.
- [ ] Validate generated format.
- [ ] Prevent unsupported content.
- [ ] Store generated activity when needed.
- [ ] Handle AI failure with static review fallback.

---

## 16.6 Review Completion

- [ ] Store review result.
- [ ] Update evidence.
- [ ] Adjust mastery appropriately.
- [ ] Reschedule unresolved content.
- [ ] Remove completed item when appropriate.
- [ ] Update Dashboard.

---

## Milestone 16 Completion Check

- [ ] Queue uses learner evidence.
- [ ] Every item explains why it appears.
- [ ] Vocabulary review works.
- [ ] Grammar review works.
- [ ] Mistake review works.
- [ ] Results update progress.
- [ ] AI failure has fallback.

---

# MILESTONE 17 — Complete MVP Content

Objective:

Create the twelve approved lessons and three scenario missions.

---

## 17.1 Restaurant Scenario

### Lesson 1 — Entering and Ordering

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

### Lesson 2 — Ingredients and Preferences

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

### Lesson 3 — Requests and Problems

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

### Lesson 4 — Payment and Conversation

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

### Final Restaurant Mission

- [ ] Mission brief.
- [ ] Complete scenario objectives.
- [ ] Unexpected event variations.
- [ ] Evaluation criteria.
- [ ] Text flow.
- [ ] Voice flow.
- [ ] Result report.
- [ ] Validation.

---

## 17.2 Hotel Scenario

Repeat the complete content structure for:

- [ ] Lesson 1 — Reservation and Check-In.
- [ ] Lesson 2 — Facilities and Services.
- [ ] Lesson 3 — Reporting Problems.
- [ ] Lesson 4 — Extending and Checking Out.
- [ ] Final Hotel Mission.

Each lesson must contain:

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

---

## 17.3 Shopping Scenario

Repeat the complete content structure for:

- [ ] Lesson 1 — Finding a Product.
- [ ] Lesson 2 — Price and Comparison.
- [ ] Lesson 3 — Size, Color, and Testing.
- [ ] Lesson 4 — Payment, Exchange, and Return.
- [ ] Final Shopping Mission.

Each lesson must contain:

- [ ] Situation.
- [ ] Dialogue.
- [ ] Vocabulary.
- [ ] Grammar.
- [ ] Exercises.
- [ ] Speaking.
- [ ] Writing.
- [ ] Quiz.
- [ ] Lesson mission.
- [ ] Reflection.
- [ ] Audio.
- [ ] Validation.

---

## 17.4 Content Quality Review

- [ ] Review Chinese accuracy.
- [ ] Review naturalness.
- [ ] Review Pinyin.
- [ ] Review translations.
- [ ] Review grammar explanations.
- [ ] Review vocabulary appropriateness.
- [ ] Review HSK mapping.
- [ ] Review cultural accuracy.
- [ ] Review answer keys.
- [ ] Review mission outcomes.
- [ ] Remove unresolved placeholders.
- [ ] Record corrections.

---

## Milestone 17 Completion Check

- [ ] Twelve lessons are complete.
- [ ] Three final scenario missions are complete.
- [ ] All required audio exists.
- [ ] All exercises have valid answers.
- [ ] All quizzes work.
- [ ] All missions work.
- [ ] Content has passed linguistic review.
- [ ] Content has passed educational review.

---

# MILESTONE 18 — Settings and Privacy Controls

Objective:

Allow learners to manage preferences and account data.

---

## 18.1 Settings Layout

- [ ] Create Settings route.
- [ ] Create Profile section.
- [ ] Create Learning section.
- [ ] Create AI Teacher section.
- [ ] Create Audio section.
- [ ] Create Notifications section when included.
- [ ] Create Appearance section.
- [ ] Create Privacy section.
- [ ] Create Account section.

---

## 18.2 Profile Settings

- [ ] Edit name.
- [ ] Edit interface language.
- [ ] Display current level.
- [ ] Validate changes.
- [ ] Persist changes.

---

## 18.3 Learning Settings

- [ ] Edit learning goal.
- [ ] Edit skill priorities.
- [ ] Edit daily target.
- [ ] Edit current level when allowed.
- [ ] Explain impact of changes.
- [ ] Persist changes.

---

## 18.4 AI Teacher Settings

- [ ] Edit explanation language.
- [ ] Edit correction style.
- [ ] Edit default mode.
- [ ] Enable or disable voice where applicable.
- [ ] Persist changes.
- [ ] Apply changes to new AI interactions.

---

## 18.5 Audio Settings

- [ ] Edit default playback speed.
- [ ] Enable or disable automatic playback.
- [ ] Enable or disable captions.
- [ ] Persist changes.

---

## 18.6 Privacy Settings

- [ ] Explain voice recording storage.
- [ ] Enable or disable optional recording retention.
- [ ] Explain AI conversation storage.
- [ ] Enable or disable optional AI history.
- [ ] Allow deletion of stored optional recordings.
- [ ] Allow clearing eligible AI history.
- [ ] Provide account-deletion request.

---

## 18.7 Account Security

- [ ] Allow password change.
- [ ] Show connected authentication provider.
- [ ] Protect sensitive actions.
- [ ] Require confirmation for destructive actions.
- [ ] Add account deletion confirmation flow.

---

## Milestone 18 Completion Check

- [ ] Settings persist.
- [ ] Preferences affect relevant features.
- [ ] Privacy options are clear.
- [ ] Optional retention can be disabled.
- [ ] Sensitive actions are protected.
- [ ] Account deletion request works.

---

# MILESTONE 19 — Testing and Stabilization

Objective:

Verify the complete MVP learning loop.

---

## 19.1 Unit Testing

- [ ] Authentication validation.
- [ ] Content validation.
- [ ] Exercise validation.
- [ ] Quiz scoring.
- [ ] Competency calculation.
- [ ] Review queue generation.
- [ ] Recommendation rules.
- [ ] Mission evaluation helpers.
- [ ] Permission helpers.
- [ ] Data normalization.

---

## 19.2 Integration Testing

- [ ] Authentication and database.
- [ ] Onboarding and learner profile.
- [ ] Content retrieval.
- [ ] Lesson progress persistence.
- [ ] Exercise submission.
- [ ] Quiz attempts.
- [ ] AI Teacher context.
- [ ] Audio generation and storage.
- [ ] Speaking recording and transcription.
- [ ] Writing submission and feedback.
- [ ] Mission result storage.
- [ ] Progress evidence updates.

---

## 19.3 End-to-End Testing

- [ ] Registration to onboarding.
- [ ] Onboarding to Dashboard.
- [ ] Dashboard to first lesson.
- [ ] Complete lesson.
- [ ] Use AI Teacher.
- [ ] Complete speaking activity.
- [ ] Complete writing activity.
- [ ] Complete quiz.
- [ ] Complete mission.
- [ ] View updated progress.
- [ ] Resume interrupted lesson.
- [ ] Change settings.
- [ ] Logout and log in again.

---

## 19.4 Responsive Testing

Test:

- [ ] Desktop.
- [ ] Laptop.
- [ ] Tablet.
- [ ] Mobile.

Verify:

- [ ] Navigation.
- [ ] Lesson layout.
- [ ] AI Teacher.
- [ ] Audio controls.
- [ ] Speaking controls.
- [ ] Writing editor.
- [ ] Progress interface.
- [ ] Settings.

---

## 19.5 Accessibility Testing

- [ ] Keyboard navigation.
- [ ] Focus order.
- [ ] Focus visibility.
- [ ] Form labels.
- [ ] Screen reader landmarks.
- [ ] Color contrast.
- [ ] Text scaling.
- [ ] Reduced motion.
- [ ] Audio transcripts.
- [ ] Non-voice alternatives.
- [ ] Non-drag alternatives.

---

## 19.6 Security Testing

- [ ] Authentication protection.
- [ ] Authorization checks.
- [ ] Session handling.
- [ ] Input validation.
- [ ] Rate limiting.
- [ ] Secret exposure review.
- [ ] File access control.
- [ ] Signed URL behavior.
- [ ] Prompt injection testing.
- [ ] Administrative access review.
- [ ] Sensitive logging review.

---

## 19.7 Performance Testing

- [ ] Initial page load.
- [ ] Navigation response.
- [ ] Lesson loading.
- [ ] Autosave latency.
- [ ] AI response latency.
- [ ] Audio playback startup.
- [ ] Speech processing latency.
- [ ] Writing feedback latency.
- [ ] Database query performance.
- [ ] Mobile performance.

---

## 19.8 Error Recovery Testing

- [ ] AI provider unavailable.
- [ ] TTS provider unavailable.
- [ ] STT provider unavailable.
- [ ] Temporary database error.
- [ ] Failed autosave.
- [ ] Failed audio upload.
- [ ] Lost network connection.
- [ ] Expired session.
- [ ] Invalid content.
- [ ] Browser microphone denial.

---

## 19.9 Bug Resolution

- [ ] Classify all discovered defects.
- [ ] Resolve all critical defects.
- [ ] Resolve all high-severity defects.
- [ ] Document accepted lower-severity issues.
- [ ] Retest resolved defects.
- [ ] Run regression testing.
- [ ] Prepare release report.

---

## Milestone 19 Completion Check

- [ ] Complete learning loop passes.
- [ ] No critical defect remains.
- [ ] No high-severity security issue remains.
- [ ] Desktop works.
- [ ] Mobile works.
- [ ] Accessibility blockers are resolved.
- [ ] Temporary failures do not destroy learning progress.
- [ ] Monitoring is ready.

---

# MILESTONE 20 — Closed Beta

Objective:

Validate HanGo with invited learners.

---

## 20.1 Beta Environment

- [ ] Configure beta deployment.
- [ ] Configure beta database.
- [ ] Configure beta storage.
- [ ] Configure beta AI credentials.
- [ ] Configure beta audio credentials.
- [ ] Configure monitoring.
- [ ] Configure error tracking.
- [ ] Configure analytics.
- [ ] Configure cost tracking.

---

## 20.2 Invite Access

- [ ] Create invite mechanism.
- [ ] Limit registration when required.
- [ ] Track invited learners.
- [ ] Handle expired invites.
- [ ] Add beta welcome message.

---

## 20.3 Feedback Collection

- [ ] Add in-product feedback action.
- [ ] Collect usability feedback.
- [ ] Collect content feedback.
- [ ] Collect AI Teacher feedback.
- [ ] Collect speaking feedback.
- [ ] Collect writing feedback.
- [ ] Allow issue reporting.
- [ ] Preserve privacy.

---

## 20.4 Beta Monitoring

- [ ] Monitor registrations.
- [ ] Monitor onboarding completion.
- [ ] Monitor lesson completion.
- [ ] Monitor AI failures.
- [ ] Monitor audio failures.
- [ ] Monitor speech failures.
- [ ] Monitor writing failures.
- [ ] Monitor latency.
- [ ] Monitor cost per learner.
- [ ] Monitor critical errors.

---

## 20.5 Beta Evaluation

- [ ] Analyze activation.
- [ ] Analyze retention.
- [ ] Analyze lesson completion.
- [ ] Analyze AI Teacher usage.
- [ ] Analyze speaking usage.
- [ ] Analyze writing usage.
- [ ] Analyze mission completion.
- [ ] Analyze learner-reported value.
- [ ] Identify major product blockers.
- [ ] Create prioritized beta backlog.

---

## Milestone 20 Completion Check

- [ ] Invited learners can use HanGo independently.
- [ ] Errors are observable.
- [ ] Costs are measurable.
- [ ] Feedback is collected.
- [ ] Major blockers are documented.
- [ ] Beta findings are converted into tasks.

---

# MILESTONE 21 — Public MVP Release

Objective:

Release the validated HanGo MVP publicly.

---

## 21.1 Production Preparation

- [ ] Configure production environment.
- [ ] Configure production database.
- [ ] Configure production storage.
- [ ] Configure production authentication.
- [ ] Configure production AI services.
- [ ] Configure production audio services.
- [ ] Configure backups.
- [ ] Configure monitoring.
- [ ] Configure alerts.
- [ ] Configure analytics.
- [ ] Verify domain and HTTPS.

---

## 21.2 Public Product Pages

- [ ] Create landing page.
- [ ] Explain product value.
- [ ] Explain target learner.
- [ ] Add registration action.
- [ ] Add login action.
- [ ] Add support contact.
- [ ] Add privacy policy.
- [ ] Add terms of service.

---

## 21.3 Operational Readiness

- [ ] Define support process.
- [ ] Define incident response.
- [ ] Define data recovery process.
- [ ] Verify backups.
- [ ] Test restoration.
- [ ] Define release owner.
- [ ] Define rollback process.
- [ ] Confirm cost alerts.

---

## 21.4 Optional Subscription

Only when explicitly approved:

- [ ] Define one simple premium plan.
- [ ] Configure payment provider.
- [ ] Create checkout.
- [ ] Create subscription status.
- [ ] Protect premium features.
- [ ] Handle payment failure.
- [ ] Handle cancellation.
- [ ] Add billing information.
- [ ] Test complete subscription flow.

---

## 21.5 Final Release Validation

- [ ] Run production smoke test.
- [ ] Test registration.
- [ ] Test onboarding.
- [ ] Test lesson completion.
- [ ] Test AI Teacher.
- [ ] Test audio.
- [ ] Test speaking.
- [ ] Test writing.
- [ ] Test mission.
- [ ] Test progress.
- [ ] Test account settings.
- [ ] Test backup status.
- [ ] Confirm monitoring alerts.

---

## Milestone 21 Completion Check

- [ ] Public registration works.
- [ ] Complete learning loop works in production.
- [ ] Legal documents are visible.
- [ ] Support process exists.
- [ ] Backups are active and tested.
- [ ] Monitoring is active.
- [ ] Rollback plan exists.
- [ ] Release has been formally approved.

---

# Continuous Tasks

These tasks apply throughout the project.

---

## Documentation

- [ ] Update documentation after approved architecture changes.
- [ ] Record important decisions.
- [ ] Keep task status accurate.
- [ ] Keep milestones aligned with implementation.
- [ ] Record release changes in `changelog.md`.
- [ ] Avoid undocumented structural changes.

---

## Testing

- [ ] Add tests with every critical feature.
- [ ] Run regression checks before merging.
- [ ] Test desktop and mobile behavior.
- [ ] Test failure states.
- [ ] Preserve test data isolation.

---

## Security

- [ ] Protect secrets.
- [ ] Validate inputs.
- [ ] Enforce backend authorization.
- [ ] Review file access.
- [ ] Review AI context exposure.
- [ ] Review logs for sensitive information.
- [ ] Apply dependency security updates carefully.

---

## Accessibility

- [ ] Preserve keyboard navigation.
- [ ] Preserve focus visibility.
- [ ] Add accessible labels.
- [ ] Maintain contrast.
- [ ] Provide alternatives to voice-only and drag-only interactions.

---

## Performance

- [ ] Avoid unnecessary client-side data loading.
- [ ] Avoid duplicate AI requests.
- [ ] Cache reusable audio.
- [ ] Optimize large assets.
- [ ] Monitor slow database queries.
- [ ] Avoid blocking the learner during background operations.

---

## Scope Control

Before adding a task, verify:

- [ ] It belongs to the approved MVP.
- [ ] It supports the core learning loop.
- [ ] It belongs to the current milestone.
- [ ] It does not duplicate an existing feature.
- [ ] Its dependencies already exist.
- [ ] Its implementation will not create unnecessary complexity.

---

# Claude Code Task Procedure

For every task, Claude Code should:

1. Read the relevant documentation.

2. Inspect the existing implementation.

3. Confirm dependencies.

4. Implement the smallest complete solution.

5. Add or update tests.

6. Run linting.

7. Run type checking.

8. Run relevant tests.

9. Verify responsive behavior when applicable.

10. Verify accessibility when applicable.

11. Update task status.

12. Report:

```text
Task completed

Files created

Files modified

Tests executed

Result

Remaining risks
```

Claude Code must not silently omit failed checks.

---

# Final MVP Completion Criteria

The task plan is complete when:

- All required MVP tasks are marked completed.
- All milestone completion checks pass.
- The twelve approved lessons exist.
- The three scenario missions work.
- The complete learner journey works.
- AI Teacher context works.
- Speaking and writing work.
- Progress is evidence-based.
- Desktop and mobile web work.
- Security and privacy requirements are met.
- Testing and beta validation are complete.
- Production release is operationally ready.

---

# Success Definition

This task document succeeds when Claude Code can build HanGo step by step without inventing scope, skipping dependencies, duplicating systems, or losing alignment with the approved MVP.

---

End of document.