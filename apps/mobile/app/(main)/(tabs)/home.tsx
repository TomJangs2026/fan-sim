import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GameSchedule,
  LeagueGroup,
  Player,
  Sport,
  Team,
  getLeaguesByGroup,
  getPlayers,
  getScheduleInRange,
  getTeams,
  toLocalDateStr,
  useAppStore,
} from '@fan-sim/core';
import CalendarHeader from '../../../src/components/organisms/CalendarHeader';
import MonthSelector from '../../../src/components/organisms/MonthSelector';
import WeeklyBanner from '../../../src/components/organisms/WeeklyBanner';
import AdBannerPlaceholder from '../../../src/components/organisms/AdBannerPlaceholder';
import NationalityTabs from '../../../src/components/organisms/NationalityTabs';
import LeagueSelector, { GROUP_VALUE_PREFIX } from '../../../src/components/organisms/LeagueSelector';
import ScheduleTabs, { ScheduleTab } from '../../../src/components/organisms/ScheduleTabs';
import GameScheduleItem from '../../../src/components/organisms/GameScheduleItem';
import StandingsModal from '../../../src/components/organisms/StandingsModal';
import GameDetailModal from '../../../src/components/organisms/GameDetailModal';
import AppText from '../../../src/components/atoms/AppText';

function monthRange(dateStr: string) {
  const [y, m] = dateStr.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

/** 선택한 날짜의 연/월이 실제 오늘 기준으로 몇 달 차이나는지 (0=이번달, 음수=과거, 양수=미래) */
function monthDiffFromToday(dateStr: string) {
  const [y, m] = dateStr.split('-').map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1));
}

export default function HomeScreen() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  // 엑셀 재업로드나 새로고침(수동 버튼/당겨서 새로고침/자동 갱신) 때마다 bumpDataVersion()으로
  // 올라가는 카운터. 의존성에 넣어두면 화면을 새로 열지 않아도 최신 데이터를 다시 불러온다.
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  const [games, setGames] = useState<GameSchedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [standingsGame, setStandingsGame] = useState<{ sport: Sport; leagueId: string } | null>(null);
  const [detailGame, setDetailGame] = useState<GameSchedule | null>(null);
  const [tab, setTab] = useState<ScheduleTab>('today');
  const [selectedLeague, setSelectedLeague] = useState<string | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string | 'all'>('all');

  // 경기가 실시간으로 진행 중일 수 있어서 1분마다 자동으로 새로고침한다.
  useEffect(() => {
    const id = setInterval(() => bumpDataVersion(), 60_000);
    return () => clearInterval(id);
  }, [bumpDataVersion]);

  useEffect(() => {
    getTeams().then(setTeams);
    getPlayers().then(setPlayers);
  }, [dataVersion]);

  useEffect(() => {
    const { start, end } = monthRange(selectedDate);
    // 이번달 전체를 가져와두면 탭 전환 시 재요청 없이 필터링만으로 오늘/어제/지난/예정을 보여줄 수 있고,
    // "최근 5경기" 승무패 계산에도 이 데이터를 재사용한다.
    getScheduleInRange(start, end).then((next) => {
      setGames(next);
      setRefreshing(false);
    });
  }, [selectedDate, dataVersion]);

  function handlePullToRefresh() {
    setRefreshing(true);
    bumpDataVersion();
  }

  const todayStr = toLocalDateStr(new Date());
  const yesterdayStr = addDays(todayStr, -1);

  const monthDiff = monthDiffFromToday(selectedDate);
  const isPastMonth = monthDiff < 0;
  const isFutureMonth = monthDiff > 0;
  const selectedMonthNum = Number(selectedDate.split('-')[1]);

  // 국적 탭에서 선택한 나라 선수가 있는 팀 id 집합. 선수 목록(players)에서 country가 일치하는
  // 선수의 teamId를 모아두고, 그 팀이 나온 경기만 걸러 보여준다.
  const countryTeamIds = useMemo(() => {
    if (selectedCountry === 'all') return null;
    return new Set(players.filter((p) => p.country === selectedCountry).map((p) => p.teamId));
  }, [players, selectedCountry]);

  const displayedGames = useMemo(() => {
    let leagueFiltered = games;
    if (selectedLeague.startsWith(GROUP_VALUE_PREFIX)) {
      const groupId = selectedLeague.slice(GROUP_VALUE_PREFIX.length) as LeagueGroup;
      const groupLeagueIds = new Set(getLeaguesByGroup(groupId).map((l) => l.id));
      leagueFiltered = games.filter((g) => groupLeagueIds.has(g.leagueId));
    } else if (selectedLeague !== 'all') {
      leagueFiltered = games.filter((g) => g.leagueId === selectedLeague);
    }

    if (countryTeamIds) {
      leagueFiltered = leagueFiltered.filter((g) => countryTeamIds.has(g.homeTeamId) || countryTeamIds.has(g.awayTeamId));
    }

    // 지난 달/다음 달을 보고 있으면 오늘/어제/지난/예정 탭 구분이 의미가 없으므로
    // 그 달에 불러온 경기 전체를 보여준다 (과거 달은 최신순, 미래 달은 이른 날짜순).
    if (isPastMonth) return [...leagueFiltered].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    if (isFutureMonth) return [...leagueFiltered].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    switch (tab) {
      case 'today':
        return leagueFiltered.filter((g) => g.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
      case 'yesterday':
        return leagueFiltered.filter((g) => g.date === yesterdayStr).sort((a, b) => a.time.localeCompare(b.time));
      case 'past':
        // 그제 이전(어제보다 더 과거) 경기, 최근 날짜부터
        return leagueFiltered.filter((g) => g.date < yesterdayStr).sort((a, b) => b.date.localeCompare(a.date));
      case 'upcoming':
        // 내일 이후 예정 경기, 가까운 날짜부터
        return leagueFiltered.filter((g) => g.date > todayStr).sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [games, tab, todayStr, yesterdayStr, isPastMonth, isFutureMonth, selectedLeague, countryTeamIds]);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const playerById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1줄 + 2줄: 고정 영역 */}
      <View style={styles.fixedHeader}>
        <CalendarHeader />
        <MonthSelector />
      </View>

      {/* 3줄(배너)+4줄(광고)+탭은 리스트 헤더로 넣어서 스크롤 시 함께 사라지도록 처리 */}
      <FlatList
        style={{ flex: 1 }}
        data={displayedGames}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handlePullToRefresh} />}
        ListHeaderComponent={
          <View>
            <WeeklyBanner />
            <AdBannerPlaceholder />
            <NationalityTabs value={selectedCountry} onChange={setSelectedCountry} />
            <LeagueSelector value={selectedLeague} onChange={setSelectedLeague} />
            {isPastMonth || isFutureMonth ? (
              <AppText style={styles.monthTitle}>{selectedMonthNum}월 {isPastMonth ? '경기결과' : '예정경기'}</AppText>
            ) : (
              <ScheduleTabs value={tab} onChange={setTab} />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <GameScheduleItem
            game={item}
            allGames={games}
            teamById={teamById}
            playerById={playerById}
            onOpenStandings={() => setStandingsGame({ sport: item.sport, leagueId: item.leagueId })}
            onOpenDetail={() => setDetailGame(item)}
          />
        )}
      />

      {standingsGame && (
        <StandingsModal
          visible={!!standingsGame}
          sport={standingsGame.sport}
          leagueId={standingsGame.leagueId}
          teamById={teamById}
          allGames={games}
          onClose={() => setStandingsGame(null)}
        />
      )}

      {detailGame && (
        <GameDetailModal visible={!!detailGame} game={detailGame} teamById={teamById} onClose={() => setDetailGame(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  fixedHeader: { paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  monthTitle: { fontSize: 15, fontWeight: '700', marginVertical: 10 },
});
