# HanGo Launch Plan

Version: 1.1

Status: Official (audit note added 2026-09-05 - see below)

Last Updated: 2026-09-05

> **2026-09-05 audit note:** "Initial Launch Audience" recommends HSK
> 3-early 5 learners and explicitly says the first users should *not*
> primarily be complete beginners; "Risk 6 - Users Expect Beginner
> Content" mitigation says to avoid beginner-oriented marketing. The
> shipped homepage already markets to complete beginners - see
> `docs/00_company/06_target_users.md`'s matching audit note for the real,
> live evidence. This isn't unexecuted strategy; the product has already
> gone the other way. Flagging for a product decision, not silently
> resolving it. The staged internal → alpha → beta → public rollout
> mechanics themselves are left untouched - this audit found no evidence
> either way on whether those stages happened on schedule.

---

# Purpose

This document defines the launch strategy for the HanGo MVP.

Its purpose is to organize how HanGo moves from internal validation to closed beta and then to public release.

The launch should validate:

- Product usability.
- Learning value.
- Technical stability.
- User retention.
- AI usefulness.
- Operational cost.
- Market demand.

The launch should not prioritize rapid scale before the core learning experience is proven.

---

# Launch Philosophy

HanGo should launch gradually.

The objective is not to attract the largest possible audience immediately.

The objective is to learn from the right users while controlling:

- Product risk.
- Infrastructure cost.
- Content quality.
- AI behavior.
- Support workload.
- Privacy risk.

The launch sequence is:

```text
Internal Prototype

↓

Alpha

↓

Closed Beta

↓

Public MVP
```

Each stage must produce evidence before the next stage begins.

---

# Launch Objectives

The launch process should answer these questions:

1. Do intermediate Chinese learners understand the HanGo value proposition?

2. Can users complete the main learning journey without assistance?

3. Does the AI Teacher provide useful contextual support?

4. Do learners use speaking and writing features?

5. Do missions feel practical and realistic?

6. Can learners understand their progress?

7. Do users return after the first session?

8. Are AI, audio, and infrastructure costs sustainable?

9. Which features create the most learning value?

10. Are users willing to continue using or paying for HanGo?

---

# Initial Launch Audience

The initial audience should be narrow.

Recommended profile:

- Chinese learners between HSK 3 and early HSK 5.
- Spanish-speaking or English-speaking.
- Already using textbooks, courses, flashcards, or general AI tools.
- Interested in improving practical communication.
- Comfortable testing an early product.
- Willing to provide detailed feedback.

The first users should not primarily be:

- Complete beginners.
- Children.
- Schools.
- Enterprise clients.
- Users expecting a complete HSK curriculum.
- Users requiring native mobile applications.

---

# Launch Stages

# Stage 1 — Internal Prototype

## Objective

Validate that the core technical learning loop works.

## Audience

- Founder.
- Development team.
- Trusted internal testers.
- One or two Chinese language reviewers.

## Required Product Scope

- Authentication.
- Basic onboarding.
- Dashboard placeholder.
- Learning Journey.
- One complete Restaurant lesson.
- Basic exercises.
- Text-based AI Teacher.
- Lesson progress.
- Basic reflection.

Speaking and writing may remain limited during the earliest prototype.

## Main Questions

- Can the lesson be completed?
- Is progress preserved?
- Does the AI Teacher understand lesson context?
- Is the interface understandable?
- Does the content structure work technically?
- Are there architecture problems that should be fixed early?

## Exit Criteria

The project may advance when:

- The complete prototype lesson works.
- No critical data-loss issue exists.
- The AI Teacher receives correct context.
- Lesson progress survives refresh and login.
- Core desktop and mobile layouts work.
- Major architecture risks are resolved.

---

# Stage 2 — Alpha

## Objective

Validate the complete Restaurant scenario and the main product experience.

## Audience

Approximately:

```text
5 to 15 testers
```

Possible testers:

- Intermediate Chinese learners.
- Chinese teachers.
- Language-learning enthusiasts.
- Trusted friends who match the learner profile.

## Required Product Scope

- Complete Restaurant scenario.
- Four lessons.
- Speaking MVP.
- Writing MVP.
- Lesson missions.
- Final Restaurant mission.
- Progress profile.
- Dashboard recommendations.
- Basic review system.

## Main Questions

- Can users complete onboarding independently?
- Do learners understand the Learning Journey?
- Is the Restaurant scenario useful?
- Is the AI Teacher better than a generic chatbot in context?
- Do learners use speaking and writing?
- Are missions realistic?
- Is feedback understandable?
- Is progress meaningful?

## Alpha Duration

Recommended duration:

```text
2 to 4 weeks
```

The stage should last long enough to observe repeated use, not only first impressions.

## Exit Criteria

The project may advance when:

- Most testers can complete the first lesson without assistance.
- Critical product blockers are resolved.
- Speaking and writing preserve learner work.
- Mission evaluation is understandable.
- AI and audio failures are recoverable.
- Main feedback themes are documented.
- Infrastructure costs are measurable.

---

# Stage 3 — Closed Beta

## Objective

Validate the complete MVP with a broader but controlled audience.

## Audience

Approximately:

```text
30 to 100 invited learners
```

The exact number depends on:

- Infrastructure cost.
- Support capacity.
- Product stability.
- AI usage limits.
- Content readiness.

## Required Product Scope

- Restaurant scenario.
- Hotel scenario.
- Shopping scenario.
- Twelve complete lessons.
- Three scenario missions.
- AI Teacher.
- Speaking Lab.
- Writing Lab.
- Review.
- Progress.
- Settings.
- Privacy controls.
- Monitoring and analytics.

## Access Model

Recommended:

- Invite-only.
- Approved email list.
- Beta access code.
- Limited registration window.

The closed beta should not be publicly open without control.

## Beta Duration

Recommended duration:

```text
4 to 8 weeks
```

This period should capture:

- Initial activation.
- Repeated usage.
- Seven-day retention.
- Content progression.
- Operational cost.
- Support patterns.

## Main Questions

- Do learners complete more than one lesson?
- Do they return after the first week?
- Which scenarios create the most interest?
- Does AI Teacher usage correlate with lesson completion?
- Are speaking and writing used repeatedly?
- Do users understand competency progress?
- Are users willing to continue after finishing Restaurant?
- What causes abandonment?
- What is the cost per active learner?

## Exit Criteria

The project may advance when:

- The complete learning loop works reliably.
- No unresolved critical defect exists.
- Seven-day retention is measurable.
- Product costs are understood.
- Users report practical learning value.
- Core privacy and security requirements are satisfied.
- Support volume is manageable.
- Public positioning has been validated.

---

# Stage 4 — Public MVP

## Objective

Launch HanGo publicly to the initial target market.

## Audience

Primary:

- Intermediate Chinese learners.
- Spanish-speaking learners.
- English-speaking learners.

## Required Product Scope

- Stable web application.
- Complete MVP scenarios.
- Public landing page.
- Registration.
- Legal documentation.
- Support process.
- Monitoring.
- Analytics.
- Backup and recovery.
- Optional simple premium plan.

## Launch Approach

The public launch should remain controlled.

Recommended:

- Limited initial promotion.
- Waitlist or gradual access if costs are uncertain.
- Weekly monitoring of usage and cost.
- Fast correction of onboarding and lesson blockers.
- Continued direct contact with early users.

The first public launch should not depend on large advertising campaigns.

---

# Pre-Launch Preparation

Before inviting external users, complete the following.

## Product

- Core learning loop works.
- One complete scenario is available for alpha.
- Three complete scenarios are available for closed beta.
- AI Teacher context is correct.
- Speaking and writing work.
- Progress is saved.
- Error recovery works.
- Mobile experience is usable.

## Content

- Chinese has been reviewed.
- Pinyin has been reviewed.
- Translations have been reviewed.
- Grammar explanations have been reviewed.
- Exercises have valid answers.
- Quizzes calculate correctly.
- Missions evaluate the intended objective.
- Audio is connected correctly.

## Engineering

- Production-like environment exists.
- Monitoring works.
- Error tracking works.
- Backups work.
- Provider credentials are protected.
- Rate limits exist.
- Cost monitoring exists.
- Rollback plan exists.

## Legal and Privacy

- Privacy policy exists before public release.
- Terms of service exist before public release.
- Voice recording handling is explained.
- AI processing is explained.
- Account deletion process exists.
- Support contact exists.

## Marketing

- Positioning is defined.
- Landing-page message is clear.
- Beta invitation is prepared.
- Feedback system exists.
- Analytics events are configured.
- Initial user list is prepared.

---

# Early User Acquisition

The first users should come from low-cost, high-feedback channels.

Recommended channels:

- Personal network.
- Chinese study communities.
- Language-learning groups.
- University language communities.
- Mandarin learning Discord groups.
- Reddit communities where permitted.
- Facebook groups.
- WhatsApp or Telegram study groups.
- Chinese teachers and tutors.
- Existing social media audience.
- Short educational content on TikTok or Instagram.

The goal is not reach alone.

The goal is recruiting users who match the target profile.

---

# Founder-Led Recruitment

During alpha and closed beta, recruitment should be personal.

Example message:

```text
I am testing HanGo, a structured Chinese learning platform for intermediate learners.

It combines real-life lessons, speaking, writing, missions, and an AI Teacher that understands the lesson you are studying.

I am looking for learners around HSK 3–5 who can test the product and share honest feedback.
```

The message should clearly communicate:

- Product stage.
- Target learner.
- Expected participation.
- Feedback requirement.
- Any usage limitation.

---

# Beta Recruitment Criteria

A good beta participant should:

- Be actively studying Chinese.
- Be approximately HSK 3–5.
- Have enough time to complete at least two lessons.
- Be willing to use speaking or writing.
- Be willing to provide feedback.
- Understand that the product is still under development.

Avoid filling the beta only with friends who will provide positive feedback without actually using the product.

---

# Beta Onboarding

Beta users should receive:

- Welcome message.
- Product purpose.
- Current limitations.
- Recommended first action.
- Feedback instructions.
- Support contact.
- Privacy explanation.
- Expected testing period.

The onboarding should not require a long manual explanation.

The product itself should remain understandable.

---

# Feedback Collection

Feedback should be collected in multiple ways.

## In-Product Feedback

Allow users to report:

- Confusing lesson.
- Incorrect Chinese.
- AI Teacher problem.
- Audio problem.
- Speaking problem.
- Writing problem.
- Mission problem.
- Technical bug.
- General suggestion.

## Short Surveys

Useful moments:

- After onboarding.
- After first lesson.
- After first scenario mission.
- After seven days.
- At the end of beta.

## User Interviews

Recommended for:

- Highly active users.
- Users who abandon early.
- Users who use speaking heavily.
- Users who never use speaking.
- Users willing to pay.
- Users who compare HanGo with other tools.

---

# Core Feedback Questions

## After First Lesson

- Was it clear what to do?
- Did the lesson feel useful?
- Did the AI Teacher understand the context?
- Which section was confusing?
- Did you feel you practiced real Chinese?
- Would you complete another lesson?

## After Scenario Mission

- Did the mission feel realistic?
- Did the AI remain in role?
- Was the feedback useful?
- Did the mission reflect what you learned?
- Would you repeat the mission?

## After One Week

- What made you return?
- What prevented you from studying?
- Which feature was most useful?
- Which feature did you ignore?
- Do you understand your progress?
- Would you recommend HanGo?
- Would you pay for continued access?

---

# Launch Communication

HanGo launch communication should focus on the learner problem.

Recommended message structure:

```text
You already know vocabulary and grammar.

But using Chinese in real situations is still difficult.

HanGo gives you a structured path to practice speaking, writing, and real-life communication with contextual AI support.
```

Avoid launching with a long feature list.

Use one practical example, such as the Restaurant scenario.

---

# Landing Page MVP

The first landing page should include:

## Hero

- Headline.
- Supporting explanation.
- Primary action.
- Product interface preview.

## Learner Problem

Explain the gap between knowing Chinese and using Chinese.

## How HanGo Works

Use the learning loop:

```text
Scenario

↓

Lesson

↓

AI Teacher

↓

Speaking and Writing

↓

Mission

↓

Progress
```

## Core Features

Limit to:

- Structured Learning Journey.
- Context-aware AI Teacher.
- Speaking and Writing.
- Real-life Missions.
- Competency Progress.

## Scenario Example

Show Restaurant as the first complete learning experience.

## Target Learner

Clarify that HanGo initially serves intermediate learners.

## Call to Action

For beta:

```text
Join the Closed Beta
```

For public MVP:

```text
Start Learning
```

---

# Content Marketing Before Launch

Before public release, HanGo may publish useful Chinese learning content.

Recommended formats:

- Intermediate grammar explanations.
- Real-life dialogue breakdowns.
- Common Chinese mistakes.
- HSK vocabulary in practical situations.
- Speaking tips.
- Differences between similar Chinese words.
- Short scenario-based lessons.
- AI-assisted study methods.

Content should attract the same learner profile as the product.

Avoid attracting mostly complete beginners if the MVP cannot serve them well.

---

# Initial Social Content Pillars

## Practical Chinese

Examples:

- How to ask about ingredients.
- How to report a hotel problem.
- How to request another size.

## Intermediate Mistakes

Examples:

- Grammar structures often confused.
- Word-order problems.
- Words learners understand but misuse.

## Real Communication

Examples:

- Textbook Chinese versus natural Chinese.
- How native speakers respond.
- Short role-play demonstrations.

## Learning Strategy

Examples:

- Moving from recognition to production.
- Practicing speaking alone.
- Using AI without losing structure.

## Product Development

Examples:

- Building HanGo.
- Testing a lesson.
- Improving AI feedback.
- Beta invitations.

---

# Launch Channels

# Organic Channels

Recommended for initial launch:

- TikTok.
- Instagram Reels.
- YouTube Shorts.
- Reddit.
- Facebook groups.
- Discord.
- Mandarin study communities.
- Email list.
- Personal network.

## Paid Channels

Paid acquisition should remain limited before product validation.

Possible later channels:

- Meta Ads.
- TikTok Ads.
- Google Search.
- YouTube.

Do not spend significantly on paid advertising before measuring:

- Activation.
- Retention.
- Conversion.
- Cost per active learner.
- AI cost per learner.

---

# Partnership Opportunities

Potential early partners:

- Independent Chinese teachers.
- Mandarin tutors.
- Language academies.
- University Chinese clubs.
- Study communities.
- Chinese-learning content creators.

Initial partnerships should focus on:

- Beta recruitment.
- Product feedback.
- Content review.
- Credibility.
- Educational collaboration.

Enterprise partnerships are outside the initial MVP launch.

---

# Referral Strategy

A simple referral system may be tested after closed beta.

Possible incentive:

- Additional AI usage.
- Additional speaking sessions.
- Temporary premium access.
- Early access to a new scenario.

A complex referral program is not required for the initial launch.

---

# Pricing Validation

Pricing should not be finalized before understanding usage cost.

During beta, measure:

- AI cost per learner.
- TTS cost per learner.
- STT cost per learner.
- Storage cost.
- Support cost.
- Average lesson usage.
- Speaking frequency.
- Writing frequency.

---

# Pricing Research

Possible methods:

- Willingness-to-pay survey.
- Price sensitivity questions.
- Paid beta.
- Preorder or founding-member plan.
- Landing-page pricing test.
- Trial conversion test.

Avoid asking only:

```text
Would you pay?
```

Prefer asking:

- Which features would justify payment?
- What tools do you currently pay for?
- At what price would HanGo feel expensive?
- At what price would it feel suspiciously cheap?
- What would make you cancel?

---

# Initial Monetization Direction

For public MVP, keep monetization simple.

Possible structure:

## Free

- Limited lesson access.
- Limited AI Teacher usage.
- Limited speaking and writing.
- Basic progress.

## Premium

- Complete scenario access.
- Higher AI Teacher usage.
- Speaking and writing feedback.
- Missions.
- Personalized review.
- Detailed progress.

The exact limits should be based on measured cost and user behavior.

---

# Launch Analytics

Before external launch, configure events for:

- Landing page viewed.
- Registration started.
- Registration completed.
- Onboarding completed.
- First lesson started.
- First lesson completed.
- AI Teacher opened.
- AI Teacher message sent.
- Speaking activity started.
- Speaking activity completed.
- Writing activity started.
- Writing activity completed.
- Mission started.
- Mission completed.
- Scenario completed.
- User returned.
- Subscription started when applicable.

Analytics must respect privacy and data minimization.

---

# Launch Metrics by Stage

## Internal Prototype

Focus on:

- Functional completion.
- Defect count.
- Context accuracy.
- Progress persistence.

## Alpha

Focus on:

- First lesson completion.
- Scenario completion.
- Speaking and writing adoption.
- Feedback quality.
- Product confusion.

## Closed Beta

Focus on:

- Activation.
- Day-1 retention.
- Day-7 retention.
- Lessons per learner.
- Mission completion.
- AI usage.
- Cost per active learner.

## Public MVP

Focus on:

- Registration conversion.
- Activation.
- Retention.
- Premium conversion.
- Acquisition cost.
- Revenue per active learner.
- Support load.

Detailed metric definitions are maintained in `metrics.md`.

---

# Support During Launch

The initial support system may be simple.

Recommended:

- Dedicated email.
- In-product feedback form.
- Shared issue tracker.
- Frequently asked questions.
- Response templates.

Support categories:

- Account.
- Lesson.
- Chinese content.
- AI Teacher.
- Audio.
- Speaking.
- Writing.
- Progress.
- Billing.
- Privacy.

The support process should identify repeated product problems rather than only resolve individual cases.

---

# Launch Risk Management

## Risk 1 — Product Is Too Large

Mitigation:

- Launch with the approved MVP only.
- Avoid adding scenarios before core stability.
- Do not introduce community or advanced gamification.

## Risk 2 — High AI Cost

Mitigation:

- Rate limits.
- Usage limits.
- Caching.
- Shorter structured responses.
- Cost monitoring.
- Beta access control.

## Risk 3 — Weak Retention

Mitigation:

- Improve first-lesson value.
- Clarify next action.
- Improve scenario relevance.
- Test review and recommendations.
- Interview inactive users.

## Risk 4 — AI Quality Problems

Mitigation:

- Controlled prompts.
- Context validation.
- AI evaluation dataset.
- User reporting.
- Human-reviewed core content.

## Risk 5 — Chinese Content Errors

Mitigation:

- Linguistic review.
- Correction process.
- Content versioning.
- In-product reporting.

## Risk 6 — Users Expect Beginner Content

Mitigation:

- Clearly state intermediate focus.
- Show required starting level.
- Avoid beginner-oriented marketing.

## Risk 7 — Speaking Feature Friction

Mitigation:

- Clear microphone setup.
- Text fallback.
- Short first activity.
- Browser compatibility testing.
- Helpful error recovery.

---

# Launch Decision Gates

Before advancing to the next stage, review:

## Product

- Does the core flow work?
- Are users able to complete it?
- Are major usability problems resolved?

## Learning

- Do users report practical value?
- Is content accurate?
- Are missions meaningful?

## Technical

- Are failures observable?
- Is progress protected?
- Is performance acceptable?

## Operational

- Can support handle more users?
- Are costs understood?
- Are backups and monitoring active?

## Market

- Do target learners understand the product?
- Do they want to continue using it?
- Is there evidence of willingness to pay?

A stage should not advance only because a planned date has arrived.

---

# Public Launch Checklist

## Product

- [ ] Three MVP scenarios complete.
- [ ] Twelve lessons complete.
- [ ] AI Teacher works.
- [ ] Speaking works.
- [ ] Writing works.
- [ ] Missions work.
- [ ] Progress works.
- [ ] Mobile experience works.

## Quality

- [ ] Critical tests pass.
- [ ] Content reviewed.
- [ ] No critical defect remains.
- [ ] No unresolved high-severity security issue remains.
- [ ] Accessibility blockers resolved.

## Operations

- [ ] Monitoring active.
- [ ] Error tracking active.
- [ ] Backups active.
- [ ] Restoration tested.
- [ ] Cost alerts active.
- [ ] Support process defined.
- [ ] Rollback plan exists.

## Legal

- [ ] Privacy policy available.
- [ ] Terms of service available.
- [ ] Account deletion process available.
- [ ] AI and recording processing explained.

## Marketing

- [ ] Positioning validated.
- [ ] Landing page complete.
- [ ] Registration flow tested.
- [ ] Launch content prepared.
- [ ] Analytics verified.
- [ ] Initial audience list prepared.

---

# First 30 Days After Public Launch

## Week 1

Focus:

- Critical errors.
- Registration problems.
- Onboarding completion.
- First lesson completion.
- Cost spikes.
- Support requests.

## Week 2

Focus:

- Day-7 retention.
- AI Teacher usage.
- Speaking and writing adoption.
- Common abandonment points.
- Content corrections.

## Week 3

Focus:

- Scenario progression.
- Mission completion.
- Progress understanding.
- Pricing feedback.
- User interviews.

## Week 4

Focus:

- Cohort analysis.
- Retention trends.
- Premium interest.
- Cost sustainability.
- Prioritized post-MVP roadmap.

---

# Post-Launch Prioritization

After launch, improvements should be prioritized using:

- Learner impact.
- Learning value.
- Frequency of problem.
- Severity.
- Retention impact.
- Revenue impact.
- Development effort.
- Operational cost.
- Strategic alignment.

Do not prioritize only the loudest individual request.

---

# Launch Success Definition

The launch succeeds when HanGo attracts the intended intermediate learner, enables them to complete a real learning journey, demonstrates repeated use, produces measurable learning value, and operates at a sustainable technical and financial cost.

The launch does not succeed only because many users register.

It succeeds when the right users continue learning.

---

End of document.