import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Bell, HelpCircle, LogOut, Shield, User, Users } from 'lucide-react-native';

import {
  AppModal,
  Avatar,
  BadgeTile,
  BottomSheet,
  Button,
  Screen,
  ScreenScroll,
  SettingsRow,
  SkeletonLoader,
  StatTile,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { rankForAccount, useAccountPresentation } from '@/features/auth/useAccountPresentation';
import { badges } from '@/features/journey/progress';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import type { BadgeColorToken } from '@/components/ui/BadgeIcon';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const account = useAccountPresentation();
  const { session, signOut } = useAuth();
  const [sheet, setSheet] = useState<'notes' | 'privacy' | 'help' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rank = rankForAccount(account);
  const isGuest = account.status === 'guest';
  const loading = account.status === 'loading';

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {loading ? (
            <>
              <SkeletonLoader height={84} />
              <SkeletonLoader height={28} />
              <SkeletonLoader height={14} />
            </>
          ) : account.status === 'error' ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load your profile</Text>
              <Text style={styles.errorBody}>{account.message}</Text>
              <Button label="Retry" variant="gold" onPress={account.retry} />
            </View>
          ) : (
            <>
              <Avatar
                name={isGuest ? 'Guest' : account.displayName || '?'}
                color={account.avatarColor}
                size={84}
                ring
              />
              <Text style={styles.heroName}>{isGuest ? 'Guest' : account.displayName || ' '}</Text>
              <Text style={styles.heroRank}>{rank.displayTitle.toUpperCase()}</Text>
            </>
          )}
        </View>

        <View style={styles.body}>
          {loading ? (
            <View style={styles.stats}>
              <SkeletonLoader height={72} />
              <SkeletonLoader height={72} />
              <SkeletonLoader height={72} />
            </View>
          ) : account.status === 'error' ? null : (
            <>
              <View style={styles.stats}>
                <StatTile
                  value={String(account.cardsPlayed)}
                  label="Cards played"
                  surface="light"
                />
                <StatTile value={String(account.streakDays)} label="Day streak" surface="light" />
                <StatTile
                  value={String(account.actsOfService)}
                  label="Acts of service"
                  surface="light"
                />
              </View>

              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Your badges</Text>
                <Text style={styles.sectionMeta}>
                  {account.status === 'ready' || account.status === 'guest'
                    ? account.badgeIds.length
                    : 0}{' '}
                  / 24
                </Text>
              </View>
              <View style={styles.badges}>
                {badges.map((badge) => (
                  <BadgeTile
                    key={badge.id}
                    name={badge.name}
                    icon={badge.icon}
                    color={badge.color as BadgeColorToken}
                    earned={
                      account.status === 'ready' || account.status === 'guest'
                        ? account.badgeIds.includes(badge.id)
                        : false
                    }
                  />
                ))}
              </View>
            </>
          )}

          {isGuest ? (
            <View style={styles.guestCta}>
              <Text style={styles.guestLead}>Sign in or create an account to sync progress.</Text>
              <Button label="Sign in" variant="gold" onPress={() => router.push('/auth/sign-in')} />
              <Button
                label="Create account"
                variant="secondary"
                onPress={() => router.push('/auth/sign-up')}
              />
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Account & settings</Text>
          <View style={styles.settingsCard}>
            {session ? (
              <SettingsRow
                icon={<User color={palette.midnight} size={18} />}
                title="Profile settings"
                subtitle="Name and avatar on Wayfare"
                onPress={() => router.push('/auth/profile-setup')}
              />
            ) : null}
            <SettingsRow
              icon={<Bell color={palette.midnight} size={18} />}
              title="Notifications"
              subtitle="Reminders stay on this device"
              onPress={() => setSheet('notes')}
            />
            <SettingsRow
              icon={<Users color={palette.midnight} size={18} />}
              title="Groups"
              subtitle="Create or join with a code"
              onPress={() => router.push('/groups')}
            />
            <SettingsRow
              icon={<Shield color={palette.midnight} size={18} />}
              title="Privacy & content"
              subtitle="Your data and account"
              onPress={() => setSheet('privacy')}
            />
            <SettingsRow
              icon={<HelpCircle color={palette.midnight} size={18} />}
              title="Help"
              subtitle="How cards and play modes work"
              onPress={() => setSheet('help')}
            />
            <SettingsRow
              icon={<LogOut color={palette.coral} size={18} />}
              title="Log out"
              danger
              onPress={() => setConfirm(true)}
            />
          </View>
        </View>
      </ScreenScroll>

      <BottomSheet visible={sheet !== null} onClose={() => setSheet(null)}>
        {sheet === 'notes' ? (
          <Text style={styles.sheetBody}>
            Wayfare does not send push notifications in this version.
          </Text>
        ) : null}
        {sheet === 'privacy' ? (
          <>
            <Text style={styles.sheetBody}>
              With an account, your profile and groups sync through Supabase. Guest play stays on
              this device only.
            </Text>
            {session ? (
              <Button
                label="Delete my account"
                variant="secondary"
                onPress={() => setConfirmDelete(true)}
              />
            ) : null}
          </>
        ) : null}
        {sheet === 'help' ? (
          <Text style={styles.sheetBody}>
            Open Play from the tab bar to pick Solo, Pass-the-phone, or Online.
          </Text>
        ) : null}
      </BottomSheet>

      <AppModal
        visible={confirm}
        title="Log out?"
        body={
          session
            ? 'You will sign out of your account on this device.'
            : 'This clears guest progress stored on this device.'
        }
        confirmLabel="Log out"
        onConfirm={() => {
          void (async () => {
            await signOut();
            setConfirm(false);
            router.replace('/auth/welcome');
          })();
        }}
        onClose={() => setConfirm(false)}
      />
      <AppModal
        visible={confirmDelete}
        title="Delete account?"
        body="This removes your profile, group memberships, and progress stored online."
        confirmLabel="Delete account"
        onConfirm={() => {
          void (async () => {
            if (isSupabaseConfigured) {
              await requireSupabase().rpc('delete_my_account');
              await signOut();
            }
            setConfirmDelete(false);
            setSheet(null);
            router.replace('/auth/welcome');
          })();
        }}
        onClose={() => setConfirmDelete(false)}
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
  sheetBody: {
    fontFamily: typeScale.bodyM.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    color: palette.warmGray,
  },
  errorCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#2A1218',
    borderRadius: radii.lg,
    width: '100%',
  },
  errorTitle: { fontFamily: fontFamily.bodySemi, color: palette.white, fontSize: 16 },
  errorBody: { fontFamily: fontFamily.body, color: palette.warmGray, textAlign: 'center' },
  guestCta: { gap: spacing.sm, marginVertical: spacing.md },
  guestLead: { fontFamily: fontFamily.body, color: palette.warmGray, lineHeight: 22 },
});
