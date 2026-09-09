export type Sport = 'baseball' | 'soccer';

export interface Team {
  id: string;
  sport: Sport;
  leagueIds: string[]; // 한 팀이 여러 대회에 속할 수 있어 배열로 관리 (예: 리그+컵대회)
  naverCode: string; // 네이버 API가 쓰는 팀 코드. 로고 URL도 이 값으로 동적 생성됨(getTeamLogoUrl)
  name: string; // 예: 삼성, 광주
  shortName: string;
  colorHex?: string; // 팀 상징색 (배지 배경 등에 사용). 엑셀 업로드에는 없는 컬럼이라 선택값
  favoriteUserIds?: string[]; // 이 팀을 즐겨찾기한 사용자 id들(예: ["me","seoyeon"]). 엑셀 Teams 시트 user-id 컬럼이나 설정 화면 체크박스로 채워짐
}

export interface Player {
  id: string;
  teamId: string;
  name: string; // 예: 이강인
  position: string; // 예: MF, 선발투수
  country?: string; // 예: 대한민국
  photoUrl?: string;
  isStarter?: boolean; // 오늘 경기 선발/주전 여부
  favoriteUserIds?: string[]; // 이 선수를 즐겨찾기한 사용자 id들. 엑셀 Players 시트 user-id 컬럼이나 설정 화면 체크박스로 채워짐
}

export type GameStatus = 'scheduled' | 'live' | 'finished' | 'cancelled';

// 야구: 이닝(예: "3회말") / 축구: 전반, 후반, 하프타임
export interface LiveState {
  label: string; // 예: "3회말", "후반 12분"
}

export interface GameSchedule {
  id: string;
  sport: Sport;
  leagueId: string; // 리그/종목 선택 필터에 사용 (예: 'KBaseball1', 'ESoccer1')
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: GameStatus;
  stadium: string;
  liveState?: LiveState;
  highlight?: string; // 관전포인트 (예: "라이벌 더비", "1위 탈환")
  round?: string; // 라운드/매치데이 번호 (예: K리그 "28", 챔피언스리그 "1")
  phaseCode?: string; // UEFA 대회 등에서 쓰는 단계 코드 (예: "LEAGUE" = 리그 페이즈). 국내/유럽 개별 리그는 보통 없음

  awayTeamId: string; // 야구 기준 원정팀 (2줄), 축구는 3줄에 표시
  homeTeamId: string; // 야구 기준 홈팀 (3줄), 축구는 2줄에 표시
  // 상대가 우리 Teams 로스터에 없는(등록 안 한) 팀일 때 쓰는 표시용 폴백.
  // 예: 챔피언스리그처럼 참가팀이 많아 전부 등록하기 어려운 대회에서, 등록한 팀의 경기만 보이게 하되
  // 상대팀은 실제 API가 주는 이름/엠블럼으로 그냥 보여준다(homeTeamId/awayTeamId는 로스터에 없는 임시 id).
  awayTeamName?: string;
  homeTeamName?: string;
  awayTeamLogoUrl?: string;
  homeTeamLogoUrl?: string;

  awayScore?: number;
  homeScore?: number;

  awayStarterId?: string; // 원정팀 선발투수/주전선수(선호선수) - 우리 MOCK_PLAYERS에 있는 경우만
  homeStarterId?: string;
  awayStarterName?: string; // 실제 API가 주는 선발투수 "이름" 문자열 (Player 레코드가 없어도 표시 가능)
  homeStarterName?: string;

  textBroadcastUrl?: string; // 온라인 문자중계(네이버 라이브스코어 등)
  tvBroadcastName?: string; // 예: SBS Sports
  tvBroadcastUrl?: string;
}

export interface StandingEntry {
  teamId: string;
  rank: number;
  wins: number;
  draws: number;
  losses: number;
  points?: number; // 승점(승자승 등 감점 반영). 없으면 UI에서 wins*3+draws로 계산
  goalsFor?: number; // 득점
  goalsAgainst?: number; // 실점
  recentForm: ('W' | 'D' | 'L')[]; // 최근 5경기, 배열 앞이 가장 최근
}

export interface LeagueZoneRange {
  start: number; // 순위 시작(포함)
  end: number; // 순위 끝(포함)
}

/**
 * 리그별 순위 구간(챔스/유로파/컨퍼런스리그 진출, 강등 플레이오프, 강등) 설정.
 * 리그마다, 시즌마다 구간이 달라서 엑셀 "Leagues" 시트로 관리한다 (services/leagueZoneStore.ts 참고).
 * 구간이 없는 항목(예: 강등 플레이오프가 없는 리그)은 undefined로 둔다.
 */
export interface LeagueZoneConfig {
  leagueId: string;
  season?: string; // 참고용 라벨(예: "2026/27"). 매칭에는 안 쓰고 기록용으로만 저장.
  ucl?: LeagueZoneRange;
  uclQualifying?: LeagueZoneRange; // 챔피언스리그 "예선" 진출(예: 리그앙 3위) — 본선 자동진출(ucl)과는 다른 구간
  uel?: LeagueZoneRange;
  uecl?: LeagueZoneRange;
  relegationPlayoff?: LeagueZoneRange;
  relegation?: LeagueZoneRange;
}

export type AuthProvider = 'kakao' | 'google' | 'apple';

export interface UserSession {
  id: string;
  provider: AuthProvider;
  nickname: string;
}

export interface FontOption {
  id: string;
  label: string;
  fontFamily: string;
}

export interface AppearanceSettings {
  backgroundId: string;
  fontId: string;
  fontSize: number;
}
