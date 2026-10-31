import books from '@/data/learn/books.json';
import lessonsFile from '@/data/learn/lessons.json';
import quizFile from '@/data/learn/quiz.json';

import { DeckSchema } from '../deck.schema';
import { getAllDecks } from '../repository';
import { BooksFileSchema, LessonsFileSchema, QuizFileSchema } from '@/features/learn/learn.schema';

describe('content validation', () => {
  test('loads seven decks with 132 unique card ids', () => {
    const decks = getAllDecks();
    expect(decks).toHaveLength(7);
    const ids = new Set<string>();
    let total = 0;
    for (const deck of decks) {
      expect(DeckSchema.safeParse(deck).success).toBe(true);
      for (const card of deck.cards) {
        expect(ids.has(card.id)).toBe(false);
        ids.add(card.id);
        total += 1;
      }
    }
    expect(total).toBe(132);
  });

  test('validates books.json', () => {
    const booksParsed = BooksFileSchema.parse(books);
    expect(booksParsed).toHaveLength(66);
    expect(booksParsed.filter((book) => book.testament === 'old')).toHaveLength(39);
    expect(booksParsed.filter((book) => book.testament === 'new')).toHaveLength(27);
  });

  test('validates quiz.json', () => {
    const quiz = QuizFileSchema.parse(quizFile);
    expect(quiz.questions).toHaveLength(60);
    const byCategory = new Map<string, number>();
    for (const question of quiz.questions) {
      expect(question.options).toHaveLength(4);
      expect(new Set(question.options).size).toBe(4);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThanOrEqual(3);
      byCategory.set(question.category, (byCategory.get(question.category) ?? 0) + 1);
    }
    expect(byCategory.size).toBe(6);
    for (const count of byCategory.values()) {
      expect(count).toBe(10);
    }
  });

  test('validates lessons and path deck links', () => {
    const lessons = LessonsFileSchema.parse(lessonsFile);
    expect(lessons.paths).toHaveLength(4);
    expect(lessons.lessons).toHaveLength(12);
    const deckIds = new Set(getAllDecks().map((deck) => deck.id));
    for (const path of lessons.paths) {
      expect(deckIds.has(path.deckId)).toBe(true);
    }
    for (const lesson of lessons.lessons) {
      const path = lessons.paths.find((item) => item.id === lesson.pathId);
      expect(path).toBeDefined();
      expect(deckIds.has(path!.deckId)).toBe(true);
    }
  });
});
