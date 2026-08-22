# HanGo Testing Strategy

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the official testing strategy for HanGo.

Its purpose is to ensure that the platform remains reliable, secure, accessible, and educationally correct throughout development.

Testing is not a final phase.

Testing must occur continuously during implementation.

---

# Testing Philosophy

HanGo must be tested as both:

- A software platform.
- A learning system.

A feature is not complete only because it works technically.

It must also:

- Behave correctly for the learner.
- Preserve learning progress.
- Provide understandable feedback.
- Respect privacy.
- Work across supported devices.
- Fail safely when external services are unavailable.

---

# Testing Objectives

The testing system must verify:

- Functional correctness.
- Data integrity.
- Learning-flow continuity.
- AI reliability.
- Audio reliability.
- Security.
- Accessibility.
- Responsive behavior.
- Performance.
- Error recovery.

---

# Testing Levels

HanGo uses the following testing levels:

```text
Unit Tests

↓

Component Tests

↓

Integration Tests

↓

End-to-End Tests

↓

Manual Product Review

↓

Beta Validation
```

Each level serves a different purpose.

---

# 1. Unit Testing

Unit tests verify isolated logic.

They should be fast, deterministic, and independent from external services.

---

## Unit Test Scope

Unit tests should cover:

- Input validation.
- Authentication helpers.
- Authorization helpers.
- Exercise answer validation.
- Quiz score calculation.
- Competency calculation.
- Progress rules.
- Recommendation rules.
- Review queue logic.
- Mission evaluation helpers.
- Content validation.
- Data normalization.
- Language preference resolution.
- Permission rules.

---

## Unit Test Principles

Unit tests should:

- Test one behavior at a time.
- Avoid unnecessary database access.
- Avoid live AI or audio providers.
- Use mocked external dependencies.
- Cover success and failure cases.
- Include boundary cases.

---

## Example Unit Cases

### Exercise Validation

Verify:

- Correct answer accepted.
- Incorrect answer rejected.
- Accepted alternative accepted.
- Extra spaces handled correctly.
- Invalid input rejected.

### Quiz Scoring

Verify:

- Correct total score.
- Weighted questions.
- Partial completion.
- Multiple attempts.
- Empty submission behavior.

### Competency Calculation

Verify:

- One activity cannot produce mastery.
- Repeated evidence increases stage.
- Repeated failure prevents premature progress.
- More difficult evidence has appropriate weight.
- Stage transitions remain predictable.

---

# 2. Component Testing

Component tests verify isolated interface behavior.

They should test what the learner can see and interact with.

---

## Component Test Scope

Component tests should cover:

- Buttons.
- Inputs.
- Selects.
- Toggles.
- Cards.
- Modals.
- Drawers.
- Tabs.
- Progress bars.
- Audio controls.
- Recording controls.
- Exercise components.
- AI Teacher panel.
- Feedback components.
- Lesson navigation.
- Settings controls.

---

## Component Test Requirements

Verify:

- Rendering.
- Interaction.
- States.
- Keyboard behavior.
- Accessible labels.
- Error display.
- Loading display.
- Disabled behavior.
- Responsive variants where relevant.

---

## Example Component Cases

### Primary Button

Verify:

- Default state.
- Loading state.
- Disabled state.
- Keyboard activation.
- Click callback.
- Accessible name.

### AI Teacher Panel

Verify:

- Opens.
- Closes.
- Expands.
- Shows active context.
- Preserves messages.
- Displays loading.
- Displays recoverable errors.

### Record Button

Verify:

- Ready state.
- Recording state.
- Processing state.
- Completed state.
- Error state.
- Disabled behavior.

---

# 3. Integration Testing

Integration tests verify that multiple systems work together.

These tests may use:

- Test database.
- Mocked external providers.
- Temporary storage.
- Test authentication.

---

## Integration Test Scope

Integration tests should cover:

- Authentication and database.
- Onboarding and learner profile.
- Content retrieval and rendering.
- Lesson progress persistence.
- Exercise submission and storage.
- Quiz submission and scoring.
- AI Teacher context creation.
- AI response persistence.
- Audio generation and storage.
- Recording upload and transcription.
- Writing submission and feedback.
- Mission execution and results.
- Competency evidence updates.
- Dashboard recommendation data.
- Review queue creation.

---

## Integration Test Principles

Integration tests should:

- Use isolated test data.
- Clean up generated records.
- Avoid production credentials.
- Mock expensive providers by default.
- Test real provider integrations separately.
- Verify database side effects.
- Verify authorization.

---

## Example Integration Flows

### Lesson Progress

```text
Open Lesson

↓

Complete Step

↓

Save Progress

↓

Close Session

↓

Reopen Lesson

↓

Resume Correct Step
```

### Writing Feedback

```text
Create Writing Attempt

↓

Submit Response

↓

Send to AI Adapter

↓

Receive Structured Feedback

↓

Store Feedback

↓

Render Corrected Version
```

### Speaking Attempt

```text
Upload Recording

↓

Store Privately

↓

Send to STT Adapter

↓

Receive Transcript

↓

Generate Feedback

↓

Store Attempt
```

---

# 4. End-to-End Testing

End-to-end tests verify complete user journeys.

These tests simulate real learner behavior.

---

# Critical End-to-End Flow

The most important E2E test is the complete HanGo learning loop.

```text
Register

↓

Verify Account

↓

Complete Onboarding

↓

Open Dashboard

↓

Enter Learning Journey

↓

Open Scenario

↓

Start Lesson

↓

Complete Lesson Steps

↓

Ask AI Teacher

↓

Complete Speaking Activity

↓

Complete Writing Activity

↓

Complete Quiz

↓

Complete Mission

↓

View Reflection

↓

View Updated Progress

↓

Return to Dashboard
```

This flow must work before beta release.

---

## Required E2E Scenarios

### Authentication Flow

Verify:

- Register.
- Verify email.
- Login.
- Logout.
- Password recovery.
- Protected route behavior.

### Onboarding Flow

Verify:

- Complete all steps.
- Interrupt onboarding.
- Resume onboarding.
- Save preferences.
- Receive recommendation.

### Lesson Flow

Verify:

- Open lesson.
- Navigate steps.
- Use Pinyin toggle.
- Use translation toggle.
- Complete exercises.
- Leave and resume.
- Complete lesson.

### AI Teacher Flow

Verify:

- Open AI Teacher.
- Ask about active lesson.
- Ask about selected dialogue line.
- Change explanation language.
- Recover from provider error.

### Speaking Flow

Verify:

- Grant microphone permission.
- Record.
- Stop.
- Upload.
- Receive transcript.
- Receive feedback.
- Retry.

### Writing Flow

Verify:

- Start task.
- Write response.
- Autosave.
- Refresh.
- Recover draft.
- Submit.
- Receive correction.
- Rewrite.

### Mission Flow

Verify:

- Read mission brief.
- Start mission.
- Interact with AI.
- Complete objective.
- Receive report.
- Retry with variation.

### Progress Flow

Verify:

- Complete activity.
- Generate evidence.
- Update competency.
- Update scenario progress.
- Show recommendation.

---

# 5. Manual Testing

Automated tests cannot validate every important aspect of HanGo.

Manual testing remains required.

---

## Manual Product Review Areas

Manual review should verify:

- Visual hierarchy.
- Chinese readability.
- Pinyin alignment.
- Translation hierarchy.
- Natural feedback wording.
- AI Teacher usefulness.
- Audio quality.
- Pronunciation feedback clarity.
- Mission realism.
- Learning-flow coherence.
- Mobile usability.
- Empty states.
- Error messages.
- Emotional tone.

---

# Educational Quality Testing

HanGo content must be tested for educational quality.

Technical correctness alone is insufficient.

---

## Educational Review Areas

Review:

- Learning objective clarity.
- Scenario realism.
- Dialogue naturalness.
- Vocabulary relevance.
- Grammar accuracy.
- Exercise alignment.
- Quiz validity.
- Speaking-task appropriateness.
- Writing-task appropriateness.
- Mission outcome alignment.
- Feedback usefulness.
- HSK reference accuracy.

---

## Lesson Quality Checklist

Every lesson should answer:

- Is the communication objective clear?
- Does the dialogue demonstrate the objective?
- Is the vocabulary necessary?
- Is the grammar contextualized?
- Do exercises prepare the learner for production?
- Does speaking practice use the lesson language?
- Does writing practice use the lesson language?
- Does the mission verify the intended outcome?
- Does reflection explain progress?

---

# Chinese Language Validation

Chinese content should be reviewed for:

- Character accuracy.
- Pinyin accuracy.
- Tone marks.
- Natural word order.
- Register.
- Regional appropriateness.
- Translation accuracy.
- Grammar explanation accuracy.
- Example naturalness.
- Cultural context.

Automated validation may assist, but human review is required before public release.

---

# AI Testing

AI-generated behavior requires dedicated testing.

---

## AI Test Categories

### Context Accuracy

Verify the AI receives:

- Correct learner level.
- Correct explanation language.
- Correct scenario.
- Correct lesson.
- Correct step.
- Correct selected content.

### Instruction Adherence

Verify the AI:

- Uses the selected mode.
- Does not expose hidden prompts.
- Does not ignore approved constraints.
- Does not invent unavailable features.
- Does not provide complete writing answers prematurely.
- Remains in role during missions.

### Response Quality

Verify responses are:

- Relevant.
- Accurate.
- Educational.
- Level-appropriate.
- Concise when requested.
- Clear in English or Spanish.
- Natural in Chinese.

### Failure Behavior

Verify:

- Timeouts.
- Empty responses.
- Invalid structured output.
- Provider errors.
- Retry behavior.
- Static fallback behavior.

---

## AI Test Dataset

Maintain a controlled test set containing:

- Vocabulary questions.
- Grammar questions.
- Dialogue questions.
- Incorrect learner answers.
- Ambiguous learner answers.
- Writing samples.
- Mission interactions.
- Prompt-injection attempts.
- Unsupported requests.

The same test set should be reused after major AI changes.

---

# Audio Testing

Audio features require both automated and manual testing.

---

## Audio Functional Tests

Verify:

- Audio generation.
- Audio storage.
- Cached retrieval.
- Full-dialogue playback.
- Sentence playback.
- Vocabulary playback.
- Pause.
- Replay.
- Speed selection.
- Active-line highlighting.
- Failure fallback.

---

## Audio Quality Review

Manually review:

- Pronunciation.
- Tone accuracy.
- Voice consistency.
- Natural pauses.
- Speaker differentiation.
- Volume.
- Clipping.
- Slow-speed naturalness.
- Character emotion when relevant.

---

# Speech-to-Text Testing

STT testing should include different recording conditions.

Test:

- Clear speech.
- Slow speech.
- Fast speech.
- Background noise.
- Short responses.
- Long responses.
- Incorrect pronunciation.
- Mixed Chinese and English.
- Different microphones.
- Mobile recordings.

The system should communicate uncertainty when transcription confidence is low.

---

# Pronunciation Feedback Testing

Pronunciation feedback should be evaluated carefully.

Verify:

- Feedback does not claim perfect certainty.
- Important problems are prioritized.
- Minor variation is not over-penalized.
- Tone feedback is understandable.
- Feedback supports retry.
- Overall communication is considered.
- Scores are stable enough to be useful.

Pronunciation feedback is pedagogical guidance, not a clinical or absolute phonetic diagnosis.

---

# Writing Feedback Testing

Writing evaluation tests should include:

- Correct response.
- Understandable but unnatural response.
- Grammar errors.
- Vocabulary misuse.
- Word-order errors.
- Register mismatch.
- Incomplete response.
- Very short response.
- Off-topic response.

Verify:

- Original text is preserved.
- Corrections are visible.
- Explanations are accurate.
- The AI does not overcorrect stylistic variation.
- Feedback matches learner level.
- Rewrite flow works.

---

# Mission Testing

Mission testing should verify both AI behavior and evaluation.

---

## Mission Behavior Tests

Verify:

- AI remains in role.
- AI does not prematurely end the mission.
- AI introduces only approved complications.
- AI adapts to learner responses.
- AI handles misunderstanding realistically.
- AI supports recovery after communication breakdown.

---

## Mission Evaluation Tests

Verify:

- Objective completion matters most.
- Minor grammar errors do not automatically cause failure.
- Relevant vocabulary is recognized.
- Relevant grammar is considered.
- Communication clarity is considered.
- Voice fluency is considered only when voice is used.
- Feedback explains the result.

---

# Database Testing

Database tests should verify:

- Migrations.
- Relationships.
- Constraints.
- Unique fields.
- Deletion behavior.
- Cascade rules.
- Versioning.
- Progress persistence.
- Attempt history.
- Content publication states.
- Authorization boundaries.

Production data must never be used for automated tests.

---

# Storage Testing

Storage tests should verify:

- Upload validation.
- Private access.
- Signed URLs.
- Expiration.
- File deletion.
- Retention settings.
- Metadata consistency.
- Failed upload recovery.
- Unsupported file rejection.
- Size limit enforcement.

---

# Security Testing

Security testing must occur before beta and public release.

---

## Authentication Security

Test:

- Brute-force protection.
- Generic login errors.
- Session expiration.
- Logout invalidation.
- Reset-token expiration.
- Verification-token reuse.
- OAuth callback validation.
- Cookie security.

---

## Authorization Security

Test:

- User cannot access another user's progress.
- User cannot access another user's recordings.
- User cannot access another user's writing.
- Locked lessons cannot be bypassed improperly.
- Administrative routes require elevated permissions.
- Backend checks exist even when frontend controls are bypassed.

---

## Input Security

Test:

- Script injection.
- HTML injection.
- Invalid file uploads.
- Oversized requests.
- Malformed structured data.
- Unexpected Unicode input.
- SQL injection attempts.
- Path traversal attempts.

---

## AI Security

Test:

- Prompt injection.
- Hidden-prompt extraction attempts.
- Attempts to access another learner's data.
- Attempts to override mission role.
- Attempts to request secrets.
- Unsafe structured output.
- Excessive token usage.

---

# Accessibility Testing

Accessibility testing must include automated and manual review.

---

## Required Accessibility Checks

Verify:

- Keyboard navigation.
- Logical focus order.
- Visible focus.
- Form labels.
- Button names.
- Heading hierarchy.
- Landmark structure.
- Color contrast.
- Text resizing.
- Screen reader announcements.
- Reduced-motion support.
- Audio transcripts.
- Captions.
- Non-voice alternatives.
- Non-drag alternatives.
- Touch target size.

---

# Responsive Testing

Supported viewport categories:

- Desktop.
- Laptop.
- Tablet.
- Mobile.

---

## Responsive Test Areas

Verify:

- Sidebar.
- Bottom navigation.
- Top bar.
- AI Teacher panel.
- Dialogue player.
- Lesson navigation.
- Exercise controls.
- Audio controls.
- Recording controls.
- Writing editor.
- Mission interface.
- Progress screen.
- Settings.

No essential action should depend only on hover.

---

# Browser Testing

The MVP should be tested on current supported versions of:

- Chrome.
- Edge.
- Safari.
- Firefox.

Mobile testing should include:

- Android browser.
- iOS Safari.

Exact supported versions should be finalized before beta.

---

# Performance Testing

Performance tests should measure:

- Initial page load.
- Route navigation.
- Lesson retrieval.
- Dashboard retrieval.
- Autosave latency.
- AI response latency.
- Audio playback startup.
- Audio generation latency.
- STT latency.
- Writing feedback latency.
- Mission response latency.
- Database query performance.

---

## Performance Principles

The learner should not lose access to static lesson content while waiting for:

- AI.
- Audio.
- Transcription.
- Writing evaluation.

Long operations should use clear status indicators.

---

# Error Recovery Testing

HanGo must recover safely from external and internal failures.

Test:

- Network interruption.
- Database timeout.
- AI provider timeout.
- TTS provider failure.
- STT provider failure.
- Upload failure.
- Expired session.
- Failed autosave.
- Invalid content.
- Browser permission denial.
- Partial mission failure.

Verify:

- Learner work is preserved.
- Progress is not corrupted.
- Retry is available.
- Alternative actions are offered.
- Error messages remain understandable.

---

# Test Data Strategy

Testing should use controlled data.

Required datasets:

- New learner.
- Returning learner.
- Partially onboarded learner.
- Learner with active lesson.
- Learner with completed lesson.
- Learner with speaking history.
- Learner with writing history.
- Learner with weak competency evidence.
- Learner with strong competency evidence.
- Administrator.

Test data should be reproducible.

---

# Mocking Strategy

External services should be mocked during normal automated test runs.

Mock:

- AI provider.
- TTS provider.
- STT provider.
- Email provider.
- OAuth provider.
- Storage provider.
- Payment provider when applicable.

Live provider tests should run separately and carefully to control cost.

---

# Test Environments

HanGo should use separate environments.

```text
Local

Testing

Staging / Beta

Production
```

Each environment should have:

- Separate database.
- Separate storage.
- Separate credentials.
- Separate monitoring configuration.

Production credentials must never be used in local or automated tests.

---

# Continuous Integration

The CI pipeline should run:

1. Dependency installation.

2. Formatting check.

3. Linting.

4. Type checking.

5. Unit tests.

6. Component tests.

7. Integration tests.

8. Build verification.

9. Selected end-to-end tests.

A change should not be merged when critical checks fail.

---

# Pull Request Testing Requirements

Every significant change should include:

- Description of behavior.
- Files changed.
- Tests added or updated.
- Commands executed.
- Screenshots for visual changes.
- Mobile evidence when relevant.
- Accessibility considerations.
- Known limitations.
- Risk assessment.

---

# Regression Testing

Regression testing should occur after:

- Authentication changes.
- Database schema changes.
- AI prompt changes.
- Audio provider changes.
- Lesson-flow changes.
- Progress calculation changes.
- Mission evaluation changes.
- Design-system changes.
- Deployment configuration changes.

Critical E2E flows must be rerun before release.

---

# Defect Severity

## Critical

Examples:

- Data loss.
- Unauthorized data access.
- Authentication bypass.
- Complete application failure.
- Payment failure affecting users.
- Corrupted learner progress.

Release must stop.

---

## High

Examples:

- Core lesson cannot be completed.
- AI Teacher unavailable across the platform.
- Speaking or writing consistently fails.
- Mission results are not saved.
- Major mobile failure.

Must be resolved before release.

---

## Medium

Examples:

- Non-critical feature malfunction.
- Incorrect visual state.
- Minor progress inconsistency.
- Recoverable provider failure.

Should be resolved or explicitly accepted.

---

## Low

Examples:

- Minor visual inconsistency.
- Small wording issue.
- Non-blocking animation defect.

May be scheduled after release.

---

# Release Testing Gates

A release may proceed only when:

- Required automated tests pass.
- Critical E2E flow passes.
- No critical defect remains.
- No unaccepted high-severity defect remains.
- Security checks pass.
- Accessibility blockers are resolved.
- Backup and recovery are verified.
- Monitoring is active.
- Rollback is possible.

---

# Beta Testing

Closed beta should validate:

- Onboarding clarity.
- Lesson completion.
- AI usefulness.
- Speaking usability.
- Writing usefulness.
- Mission realism.
- Progress clarity.
- Mobile experience.
- Technical stability.
- Cost per active learner.

Beta feedback should be converted into prioritized tasks.

---

# Test Reporting

Every formal test cycle should report:

```text
Test Scope

Environment

Build Version

Tests Executed

Tests Passed

Tests Failed

Critical Defects

High-Severity Defects

Known Limitations

Release Recommendation
```

---

# Testing Responsibilities

## Claude Code

Responsible for:

- Adding automated tests.
- Running required checks.
- Reporting failures.
- Preserving test coverage.
- Updating test fixtures.

## Product Review

Responsible for:

- Verifying experience.
- Reviewing scope alignment.
- Evaluating usability.
- Reviewing feedback quality.

## Language Review

Responsible for:

- Chinese accuracy.
- Pinyin.
- Translation.
- Grammar.
- Naturalness.
- Cultural appropriateness.

## Beta Learners

Responsible for:

- Real-world usability feedback.
- Learning-value feedback.
- Reporting confusion.
- Reporting unexpected behavior.

---

# MVP Testing Minimum

Before closed beta, HanGo must have:

- Unit tests for critical business logic.
- Integration tests for major backend flows.
- E2E tests for the core learner journey.
- Authentication security testing.
- Lesson autosave testing.
- AI context testing.
- Audio playback testing.
- Speaking recording testing.
- Writing recovery testing.
- Mission evaluation testing.
- Progress calculation testing.
- Responsive testing.
- Accessibility testing.
- Error recovery testing.

---

# Success Definition

The HanGo testing strategy succeeds when new development can be released without breaking the core learning loop, exposing learner data, losing progress, or reducing educational quality.

---

End of document.