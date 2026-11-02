import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Compass, Home, Layers, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignInToPlaySheet } from '@/components/auth/SignInToPlaySheet';
import { GameRulesSheet } from '@/components/game/GameRulesSheet';
import { PlayModeSheet } from '@/components/game/PlayModeSheet';
import { rulesForGame } from '@/data/gameRules';
import { requiresAccountForPlayMode, type PlayMode } from '@/features/auth/routing';
import { useAuth } from '@/features/auth/AuthContext';
import { useSessionStore } from '@/features/game/sessionStore';
import { tapHaptic } from '@/services/haptics';
import { useAppStore } from '@/store';
import { fontFamily, minTapTarget, palette } from '@/theme';

const items = [
  { href: '/home', label: 'Home', icon: Home, match: '/home' },
  { href: '/decks', label: 'Decks', icon: Layers, match: '/decks' },
  { href: '/journey', label: 'Journey', icon: Compass, match: '/journey' },
  { href: '/profile', label: 'Profile', icon: User, match: '/profile' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSessionStore((state) => state.session);
  const { session: authSession } = useAuth();
  const seenRules = useAppStore((state) => state.seenRules);
  const markRulesSeen = useAppStore((state) => state.markRulesSeen);
  const cardRules = rulesForGame('card-game');
  const [playSheet, setPlaySheet] = useState(false);
  const [signInSheet, setSignInSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);
  const [pendingMode, setPendingMode] = useState<PlayMode | null>(null);

  const go = (href: '/home' | '/decks' | '/journey' | '/profile' | '/setup') => {
    void tapHaptic();
    router.push(href);
  };

  const openHelpIfNeeded = (mode: PlayMode) => {
    if (mode === 'online') return;
    if (seenRules['card-game']) return;
    setPendingMode(mode);
    setHelpSheet(true);
  };

  const continueMode = (mode: PlayMode) => {
    if (mode === 'solo') {
      router.push({ pathname: '/setup', params: { deckId: 'identity', mode: 'solo' } });
      return;
    }
    if (mode === 'pass') {
      router.push({ pathname: '/setup', params: { deckId: 'identity', mode: 'pass' } });
      return;
    }
    router.push('/groups');
  };

  const pickMode = (mode: PlayMode) => {
    setPlaySheet(false);
    if (requiresAccountForPlayMode(mode) && !authSession) {
      setSignInSheet(true);
      return;
    }
    if (mode !== 'online' && !seenRules['card-game']) {
      openHelpIfNeeded(mode);
      return;
    }
    continueMode(mode);
  };

  const play = () => {
    void tapHaptic();
    if (session && session.status === 'active') {
      router.push({ pathname: '/game/[sessionId]', params: { sessionId: session.id } });
      return;
    }
    setPlaySheet(true);
  };

  return (
    <>
      <View
        style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
        pointerEvents="box-none"
      >
        <View style={styles.bar}>
          {items.slice(0, 2).map((item) => (
            <TabItem
              key={item.href}
              item={item}
              active={pathname.startsWith(item.match)}
              onPress={() => go(item.href)}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Play"
            onPress={play}
            style={styles.play}
          >
            <Text style={styles.playLabel}>PLAY</Text>
          </Pressable>
          {items.slice(2).map((item) => (
            <TabItem
              key={item.href}
              item={item}
              active={pathname.startsWith(item.match)}
              onPress={() => go(item.href)}
            />
          ))}
        </View>
      </View>
      <PlayModeSheet open={playSheet} onClose={() => setPlaySheet(false)} onPick={pickMode} />
      <SignInToPlaySheet open={signInSheet} onClose={() => setSignInSheet(false)} />
      <GameRulesSheet
        open={helpSheet}
        onClose={() => {
          setHelpSheet(false);
          markRulesSeen('card-game');
          if (pendingMode) {
            continueMode(pendingMode);
            setPendingMode(null);
          }
        }}
        entry={cardRules}
      />
    </>
  );
}

function TabItem({
  item,
  active,
  onPress,
}: {
  item: (typeof items)[number];
  active: boolean;
  onPress: () => void;
}) {
  const Icon = item.icon;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
      onPress={onPress}
      style={styles.item}
    >
      <Icon color={active ? palette.gold : '#C9CDD6'} size={22} strokeWidth={2.2} />
      <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 440,
    marginHorizontal: 12,
    height: 74,
    backgroundColor: palette.midnight,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  item: {
    minWidth: minTapTarget,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
    color: '#C9CDD6',
  },
  labelActive: { color: palette.gold },
  play: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: palette.gold,
    borderBottomWidth: 4,
    borderBottomColor: palette.goldDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  playLabel: {
    fontFamily: fontFamily.heading,
    color: palette.midnight,
    fontSize: 12,
    letterSpacing: 0.6,
  },
});
