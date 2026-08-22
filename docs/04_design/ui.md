# HanGo UI Specification

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the user interface structure of the HanGo MVP.

Its purpose is to describe the principal screens, layouts, interface regions, responsive behavior, and visual priorities that Claude must implement.

This document focuses on what the user sees and how each screen is organized.

Detailed visual tokens are defined in `design_system.md`.

Detailed reusable elements are defined in `components.md`.

Interaction principles are defined in `ux_principles.md`.

---

# MVP Interface Scope

The HanGo MVP includes the following primary interfaces:

1. Authentication.
2. Onboarding.
3. Dashboard.
4. Learning Journey.
5. Scenario Detail.
6. Lesson.
7. AI Teacher.
8. Speaking Lab.
9. Writing Lab.
10. Progress.
11. Settings.

Administrative interfaces are outside the initial learner-facing UI unless explicitly included in the MVP development scope.

---

# Global Application Layout

The application uses a shared layout across authenticated screens.

## Desktop Structure

```text
┌───────────────────────────────────────────────────────────────┐
│ Top Bar                                                       │
├──────────────┬──────────────────────────────┬─────────────────┤
│              │                              │                 │
│ Navigation   │ Main Content                 │ AI Teacher      │
│ Sidebar      │                              │ Side Panel      │
│              │                              │                 │
│              │                              │                 │
└──────────────┴──────────────────────────────┴─────────────────┘
```

The main content is the visual priority.

The navigation sidebar remains compact.

The AI Teacher remains visible or easily expandable.

---

## Tablet Structure

```text
┌───────────────────────────────────────────────┐
│ Top Bar                                       │
├──────────┬────────────────────────────────────┤
│ Compact  │ Main Content                       │
│ Sidebar  │                                    │
└──────────┴────────────────────────────────────┘
```

The AI Teacher opens as:

- A drawer.
- An overlay.
- A resizable panel when space allows.

---

## Mobile Structure

```text
┌───────────────────────────────┐
│ Top Bar                       │
├───────────────────────────────┤
│                               │
│ Main Content                  │
│                               │
├───────────────────────────────┤
│ Bottom Navigation             │
└───────────────────────────────┘
```

The AI Teacher is accessed through a persistent floating button or dedicated action.

Speaking and mission experiences may use full-screen layouts.

---

# Global Top Bar

The top bar may contain:

- Current page or lesson title.
- Breadcrumb or contextual navigation.
- Daily progress.
- Notifications.
- User menu.
- AI Teacher expand action on smaller layouts.

The top bar should remain visually light.

It should not compete with the main learning content.

---

# Navigation Sidebar

The desktop sidebar contains:

- HanGo logo.
- Dashboard.
- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.
- Settings.
- User profile summary.

The active section must be clearly visible.

The sidebar may collapse to icons on narrower desktop screens.

---

# AI Teacher Side Panel

The AI Teacher occupies the right side of the desktop interface.

## Collapsed State

Displays:

- AI Teacher icon.
- Status.
- Open action.
- Optional recommendation indicator.

## Compact State

Displays:

- Current mode.
- Context summary.
- Recent message.
- Suggested actions.
- Text and voice input.

## Expanded State

Displays:

- Full conversation history.
- Voice interaction.
- Detailed explanations.
- Practice actions.
- Context indicator.
- Mode selector.

The AI Teacher panel must be resizable or expandable without losing the current lesson state.

---

# 1. Authentication Interface

The authentication interface includes:

- Login.
- Registration.
- Password recovery.
- Email verification.
- OAuth options.

---

## Login Screen

Required elements:

- HanGo logo.
- Short product description.
- Email input.
- Password input.
- Login button.
- Google authentication.
- Password recovery.
- Registration link.

The interface should feel calm and professional.

Avoid unnecessary marketing content inside the login flow.

---

## Registration Screen

Required elements:

- Name.
- Email.
- Password.
- Terms acceptance.
- Registration button.
- OAuth option.
- Login link.

After registration, the learner proceeds directly to onboarding.

---

# 2. Onboarding Interface

The onboarding experience gathers information required for personalization.

The flow should be divided into short steps.

Recommended sequence:

```text
Welcome

↓

Learning Goal

↓

Current Level

↓

Preferred Explanation Language

↓

Skill Priorities

↓

Study Commitment

↓

Initial Assessment or Skip

↓

Personalized Recommendation
```

---

## Onboarding Progress

Display:

- Current step.
- Total steps.
- Back action.
- Continue action.

Avoid presenting all onboarding questions in a single long form.

---

## Learning Goal Screen

Options may include:

- Speak confidently.
- Prepare for HSK.
- Travel.
- Work.
- Study.
- Personal interest.

The learner may select more than one goal.

---

## Current Level Screen

Options:

- HSK 3.
- HSK 4.
- HSK 5.
- HSK 6.
- HSK 7–9.
- Unsure.

Learners who select “Unsure” should be offered an assessment.

---

## Recommendation Screen

After onboarding, display:

- Estimated starting level.
- Recommended first scenario.
- Priority competency.
- Suggested daily goal.
- Start action.

---

# 3. Dashboard Interface

The Dashboard is the first screen for returning learners.

It must prioritize the next learning action.

---

## Dashboard Desktop Layout

```text
┌─────────────────────────────────────────────────────┐
│ Welcome + Daily Goal                                │
├────────────────────────────────┬────────────────────┤
│ Continue Learning              │ AI Recommendation  │
├────────────────────────────────┼────────────────────┤
│ Learning Journey Progress      │ Competency Summary │
├────────────────────────────────┴────────────────────┤
│ Recommended Review and Quick Practice               │
└─────────────────────────────────────────────────────┘
```

---

## Dashboard Main Sections

### Welcome Area

Displays:

- Learner name.
- Current study streak.
- Daily goal.
- Short progress message.

---

### Continue Learning

Displays:

- Current scenario.
- Current level.
- Current lesson.
- Lesson objective.
- Progress.
- Estimated duration.
- Continue button.

This should be the primary Dashboard card.

---

### AI Teacher Recommendation

Displays:

- Personalized recommendation.
- Reason.
- Estimated duration.
- Direct action.

Example:

```text
Practice restaurant speaking for 10 minutes.

You understand the lesson, but still hesitate when making requests.
```

---

### Learning Journey Progress

Displays:

- Current domain.
- Current scenario.
- Completed scenarios.
- Upcoming scenario.
- Overall journey progress.

---

### Competency Summary

Displays a limited MVP overview:

- Listening.
- Speaking.
- Reading.
- Writing.

Each competency includes:

- Current stage.
- Short trend.
- View Progress action.

---

### Review Section

Displays:

- Vocabulary due for review.
- Grammar needing reinforcement.
- Dialogue replay.
- Recent mistakes.

---

### Quick Practice

Provides direct access to:

- AI Teacher.
- Speaking Lab.
- Writing Lab.
- Vocabulary review.
- Grammar review.

---

# 4. Learning Journey Interface

The Learning Journey displays the structured curriculum through domains, scenarios, and difficulty levels.

---

## Learning Journey Header

Displays:

- Page title.
- Current proficiency range.
- Overall progress.
- Optional filters.

Possible filters:

- Daily Life.
- Travel.
- Social.
- Professional.
- Academic.
- Society.

---

## Scenario Grid

Each scenario card displays:

- Scenario name.
- Domain.
- Difficulty levels available.
- Progress.
- Current status.
- Primary action.

Possible statuses:

- Locked.
- Available.
- In progress.
- Completed.
- Mastered.

---

## Scenario Categories

Recommended MVP categories:

### Daily Life

- Restaurant.
- Shopping.
- Transportation.
- Health.
- Friends.

### Travel

- Hotel.
- Airport.
- Taxi.
- Tourism.

### Professional

- Interview.
- Office.
- Meetings.
- Presentations.

More categories may be introduced after the MVP.

---

# 5. Scenario Detail Interface

The Scenario Detail screen appears after selecting a scenario.

Example:

Restaurant.

---

## Scenario Header

Displays:

- Scenario title.
- Description.
- Domain.
- Current mastery.
- Communication outcomes.

Example:

```text
Restaurant

Learn to order food, ask about ingredients, express preferences, and solve common problems.
```

---

## Difficulty Levels

Each scenario may contain:

- Intermediate.
- Upper Intermediate.
- Advanced.

Each level displays:

- Communication goals.
- Estimated duration.
- Number of lessons.
- Current progress.
- Locked or available status.

---

## Lesson List

Each lesson card displays:

- Lesson number.
- Title.
- Communication objective.
- Estimated duration.
- Completion status.
- Continue or start action.

Example:

```text
Lesson 2

Asking About Ingredients

Learn to ask what a dish contains and explain dietary restrictions.
```

---

## Scenario Mission

The final mission appears after the required lessons.

Displays:

- Mission objective.
- Required lessons.
- Difficulty.
- Current status.
- Start action.

---

# 6. Lesson Interface

The Lesson interface is the central study experience.

It must keep the AI Teacher available while providing a focused content flow.

---

## Lesson Header

Displays:

- Scenario.
- Lesson title.
- Communication objective.
- Progress.
- Exit action.
- Save status.

---

## Lesson Step Sequence

Recommended MVP sequence:

```text
1. Situation

2. Dialogue

3. Comprehension

4. Vocabulary

5. Grammar

6. Guided Practice

7. Speaking

8. Writing

9. Quiz

10. Mission

11. Reflection
```

The interface should show the learner's current step.

---

## Situation Screen

Displays:

- Location.
- Participants.
- Context.
- Communication objective.
- Start dialogue action.

The content should remain short and clear.

---

## Dialogue Screen

Main regions:

- Dialogue player.
- Transcript.
- Speaker labels.
- Pinyin toggle.
- Translation toggle.
- Playback speed.
- Sentence-level controls.
- Ask AI action.

On desktop, the transcript may remain in the center while the AI Teacher panel appears on the right.

---

## Comprehension Screen

Displays:

- Questions related to the dialogue.
- Progress through questions.
- Submit action.
- Immediate feedback.
- Ask AI action.

---

## Vocabulary Screen

Displays vocabulary as contextual cards or a structured list.

Each item includes:

- Chinese.
- Pinyin.
- Meaning.
- Audio.
- Example.
- Mastery status.

The learner should be able to:

- Play audio.
- Expand details.
- Ask the AI Teacher.
- Mark as difficult.

---

## Grammar Screen

Displays:

- Communication purpose.
- Pattern.
- Dialogue example.
- Additional examples.
- Common mistake.
- Practice action.
- Ask AI action.

Avoid long uninterrupted blocks of text.

---

## Guided Practice Screen

Displays one exercise at a time or a small group of related exercises.

Includes:

- Instructions.
- Exercise content.
- Hint.
- Submit.
- Feedback.
- Continue.

---

## Speaking Screen

Displays:

- Activity objective.
- Model audio.
- Record control.
- Transcript when available.
- Pronunciation feedback.
- Retry action.

The interface should prioritize microphone interaction.

---

## Writing Screen

Displays:

- Writing objective.
- Prompt.
- Required vocabulary or grammar when applicable.
- Editor.
- Submit action.
- AI feedback.
- Rewrite action.

---

## Quiz Screen

Displays:

- Number of questions.
- Current question.
- Progress.
- Immediate or end-of-quiz feedback.
- Results summary.

---

## Mission Screen

The Mission interface should become more immersive.

Hide secondary navigation when appropriate.

Display:

- Learner role.
- AI role.
- Objective.
- Success conditions.
- Voice or text interaction.
- End mission action.

The AI Teacher should remain in character during the mission.

---

## Reflection Screen

Displays:

- Mission outcome.
- Communication objective achieved.
- Vocabulary used.
- Grammar used.
- Competencies improved.
- Mistakes to review.
- AI recommendation.
- Next lesson action.

---

# 7. AI Teacher Interface

The AI Teacher interface exists both as a persistent panel and a complete workspace.

---

## Persistent Panel

Used during lessons and navigation.

Displays:

- Current mode.
- Current context.
- Messages.
- Suggested actions.
- Text input.
- Microphone.

---

## Full AI Teacher Screen

Used for:

- Free tutoring.
- Long explanations.
- Study planning.
- Conversation practice.
- Review sessions.

Recommended layout:

```text
┌───────────────────────────────────────────────────────┐
│ AI Teacher Header + Mode                             │
├───────────────────────────────┬───────────────────────┤
│ Conversation                  │ Learner Context       │
│                               │ Suggested Activities  │
└───────────────────────────────┴───────────────────────┘
```

The context area should remain compact and transparent.

---

## AI Teacher Suggested Actions

Examples:

- Explain this page.
- Give me more examples.
- Practice this grammar.
- Speak only in Chinese.
- Create a short quiz.
- Review my mistakes.
- Tell me what to study next.

---

# 8. Speaking Lab Interface

The Speaking Lab is a dedicated practice environment.

---

## Speaking Lab Home

Displays practice modes:

- Pronunciation.
- Shadowing.
- Conversation.
- Role Play.
- Interview.
- Presentation.
- Debate.

Modes may be locked depending on learner level.

---

## Practice Setup

Before starting, the learner selects:

- Practice mode.
- Topic or scenario.
- Difficulty.
- Duration.
- Correction style.
- Chinese-only or mixed language.

---

## Active Speaking Session

Recommended full-screen structure:

```text
┌─────────────────────────────────────────────────────┐
│ Mode + Scenario + Session Timer                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ AI Conversation / Prompt                            │
│                                                     │
│ Transcript                                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Microphone + Controls                               │
└─────────────────────────────────────────────────────┘
```

The learner should focus on speaking, not navigation.

---

## Speaking Results

Displays:

- Communication success.
- Fluency.
- Pronunciation.
- Grammar.
- Vocabulary.
- Strong moments.
- Important corrections.
- Retry action.
- Recommended next practice.

---

# 9. Writing Lab Interface

The Writing Lab provides structured writing practice.

---

## Writing Lab Home

Displays practice types:

- Sentence Builder.
- Short Message.
- Paragraph.
- Practical Writing.
- Opinion.
- Essay.

---

## Writing Task Setup

Displays:

- Task type.
- Topic.
- Difficulty.
- Target length.
- Optional grammar.
- Optional vocabulary.

---

## Writing Workspace

Recommended layout:

```text
┌─────────────────────────────────────────────────────┐
│ Prompt + Requirements                               │
├───────────────────────────────┬─────────────────────┤
│ Writing Editor                │ AI Support          │
│                               │                     │
└───────────────────────────────┴─────────────────────┘
```

AI support may provide:

- Hint.
- Vocabulary suggestion.
- Grammar reminder.
- Clarification.

The AI should not write the complete answer unless explicitly requested after the learner attempts the task.

---

## Writing Feedback

Displays:

- Original response.
- Corrected version.
- Grammar observations.
- Vocabulary observations.
- Naturalness.
- Organization.
- Suggested rewrite.
- New practice action.

Changes should be visually distinguishable.

---

# 10. Progress Interface

The Progress screen explains the learner's development.

---

## Progress Header

Displays:

- Current estimated HanGo level.
- Approximate HSK reference.
- Overall competency status.
- Recent improvement.

---

## Core Competencies

MVP competencies:

- Listening.
- Speaking.
- Reading.
- Writing.
- Grammar.
- Vocabulary.

Each displays:

- Current mastery stage.
- Recent trend.
- Supporting evidence.
- Recommended action.

---

## Communication Competencies

Displays scenario-based abilities:

- Daily Communication.
- Travel Communication.
- Social Communication.
- Professional Communication.
- Academic Communication.

For the MVP, only categories supported by existing content should appear.

---

## Scenario Mastery

Displays progress by scenario.

Example:

```text
Restaurant        Confident
Hotel             Developing
Shopping          Practicing
Business Meeting  Not started
```

---

## Strengths and Weaknesses

Displays AI-generated summaries.

Example:

```text
Strength

You understand familiar conversations at natural speed.

Priority

You still hesitate when producing longer spoken responses.
```

---

## Recommendations

Displays specific actions connected to learner data.

Each recommendation includes:

- Action.
- Reason.
- Duration.
- Start button.

---

# 11. Settings Interface

Settings are divided into clear categories.

Recommended sections:

- Profile.
- Learning.
- AI Teacher.
- Audio.
- Notifications.
- Appearance.
- Privacy.
- Account.

---

## Learning Settings

Includes:

- Learning goal.
- Current level.
- Daily target.
- Skill priorities.
- Adaptive difficulty.

---

## AI Teacher Settings

Includes:

- Explanation language.
- Correction style.
- Explanation detail.
- Default mode.
- Voice enabled or disabled.

---

## Audio Settings

Includes:

- Default speed.
- Automatic playback.
- Captions.
- Voice preference when available.

---

## Appearance Settings

Includes:

- Light mode.
- Dark mode.
- System mode.
- Text size.

Dark mode may remain outside the first MVP release if not prioritized.

---

# Empty States

Every major screen must define an empty state.

Examples:

## Speaking Lab

```text
You have not completed a speaking session yet.

Start with a short pronunciation practice.
```

## Writing Lab

```text
No writing activities completed yet.

Write your first short message in Chinese.
```

## Progress

```text
Complete your first lesson to begin building your competency profile.
```

---

# Loading States

Loading states must explain the active process.

Examples:

- Loading your lesson.
- Preparing your AI Teacher.
- Evaluating pronunciation.
- Reviewing your writing.
- Updating progress.

Use skeletons for content loading and clear progress indicators for AI operations.

---

# Error States

Errors should provide:

- Clear explanation.
- Recovery action.
- Alternative action when possible.

Example:

```text
We could not evaluate your recording.

Try again or continue without pronunciation feedback.
```

---

# Responsive Priorities

## Desktop

Prioritize:

- Persistent navigation.
- Main content.
- Persistent AI Teacher panel.
- Efficient multi-column layouts.

## Tablet

Prioritize:

- Main learning content.
- Collapsible navigation.
- Overlay AI Teacher.

## Mobile

Prioritize:

- One task at a time.
- Full-width content.
- Touch-friendly controls.
- Full-screen speaking.
- Floating AI Teacher access.

---

# MVP UI Priorities

The MVP must implement these interfaces first:

1. Authentication.
2. Onboarding.
3. Dashboard.
4. Learning Journey.
5. Scenario Detail.
6. Lesson.
7. Persistent AI Teacher.
8. Basic Speaking Lab.
9. Basic Writing Lab.
10. Progress.
11. Settings.

Advanced visualizations and non-essential content discovery screens should be deferred.

---

# UI Acceptance Criteria

The MVP UI is acceptable when:

- The learner always knows their current location.
- The learner always knows the next recommended action.
- The AI Teacher remains accessible.
- All core screens work on desktop and mobile.
- Chinese text remains visually primary.
- Audio controls are consistent.
- Feedback is immediate and understandable.
- Progress reflects competence, not only completion.
- No screen contains unnecessary visual complexity.

---

# Success Definition

The HanGo UI succeeds when learners can move from learning to practice, feedback, and progress without confusion while experiencing the AI Teacher as a natural and permanent part of the platform.

---

End of document.