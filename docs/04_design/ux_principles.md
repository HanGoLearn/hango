# HanGo UX Principles

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the user experience principles that guide how learners interact with HanGo.

Its objective is to ensure that the application remains intuitive, supportive, focused, and aligned with HanGo's communication-first learning methodology.

The learner should always understand:

- Where they are.
- What they are learning.
- What they should do next.
- Why the activity matters.
- How they are improving.

---

# UX Philosophy

HanGo should feel like learning with a private Chinese tutor inside a structured academy.

The product should not feel like:

- A collection of disconnected tools.
- A traditional textbook converted into a website.
- A generic chatbot.
- A game based only on points and streaks.
- A complex educational management system.

Every module should feel connected to the same learning journey.

---

# Core UX Principles

## 1. The Learner Always Has a Clear Next Step

The learner should never need to decide what to do without guidance.

Every major screen should present one recommended next action.

Examples:

- Continue current lesson.
- Review difficult vocabulary.
- Practice speaking.
- Complete the scenario mission.
- Review AI Teacher feedback.

Secondary actions may remain available, but they should not compete visually with the recommended action.

---

## 2. Communication Is the Main Outcome

Activities should be presented through what the learner will be able to accomplish.

Preferred:

```text
Learn to explain a food allergy at a restaurant.
```

Avoid:

```text
Study 15 vocabulary words and two grammar structures.
```

Vocabulary and grammar remain important, but they support the communication objective.

---

## 3. The AI Teacher Is Always Available

The AI Teacher should remain accessible throughout the authenticated application.

The learner should be able to ask questions without leaving the current activity.

The AI Teacher must understand the visible context.

Examples:

- Current lesson.
- Current scenario.
- Selected dialogue line.
- Current grammar topic.
- Current exercise.
- Latest learner answer.

The learner should not need to copy and paste content already visible on the page.

---

## 4. The AI Teacher Must Not Obstruct Learning

Persistent access does not mean permanent visual dominance.

The AI Teacher should support three interface states:

- Collapsed.
- Compact.
- Expanded.

The main learning content must remain the visual priority.

On mobile, the AI Teacher should open as a drawer or full-screen interface rather than permanently occupying limited screen space.

---

## 5. Context Before Explanation

The learner should encounter language inside a situation before receiving detailed explanations.

Recommended lesson experience:

```text
Situation

↓

Dialogue

↓

Comprehension

↓

Vocabulary

↓

Grammar

↓

Practice

↓

Mission
```

The interface should preserve this sequence.

It should not present vocabulary and grammar as disconnected reference material.

---

## 6. Progressive Disclosure

HanGo should show only the information required at the current moment.

Additional information should remain available through deliberate actions.

Examples:

- Pinyin hidden or shown through a toggle.
- Translation hidden or shown through a toggle.
- Detailed grammar notes expandable.
- Additional AI examples requested when needed.
- Advanced vocabulary information hidden by default.

This reduces cognitive overload and encourages more direct interaction with Chinese.

---

## 7. Chinese Remains Visually Primary

When Chinese, Pinyin, and translation appear together, the hierarchy must be:

```text
Chinese

Pinyin

Translation
```

Chinese characters should receive the strongest visual emphasis.

Pinyin and translation exist as support tools.

As the learner progresses, HanGo should gradually encourage reduced dependence on them.

---

## 8. Active Production Is Prioritized

Learners should regularly produce Chinese rather than only recognize answers.

The interface should create frequent opportunities to:

- Speak.
- Write.
- Complete sentences.
- Respond to questions.
- Continue conversations.
- Solve communication problems.

Passive activities should lead toward active production.

---

## 9. Feedback Must Be Immediate and Educational

Every meaningful learner action should receive clear feedback.

Feedback should explain:

- Whether the communication objective was achieved.
- What was done well.
- What needs improvement.
- Why the correction matters.
- What action should follow.

Preferred:

```text
Your sentence is understandable. Move 也 before the verb to make the word order natural.
```

Avoid:

```text
Incorrect.
```

---

## 10. Mistakes Should Feel Safe

HanGo should never treat ordinary learning mistakes as system failures.

Learning feedback should remain visually different from technical error feedback.

A grammar mistake should not use the same alarming visual treatment as:

- A failed payment.
- A disconnected microphone.
- A server error.

The learner should feel encouraged to try again.

---

## 11. Correction Should Match the Activity

Correction behavior depends on the learning context.

### Guided Exercise

Correction may be immediate.

### Conversation Practice

Minor corrections should normally wait until the learner finishes speaking.

### Mission or Simulation

The AI should remain in character and avoid interrupting unless communication breaks down.

### Writing Practice

The learner should submit an initial attempt before receiving a complete corrected version.

The interface must reflect these differences.

---

## 12. Progress Should Represent Competence

HanGo should not rely only on:

- Number of lessons completed.
- Time spent.
- Daily streak.
- Number of answers submitted.

Progress should emphasize abilities.

Examples:

- Can order food independently.
- Can explain a problem at a hotel.
- Can maintain a five-minute conversation.
- Can write a professional message.
- Can understand familiar speech at natural speed.

Completion metrics may support the experience, but they should not define mastery.

---

## 13. Recommendations Must Be Explainable

Every personalized recommendation should include a reason.

Example:

```text
Practice Restaurant Speaking.

Reason:
You understand the dialogue, but your last two mission attempts showed hesitation when making polite requests.
```

Avoid recommendations that appear arbitrary.

The learner should trust the learning system.

---

## 14. Difficulty Should Increase Gradually

The learner should feel challenged without feeling abandoned.

Difficulty may increase through:

- Longer sentences.
- Faster audio.
- Fewer hints.
- More open-ended answers.
- More complex grammar.
- More unexpected events.
- More abstract topics.

The interface should clearly communicate when difficulty changes.

---

## 15. Support Should Decrease as Competence Grows

Intermediate learners may receive:

- Pinyin.
- Translation.
- Suggested answers.
- Structured hints.
- Slower audio.

Advanced learners should receive:

- More Chinese-only content.
- Natural-speed audio.
- Fewer hints.
- More open conversations.
- More nuanced feedback.

The system should gradually increase learner independence.

---

# Learning Journey Experience

The Learning Journey is the primary structured path.

Its UX should communicate:

- Long-term direction.
- Current position.
- Scenario mastery.
- Available next steps.
- Increasing complexity.

The learner should understand that scenarios can return at higher difficulty levels.

Example:

```text
Restaurant — Intermediate

Order food and make basic requests.
```

Later:

```text
Restaurant — Upper Intermediate

Explain dietary restrictions and solve service problems.
```

Later:

```text
Restaurant — Advanced

Discuss regional cuisine and food culture.
```

The experience should reinforce progression rather than repetition.

---

# Scenario Experience

Every scenario should communicate three things before the learner starts:

## Context

Where and with whom the communication occurs.

## Outcome

What the learner will be able to accomplish.

## Difficulty

How independently the learner is expected to communicate.

Scenario pages should prioritize practical outcomes over content counts.

Preferred:

```text
You will learn to report a problem and negotiate a solution at a hotel.
```

Avoid emphasizing:

```text
4 lessons, 18 words, 2 grammar topics.
```

That information may appear as secondary metadata.

---

# Lesson Experience

Every lesson should feel like a coherent learning session.

The learner should not experience vocabulary, grammar, dialogue, and exercises as separate products.

The flow should clearly connect them.

Example:

- The dialogue introduces the communication problem.
- Vocabulary explains necessary expressions.
- Grammar explains how meaning was constructed.
- Guided practice develops control.
- Speaking and writing develop production.
- The mission verifies practical use.

The learner should understand why each step exists.

---

# Lesson Progression Rules

The interface should:

- Show the current lesson step.
- Mark completed steps.
- Allow review of completed sections.
- Preserve learner responses when navigating backward.
- Save progress automatically.
- Clearly indicate when work has been saved.
- Warn before abandoning unsaved speaking or writing work.

The learner should be able to pause and continue later.

---

# AI Teacher Experience

The AI Teacher should support both reactive and proactive assistance.

## Reactive Assistance

The learner asks:

- Explain this.
- Give me another example.
- Why is this wrong?
- Speak more slowly.
- Practice this with me.

## Proactive Assistance

The AI may suggest help when:

- The learner repeats the same error.
- The learner spends too long on one activity.
- The learner repeatedly requests hints.
- Recent performance shows a relevant weakness.

Proactive suggestions should remain subtle and dismissible.

The AI should not interrupt every mistake.

---

# AI Teacher Context Transparency

The learner should understand what context the AI Teacher is using.

The interface may display:

```text
Current context:

Restaurant — Intermediate

Lesson:
Asking About Ingredients

Selected sentence:
这道菜里面有没有花生？
```

The learner should be able to clear or change the current context.

---

# AI Teacher Mode Behavior

## Tutor Mode

Focus:

- Explanation.
- Guided discovery.
- Examples.
- Questions.

## Conversation Mode

Focus:

- Natural Chinese interaction.
- Minimal interruption.
- Post-conversation feedback.

## Practice Mode

Focus:

- Targeted exercises.
- Repetition.
- Progressive challenge.

## Review Mode

Focus:

- Previous mistakes.
- Vocabulary retention.
- Grammar reinforcement.

## Challenge Mode

Focus:

- Reduced support.
- Unexpected questions.
- Advanced production.

The active mode should always remain visible.

---

# Speaking Lab Experience

The Speaking Lab should reduce anxiety and encourage repeated attempts.

The learner should understand:

- What they are practicing.
- How long the activity will take.
- Whether corrections are immediate or delayed.
- What the AI will evaluate.

Before starting, the learner may select:

- Scenario.
- Difficulty.
- Practice mode.
- Correction preference.
- Duration.

During the session, the interface should minimize distractions.

---

# Speaking Feedback Principles

Speaking feedback should prioritize:

1. Communication success.
2. Important pronunciation issues.
3. Repeated grammar mistakes.
4. Fluency improvement.
5. Natural expression.

Avoid overwhelming the learner with every minor error.

Recommended feedback structure:

```text
What worked

Most important improvement

Example correction

Practice again
```

---

# Writing Lab Experience

The Writing Lab should support development rather than replace learner production.

The AI should not generate the complete answer before the learner attempts the task.

Support should progress through:

```text
Clarify the prompt

↓

Suggest vocabulary

↓

Remind relevant grammar

↓

Provide a structural hint

↓

Review the learner's attempt

↓

Explain corrections

↓

Show an improved version
```

The learner should remain the author.

---

# Writing Feedback Principles

Writing feedback should distinguish:

- Grammar.
- Vocabulary.
- Naturalness.
- Organization.
- Register.
- Communication effectiveness.

Changes between the learner's original text and corrected text should be visually identifiable.

The learner should be able to ask about any correction.

---

# Mission Experience

Missions should feel different from standard exercises.

The interface should:

- Present a clear role.
- Present a practical objective.
- Explain success conditions.
- Reduce visible academic controls.
- Maintain immersion.
- Allow natural voice or text interaction.
- Delay non-essential corrections.
- Provide a structured report afterward.

The learner should feel they are using Chinese, not answering a test.

---

# Simulation Experience

Simulations should introduce controlled unpredictability.

The learner should know:

- The general scenario.
- Their role.
- Their main objective.
- The difficulty.

The learner should not know every event in advance.

The AI may introduce:

- Misunderstandings.
- Unavailable options.
- Follow-up questions.
- Changes in circumstances.
- Secondary objectives.

The experience should remain realistic and level-appropriate.

---

# Review Experience

Review should feel purposeful, not repetitive.

Every review recommendation should explain:

- What is being reviewed.
- Why it was selected.
- How long it will take.
- Which competency it supports.

Example:

```text
Review 刚 and 刚才.

Reason:
You confused them in two recent writing activities.

Estimated time:
5 minutes.
```

---

# Dashboard Experience

The Dashboard should answer:

- What should I do now?
- What am I currently learning?
- What should I review?
- How am I improving?

The Dashboard should not attempt to display all available data.

Priority order:

1. Continue Learning.
2. AI Recommendation.
3. Review.
4. Competency Summary.
5. Quick Practice.

---

# Navigation Experience

Primary navigation should remain stable.

Official primary sections:

- Dashboard.
- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.

Settings and profile remain secondary.

The learner should not encounter multiple paths leading to the same feature without a clear reason.

---

# Onboarding Experience

Onboarding should gather only information required for personalization.

Required information:

- Learning goal.
- Current level or uncertainty.
- Preferred explanation language.
- Skill priorities.
- Study commitment.

The learner should be able to skip the initial assessment and complete it later.

Onboarding should end with a concrete recommendation.

Example:

```text
Start with Restaurant — Intermediate.

Primary focus:
Speaking fluency.

Recommended daily goal:
20 minutes.
```

---

# Personalization Experience

Personalization should feel helpful and transparent.

The learner should be able to understand and modify:

- Learning goal.
- Explanation language.
- Correction style.
- Audio speed.
- Study target.
- Difficulty preference.

Automatic adaptation should not silently make major changes without explanation.

---

# Loading and Waiting Experience

AI and audio operations may require waiting.

The interface should communicate specific progress.

Preferred:

- Preparing your explanation.
- Generating dialogue audio.
- Evaluating your pronunciation.
- Reviewing your writing.
- Updating your competency profile.

Avoid generic labels such as:

- Loading.
- Processing.

When possible, allow the learner to continue reading or reviewing while background work completes.

---

# Error Recovery

Every recoverable error should offer a next action.

Examples:

## Microphone Error

```text
HanGo cannot access your microphone.

Check browser permission or continue using text.
```

## AI Response Error

```text
The AI Teacher could not respond.

Try again or continue the lesson without assistance.
```

## Audio Generation Error

```text
This audio is temporarily unavailable.

Read the transcript or retry.
```

A technical failure should not destroy lesson progress.

---

# Mobile Experience

Mobile UX should prioritize one action at a time.

Important rules:

- Full-width lesson content.
- Touch-friendly controls.
- Persistent but non-obstructive AI Teacher access.
- Bottom navigation.
- Full-screen speaking sessions.
- Simplified dialogue controls.
- Writing autosave.
- No essential hover-only interaction.

The mobile experience must remain educationally complete.

---

# Accessibility Experience

Accessibility requirements include:

- Keyboard navigation.
- Visible focus states.
- Accessible form labels.
- Screen reader support.
- Adequate contrast.
- Text resizing.
- Reduced-motion preference.
- Audio transcripts.
- Captions where applicable.
- Alternatives to drag-and-drop interaction.
- Alternatives to voice-only activities.

Learners should be able to complete core activities using different interaction methods.

---

# Motivation Principles

HanGo should motivate through meaningful progress.

Preferred motivational signals:

- Communication competencies unlocked.
- Scenario mastery.
- Improved speaking duration.
- Reduced recurring errors.
- Successful real-life missions.
- Consistent study habits.

Avoid relying primarily on:

- Artificial currency.
- Excessive celebrations.
- Random rewards.
- Competitive rankings.
- Punishment for missed days.

Study streaks may exist, but missing one day should not create excessive guilt or loss.

---

# Notification Principles

Notifications should have educational value.

Valid notifications:

- Review is due.
- A study goal is scheduled.
- Feedback is ready.
- A saved activity is incomplete.
- A weekly progress summary is available.

Avoid excessive engagement notifications without learning value.

The learner must be able to control notification frequency.

---

# Privacy Experience

The learner should understand when HanGo stores:

- Voice recordings.
- Writing submissions.
- AI conversations.
- Learning history.
- Personalization data.

Privacy controls should use clear language.

The learner should be able to:

- Review relevant settings.
- Disable optional recording storage.
- Clear AI conversation history where supported.
- Request account deletion.

---

# MVP UX Scope

The MVP must prioritize:

- Clear onboarding.
- Direct Dashboard actions.
- Structured Learning Journey.
- Context-first lessons.
- Persistent AI Teacher.
- Basic speaking practice.
- Basic writing practice.
- Clear competency progress.
- Responsive desktop and mobile behavior.
- Accessible feedback.
- Reliable autosave and recovery.

The MVP should defer:

- Community feeds.
- Social ranking.
- Complex gamification.
- Virtual cities.
- Advanced customization.
- Decorative avatar systems.
- Non-essential visual experimentation.

---

# UX Acceptance Criteria

The HanGo MVP satisfies the UX requirements when:

- A new user can complete onboarding without assistance.
- A returning learner can continue studying within one primary action.
- The learner can access the AI Teacher from every core section.
- The AI Teacher understands the active lesson context.
- The learner can complete a lesson on desktop and mobile.
- The learner receives understandable feedback after exercises.
- Speaking and writing activities preserve learner attempts.
- Mission results explain communication success and priorities.
- Progress shows competencies, not only completion.
- Errors provide clear recovery options.
- Chinese remains visually and pedagogically central.
- No core screen overwhelms the learner with unnecessary information.

---

# Success Definition

The HanGo user experience succeeds when learners can focus on using and improving their Chinese while the platform continuously guides, supports, and adapts without creating confusion or unnecessary friction.

---

End of document.