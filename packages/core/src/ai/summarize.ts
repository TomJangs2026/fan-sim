import { GameSchedule } from '../types';

/**
 * 지금은 AI 연동 전이라 규칙 기반의 가짜 요약을 반환한다.
 * 추후 실제 AI API로 교체할 때 시그니처(입력: GameSchedule[], 출력: Promise<string>)만
 * 유지하면 호출부(뉴스/요약 화면) 코드는 그대로 쓸 수 있다.
 */
export async function summarizeWeeklyGames(games: GameSchedule[]): Promise<string> {
  if (games.length === 0) return '이번 주 예정된 경기가 없어요.';
  return `이번 주 총 ${games.length}경기가 예정되어 있어요. 관전포인트가 있는 경기를 놓치지 마세요!`;
}
