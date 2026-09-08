import { GameSchedule, Player, Sport, StandingEntry, Team } from '../types';
import { generateMockSchedule, generateMockStandings } from './mock/schedule';
import { fetchScheduleFromNaverProxy, fetchStandingsFromNaverProxy } from './naverSportsAdapter';
import { getAllLeagues } from './leagueRegistry';
import { getEffectiveTeams, getEffectivePlayers, getEffectiveTeamsByLeague } from './teamPlayerStore';

export { getAllLeagues } from './leagueRegistry';
export {
  upsertTeamsFromRows,
  upsertPlayersFromRows,
  toggleTeamFavoriteForUser,
  togglePlayerFavoriteForUser,
  getKnownFavoriteUserIds,
  getFavoriteTeamIds,
  getFavoritePlayerIds,
} from './teamPlayerStore';

/**
 * 스포츠 데이터 어댑터.
 *
 * 팀/선수는 이제 getEffectiveTeams()/getEffectivePlayers()를 통해
 * "기본 데이터 + 엑셀 업로드로 보강된 데이터"를 합쳐서 가져온다 (teamPlayerStore.ts 참고).
 * 일정/순위 mock도 이 최종 팀 목록을 기준으로 생성되므로, 엑셀로 팀을 추가하면
 * mock 일정에도 곧바로 반영된다.
 *
 * 실제 연동 옵션 (2026년 기준):
 * - 축구: 상용 API(API-SPORTS 등)도 있지만 지금은 네이버 스포츠 비공식 API를 스크래핑해서 씀
 * - 야구(KBO): 공식 무료 실시간 API가 없음. packages/backend/scraper-server 참고
 * - API 키/크롤러는 클라이언트가 아니라 별도 백엔드에 두는 구조를 권장한다.
 *
 * USE_NAVER_PROXY: packages/backend/scraper-server를 붙였는지 여부.
 * true로 켜면 팀 매핑이 등록된 리그는 실제 데이터를 쓰고, 실패하거나 매핑이 없으면
 * 그 리그만 자동으로 mock으로 대체된다.
 */
const USE_NAVER_PROXY = true;

let cachedSchedule: GameSchedule[] | null = null;
let cachedStandings: Record<Sport, StandingEntry[]> | null = null;

async function ensureCache() {
  if (!cachedSchedule || !cachedStandings) {
    const [teams, players] = await Promise.all([getEffectiveTeams(), getEffectivePlayers()]);
    if (!cachedSchedule) cachedSchedule = generateMockSchedule(teams, players);
    if (!cachedStandings) cachedStandings = generateMockStandings(teams) as unknown as Record<Sport, StandingEntry[]>;
  }
}

/** 엑셀 업로드 등으로 팀/선수 데이터가 바뀌었을 때 mock 캐시를 다시 만들도록 호출 */
export function invalidateScheduleCache() {
  cachedSchedule = null;
  cachedStandings = null;
}

function toYYYYMMDD(dateStr: string) {
  // 네이버 쪽도 YYYY-MM-DD 형식을 쓰므로 그대로 전달한다 (함수명은 과거 호환용으로 유지).
  return dateStr;
}

export async function getTeams(sport?: Sport): Promise<Team[]> {
  const teams = await getEffectiveTeams();
  return sport ? teams.filter((t) => t.sport === sport) : teams;
}

export async function getTeamById(teamId: string): Promise<Team | undefined> {
  const teams = await getEffectiveTeams();
  return teams.find((t) => t.id === teamId);
}

export async function searchTeams(query: string): Promise<Team[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const teams = await getEffectiveTeams();
  return teams.filter((t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q));
}

export async function getPlayers(teamId?: string): Promise<Player[]> {
  const players = await getEffectivePlayers();
  return teamId ? players.filter((p) => p.teamId === teamId) : players;
}

export async function searchPlayers(query: string): Promise<Player[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const players = await getEffectivePlayers();
  return players.filter((p) => p.name.toLowerCase().includes(q));
}

export async function getScheduleByDate(date: string): Promise<GameSchedule[]> {
  await ensureCache();
  const mockGames = cachedSchedule!.filter((g) => g.date === date);

  if (!USE_NAVER_PROXY) return mockGames;

  const dateStr = toYYYYMMDD(date);
  // 팀 매핑이 하나라도 등록된 리그만 실제로 호출한다 (불필요한 네트워크 요청을 줄이기 위해 미리 거름).
  const leagues = getAllLeagues();
  const leaguesWithTeams = (
    await Promise.all(leagues.map(async (l) => ((await getEffectiveTeamsByLeague(l.id)).length > 0 ? l : null)))
  ).filter((l): l is NonNullable<typeof l> => l !== null);

  const resultsByLeague = await Promise.all(leaguesWithTeams.map((l) => fetchScheduleFromNaverProxy(l.id, dateStr)));
  const naverGames = resultsByLeague.flat();

  // 실제 데이터가 하나도 없으면(서버 꺼짐 등) 통째로 mock으로 폴백, 있으면 그걸 우선 쓰고
  // 아직 실데이터가 없는 리그만 mock에서 보충한다.
  if (naverGames.length === 0) return mockGames;

  const coveredLeagueIds = new Set(naverGames.map((g) => g.leagueId));
  const mockFallback = mockGames.filter((g) => !coveredLeagueIds.has(g.leagueId));

  return [...naverGames, ...mockFallback];
}

export async function getScheduleInRange(startDate: string, endDate: string): Promise<GameSchedule[]> {
  await ensureCache();

  if (!USE_NAVER_PROXY) {
    return cachedSchedule!.filter((g) => g.date >= startDate && g.date <= endDate);
  }

  // 날짜 범위를 하루씩 순회한다 (프록시 서버 자체에 20초 캐시가 있어 반복 호출 부담은 크지 않다).
  const results: GameSchedule[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    // eslint-disable-next-line no-await-in-loop
    const games = await getScheduleByDate(dateStr);
    results.push(...games);
    cursor.setDate(cursor.getDate() + 1);
  }

  return results;
}

/**
 * leagueId를 같이 주면(예: 경기 카드/순위표 모달) 실제 순위를 먼저 시도하고,
 * 서버가 꺼져 있거나 그 리그가 아직 지원 안 되면(현재는 축구만) mock으로 폴백한다.
 * leagueId 없이 sport만 주면 항상 mock(여러 리그가 섞인 종목 전체 목록)을 반환한다.
 */
export async function getStandings(sport: Sport, leagueId?: string): Promise<StandingEntry[]> {
  await ensureCache();

  if (USE_NAVER_PROXY && leagueId) {
    const teams = await getEffectiveTeamsByLeague(leagueId);
    if (teams.length > 0) {
      const naverStandings = await fetchStandingsFromNaverProxy(leagueId);
      if (naverStandings.length > 0) return naverStandings;
    }
  }

  const mockStandings = cachedStandings![sport] ?? [];
  if (!leagueId) return mockStandings;

  const leagueTeamIds = new Set((await getEffectiveTeamsByLeague(leagueId)).map((t) => t.id));
  return mockStandings.filter((s) => leagueTeamIds.has(s.teamId));
}
