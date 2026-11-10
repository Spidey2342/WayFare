import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Info, RefreshCw } from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

/** Frame-aligned debate surfaces (dark game UI). */
export const debateUi = {
  bg: palette.midnightDeep,
  card: palette.midnightRaised,
  cardBorder: '#2E3348',
  muted: '#9CA3AF',
  agree: palette.coral,
  disagree: palette.teal,
  gold: palette.gold,
  goldEdge: palette.goldDeep,
  ink: palette.midnight,
} as const;

export function formatDebateCategory(raw: string): string {
  const cleaned = raw.replace(/[-_]/g, ' ').trim();
  if (!cleaned) return 'TOPIC';
  return cleaned.toUpperCase();
}

export function DebateModeHeader({
  title = 'DEBATE MODE',
  onBack,
  onInfo,
}: {
  title?: string | null;
  onBack?: () => void;
  onInfo?: () => void;
}) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={styles.headerSide}
      >
        {onBack ? <Text style={styles.backChevron}>{'‹'}</Text> : null}
      </Pressable>
      {title ? <Text style={styles.headerTitle}>{title}</Text> : <View style={styles.headerSide} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="How debate works"
        onPress={onInfo}
        style={styles.headerSide}
      >
        {onInfo ? <Info color={debateUi.muted} size={20} /> : null}
      </Pressable>
    </View>
  );
}

export function DebateTopicCard({
  category,
  text,
  compact,
}: {
  category?: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.topicCard, compact && styles.topicCardCompact]}>
      {category ? <Text style={styles.categoryLabel}>CATEGORY: {category}</Text> : null}
      {!compact ? <Text style={styles.topicKicker}>CURRENT TOPIC</Text> : null}
      <Text style={[styles.topicText, compact && styles.topicTextCompact]}>{text}</Text>
    </View>
  );
}

export function DebateKindnessQuote() {
  return (
    <Text style={styles.kindness}>
      Be sharp, be kind. The best arguments are built on grace and logic.
    </Text>
  );
}

export function DebateGoldButton({
  label,
  disabled,
  loading,
  onPress,
  testID,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.goldBtn, (disabled || loading) && styles.goldBtnDisabled]}
    >
      <Text style={styles.goldBtnLabel}>{label}</Text>
    </Pressable>
  );
}

export function DebateOutlineButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress?: () => void;
  icon?: 'shuffle';
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.outlineBtn}>
      {icon === 'shuffle' ? <RefreshCw color={debateUi.muted} size={16} /> : null}
      <Text style={styles.outlineBtnLabel}>{label}</Text>
    </Pressable>
  );
}

export type DebateSidePlayer = { id: string; displayName: string; avatarKey?: string | null };

export function DebateSideBoard({
  agree,
  disagree,
  selectedSide,
  onPickSide,
  readOnly,
}: {
  agree: DebateSidePlayer[];
  disagree: DebateSidePlayer[];
  selectedSide?: 'agree' | 'disagree' | null;
  onPickSide?: (side: 'agree' | 'disagree') => void;
  readOnly?: boolean;
}) {
  return (
    <View style={styles.sideRow}>
      <DebateSidePanel
        label="AGREE"
        tint={debateUi.agree}
        players={agree}
        selected={selectedSide === 'agree'}
        onPress={readOnly ? undefined : () => onPickSide?.('agree')}
      />
      <DebateSidePanel
        label="DISAGREE"
        tint={debateUi.disagree}
        players={disagree}
        selected={selectedSide === 'disagree'}
        onPress={readOnly ? undefined : () => onPickSide?.('disagree')}
      />
    </View>
  );
}

function DebateSidePanel({
  label,
  tint,
  players,
  selected,
  onPress,
}: {
  label: string;
  tint: string;
  players: DebateSidePlayer[];
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={[styles.sidePanel, { borderColor: tint }, selected && styles.sidePanelSelected]}
    >
      <View style={styles.sidePanelHead}>
        <Text style={[styles.sidePanelLabel, { color: tint }]}>{label}</Text>
        <View style={[styles.countBadge, { backgroundColor: tint }]}>
          <Text style={styles.countBadgeText}>{players.length}</Text>
        </View>
      </View>
      <DebateAvatarRow players={players} size={36} maxVisible={5} />
      {selected ? <Text style={[styles.selectedTag, { color: tint }]}>SELECTED</Text> : null}
    </Pressable>
  );
}

export function DebateJudgeBar({
  name,
  highlight,
  hostBadge,
}: {
  name: string;
  highlight?: boolean;
  hostBadge?: boolean;
}) {
  return (
    <View style={[styles.judgeBar, highlight && styles.judgeBarHighlight]}>
      <Avatar name={name} color={avatarColorForKey(name)} size={44} ring={highlight} />
      <View style={styles.judgeTextCol}>
        <Text style={styles.judgeName}>{name}</Text>
        <Text style={styles.judgeBadge}>THE JUDGE</Text>
      </View>
      {hostBadge ? <Text style={styles.hostBadge}>Host</Text> : null}
    </View>
  );
}

export function DebateWaitingDots({ label }: { label: string }) {
  return (
    <View style={styles.waitBlock}>
      <View style={styles.dotsRow}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
      <Text style={styles.waitGold}>{label}</Text>
    </View>
  );
}

export function DebateSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function DebateTimerChip({ label }: { label: string }) {
  return (
    <View style={styles.timerChip}>
      <View style={styles.timerDot} />
      <Text style={styles.timerChipText}>{label}</Text>
    </View>
  );
}

export function DebateSoftTimerRow({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (minutes: 3 | 5 | 10 | null) => void;
}) {
  return (
    <View style={styles.softTimerSheet}>
      <View style={styles.softTimerHead}>
        <Text style={styles.softTimerTitle}>Add soft timer</Text>
        <Text style={styles.softTimerHint}>Optional alarm</Text>
      </View>
      <View style={styles.softTimerRow}>
        {([3, 5, 10] as const).map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => onSelect(minutes)}
            style={[styles.softTimerPill, selected === minutes && styles.softTimerPillOn]}
          >
            <Text
              style={[styles.softTimerPillText, selected === minutes && styles.softTimerPillTextOn]}
            >
              {minutes} MIN
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onSelect(null)}
          style={[styles.softTimerPill, selected === null && styles.softTimerPillOn]}
        >
          <Text style={[styles.softTimerPillText, selected === null && styles.softTimerPillTextOn]}>
            No limit
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function DebateVerdictPicker({
  selected,
  onSelect,
  mvpPlayers,
  mvpId,
  onMvp,
}: {
  selected: 'agree' | 'disagree' | 'draw' | null;
  onSelect: (side: 'agree' | 'disagree' | 'draw') => void;
  mvpPlayers: DebateSidePlayer[];
  mvpId: string | null;
  onMvp: (id: string) => void;
}) {
  return (
    <View style={styles.verdictBlock}>
      <Text style={styles.verdictHeader}>FINAL JUDGMENT</Text>
      <Text style={styles.verdictQuestion}>Who made the stronger case?</Text>
      <View style={styles.sideRow}>
        {(['agree', 'disagree'] as const).map((side) => (
          <Pressable
            key={side}
            onPress={() => onSelect(side)}
            style={[
              styles.verdictCard,
              side === 'agree' ? styles.verdictAgree : styles.verdictDisagree,
              selected === side && styles.verdictCardOn,
            ]}
          >
            <Text style={styles.verdictCardLabel}>{side === 'agree' ? 'AGREE' : 'DISAGREE'}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => onSelect('draw')} style={styles.drawBtn}>
        <Text style={styles.drawBtnText}>= IT&apos;S A DRAW</Text>
      </Pressable>
      <View style={styles.mvpHead}>
        <Text style={styles.mvpLabel}>SELECT MVP (OPTIONAL)</Text>
        <Text style={styles.mvpPts}>+2 PTS</Text>
      </View>
      <View style={styles.mvpRow}>
        {mvpPlayers.map((player) => (
          <Pressable key={player.id} onPress={() => onMvp(player.id)} style={styles.mvpItem}>
            <Avatar
              name={player.displayName}
              color={avatarColorForKey(player.avatarKey ?? player.id)}
              size={48}
              ring={mvpId === player.id}
            />
            <Text style={[styles.mvpName, mvpId === player.id && styles.mvpNameOn]}>
              {player.displayName.split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function DebatePlayerWait({
  title,
  body,
  judgeName,
}: {
  title: string;
  body: string;
  judgeName?: string;
}) {
  return (
    <View style={styles.playerWait}>
      <Text style={styles.debateConcluded}>DEBATE CONCLUDED</Text>
      <Text style={styles.waitTitle}>{title}</Text>
      <Text style={styles.waitBody}>{body}</Text>
      {judgeName ? (
        <View style={styles.judgeFoot}>
          <Text style={styles.judgeFootLabel}>JUDGE {judgeName}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DebateScreenBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

export function DebateChoosingRow({
  players,
  onSelectPlayer,
}: {
  players: DebateSidePlayer[];
  onSelectPlayer?: (playerId: string) => void;
}) {
  if (players.length === 0) return null;
  return (
    <View style={styles.choosingBlock}>
      <Text style={styles.choosingLabel}>
        {onSelectPlayer ? 'CHOOSING — TAP TO ASSIGN' : 'CHOOSING'}
      </Text>
      <View style={styles.avatarStack}>
        {players.map((player) => (
          <Pressable
            key={player.id}
            disabled={!onSelectPlayer}
            onPress={() => onSelectPlayer?.(player.id)}
          >
            <Avatar
              name={player.displayName}
              color={avatarColorForKey(player.avatarKey ?? player.id)}
              size={32}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function DebateMutedFooter({ children }: { children: string }) {
  return <Text style={styles.mutedFooter}>{children}</Text>;
}

/** D10 — verbatim banner copy from DESIGN_CONTRACT.md */
export function DebateOfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>YOU ARE OFFLINE</Text>
    </View>
  );
}

export function DebatePresenceChip({ state }: { state: 'online' | 'reconnecting' | 'away' }) {
  const label = state === 'online' ? 'Online' : state === 'reconnecting' ? 'Reconnecting' : 'Away';
  const tint =
    state === 'online' ? palette.teal : state === 'reconnecting' ? palette.gold : debateUi.muted;
  return (
    <View style={[styles.presenceChip, { borderColor: tint }]}>
      <View style={[styles.presenceDot, { backgroundColor: tint }]} />
      <Text style={[styles.presenceChipText, { color: tint }]}>{label}</Text>
    </View>
  );
}

export function DebateAvatarRow({
  players,
  size = 36,
  maxVisible = 5,
}: {
  players: DebateSidePlayer[];
  size?: number;
  maxVisible?: number;
}) {
  const visible = players.slice(0, maxVisible);
  const overflow = players.length - visible.length;
  return (
    <View style={styles.avatarStack}>
      {visible.map((player) => (
        <View key={player.id} style={styles.avatarWrap}>
          <Avatar
            name={player.displayName}
            color={avatarColorForKey(player.avatarKey ?? player.id)}
            size={size}
          />
        </View>
      ))}
      {overflow > 0 ? (
        <View style={[styles.plusChip, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.plusChipText}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DebateWaitingOthersRow({ players }: { players: DebateSidePlayer[] }) {
  if (players.length === 0) return null;
  return (
    <View style={styles.waitingOthers}>
      <Text style={styles.waitingOthersLabel}>WAITING FOR OTHERS...</Text>
      <DebateAvatarRow players={players} size={32} maxVisible={6} />
    </View>
  );
}

export function DebateEmptySideBanner() {
  return (
    <View style={styles.emptySideBanner}>
      <Text style={styles.emptySideBannerText}>
        One side has no debaters. You can still call for a verdict when ready.
      </Text>
    </View>
  );
}

export type DebateParticipantRow = DebateSidePlayer & {
  presence: 'online' | 'reconnecting' | 'away';
  subtitle?: string;
};

/** D10 incomplete teams + participant list (frame copy). */
export function DebateSetupEdgePanel({
  participants,
  offline,
}: {
  participants: DebateParticipantRow[];
  offline?: boolean;
}) {
  return (
    <View style={styles.setupEdge}>
      {offline ? <DebateOfflineBanner /> : null}
      <Text style={styles.setupEdgeTitle}>Debate Setup</Text>
      <View style={styles.teamsRow}>
        <Text style={styles.teamsLabel}>TEAMS</Text>
        <View style={styles.incompletePill}>
          <Text style={styles.incompletePillText}>Incomplete</Text>
        </View>
      </View>
      <Text style={styles.setupEdgeError}>
        Each side needs at least 1 player to start the debate.
      </Text>
      <Text style={styles.participantsHead}>PARTICIPANTS</Text>
      <View style={styles.participantList}>
        {participants.map((player) => (
          <View key={player.id} style={styles.participantRow}>
            <Avatar
              name={player.displayName}
              color={avatarColorForKey(player.avatarKey ?? player.id)}
              size={40}
            />
            <View style={styles.participantText}>
              <Text style={styles.participantName}>{player.displayName}</Text>
              {player.subtitle ? (
                <Text style={styles.participantSub}>{player.subtitle}</Text>
              ) : null}
            </View>
            <DebatePresenceChip state={player.presence} />
          </View>
        ))}
      </View>
      <Text style={styles.addMoreHint}>Add more players</Text>
    </View>
  );
}

export function DebateSupersededBanner() {
  return (
    <View style={styles.supersededBanner}>
      <Text style={styles.supersededText}>You joined from another device.</Text>
    </View>
  );
}

export function DebateStanceToggle({
  selected,
  onSelect,
}: {
  selected: 'agree' | 'disagree';
  onSelect: (side: 'agree' | 'disagree') => void;
}) {
  return (
    <View style={styles.stanceBlock}>
      <Text style={styles.stanceKicker}>PICK YOUR STANCE</Text>
      <View style={styles.sideRow}>
        {(['agree', 'disagree'] as const).map((side) => {
          const on = selected === side;
          const tint = side === 'agree' ? debateUi.agree : debateUi.disagree;
          return (
            <Pressable
              key={side}
              onPress={() => onSelect(side)}
              style={[styles.stanceTile, on && { borderColor: tint, borderWidth: 2 }]}
            >
              <Text style={[styles.stanceTileLabel, on && { color: tint }]}>
                {side === 'agree' ? 'AGREE' : 'DISAGREE'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function DebateDailyChallengeCard({
  text,
  onShuffle,
}: {
  text: string;
  onShuffle?: () => void;
}) {
  return (
    <View style={styles.dailyCard}>
      <View style={styles.dailyHead}>
        <Text style={styles.dailyLabel}>DAILY CHALLENGE</Text>
      </View>
      <Text style={styles.dailyText}>{text}</Text>
      {onShuffle ? (
        <Pressable onPress={onShuffle} style={styles.dailyShuffle}>
          <RefreshCw color={debateUi.muted} size={14} />
          <Text style={styles.dailyShuffleText}>SHUFFLE TOPIC</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: minTapTarget,
    marginBottom: spacing.md,
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 32,
    lineHeight: 36,
    color: debateUi.muted,
    marginTop: -4,
  },
  headerTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 2,
    color: palette.white,
  },
  body: { gap: spacing.md, paddingBottom: spacing.xl },
  topicCard: {
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topicCardCompact: { padding: spacing.md },
  categoryLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: debateUi.gold,
    textAlign: 'center',
  },
  topicKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: debateUi.gold,
  },
  topicText: {
    ...typeScale.bodyL,
    color: palette.white,
    textAlign: 'center',
    lineHeight: 26,
  },
  topicTextCompact: { fontSize: 15, textAlign: 'left' },
  kindness: {
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 22,
    color: debateUi.muted,
    textAlign: 'center',
  },
  goldBtn: {
    backgroundColor: debateUi.gold,
    borderRadius: radii.lg,
    borderBottomWidth: 4,
    borderBottomColor: debateUi.goldEdge,
    minHeight: minTapTarget + 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  goldBtnDisabled: { opacity: 0.45 },
  goldBtnLabel: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    letterSpacing: 0.8,
    color: debateUi.ink,
  },
  outlineBtn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    minHeight: minTapTarget + 4,
    paddingHorizontal: spacing.lg,
  },
  outlineBtnLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    letterSpacing: 0.6,
    color: palette.white,
  },
  sideRow: { flexDirection: 'row', gap: spacing.sm },
  sidePanel: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 180,
    backgroundColor: debateUi.card,
  },
  sidePanelSelected: { borderWidth: 3 },
  sidePanelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidePanelLabel: { fontFamily: fontFamily.headingSemi, fontSize: 14, letterSpacing: 0.5 },
  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: { fontFamily: fontFamily.headingSemi, fontSize: 13, color: palette.white },
  avatarStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  avatarWrap: { marginHorizontal: 2 },
  showAll: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: debateUi.gold,
    textAlign: 'center',
  },
  selectedTag: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    textAlign: 'center',
  },
  judgeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
  },
  judgeBarHighlight: { borderColor: debateUi.gold, borderWidth: 2 },
  judgeTextCol: { flex: 1, gap: 2 },
  judgeName: { fontFamily: fontFamily.bodySemi, fontSize: 16, color: palette.white },
  judgeBadge: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.gold,
  },
  hostBadge: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: debateUi.muted,
    letterSpacing: 0.5,
  },
  waitBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: debateUi.gold },
  waitGold: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    color: debateUi.gold,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 2,
    color: palette.white,
    textAlign: 'center',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: debateUi.gold,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: debateUi.ink },
  timerChipText: { fontFamily: fontFamily.headingSemi, fontSize: 16, color: debateUi.ink },
  softTimerSheet: {
    backgroundColor: debateUi.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  softTimerHead: { flexDirection: 'row', justifyContent: 'space-between' },
  softTimerTitle: { fontFamily: fontFamily.bodySemi, color: palette.white, fontSize: 13 },
  softTimerHint: { fontFamily: fontFamily.body, color: debateUi.muted, fontSize: 12 },
  softTimerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  softTimerPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  softTimerPillOn: { backgroundColor: debateUi.gold, borderColor: debateUi.gold },
  softTimerPillText: { fontFamily: fontFamily.bodySemi, fontSize: 12, color: palette.white },
  softTimerPillTextOn: { color: debateUi.ink },
  verdictBlock: { gap: spacing.md },
  verdictHeader: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 2,
    color: palette.white,
    textAlign: 'center',
  },
  verdictQuestion: { ...typeScale.h3, color: palette.white, textAlign: 'center' },
  verdictCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 2,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: debateUi.card,
  },
  verdictAgree: { borderColor: debateUi.agree },
  verdictDisagree: { borderColor: debateUi.disagree },
  verdictCardOn: { borderWidth: 3 },
  verdictCardLabel: { fontFamily: fontFamily.headingSemi, fontSize: 16, color: palette.white },
  drawBtn: {
    borderRadius: radii.lg,
    backgroundColor: debateUi.card,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawBtnText: { fontFamily: fontFamily.bodySemi, fontSize: 13, color: palette.white },
  mvpHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mvpLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.gold,
  },
  mvpPts: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 0.5,
    color: debateUi.gold,
  },
  mvpRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  mvpItem: { alignItems: 'center', gap: 4, minWidth: 64 },
  mvpName: { fontFamily: fontFamily.body, fontSize: 12, color: debateUi.muted },
  mvpNameOn: { color: debateUi.gold, fontFamily: fontFamily.bodySemi },
  playerWait: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  debateConcluded: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: debateUi.muted,
  },
  waitTitle: { ...typeScale.h2, color: palette.white, textAlign: 'center' },
  waitBody: {
    fontFamily: fontFamily.body,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: debateUi.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  judgeFoot: {
    marginTop: spacing.lg,
    backgroundColor: debateUi.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  judgeFootLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.5,
    color: debateUi.gold,
  },
  choosingBlock: { gap: spacing.sm, alignItems: 'center' },
  choosingLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    color: debateUi.muted,
  },
  mutedFooter: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
    color: debateUi.muted,
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#2A1218',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  offlineBannerText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#FF5C5C',
    textAlign: 'center',
  },
  stanceBlock: { gap: spacing.sm },
  stanceKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: debateUi.muted,
  },
  stanceTile: {
    flex: 1,
    minHeight: 88,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    backgroundColor: debateUi.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stanceTileLabel: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    letterSpacing: 0.5,
    color: debateUi.muted,
  },
  dailyCard: {
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dailyHead: { flexDirection: 'row', justifyContent: 'space-between' },
  dailyLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    color: debateUi.gold,
  },
  dailyText: { ...typeScale.bodyL, color: palette.white, lineHeight: 26 },
  dailyShuffle: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  dailyShuffleText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    color: debateUi.muted,
  },
  presenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  presenceDot: { width: 6, height: 6, borderRadius: 3 },
  presenceChipText: { fontFamily: fontFamily.bodySemi, fontSize: 10 },
  plusChip: {
    backgroundColor: debateUi.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  plusChipText: { fontFamily: fontFamily.bodySemi, fontSize: 11, color: palette.white },
  waitingOthers: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  waitingOthersLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: debateUi.muted,
  },
  emptySideBanner: {
    backgroundColor: '#2A1218',
    borderRadius: radii.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  emptySideBannerText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#FF5C5C',
    textAlign: 'center',
  },
  setupEdge: { gap: spacing.md },
  setupEdgeTitle: { ...typeScale.h2, color: palette.white },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  teamsLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    color: palette.white,
  },
  incompletePill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#FF5C5C',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  incompletePillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: '#FF5C5C',
  },
  setupEdgeError: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: '#FF5C5C',
    lineHeight: 20,
  },
  participantsHead: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: debateUi.muted,
    marginTop: spacing.sm,
  },
  participantList: { gap: spacing.sm },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  participantText: { flex: 1, gap: 2 },
  participantName: { fontFamily: fontFamily.bodySemi, fontSize: 15, color: palette.white },
  participantSub: { fontFamily: fontFamily.body, fontSize: 12, color: debateUi.muted },
  addMoreHint: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: debateUi.gold,
    textAlign: 'center',
  },
  supersededBanner: {
    backgroundColor: debateUi.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: debateUi.gold,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  supersededText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: debateUi.gold,
    textAlign: 'center',
  },
});
