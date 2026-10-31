import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Confetti, QuoteCard, Screen, ScreenScroll } from '@/components/ui';
import { buildQuiz } from '@/features/learn/quizEngine';
import { getLesson, pathForLesson, questionsForCategory } from '@/features/learn/repository';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const lesson = getLesson(id);
  const path = lesson ? pathForLesson(lesson) : undefined;
  const { colors } = useTheme();
  const completed = useAppStore((state) => state.progress.completedLessons);
  const completeLesson = useAppStore((state) => state.completeLesson);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([null, null, null]);
  const [showConfetti, setShowConfetti] = useState(false);

  const miniQuiz = useMemo(() => {
    if (!lesson || !path) return [];
    const categoryByPath: Record<string, string> = {
      identity: 'people',
      courage: 'old-testament',
      serving: 'new-testament',
      'the-journey': 'jesus',
    };
    const pool = questionsForCategory(categoryByPath[path.id] ?? 'mixed');
    return buildQuiz(pool, 3, lesson.id.length * 997);
  }, [lesson, path]);

  if (!lesson) {
    return (
      <Screen>
        <View style={styles.missing}>
          <Text style={typeScale.h2}>This lesson is not available.</Text>
          <Button label="Back to Learn" onPress={() => router.replace('/learn')} />
        </View>
      </Screen>
    );
  }

  const done = completed.includes(lesson.id);
  const current = miniQuiz[quizIndex];

  const finish = () => {
    completeLesson(lesson.id);
    setShowConfetti(true);
  };

  return (
    <Screen>
      {showConfetti ? <Confetti active /> : null}
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.caption, { color: palette.goldDeep }]}>
          {path?.name ?? 'Lesson'}
        </Text>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>{lesson.title}</Text>
        <Text style={[typeScale.bodyS, { color: colors.textSecondary }]}>
          {lesson.passage} · {lesson.estMinutes} min
        </Text>
        <Text style={[typeScale.bodyM, { color: colors.textPrimary }]}>{lesson.summary}</Text>
        <QuoteCard verse={lesson.keyVerse.text} reference={lesson.keyVerse.reference} />
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Key points</Text>
        {lesson.keyPoints.map((point) => (
          <Text key={point} style={[styles.point, { color: colors.textPrimary }]}>
            • {point}
          </Text>
        ))}
        <Button
          label={reflectionOpen ? 'Hide reflection' : 'Reflection questions'}
          variant="secondary"
          onPress={() => setReflectionOpen((value) => !value)}
        />
        {reflectionOpen
          ? lesson.reflectionQuestions.map((question) => (
              <Text key={question} style={[styles.point, { color: colors.textSecondary }]}>
                {question}
              </Text>
            ))
          : null}
        <View style={[styles.action, { backgroundColor: colors.surface }]}>
          <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Action step</Text>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
            {lesson.actionStep}
          </Text>
          <Button
            label={actionDone ? 'Marked' : 'I did this'}
            variant="secondary"
            disabled={actionDone}
            onPress={() => setActionDone(true)}
          />
        </View>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Mini quiz</Text>
        {current ? (
          <View style={[styles.quiz, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemi }}>
              {current.question}
            </Text>
            {current.options.map((option, index) => (
              <Button
                key={option}
                label={option}
                variant={quizAnswers[quizIndex] === index ? 'gold' : 'secondary'}
                onPress={() => {
                  const next = [...quizAnswers];
                  next[quizIndex] = index;
                  setQuizAnswers(next);
                }}
              />
            ))}
            <Button
              label={quizIndex >= miniQuiz.length - 1 ? 'Review answers' : 'Next question'}
              variant="primary"
              disabled={quizAnswers[quizIndex] === null}
              onPress={() => setQuizIndex((value) => Math.min(value + 1, miniQuiz.length - 1))}
            />
          </View>
        ) : null}
        <Button
          label={done ? 'Completed' : 'Mark complete'}
          variant="gold"
          disabled={done || quizAnswers.some((answer) => answer === null)}
          onPress={finish}
        />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  missing: { flex: 1, padding: spacing.xl, gap: spacing.md },
  point: { fontFamily: fontFamily.body, lineHeight: 22 },
  action: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  quiz: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
});
