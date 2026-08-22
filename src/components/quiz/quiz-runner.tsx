"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CardTitle, Body, Caption } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ExerciseItem } from "@/components/exercise/exercise-item";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import {
  startQuizAttemptAction,
  submitQuizAnswerAction,
  completeQuizAttemptAction,
} from "@/lib/actions/quiz-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import type { ExerciseAnswer } from "@/lib/exercise-progress";

type Quiz = LessonWithContent["quizzes"][number];

interface QuizResults {
  score: number;
  totalQuestions: number;
  correctCount: number;
}

/**
 * The Quiz Runtime (7.4): a Quiz Attempt per pass, one QuizAnswer stored
 * per question, a score computed once the attempt is completed, and retry
 * as a fresh attempt (not a mutation of the last one - see
 * src/lib/quiz-progress-data.ts).
 */
export function QuizRunner({
  quiz,
  onFinish,
}: {
  quiz: Quiz;
  onFinish: () => void;
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<QuizResults | null>(null);
  const { setContext } = useAiTeacher();

  async function handleStart() {
    setStarting(true);
    const { attemptId: newAttemptId } = await startQuizAttemptAction(quiz.id);
    setAttemptId(newAttemptId);
    setIndex(0);
    setResults(null);
    setStarting(false);
  }

  if (!attemptId) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle>{quiz.title}</CardTitle>
        <Caption>{quiz.questions.length} questions</Caption>
        <Button
          type="button"
          onClick={handleStart}
          loading={starting}
          className="self-start"
        >
          Start Quiz
        </Button>
      </Card>
    );
  }

  if (results) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle>Quiz Results</CardTitle>
        <Body>
          {results.correctCount} of {results.totalQuestions} correct —{" "}
          {results.score}%
        </Body>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleStart}>
            Retry Quiz
          </Button>
          <Button type="button" onClick={onFinish}>
            Continue
          </Button>
        </div>
      </Card>
    );
  }

  const question = quiz.questions[index]!;
  const isLast = index === quiz.questions.length - 1;

  async function handleSubmit(answer: ExerciseAnswer) {
    const result = await submitQuizAnswerAction(
      attemptId!,
      question.id,
      answer,
    );
    setContext({
      recentLearnerAnswer: {
        prompt: question.prompt,
        wasCorrect: result.isCorrect === true,
      },
    });
    return result;
  }

  async function handleNext() {
    if (isLast) {
      const summary = await completeQuizAttemptAction(attemptId!);
      setResults(summary);
      return;
    }
    setIndex(index + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <Caption>
        {quiz.title} · {index + 1} of {quiz.questions.length}
      </Caption>
      <ExerciseItem
        key={question.id}
        item={question}
        onSubmit={handleSubmit}
        onNext={handleNext}
        nextLabel={isLast ? "Finish Quiz" : "Next question"}
      />
    </div>
  );
}
