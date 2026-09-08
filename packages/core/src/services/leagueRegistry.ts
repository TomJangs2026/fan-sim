import { Sport } from '../types';

/**
 * 리그 ID 규칙: 국가코드(1~2글자) + 스포츠명(영문) + 리그레벨(1이 최상위) + (여자리그면 W)
 * 예) KBaseball1, ESoccer1(EPL), ESoccer2(잉글랜드 챔피언십), KVolleyball1W
 *
 * teamLogoSegment: 팀 로고 URL의 `/team/{segment}/default/{code}.png` 부분.
 * categoryLogoId: 리그 자체 아이콘 URL의 `/category/default/{id}.png?type=f108_108` 부분
 *   (보통 네이버 categoryId와 같지만 다를 수 있어 별도 필드로 둠).
 * upperCategoryId / mainCategoryId: 서버(scraper-server/index.js)의 LEAGUE_REGISTRY와 반드시 일치해야 함.
 */
export type LeagueGroup = 'baseball' | 'domesticSoccer' | 'overseasSoccer';

export interface LeagueConfig {
  id: string;
  sport: Sport;
  label: string;
  group: LeagueGroup; // 리그 선택 UI에서 [야구]/[국내축구]/[해외축구]로 한 번에 묶어서 필터링할 때 씀
  upperCategoryId: string;
  mainCategoryId: string | null;
  teamLogoSegment: string;
  categoryLogoId: string;
}

export interface LeagueGroupConfig {
  id: LeagueGroup;
  label: string;
  color: string;
}

export const LEAGUE_GROUPS: LeagueGroupConfig[] = [
  { id: 'baseball', label: '야구', color: '#EA580C' },
  { id: 'domesticSoccer', label: '국내축구', color: '#16A34A' },
  { id: 'overseasSoccer', label: '해외축구', color: '#7C3AED' },
];

export const LEAGUE_REGISTRY: Record<string, LeagueConfig> = {
  KBaseball1: {
    id: 'KBaseball1',
    sport: 'baseball',
    label: 'KBO',
    group: 'baseball',
    upperCategoryId: 'kbaseball',
    mainCategoryId: 'kbo',
    teamLogoSegment: 'kbo',
    categoryLogoId: 'kbo',
  },
  KSoccer1: {
    id: 'KSoccer1',
    sport: 'soccer',
    label: 'K리그1',
    group: 'domesticSoccer',
    upperCategoryId: 'kfootball',
    mainCategoryId: 'kleague',
    teamLogoSegment: 'kleague',
    categoryLogoId: 'kleague',
  },
  KSoccer2: {
    id: 'KSoccer2',
    sport: 'soccer',
    label: 'K리그2',
    group: 'domesticSoccer',
    upperCategoryId: 'kfootball',
    mainCategoryId: 'kleague2',
    teamLogoSegment: 'kleague',
    categoryLogoId: 'kleague2',
  },

  // 해외축구: upperCategoryId='wfootball' 하나에 여러 리그가 섞여오므로 mainCategoryId로 구분.
  // 팀 로고 폴더도 국내와 달리 전부 'wfootball' 공통 사용 (2026-08-22 응답으로 확인).
  ESoccer1: {
    id: 'ESoccer1',
    sport: 'soccer',
    label: '프리미어리그',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'epl',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'epl',
  },
  ESoccer2: {
    id: 'ESoccer2',
    sport: 'soccer',
    label: '잉글랜드 챔피언십',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'england2',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'england2',
  },
  SSoccer1: {
    id: 'SSoccer1',
    sport: 'soccer',
    label: '라리가',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'primera',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'primera',
  },
  FSoccer1: {
    id: 'FSoccer1',
    sport: 'soccer',
    label: '리그앙',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'ligue1',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'ligue1',
  },
  ScSoccer1: {
    id: 'ScSoccer1',
    sport: 'soccer',
    label: '스코틀랜드 프리미어십',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'spl',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'spl',
  },
  NLSoccer1: {
    id: 'NLSoccer1',
    sport: 'soccer',
    label: '에레디비시',
    group: 'overseasSoccer',
    upperCategoryId: 'wfootball',
    mainCategoryId: 'eredivisie',
    teamLogoSegment: 'wfootball',
    categoryLogoId: 'eredivisie',
  },

  // 아래는 사용자가 아이콘 URL만 확인해준 리그. categoryId 슬러그는 아이콘 경로에서 그대로 가져왔지만
  // 실제 game listing에서 이 categoryId로 나오는지는 아직 게임 데이터로 확인 전이라
  // 다른 리그보다는 신뢰도가 낮음 (틀리면 mainCategoryId 필터에 안 걸려 그냥 안 나올 뿐, 에러는 안 남).
  USSoccer1: { id: 'USSoccer1', sport: 'soccer', label: 'MLS', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'mls', teamLogoSegment: 'wfootball', categoryLogoId: 'mls' },
  ISoccer1: { id: 'ISoccer1', sport: 'soccer', label: '세리에A', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'seria', teamLogoSegment: 'wfootball', categoryLogoId: 'seria' },
  DKSoccer1: { id: 'DKSoccer1', sport: 'soccer', label: '덴마크 수페르리가', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'denmark', teamLogoSegment: 'wfootball', categoryLogoId: 'denmark' },
  GSoccer1: { id: 'GSoccer1', sport: 'soccer', label: '분데스리가', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'bundesliga', teamLogoSegment: 'wfootball', categoryLogoId: 'bundesliga' },

  // UEFA 클럽대항전: 국내/국외 리그 소속과 별개로 팀이 "추가로" 속하는 대회라서, 팀 등록은
  // Teams 시트의 league-id 칸에 콤마로 덧붙이는 방식으로 한다 (예: "GSoccer1,champs").
  // leagueId를 네이버 categoryId와 똑같이 맞춰뒀다(champs/europa/uecl) — upperCategoryId는
  // 소속 리그와 동일하게 'wfootball' 하나에 categoryId로만 구분되는 걸 확인함(2026-09-07).
  champs: { id: 'champs', sport: 'soccer', label: 'UEFA 챔피언스리그', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'champs', teamLogoSegment: 'wfootball', categoryLogoId: 'champs' },
  europa: { id: 'europa', sport: 'soccer', label: 'UEFA 유로파리그', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'europa', teamLogoSegment: 'wfootball', categoryLogoId: 'europa' },
  uecl: { id: 'uecl', sport: 'soccer', label: 'UEFA 컨퍼런스리그', group: 'overseasSoccer', upperCategoryId: 'wfootball', mainCategoryId: 'uecl', teamLogoSegment: 'wfootball', categoryLogoId: 'uecl' },
};

export function getAllLeagues(): LeagueConfig[] {
  return Object.values(LEAGUE_REGISTRY);
}

export function getLeaguesByGroup(group: LeagueGroup): LeagueConfig[] {
  return getAllLeagues().filter((l) => l.group === group);
}
