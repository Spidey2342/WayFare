import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, LogOut, Shield, User } from 'lucide-react-native';

import {
  AppModal,
  Avatar,
  BadgeTile,
  BottomSheet,
  Button,
  Screen,
  SettingsRow,
  StatTile,
} from '@/components/ui';
import { badges, levelForXp } from '@/features/journey/progress';
import type { BadgeColorToken } from '@/components/ui/BadgeIcon';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const progress = useAppStore((state) => state.progress);
  const level = levelForXp(progress.xp);
  const preference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setProfileName = useAppStore((state) => state.setProfileName);
  const resetGuest = useAppStore((state) => state.resetGuest);
  const [name, setName] = useState(profile.name);
  const [sheet, setSheet] = useState<'profile' | 'notes' | 'privacy' | null>(null);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar name={profile.name} color={profile.avatarColor} size={84} ring />
          <Text style={styles.heroName}>{profile.name}</Text>
          <Text style={styles.heroRank}>{level.displayTitle.toUpperCase()}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.stats}>
            <StatTile value={String(progress.cardsPlayed)} label="Cards played" surface="light" />
            <StatTile value={String(progress.streakDays)} label="Day streak" surface="light" />
            <StatTile
              value={String(progress.actsOfService)}
              label="Acts of service"
              surface="light"
            />
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your badges</Text>
            <Text style={styles.sectionMeta}>{progress.badgesEarned.length} / 24</Text>
          </View>
          <View style={styles.badges}>
            {badges.map((badge) => (
              <BadgeTile
                key={badge.id}
                name={badge.name}
                icon={badge.icon}
                color={badge.color as BadgeColorToken}
                earned={progress.badgesEarned.includes(badge.id)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Account & settings</Text>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon={<User color={palette.midnight} size={18} />}
              title="Profile settings"
              subtitle="Name on this device"
              onPress={() => setSheet('profile')}
            />
            <SettingsRow
              icon={<Bell color={palette.midnight} size={18} />}
              title="Notifications"
              subtitle="Reminders stay on this device"
              onPress={() => setSheet('notes')}
            />
            <SettingsRow
              icon={<Shield color={palette.midnight} size={18} />}
              title="Privacy & content"
              subtitle="No account, no trackers"
              onPress={() => setSheet('privacy')}
            />
            <SettingsRow
              icon={<LogOut color={palette.coral} size={18} />}
              title="Log out"
              danger
              onPress={() => setConfirm(true)}
            />
          </View>

          <Text style={styles.appearanceLabel}>Appearance</Text>
          <View style={styles.themes}>
            {(
              [
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ] as const
            ).map((mode) => (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                accessibilityState={{ selected: preference === mode.id }}
                onPress={() => setThemePreference(mode.id)}
                style={[styles.theme, preference === mode.id && styles.themeOn]}
              >
                <Text style={[styles.themeText, preference === mode.id && styles.themeTextOn]}>
                  {mode.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === 'profile' ? (
          <>
            <Text style={styles.sheetTitle}>Profile settings</Text>
            <TextInput
              accessibilityLabel="Display name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              maxLength={24}
            />
            <Button
              label="Save name"
              variant="gold"
              onPress={() => {
                setProfileName(name);
                setSheet(null);
              }}
            />
          </>
        ) : null}
        {sheet === 'notes' ? (
          <Text style={styles.sheetBody}>
            Wayfare does not send push notifications in this version. On iPhone, reminders are only
            possible after you add Wayfare to the Home Screen, and even then they stay off until a
            later update.
          </Text>
        ) : null}
        {sheet === 'privacy' ? (
          <Text style={styles.sheetBody}>
            Nothing you type leaves this device. There is no account, no analytics, and no personal
            information collected. Log out clears the local guest profile.
          </Text>
        ) : null}
      </BottomSheet>

      <AppModal
        visible={confirm}
        title="Log out?"
        body="This resets the guest profile stored on this device."
        confirmLabel="Log out"
        onConfirm={() => {
          resetGuest();
          setConfirm(false);
          router.replace('/welcome');
        }}
        onClose={() => setConfirm(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: palette.midnight,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  heroName: { fontFamily: typeScale.h2.fontFamily, fontSize: 28, color: palette.white },
  heroRank: {
    fontFamily: typeScale.caption.fontFamily,
    color: palette.gold,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
    backgroundColor: palette.offWhite,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    ...typeScale.h3,
    color: palette.ink,
    fontFamily: fontFamily.headingSemi,
  },
  sectionMeta: {
    fontFamily: fontFamily.bodySemi,
    color: palette.warmGray,
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  settingsCard: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  appearanceLabel: {
    ...typeScale.caption,
    color: palette.warmGray,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  themes: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.lg },
  theme: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: palette.white,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
  },
  themeOn: { backgroundColor: palette.gold, borderColor: palette.gold },
  themeText: {
    fontFamily: typeScale.bodyS.fontFamily,
    color: palette.midnight,
  },
  themeTextOn: { color: palette.midnight },
  sheetTitle: { fontFamily: typeScale.h3.fontFamily, fontSize: 20, color: palette.midnight },
  sheetBody: {
    fontFamily: typeScale.bodyM.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: palette.warmGray,
  },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.md,
    fontFamily: typeScale.bodyM.fontFamily,
    fontSize: 16,
  },
});
