import { Team } from '../types';
import { LEAGUE_REGISTRY } from './leagueRegistry';

// 이 CDN이 Referer 기반 핫링크 방지를 걸어두면 브라우저에서 바로 요청 시 403이 날 수 있어서,
// 스크래퍼 서버의 이미지 프록시(/api/image-proxy)를 거쳐서 불러온다.
// (서버가 꺼져있으면 TeamLogo 컴포넌트가 이미지 로드 실패를 감지해 이니셜 배지로 자동 대체함)
const SCRAPER_BASE_URL = process.env.EXPO_PUBLIC_SCRAPER_URL || 'http://localhost:5000';

function proxied(originalUrl: string) {
  return `${SCRAPER_BASE_URL}/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

/** naver 이미지 URL을 그대로 받아 핫링크 방지 우회용 프록시 URL로 바꿔준다 (로스터에 없는 팀의 엠블럼 등에 사용). */
export function getProxiedImageUrl(originalUrl: string): string {
  return proxied(originalUrl);
}

/** 팀 로고: leagueId에 등록된 teamLogoSegment + team.naverCode로 동적 생성 */
export function getTeamLogoUrl(team: Team): string | undefined {
  const league = LEAGUE_REGISTRY[team.leagueIds[0]];
  if (!league || !team.naverCode) return undefined;
  return proxied(`https://sports-phinf.pstatic.net/team/${league.teamLogoSegment}/default/${team.naverCode}.png`);
}

/** 리그 자체 아이콘 (종목/리그 선택 탭에 사용) */
export function getLeagueLogoUrl(leagueId: string): string | undefined {
  const league = LEAGUE_REGISTRY[leagueId];
  if (!league) return undefined;
  return proxied(`https://sports-phinf.pstatic.net/category/default/${league.categoryLogoId}.png?type=f108_108`);
}
