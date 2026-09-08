import { GameSchedule, Player, StandingEntry, Team } from '../../types';
import { toLocalDateStr as toDateStr } from '../../utils/date';

/**
 * 오늘(now) 기준 -3일 ~ +10일 범위의 mock 일정을 생성한다.
 * teams/players는 매번 호출부(sportsDataService.ts)에서 getEffectiveTeams()/getEffectivePlayers()로
 * 구한 "기본값 + 엑셀 업로드분" 최종 목록을 넘겨준다.
 */
export function generateMockSchedule(teams: Team[], players: Player[], now: Date = new Date()): GameSchedule[] {
  const games: GameSchedule[] = [];

  const baseballTeamIds = teams.filter((t) => t.sport === 'baseball').map((t) => t.id);

  // 리그별로 묶어서 로테이션해야 서로 다른 리그 팀끼리 매치업으로 묶이는 일이 없다
  // (예: 종목만 보고 축구 팀을 통째로 섞으면 EPL 팀과 K리그 팀이 한 경기로 나오는 문제가 생겼었음).
  // 한 팀이 여러 리그에 속할 수 있어서(예: 뮌헨 = "GSoccer1,champs") leagueIds 전부를 돌며
  // 소속된 모든 그룹에 넣어준다 — 첫 번째 리그만 보면 챔피언스리그 쪽 그룹이 항상 비게 된다.
  const soccerLeagueGroups = Object.entries(
    teams
      .filter((t) => t.sport === 'soccer')
      .reduce<Record<string, Team[]>>((acc, t) => {
        for (const leagueId of t.leagueIds) {
          (acc[leagueId] ??= []).push(t);
        }
        return acc;
      }, {})
  )
    .map(([leagueId, leagueTeams]) => ({ leagueId, teams: leagueTeams }))
    .filter((group) => group.teams.length >= 2);

  function starterFor(teamId: string) {
    return players.find((p) => p.teamId === teamId && p.isStarter)?.id;
  }

  if (baseballTeamIds.length < 2 || soccerLeagueGroups.length === 0) {
    // 팀이 아직 2개 미만이면(업로드 직후 이상 상태 등) mock을 만들 수 없으니 빈 일정을 반환한다.
    return games;
  }

  let soccerDayIdx = 0;

  for (let offset = -3; offset <= 10; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const dateStr = toDateStr(day);

    // 야구: 매일 1경기 (팀 로테이션)
    const bIdx = ((offset % baseballTeamIds.length) + baseballTeamIds.length) % baseballTeamIds.length;
    const homeId = baseballTeamIds[bIdx];
    const awayId = baseballTeamIds[(bIdx + 1) % baseballTeamIds.length];
    const gameTime = new Date(day);
    gameTime.setHours(18, 30, 0, 0);
    const isPast = gameTime.getTime() < now.getTime() - 3 * 60 * 60 * 1000;
    const isLive = !isPast && gameTime.getTime() < now.getTime();

    games.push({
      id: `bb-${dateStr}`,
      sport: 'baseball',
      leagueId: 'KBaseball1',
      date: dateStr,
      time: '18:30',
      status: isPast ? 'finished' : isLive ? 'live' : 'scheduled',
      stadium: '',
      liveState: isLive ? { label: '5회초' } : undefined,
      highlight: offset === 2 ? '라이벌 더비' : offset === 5 ? '1위 탈환 기회' : undefined,
      homeTeamId: homeId,
      awayTeamId: awayId,
      homeScore: isPast || isLive ? Math.floor(Math.random() * 8) : undefined,
      awayScore: isPast || isLive ? Math.floor(Math.random() * 8) : undefined,
      homeStarterId: starterFor(homeId),
      awayStarterId: starterFor(awayId),
      textBroadcastUrl: 'https://sports.news.naver.com/index',
      tvBroadcastName: 'SBS Sports',
      tvBroadcastUrl: 'https://programs.sbs.co.kr/sports',
    });

    // 축구: 이틀에 한 번꼴로 1경기. 그 날 쓸 리그를 먼저 로테이션으로 고른 뒤,
    // 그 리그 안에서만 홈/원정을 뽑아야 리그가 섞이지 않는다.
    if (offset % 2 === 0) {
      const group = soccerLeagueGroups[soccerDayIdx % soccerLeagueGroups.length];
      const sIdx = Math.floor(soccerDayIdx / soccerLeagueGroups.length) % group.teams.length;
      const homeS = group.teams[sIdx];
      const awayS = group.teams[(sIdx + 1) % group.teams.length];
      soccerDayIdx++;
      const sTime = new Date(day);
      sTime.setHours(21, 0, 0, 0);
      const sIsPast = sTime.getTime() < now.getTime() - 2 * 60 * 60 * 1000;
      const sIsLive = !sIsPast && sTime.getTime() < now.getTime();

      games.push({
        id: `sc-${dateStr}`,
        sport: 'soccer',
        leagueId: group.leagueId,
        date: dateStr,
        time: '21:00',
        status: sIsPast ? 'finished' : sIsLive ? 'live' : 'scheduled',
        stadium: '',
        liveState: sIsLive ? { label: '후반 12분' } : undefined,
        highlight: offset === 4 ? '리그 선두 경쟁' : undefined,
        homeTeamId: homeS.id,
        awayTeamId: awayS.id,
        homeScore: sIsPast || sIsLive ? Math.floor(Math.random() * 4) : undefined,
        awayScore: sIsPast || sIsLive ? Math.floor(Math.random() * 4) : undefined,
        homeStarterId: starterFor(homeS.id),
        awayStarterId: starterFor(awayS.id),
        textBroadcastUrl: 'https://sports.news.naver.com/index',
        tvBroadcastName: 'SPOTV',
        tvBroadcastUrl: 'https://www.spotvnow.co.kr',
      });
    }
  }

  return games;
}

export function generateMockStandings(teams: Team[]): Record<string, StandingEntry[]> {
  const forms: ('W' | 'D' | 'L')[][] = [
    ['W', 'W', 'L', 'W', 'D'],
    ['L', 'W', 'W', 'W', 'L'],
    ['W', 'L', 'D', 'W', 'W'],
    ['L', 'L', 'W', 'D', 'W'],
    ['W', 'W', 'W', 'L', 'L'],
  ];

  const baseballTeamIds = teams.filter((t) => t.sport === 'baseball').map((t) => t.id);
  const baseball: StandingEntry[] = baseballTeamIds.map((teamId, i) => ({
    teamId,
    rank: i + 1,
    wins: 60 - i * 4,
    draws: 1,
    losses: 40 + i * 3,
    recentForm: forms[i % forms.length],
  }));

  // 축구도 리그별로 따로 순위를 매겨야 한다 (안 그러면 예를 들어 EPL 팀들이 K리그 팀들 뒤에
  // 이어붙은 순번을 그대로 받아서 "EPL 순위"에 16위 같은 엉뚱한 등수가 나온다).
  // 한 팀이 여러 리그에 속할 수 있어서(예: 뮌헨 = "GSoccer1,champs") leagueIds 전부를 돌며
  // 소속된 모든 리그의 순위표에 들어가게 한다.
  const soccerLeagueGroups = Object.values(
    teams
      .filter((t) => t.sport === 'soccer')
      .reduce<Record<string, Team[]>>((acc, t) => {
        for (const leagueId of t.leagueIds) {
          (acc[leagueId] ??= []).push(t);
        }
        return acc;
      }, {})
  );
  const soccer: StandingEntry[] = soccerLeagueGroups.flatMap((leagueTeams) =>
    leagueTeams.map((team, i) => {
      const wins = 20 - i;
      const draws = 5;
      const losses = 5 + i;
      return {
        teamId: team.id,
        rank: i + 1,
        wins,
        draws,
        losses,
        points: wins * 3 + draws,
        goalsFor: Math.max(10, 50 - i * 2),
        goalsAgainst: 10 + i,
        recentForm: forms[(i + 2) % forms.length],
      };
    })
  );

  return { baseball, soccer } as unknown as Record<string, StandingEntry[]>;
}
