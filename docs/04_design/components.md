# HanGo Component System

Version: 1.0

Status: Official

Last Updated: August 2026

---

# Purpose

This document defines the reusable interface components required for the HanGo MVP.

The objective is to ensure that every screen uses consistent elements, behaviors, states, and interaction patterns.

Components should reduce development time, improve maintainability, and create a predictable learning experience.

---

# Component Philosophy

Components should be:

- Reusable.
- Accessible.
- Consistent.
- Responsive.
- Easy to understand.
- Focused on learning actions.

A component should not be created for a single isolated screen unless the interaction is genuinely unique.

---

# MVP Component Categories

The MVP requires components in the following categories:

1. Navigation.
2. Actions.
3. Forms.
4. Content.
5. Learning.
6. Audio and speaking.
7. AI Teacher.
8. Feedback.
9. Progress.
10. Overlays.

---

# 1. Navigation Components

## App Sidebar

Used on desktop to access the primary sections.

Required items:

- Dashboard.
- Learning Journey.
- Speaking Lab.
- Writing Lab.
- Progress.
- Settings.

Behavior:

- Persistent on desktop.
- Collapsible when space is limited.
- Clearly indicates the active section.
- Uses icons and text labels.
- Must not compete visually with the lesson content.

---

## Mobile Bottom Navigation

Used on mobile devices.

Required items:

- Home.
- Journey.
- Speaking.
- Writing.
- Progress.

Behavior:

- Fixed at the bottom.
- Active section clearly highlighted.
- AI Teacher access remains separate and persistent.
- Labels should remain visible or clearly understandable.

---

## Breadcrumbs

Used inside nested content.

Example:

```
Learning Journey
/
Restaurant
/
Intermediate
/
Ordering Food
```

Purpose:

- Show current location.
- Allow navigation to previous levels.
- Reduce confusion in deep learning paths.

---

## Lesson Step Navigation

Displays the lesson sequence.

Example:

```
Situation
Dialogue
Vocabulary
Grammar
Practice
Mission
```

Behavior:

- Shows current section.
- Shows completed sections.
- Allows return to completed sections.
- Prevents skipping required sections when progression rules apply.

---

## Tabs

Used to switch between related views.

Examples:

- Characters / Pinyin / Translation.
- Overview / Feedback / History.
- Listening / Speaking / Writing.

Tabs should not be used when the content represents a sequential learning process.

---

# 2. Action Components

## Primary Button

Used for the main action on a screen.

Examples:

- Continue.
- Start Lesson.
- Submit Answer.
- Begin Mission.
- Save Changes.

Rules:

- Only one primary action should dominate each section.
- Must support default, hover, focus, loading, disabled, and success states.
- Label should describe the action clearly.

---

## Secondary Button

Used for supporting actions.

Examples:

- Review.
- View Explanation.
- Practice Again.
- Cancel.

It should remain visually subordinate to the primary button.

---

## Tertiary Button

Used for low-priority actions.

Examples:

- Skip.
- Hide Translation.
- View Details.
- Ask AI.

Usually displayed as text or a subtle control.

---

## Icon Button

Used for compact actions.

Examples:

- Play.
- Pause.
- Record.
- Replay.
- Expand.
- Close.
- Bookmark.

Requirements:

- Accessible label.
- Tooltip on desktop when meaning is not obvious.
- Clear active and disabled states.

---

## Floating AI Teacher Button

Used when the AI Teacher panel is collapsed.

Behavior:

- Always visible.
- Does not cover essential content.
- Shows availability status.
- Opens the AI Teacher panel.
- May indicate unread feedback or suggestions.

---

# 3. Form Components

## Text Input

Used for:

- Login.
- Search.
- Short learner responses.
- Profile settings.

Required states:

- Default.
- Focus.
- Disabled.
- Error.
- Success.

---

## Text Area

Used for:

- Writing exercises.
- Messages.
- Paragraph responses.
- AI Teacher text input.

It should support:

- Character count when relevant.
- Autosave in writing activities.
- Clear submission status.
- Mobile-friendly resizing.

---

## Select

Used for:

- Learning level.
- Explanation language.
- Audio speed.
- AI Teacher mode.
- Practice type.

Options should remain concise and clearly labeled.

---

## Radio Group

Used when the learner must select one visible option.

Examples:

- Correction style.
- Explanation language.
- Difficulty mode.

---

## Checkbox

Used for independent optional preferences.

Examples:

- Show Pinyin.
- Show translation.
- Enable study reminders.

---

## Toggle

Used for immediate binary settings.

Examples:

- Dark mode.
- Automatic audio playback.
- AI Teacher voice.
- Captions.

---

## Search Input

Used for:

- Vocabulary.
- Grammar.
- Lessons.
- Saved content.

Search results should show category and context.

---

# 4. Content Components

## Page Header

Contains:

- Page title.
- Supporting description.
- Optional progress or contextual action.

The header should remain concise.

---

## Section Header

Separates major content areas.

May contain:

- Title.
- Short explanation.
- Secondary action.

---

## Card

Used to group related information.

Card variants:

- Standard card.
- Interactive card.
- Progress card.
- Lesson card.
- Recommendation card.
- Scenario card.

Cards should not be used for every element unnecessarily.

---

## Scenario Card

Displays:

- Scenario name.
- Domain.
- Difficulty.
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

## Lesson Card

Displays:

- Lesson title.
- Communication objective.
- Estimated duration.
- Progress.
- Completion status.

The objective should remain more prominent than lesson metadata.

---

## Information Banner

Used for:

- Cultural notes.
- Learning tips.
- AI recommendations.
- Important instructions.

Variants:

- Informational.
- Success.
- Warning.
- Error.

---

## Chinese Text Block

Used for Chinese sentences, dialogues, and examples.

Supports:

- Characters.
- Optional Pinyin.
- Optional translation.
- Audio playback.
- Sentence selection.
- Ask AI action.

Chinese characters must remain visually primary.

---

## Vocabulary Item

Displays:

- Chinese word.
- Pinyin.
- Meaning.
- Audio.
- Part of speech.
- Mastery status.

Expanded state may show:

- Example.
- Collocations.
- Related words.
- Common mistakes.

---

## Grammar Pattern Block

Displays:

- Grammar name.
- Communication purpose.
- Pattern.
- Example.
- Ask AI action.

It should avoid excessive academic formatting.

---

# 5. Learning Components

## Learning Objective Card

Displayed at the beginning of lessons.

Contains:

- Communication goal.
- Expected learner outcome.
- Skills involved.

Example:

```
By the end of this lesson, you can ask about ingredients and explain a food allergy.
```

---

## Dialogue Player

Displays:

- Speakers.
- Dialogue lines.
- Audio controls.
- Pinyin toggle.
- Translation toggle.
- Current audio line.
- Playback speed.

Each line should support individual playback and selection.

---

## Dialogue Line

Contains:

- Speaker identity.
- Chinese sentence.
- Optional Pinyin.
- Optional translation.
- Play button.
- Ask AI button.

Active lines should be highlighted during playback.

---

## Exercise Container

Standard wrapper for exercises.

Contains:

- Instructions.
- Current progress.
- Exercise content.
- Hint action.
- Submit action.
- Feedback area.

---

## Multiple Choice Option

Required states:

- Default.
- Hover.
- Selected.
- Correct.
- Incorrect.
- Disabled after submission.

The correct state should include text or icons, not color alone.

---

## Fill-in-the-Blank Input

Used inside sentences.

Should support:

- Chinese keyboard input.
- Clear focus state.
- Immediate or submitted evaluation.
- Accepted alternative answers when applicable.

---

## Sentence Ordering Component

Allows learners to arrange words or phrases.

Supports:

- Drag and drop.
- Keyboard controls.
- Touch interaction.
- Reset action.

---

## Matching Component

Used for:

- Word and meaning.
- Audio and sentence.
- Phrase and context.
- Grammar and example.

Must remain usable on mobile without requiring precise dragging.

---

## Hint Component

Provides progressive assistance.

Possible levels:

- General guidance.
- Grammar reminder.
- Vocabulary clue.
- Partial answer.

The component should show how many hints have been used.

---

## Mission Brief

Displayed before a mission.

Contains:

- Scenario.
- Learner role.
- AI role.
- Objective.
- Success conditions.
- Difficulty.
- Start action.

---

## Mission Interface

Contains:

- Active objective.
- Conversation or activity.
- Progress indicators.
- Microphone or text controls.
- End mission option.

During immersion, unnecessary lesson controls should be hidden.

---

## Reflection Summary

Displayed after lesson completion.

Contains:

- What the learner accomplished.
- Vocabulary practiced.
- Grammar practiced.
- Competencies improved.
- AI Teacher recommendation.
- Next action.

---

# 6. Audio and Speaking Components

## Audio Player

Required controls:

- Play.
- Pause.
- Replay.
- Speed.
- Progress.
- Current time.
- Duration.

Optional controls:

- Repeat sentence.
- Loop segment.
- Download for offline use.

---

## Record Button

Used in speaking activities.

States:

- Ready.
- Recording.
- Processing.
- Completed.
- Error.

Recording state must be visually obvious.

---

## Recording Timer

Displays:

- Recording duration.
- Maximum duration when applicable.

---

## Audio Waveform

Optional for the MVP.

May display:

- Playback position.
- Recorded audio.
- Selected segments.

It should not be required for basic functionality.

---

## Pronunciation Feedback Card

Displays:

- Overall clarity.
- Tone feedback.
- Problem syllables.
- Suggested practice.
- Retry action.
- Listen to model action.

Feedback should be specific and understandable.

---

## Speaking Session Interface

Used for:

- Conversation.
- Shadowing.
- Role play.
- Interview.
- Presentation.

Contains:

- Current mode.
- AI speech status.
- Transcript.
- Record control.
- End session.
- Optional live captions.

---

# 7. AI Teacher Components

## AI Teacher Side Panel

Persistent desktop component.

States:

- Collapsed.
- Compact.
- Expanded.

Contains:

- AI Teacher header.
- Current mode.
- Context indicator.
- Conversation history.
- Suggested prompts.
- Text input.
- Microphone.
- Expand and close controls.

---

## AI Teacher Full-Screen View

Used for:

- Long conversations.
- Voice practice.
- Detailed explanations.
- Study planning.

It should preserve the previous lesson context.

---

## Context Indicator

Shows what the AI Teacher currently understands.

Examples:

- Restaurant — Intermediate.
- Grammar: 把 construction.
- Dialogue line 4 selected.

The learner should know what content the AI Teacher is using.

---

## AI Message

May contain:

- Explanation.
- Example sentences.
- Correction.
- Question.
- Suggested action.
- Audio playback.

AI messages should support structured educational content, not only plain text.

---

## Learner Message

Supports:

- Text.
- Voice transcript.
- Selected lesson content.
- Attachments in future versions.

---

## Suggested Prompt Chip

Examples:

- Explain this.
- Give me more examples.
- Practice this grammar.
- Speak more slowly.
- Ask me a question.

Suggestions should depend on the current page context.

---

## AI Mode Selector

Available modes:

- Tutor.
- Conversation.
- Practice.
- Review.
- Challenge.

The current mode should remain visible.

---

## AI Response Loading State

Should communicate the current action.

Examples:

- Preparing an explanation.
- Evaluating your pronunciation.
- Creating practice.
- Thinking of a follow-up question.

---

# 8. Feedback Components

## Inline Feedback

Used immediately after an answer.

Displays:

- Correct or needs improvement.
- Short explanation.
- Optional Ask AI action.
- Retry or continue action.

---

## Feedback Panel

Used for more detailed analysis.

Examples:

- Writing evaluation.
- Speaking evaluation.
- Mission report.
- Quiz summary.

---

## Toast Notification

Used for brief system confirmations.

Examples:

- Progress saved.
- Recording uploaded.
- Settings updated.

Toasts should not contain critical information requiring action.

---

## Error Message

Must include:

- What happened.
- What the learner can do.
- Retry action when possible.

---

## Success Message

Used for:

- Completed activities.
- Saved work.
- Achieved objectives.

Success messages should remain realistic and concise.

---

# 9. Progress Components

## Progress Bar

Used for:

- Lesson completion.
- Scenario progress.
- Daily goal.
- Competency development.

Must include a text label when the meaning is not obvious.

---

## Competency Card

Displays:

- Competency name.
- Current level.
- Recent trend.
- Recommended next action.

Examples:

- Speaking.
- Listening.
- Writing.
- Travel Communication.

---

## Mastery Badge

Possible states:

- Introduced.
- Practicing.
- Developing.
- Confident.
- Mastered.

Badges should represent real progress, not decorative rewards.

---

## Skill Summary

Displays a compact overview of multiple competencies.

The MVP should avoid overly complex charts.

---

## Recommendation Card

Contains:

- AI recommendation.
- Reason.
- Estimated duration.
- Start action.

Example:

```
Practice restaurant speaking for 10 minutes.

Reason:
You understand the dialogue but still hesitate when making requests.
```

---

# 10. Overlay Components

## Modal

Used only for focused decisions.

Examples:

- Confirm lesson exit.
- Delete account.
- Change mission difficulty.

Avoid using modals for normal learning content.

---

## Drawer

Used on mobile for:

- AI Teacher.
- Filters.
- Secondary navigation.

---

## Tooltip

Used to explain unfamiliar icons or brief concepts.

Tooltips should not contain essential learning information.

---

## Popover

Used for:

- Vocabulary previews.
- Grammar notes.
- Quick settings.
- Audio speed controls.

---

# Component States

Every interactive component must define:

- Default.
- Hover.
- Focus.
- Active.
- Selected.
- Disabled.
- Loading.
- Success.
- Error.

State behavior must remain consistent throughout the application.

---

# Responsive Requirements

Every component must specify behavior for:

## Desktop

May use multi-column layouts and persistent panels.

## Tablet

May collapse secondary navigation and use overlays.

## Mobile

Must prioritize touch, full-width content, and simplified layouts.

No essential learning feature may become unavailable on mobile.

---

# Accessibility Requirements

All components must support:

- Keyboard navigation.
- Accessible labels.
- Visible focus states.
- Sufficient contrast.
- Screen reader compatibility.
- Reduced motion.
- Touch targets of adequate size.

Audio components require transcripts or captions whenever possible.

---

# MVP Priority Components

The first implementation must include:

- App Sidebar.
- Mobile Bottom Navigation.
- Primary and secondary buttons.
- Inputs and text areas.
- Cards.
- Scenario Card.
- Lesson Card.
- Chinese Text Block.
- Vocabulary Item.
- Grammar Pattern Block.
- Dialogue Player.
- Exercise Container.
- Multiple Choice.
- Fill in the Blank.
- Hint Component.
- Mission Brief.
- Audio Player.
- Record Button.
- AI Teacher Side Panel.
- AI Messages.
- Inline Feedback.
- Progress Bar.
- Competency Card.
- Modal.
- Drawer.

Components outside this list may be added only when required by an approved MVP feature.

---

# Component Documentation Requirements

Each implemented component should document:

- Purpose.
- Props or inputs.
- Variants.
- States.
- Responsive behavior.
- Accessibility behavior.
- Usage examples.
- Restrictions.

---

# Success Definition

The HanGo Component System succeeds when product screens can be built primarily from reusable, accessible, and consistent components without recreating the same interaction patterns for each feature.

---

End of document.