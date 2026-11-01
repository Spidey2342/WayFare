import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { saveProfilePatch, useAuth } from '@/features/auth/AuthContext';
import { Button, Screen, ScreenScroll } from '@/components/ui';
import { AVATAR_PRESETS } from '@/data/avatarPresets';
import { useAppStore } from '@/store';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, profile, setProfileLocal } = useAuth();
  const setProfileName = useAppStore((state) => state.setProfileName);
  const markChecklistItem = useAppStore((state) => state.markChecklistItem);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [verse, setVerse] = useState(profile?.favorite_verse ?? '');
  const [avatarKey, setAvatarKey] = useState(profile?.avatar_key ?? AVATAR_PRESETS[0].key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!user) {
      router.replace('/auth/welcome');
      return;
    }
    if (!name.trim()) {
      setError('Add a display name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const preset = AVATAR_PRESETS.find((item) => item.key === avatarKey) ?? AVATAR_PRESETS[0];
      await saveProfilePatch(
        user.id,
        {
          display_name: name.trim(),
          avatar_key: avatarKey,
          favorite_verse: verse.trim() || null,
          age_confirmed: true,
        },
        setProfileLocal,
      );
      setProfileName(name.trim());
      useAppStore.setState((state) => ({
        profile: { ...state.profile, name: name.trim(), avatarColor: preset.color },
      }));
      markChecklistItem('profile');
      router.replace('/onboarding/goal');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Profile setup</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          One last step
        </Text>
        <View style={styles.grid}>
          {AVATAR_PRESETS.map((preset) => (
            <Pressable
              key={preset.key}
              accessibilityRole="button"
              onPress={() => setAvatarKey(preset.key)}
              style={[
                styles.avatar,
                { backgroundColor: preset.color },
                avatarKey === preset.key && styles.avatarOn,
              ]}
            />
          ))}
        </View>
        <AuthField label="DISPLAY NAME" value={name} onChangeText={setName} />
        <AuthField
          label="FAVORITE VERSE"
          value={verse}
          onChangeText={setVerse}
          placeholder="e.g. Psalm 23:1"
          multiline
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="All set" variant="gold" disabled={loading} onPress={() => void save()} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarOn: { borderWidth: 3, borderColor: palette.gold },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
