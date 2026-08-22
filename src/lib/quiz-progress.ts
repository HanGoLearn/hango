export function calculateScore(answers: { isCorrect: boolean }[]): number {
  if (answers.length === 0) return 0;
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  return Math.round((correctCount / answers.length) * 100);
}
