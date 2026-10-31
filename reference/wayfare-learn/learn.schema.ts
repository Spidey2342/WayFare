import { z } from 'zod';

export const BookSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(1).max(66),
  name: z.string().min(1),
  testament: z.enum(['old', 'new']),
  group: z.string().min(1), // Law, History, Wisdom, Major Prophets, Minor Prophets, Gospels, Paul's Letters, General Letters, Prophecy
  chapters: z.number().int().positive(),
  summary: z.string().min(1).max(200),
});
export const BooksFileSchema = z.array(BookSchema).length(66);

export const QuizCategorySchema = z.object({ id: z.string(), name: z.string() });
export const QuizQuestionSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    reference: z.string().min(1),
  })
  .refine((q) => new Set(q.options).size === 4, { message: 'Options must be unique' });
export const QuizFileSchema = z.object({
  categories: z.array(QuizCategorySchema).min(1),
  questions: z.array(QuizQuestionSchema).min(1),
});

export const LessonSchema = z.object({
  id: z.string(),
  pathId: z.string(),
  order: z.number().int().positive(),
  title: z.string().min(1),
  passage: z.string().min(1),
  estMinutes: z.number().int().positive(),
  summary: z.string().min(1), // written in our own words, not copied from a translation
  keyVerse: z.object({ reference: z.string(), text: z.string(), translation: z.literal('KJV') }),
  keyPoints: z.array(z.string()).min(2),
  reflectionQuestions: z.array(z.string()).min(2),
  actionStep: z.string().min(1),
});
export const LessonsFileSchema = z.object({
  paths: z.array(z.object({ id: z.string(), name: z.string(), tagline: z.string(), deckId: z.string() })),
  lessons: z.array(LessonSchema),
});

export type Book = z.infer<typeof BookSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
