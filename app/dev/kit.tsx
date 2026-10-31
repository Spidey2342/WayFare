import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Heart, User } from 'lucide-react-native';

import {
  AppModal,
  Avatar,
  AvatarStack,
  BadgeTile,
  BottomSheet,
  Button,
  CardFace,
  Chip,
  Confetti,
  DeckTile,
  DiceCube,
  EmptyState,
  FlipCard,
  JourneyNode,
  PlayerRow,
  PostCard,
  ProgressBar,
  ProDeckBanner,
  QuoteCard,
  RoundSlider,
  SettingsRow,
  SkeletonLoader,
  StatTile,
  Screen,
  SegmentedTabs,
  TimerRing,
  useToast,
  type RoundMinutes,
} from '@/components/ui';
import { palette, spacing, typeScale, useTheme } from '@/theme';

export default function DevKitScreen() {
  const { colors, mode } = useTheme();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'challenges' | 'favorites'>('all');
  const [minutes, setMinutes] = useState<RoundMinutes>(10);
  const [flipped, setFlipped] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [color, setColor] = useState<string>(palette.gold);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typeScale.caption, { color: palette.goldDeep }]}>WAYFARE · {mode}</Text>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Design kit</Text>

        <Button label="Get started" variant="gold" onPress={() => toast.show('Gold button')} />
        <Button label="Primary button" onPress={() => toast.show('Primary button')} />
        <Button label="Secondary" variant="secondary" />
        <Button label="Ghost action" variant="ghost" />
        <Button label="Loading" loading />
        <Button label="Disabled" disabled />

        <View style={styles.row}>
          <Chip label="Beginner" tone="teal" />
          <Chip label="New deck" tone="purple" />
          <Chip label="Hot" tone="coral" />
          <Chip label="7 day streak" tone="solidGold" />
        </View>

        <SegmentedTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'All Decks' },
            { id: 'challenges', label: 'Challenges' },
            { id: 'favorites', label: 'Favorites' },
          ]}
        />
        <ProgressBar progress={0.62} />
        <TimerRing secondsLeft={32} />
        <AvatarStack
          people={[
            { name: 'Kofi', color: palette.gold },
            { name: 'Ama', color: palette.teal },
            { name: 'Paul', color: palette.coral },
          ]}
          extra={4}
        />
        <Avatar name="Kofi" color={palette.gold} size={64} ring />

        <FlipCard
          flipped={flipped}
          front={
            <CardFace
              type="word"
              title="Fearfully & Wonderfully Made"
              body="I will praise thee; for I am fearfully and wonderfully made."
              prompt="Explain the verse in your own words."
              reference="Psalm 139:14"
            />
          }
          back={
            <CardFace
              type="dare"
              title="A kind word"
              prompt="Give a sincere compliment to the person on your right."
            />
          }
        />
        <Button
          label={flipped ? 'Show word' : 'Flip card'}
          variant="secondary"
          onPress={() => setFlipped((v) => !v)}
        />

        <View style={styles.grid}>
          <DeckTile
            title="Identity"
            tagline="Who God says you are"
            count={24}
            colors={[palette.purple, '#6C63FF']}
            icon={<BookOpen color={palette.white} size={20} />}
          />
          <DeckTile
            title="Courage"
            tagline="Brave faith"
            count={24}
            locked
            colors={[palette.coral, '#E25555']}
            icon={<Heart color={palette.white} size={20} />}
          />
        </View>
        <ProDeckBanner />
        <View style={styles.row}>
          <StatTile value="24" label="Cards" />
          <StatTile value="12" label="Day streak" />
          <StatTile value="8" label="Acts of service" />
        </View>
        <QuoteCard
          verse="Thy word have I hid in mine heart, that I might not sin against thee."
          reference="Psalm 119:11"
          onShare={() => toast.show('Verse copied for sharing')}
        />
        <View style={styles.row}>
          <JourneyNode label="W1" state="complete" />
          <JourneyNode label="W4" state="current" />
          <JourneyNode label="W5" state="locked" caption="Level 5" />
        </View>
        <View style={styles.row}>
          <BadgeTile name="Scripture Seeker" earned icon="book-open" color="teal" />
          <BadgeTile name="Team Titan" earned={false} icon="shield" color="purple" />
        </View>
        <PlayerRow name="Kofi" color={color} onColorChange={setColor} />
        <RoundSlider value={minutes} onChange={setMinutes} />
        <DiceCube face={4} rolling={false} onPress={() => toast.show('Dice tapped')} />
        <SettingsRow
          icon={<User color={palette.midnight} size={18} />}
          title="Profile settings"
          subtitle="Name and avatar"
        />
        <SkeletonLoader />
        <EmptyState title="No favorites yet" body="Heart a deck and it will wait for you here." />
        <PostCard
          type="prayer"
          author="Ama"
          group="Youth night"
          time="2h"
          example
          content="Please pray for courage before I share at church."
          reactions={{ Praying: 3, Amen: 1 }}
          commentCount={2}
          onPray={() => toast.show('Prayer marked')}
        />
        <Button label="Open sheet" variant="secondary" onPress={() => setSheet(true)} />
        <Button label="Open modal" variant="secondary" onPress={() => setModal(true)} />
        <Button
          label="Confetti"
          variant="gold"
          onPress={() => {
            setCelebrate(true);
            setTimeout(() => setCelebrate(false), 1600);
          }}
        />
        <Confetti active={celebrate} />
        <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
          <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Community guidelines</Text>
          <Text style={{ color: colors.textSecondary, fontFamily: typeScale.bodyM.fontFamily }}>
            Be kind, tell the truth, and leave room for someone to pass.
          </Text>
        </BottomSheet>
        <AppModal
          visible={modal}
          title="Log out?"
          body="This resets the local guest profile on this device."
          confirmLabel="Log out"
          onConfirm={() => setModal(false)}
          onClose={() => setModal(false)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 80 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  grid: { flexDirection: 'row', gap: spacing.sm },
});
