import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Brain, Library } from 'lucide-react-native';

import { Button, ProgressBar, Screen, ScreenScroll } from '@/components/ui';
import { lessonsForPath, learnPaths } from '@/features/learn/repository';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function LearnHubScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const completed = useAppStore((state) => state.progress.completedLessons);

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Learn</Text>
        <Text style={[typeScale.bodyM, { color: colors.textSecondary }]}>
          Study paths, Bible books, and quick quizzes. Everything works offline on this device.
        </Text>
        <View style={styles.shortcuts}>
          <Button
            label="Books of the Bible"
            variant="secondary"
            onPress={() => router.push('/learn/books')}
          />
          <Button label="Bible Quiz" variant="gold" onPress={() => router.push('/learn/quiz')} />
        </View>
        {learnPaths.map((path) => {
          const lessons = lessonsForPath(path.id);
          const done = lessons.filter((lesson) => completed.includes(lesson.id)).length;
          const progress = lessons.length === 0 ? 0 : done / lessons.length;
          return (
            <View key={path.id} style={[styles.path, { backgroundColor: colors.surface }]}>
              <View style={styles.pathHead}>
                <Brain color={palette.blue} size={22} />
                <View style={{ flex: 1 }}>
                  <Text style={[typeScale.h3, { color: colors.textPrimary }]}>{path.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
                    {path.tagline}
                  </Text>
                </View>
              </View>
              <ProgressBar progress={progress} />
              <Text style={styles.meta}>
                {done}/{lessons.length} lessons
              </Text>
              {lessons.map((lesson) => (
                <Button
                  key={lesson.id}
                  label={completed.includes(lesson.id) ? `${lesson.title} · Done` : lesson.title}
                  variant={completed.includes(lesson.id) ? 'ghost' : 'primary'}
                  onPress={() =>
                    router.push({ pathname: '/learn/lesson/[id]', params: { id: lesson.id } })
                  }
                />
              ))}
            </View>
          );
        })}
        <View style={styles.note}>
          <Library color={palette.warmGray} size={18} />
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body, flex: 1 }}>
            Completing lessons adds XP and counts on your Journey.
          </Text>
        </View>
        <View style={styles.note}>
          <BookOpen color={palette.warmGray} size={18} />
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body, flex: 1 }}>
            Scripture shown in lessons and cards is King James Version (public domain).
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  shortcuts: { gap: spacing.sm },
  path: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  pathHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  meta: { ...typeScale.caption, color: palette.warmGray },
  note: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
