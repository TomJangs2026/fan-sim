import { GameSchedule, GameStatus, StandingEntry } from '../types';
import { LEAGUE_REGISTRY } from './leagueRegistry';
import { getEffectiveTeamsByLeague } from './teamPlayerStore';
import { getProxiedImageUrl } from './teamLogo';
import { CHANNELS}  from '../db/constants';

// 로컬에서 packages/backend/scraper-server를 실행했을 때의 기본 주소.
// 실기기(Expo Go)에서 테스트할 때는 localhost가 아니라 컴퓨터의 LAN IP로 바꿔야 한다.
const SCRAPER_BASE_URL = process.env.EXPO_PUBLIC_SCRAPER_URL || 'http://localhost:5000';

const STATUS_MAP: Record<string, GameStatus> = {
  BEFORE: 'scheduled',
  RESULT: 'finished',
  CANCEL: 'cancelled',
};

// 네이버는 취소된 경기도 statusCode는 그대로 'BEFORE'로 두고 statusDesc에만 "경기취소"/"우천취소"
// 같은 문구를 실어 보낸다. statusCode만 보면 취소 경기가 "예정"으로 보이는 문제가 있어
// statusDesc도 같이 확인한다.
function resolveStatus(code: string, statusDesc: string): GameStatus {
  if (code === 'CANCEL' || statusDesc?.includes('취소')) return 'cancelled';
  return STATUS_MAP[code] ?? 'live';
}

interface NaverStandingRaw {
  teamCode: string;
  teamName: string;
  rank: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goals: number;
  goalsConceded: number;
  goalsDifference: number;
  recentForm: string; // 예: "WWDLW", 뒤에서부터가 가장 최근 경기
}

interface NaverGameRaw {
  gameId: string;
  dateTime: string; // "2026-08-15T19:00:00"
  status: string;
  stadium: string;
  statusDesc: string;
  homeTeamCode: string;
  homeTeamName: string;
  homeScore: number | null;
  homeStarter: string | null;
  homeEmblemUrl: string | null;
  awayTeamCode: string;
  awayTeamName: string;
  awayScore: number | null;
  awayStarter: string | null;
  awayEmblemUrl: string | null;
  broadcastChannel: string | null;
}

/**
 * 지정한 리그(leagueId)의 지정한 날짜(YYYY-MM-DD) 일정을 스크래퍼 프록시 서버에서 가져와
 * GameSchedule[] 형태로 변환한다. 팀 매칭은 naverCode 기준이며, 팀 목록은 기본 데이터 +
 * 엑셀 업로드분(teamPlayerStore.ts)을 합친 최종 목록을 쓴다.
 *
 * 두 팀 중 하나라도 우리 로스터에 등록돼 있으면 경기를 보여준다(예: 챔피언스리그처럼 참가팀이
 * 36개나 돼서 전부 등록하기 현실적으로 어려운 대회 — 관심 있는 팀만 등록해도 그 팀 경기는 보이고,
 * 로스터에 없는 상대는 실제 API가 주는 이름/엠블럼(homeTeamName 등)으로 표시용 폴백만 채운다).
 * 둘 다 모르는 팀이면(우리 로스터와 무관한 경기) 제외한다.
 * 서버가 꺼져 있거나 실패하거나 등록 안 된 리그면 빈 배열을 반환한다 (호출부가 mock으로 폴백).
 */
export async function fetchScheduleFromNaverProxy(leagueId: string, date: string): Promise<GameSchedule[]> {
  const league = LEAGUE_REGISTRY[leagueId];
  if (!league) return [];

  const teams = await getEffectiveTeamsByLeague(leagueId);
  const teamByCode = new Map(teams.map((t) => [t.naverCode, t.id]));
  if (teamByCode.size === 0) return []; // 이 리그에 아직 등록된 팀이 하나도 없음

  try {
    const res = await fetch(`${SCRAPER_BASE_URL}/api/schedule?leagueId=${leagueId}&date=${date}`);
    if (!res.ok) return [];

    const json = await res.json();
    if (!json.success) return [];

    const raw: NaverGameRaw[] = json.data ?? [];

    return raw
      .map((g): GameSchedule | null => {
        const channel = CHANNELS.find(ch => ch.name === g.broadcastChannel)?.webUrl || `https://sports.naver.com/game/${g.gameId}`;
        const homeTeamId = teamByCode.get(g.homeTeamCode);
        const awayTeamId = teamByCode.get(g.awayTeamCode);
        if (!homeTeamId && !awayTeamId) return null; // 둘 다 로스터에 없으면 우리와 무관한 경기

        const [datePart, timePart] = g.dateTime.split('T');
        const time = timePart ? timePart.slice(0, 5) : '';

        return {
          id: `naver-${g.gameId}`,
          sport: league.sport,
          leagueId,
          date: datePart,
          time,
          status: resolveStatus(g.status, g.statusDesc),
          stadium: g.stadium,
          liveState: g.status !== 'BEFORE' && g.status !== 'RESULT' ? { label: g.statusDesc } : undefined,
          // 로스터에 없는 쪽은 실제 팀 id가 없으니, 절대 우리 팀 id와 안 겹치는 임시 id를 넣고
          // (teamById.get()이 undefined를 돌려주게) 이름/로고는 homeTeamName 등 폴백 필드로 보여준다.
          homeTeamId: homeTeamId ?? `naver-team-${g.homeTeamCode}`,
          awayTeamId: awayTeamId ?? `naver-team-${g.awayTeamCode}`,
          homeTeamName: g.homeTeamName,
          awayTeamName: g.awayTeamName,
          homeTeamLogoUrl: g.homeEmblemUrl ? getProxiedImageUrl(g.homeEmblemUrl) : undefined,
          awayTeamLogoUrl: g.awayEmblemUrl ? getProxiedImageUrl(g.awayEmblemUrl) : undefined,
          homeScore: g.homeScore ?? undefined,
          awayScore: g.awayScore ?? undefined,
          homeStarterName: g.homeStarter ?? undefined,
          awayStarterName: g.awayStarter ?? undefined,
          // 문자중계/게임센터 페이지: gameId 패턴으로 구성한 최선의 추정 링크.
          textBroadcastUrl: `https://sports.naver.com/game/${g.gameId}`,
          tvBroadcastName: g.broadcastChannel ?? undefined,
          tvBroadcastUrl: channel,
        };
      })
      .filter((g): g is GameSchedule => g !== null);
  } catch (e) {
    console.warn(`[naverSportsAdapter] fetch failed for ${leagueId}, falling back to mock:`, e);
    return [];
  }
}

/**
 * 지정한 리그(leagueId)의 실제 순위표를 스크래퍼 프록시 서버(네이버 "기록,순위" 통계 API)에서 가져온다.
 * 팀 매칭은 fetchScheduleFromNaverProxy와 동일하게 naverCode 기준.
 * 서버가 꺼져 있거나 실패하거나 등록 안 된 리그(야구 등)면 빈 배열을 반환한다 (호출부가 mock으로 폴백).
 */
export async function fetchStandingsFromNaverProxy(leagueId: string): Promise<StandingEntry[]> {
  const league = LEAGUE_REGISTRY[leagueId];
  if (!league) return [];

  const teams = await getEffectiveTeamsByLeague(leagueId);
  const teamByCode = new Map(teams.map((t) => [t.naverCode, t.id]));
  if (teamByCode.size === 0) return [];

  try {
    const res = await fetch(`${SCRAPER_BASE_URL}/api/standings?leagueId=${leagueId}`);
    if (!res.ok) return [];

    const json = await res.json();
    if (!json.success) return [];

    const raw: NaverStandingRaw[] = json.data ?? [];

    return raw
      .map((s): StandingEntry | null => {
        const teamId = teamByCode.get(s.teamCode);
        if (!teamId) return null; // 아직 등록 안 된 팀 코드는 제외

        // recentForm은 "WWDLW"처럼 앞이 오래된 경기, 뒤가 최근 경기다.
        // 우리 쪽 StandingEntry.recentForm은 배열 맨 앞이 가장 최근이어야 해서 뒤집어서 최대 5개만 쓴다.
        const recentForm = s.recentForm
          .split('')
          .reverse()
          .slice(0, 5)
          .filter((c): c is 'W' | 'D' | 'L' => c === 'W' || c === 'D' || c === 'L');

        return {
          teamId,
          rank: s.rank,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          points: s.points,
          goalsFor: s.goals,
          goalsAgainst: s.goalsConceded,
          recentForm,
        };
      })
      .filter((s): s is StandingEntry => s !== null);
  } catch (e) {
    console.warn(`[naverSportsAdapter] standings fetch failed for ${leagueId}, falling back to mock:`, e);
    return [];
  }
}
