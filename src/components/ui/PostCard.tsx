import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, palette, radii, shadows, spacing, useTheme } from '@/theme';

import { ReactionBar, type ReactionName } from './ReactionBar';

export function PostCard({
  type,
  author,
  group,
  time,
  content,
  example = false,
  reactions,
  commentCount = 0,
  onReact,
  onPray,
  onSave,
  onShare,
}: {
  type: 'worship' | 'prayer' | 'testimony' | 'verse' | 'moment';
  author: string;
  group?: string;
  time: string;
  content: string;
  example?: boolean;
  reactions: Partial<Record<ReactionName, number>>;
  commentCount?: number;
  onReact?: (name: ReactionName) => void;
  onPray?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.initial}>{author.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.author, { color: colors.textPrimary }]}>{author}</Text>
          <Text style={styles.meta}>
            {group ? `${group} · ` : ''}
            {time}
            {example ? ' · Example' : ''}
          </Text>
        </View>
        <Text style={styles.type}>{type}</Text>
      </View>
      <Text selectable style={[styles.content, { color: colors.textPrimary }]}>
        {content}
      </Text>
      <ReactionBar counts={reactions} onReact={onReact} />
      <View style={styles.actions}>
        {type === 'prayer' ? (
          <Pressable accessibilityRole="button" onPress={onPray}>
            <Text style={styles.action}>I prayed for this</Text>
          </Pressable>
        ) : null}
        <Text style={styles.meta}>{commentCount} comments</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Save post" onPress={onSave}>
          <Text style={styles.action}>Save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Share post" onPress={onShare}>
          <Text style={styles.action}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fontFamily.heading, color: palette.midnight },
  author: { fontFamily: fontFamily.bodySemi, fontSize: 15 },
  meta: { fontFamily: fontFamily.body, color: palette.warmGray, fontSize: 12 },
  type: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette.warmGray,
  },
  content: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  action: {
    fontFamily: fontFamily.bodySemi,
    color: palette.midnight,
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: 'center',
  },
});
