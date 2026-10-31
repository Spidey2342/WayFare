import { mulberry32, shuffle, type Rng } from '@/features/game/rng';
import type { QuizQuestion } from './learn.schema';

export interface ShuffledQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reference: string;
  category: string;
}

export function shuffleQuestion(question: QuizQuestion, rng: Rng): ShuffledQuestion {
  const indexed = question.options.map((option, index) => ({ option, index }));
  const shuffled = shuffle(indexed, rng);
  const correctOption = question.options[question.correctIndex];
  const correctIndex = shuffled.findIndex((entry) => entry.option === correctOption);
  return {
    id: question.id,
    question: question.question,
    options: shuffled.map((entry) => entry.option),
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    explanation: question.explanation,
    reference: question.reference,
    category: question.category,
  };
}

export function buildQuiz(
  questions: QuizQuestion[],
  count: number,
  seed: number,
): ShuffledQuestion[] {
  const rng = mulberry32(seed);
  const pool = shuffle([...questions], rng);
  const chosen = pool.slice(0, Math.min(count, pool.length));
  return chosen.map((question) => shuffleQuestion(question, mulberry32(rng() * 1_000_000)));
}

export function scoreQuiz(
  answers: readonly (number | null)[],
  quiz: readonly ShuffledQuestion[],
): number {
  let score = 0;
  for (let index = 0; index < quiz.length; index += 1) {
    const answer = answers[index];
    const item = quiz[index];
    if (item && answer === item.correctIndex) score += 1;
  }
  return score;
}
