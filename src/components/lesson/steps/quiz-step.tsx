import { SectionTitle } from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import type { LessonWithContent } from "@/lib/content/lesson-data";

/**
 * Only the lesson's first quiz is interactive - the seeded lesson has
 * exactly one QUIZ step with one Quiz, and 7.4's Quiz Runtime is
 * single-attempt-at-a-time (see QuizRunner). A lesson with more than one
 * quiz per step would need this to sequence across them too.
 */
export function QuizStep({
  quizzes,
  onContinue,
}: {
  quizzes: LessonWithContent["quizzes"];
  onContinue: () => void;
}) {
  const quiz = quizzes[0];

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Quiz</SectionTitle>
      {quiz ? (
        <QuizRunner quiz={quiz} onFinish={onContinue} />
      ) : (
        <EmptyState
          title="No quiz yet"
          description="This lesson doesn't have a quiz."
          action={{ label: "Continue", onClick: onContinue }}
        />
      )}
    </div>
  );
}
