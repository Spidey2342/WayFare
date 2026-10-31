import booksData from '@/data/learn/books.json';
import lessonsData from '@/data/learn/lessons.json';
import quizData from '@/data/learn/quiz.json';

import {
  BooksFileSchema,
  LessonsFileSchema,
  QuizFileSchema,
  type Book,
  type Lesson,
  type QuizQuestion,
} from './learn.schema';

const books = BooksFileSchema.parse(booksData);
const lessonsFile = LessonsFileSchema.parse(lessonsData);
const quizFile = QuizFileSchema.parse(quizData);

export const learnBooks: Book[] = books;
export const learnPaths = lessonsFile.paths;
export const learnLessons: Lesson[] = [...lessonsFile.lessons].sort(
  (left, right) => left.order - right.order,
);
export const quizCategories = quizFile.categories;
export const quizQuestions: QuizQuestion[] = quizFile.questions;

export function getLesson(id: string): Lesson | undefined {
  return learnLessons.find((lesson) => lesson.id === id);
}

export function lessonsForPath(pathId: string): Lesson[] {
  return learnLessons.filter((lesson) => lesson.pathId === pathId);
}

export function pathForLesson(lesson: Lesson) {
  return learnPaths.find((path) => path.id === lesson.pathId);
}

export function questionsForCategory(categoryId: string): QuizQuestion[] {
  if (categoryId === 'mixed') {
    return quizQuestions;
  }
  return quizQuestions.filter((question) => question.category === categoryId);
}

export function todayLesson(completedIds: readonly string[]): Lesson | undefined {
  return learnLessons.find((lesson) => !completedIds.includes(lesson.id));
}

export function bookById(id: string): Book | undefined {
  return learnBooks.find((book) => book.id === id);
}
