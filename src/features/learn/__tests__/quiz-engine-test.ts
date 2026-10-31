import { mulberry32 } from '@/features/game/rng';
import { quizQuestions } from '@/features/learn/repository';

import { buildQuiz, scoreQuiz, shuffleQuestion } from '../quizEngine';

describe('quizEngine', () => {
  test('shuffleQuestion remaps correctIndex after option shuffle', () => {
    const source = quizQuestions[0];
    if (!source) throw new Error('missing quiz seed question');
    const shuffled = shuffleQuestion(source, mulberry32(42));
    expect(shuffled.options).toHaveLength(4);
    expect(new Set(shuffled.options).size).toBe(4);
    expect(shuffled.options[shuffled.correctIndex]).toBe(source.options[source.correctIndex]);
  });

  test('buildQuiz avoids repeats and keeps deterministic order for a seed', () => {
    const pool = quizQuestions.filter((item) => item.category === 'jesus');
    const first = buildQuiz(pool, 10, 9001);
    const second = buildQuiz(pool, 10, 9001);
    expect(first.map((item) => item.id)).toEqual(second.map((item) => item.id));
    expect(new Set(first.map((item) => item.id)).size).toBe(first.length);
    for (const item of first) {
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.correctIndex).toBeLessThan(4);
    }
  });

  test('scoreQuiz counts only matching indices', () => {
    const quiz = buildQuiz(quizQuestions, 3, 1);
    const answers = quiz.map((item, index) => (index === 0 ? item.correctIndex : 0));
    expect(scoreQuiz(answers, quiz)).toBe(1);
  });
});
