/**
 * Date를 로컬 타임존 기준 'YYYY-MM-DD'로 변환한다.
 * `Date.toISOString().slice(0, 10)`은 UTC 기준이라 UTC+ 타임존(예: 한국)에서는
 * 하루 어긋나는 문제가 있어 이 함수로 통일해서 쓴다.
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
