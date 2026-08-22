# HanGo Metrics Framework

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the official metrics used to evaluate the HanGo MVP.

Its purpose is to measure whether HanGo creates real product value, learning value, retention, and sustainable business potential.

Metrics should support decisions.

They should not exist only to produce dashboards.

---

# Metrics Philosophy

HanGo should measure more than activity.

A learner opening the application is not enough.

The product must determine whether the learner:

- Starts learning.
- Completes meaningful activities.
- Uses Chinese actively.
- Improves over time.
- Returns.
- Understands their progress.
- Receives enough value to continue or pay.

The metric system should combine:

- Product usage.
- Learning behavior.
- Learning outcomes.
- Retention.
- Technical quality.
- Cost.
- Revenue.

---

# North Star Metric

The recommended North Star Metric for HanGo is:

```text
Weekly Active Learners Completing a Meaningful Learning Action
```

A meaningful learning action includes at least one of the following:

- Completing a lesson.
- Completing a speaking session.
- Completing a writing activity.
- Completing a lesson mission.
- Completing a scenario mission.
- Completing a targeted review session.

Simply opening the application does not count.

---

# Why This North Star Metric

This metric is useful because it combines:

- Active use.
- Learning commitment.
- Product value.
- Repeated engagement.
- Real progress.

It is more meaningful than:

- Total registrations.
- Total page views.
- Total AI messages.
- Time spent alone.
- Number of app opens.

---

# Supporting North Star Metrics

The main metric should be supported by:

- Meaningful actions per active learner.
- Weekly lesson completion.
- Weekly speaking completion.
- Weekly writing completion.
- Weekly mission completion.
- Weekly review completion.
- Percentage of active learners returning the next week.

---

# Metric Categories

HanGo metrics are organized into:

1. Acquisition.
2. Activation.
3. Engagement.
4. Learning Progress.
5. Retention.
6. AI Teacher.
7. Speaking.
8. Writing.
9. Missions.
10. Content.
11. Product Quality.
12. Technical Reliability.
13. Cost.
14. Revenue.
15. Satisfaction.

---

# 1. Acquisition Metrics

Acquisition metrics measure how learners discover HanGo.

---

## Landing Page Visitors

Definition:

Number of unique users who visit the public landing page.

Purpose:

Measure initial reach.

---

## Registration Start Rate

Formula:

```text
Users who start registration
÷
Landing page visitors
×
100
```

Purpose:

Measure whether the positioning and call to action generate interest.

---

## Registration Conversion Rate

Formula:

```text
Completed registrations
÷
Landing page visitors
×
100
```

Purpose:

Measure whether visitors understand enough value to create an account.

---

## Acquisition Source

Track source categories such as:

- Organic social.
- Search.
- Referral.
- Community.
- Teacher or creator.
- Direct.
- Paid campaign.
- Personal invitation.

Purpose:

Identify which channels attract relevant learners.

---

## Cost per Registration

Formula:

```text
Acquisition spending
÷
Completed registrations
```

This metric becomes relevant when paid acquisition begins.

---

## Cost per Activated Learner

Formula:

```text
Acquisition spending
÷
Activated learners
```

This is more useful than cost per registration because many registered users may never begin learning.

---

# 2. Activation Metrics

Activation measures whether a new learner reaches initial product value.

---

# Activation Definition

A learner is considered activated when they:

1. Complete registration.
2. Complete onboarding.
3. Start the recommended first lesson.
4. Complete at least one meaningful learning activity.

Recommended strict activation event:

```text
First lesson completed
```

A secondary early activation event may be:

```text
First meaningful activity completed
```

---

## Onboarding Completion Rate

Formula:

```text
Learners completing onboarding
÷
Learners starting onboarding
×
100
```

Purpose:

Identify friction in onboarding.

---

## Time to Complete Onboarding

Measure:

- Median time.
- Average time.
- Drop-off by step.

Purpose:

Detect unnecessary onboarding complexity.

---

## First Lesson Start Rate

Formula:

```text
Learners starting first lesson
÷
Learners completing onboarding
×
100
```

Purpose:

Measure whether the recommendation and Dashboard direct the learner effectively.

---

## First Lesson Completion Rate

Formula:

```text
Learners completing first lesson
÷
Learners starting first lesson
×
100
```

This is one of the most important MVP metrics.

---

## Time to First Value

Definition:

Time from registration to first meaningful learning action.

Purpose:

Measure how quickly HanGo demonstrates value.

---

## Activation Drop-Off

Track drop-off between:

```text
Landing Page

↓

Registration

↓

Onboarding

↓

Dashboard

↓

First Lesson Start

↓

First Lesson Completion
```

Each stage should be measured independently.

---

# 3. Engagement Metrics

Engagement measures how learners use HanGo after activation.

---

## Daily Active Learners

Definition:

Unique learners completing at least one meaningful action in one day.

Opening the app alone should be tracked separately.

---

## Weekly Active Learners

Definition:

Unique learners completing at least one meaningful action during a seven-day period.

This is a core metric.

---

## Monthly Active Learners

Definition:

Unique learners completing at least one meaningful action during a thirty-day period.

---

## Meaningful Actions per Weekly Active Learner

Formula:

```text
Total meaningful learning actions
÷
Weekly active learners
```

Purpose:

Measure learning depth.

---

## Learning Sessions per Week

Definition:

Average number of study sessions completed by an active learner each week.

A session should require meaningful interaction, not only opening the app.

---

## Average Session Duration

Measure:

- Median session duration.
- Average session duration.
- Duration by activity type.

Longer is not always better.

The objective is productive engagement.

---

## Lessons Started

Track:

- Total lessons started.
- Lessons started per learner.
- Scenario distribution.

---

## Lessons Completed

Track:

- Total lessons completed.
- Completion rate.
- Completion by scenario.
- Completion by lesson step.

---

## Activity Mix

Measure the percentage of meaningful activity represented by:

- Lessons.
- Speaking.
- Writing.
- Missions.
- Review.
- AI Teacher practice.

Purpose:

Understand whether HanGo is being used as a complete learning system.

---

# 4. Learning Progress Metrics

Learning metrics measure whether activity creates improvement.

---

## Competency Stage Progression

Track movement through:

```text
Introduced

Practicing

Developing

Confident

Mastered
```

Measure:

- Competencies improved.
- Time between stages.
- Evidence required.
- Regression after repeated difficulty.

---

## Scenario Mastery Rate

Formula:

```text
Learners reaching Confident or Mastered
÷
Learners beginning the scenario
×
100
```

---

## Mission Improvement

Measure changes between mission attempts.

Possible indicators:

- Objective completion.
- Response completeness.
- Use of target vocabulary.
- Use of target grammar.
- Fluency.
- Number of recovery prompts required.

---

## Repeated Error Reduction

Track whether recurring errors become less frequent.

Examples:

- Word-order errors.
- Incorrect grammar structures.
- Vocabulary misuse.
- Tone-related pronunciation issues.
- Missing required information.

---

## Speaking Duration Growth

Measure whether learners can sustain longer relevant responses over time.

Use:

- Median learner response duration.
- Average uninterrupted response duration.
- Scenario conversation duration.

Longer speech should be interpreted together with relevance and clarity.

---

## Writing Quality Improvement

Track changes in:

- Grammar accuracy.
- Vocabulary appropriateness.
- Naturalness.
- Organization.
- Communication completeness.

Do not rely only on one aggregate score.

---

## Review Resolution Rate

Formula:

```text
Review items resolved
÷
Review items attempted
×
100
```

An item is resolved only after sufficient successful evidence.

---

## Learner Confidence

Collect self-reported confidence before and after:

- First lesson.
- Scenario mission.
- Multiple weeks of use.

Example scale:

```text
1 — Not confident

2 — Slightly confident

3 — Moderately confident

4 — Confident

5 — Very confident
```

Self-reported confidence should support, not replace, behavioral evidence.

---

# 5. Retention Metrics

Retention measures whether learners return and continue learning.

---

## Day-1 Retention

Formula:

```text
New learners active on the day after registration
÷
New learners registered
×
100
```

---

## Day-7 Retention

Formula:

```text
New learners active seven days after registration
÷
New learners registered
×
100
```

Day-7 retention is a major closed-beta metric.

---

## Day-30 Retention

Formula:

```text
New learners active thirty days after registration
÷
New learners registered
×
100
```

Relevant after the beta period is long enough.

---

## Weekly Cohort Retention

Group users by registration week and measure repeated weekly activity.

This helps distinguish:

- Early-product improvement.
- Acquisition-source quality.
- Retention by learner type.
- Retention by scenario.

---

## Learning Streak Continuity

Measure:

- Average streak length.
- Percentage studying multiple days per week.
- Return after streak interruption.

Streaks should not be treated as the primary retention metric.

---

## Scenario Continuation Rate

Formula:

```text
Learners starting the next scenario
÷
Learners completing the previous scenario
×
100
```

This shows whether the product creates sufficient value to continue.

---

## Lesson-to-Lesson Continuation

Measure:

- Lesson 1 to Lesson 2.
- Lesson 2 to Lesson 3.
- Lesson 3 to Lesson 4.
- Lesson 4 to Scenario Mission.

This identifies where learners abandon a scenario.

---

# 6. AI Teacher Metrics

AI metrics should measure usefulness, reliability, and cost.

---

## AI Teacher Adoption

Formula:

```text
Learners using AI Teacher
÷
Active learners
×
100
```

---

## AI Teacher Usage per Active Learner

Measure:

- Messages sent.
- Sessions opened.
- Lesson-context questions.
- Practice requests.
- Review requests.

High usage alone does not prove quality.

---

## Contextual Usage Rate

Formula:

```text
AI interactions linked to active lesson context
÷
All AI interactions
×
100
```

Purpose:

Measure whether learners use the AI Teacher as an integrated product feature rather than a generic chatbot.

---

## AI Response Success Rate

Formula:

```text
Successful AI responses
÷
AI requests
×
100
```

Failures include:

- Timeout.
- Provider error.
- Invalid structured response.
- Empty response.
- Safety or validation failure.
- Application processing error.

---

## AI Retry Rate

Formula:

```text
Repeated requests after failed or unsatisfactory response
÷
AI requests
×
100
```

A high rate may indicate poor quality or technical failure.

---

## AI Helpfulness Rating

Collect optional learner feedback:

- Helpful.
- Partially helpful.
- Not helpful.

Track by:

- Explanation.
- Correction.
- Practice.
- Review.
- Mission.

---

## AI Explanation Resolution

Measure whether the learner:

- Continues the activity after asking.
- Answers correctly after explanation.
- Requests repeated clarification.
- Abandons the step.

This provides a stronger signal than message count.

---

## AI Cost per Active Learner

Formula:

```text
Total AI provider cost
÷
Active learners
```

Track daily, weekly, and monthly.

---

## AI Cost per Meaningful Action

Formula:

```text
Total AI provider cost
÷
Meaningful learning actions
```

---

# 7. Speaking Metrics

Speaking metrics should measure adoption, completion, and improvement.

---

## Speaking Adoption

Formula:

```text
Learners completing a speaking activity
÷
Active learners
×
100
```

---

## Speaking Start-to-Completion Rate

Formula:

```text
Completed speaking activities
÷
Started speaking activities
×
100
```

Low completion may indicate microphone or interface friction.

---

## Microphone Permission Success

Measure:

- Permission granted.
- Permission denied.
- Browser unsupported.
- Technical error.

---

## Recording Processing Success

Formula:

```text
Successfully processed recordings
÷
Uploaded recordings
×
100
```

---

## Transcription Success Rate

Track:

- Successful transcript.
- Low-confidence transcript.
- Failed transcript.
- User-reported inaccurate transcript.

---

## Speaking Retry Rate

Measure how often learners repeat an activity.

Retries can indicate:

- Motivation.
- Useful feedback.
- Difficulty.
- Poor transcription.

Interpretation requires context.

---

## Speaking Feedback Use

Track whether learners:

- Replay model audio.
- Review feedback.
- Retry.
- Continue to recommended practice.

---

## Speaking Improvement

Possible metrics:

- Increased response completeness.
- Reduced repeated pronunciation issues.
- Improved fluency.
- Longer relevant responses.
- Fewer communication breakdowns.
- Better mission performance.

---

## Speaking Cost per Completed Activity

Formula:

```text
TTS + STT + AI speaking costs
÷
Completed speaking activities
```

---

# 8. Writing Metrics

Writing metrics measure production, completion, and improvement.

---

## Writing Adoption

Formula:

```text
Learners completing a writing activity
÷
Active learners
×
100
```

---

## Writing Start-to-Submission Rate

Formula:

```text
Submitted writing attempts
÷
Started writing attempts
×
100
```

---

## Draft Recovery Rate

Track whether saved drafts are successfully restored after:

- Refresh.
- Session interruption.
- Device return.
- Temporary failure.

---

## Writing Feedback Completion

Measure whether the learner:

- Opens feedback.
- Reviews correction.
- Requests explanation.
- Rewrites the response.

---

## Rewrite Rate

Formula:

```text
Writing attempts followed by rewrite
÷
Writing attempts receiving feedback
×
100
```

A healthy rewrite rate may indicate useful feedback.

---

## Writing Improvement

Measure between original and rewrite:

- Grammar improvement.
- Vocabulary improvement.
- Naturalness improvement.
- Completion improvement.
- Reduction of repeated errors.

---

## AI Writing Cost per Completed Activity

Formula:

```text
Writing evaluation cost
÷
Completed writing activities
```

---

# 9. Mission Metrics

Missions validate practical communication.

---

## Mission Start Rate

Formula:

```text
Learners starting mission
÷
Learners eligible for mission
×
100
```

---

## Mission Completion Rate

Formula:

```text
Completed missions
÷
Started missions
×
100
```

---

## Mission Success Rate

Formula:

```text
Missions meeting communication objective
÷
Completed missions
×
100
```

A mission may be completed without full success.

---

## Mission Retry Rate

Measure:

- Percentage retrying.
- Attempts per mission.
- Improvement between attempts.

---

## Unexpected Event Success

Measure whether learners can respond to scenario complications.

Examples:

- Unavailable item.
- Incorrect order.
- Room problem.
- Product defect.

---

## Mission Feedback Use

Track whether learners:

- Open detailed report.
- Review correction.
- Retry.
- Start recommended review.

---

## Scenario Mission Conversion

Formula:

```text
Learners starting final scenario mission
÷
Learners completing all required lessons
×
100
```

---

# 10. Content Metrics

Content metrics identify strong and weak lessons.

---

## Lesson Completion by Lesson

Track individual completion rates.

Low completion may indicate:

- Excessive difficulty.
- Poor UX.
- Weak content.
- Technical problem.
- Excessive duration.

---

## Step Drop-Off

Track exit by lesson step:

- Situation.
- Dialogue.
- Comprehension.
- Vocabulary.
- Grammar.
- Guided Practice.
- Speaking.
- Writing.
- Quiz.
- Mission.
- Reflection.

---

## Exercise Accuracy

Measure:

- First-attempt accuracy.
- Final accuracy.
- Hint usage.
- Retry count.
- Time per exercise.

---

## Quiz Performance

Track:

- Average score.
- Median score.
- Question difficulty.
- Common incorrect answers.
- Attempt count.

---

## Content Error Reports

Track:

- Chinese error.
- Pinyin error.
- Translation error.
- Grammar explanation error.
- Invalid answer.
- Audio mismatch.
- Cultural problem.

---

## Content Help Requests

Measure AI Teacher questions by lesson and step.

A high number may indicate:

- Difficult content.
- Poor explanation.
- Strong engagement.
- Ambiguous instructions.

Review qualitatively.

---

# 11. Product Quality Metrics

Product-quality metrics measure usability and clarity.

---

## Task Completion Rate

Measure completion for:

- Registration.
- Onboarding.
- First lesson.
- Speaking activity.
- Writing activity.
- Mission.
- Settings change.

---

## Error Encounter Rate

Formula:

```text
Learners encountering an error
÷
Active learners
×
100
```

---

## Recovery Rate

Formula:

```text
Users successfully continuing after error
÷
Users encountering recoverable error
×
100
```

---

## Support Requests per Active Learner

Formula:

```text
Support requests
÷
Active learners
```

Track by category.

---

## Confusion Reports

Collect feedback such as:

- Did not understand next step.
- Did not understand correction.
- Could not find feature.
- Did not understand progress.
- Did not understand mission.

---

## Accessibility Defects

Track:

- Keyboard blockers.
- Screen-reader blockers.
- Contrast problems.
- Missing labels.
- Voice-only barriers.
- Mobile touch problems.

---

# 12. Technical Reliability Metrics

Technical reliability must be monitored continuously.

---

## Application Availability

Measure uptime for production services.

---

## Server Error Rate

Formula:

```text
Failed server requests
÷
Total server requests
×
100
```

---

## Client Error Rate

Track critical frontend errors affecting user flows.

---

## Database Error Rate

Measure:

- Failed queries.
- Connection failures.
- Transaction failures.
- Slow queries.

---

## Autosave Success Rate

Formula:

```text
Successful autosaves
÷
Autosave attempts
×
100
```

This is critical because learner work must not be lost.

---

## AI Latency

Track:

- Median.
- 95th percentile.
- 99th percentile.

Measure separately for:

- Explanation.
- Writing feedback.
- Mission response.
- Review generation.

---

## Audio Playback Start Time

Measure delay between learner action and playback.

---

## TTS Generation Success

Formula:

```text
Successful audio generations
÷
TTS generation requests
×
100
```

---

## STT Processing Success

Formula:

```text
Successful transcriptions
÷
STT processing requests
×
100
```

---

## Upload Success Rate

Track recordings and other user uploads.

---

## Page Performance

Measure:

- Initial load.
- Route transition.
- Lesson load.
- Dashboard load.
- Mobile performance.

---

# 13. Cost Metrics

HanGo must understand variable cost before scaling.

---

## Total Infrastructure Cost

Includes:

- Hosting.
- Database.
- Storage.
- Data transfer.
- Monitoring.
- Email.
- Analytics.

---

## Total AI Cost

Includes:

- AI Teacher.
- Writing evaluation.
- Mission interaction.
- Review generation.
- Progress summaries.

---

## Total Audio Cost

Includes:

- TTS.
- STT.
- Audio storage.
- Audio transfer.

---

## Cost per Registered Learner

Formula:

```text
Total operating cost
÷
Registered learners
```

This metric is less useful than active-learner cost but still informative.

---

## Cost per Active Learner

Formula:

```text
Total operating cost
÷
Active learners
```

---

## Cost per Activated Learner

Formula:

```text
Total operating cost associated with new users
÷
Activated learners
```

---

## Cost per Completed Lesson

Formula:

```text
Relevant platform costs
÷
Completed lessons
```

---

## Cost per Scenario Completed

Formula:

```text
Relevant platform costs
÷
Completed scenarios
```

---

## Gross Margin

When subscriptions are enabled:

```text
Revenue
-
Variable service costs
=
Gross profit
```

```text
Gross profit
÷
Revenue
×
100
=
Gross margin
```

---

# 14. Revenue Metrics

Revenue metrics become relevant when monetization is enabled.

---

## Trial Start Rate

Formula:

```text
Learners starting trial
÷
Eligible learners
×
100
```

---

## Trial-to-Paid Conversion

Formula:

```text
Paid subscribers
÷
Trial users
×
100
```

---

## Free-to-Paid Conversion

Formula:

```text
Paid subscribers
÷
Active free learners
×
100
```

---

## Monthly Recurring Revenue

Definition:

Recurring subscription revenue in one month.

---

## Average Revenue per Paying User

Formula:

```text
Monthly recurring revenue
÷
Paying users
```

---

## Average Revenue per Active Learner

Formula:

```text
Monthly revenue
÷
Monthly active learners
```

---

## Subscriber Churn

Formula:

```text
Subscribers cancelling during period
÷
Subscribers at start of period
×
100
```

---

## Revenue Churn

Measure revenue lost from cancellations and downgrades.

---

## Lifetime Value

Estimate only after sufficient retention and revenue data exist.

Avoid relying on speculative early values.

---

## Payback Period

Formula:

```text
Customer acquisition cost
÷
Monthly gross profit per customer
```

---

# 15. Satisfaction Metrics

Satisfaction metrics provide qualitative context.

---

## First-Lesson Usefulness

Ask:

```text
How useful was this lesson?
```

Suggested scale:

- Not useful.
- Slightly useful.
- Useful.
- Very useful.

---

## AI Teacher Helpfulness

Ask after selected interactions:

- Helpful.
- Partially helpful.
- Not helpful.

Do not ask after every response.

---

## Mission Realism

Ask:

```text
Did this mission feel like a realistic Chinese interaction?
```

---

## Progress Clarity

Ask:

```text
Do you understand what you can do and what to practice next?
```

---

## Product Satisfaction

Use a simple recurring measure during beta.

Example:

```text
How disappointed would you be if you could no longer use HanGo?
```

Answers:

- Very disappointed.
- Somewhat disappointed.
- Not disappointed.

This can help evaluate product-market fit after enough active usage.

---

## Recommendation Intent

Ask:

```text
How likely are you to recommend HanGo to another Chinese learner?
```

This may be used cautiously.

It should not replace behavioral retention.

---

# MVP Metric Priorities

The MVP should not attempt to optimize every metric immediately.

Primary MVP metrics:

1. Onboarding completion.
2. First lesson start.
3. First lesson completion.
4. Weekly meaningful active learners.
5. Day-7 retention.
6. Lessons completed per active learner.
7. Speaking adoption.
8. Writing adoption.
9. Mission completion.
10. AI Teacher helpfulness.
11. Progress clarity.
12. Cost per active learner.

---

# Stage-Specific Metrics

# Internal Prototype

Measure:

- Core-flow completion.
- Technical errors.
- Autosave success.
- AI context accuracy.
- Lesson retrieval.
- Progress persistence.

No business conclusions should be drawn from internal usage.

---

# Alpha

Measure:

- Onboarding completion.
- First lesson completion.
- Restaurant scenario completion.
- Speaking adoption.
- Writing adoption.
- Mission completion.
- Qualitative confusion.
- AI usefulness.
- Critical defect count.

---

# Closed Beta

Measure:

- Activation.
- Day-1 retention.
- Day-7 retention.
- Weekly active learners.
- Meaningful actions per learner.
- Scenario continuation.
- AI usage.
- Speaking and writing repetition.
- Mission improvement.
- Cost per active learner.
- Willingness to continue or pay.

---

# Public MVP

Measure:

- Landing-page conversion.
- Activation.
- Retention.
- Acquisition source.
- Paid conversion.
- Subscriber churn.
- Gross margin.
- Support load.
- Cost sustainability.

---

# Recommended Initial Targets

Initial targets should be treated as hypotheses, not guarantees.

For closed beta, reasonable validation goals may include:

- At least 60% onboarding completion.
- At least 50% of onboarded learners starting the first lesson.
- At least 40% first-lesson completion among starters.
- At least 25% Day-7 retention among activated learners.
- At least 30% of active learners completing a speaking activity.
- At least 20% of active learners completing a writing activity.
- At least 40% of eligible learners starting a mission.
- Majority-positive AI Teacher helpfulness.
- Majority of active learners understanding the next recommended action.

These values should be adjusted after observing real behavior.

They are not official promises or universal benchmarks.

---

# Metric Segmentation

Metrics should be segmented when relevant by:

- Interface language.
- Explanation language.
- Self-reported HSK level.
- Main learning goal.
- Skill priority.
- Device type.
- Acquisition source.
- Scenario.
- Lesson.
- New versus returning learner.
- Free versus paid plan.
- Beta cohort.

Segmentation should protect privacy.

Avoid creating groups so small that individual users become identifiable.

---

# Event Naming

Analytics events should use consistent names.

Recommended format:

```text
object_action
```

Examples:

```text
registration_started

registration_completed

onboarding_completed

lesson_started

lesson_completed

exercise_submitted

quiz_completed

ai_teacher_opened

ai_message_sent

speaking_started

speaking_completed

writing_started

writing_submitted

mission_started

mission_completed

review_completed
```

---

# Event Properties

Events may include non-sensitive properties such as:

- Scenario ID.
- Lesson ID.
- Activity type.
- Device category.
- Interface language.
- Explanation language.
- Completion status.
- Duration.
- Error category.
- Attempt number.

Avoid sending:

- Full learner messages.
- Full writing responses.
- Voice recordings.
- Authentication tokens.
- Sensitive personal data.
- Hidden AI prompts.

---

# Metric Data Quality

Metrics are only useful when data is reliable.

Required controls:

- Event definitions.
- Consistent identifiers.
- Environment separation.
- Duplicate-event prevention.
- Test-account filtering.
- Timestamp consistency.
- Timezone handling.
- Data-validation checks.
- Documentation.

---

# Dashboard Requirements

The internal metric dashboard should prioritize:

## Product Overview

- Weekly active learners.
- Meaningful actions.
- Activation.
- Day-7 retention.

## Learning

- Lessons completed.
- Speaking completed.
- Writing completed.
- Missions completed.
- Competency progression.

## Quality

- Errors.
- Autosave success.
- AI success.
- TTS success.
- STT success.

## Cost

- AI cost.
- Audio cost.
- Cost per active learner.

## Business

- Paid users.
- Conversion.
- Revenue.
- Churn.

The dashboard should not display vanity metrics as the primary indicators.

---

# Review Cadence

## Daily During Beta

Review:

- Critical errors.
- Provider failures.
- Cost spikes.
- Registration problems.
- Progress-loss incidents.

## Weekly

Review:

- Activation.
- Weekly active learners.
- Day-7 retention.
- Lesson completion.
- Speaking and writing adoption.
- Mission completion.
- AI usefulness.
- Cost per active learner.

## Monthly

Review:

- Cohort retention.
- Learning progression.
- Scenario continuation.
- Content performance.
- Revenue.
- Churn.
- Strategic priorities.

---

# Decision Rules

Metrics should trigger action.

Examples:

## Low Onboarding Completion

Investigate:

- Number of steps.
- Confusing questions.
- Technical errors.
- Mobile experience.

## Low First-Lesson Start

Investigate:

- Recommendation clarity.
- Dashboard hierarchy.
- Perceived effort.
- Incorrect starting level.

## Low Lesson Completion

Investigate:

- Step difficulty.
- Lesson length.
- Technical failures.
- Weak content.
- Speaking or writing friction.

## Low Day-7 Retention

Investigate:

- First-session value.
- Next-step clarity.
- Content relevance.
- Reminder strategy.
- Product differentiation.

## High AI Usage but Low Completion

Investigate:

- AI may distract from lesson.
- Explanations may be insufficient.
- Lesson may be confusing.
- Learner may use HanGo as a generic chatbot.

## High Speaking Start but Low Completion

Investigate:

- Microphone permission.
- Recording UX.
- STT delays.
- Feedback quality.
- Privacy concerns.

## High Cost per Learner

Investigate:

- Excessive AI context.
- Long responses.
- Duplicate requests.
- Missing audio cache.
- Unlimited usage.
- Inefficient provider choice.

---

# Privacy and Metrics

Analytics must follow data-minimization principles.

HanGo should:

- Collect only necessary events.
- Avoid storing sensitive learning content in analytics.
- Separate analytics from core learning data.
- Restrict analytics access.
- Define retention periods.
- Respect applicable consent requirements.
- Explain analytics use in privacy documentation.

---

# Metric Limitations

Metrics do not prove learning by themselves.

Examples:

- Longer sessions may indicate engagement or confusion.
- More AI messages may indicate value or poor lesson clarity.
- More retries may indicate motivation or unreliable feedback.
- High quiz scores may reflect easy questions.
- High confidence may not equal real competence.

Metrics must be interpreted using:

- Behavioral data.
- Learning evidence.
- Qualitative feedback.
- Content review.
- User interviews.

---

# Metrics Acceptance Criteria

The metric system is acceptable when:

- Core events are clearly defined.
- Activation can be measured.
- Retention can be measured.
- Meaningful learning actions can be distinguished from passive activity.
- Speaking, writing, and mission usage are measurable.
- Learning progress can be analyzed.
- AI and audio reliability are observable.
- Cost per active learner can be calculated.
- Test and production data remain separate.
- Sensitive learner content is not exposed through analytics.
- Metric definitions are used consistently.

---

# Success Definition

The HanGo metrics framework succeeds when the project can determine whether learners receive real value, continue learning, improve their Chinese, and can be served at a sustainable cost.

The purpose of metrics is not to prove that HanGo is successful.

The purpose is to reveal what is actually happening.

---

End of document.