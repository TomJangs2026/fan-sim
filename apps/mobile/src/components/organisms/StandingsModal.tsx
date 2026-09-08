import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import {
  GameSchedule,
  LeagueZoneConfig,
  Sport,
  StandingEntry,
  Team,
  ZONE_DEFS,
  getLeagueZoneConfig,
  getStandings,
  getZoneForRank,
  getZoneLabel,
  LEAGUE_REGISTRY,
  useAppStore,
} from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';
import TeamLogo, { TeamNameLabel } from '../molecules/TeamLogo';
import RecentFormDots from '../molecules/RecentFormDots';

interface Props {
  visible: boolean;
  sport: Sport;
  leagueId: string;
  teamById: Map<string, Team>;
  allGames: GameSchedule[];
  onClose: () => void;
}

// 승/무/패 중 0인 항목은 표시하지 않는다 (예: 1승0무0패 대신 1승).
function wdlText(wins: number, draws: number, losses: number): string {
  const parts: string[] = [];
  if (wins > 0) parts.push(`${wins}승`);
  if (draws > 0) parts.push(`${draws}무`);
  if (losses > 0) parts.push(`${losses}패`);
  return parts.length > 0 ? parts.join('') : '-';
}

// "마지막 경기 결과" 텍스트(예: "승(3-0) vs 레버쿠젠")는 순위 API가 아니라 이미 불러와 둔
// 이번 달 일정(allGames)에서 계산한다. 그래서 월 경계 근처에는 지난달 경기가 안 잡혀 비어있을 수 있다.
function lastMatchText(teamId: string, allGames: GameSchedule[], teamById: Map<string, Team>): string | null {
  const finished = allGames
    .filter(
      (g) =>
        g.status === 'finished' &&
        (g.homeTeamId === teamId || g.awayTeamId === teamId) &&
        g.homeScore != null &&
        g.awayScore != null
    )
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const last = finished[0];
  if (!last) return null;

  const isHome = last.homeTeamId === teamId;
  const teamScore = isHome ? last.homeScore! : last.awayScore!;
  const oppScore = isHome ? last.awayScore! : last.homeScore!;
  const oppId = isHome ? last.awayTeamId : last.homeTeamId;
  const oppName = teamById.get(oppId)?.shortName ?? '-';
  const outcome = teamScore > oppScore ? '승' : teamScore < oppScore ? '패' : '무';

  return `${outcome}(${teamScore}-${oppScore}) vs ${oppName}`;
}

export default function StandingsModal({ visible, sport, leagueId, teamById, allGames, onClose }: Props) {
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [zoneConfig, setZoneConfig] = useState<LeagueZoneConfig | undefined>(undefined);
  const dataVersion = useAppStore((s) => s.dataVersion);

  useEffect(() => {
    if (!visible) return;
    getStandings(sport, leagueId).then(setStandings);
    getLeagueZoneConfig(leagueId).then(setZoneConfig);
  }, [visible, sport, leagueId, dataVersion]);

  // mock 순위표는 종목 단위로만 있어서, 같은 종목 안에 여러 리그(K리그/EPL 등)가 섞이지 않도록
  // 이 경기가 속한 리그의 팀들만 걸러서 보여준다.
  const leagueStandings = standings.filter((s) => teamById.get(s.teamId)?.leagueIds.includes(leagueId));

  // 순위표 API에서 승점/득점/실점까지 받아온 경우(지금은 축구만)에만 새 레이아웃을 쓰고,
  // 그 외(야구, 서버 꺼져서 기본 mock만 있는 경우 등)는 기존 간단한 줄을 보여준다.
  const hasDetailedStats = leagueStandings.length > 0 && leagueStandings.every((s) => s.points != null);
  const usedZoneKeys = new Set(ZONE_DEFS.filter((z) => zoneConfig?.[z.key]).map((z) => z.key));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <AppText style={styles.title}>{LEAGUE_REGISTRY[leagueId]?.label ?? ''} 순위표</AppText>

          {hasDetailedStats && (
            <View style={styles.statHeaderRow}>
              <View style={styles.statHeaderSpacer} />
              <NumericText style={[styles.statHeaderText, styles.statPoints]}>승점</NumericText>
              <NumericText style={[styles.statHeaderText, styles.statPlayed]}>경기</NumericText>
              <NumericText style={[styles.statHeaderText, styles.statWdl, styles.statWdlAlign]}>승무패</NumericText>
              <NumericText style={[styles.statHeaderText, styles.statGoals]}>득점</NumericText>
              <NumericText style={[styles.statHeaderText, styles.statGoals]}>실점</NumericText>
              <NumericText style={[styles.statHeaderText, styles.statGoals]}>득실</NumericText>
            </View>
          )}

          <FlatList
            data={leagueStandings}
            keyExtractor={(s) => s.teamId}
            renderItem={({ item }) => {
              const zone = getZoneForRank(item.rank, zoneConfig);
              const team = teamById.get(item.teamId);

              if (!hasDetailedStats) {
                return (
                  <View style={styles.row}>
                    <View style={[styles.zoneBar, { backgroundColor: zone?.color ?? 'transparent' }]} />
                    <NumericText style={styles.rank}>{item.rank}</NumericText>
                    <TeamLogo team={team} size={28} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <TeamNameLabel team={team} />
                    </View>
                    <NumericText style={styles.record}>
                      {item.wins}승 {item.draws}무 {item.losses}패
                    </NumericText>
                    <RecentFormDots form={item.recentForm} />
                  </View>
                );
              }

              const points = item.points ?? item.wins * 3 + item.draws;
              const played = item.wins + item.draws + item.losses;
              const gf = item.goalsFor ?? 0;
              const ga = item.goalsAgainst ?? 0;
              const gd = gf - ga;
              const lastMatch = lastMatchText(item.teamId, allGames, teamById);

              return (
                <View style={styles.detailedRow}>
                  <View style={styles.mainLine}>
                    <View style={[styles.zoneBar, { backgroundColor: zone?.color ?? 'transparent' }]} />
                    <NumericText style={styles.rank}>{item.rank}</NumericText>
                    <TeamLogo team={team} size={28} />
                    <View style={styles.nameColumn}>
                      <TeamNameLabel team={team} />
                    </View>
                    <NumericText style={[styles.statValue, styles.statPoints]}>{points}</NumericText>
                    <NumericText style={[styles.statValue, styles.statPlayed]}>{played}</NumericText>
                    <NumericText style={[styles.statValue, styles.statWdl, styles.statWdlAlign]}>
                      {wdlText(item.wins, item.draws, item.losses)}
                    </NumericText>
                    <NumericText style={[styles.statValue, styles.statGoals]}>{gf}</NumericText>
                    <NumericText style={[styles.statValue, styles.statGoals]}>{ga}</NumericText>
                    <NumericText style={[styles.statValue, styles.statGoals]}>{gd > 0 ? `+${gd}` : gd}</NumericText>
                  </View>
                  <View style={styles.subLine}>
                    <RecentFormDots form={item.recentForm} />
                    {lastMatch && <AppText style={styles.lastMatchText}>{lastMatch}</AppText>}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={<AppText style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>이 리그의 순위 데이터가 아직 없어요.</AppText>}
          />

          {usedZoneKeys.size > 0 && (
            <View style={styles.legendWrap}>
              {ZONE_DEFS.filter((z) => usedZoneKeys.has(z.key)).map((z) => (
                <View key={z.key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: z.color }]} />
                  <AppText style={styles.legendText}>{getZoneLabel(z.key, leagueId)}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rank: { width: 22, fontSize: 13, fontWeight: '700' },
  record: { fontSize: 11, color: '#777', marginRight: 8 },

  zoneBar: { width: 4, height: 28, borderRadius: 2, marginRight: 6 },

  statHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  // nameColumn과 마찬가지로 flex:1로 남는 공간을 채워야, 팀 이름 길이와 무관하게
  // 데이터 행의 승점/경기/... 칸과 헤더 라벨이 항상 같은 x좌표에서 시작한다.
  statHeaderSpacer: { flex: 1 },
  statHeaderText: { fontSize: 10, color: '#999', textAlign: 'center' },

  detailedRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  mainLine: { flexDirection: 'row', alignItems: 'center' },
  nameColumn: { flex: 1, marginLeft: 8, marginRight: 4 },
  statValue: { fontSize: 12, textAlign: 'center' },
  statPoints: { width: 30, fontWeight: '700' },
  statPlayed: { width: 28, color: '#666' },
  statWdl: { width: 56, color: '#444' },
  statWdlAlign: { textAlign: 'left' },
  statGoals: { width: 28, color: '#666' },

  subLine: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 4 + 6 + 22 + 28 + 8, gap: 8 },
  lastMatchText: { fontSize: 11, color: '#888' },

  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#777' },
});
