import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  BottomSheet,
  Button,
  EmptyState,
  PostCard,
  Screen,
  ScreenScroll,
  SegmentedTabs,
} from '@/components/ui';
import { useAppStore } from '@/store';
import { palette, radii, spacing, typeScale, useTheme } from '@/theme';

const samples = [
  {
    id: 's1',
    type: 'prayer' as const,
    author: 'Ama',
    group: 'Youth night',
    time: 'Example',
    content: 'Please pray for courage before I read Scripture on Sunday.',
    reactions: { Praying: 4, Amen: 2 },
  },
  {
    id: 's2',
    type: 'testimony' as const,
    author: 'Kofi',
    group: 'Identity deck',
    time: 'Example',
    content: 'I remembered that God knew me before I knew how to introduce myself.',
    reactions: { Praise: 3, Encouraged: 2 },
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const seen = useAppStore((state) => state.guidelinesSeen);
  const setGuidelinesSeen = useAppStore((state) => state.setGuidelinesSeen);
  const founding = useAppStore((state) => state.foundingMember);
  const setFoundingMember = useAppStore((state) => state.setFoundingMember);
  const [tab, setTab] = useState<'following' | 'group' | 'discover'>('discover');

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Community</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Coming soon</Text>
          <Text style={styles.bannerBody}>
            A shared feed is not live yet. These posts are examples. Your own moments stay on this
            device.
          </Text>
        </View>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'following', label: 'Following' },
            { id: 'group', label: 'Group' },
            { id: 'discover', label: 'Discover' },
          ]}
        />
        {tab === 'following' ? (
          <EmptyState
            title="No one to follow yet"
            body="Following arrives with accounts in a later version."
          />
        ) : (
          samples.map((post) => <PostCard key={post.id} {...post} example commentCount={1} />)
        )}
        <View style={[styles.banner, { backgroundColor: palette.gold }]}>
          <Text style={styles.founding}>Founding member</Text>
          <Text style={styles.bannerBodyDark}>
            {founding
              ? 'You are on the list for this device.'
              : 'Save your interest locally. We will not collect an email in this version.'}
          </Text>
          <Button
            label={founding ? 'Saved' : 'Count me in'}
            disabled={founding}
            onPress={() => setFoundingMember(true)}
          />
        </View>
        <Text style={[typeScale.h3, { color: colors.textPrimary, textAlign: 'center' }]}>
          You are all caught up. Go enjoy your day.
        </Text>
        <Button label="Back home" variant="ghost" onPress={() => router.back()} />
      </ScreenScroll>
      <BottomSheet visible={!seen} onClose={() => setGuidelinesSeen(true)}>
        <Text style={styles.sheetTitle}>Community guidelines</Text>
        <Text style={styles.sheetBody}>
          Be kind. Tell the truth. Never pressure someone to share. Skipping a card is always
          welcome. Report and block will arrive with the live feed.
        </Text>
        <Button label="I understand" variant="gold" onPress={() => setGuidelinesSeen(true)} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  banner: {
    backgroundColor: palette.midnight,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bannerTitle: { fontFamily: typeScale.h3.fontFamily, color: palette.gold, fontSize: 18 },
  bannerBody: { fontFamily: typeScale.bodyM.fontFamily, color: '#C9CDD6', lineHeight: 22 },
  bannerBodyDark: {
    fontFamily: typeScale.bodyM.fontFamily,
    color: palette.midnight,
    lineHeight: 22,
  },
  founding: { fontFamily: typeScale.h3.fontFamily, color: palette.midnight, fontSize: 18 },
  sheetTitle: { fontFamily: typeScale.h3.fontFamily, fontSize: 22, color: palette.midnight },
  sheetBody: {
    fontFamily: typeScale.bodyM.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: palette.warmGray,
  },
});
