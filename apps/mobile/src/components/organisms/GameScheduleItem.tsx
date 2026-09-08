import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { GameSchedule, Player, StandingEntry, Team, getStandings, toLocalDateStr, useAppStore } from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';
import RoundLabel from '../atoms/RoundLabel';
import TeamLogo, { TeamNameLabel } from '../molecules/TeamLogo';
import RecentFormDots from '../molecules/RecentFormDots';
import { TextBroadcastLink, TvBroadcastLink } from '../molecules/BroadcastLinks';

const SPORT_LABEL: Record<string, string> = { baseball: '야구', soccer: '축구' };

interface Props {
  game: GameSchedule;
  allGames: GameSchedule[];
  teamById: Map<string, Team>;
  playerById: Map<string, Player>;
  onOpenStandings: () => void;
}

function statusLabel(game: GameSchedule) {
  if (game.status === 'scheduled') return '예정';
  if (game.status === 'live') return game.liveState?.label ?? '진행중';
  if (game.status === 'cancelled') return '취소';
  return '종료';
}

function statusColors(game: GameSchedule): { backgroundColor: string; textColor: string } {
  if (game.status === 'live') return { backgroundColor: '#FEE2E2', textColor: '#DC2626' };
  if (game.status === 'cancelled') return { backgroundColor: '#F3F4F6', textColor: '#9CA3AF' };
  return { backgroundColor: '#F1F5F9', textColor: '#555' };
}

function timeOrDateLabel(game: GameSchedule) {
  const todayStr = toLocalDateStr(new Date());
  if (game.date === todayStr) return game.time; // 오늘 경기: 시간 표시
  const gameDateTime = `${game.date.slice(5).replace('-', '/')}\n${game.time}`
  return gameDateTime; //game.date.slice(5).replace('-', '/'); // 다른 날짜: 날짜만 표시 (예: 08/13)
}

/**
 * 이미 불러와 둔(같은 달) 경기 목록에서, 해당 팀의 종료된 경기를 기준일 이전으로 최근 5개 뽑아
 * 승/무/패를 계산한다. 별도 API 호출 없이 home.tsx에서 이미 가져온 데이터를 재사용한다.
 * 주의: 이번 달 데이터 안에서만 계산하므로, 월 초반이라 지난 경기가 5개 미만이면 그만큼만 나온다.
 */
function computeRecentForm(teamId: string, allGames: GameSchedule[], beforeDate: string): ('W' | 'D' | 'L')[] {
  const finished = allGames
    .filter(
      (g) =>
        g.status === 'finished' &&
        (g.homeTeamId === teamId || g.awayTeamId === teamId) &&
        g.date <= beforeDate &&
        g.homeScore != null &&
        g.awayScore != null
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  return finished.slice(0, 5).map((g) => {
    const isHome = g.homeTeamId === teamId;
    const teamScore = isHome ? g.homeScore! : g.awayScore!;
    const oppScore = isHome ? g.awayScore! : g.homeScore!;
    if (teamScore > oppScore) return 'W';
    if (teamScore < oppScore) return 'L';
    return 'D';
  });
}

function TeamRow({
  team,
  fallbackName,
  fallbackLogoUrl,
  rank,
  awayOrHome,
  starterName,
  score,
  showScore,
  form,
  rightSlot,
}: {
  team?: Team;
  fallbackName?: string;
  fallbackLogoUrl?: string;
  rank?: number;
  awayOrHome: string;
  starterName?: string;
  score?: number;
  showScore: boolean;
  form: ('W' | 'D' | 'L')[];
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={styles.teamRow}>
      <View style={styles.rankColumn}>
        <RoundLabel label={rank ? `${rank}위` : '-'} backgroundColor="#EEF0F3" />
        <AppText style={styles.awayHomeText}>{awayOrHome}</AppText>
      </View>

      <TeamLogo team={team} size={32} fallbackName={fallbackName} fallbackLogoUrl={fallbackLogoUrl} />

      <View style={styles.nameColumn}>
        <TeamNameLabel team={team} fallbackName={fallbackName} />
        <RecentFormDots form={form} />
      </View>

      <View style={styles.starterColumn}>
        <AppText style={styles.starterText} numberOfLines={1}>
          {starterName ?? '-'}
        </AppText>
      </View>

      <View style={styles.scoreColumn}>{showScore && <NumericText style={styles.scoreText}>{score ?? 0}</NumericText>}</View>

      <View style={styles.rightSlot}>{rightSlot}</View>
    </View>
  );
}

export default function GameScheduleItem({ game, allGames, teamById, playerById, onOpenStandings }: Props) {
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const dataVersion = useAppStore((s) => s.dataVersion);

  useEffect(() => {
    getStandings(game.sport, game.leagueId).then(setStandings);
  }, [game.sport, game.leagueId, dataVersion]);

  const rankOf = (teamId: string) => standings.find((s) => s.teamId === teamId)?.rank;

  const homeTeam = teamById.get(game.homeTeamId);
  const awayTeam = teamById.get(game.awayTeamId);
  // 실제 API는 선발투수를 "이름 문자열"로만 준다(homeStarterName). Player 레코드가 있으면
  // 그쪽 이름을 우선 쓰고, 없으면 game에 실려온 이름 문자열을 그대로 보여준다.
  const homeStarterName = (game.homeStarterId ? playerById.get(game.homeStarterId)?.name : undefined) ?? game.homeStarterName;
  const awayStarterName = (game.awayStarterId ? playerById.get(game.awayStarterId)?.name : undefined) ?? game.awayStarterName;

  const showScore = game.status === 'finished' || game.status === 'live';

  // 최근 5경기 승무패: 목업이 아니라 이미 불러와 둔 실제 경기 결과(allGames)에서 계산한다.
  const homeForm = computeRecentForm(game.homeTeamId, allGames, game.date);
  const awayForm = computeRecentForm(game.awayTeamId, allGames, game.date);

  // 스펙: 2줄 = 야구는 원정팀, 축구는 홈팀 / 3줄 = 야구는 홈팀, 축구는 원정팀
  const isBaseball = game.sport === 'baseball';
  const awayLabel = '원정';
  const homeLabel = game.stadium? `홈 (${game.stadium})` : '홈';  
  const row2 = isBaseball
    ? {
        team: awayTeam,
        fallbackName: game.awayTeamName,
        fallbackLogoUrl: game.awayTeamLogoUrl,
        rank: rankOf(game.awayTeamId),
        label: awayLabel,
        starterName: awayStarterName,
        score: game.awayScore,
        form: awayForm,
      }
    : {
        team: homeTeam,
        fallbackName: game.homeTeamName,
        fallbackLogoUrl: game.homeTeamLogoUrl,
        rank: rankOf(game.homeTeamId),
        label: homeLabel,
        starterName: homeStarterName,
        score: game.homeScore,
        form: homeForm,
      };
  const row3 = isBaseball
    ? {
        team: homeTeam,
        fallbackName: game.homeTeamName,
        fallbackLogoUrl: game.homeTeamLogoUrl,
        rank: rankOf(game.homeTeamId),
        label: homeLabel,
        starterName: homeStarterName,
        score: game.homeScore,
        form: homeForm,
      }
    : {
        team: awayTeam,
        fallbackName: game.awayTeamName,
        fallbackLogoUrl: game.awayTeamLogoUrl,
        rank: rankOf(game.awayTeamId),
        label: awayLabel,
        starterName: awayStarterName,
        score: game.awayScore,
        form: awayForm,
      };

  return (
    <View style={styles.card}>
      {/* 1줄 */}
      <View style={styles.topRow}>
        <RoundLabel label={SPORT_LABEL[game.sport]} backgroundColor="#1D4ED8" textColor="#fff" />
        <NumericText style={styles.time}>{timeOrDateLabel(game)}</NumericText>
        <RoundLabel label={statusLabel(game)} backgroundColor={statusColors(game).backgroundColor} textColor={statusColors(game).textColor} />
        <AppText style={styles.highlight} numberOfLines={1}>
          {game.highlight ?? ''}
        </AppText>
        <TouchableOpacity onPress={onOpenStandings} style={styles.standingsBtn}>
          <AppText style={styles.standingsIcon}>🏆</AppText>
        </TouchableOpacity>
      </View>

      {/* 2줄 */}
      <TeamRow
        team={row2.team}
        fallbackName={row2.fallbackName}
        fallbackLogoUrl={row2.fallbackLogoUrl}
        rank={row2.rank}
        awayOrHome={row2.label}
        starterName={row2.starterName}
        score={row2.score}
        showScore={showScore}
        form={row2.form}
        rightSlot={<TextBroadcastLink url={game.textBroadcastUrl} />}
      />

      {/* 3줄 */}
      <TeamRow
        team={row3.team}
        fallbackName={row3.fallbackName}
        fallbackLogoUrl={row3.fallbackLogoUrl}
        rank={row3.rank}
        awayOrHome={row3.label}
        starterName={row3.starterName}
        score={row3.score}
        showScore={showScore}
        form={row3.form}
        rightSlot={<TvBroadcastLink name={game.tvBroadcastName} url={game.tvBroadcastUrl} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, elevation: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  time: { fontSize: 12, color: '#666' },
  highlight: { flex: 1, fontSize: 12, color: '#EA580C', fontWeight: '600' },
  standingsBtn: { padding: 4 },
  standingsIcon: { fontSize: 16 },

  teamRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  rankColumn: { width: 44, alignItems: 'flex-start' },
  awayHomeText: { fontSize: 10, color: '#999', marginTop: 2 },
  nameColumn: { width: 64 },
  starterColumn: { flex: 1 },
  starterText: { fontSize: 12, color: '#666' },
  scoreColumn: { width: 28, alignItems: 'center' },
  scoreText: { fontSize: 18, fontWeight: '800' },
  rightSlot: { minWidth: 76, alignItems: 'flex-end' },
});
