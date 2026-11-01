import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { fetchGroup, fetchGroupMembers, fetchMemberProfiles } from '@/features/groups/api';
import { useAuth } from '@/features/auth/AuthContext';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export default function GroupProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [name, setName] = useState('');
  const [members, setMembers] = useState<{ name: string; role: string }[]>([]);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const group = await fetchGroup(id);
      setName(group?.name ?? 'Group');
      const rows = await fetchGroupMembers(id);
      const profiles = await fetchMemberProfiles(rows.map((row) => row.user_id));
      const byId = new Map(
        profiles.map((profile) => [profile.id, profile.display_name ?? 'Member']),
      );
      setIsLeader(rows.some((row) => row.user_id === user?.id && row.role === 'leader'));
      setMembers(
        rows.map((row) => ({
          name: byId.get(row.user_id) ?? 'Member',
          role: row.role,
        })),
      );
    })();
  }, [id, user?.id]);

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/groups" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          {members.length} members
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {members.map((member) => (
            <View key={member.name + member.role} style={styles.member}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemi }}>
                {member.name}
              </Text>
              {member.role === 'leader' ? <Text style={styles.leader}>Leader</Text> : null}
            </View>
          ))}
        </View>
        <Button
          label="Open lobby"
          variant="gold"
          onPress={() => router.push(`/groups/${id}/lobby`)}
        />
        {isLeader ? (
          <Button
            label="Leader tools"
            variant="secondary"
            onPress={() => router.push(`/groups/${id}/lobby`)}
          />
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  card: { borderRadius: radii.card, padding: spacing.md, gap: spacing.sm },
  member: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leader: { ...typeScale.caption, color: palette.goldDeep },
});
