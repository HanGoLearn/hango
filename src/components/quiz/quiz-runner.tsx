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
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

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
  const messages = useLessonMessages();
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
        <Caption>
          {formatMessage(messages.quiz.questions, {
            count: quiz.questions.length,
          })}
        </Caption>
        <Button
          type="button"
          onClick={handleStart}
          loading={starting}
          className="self-start"
        >
          {messages.quiz.start}
        </Button>
      </Card>
    );
  }

  if (results) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle>{messages.quiz.results}</CardTitle>
        <Body>
          {formatMessage(messages.quiz.score, {
            correct: results.correctCount,
            total: results.totalQuestions,
            score: results.score,
          })}
        </Body>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleStart}>
            {messages.quiz.retry}
          </Button>
          <Button type="button" onClick={onFinish}>
            {messages.common.continue}
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
        {quiz.title} · {index + 1} {messages.common.of} {quiz.questions.length}
      </Caption>
      <ExerciseItem
        key={question.id}
        item={question}
        onSubmit={handleSubmit}
        onNext={handleNext}
        nextLabel={isLast ? messages.quiz.finish : messages.common.nextQuestion}
      />
    </div>
  );
}
