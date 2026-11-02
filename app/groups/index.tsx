import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';

import { Button, EmptyState, Screen, ScreenScroll } from '@/components/ui';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchMyGroups } from '@/features/groups/api';
import { isSupabaseConfigured, type GroupRow } from '@/services/supabase';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { session } = useAuth();
  const markChecklistItem = useAppStore((state) => state.markChecklistItem);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchMyGroups();
      setGroups(rows);
      if (rows.length > 0) markChecklistItem('friends');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load groups.');
    } finally {
      setLoading(false);
    }
  }, [session, markChecklistItem]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void load();
  }, [load]);

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenHeader title="Groups" fallback="/home" />
      <ScreenScroll contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/groups/create')}>
            <Plus color={palette.midnight} size={22} />
          </Pressable>
        </View>
        {!session || !isSupabaseConfigured ? (
          <EmptyState
            title="Sign in to use groups"
            body="Create or join a group after you sign in."
          />
        ) : loading ? (
          <Text style={{ color: colors.textSecondary }}>Loading…</Text>
        ) : groups.length === 0 ? (
          <View style={styles.empty}>
            <Users color={palette.blue} size={40} />
            <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Play with your people</Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamily.body,
                textAlign: 'center',
              }}
            >
              Create a group for your crew or join with a six-letter code from your leader.
            </Text>
            <Button
              label="Create a group"
              variant="primary"
              onPress={() => router.push('/groups/create')}
            />
            <Button
              label="Join with a code"
              variant="secondary"
              onPress={() => router.push('/groups/join')}
            />
          </View>
        ) : (
          <View style={styles.list}>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                accessibilityRole="button"
                onPress={() => router.push(`/groups/${group.id}`)}
                style={[styles.row, { backgroundColor: colors.surface }]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{group.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typeScale.h3, { color: colors.textPrimary }]}>{group.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
                    Code {group.join_code}
                  </Text>
                </View>
                <Text style={styles.view}>View</Text>
              </Pressable>
            ))}
          </View>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: palette.white, fontFamily: fontFamily.headingSemi, fontSize: 18 },
  view: { fontFamily: fontFamily.bodySemi, color: palette.blue },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
