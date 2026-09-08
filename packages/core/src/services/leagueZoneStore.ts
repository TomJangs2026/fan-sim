import { LeagueZoneConfig, LeagueZoneRange } from '../types';
import { createCollection } from '../db/localDb';

interface StoredLeagueZoneConfig extends LeagueZoneConfig {
  id: string; // createCollection이 id 필드를 요구해서 leagueId를 그대로 넣어둔다
}

// 엑셀 "Leagues" 시트로 업로드된 리그별 순위 구간 설정만 담아두는 로컬 컬렉션.
// 리그당 한 행이 원칙이고, 같은 league-id로 다시 업로드하면 새 값으로 덮어써진다(upsert).
const leagueZoneOverrides = createCollection<StoredLeagueZoneConfig>('league-zone-overrides');

type ZoneKey = keyof Pick<LeagueZoneConfig, 'ucl' | 'uclQualifying' | 'uel' | 'uecl' | 'relegationPlayoff' | 'relegation'>;

export const ZONE_DEFS: { key: ZoneKey; label: string; color: string }[] = [
  { key: 'ucl', label: 'UEFA 챔피언스리그 진출', color: '#2563EB' },
  { key: 'uclQualifying', label: 'UEFA 챔피언스리그 예선 진출', color: '#06B6D4' },
  { key: 'uel', label: 'UEFA 유로파리그 진출', color: '#16A34A' },
  { key: 'uecl', label: 'UEFA 컨퍼런스리그 예선 진출', color: '#84CC16' },
  { key: 'relegationPlayoff', label: '리그 강등 플레이오프', color: '#F97316' },
  { key: 'relegation', label: '리그 강등', color: '#DC2626' },
];

// leagueId 끝 숫자가 2 이상(예: ESoccer2, ESoccer3)이면 1부가 아니라서, 같은 구간 칸이라도
// 유럽대항전이 아니라 승격 관련 의미로 바뀐다. ucl/uel 칸을 그대로 재사용하고 라벨만 바꾼다.
const TIER2_LABEL_OVERRIDES: Partial<Record<ZoneKey, string>> = {
  ucl: '리그 승격',
  uel: '승격 플레이오프',
};

/** leagueId 끝의 숫자(리그 등급, 1이 최상위)를 뽑아낸다. 못 찾으면 1부로 간주한다. */
export function getLeagueLevel(leagueId: string): number {
  const match = leagueId.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 1;
}

export function getZoneLabel(key: ZoneKey, leagueId: string): string {
  const def = ZONE_DEFS.find((z) => z.key === key);
  if (!def) return key;
  if (getLeagueLevel(leagueId) >= 2 && TIER2_LABEL_OVERRIDES[key]) return TIER2_LABEL_OVERRIDES[key]!;
  return def.label;
}

function parseRange(row: Record<string, unknown>, startKey: string, endKey: string): LeagueZoneRange | undefined {
  const start = Number(row[startKey]);
  const end = Number(row[endKey]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0) return undefined;
  return { start, end };
}

// createCollection에는 "전체 교체" 연산이 없어서, insert를 반복하는 대신 여기서 직접 처리한다
// (teamPlayerStore.ts의 같은 패턴 참고).
async function overwriteCollection(items: StoredLeagueZoneConfig[]): Promise<void> {
  const current = await leagueZoneOverrides.all();
  for (const item of current) {
    // eslint-disable-next-line no-await-in-loop
    await leagueZoneOverrides.remove(item.id);
  }
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await leagueZoneOverrides.insert(item);
  }
}

/**
 * 엑셀 "Leagues" 시트를 sheet_to_json으로 변환한 raw row 배열을 받아 리그별 순위 구간 설정에 upsert한다.
 * 컬럼: league-id | season(참고용, 선택) | ucl-start/ucl-end | ucl-p-start/ucl-p-end(챔스 예선, 예: 리그앙 3위) |
 *      uel-start/uel-end | uecl-start/uecl-end | playoff-start/playoff-end | relegation-start/relegation-end
 * 구간 칸을 비워두면(또는 0 이하면) 그 리그엔 해당 구간이 없는 것으로 처리한다.
 */
export async function upsertLeagueZonesFromRows(rows: Record<string, unknown>[]): Promise<{ count: number }> {
  const existing = await leagueZoneOverrides.all();
  const byId = new Map(existing.map((z) => [z.leagueId, z]));

  for (const row of rows) {
    const leagueId = String(row['league-id'] ?? '').trim();
    if (!leagueId) continue;

    byId.set(leagueId, {
      id: leagueId,
      leagueId,
      season: row['season'] ? String(row['season']).trim() : undefined,
      ucl: parseRange(row, 'ucl-start', 'ucl-end'),
      uclQualifying: parseRange(row, 'ucl-p-start', 'ucl-p-end'),
      uel: parseRange(row, 'uel-start', 'uel-end'),
      uecl: parseRange(row, 'uecl-start', 'uecl-end'),
      relegationPlayoff: parseRange(row, 'playoff-start', 'playoff-end'),
      relegation: parseRange(row, 'relegation-start', 'relegation-end'),
    });
  }

  const merged = [...byId.values()];
  await overwriteCollection(merged);
  return { count: rows.length };
}

export async function getLeagueZoneConfig(leagueId: string): Promise<LeagueZoneConfig | undefined> {
  const all = await leagueZoneOverrides.all();
  return all.find((z) => z.leagueId === leagueId);
}

export function getZoneForRank(
  rank: number,
  config: LeagueZoneConfig | undefined
): { key: string; label: string; color: string } | null {
  if (!config) return null;
  for (const def of ZONE_DEFS) {
    const range = config[def.key];
    if (range && rank >= range.start && rank <= range.end) {
      return { ...def, label: getZoneLabel(def.key, config.leagueId) };
    }
  }
  return null;
}
