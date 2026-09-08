import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  GameSchedule,
  Player,
  Team,
  getFavoritePlayerIds,
  getFavoriteTeamIds,
  getScheduleInRange,
  getTeams,
  getPlayers,
  toLocalDateStr as toDateStr,
  useAppStore,
} from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=일
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7)); // 이번 주 월요일
  return monday;
}

interface HighlightGame {
  game: GameSchedule;
  matchLabel: string; // "삼성 vs 두산" 또는 "이강인/아틀레티코 마드리드 vs 마요르카"
}

/**
 * 이 경기에 나온 즐겨찾기 선수를 찾는다.
 * 야구는 선발 로테이션이 있어서 팀 경기 전체가 아니라 "그 경기에 실제로 선발로 나오는지"까지 확인해야 한다
 * (homeStarterId/awayStarterId, 또는 실제 API가 이름 문자열로만 줄 때는 homeStarterName/awayStarterName으로 매칭).
 * 축구 등 다른 종목은 기존처럼 "그 선수 소속팀 경기면" 매치로 인정한다.
 */
function findFavoritePlayerInGame(
  game: GameSchedule,
  favoritePlayerIds: string[],
  players: Player[],
  playerById: Map<string, Player>
): Player | undefined {
  if (game.sport === 'baseball') {
    const starterId = [game.homeStarterId, game.awayStarterId].find((id) => id && favoritePlayerIds.includes(id));
    if (starterId) return playerById.get(starterId);

    return players.find(
      (p) => favoritePlayerIds.includes(p.id) && (p.name === game.homeStarterName || p.name === game.awayStarterName)
    );
  }

  return players.find(
    (p) => favoritePlayerIds.includes(p.id) && (p.teamId === game.homeTeamId || p.teamId === game.awayTeamId)
  );
}

export default function WeeklyBanner() {
  // 즐겨찾기는 팀/선수 레코드 자체의 favoriteUserIds에 있고, 메인 화면에서 체크된 프로필들
  // (activeUserIds)의 것만 합쳐서 보여준다 — CalendarHeader의 ActiveUserCheckboxRow 참고.
  // dataVersion은 엑셀 재업로드 시 bumpDataVersion()으로 올라가서, 화면을 새로 열지 않아도
  // 바뀐 소속/즐겨찾기가 바로 반영되도록 한다.
  const dataVersion = useAppStore((s) => s.dataVersion);
  const activeUserIds = useAppStore((s) => s.activeUserIds);
  const [items, setItems] = useState<HighlightGame[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const monday = startOfWeek(new Date());
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const [games, teams, players] = await Promise.all([
        getScheduleInRange(toDateStr(monday), toDateStr(sunday)),
        getTeams(),
        getPlayers(),
      ]);
      if (cancelled) return;

      const teamById = new Map<string, Team>(teams.map((t) => [t.id, t]));
      const playerById = new Map<string, Player>(players.map((p) => [p.id, p]));
      const favoriteTeamIds = getFavoriteTeamIds(teams, activeUserIds);
      const favoritePlayerIds = getFavoritePlayerIds(players, activeUserIds);

      const highlights: HighlightGame[] = [];

      for (const game of games) {
        const isFavoriteTeamGame = favoriteTeamIds.includes(game.homeTeamId) || favoriteTeamIds.includes(game.awayTeamId);
        const favoritePlayer = findFavoritePlayerInGame(game, favoritePlayerIds, players, playerById);

        if (!isFavoriteTeamGame && !favoritePlayer) continue;

        const home = teamById.get(game.homeTeamId);
        const away = teamById.get(game.awayTeamId);

        let matchLabel = `${home?.shortName ?? '-'} vs ${away?.shortName ?? '-'}`;
        if (!isFavoriteTeamGame && favoritePlayer) {
          const playerTeam = teamById.get(favoritePlayer.teamId);
          const opponent = favoritePlayer.teamId === game.homeTeamId ? away : home;
          matchLabel = `${favoritePlayer.name}/${playerTeam?.name ?? ''} vs ${opponent?.shortName ?? '-'}`;
        }

        highlights.push({ game, matchLabel });
      }

      highlights.sort((a, b) => a.game.date.localeCompare(b.game.date));
      setItems(highlights);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dataVersion, activeUserIds]);

  if (items.length === 0) return null;

  const isSuperWeek = items.length >= 3;

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{isSuperWeek ? '🔥 SUPER WEEK' : '이번주 일정'}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={items.length >= 3} contentContainerStyle={styles.scrollRow}>
        {items.map(({ game, matchLabel }) => (
          <View key={game.id} style={styles.card}>
            <NumericText style={styles.date}>{game.date.slice(5).replace('-', '/')}</NumericText>
            <AppText style={styles.match}>{matchLabel}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#1D4ED8' },
  scrollRow: { gap: 8 },
  card: { backgroundColor: '#EFF4FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minWidth: 150 },
  date: { fontSize: 11, color: '#5B7BD5', marginBottom: 4 },
  match: { fontSize: 13, fontWeight: '600' },
});
