import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { DebateResultsView } from '@/features/debate/components/DebateResultsView';
import { PassReadyScreen } from '@/features/debate/components/PassReadyScreen';
import { PassToPlayerScreen } from '@/features/debate/components/PassToPlayerScreen';
import {
  DebateChoosingRow,
  DebateDailyChallengeCard,
  DebateGoldButton,
  DebateJudgeBar,
  DebateKindnessQuote,
  DebateModeHeader,
  DebateMutedFooter,
  DebateOutlineButton,
  DebatePlayerWait,
  DebateSetupEdgePanel,
  DebateSideBoard,
  DebateSoftTimerRow,
  DebateStanceToggle,
  DebateTimerChip,
  DebateTopicCard,
  DebateVerdictPicker,
  DebateWaitingDots,
  DebateWaitingOthersRow,
  debateUi,
  formatDebateCategory,
  type DebateSidePlayer,
} from '@/features/debate/components/debateV2Ui';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

const TOPIC = 'Is social media doing more harm than good for youth ministries?';

function sidePlayers(count: number, prefix: string): DebateSidePlayer[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    displayName: `${prefix} ${index + 1}`,
    avatarKey: `${prefix}-${index}`,
  }));
}

function twelveSidePlayers(): { agree: DebateSidePlayer[]; disagree: DebateSidePlayer[] } {
  return { agree: sidePlayers(6, 'Agree'), disagree: sidePlayers(6, 'Disagree') };
}

type Props = { frameId: string };

export function DebateV2FramePreview({ frameId }: Props) {
  const id = frameId.toUpperCase();

  const body = (() => {
    switch (id) {
      case 'D1':
        return (
          <>
            <DebateModeHeader title="DEBATE MODE" />
            <DebateTopicCard category={formatDebateCategory('faith-tech')} text={TOPIC} />
            <DebateKindnessQuote />
            <DebateGoldButton label="USE THIS TOPIC" />
            <DebateOutlineButton label="SHUFFLE TOPIC" icon="shuffle" />
          </>
        );
      case 'D2':
        return (
          <>
            <DebateModeHeader title="DEBATE MODE" />
            <DebateTopicCard category={formatDebateCategory('faith-tech')} text={TOPIC} />
            <DebateWaitingDots label="LEADER IS CHOOSING A TOPIC..." />
          </>
        );
      case 'D3':
      case 'D3-12':
        return (
          <>
            <DebateModeHeader title="CHOOSE SIDES" />
            <DebateTopicCard text={TOPIC} compact />
            <DebateSideBoard
              agree={id === 'D3-12' ? twelveSidePlayers().agree : sidePlayers(2, 'Agree')}
              disagree={id === 'D3-12' ? twelveSidePlayers().disagree : sidePlayers(1, 'Disagree')}
              readOnly
            />
            <DebateJudgeBar name="Jordan M. (You)" highlight />
            <DebateChoosingRow players={sidePlayers(1, 'Pick')} />
            <DebateMutedFooter>Waiting for at least 1 player on each side</DebateMutedFooter>
            <DebateGoldButton label="START DEBATE" disabled />
          </>
        );
      case 'D4':
      case 'D4-12':
        return (
          <>
            <DebateModeHeader title="CHOOSE YOUR SIDE" />
            <DebateTopicCard text={TOPIC} compact />
            <DebateSideBoard
              agree={id === 'D4-12' ? twelveSidePlayers().agree : sidePlayers(2, 'Agree')}
              disagree={id === 'D4-12' ? twelveSidePlayers().disagree : sidePlayers(1, 'Disagree')}
              selectedSide="agree"
            />
            <DebateJudgeBar name="Jordan M." hostBadge />
            <DebateWaitingOthersRow players={sidePlayers(2, 'Wait')} />
            <DebateMutedFooter>WAITING FOR LEADER TO START</DebateMutedFooter>
          </>
        );
      case 'D5':
      case 'D5-12':
        return (
          <>
            <DebateModeHeader title="DEBATE MODE" />
            <View style={styles.debateTop}>
              <DebateTimerChip label="12:40" />
            </View>
            <DebateTopicCard text={TOPIC} />
            <DebateSideBoard
              agree={id === 'D5-12' ? twelveSidePlayers().agree : sidePlayers(3, 'Agree')}
              disagree={id === 'D5-12' ? twelveSidePlayers().disagree : sidePlayers(2, 'Disagree')}
              readOnly
            />
            <DebateGoldButton label="READY FOR VERDICT" />
            <DebateSoftTimerRow selected={5} onSelect={() => undefined} />
          </>
        );
      case 'D6':
        return (
          <>
            <DebateVerdictPicker
              selected="agree"
              onSelect={() => undefined}
              mvpPlayers={sidePlayers(3, 'Debater')}
              mvpId={null}
              onMvp={() => undefined}
            />
            <DebateGoldButton label="ANNOUNCE WINNER" />
          </>
        );
      case 'D7':
        return (
          <DebatePlayerWait
            title="The leader is deciding..."
            body="Great arguments everyone! Let's see who took the crown this round."
            judgeName="Jordan M."
          />
        );
      case 'D8':
        return (
          <DebateResultsView
            variant="v2"
            dark
            resultsAudience="leader"
            showChangeVerdict
            onChangeVerdict={() => undefined}
            xpEarned={5}
            results={{
              winningSides: ['agree'],
              sideTie: false,
              sideTotals: { agree: 4, disagree: 2 },
              playerTotals: {},
              mvpIds: ['p1'],
              mvpTie: false,
            }}
            players={[]}
            scores={{}}
            onPlayAgain={() => undefined}
            onBack={() => undefined}
            backLabel="BACK TO GROUP"
          />
        );
      case 'D9':
        return (
          <DebateResultsView
            variant="v2"
            dark
            resultsAudience="player"
            viewerScore={{
              playerId: 'p1',
              participation: 1,
              sideWin: 3,
              mvp: 2,
              total: 6,
            }}
            xpEarned={6}
            results={{
              winningSides: ['agree'],
              sideTie: false,
              sideTotals: { agree: 4, disagree: 2 },
              playerTotals: { p1: 6 },
              mvpIds: ['p1'],
              mvpTie: false,
            }}
            players={[]}
            scores={{}}
            onPlayAgain={() => undefined}
            onBack={() => undefined}
            backLabel="BACK TO GROUP"
          />
        );
      case 'D10':
        return (
          <DebateSetupEdgePanel
            offline
            participants={[
              {
                id: '1',
                displayName: 'Player Alpha',
                presence: 'reconnecting',
                subtitle: 'Debater',
              },
              {
                id: '2',
                displayName: 'Player Beta',
                presence: 'online',
                subtitle: 'Debater',
              },
            ]}
          />
        );
      case 'S2':
        return <PassToPlayerScreen playerName="Ama" avatarKey="ama" onConfirm={() => undefined} />;
      case 'S3':
        return (
          <PassReadyScreen
            topic={TOPIC}
            players={[
              { id: '1', displayName: 'Host (You)', side: null },
              { id: '2', displayName: 'Debater A', side: 'agree' },
              { id: '3', displayName: 'Debater B', side: 'disagree' },
            ]}
            judgeId="1"
            canStart
            onStart={() => undefined}
          />
        );
      case 'O1':
        return (
          <>
            <DebateModeHeader title="SOLO MODE" />
            <DebateDailyChallengeCard text={TOPIC} />
            <DebateStanceToggle selected="agree" onSelect={() => undefined} />
            <DebateGoldButton label="START SOLO DEBATE" />
          </>
        );
      case 'O2':
        return (
          <>
            <Text style={styles.stance}>STANCE: AGREE</Text>
            <DebateTimerChip label="0:30" />
            <Text style={typeScale.h2}>Make Your Case</Text>
            <Text style={styles.quote}>&ldquo;{TOPIC}&rdquo;</Text>
            <Text style={styles.pointsKicker}>YOUR 3 MAIN POINTS</Text>
            <DebateGoldButton label="I'VE MADE MY CASE" />
          </>
        );
      case 'O3':
        return (
          <>
            <Text style={typeScale.h2}>The Verdict</Text>
            <View style={styles.rewardRow}>
              <Text style={styles.rewardLabel}>POINTS EARNED</Text>
              <Text style={styles.rewardLabel}>DAY STREAK</Text>
            </View>
            <DebateGoldButton label="ANOTHER TOPIC" />
          </>
        );
      case 'A3':
        return (
          <Text style={styles.unknown}>
            A3 merge sheet removed (accounts only, DEBATE_SPEC section 15).
          </Text>
        );
      default:
        return <Text style={styles.unknown}>Unknown frame {id}</Text>;
    }
  })();

  return (
    <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
      <ScrollView contentContainerStyle={styles.scroll}>{body}</ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  debateTop: { alignItems: 'center', paddingVertical: spacing.sm },
  stance: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    color: debateUi.agree,
  },
  quote: { fontFamily: fontFamily.body, color: palette.white, fontSize: 15, lineHeight: 22 },
  pointsKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.muted,
  },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-around' },
  rewardLabel: { fontFamily: fontFamily.bodySemi, color: debateUi.gold, fontSize: 11 },
  unknown: { color: palette.coral, fontFamily: fontFamily.body },
});
