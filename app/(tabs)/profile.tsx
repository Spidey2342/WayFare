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
import { useAppStore } from '@/store';
import { palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const profile = useAppStore((state) => state.profile);
  const preference = useAppStore((state) => state.themePreference);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const setProfileName = useAppStore((state) => state.setProfileName);
  const resetGuest = useAppStore((state) => state.resetGuest);
  const [name, setName] = useState(profile.name);
  const [sheet, setSheet] = useState<'profile' | 'notes' | 'privacy' | null>(null);
  const [confirm, setConfirm] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.midnight }]}>
          <Avatar name={profile.name} color={profile.avatarColor} size={84} ring />
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.rank}>FAITH SEEKER</Text>
        </View>
        <View style={styles.stats}>
          <StatTile value="0" label="Cards played" />
          <StatTile value="0" label="Day streak" />
          <StatTile value="0" label="Acts of service" />
        </View>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Your badges · 0/24</Text>
        <View style={styles.badges}>
          <BadgeTile name="Scripture Seeker" icon="📖" earned={false} />
          <BadgeTile name="Team Titan" icon="🤝" earned={false} />
          <BadgeTile name="Hot Start" icon="🔥" earned={false} />
        </View>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Account & settings</Text>
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
        <Text style={[typeScale.caption, { color: colors.textSecondary }]}>
          Appearance · {preference}
        </Text>
        <View style={styles.themes}>
          {(['system', 'light', 'dark'] as const).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: preference === mode }}
              onPress={() => setThemePreference(mode)}
              style={[styles.theme, preference === mode && styles.themeOn]}
            >
              <Text style={styles.themeText}>{mode}</Text>
            </Pressable>
          ))}
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
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xl,
    borderRadius: radii.card,
  },
  name: { fontFamily: typeScale.h2.fontFamily, fontSize: 28, color: palette.white },
  rank: {
    fontFamily: typeScale.caption.fontFamily,
    color: palette.gold,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  stats: { flexDirection: 'row', gap: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  themes: { flexDirection: 'row', gap: spacing.sm },
  theme: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: '#F1F2F6',
    justifyContent: 'center',
  },
  themeOn: { backgroundColor: palette.gold },
  themeText: {
    fontFamily: typeScale.bodyS.fontFamily,
    textTransform: 'capitalize',
    color: palette.midnight,
  },
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
