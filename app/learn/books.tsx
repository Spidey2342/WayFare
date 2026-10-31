import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BottomSheet, Button, Chip, Screen } from '@/components/ui';
import { bookById, learnBooks } from '@/features/learn/repository';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function BooksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const read = useAppStore((state) => state.progress.booksRead);
  const toggleBook = useAppStore((state) => state.toggleBook);
  const [tab, setTab] = useState<'old' | 'new'>('old');
  const [group, setGroup] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    const set = new Set(
      learnBooks.filter((book) => book.testament === tab).map((book) => book.group),
    );
    return [...set];
  }, [tab]);

  const books = useMemo(() => {
    return learnBooks.filter((book) => {
      if (book.testament !== tab) return false;
      if (group && book.group !== group) return false;
      if (query && !book.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [group, query, tab]);

  const progress = read.length / learnBooks.length;
  const detail = selected ? bookById(selected) : undefined;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Books of the Bible</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          {read.length} of {learnBooks.length} marked read ({Math.round(progress * 100)}%)
        </Text>
        <View style={styles.tabs}>
          {(['old', 'new'] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, tab === item && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === item && styles.tabTextOn]}>
                {item === 'old' ? 'Old Testament' : 'New Testament'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          accessibilityLabel="Search books"
          placeholder="Search"
          value={query}
          onChangeText={setQuery}
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Pressable onPress={() => setGroup(null)} accessibilityRole="button">
            <Chip label="All groups" tone={group ? 'muted' : 'teal'} />
          </Pressable>
          {groups.map((item) => (
            <Pressable key={item} onPress={() => setGroup(group === item ? null : item)}>
              <Chip label={item} tone={group === item ? 'teal' : 'muted'} />
            </Pressable>
          ))}
        </ScrollView>
        {books.map((book) => (
          <Pressable
            key={book.id}
            accessibilityRole="button"
            onPress={() => setSelected(book.id)}
            style={[styles.row, { backgroundColor: colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{book.name}</Text>
              <Text
                style={{ color: colors.textSecondary, fontFamily: fontFamily.body, fontSize: 13 }}
              >
                {book.group} · {book.chapters} chapters
              </Text>
            </View>
            <Text
              style={{
                color: read.includes(book.id) ? palette.teal : palette.warmGray,
                fontFamily: fontFamily.bodySemi,
              }}
            >
              {read.includes(book.id) ? 'Read' : 'Mark'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <BottomSheet visible={Boolean(detail)} onClose={() => setSelected(null)}>
        {detail ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={[typeScale.h3, { color: colors.textPrimary }]}>{detail.name}</Text>
            <Text style={{ fontFamily: fontFamily.body, color: colors.textSecondary }}>
              {detail.summary}
            </Text>
            <Text style={{ fontFamily: fontFamily.bodySemi, color: colors.textPrimary }}>
              {detail.chapters} chapters · {detail.group}
            </Text>
            <Button
              label={read.includes(detail.id) ? 'Unmark read' : 'Mark as read'}
              variant="gold"
              onPress={() => {
                toggleBook(detail.id);
                setSelected(null);
              }}
            />
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 48 },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: palette.line,
    alignItems: 'center',
  },
  tabOn: { backgroundColor: palette.midnight },
  tabText: { fontFamily: fontFamily.bodySemi, color: palette.midnight, fontSize: 13 },
  tabTextOn: { color: palette.white },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fontFamily.body,
  },
  chips: { gap: spacing.xs, paddingVertical: spacing.xs },
  row: {
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: { fontFamily: fontFamily.headingSemi, fontSize: 16 },
});
