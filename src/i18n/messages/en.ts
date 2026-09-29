export const messages = {
  metadata: {
    title: "HanGo — Learn Chinese from zero and use it for real",
    description:
      "Learn Mandarin step by step, use it in real situations, and improve with a structured path and an AI Teacher that adapts to your level.",
    socialTitle: "Start from zero. Take your Chinese as far as you want.",
    socialDescription:
      "Learn Chinese step by step and use it in real situations.",
    socialImageAlt:
      "HanGo — Start from zero and take your Chinese as far as you want.",
  },
  common: {
    languageSwitcher: "Choose interface language",
  },
  learningJourney: {
    title: "Learning Journey",
    headline: "From your first words to real conversations",
    continueLabel: "Continue",
    lessonProgress: "Lesson {current} of {total}",
    scenarioProgress: "{completed} of {total} situations",
    inProgress: "In progress",
    description: "Pick a real-world scenario and work through its lessons.",
    emptyDescription:
      "Scenarios like Restaurant, Hotel, and Shopping will appear here once the curriculum content is available.",
    scenarioCount: "{count} scenarios",
    currentChapter: "You are here",
    beta: {
      nextPhase: "Next beta phase",
      reviewMessage:
        "We're finishing the review of this level before opening it to more learners.",
      previewAction: "See what you'll learn",
      previewTitle: "A look at what comes next",
      backToFoundations: "Continue with Foundations",
    },
    chapters: {
      BEGINNER: {
        title: "Foundations",
        subtitle: "Beginner level",
        blurb: "Say hello, introduce yourself, count, order the basics.",
      },
      INTERMEDIATE: {
        title: "Everyday Life",
        subtitle: "Intermediate level",
        blurb: "Eat out, shop, travel and make friends.",
      },
      ADVANCED: {
        title: "Advanced Situations",
        subtitle: "Advanced level",
        blurb: "Work, negotiate and argue your point.",
      },
    },
    detail: {
      chapterBadge: "Chapter {number} · {name}",
      outcomes: "By the end, you'll be able to",
      lessonsProgress: "{completed} of {total} lessons",
      pathLabel: "Your path · {count} lessons",
      finalMission: "Final Mission",
      difficulty: {
        BEGINNER: "Foundations",
        INTERMEDIATE: "Everyday Life",
        UPPER_INTERMEDIATE: "Upper Intermediate",
        ADVANCED: "Advanced Situations",
      },
    },
    lessonPath: {
      status: {
        COMPLETED: "Completed",
        AVAILABLE: "Available",
        LOCKED: "Locked",
      },
      placedByExam: "Placed by exam",
      placedByExamTitle:
        "Complete it yourself to confirm or improve your score.",
    },
  },
  lesson: {
    loading: "Loading your lesson.",
    loadErrorTitle: "Couldn't load this lesson",
    loadErrorDescription:
      "Something went wrong while loading this lesson. Please try again.",
    common: {
      continue: "Continue",
      next: "Next",
      nextQuestion: "Next question",
      of: "of",
      checkAnswers: "Check answers",
      check: "Check",
      submit: "Submit",
      tryAgain: "Try again",
      cancel: "Cancel",
      confirmTryAgain: "Yes, try again",
      showHint: "Show hint",
      back: "Back",
      correct: "Correct.",
      correctExcited: "Correct!",
      notQuite: "Not quite.",
      notQuiteShort: "Not quite",
      submitted: "Submitted.",
      audioUnavailable: "Audio unavailable",
    },
    header: {
      exit: "Exit lesson",
      progress: "{completed} of {total} steps",
      saving: "Saving...",
      saved: "Saved",
      saveError: "We couldn't save that. Please try again.",
    },
    display: {
      pinyin: "Pinyin",
      translation: "Translation",
    },
    navigation: {
      ariaLabel: "Lesson steps",
      status: {
        completed: "completed",
        available: "available",
        locked: "locked",
      },
      steps: {
        situation: "Situation",
        objective: "Objective",
        dialogue: "Dialogue",
        comprehension: "Comprehension",
        vocabulary: "Vocabulary",
        grammar: "Grammar",
        guidedPractice: "Guided Practice",
        speaking: "Speaking",
        writing: "Writing",
        aiChallenge: "AI Challenge",
        quiz: "Quiz",
        mission: "Mission",
        reflection: "Reflection",
      },
    },
    ai: {
      ask: "Ask AI",
      aboutLine: "Ask AI about this line",
      aboutGrammar: "Ask AI about this grammar point",
      practiceVocabulary: "Practice this with AI",
    },
    audio: {
      couldntLoad: "Couldn't load audio.",
      couldntPlay: "This audio file couldn't be played.",
      stop: "Stop {label}",
      play: "Play {label}",
      alreadyPlayed: "{label} already played — it can only be heard once",
      retry: "{error} — tap to retry playing {label}",
      alreadyPlayedTitle: "Already played — it can only be heard once",
      retryTitle: "Couldn't load audio — tap to retry",
      stopLine: "Stop line by {speaker}",
      playLine: "Play line by {speaker}",
      pronunciation: "pronunciation of {word}",
      example: "example {text}",
      conversation: {
        play: "Play conversation",
        pause: "Pause conversation",
        seek: "Seek conversation audio",
        unavailable: "Conversation audio unavailable",
      },
    },
    situation: { title: "Situation", conversation: "Conversation" },
    dialogue: { title: "Dialogue" },
    comprehension: {
      title: "Comprehension",
      listenFirst: "Listen before you read",
      listenDescription:
        "Play the conversation and see how much you understand by ear — the questions (and the Chinese text) show up once you're ready.",
      ready: "I'm ready for the questions",
      error: "Couldn't check your answers right now. Please try again.",
      emptyTitle: "Nothing to check yet",
      emptyDescription: "This lesson doesn't have comprehension questions.",
    },
    grammar: {
      title: "Grammar",
      explanation: "Explanation",
      examples: "Examples",
      practice: "Practice",
      commonMistake: "Common mistake: {mistake}",
      noPractice: "No practice questions available right now.",
      screenProgress: "Question {current} of {total}",
    },
    vocabulary: {
      title: "Vocabulary",
      introduction: "Here are the words you'll need for this lesson.",
      listenToHan: "Listen to Han",
      pauseHan: "Pause Han",
      voiceUnavailable: "Voice unavailable",
      empty: "No vocabulary in this lesson.",
      alreadyKnow: "Already know these {count} words?",
      quickTestDescription:
        "Take a quick test — score {threshold}%+ and skip straight to Grammar. Anything you miss, you'll practice properly right after.",
      quickTest: "Quick test",
      normalWalkthrough: "Normal walkthrough",
      quickTestProgress: "Quick test progress",
      finishQuickTest: "Finish quick test",
      wordProgress: "Word progress",
      questionProgress: "Question {current} of {total}",
      example: "Example",
      noExamples: "No examples available.",
      whatDoesMean: "What does {word} mean?",
      whichWordMeans: "Which word means “{meaning}”?",
      completeSentence: "Complete the sentence",
      nextWord: "Next word",
      correctAnswer: "{option} (correct answer)",
      incorrectAnswer: "{option} (your answer, incorrect)",
      orderSentence: "Put the sentence in order",
      tapInOrder: "Tap the words below in the right order.",
      correctOrder: "Correct order: {order}",
    },
    guidedPractice: {
      title: "Guided Practice",
      emptyTitle: "Nothing to practice yet",
      emptyDescription: "This lesson doesn't have guided practice exercises.",
    },
    writing: {
      title: "Writing",
      description:
        "You'll practice writing sentences from this lesson with AI feedback.",
      comingIn: "the Writing Lab",
    },
    placeholder: {
      comingIn: "Coming in {area}",
      description:
        "This step is a placeholder for now — it will become fully interactive once that phase is built.",
    },
    quiz: {
      title: "Quiz",
      emptyTitle: "No quiz yet",
      emptyDescription: "This lesson doesn't have a quiz.",
      questions: "{count} questions",
      start: "Start Quiz",
      results: "Quiz Results",
      score: "{correct} of {total} correct — {score}%",
      retry: "Retry Quiz",
      finish: "Finish Quiz",
    },
    mission: {
      title: "Mission",
      emptyTitle: "No mission yet",
      emptyDescription: "This lesson doesn't have a mission.",
      retry: "Retry",
      done: "Done",
      end: "End Mission",
      roles: "You play {learner}. The AI plays {ai}.",
      learnerFallback: "the learner",
      aiFallback: "the other role",
      success: "Success looks like",
      start: "Start Mission",
      ready: "Start the conversation whenever you're ready.",
      thinking: "Thinking...",
      retryMessage: "Retry",
      responsePlaceholder: "Type your response in Chinese...",
      yourMessage: "Your message",
      sendMessage: "Send message",
      reportDimensions: {
        communicationSuccess: "Communication success",
        taskCompletion: "Task completion",
        vocabularyUsage: "Vocabulary usage",
        grammarUsage: "Grammar usage",
        clarity: "Clarity",
      },
      successConditions: "Success conditions",
      notes: "Notes",
      recommendedNextStep: "Recommended next step",
    },
    exercise: {
      answerPlaceholder: "Type your answer",
      answerLabel: "Your answer",
      responsePlaceholder: "Write your response",
      responseLabel: "Your response",
      tapInOrder: "Tap the words below in the right order.",
    },
    speaking: {
      title: "Speaking",
      description:
        "Have a new, unscripted conversation in the lesson's scenario. You can explore naturally; your partner will help guide the conversation back to the goal.",
      hideHelp: "Hide help",
      needHelp: "Need help?",
      helpLabel: "Conversation help",
      yourGoal: "Your goal",
      questions: "Questions you can ask",
      usefulPhrases: "Useful things to say",
      grammar: "Grammar to use",
      vocabulary: "Lesson vocabulary",
      helpTip:
        "Choose one short phrase for your next turn. Adapt it to the conversation instead of reading the whole list.",
      testFinished: "Test conversation finished",
      saved: "Conversation saved",
      testTurns:
        "{count} transcribed turns were captured for this test only. They were not added to Progress or Reflection.",
      reflectionTurns:
        "{count} transcribed turns will be used in your Reflection feedback.",
      testNextLesson: "Test next lesson",
      microphoneUnavailable:
        "Microphone unavailable — continue the same role-play by text.",
      useText: "Use text instead",
    },
    reflection: {
      title: "Reflection",
      loading: "Putting your report together...",
      error:
        "Couldn't put together your report right now. You can still finish the lesson below.",
      finishLesson: "Finish Lesson",
      holdBreakdown: "{label} — press and hold for a breakdown",
      loadingBreakdown: "Loading breakdown…",
      nothingGraded: "Nothing graded yet for {noun}.",
      breakdown: "{correct} of {total} {noun} correct ({missed} missed)",
      finalScore:
        "Your final score is {final}/100: your 5 core skills averaged {average}/100, but you only used {vocabulary}% of the target vocabulary and completed {objective}% of the objective — those two percentages multiply the average down ({average} × {vocabulary}% × {objective}% ≈ {final}) rather than just lowering it a little, which is why the final score is so far below the core skills average.",
      niceWork: "Nice work today",
      keepPracticing: "Keep practicing",
      passScore: "/ 100 — {score}+ to pass",
      dayStreak: "{count}-day streak",
      learned: "What you learned",
      vocabulary: "Vocabulary",
      comprehension: "Comprehension",
      grammar: "Grammar",
      speaking: "Speaking",
      wordsExplored: "{covered}/{total} words explored",
      quizQuestions: "quiz questions",
      exercises: "exercises",
      speakingRequirement:
        "Reaching 30/30 needs strong vocabulary use and a fully completed objective, not just fluent conversation.",
      speakingIssues:
        "{count} specific {issues} identified in this conversation.",
      issue: "issue",
      issues: "issues",
      noSpeakingEvaluation: "No speaking evaluation yet.",
      dimensions: {
        pronunciation: "Pronunciation",
        fluency: "Fluency",
        accuracy: "Accuracy",
        lessonLanguage: "Lesson language",
        communication: "Communication",
        vocabularyUsed: "Vocabulary used",
        objectiveCompleted: "Objective completed",
      },
      evaluationUnavailable:
        "Speaking evaluation is temporarily unavailable. Reopen Reflection to retry.",
      notEnoughData:
        "Not enough data yet — practice in the Speaking step to see your score here.",
      speakingErrors: "Speaking errors",
      transcriptSaved:
        "Your transcript was saved, but automatic evaluation is temporarily unavailable. Reopen Reflection to retry.",
      longerConversation:
        "Complete a longer Speaking conversation to receive specific feedback here.",
      noErrors:
        "No specific speaking errors were detected in the available evidence.",
      recommendedNextStep: "Recommended next step",
      noteFromHan: "A note from Han",
      wentWell: "What went well",
      improve: "What to improve",
    },
    results: {
      loading: "Loading your results...",
      error: "Couldn't load your results right now.",
      tryAgainTitle: "Try this lesson again?",
      tryAgainDescription:
        "This clears your progress and score for this lesson so you can attempt it fresh. Your new result will replace this one — it won't stack on top of it.",
    },
    rewards: {
      title: "What you earned",
      experienceEarned: "+{amount} experience",
      experienceTitle: "Experience",
      coinsEarned: "+{amount} HanCoins",
      coinsBalance: "{balance} in total",
      coinsNone: "HanCoins",
      rankTitle: "Your rank",
      rankValue: "#{rank} of {total}",
      achievementsTitle: "Achievements",
      achievementsValue: "{unlocked} of {total}",
    },
  },
  shell: {
    primaryNavigation: "Primary navigation",
    mobileNavigation: "Primary navigation (mobile)",
    learnerProfile: "Learner profile",
    todayGoal: "Today's goal",
    userMenu: "User menu",
    administrator: "Administrator",
    logOut: "Log out",
    navigation: {
      dashboard: { label: "Dashboard", mobile: "Home" },
      learning: { label: "Learning", mobile: "Learning" },
      learningJourney: { label: "Learning Journey", mobile: "Journey" },
      speakingLab: { label: "Speaking Lab", mobile: "Speaking" },
      writingLab: { label: "Writing Lab", mobile: "Writing" },
      han: { label: "Han", mobile: "Han" },
      hanTutor: { label: "Han Tutor", mobile: "Tutor" },
      hanCompanion: { label: "Han Companion", mobile: "Companion" },
      hanVocabulary: { label: "Han Vocabulary", mobile: "Vocabulary" },
      progress: { label: "Progress", mobile: "Progress" },
      shop: { label: "Shop", mobile: "Shop" },
      leaderboard: { label: "Leaderboard", mobile: "Ranking" },
      settings: { label: "Settings", mobile: "Settings" },
    },
    theme: {
      change: "Change theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    hanCoins: {
      balance: "You have {balance}",
      description:
        "Spend them in the Shop on hats, glasses, and clothes for your avatar.",
      earnTitle: "How to earn them",
      sources: {
        daily: {
          title: "Open the app",
          detail: "Once per day, just for showing up",
        },
        lesson: {
          title: "Complete a lesson",
          detail: "1, 2, or 3 HanCoins, based on your score",
        },
        scenario: {
          title: "Finish a scenario for the first time",
          detail: "Once per scenario, not on a redo",
        },
        achievement: {
          title: "Unlock an achievement",
          detail:
            "Streaks, General Level tiers, mastery, whole Chapters, and more",
        },
        leaderboard: {
          title: "Top 3 on the weekly leaderboard",
          detail: "Ranked by HanCoins earned that week",
        },
      },
      earnedOnly: "Never purchasable with real money — always earned.",
    },
    achievementCelebration: {
      unlocked: "Achievement unlocked",
      next: "Next ({count} more)",
      nice: "Nice!",
    },
    announcements: {
      eyebrow: "What's new in HanGo",
      next: "Next",
      understood: "Got it",
    },
    feedback: {
      open: "Feedback",
      title: "Help us improve HanGo",
      description:
        "Tell us what happened or what would make learning better. This usually takes less than a minute.",
      categoryLabel: "What kind of feedback is this?",
      categories: {
        bug: "Something isn't working",
        idea: "I have an idea",
        confusing: "Something was confusing",
        lessonContent: "Lesson content",
        han: "Han Tutor, Han Companion, or Speaking Lab",
        other: "Other comment",
      },
      ratingLabel: "How is your experience so far?",
      optional: "Optional",
      ratingAria: "{rating} out of 5",
      messageLabel: "Tell us more",
      messagePlaceholder: "Describe what happened or share your idea…",
      send: "Send feedback",
      successTitle: "Thank you!",
      successMessage: "We received it and will review it soon.",
      sendAnother: "Send another comment",
      recentTitle: "Your recent reports",
      noRecent: "You haven't sent any feedback yet.",
      responseLabel: "HanGo reply",
      statuses: {
        new: "Received",
        reviewing: "Reviewing",
        resolved: "Resolved",
      },
      errors: {
        invalid: "Choose a category and tell us a little more.",
        rateLimited:
          "You've sent several reports today. Please try again tomorrow.",
        unauthorized: "Please sign in again before sending feedback.",
        generic: "We couldn't send this right now. Please try again.",
      },
    },
    coinCelebration: {
      received: "You received HanCoins!",
      continue: "Continue",
      earned: "Earned",
      reasons: {
        lessonCompleted: "Lesson completed",
        scenarioCompleted: "Scenario completed",
        achievementUnlocked: "Achievement unlocked",
        weeklyLeaderboard: "Weekly leaderboard bonus",
        dailyLogin: "Daily login",
      },
    },
  },
  onboarding: {
    progress: { step: "Step", of: "of" },
    common: { back: "Back", continue: "Continue" },
    welcome: {
      title: "Meet Han",
      description:
        "Your teacher for this whole journey. A few quick questions first, so lessons can be tailored to you.",
      features: [
        {
          title: "Explains as you go",
          description: "Ask Han anything, anytime — text or voice.",
        },
        {
          title: "Talks with you",
          description: "Practice real conversations out loud, not just typing.",
        },
        {
          title: "Keeps your streak alive",
          description: "A nudge before you lose it.",
        },
      ],
      action: "Get started",
    },
    appearance: {
      title: "How would you like HanGo to look?",
      description:
        "Pick whichever is easier on your eyes to study with. You can change it anytime from Settings.",
      light: "Light",
      dark: "Dark",
      system: "Match my device",
    },
    profile: {
      title: "What should Han call you?",
      description:
        "Your name is what Han calls you — you can change it anytime. Your Account Name is what other learners see on the leaderboard, and it's permanent once you set it.",
      displayName: "Your name",
      displayNamePlaceholder: "What Han calls you",
      accountName: "Account Name",
      accountNamePlaceholder: "For the leaderboard",
      accountNameHint:
        "Letters, numbers, and underscores only. Permanent — choose carefully.",
    },
    avatar: {
      title: "Choose your avatar",
      description:
        "Pick a zodiac animal to represent you. It's just for fun — you can change it anytime, and it never affects your progress.",
      comingSoon: "Coming soon",
      animalNames: {
        RABBIT: "Rabbit",
        MONKEY: "Monkey",
        DOG: "Dog",
        TIGER: "Tiger",
        OX: "Ox",
        RAT: "Rat",
        DRAGON: "Dragon",
        SNAKE: "Snake",
        HORSE: "Horse",
        GOAT: "Goat",
        ROOSTER: "Rooster",
        PIG: "Pig",
      },
    },
    goal: {
      title: "What's your learning goal?",
      selectAll: "Select all that apply.",
      options: {
        speakConfidently: "Speak confidently",
        hskPreparation: "Prepare for HSK",
        travel: "Travel",
        work: "Work",
        study: "Study",
        personalInterest: "Personal interest",
      },
      reactions: {
        speakConfidently: "Nice — we'll get you talking early and often.",
        hskPreparation: "Got it — we'll keep your HSK level front and center.",
        travel: "Perfect for ordering food, asking directions, all of it.",
        work: "We'll focus on the Chinese you'll actually use at work.",
        study: "We'll build a strong foundation for your studies.",
        personalInterest: "Learning for the love of it — my favorite kind.",
      },
    },
    level: {
      title: "What's your current Chinese level?",
      options: {
        hsk12: "Starting from zero or with the basics",
        hsk3: "Speaking with Ease",
        hsk4: "Easily Understood",
        hsk5: "Handling Real Situations",
        hsk6: "Speaking Like a Professional",
        hsk79: "Nearing Mastery",
        unsure: "Unsure",
      },
    },
    explanationLanguage: {
      title: "Which language should your Teacher use?",
      description: "For explanations — lessons stay in Chinese.",
      options: {
        english: "English",
        spanish: "Spanish",
        chinese: "中文 (Chinese)",
      },
    },
    skills: {
      title: "What do you want to focus on?",
      selectAll: "Select all that apply.",
      options: {
        listening: "Listening",
        speaking: "Speaking",
        reading: "Reading",
        writing: "Writing",
        grammar: "Grammar",
        vocabulary: "Vocabulary",
      },
    },
    dailyTarget: {
      title: "How much time can you study each day?",
      minutes: "min",
    },
    placementOffer: {
      title: "Want a more precise starting point?",
      description:
        "Take a quick placement exam across Vocabulary, Grammar, Reading, Listening, and Speaking — about 10–15 minutes. Every lesson at or below your real level is credited automatically and marked so you can still redo it anytime.",
      skip: "Skip for now",
      takeExam: "Take the placement exam",
    },
    placementExam: {
      title: "Placement Exam",
      unavailable: "No questions are available right now.",
      listeningLabel: "listening passage",
      listeningInstruction:
        "You can only play this once — listen carefully, then answer below. The text isn't shown.",
      groupedListening:
        "Answer every question about this audio, then submit them all together.",
      groupedPassage:
        "Answer every question about this passage, then submit them all together.",
      groupedDefault:
        "Answer every question below, then submit them all together.",
      orderingInstruction: "Tap the words below in the right order.",
      next: "Next",
      resultTitle: "Your placement result",
      resultSummary:
        "{questions} questions · about {minutes} min. Each skill gets its own level because recognizing and producing Chinese are different abilities; this is never a single number.",
      skills: {
        vocabulary: "Vocabulary",
        grammar: "Grammar",
        reading: "Reading",
        listening: "Listening",
        speaking: "Speaking",
      },
      notReached: "Not reached",
      diagnosticTop:
        "The top tier shown here is for your reference only. It doesn't grant real placement or points, since that range is only earned through sustained Lab evidence.",
      diagnosticSpeaking:
        "Your {level} Speaking attempt is diagnostic only. Your credited Speaking placement remains {maximum} or below.",
      creditNote:
        'Every lesson at or below your placed level has been credited with General Level points automatically. Those lessons show a "Placed by exam" badge on the Learning Journey; complete one for real anytime to confirm or improve its score.',
      speaking: {
        evaluating: "Evaluating your speaking",
        evaluatingDescription:
          "Han is checking your fluency, accuracy, complexity, communication, pronunciation evidence, and completion of the scene.",
        title: "Speaking placement · {level}",
        instructions:
          "Have a short, natural conversation in Mandarin. The character will close the scene after it has enough evidence, normally within two to five of your turns.",
        previousBand:
          "Previous band confirmed ({score}/100). Now trying the next level.",
        errorSuffix:
          "Your transcript was kept on this screen; start this level again when you're ready.",
        retry: "Try again",
        evidenceNote:
          "Speak naturally. The character's words never count as your own exam evidence, and {level} remains diagnostic only.",
        dismiss: "Dismiss message",
      },
      levels: {
        "Mastering the Language": "Mastering the Language",
        "Refined Fluency": "Refined Fluency",
        "Nearing Mastery": "Nearing Mastery",
        "Speaking Like a Professional": "Speaking Like a Professional",
        "Handling Real Situations": "Handling Real Situations",
        "Easily Understood": "Easily Understood",
        "Speaking with Ease": "Speaking with Ease",
        "Finding Your Footing": "Finding Your Footing",
        "Getting By": "Getting By",
        "Just Starting Out": "Just Starting Out",
      },
    },
    recommendation: {
      loading: "Finding your starting point...",
      ready: "You're ready to start",
      recommended: "Recommended for you",
      matchingSessions: "Sessions that match your goals",
      start: "Start learning",
    },
    actions: {
      enterName: "Enter your name",
      nameTooLong: "Keep it under 60 characters",
      accountNameTooShort: "At least 3 characters",
      accountNameTooLong: "Keep it under 24 characters",
      accountNameCharacters: "Letters, numbers, and underscores only",
      selectGoal: "Select at least one goal",
      selectSkill: "Select at least one skill",
      chooseDuration: "Choose one of the offered durations",
      nicknameTaken: "That Account Name is taken. Try another one.",
      signInRequired: "You need to be signed in for this.",
      animalUnavailable: "That animal isn't available yet.",
    },
  },
  dashboard: {
    newLearner: {
      welcomeNamed: "Welcome, {name}",
      welcome: "Welcome to HanGo",
      description:
        "Start your first lesson to begin building your Chinese skills.",
      journeyAction: "Go to Learning Journey",
      primerAction: "New to Chinese? Start with a quick cultural primer →",
    },
    titleNamed: "Welcome back, {name}",
    title: "Dashboard",
    hero: {
      continueLearning: "Continue Learning",
      caughtUp: "You're all caught up",
      caughtUpDescription:
        "No active lesson right now — check the Review section below.",
      streak: "{count}-day streak",
      streakOne: "1-day streak",
      streakStart: "Start your streak today",
      goalMet: "Today's {minutes}-min goal met",
      goal: "Today's goal: {minutes} min",
      goalShort: "{minutes} min",
      suggestedNext: "Suggested next:",
      weeklyActivity: "{active} of the last 7 days active",
      experience: "Experience",
      streakRisk:
        "Your {count}-day streak ends today without activity — keep it going.",
      continueAction: "Continue",
      weekdays: ["S", "M", "T", "W", "T", "F", "S"],
    },
    quickActions: {
      speaking: "Speaking practice",
      writing: "Writing practice",
      primer: "Welcome to Chinese",
    },
    journey: {
      title: "Learning Journey",
      progress: "{completed} of {total} lessons complete",
      currentScenario: "Your current scenario",
      scenarioProgress: "{completed} of {total}",
      viewAll: "See the full journey",
      youAreHere: "You are here",
    },
    review: {
      title: "Review Recommendations",
      minutes: "~{minutes} min",
      learnedIn: 'You learned this in "{lesson}"',
      recentMistake: "You got this wrong recently",
      dialogueTitle: "Replay: {title}",
      dialogueReason: 'From "{lesson}" — practice listening again',
      aiTitle: "AI-generated practice",
      aiReason: "Get a fresh practice question from your AI Teacher",
      actions: {
        review: "Review",
        tryAgain: "Try again",
        replay: "Replay",
        start: "Start",
      },
    },
    generalLevel: "Experience",
    yourProgress: "Your progress",
    levels: {
      "Mastering the Language": "Mastering the Language",
      "Refined Fluency": "Refined Fluency",
      "Nearing Mastery": "Nearing Mastery",
      "Speaking Like a Professional": "Speaking Like a Professional",
      "Handling Real Situations": "Handling Real Situations",
      "Easily Understood": "Easily Understood",
      "Speaking with Ease": "Speaking with Ease",
      "Finding Your Footing": "Finding Your Footing",
      "Getting By": "Getting By",
      "Just Starting Out": "Just Starting Out",
    },
    words: {
      title: "Words for you today",
      modalTitle: "Word of the day",
      loading: "Looking up {word}...",
    },
    leaderboard: {
      title: "Leaderboard",
      empty: "No one has earned points yet — be the first.",
      rank: "You're #{rank} of {total}",
    },
    achievements: {
      title: "Achievements",
      unlocked: "{unlocked} of {total} unlocked",
    },
    avatar: {
      title: "Your Avatar",
      choose: "Choose your avatar",
    },
    competency: {
      title: "Competency Summary",
      strong: "Strong",
      focus: "Focus area",
      stages: {
        EXPOSURE: "Exposure",
        PRACTICE: "Practicing",
        FUNCTIONAL: "Developing",
        CONFIDENT: "Confident",
        MASTERY: "Mastered",
      },
      names: {
        LISTENING: "Listening",
        SPEAKING: "Speaking",
        READING: "Reading",
        WRITING: "Writing",
        DAILY_COMMUNICATION: "Daily Communication",
        SOCIAL_COMMUNICATION: "Social Communication",
        TRAVEL_COMMUNICATION: "Travel Communication",
        PROFESSIONAL_COMMUNICATION: "Professional Communication",
        ACADEMIC_COMMUNICATION: "Academic Communication",
      },
    },
    levelUp: {
      label: "Level up",
      message: "You've reached {level}",
    },
    hanTip: {
      title: "Han's tip",
      tips: {
        "measure-words-default":
          "Nouns need a measure word before a number in Mandarin — 一个人 (yí gè rén), not 一人. When you're unsure which one, 个 (gè) is the safest default.",
        "tone-minimal-pairs":
          "Same sound, four different words: 妈 (mā, mother), 麻 (má, hemp), 马 (mǎ, horse), 骂 (mà, to scold). Tones aren't decoration — they're part of the word.",
        "no-verb-conjugation":
          "Mandarin verbs never conjugate. 我吃, 你吃, 他吃 all use the same 吃 (chī) — tense comes from context or time words like 昨天 (yesterday), not the verb itself.",
        "hao-etymology":
          '好 (hǎo, "good") combines 女 (woman) and 子 (child) — many characters are built by pairing two simpler characters for meaning or sound.',
        "le-not-past-tense":
          '了 (le) is one of the trickiest words to place — it doesn\'t mean "past tense." It marks a completed action or a change of state.',
        "third-tone-sandhi":
          "你好 is written with two third tones but spoken as ní hǎo, not nǐ hǎo — when two third tones meet, the first one rises to a second tone.",
        "ta-homophones":
          "他 (he), 她 (she), and 它 (it) are all pronounced tā — spoken Mandarin doesn't distinguish gender here at all, only the written characters do.",
        "number-construction":
          'Numbers above 10 are built logically, not memorized: 十一 (11) is "ten-one," 二十 (20) is "two-ten," 三十五 (35) is "three-ten-five."',
        "qingwen-polite-opener":
          '请问 (qǐngwèn, "may I ask") is how you politely open a question to a stranger — the closest Mandarin equivalent to "excuse me."',
        "water-radical":
          'Characters sharing the 氵radical (a compressed 水, "water") usually relate to liquids: 河 (river), 海 (sea), 汗 (sweat).',
        "no-articles":
          'Mandarin has no words for "a" or "the." 猫 alone can mean "a cat," "the cat," or "cats" — context carries the meaning English puts in articles.',
        "ma-question-particle":
          "Adding 吗 (ma) to the end of any statement turns it into a yes/no question: 你是学生 (you're a student) becomes 你是学生吗? (are you a student?).",
        "ye-dou-before-verb":
          '也 (yě, "also") and 都 (dōu, "all/both") always sit before the verb in Mandarin, not after it like their English equivalents.',
        "number-four-taboo":
          '四 (sì, "four") sounds close to 死 (sǐ, "death"), so it\'s avoided in many Chinese-speaking contexts — some buildings skip a 4th floor entirely.',
        "chi-le-ma-greeting":
          '你吃了吗? ("have you eaten?") is often just a casual greeting between friends, not a real question about your last meal.',
        "yixia-softener":
          'Adding 一下 (yíxià) softens a request — 等一下 ("wait a moment") reads gentler than the bare command 等 ("wait").',
        "xie-radical":
          'The 讠radical (a compressed 言, "speech") marks characters about talking: 说 (speak), 谢 (thank), 请 (invite/please).',
        "svo-word-order":
          'Basic Mandarin word order is closer to English than you\'d expect: Subject-Verb-Object. 我喜欢猫 is literally "I like cats," in that order.',
      },
    },
  },
  speakingLab: {
    common: {
      back: "Back",
      hidePinyin: "Hide pinyin",
      showPinyin: "Show pinyin",
      tryAgain: "Try again",
      finish: "Finish",
      backToLab: "Back to Speaking Lab",
    },
    home: {
      title: "Speaking Lab",
      description:
        "Practice out loud with real feedback, including a tone-match score computed from your own recording.",
      practiceWithHan: "Practice with Han",
      practiceWithHanDescription:
        "Pick any topic, set the level and speed, and have a live spoken conversation built around exactly what you want to practice.",
      testMode: "Speaking test mode",
      testModeDescription:
        "Open the exact Speaking step from any lesson without changing your Learning Journey progress.",
      openTestMode: "Open test mode",
      practiceLesson: "Practice a lesson",
      chooseLesson: "Choose a lesson",
      oneLesson: "1 lesson",
      lessons: "{count} lessons",
      locked: "Locked",
      comingSoon: "Coming soon.",
      unavailable: "Not available yet — no content for this mode.",
      emptyTitle: "Nothing to practice yet",
      emptyDescription:
        "Speaking activities will appear here once lesson content is available.",
      modes: {
        SHADOWING: {
          title: "Shadowing",
          description:
            "Repeat a real conversation or a long passage, with pinyin.",
        },
        SCENARIO_ROLE_PLAY: {
          title: "Scenario Role Play",
          description: "Respond in character to the scenario's mission.",
        },
      },
    },
    beta: {
      eyebrow: "Guided beta practice",
      title: "Practice one real situation at a time",
      description:
        "Listen, follow the characters and pinyin, then repeat each line at your own pace.",
      station: "Station {current} of {total}",
      available: "Ready to practice",
      locked: "Start the related lesson first",
      practiceNow: "Practice now",
      goToLesson: "Start the lesson",
      backToStations: "Back to stations",
      unlockRequirement: "Start “{lesson}” to open this station.",
      unavailableTitle: "This practice is being prepared",
      unavailableDescription:
        "The lesson content for this station isn't available right now.",
      stations: {
        INTRODUCTIONS: {
          title: "Say hello and introduce yourself",
          description:
            "Practice greetings, names and a simple first introduction.",
          outcome: "Greet someone and say who you are.",
        },
        NUMBERS_TIME: {
          title: "Numbers, time and dates",
          description:
            "Build confidence saying numbers, a time and a short date.",
          outcome: "Say a number, a time and a date clearly.",
        },
        PRICES: {
          title: "Ask the price and pay",
          description:
            "Repeat the phrases you need to ask a price and understand the answer.",
          outcome: "Ask how much something costs and respond.",
        },
      },
    },
    picker: {
      title: "Shadowing",
      description: "Choose how you want to practice this lesson's dialogue.",
      conversation: "Conversation",
      conversationDescription:
        "Shadow the lesson's real dialogue, one turn at a time, like a chat.",
      longText: "Long text",
      longTextDescription:
        "Shadow the whole dialogue as one continuous passage, pinyin always shown.",
      unavailableTitle: "Conversation unavailable",
      unavailableDescription:
        "This lesson doesn't have dialogue content to shadow.",
      player: {
        play: "Play conversation",
        pause: "Pause conversation",
        seek: "Seek conversation audio",
        unavailable: "Conversation audio unavailable",
      },
    },
    session: {
      activityTitles: {
        SHADOWING: "Shadowing",
        SCENARIO_ROLE_PLAY: "Scenario Role Play",
      },
      sayOutLoud: "Say the following out loud:",
      respondOutLoud: "Respond out loud in Chinese:",
      colorFeedback: "Characters turn green or red once you finish recording.",
      listenNative: "Listen to native audio",
    },
    recorder: {
      microphoneDenied: "Microphone access denied",
      typeInsteadDescription: "You can type your answer instead.",
      textPlaceholder: "Type what you would say in Chinese",
      yourAnswer: "Your answer",
      submit: "Submit",
      useMicrophone: "Use microphone instead",
      stopRecording: "Stop recording",
      startRecording: "Start recording",
      requestingAccess: "Requesting microphone access...",
      recording: "Recording — {time}",
      analyzingTones: "Analyzing your tones…",
      insufficientAudio: "Not enough voiced audio to score tones.",
      toneMatch: "Tone match: {score}%",
      retry: "Retry",
      typeInstead: "Type instead",
    },
    feedback: {
      heard: "What we heard",
      noSpeech: "(no speech detected)",
      toneMatch: "Tone match: {score}%",
      toneExplanation:
        "Calculated directly from your recording's pitch, not a guess from your transcript.",
      toneUnavailable:
        "Tone match couldn't be measured — not enough voiced audio in the recording.",
      dimensions: {
        pronunciation: "Pronunciation",
        fluency: "Fluency",
        accuracy: "Accuracy",
        complexity: "Complexity",
        communicationEffectiveness: "Communication effectiveness",
      },
      feedback: "Feedback",
      recommendedNext: "Recommended next step",
    },
    shadowing: {
      title: "Shadowing — Conversation",
      progress: "Progress",
      listenLine: "Listen to this line",
      nextLine: "Next line",
      completeOne: "Conversation complete — 1 line practiced.",
      completeMany: "Conversation complete — {count} lines practiced.",
    },
    freePractice: {
      title: "Practice with Han",
      description:
        "Pick a topic and how you want Han to run it — a live spoken conversation, just like the Learning Journey's Speaking step.",
      topic: "Topic",
      topicPlaceholder: "e.g. Talk about my weekend trip to Beijing",
      role: "Who is Han?",
      roleLabel: "Han's role",
      roles: {
        AUTO: { label: "Match the topic (default)", display: "Han" },
        FRIEND: { label: "A friend", display: "Han, as a friend" },
        COLLEAGUE: { label: "A colleague", display: "Han, as a colleague" },
        STRANGER: { label: "A stranger", display: "Han, as a stranger" },
        INTERVIEWER: {
          label: "A job interviewer",
          display: "Han, as a job interviewer",
        },
      },
      level: "Level",
      useProfileLevel: "Use my profile level",
      speed: "Speed",
      paces: { slow: "Slow", normal: "Normal", fast: "Fast" },
      correctionQuestion: "When should Han correct me?",
      corrections: {
        scene: {
          label: "Stay in the scene",
          description:
            "Han stays fully in character in Mandarin — feedback only at the end (default).",
        },
        tutor: {
          label: "Correct me as we talk",
          description:
            "Han briefly explains pronunciation, tone, or grammar mistakes right when they happen.",
        },
      },
      extra: "Anything else? (optional)",
      extraPlaceholder:
        "e.g. Be more formal. Focus on restaurant vocabulary. Correct my tones when I finish.",
      extraLabel: "Additional instructions",
      start: "Start conversation",
      useText: "Use text instead",
      microphoneUnavailable:
        "Microphone unavailable — practice this topic by text instead.",
      complete: "Conversation complete",
      gettingFeedback: "Getting your feedback…",
      tooShort:
        "That conversation was too short to score — try again and speak a bit more.",
      retryFeedback: "Try getting feedback again",
      transcriptTitle: "Live conversation about: {topic}",
    },
    testHarness: {
      eyebrow: "Temporary local QA tool",
      title: "Speaking test mode",
      description:
        "Test the exact real-time Speaking step without changing lesson progress, scores, or Reflection.",
      exit: "Exit test mode",
      lessonCount: "Lesson {current} of {total}",
      previous: "Previous",
      next: "Next",
      objective: "Objective: {objective}",
      noMission: "No Speaking mission is configured.",
    },
    errors: {
      notAuthenticated: "You need to be signed in for this.",
      feedbackRateLimit:
        "You've requested feedback a lot recently. Please wait a bit.",
      feedbackFailed: "Something went wrong generating feedback.",
      attemptRateLimit:
        "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.",
      emptyResponse: "Your response can't be empty.",
      responseTooLong: "Your response is too long (maximum {max} characters).",
      recordingTooLarge: "The recording is too large.",
      recordingTooLong: "The recording is too long (maximum 5 minutes).",
      unsupportedRecording: "That recording format isn't supported.",
      submitFailed:
        "Something went wrong submitting your attempt. Please try again.",
      repeatSpeech:
        "I couldn't recognize that as Spanish, English, or Mandarin. Please say it again.",
    },
  },
  writingLab: {
    common: {
      back: "Back",
      submit: "Submit",
      tryAgain: "Try again",
      done: "Done",
      rewrite: "Rewrite",
    },
    home: {
      title: "Writing Lab",
      paragraphTitle: "Write a Paragraph",
      paragraphDescription:
        "Write Chinese by hand, upload 1–3 photos, and get level-appropriate feedback.",
      translationTitle: "Translation Challenge",
      translationDescription:
        "Translate one of {count} short texts into Chinese.",
      translationDescriptionFallback:
        "Translate one of several short texts into Chinese.",
      customTitle: "Custom Writing",
      customDescription: "Set your own topic, level, format, and tone.",
      recentAttempts: "Recent attempts",
      customAttemptTitle: "Custom writing",
    },
    translation: {
      description:
        "Pick a text, translate it into Chinese, and Han will tell you how accurate it was and what to improve.",
      emptyTitle: "Nothing to practice yet",
      emptyDescription:
        "Translation texts will appear here once content is available.",
    },
    custom: {
      description:
        "Set your own topic, level, format, and tone — Han grades your writing against exactly what you asked for.",
      topic: "Topic",
      topicPlaceholder: "e.g. Write about a memorable trip you took",
      level: "Level",
      useProfileLevel: "Use my profile level",
      profileLevel: "Your profile level",
      format: "Format",
      formats: {
        short: "Short message",
        paragraph: "Paragraph",
        practical: "Practical writing",
        essay: "Essay",
      },
      tone: "Tone",
      tones: { casual: "Casual", formal: "Formal" },
      extra: "Anything else? (optional)",
      extraPlaceholder:
        "e.g. Focus on restaurant vocabulary. Use at least one time expression.",
      extraLabel: "Additional instructions",
      start: "Start writing",
      writingPlaceholder: "Write your response in Chinese",
      writingLabel: "Your writing",
    },
    editor: {
      placeholder: "Write your response in Chinese",
      label: "Your writing",
      saving: "Saving...",
      saveFailed: "Couldn't save — check your connection",
      unsaved: "Unsaved changes",
      saved: "Saved",
      loadingDraft: "Loading your draft.",
    },
    feedback: {
      yourResponse: "Your response",
      correctedVersion: "Corrected version",
      dimensions: {
        grammar: "Grammar",
        vocabulary: "Vocabulary",
        naturalness: "Naturalness",
        communicationClarity: "Communication clarity",
      },
      importantChanges: "Important changes",
      notes: "Notes",
    },
    handwritten: {
      description:
        "Write Chinese by hand as separate sentences or one continuous text, then upload clear photos for feedback.",
      chooseLevel: "1. Choose your level",
      chooseTopic: "2. Choose a topic",
      target: "Target: {lineTarget} ({characterTarget}).",
      uploadTitle: "3. Upload your handwriting",
      uploadDescription:
        "Upload 1–3 photos in page order. Use bright, even light and keep the whole text in focus.",
      retakeTitle: "Please retake the photo",
      unreadableSuffix:
        "No score was created. Replace the unclear photo and submit again when ready.",
      photoAlt: "Handwritten page {page}",
      page: "Page {page}",
      removePage: "Remove page {page}",
      preparingPhotos: "Preparing photos…",
      addPhotos: "Add photos",
      supportedPhotos: "JPG, PNG, or WebP · up to {max} pages total",
      evaluate: "Evaluate my handwriting",
      evaluationNote:
        "Han first checks photo quality. A paid evaluation is sent only when you press this button, and failed calls are never retried automatically.",
      feedbackTitle: "Your handwriting feedback",
      tryAnotherTopic: "Try another topic",
      levels: {
        BASIC: {
          label: "Basic",
          lineTarget: "About 5–6 handwritten lines",
          characterTarget: "About 60–90 Chinese characters",
        },
        INTERMEDIATE: {
          label: "Intermediate",
          lineTarget: "About 6–20 handwritten lines",
          characterTarget: "About 90–300 Chinese characters",
        },
        ADVANCED: {
          label: "Advanced",
          lineTarget: "20+ handwritten lines",
          characterTarget: "300+ Chinese characters",
        },
      },
      topics: {
        FAMILY: {
          label: "Family",
          prompts: {
            BASIC:
              "Introduce people in your family and write one simple fact about them.",
            INTERMEDIATE:
              "Describe your family, your relationships or routines, and one shared experience.",
            ADVANCED:
              "Discuss how family relationships, responsibilities, or values have influenced you.",
          },
        },
        ROUTINE: {
          label: "Daily routine",
          prompts: {
            BASIC:
              "Describe what you do from morning to evening. You can include times.",
            INTERMEDIATE:
              "Describe your routine, explain why you organize it that way, and mention a change.",
            ADVANCED:
              "Analyze how your routine affects your productivity or well-being and propose improvements.",
          },
        },
        SHOPPING: {
          label: "Shopping",
          prompts: {
            BASIC:
              "Describe something you buy, where you buy it, and details such as quantity, color, or price.",
            INTERMEDIATE:
              "Describe a shopping experience, compare options, and explain your final choice.",
            ADVANCED:
              "Discuss a purchasing decision considering price, quality, needs, and consumer habits.",
          },
        },
      },
      feedback: {
        overallScore: "Overall score",
        characterCount: "{count} Chinese characters",
        targetRange: "Target: {range}",
        charactersToImprove: "Characters to improve",
        cohesion: "Cohesion",
        specificFeedback: "Specific feedback",
        errorTypes: {
          character: "Character formation",
          grammar: "Grammar",
          vocabulary: "Vocabulary",
        },
        dimensionLabels: {
          legibility: "Legibility and character formation",
          topicFulfillment: "Topic fulfillment and target length",
          sentenceConstruction: "Sentence construction",
          grammar: "Grammar",
          vocabulary: "Vocabulary",
          clarity: "Clarity of meaning",
          cohesion: "Cohesion and transitions",
          naturalness: "Naturalness",
          contentDepth: "Depth and development",
          lexicalPrecision: "Lexical precision and register",
          organization: "Cohesion and organization",
          style: "Naturalness and style",
        },
        correctedVersion: "Corrected version",
        noteFromHan: "A note from Han",
        strokeOrderDisclaimer:
          "Stroke order cannot be verified from a static photo; this score assesses only the final visible result.",
      },
    },
    errors: {
      notAuthenticated: "You need to be signed in for this.",
      attemptRateLimit:
        "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.",
      topicEmpty: "Topic can't be empty.",
      responseEmpty: "Response can't be empty.",
      responseTooLong: "Response is too long (maximum {max} characters).",
      submitFailed:
        "Something went wrong submitting your writing. Please try again.",
      browserPhotoFailed: "This browser could not prepare the photo.",
      photoFailed: "This photo could not be prepared.",
      photoTooLarge: "{name} is too large. Choose a photo under 15 MB.",
      photoTooSmall: "{name} is too small to read Chinese characters clearly.",
      photoCompressionFailed:
        "{name} could not be compressed enough. Try a closer crop.",
      tooManyPhotos: "You can upload up to {max} photos in one submission.",
      photoFormats: "Use JPG, PNG, or WebP photos.",
      photoPreparationFailed: "The photos could not be prepared.",
      photoEvaluationFailed: "The photos could not be evaluated.",
      photoSendFailed:
        "The photos could not be sent. Check your connection and try again when ready.",
      unauthorized: "You need to be signed in for this.",
      invalidSubmission: "The photo submission is not valid.",
      invalidLevelTopic: "Choose a valid level and topic.",
      invalidPhotoCount: "Upload between 1 and 3 photos.",
      invalidPhoto:
        "Use clear JPG, PNG, or WebP photos no larger than 2 MB each.",
      invalidImage: "One of the selected files is not a valid image.",
      handwrittenRateLimit:
        "You've submitted several photo evaluations. Please wait a few minutes before trying again.",
      featureUnavailable: "This feature isn't available for your account.",
      dailyLimit:
        "You've reached today's usage limit for this feature. Please try again tomorrow.",
      evaluationNotConfigured: "Handwriting evaluation is not configured.",
      photosUnclear:
        "The photos are not clear enough to assess. Please retake them.",
      evaluationIncomplete: "The evaluation was incomplete.",
      evaluationUnavailable: "The photos could not be evaluated right now.",
      evaluationGeneric:
        "Something went wrong evaluating your photos. Please try again when ready.",
    },
  },
  /**
   * Guided tour (2026-09-23, stage 1 skeleton). Han narrates in the first
   * person throughout - he is the one showing the learner around, so this
   * is his voice, not the product's.
   */
  tour: {
    common: {
      ariaLabel: "Guided tour",
      progress: "{current} of {total}",
      start: "Show me",
      notNow: "Not right now",
      next: "Next",
      back: "Back",
      skip: "Skip the tour",
      finish: "Start studying",
      showTheRest: "Show me the rest",
      laterFromSettings: "You can see this later from Settings",
      gotIt: "Got it",
    },
    welcome: {
      eyebrow: "Your teacher",
      title: "Hi, I'm Han",
      body: "This is where you'll learn real Mandarin: from your first 你好 to holding a conversation. Let me show you around in about a minute.",
    },
    nextStep: {
      eyebrow: "Your next step",
      body: "This is the only thing you need to look at to get started. I pick your next lesson and leave it right here, ready.",
    },
    streak: {
      eyebrow: "Your streak",
      body: "These are the days you've practised this week. The streak counts days in a row — what I care about is the habit, not the score.",
    },
    experience: {
      eyebrow: "Experience",
      body: "It goes up every time you finish a lesson. It measures how much Chinese you've actually covered, not how long you sat in here.",
    },
    words: {
      eyebrow: "Words and a tip",
      body: "Every day I leave you new words at your level, and just below, one short tip. Tap a word to see its meaning and examples.",
    },
    bubble: {
      eyebrow: "I'm on every screen",
      body: "See that bubble? That's me. If something doesn't click — a word, a rule, why you got an answer wrong — tap me and ask. Write in your own language.",
    },
    navigation: {
      eyebrow: "You know the basics now",
      body: "Everything else lives down here. Want me to show you the rest of the app? One more minute — or we leave it for whenever you like.",
    },
    sections: {
      journey: {
        eyebrow: "Your learning journey",
        body: "It has three chapters: Foundations starts from zero, Everyday Life is eating out and travelling, and Advanced Situations is work and negotiation. Press here, under Learning, and open Learning Journey.",
      },
      writing: {
        eyebrow: "Writing Lab",
        body: "The same menu holds the Writing Lab: translate sentences, write freely, or write a paragraph by hand and I'll correct it. Speaking Lab is there too, with three guided stations for listening and repeating with characters and pinyin. Press here again and pick Writing Lab.",
      },
      han: {
        eyebrow: "This is where I live",
        body: "I do three things: as tutor I explain in writing, as companion I talk with you only in Chinese, and as lookup I give you the meaning of any word. Press here to see them.",
      },
      progress: {
        eyebrow: "Progress",
        body: "In there you see where you're strong and where you're not: listening, speaking, reading and writing. And below, what's worth reviewing before it slips away. Press here.",
      },
      shop: {
        eyebrow: "HanCoins and the Shop",
        body: "HanCoins are earned by studying: showing up daily, finishing lessons, completing situations. You spend them on clothes for your character, and they're never bought with real money. Press here to see the Shop.",
      },
      settings: {
        eyebrow: "And that's everything",
        body: "In Settings, from your user menu on Home, you change the language, the theme, your preferences and my voice. You can replay this introduction from there too. Now: time to study.",
      },
    },
    hints: {
      journey:
        "Your journey has three chapters. Each holds situations, and each situation holds four lessons.",
      scenario:
        "Up top is what you'll be able to do once you finish. Below, its four lessons in order — and at the end the mission: a real conversation where you put it all together.",
      lesson:
        "Every lesson is six steps. The bar up top shows where you are and lets you go back to any step you've already opened.",
      han: "Tutor explains in writing, Companion talks with you in Chinese, and Lookup gives you the meaning of any word.",
      writingLab:
        "Writing outside the journey: translation, free text, or a paragraph written by hand.",
      speakingLab:
        "Practice in three guided stations. Start the related lesson, then listen, follow the characters and pinyin, and repeat each line at your own pace.",
      progress:
        "Here you see where you're strong and where you're not. And below, what's worth reviewing.",
      shop: "HanCoins are earned by studying and spent here. They're never bought with real money.",
      settings:
        "From here you change language, theme, preferences and my voice — and you can replay the introduction.",
    },
    settings: {
      title: "Guided tour",
      description:
        "Han's walkthrough of the app, and the short notes that explain each section the first time you open it.",
      replay: "See the introduction again",
      replayHint: "You'll return to Home and the tour will begin right away.",
      restoreHints: "Bring back the section notes",
      restoreHintsHint: "Each one appears once more, when you next visit it.",
      done: "Done",
    },
  },
  hanVocabulary: {
    backToHan: "Back to Han",
    benefits: [
      "Type a word — in characters or pinyin, your choice",
      "Explained at your real level, automatically",
      "Examples, related words, common mistakes, and more",
      "One lookup, one answer — no manual difficulty picker",
    ],
    lookup: {
      placeholder: "Type a word — 要, or yao — in characters or pinyin",
      inputLabel: "Word or pinyin to look up",
      loading: "Looking up...",
      explain: "Explain",
      hint: "Explained at your real level, automatically — no need to pick one.",
    },
    card: {
      frequency: {
        veryCommon: "⭐ Very common word",
        common: "⭐ Common word",
        lessCommon: "Less common word",
      },
      explanation: "💡 Explanation",
      examples: "📋 Examples",
      related: "🔗 Related",
      mistakes: "⚠️ Common mistakes",
      chineseGloss: "汉 Chinese-only gloss",
      curiosity: "🔍 Curiosity",
    },
    errors: {
      notAuthenticated: "You need to be signed in for this.",
      notFound:
        "Han couldn't find that word. Try rephrasing it or check the spelling.",
      empty: "Type a word or its pinyin.",
      tooLong:
        "That's too long (maximum {max} characters). Try a single word or short phrase.",
      rateLimit:
        "You've looked up a lot of words in a short time. Please wait a bit before continuing.",
      featureUnavailable: "This feature isn't available for your account.",
      dailyLimit:
        "You've reached today's usage limit for this feature. Please try again tomorrow.",
      lookupFailed: "Something went wrong looking that up. Please try again.",
    },
  },
  progress: {
    title: "Progress",
    emptyDescription:
      "Complete your first lesson to begin building your competency profile.",
    startingLevel: "Starting level selected: {level}",
    generalLevel: "Experience",
    generalLevelDescription:
      "Earned from completed scenarios and Lab practice, not self-reported — this is what Han actually adapts to. The max is {max}, not 2000, until Reading Lab launches.",
    weightedAverage: "Learning Journey weighted average",
    recommendedNext: "Recommended next step",
    continueLearning: "Continue Learning",
    competencies: "Competencies",
    vocabularyGrammar: "Vocabulary and Grammar",
    vocabularyEncountered: "Vocabulary items encountered",
    grammarEncountered: "Grammar points encountered",
    scenarioMastery: "Scenario Mastery",
    mastered: "Mastered",
    complete: "{percent}% complete",
    review: "Review",
  },
  achievements: {
    title: "Achievements",
    unlocked: "{unlocked} of {total} unlocked",
    categories: {
      STREAK: "Streaks",
      LEVEL: "General Level",
      MASTERY: "Mastery",
      PROGRESS: "Progress",
      COMMUNITY: "Community",
    },
    items: {
      streak_3: {
        title: "3-Day Streak",
        description: "Studied 3 days in a row.",
      },
      streak_7: {
        title: "Perfect Week",
        description: "Studied 7 days in a row.",
      },
      streak_30: {
        title: "30-Day Streak",
        description: "Studied 30 days in a row.",
      },
      streak_60: {
        title: "60-Day Streak",
        description: "Studied 60 days in a row.",
      },
      streak_100: {
        title: "100-Day Streak",
        description: "Studied 100 days in a row.",
      },
      level_tier_1: {
        title: "Getting By",
        description: 'Reached the "Getting By" General Level tier.',
      },
      level_tier_2: {
        title: "Finding Your Footing",
        description: 'Reached the "Finding Your Footing" General Level tier.',
      },
      level_tier_3: {
        title: "Speaking with Ease",
        description: 'Reached the "Speaking with Ease" General Level tier.',
      },
      level_tier_4: {
        title: "Easily Understood",
        description: 'Reached the "Easily Understood" General Level tier.',
      },
      level_tier_5: {
        title: "Handling Real Situations",
        description:
          'Reached the "Handling Real Situations" General Level tier.',
      },
      level_tier_6: {
        title: "Speaking Like a Professional",
        description:
          'Reached the "Speaking Like a Professional" General Level tier.',
      },
      level_tier_7: {
        title: "Nearing Mastery",
        description: 'Reached the "Nearing Mastery" General Level tier.',
      },
      level_tier_8: {
        title: "Refined Fluency",
        description: 'Reached the "Refined Fluency" General Level tier.',
      },
      level_tier_9: {
        title: "Mastering the Language",
        description: 'Reached the "Mastering the Language" General Level tier.',
      },
      reflection_perfect: {
        title: "Perfect Score",
        description: "Scored 100 on a lesson's Reflection.",
      },
      reflection_three_star_5: {
        title: "Rising Star",
        description: "Scored 90+ on 5 lessons.",
      },
      reflection_three_star_25: {
        title: "Star Performer",
        description: "Scored 90+ on 25 lessons.",
      },
      lessons_10: { title: "10 Lessons", description: "Completed 10 lessons." },
      lessons_50: { title: "50 Lessons", description: "Completed 50 lessons." },
      scenario_first: {
        title: "First Scenario",
        description: "Completed your first scenario.",
      },
      chapter_completed_beginner: {
        title: "Foundations Complete",
        description:
          "Completed every scenario in Foundations with an average Reflection score above 70.",
      },
      chapter_completed_intermediate: {
        title: "Everyday Life Complete",
        description:
          "Completed every scenario in Everyday Life with an average Reflection score above 70.",
      },
      chapter_completed_advanced: {
        title: "Advanced Situations Complete",
        description:
          "Completed every scenario in Advanced Situations with an average Reflection score above 70.",
      },
      curriculum_graduate: {
        title: "Graduate",
        description:
          "Completed Foundations, Everyday Life, and Advanced Situations.",
      },
      speaking_lab_first: {
        title: "First Words",
        description: "Completed your first Speaking Lab session.",
      },
      writing_lab_first: {
        title: "First Draft",
        description: "Completed your first Writing Lab submission.",
      },
      leaderboard_top10: {
        title: "Top 10",
        description: "Reached the top 10 on the leaderboard.",
      },
      leaderboard_rank1: {
        title: "#1 on the Leaderboard",
        description: "Reached #1 on the leaderboard.",
      },
    },
  },
  leaderboard: {
    title: "Leaderboard",
    description:
      "Ranked by General Level points — everyone with an Account Name is included automatically.",
    weeklyBonus: "Weekly bonus in {time}",
    weeklyBonusNow: "any moment now",
    weeklyPrize: "Top 3 this week win 50 / 30 / 10 HanCoins",
    yourRank: "Your rank",
    rankOf: "of {total}",
    points: "pts",
    joinPrompt:
      "Complete a lesson to earn General Level points and join the leaderboard.",
    empty: "No one has earned points yet — be the first.",
    you: "you",
    spotsAwayOne: "Keep going — you're 1 spot away from the top {top}.",
    spotsAwayMany: "Keep going — you're {count} spots away from the top {top}.",
    keepLearning: "Keep learning to climb the ranks →",
  },
  shop: {
    title: "Your Avatar",
    description:
      "Customize your character with HanCoins earned from real progress.",
    tabs: { ANIMAL: "Animal", HEAD: "Head", FACE: "Face", TORSO: "Torso" },
    noAvatar: "No avatar yet",
    wearing: "Wearing: {items}",
    nothingEquipped: "Nothing equipped yet",
    comingSoon: "Coming soon",
    rarity: { COMMON: "Common", SPECIAL: "Special", LIMITED: "Limited" },
    equipped: "Equipped",
    equip: "Equip",
    previewing: "Previewing",
    animalNames: {
      RABBIT: "Rabbit",
      MONKEY: "Monkey",
      DOG: "Dog",
      TIGER: "Tiger",
      OX: "Ox",
      RAT: "Rat",
      DRAGON: "Dragon",
      SNAKE: "Snake",
      HORSE: "Horse",
      GOAT: "Goat",
      ROOSTER: "Rooster",
      PIG: "Pig",
    },
    accessoryNames: {
      cap: "Casual Cap",
      "bamboo-hat": "Bamboo Hat",
      "red-beanie": "HanGo Red Beanie",
      "traditional-hairstyle": "Traditional Hairstyle",
      "round-glasses": "Round Glasses",
      "gold-sunglasses": "Gold Sunglasses",
      "square-glasses": "Square Glasses",
      "festival-red-glasses": "Festival Red Glasses",
      polo: "HanGo Polo",
      "tang-jacket": "Tang Jacket",
      "varsity-jacket": "HanGo Varsity Jacket",
      "modern-hanfu": "Modern Hanfu",
    },
    actions: {
      signInRequired: "You need to be signed in for this.",
      insufficientCoins: "Not enough HanCoins for this yet.",
      alreadyOwned: "You already own this.",
      accessoryNotFound: "That accessory doesn't exist.",
      purchaseFailed: "Couldn't complete the purchase. Please try again.",
      notOwned: "You don't own this yet.",
      equipFailed: "Couldn't equip that. Please try again.",
    },
  },
  settings: {
    title: "Settings",
    sections: {
      profile: "Profile",
      avatar: "Avatar",
      learning: "Learning",
      han: "Han",
      appearance: "Appearance",
      privacy: "Privacy",
      support: "Help and support",
      account: "Account",
    },
    displayName: {
      label: "Name",
      placeholder: "What Han calls you",
      save: "Save",
    },
    accountName: {
      label: "Account Name",
      permanent: "Shown on the leaderboard. Permanent — it can't be changed.",
      placeholder: "A unique handle for the leaderboard",
      hint: "Letters, numbers, and underscores only. You can only set this once — choose carefully.",
      set: "Set Account Name",
    },
    avatar: {
      none: "No avatar chosen yet",
      manage: "Manage →",
    },
    learning: {
      saved: "Saved.",
      interfaceLanguage: "Interface language",
      explanationLanguage: "Han fallback explanation language",
      learningGoals: "Learning goals",
      skillPriorities: "Skill priorities",
      dailyTarget: "Daily study target",
      minutes: "{minutes} minutes",
      correctionStyle: "Correction style",
      save: "Save",
      languages: {
        english: "English",
        spanish: "Español",
        chinese: "中文 (Chinese)",
      },
      goals: {
        speakConfidently: "Speak confidently",
        hskPreparation: "Prepare for HSK",
        travel: "Travel",
        work: "Work",
        study: "Study",
        personalInterest: "Personal interest",
      },
      skills: {
        listening: "Listening",
        speaking: "Speaking",
        reading: "Reading",
        writing: "Writing",
        grammar: "Grammar",
        vocabulary: "Vocabulary",
      },
      corrections: {
        immediate: "Correct me immediately",
        afterConversation: "Correct me after the conversation",
        onlyImportant: "Only correct important mistakes",
      },
    },
    han: {
      saved: "Saved.",
      saveError: "The settings couldn't be saved. Please try again.",
      previewError: "The voice preview is temporarily unavailable.",
      replies: "Han replies",
      textOnly: "Text only",
      textAndAudio: "Text and audio",
      audioOnly: "Audio only",
      replyDescription:
        "Han always writes the answer internally, whichever mode you pick. Text and audio shows it and plays it aloud automatically; Audio only plays it aloud and hides the written reply.",
      voice: "Han's voice",
      voiceName: "Cedar",
      voiceDisclosure:
        "This is an AI-generated voice. OpenAI currently optimizes it primarily for English.",
      preview: "Preview voice",
      save: "Save audio settings",
      memoryLabel: "Remember AI Teacher conversations",
      memoryDescription:
        "When off, the AI Teacher still answers but nothing is saved between messages or sessions.",
    },
    appearance: {
      theme: "Theme",
      description:
        "Light, dark, or match your system — this is the same control as the one in the top bar on every page.",
    },
    privacy: {
      recordingRetention: "Speaking Lab recording retention",
      ariaLabel: "Recording retention",
      forever: "Keep indefinitely",
      never: "Do not keep recordings",
      days7: "7 days",
      days30: "30 days",
      days90: "90 days",
      year: "1 year",
      note: "This applies to Speaking Lab audio only. Transcripts and feedback remain available after a recording is deleted.",
    },
    support: {
      title: "Need help or found a problem?",
      description:
        "Use the Feedback button from any screen, or email us if something completely blocks you.",
      emailLabel: "Email support",
      responseTime:
        "We usually reply within 2 business days during the closed beta.",
    },
    deleteAccount: {
      open: "Delete account",
      title: "Delete your account?",
      description:
        "This permanently deletes your account and all learning data — progress, lesson history, speaking/writing attempts, and AI conversations. This cannot be undone.",
      instruction: "Type {confirmation} to confirm.",
      confirmation: "DELETE",
      ariaLabel: "Confirmation text",
      action: "Permanently delete account",
    },
    actions: {
      enterName: "Enter your name",
      nameTooLong: "Keep it under 60 characters",
      accountNameTooShort: "At least 3 characters",
      accountNameTooLong: "Keep it under 24 characters",
      accountNameCharacters: "Letters, numbers, and underscores only",
      accountNamePermanent:
        "Your Account Name is already set and can't be changed.",
      accountNameTaken: "That Account Name is taken. Try another one.",
      selectGoal: "Select at least one goal",
      selectSkill: "Select at least one skill",
    },
  },
  auth: {
    layout: {
      brandHome: "HanGo home",
      titleBefore: "Learn",
      titleAccent: "Chinese",
      titleAfter: "your way",
      description:
        "Real lessons, AI conversation, and hands-on missions — at your pace, in your language.",
    },
    login: {
      title: "Log in",
      subtitle: "Welcome back to HanGo.",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
      submit: "Log in",
      noAccount: "Don't have an account?",
      register: "Register",
      verified: "Email verified. You can now log in.",
      verificationError:
        "That verification link is invalid or has expired. Please register again.",
    },
    register: {
      title: "Create your account",
      subtitle: "Learn Chinese through real communication.",
      betaNotice:
        "HanGo is currently in a closed beta. Create your account with the same email address that received the invitation.",
      name: "Name",
      email: "Email",
      password: "Password",
      passwordHint: "At least 8 characters",
      terms: "I agree to the Terms of Service and Privacy Policy",
      submit: "Create account",
      existingAccount: "Already have an account?",
      login: "Log in",
      successTitle: "Check your email",
      backToLogin: "Back to login",
    },
    forgotPassword: {
      title: "Reset your password",
      description:
        "Enter your email and we'll send you a link to reset your password.",
      email: "Email",
      submit: "Send reset link",
      successTitle: "Check your email",
      backToLogin: "Back to login",
    },
    resetPassword: {
      title: "Choose a new password",
      password: "New password",
      passwordHint: "At least 8 characters",
      submit: "Update password",
      successTitle: "Password updated",
      goToLogin: "Go to login",
      invalidTitle: "Invalid link",
      invalidDescription:
        "This password reset link is missing required information. Request a new one.",
      requestNew: "Request a new link",
      backToLogin: "Back to login",
    },
    google: {
      continue: "Continue with Google",
      unavailable: "Continue with Google (not configured)",
    },
    actions: {
      invalidCredentials: "Invalid email or password.",
      accountExists:
        "An account with this email already exists. Try logging in instead.",
      accountCreated:
        "Account created. Check your email for a link to verify your account before logging in.",
      accountCreatedDevelopment:
        "Account created. Email delivery is disabled in this development environment, so you can log in now.",
      registrationUnavailable:
        "We couldn't open this registration. Use the email address invited to the beta, or log in if you already have an account.",
      emailUnavailable:
        "We couldn't send the verification email right now. Please try again later.",
      tooManyAttempts:
        "Too many attempts. Wait a few minutes before trying again.",
      invalidEmail: "Enter a valid email address",
      resetSent:
        "If an account exists for that email, we sent a link to reset your password.",
      invalidPassword: "Invalid password",
      invalidReset:
        "This reset link is invalid or has expired. Request a new one.",
      passwordUpdated:
        "Password updated. You can now log in with your new password.",
      nameRequired: "Name is required",
      passwordLength: "Password must be at least 8 characters",
      oauthNotLinked:
        "That Google account's email doesn't match an existing HanGo account with a verified email. Try logging in with your password instead.",
      oauthCancelled: "Google sign-in was cancelled.",
      oauthUnavailable:
        "Google sign-in isn't available right now. Please log in with your email and password.",
      oauthGeneric:
        "We couldn't complete sign-in with Google. Please try again.",
    },
  },
  marketing: {
    skipToContent: "Skip to main content",
    brandHome: "HanGo home",
    navLabel: "Main navigation",
    navHow: "How it works",
    navExperience: "Experience",
    navHan: "Meet Han",
    login: "Log in",
    createAccount: "Create account",
    hero: {
      eyebrow: "Mandarin from zero to advanced",
      titleBefore: "Start from zero. Take your Chinese",
      titleAccent: "as far as you want.",
      description:
        "Learn Mandarin step by step, use it in real situations, and improve your speaking, writing, and vocabulary with an AI Teacher that adapts to your level.",
      primaryCta: "Create my account",
      secondaryCta: "See how it works",
      benefits: [
        "Start with no previous knowledge",
        "Pinyin support",
        "Advance all the way to polished Chinese",
      ],
    },
    startingPoints: {
      eyebrow: "A path for every starting point",
      title:
        "Every level has a different challenge. HanGo shows you what comes next.",
      items: [
        "If you start from zero, you build clear foundations without feeling lost.",
        "If you have studied before, you turn vocabulary and grammar into real responses.",
        "If you already communicate, you work on precision, naturalness, and confidence.",
        "At every level, you always know what to practice next.",
      ],
    },
    motivation: {
      eyebrow: "An experience that is also yours",
      title: "Learn, personalize, and share your progress.",
      description:
        "Motivation grows alongside learning: your character develops with you, Han Vocabulary helps you explore words, and the leaderboard makes your consistency visible.",
      avatarTitle: "Create your character",
      avatarDescription:
        "Choose your animal, earn HanCoins through real progress, and personalize it with accessories that reflect your style.",
      vocabularyMeaning: "persevere · keep going",
      vocabularyTitle: "Learn vocabulary in context",
      vocabularyDescription:
        "Search for a word in characters or pinyin and receive an explanation adapted to your level, with examples and common mistakes.",
      leaderboardLabel: "Weekly leaderboard",
      leaderboardTitle: "Compete on the leaderboard",
      leaderboardDescription:
        "Earn points while you learn, discover your weekly position, and challenge the community through authentic progress.",
    },
    howItWorks: {
      eyebrow: "How it works",
      title: "A path that ends in communication.",
      description:
        "Every part of the system has a distinct purpose. Together, they turn what you understand into something you can say, write, and solve.",
      steps: [
        {
          number: "01",
          title: "Enter a real situation",
          description:
            "Start with a concrete goal: order food, solve a change, or explain a need.",
        },
        {
          number: "02",
          title: "Learn inside the context",
          description:
            "Understand vocabulary and grammar exactly where you will need them.",
        },
        {
          number: "03",
          title: "Practice actively",
          description:
            "Take what you learned into dedicated speaking and writing spaces, with support when you need it.",
        },
        {
          number: "04",
          title: "Show what you can do",
          description:
            "Complete a mission and discover what you mastered and what is worth practicing next.",
        },
      ],
    },
    experience: {
      eyebrow: "One system, clear roles",
      title: "Everything connected. Nothing confused.",
      description:
        "The path organizes your learning. Han guides you. The labs train specific skills. Missions prove whether you can apply what you learned.",
      areas: [
        {
          title: "Learning Journey",
          description:
            "A clear path from the foundations to increasingly demanding scenarios and lessons.",
        },
        {
          title: "AI Teacher",
          description:
            "Ask Han within the context of your level, your lesson, and the mistakes you are working on.",
        },
        {
          title: "Speaking Lab",
          description:
            "Train spoken production in a dedicated space with focused activities and feedback.",
        },
        {
          title: "Writing Lab",
          description:
            "Write your own responses and understand how to make them more correct and natural.",
        },
        {
          title: "Missions",
          description:
            "Use Chinese to solve communication tasks that resemble what happens outside a classroom.",
        },
        {
          title: "Competency Progress",
          description:
            "See what you can already do and receive a useful next action, not only accumulated points.",
        },
      ],
    },
    restaurant: {
      eyebrow: "One situation, real abilities",
      title:
        "You do not learn ‘restaurant.’ You learn how to handle yourself in one.",
      description:
        "A situation connects language, decisions, and practice until you can achieve a concrete result.",
      moments: [
        "Enter and ask for a table",
        "Ask about ingredients",
        "Explain a restriction",
        "Resolve a mistake in the order",
        "Ask for the bill and pay",
      ],
      missionLabel: "Final mission",
      missionTitle: "Fix your order",
      missionDescription:
        "The dish arrived with an ingredient you cannot eat. Explain the problem clearly and request a solution.",
      objectiveLabel: "Communication objective",
      objective: "Explain a restriction and negotiate a change.",
      supportLabel: "Available support",
      support: "Pinyin, translation, hints, and slower audio.",
    },
    han: {
      eyebrow: "Meet Han",
      title: "An AI Teacher that knows the context.",
      description:
        "Han can explain an expression, help you discover why something sounds unnatural, and suggest practice related to what you are learning.",
      benefits: [
        "Explanations in Spanish or English",
        "Support connected to your lesson",
        "Clear, respectful corrections",
        "Recommendations with a reason",
      ],
    },
    why: {
      eyebrow: "Why HanGo",
      title: "Designed to help you advance, not distract you.",
      differences: [
        {
          title: "More than content",
          description:
            "Explanations are part of a path that ends in real use, not another list to memorize.",
        },
        {
          title: "More than a chatbot",
          description:
            "Han does not converse in a vacuum: he can help from the pedagogical context of what you are studying.",
        },
        {
          title: "More than completing lessons",
          description:
            "Progress represents communication abilities: speaking, writing, and solving situations.",
        },
      ],
      advancedQuestion: "Does it work if I already have a good level?",
      advancedAnswer:
        "Yes. The path and Han adapt so you can work on precision, naturalness, and more advanced abilities without returning to content you already master.",
      advancedCta: "Start now",
    },
    finalCta: {
      eyebrow: "From zero to communication",
      title: "Start at your level. Advance with purpose.",
      description:
        "From your first words to more natural conversations and texts, you will always have a clear next step.",
      action: "Create my account",
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "Before you register",
      items: [
        {
          question: "Is it free?",
          answer:
            "Yes, you can start learning with Han without paying. A way to enhance your experience will be available later, but you do not need it to begin.",
        },
        {
          question: "Do I need to know Chinese to start?",
          answer:
            "No. You can create your account without having studied Mandarin before — HanGo finds your real level and starts from there.",
        },
        {
          question: "Is Han an AI?",
          answer:
            "Yes. Han is an artificial-intelligence tutor, not a real person — but he listens, explains, and adapts to you like a good teacher would.",
        },
        {
          question: "What happens to my voice audio?",
          answer:
            "It is used only so Han can understand and respond to you in the moment — nothing else.",
        },
        {
          question: "Does it work on a phone?",
          answer:
            "Yes. It works directly in your phone's browser, with nothing to install.",
        },
      ],
    },
    footer: {
      tagline: "Learn Chinese through real situations.",
      navLabel: "Account links",
      login: "Log in",
      createAccount: "Create account",
    },
    demo: {
      situationLabel: "Real situation",
      restaurant: "At a restaurant",
      level: "At your level",
      tablistLabel: "Demonstration of a HanGo lesson",
      tabs: ["Context", "Practice", "Mission"],
      waiter: "Waiter",
      you: "You",
      greetingTranslation: "Hello, what would you like to eat?",
      orderTranslation: "I want this. Could you make it less spicy?",
      contextNote: "This is how you discover the phrases you will need.",
      practiceLabel: "CONTEXTUAL PRACTICE",
      practiceQuestion: "How would you ask the waiter to make it less spicy?",
      correctFeedback:
        "Correct! “少放辣” means “use less chili” — the most natural way to ask.",
      incorrectFeedback:
        "Almost — with a waiter, “可以少放辣吗？” is clearer and sounds more natural.",
      missionLabel: "MISSION",
      missionDescription:
        "Your dish arrived too spicy. Explain the problem to the waiter and ask for a change.",
      evaluationLabel: "HanGo would evaluate",
      evaluationItems: [
        "Complete the objective",
        "Vocabulary use",
        "How natural it sounds",
      ],
      missionCta: "Practice this mission in HanGo",
      nextStepLabel: "Clear next step",
      nextStep: "Resolve a change to the order",
    },
  },
} as const;
