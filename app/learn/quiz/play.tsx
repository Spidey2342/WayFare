import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, TimerRing } from '@/components/ui';
import { buildQuiz, scoreQuiz, type ShuffledQuestion } from '@/features/learn/quizEngine';
import { questionsForCategory } from '@/features/learn/repository';
import { palette, spacing, typeScale } from '@/theme';

export default function QuizPlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; mode?: string }>();
  const category = typeof params.category === 'string' ? params.category : 'mixed';
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const quiz: ShuffledQuestion[] = useMemo(
    () => buildQuiz(questionsForCategory(category), 10, category.length * 4049),
    [category],
  );

  const current = quiz[index];

  if (!current) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={typeScale.h2}>No questions in this category.</Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const reveal = (optionIndex: number) => {
    setPicked(optionIndex);
    const next = [...answers];
    next[index] = optionIndex;
    setAnswers(next);
    const correct = optionIndex === current.correctIndex;
    setFeedback(
      correct
        ? `Correct. ${current.explanation}`
        : `Not quite. ${current.explanation} (${current.reference})`,
    );
  };

  const next = () => {
    if (index >= quiz.length - 1) {
      router.replace({
        pathname: '/learn/quiz/results',
        params: {
          score: String(scoreQuiz(answers, quiz)),
          total: String(quiz.length),
          category,
        },
      });
      return;
    }
    setIndex((value) => value + 1);
    setPicked(null);
    setFeedback(null);
  };

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.kicker}>
          Question {index + 1} of {quiz.length}
        </Text>
        <QuizCountdown key={index} paused={picked !== null} />
        <Text style={[typeScale.h2, { color: palette.midnight }]}>{current.question}</Text>
        {current.options.map((option, optionIndex) => (
          <Button
            key={option}
            label={option}
            variant={picked === optionIndex ? 'gold' : 'secondary'}
            disabled={picked !== null}
            onPress={() => reveal(optionIndex)}
          />
        ))}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <Button
          label={index >= quiz.length - 1 ? 'See results' : 'Next'}
          variant="primary"
          disabled={picked === null}
          onPress={next}
        />
      </View>
    </Screen>
  );
}

function QuizCountdown({ paused }: { paused: boolean }) {
  const total = 45;
  const [seconds, setSeconds] = useState(total);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [paused]);

  return <TimerRing secondsLeft={seconds} total={total} />;
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  feedback: { fontFamily: typeScale.bodyM.fontFamily, color: palette.warmGray, lineHeight: 22 },
});
