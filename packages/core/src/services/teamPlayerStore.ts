import { Team, Player } from '../types';
import { createCollection } from '../db/localDb';
import { DEFAULT_TEAMS, DEFAULT_PLAYERS } from './mock/teamsAndPlayers';
import { LEAGUE_REGISTRY } from './leagueRegistry';

// 엑셀에서 업로드된 팀/선수만 담아두는 로컬 컬렉션. 기본 데이터(DEFAULT_TEAMS/DEFAULT_PLAYERS)와는
// 별도로 저장해뒀다가, 화면에서 읽을 때 "기본값 위에 업로드분을 덮어쓰는" 방식으로 합친다.
// 같은 id로 다시 업로드하면 새 값으로 덮어써지고(upsert), id가 다르면 추가된다.
const teamOverrides = createCollection<Team>('team-overrides');
const playerOverrides = createCollection<Player>('player-overrides');

function toArray(v: unknown): string[] {
  return String(v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'Y' || s === 'YES';
}

/** 엑셀 'Teams' 시트를 sheet_to_json으로 변환한 raw row 배열을 받아 팀 오버라이드에 upsert한다. */
export async function upsertTeamsFromRows(rows: Record<string, unknown>[]): Promise<{ count: number }> {
  const existing = await teamOverrides.all();
  const byId = new Map(existing.map((t) => [t.id, t]));

  for (const row of rows) {
    const id = String(row['team-id'] ?? '').trim();
    if (!id) continue;

    const leagueIds = toArray(row['league-id']);
    const sport = leagueIds.map((l) => LEAGUE_REGISTRY[l]?.sport).find(Boolean) ?? 'soccer';

    byId.set(id, {
      id,
      name: String(row['team-name'] ?? '').trim(),
      shortName: String(row['short-name'] ?? '').trim(),
      naverCode: String(row['naver-code'] ?? '').trim(),
      leagueIds,
      sport,
      colorHex: byId.get(id)?.colorHex, // 엑셀 포맷에 색상 컬럼이 없어서, 기존 값이 있으면 유지
      // user-id 칸(콤마로 여러 명 가능): 이 행이 시트에 있는 한 항상 새로 계산해서 덮어쓴다.
      // 그래야 엑셀을 다시 올렸을 때 설정 화면에서 토글해둔 값이 아니라 최신 엑셀 내용이 이긴다.
      favoriteUserIds: toArray(row['user-id']),
    });
  }

  const merged = [...byId.values()];
  await overwriteCollection(teamOverrides, merged);
  return { count: rows.length };
}

/** 엑셀 'Players' 시트 raw row 배열을 받아 선수 오버라이드에 upsert한다. */
export async function upsertPlayersFromRows(rows: Record<string, unknown>[]): Promise<{ count: number }> {
  const existing = await playerOverrides.all();
  const byId = new Map(existing.map((p) => [p.id, p]));

  for (const row of rows) {
    const id = String(row['player-id'] ?? '').trim();
    if (!id) continue;

    byId.set(id, {
      id,
      name: String(row['player-name'] ?? '').trim(),
      position: String(row['player-position'] ?? '').trim(),
      isStarter: toBool(row['is-starter']),
      country: row['country'] ? String(row['country']).trim() : undefined,
      teamId: String(row['team-id'] ?? '').trim(),
      favoriteUserIds: toArray(row['user-id']),
    });
  }

  const merged = [...byId.values()];
  await overwriteCollection(playerOverrides, merged);
  return { count: rows.length };
}

// createCollection에는 "전체 교체" 연산이 없어서, insert를 반복하는 대신 여기서 직접 처리한다.
// (매번 all()->필터->insert 왕복하면 느리고 번거로움)
async function overwriteCollection<T extends { id: string }>(
  collection: ReturnType<typeof createCollection<T>>,
  items: T[]
): Promise<void> {
  const current = await collection.all();
  for (const item of current) {
    // eslint-disable-next-line no-await-in-loop
    await collection.remove(item.id);
  }
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    await collection.insert(item);
  }
}

/** 기본 팀 + 업로드된 팀(같은 id면 업로드분이 우선) */
export async function getEffectiveTeams(): Promise<Team[]> {
  const overrides = await teamOverrides.all();
  const byId = new Map(DEFAULT_TEAMS.map((t) => [t.id, t]));
  for (const o of overrides) byId.set(o.id, o);
  return [...byId.values()];
}

/** 기본 선수 + 업로드된 선수(같은 id면 업로드분이 우선) */
export async function getEffectivePlayers(): Promise<Player[]> {
  const overrides = await playerOverrides.all();
  const byId = new Map(DEFAULT_PLAYERS.map((p) => [p.id, p]));
  for (const o of overrides) byId.set(o.id, o);
  return [...byId.values()];
}

export async function getEffectiveTeamsByLeague(leagueId: string): Promise<Team[]> {
  const all = await getEffectiveTeams();
  return all.filter((t) => t.leagueIds.includes(leagueId));
}

/**
 * 설정 화면 체크박스에서 쓰는 "동적" 즐겨찾기 토글. 팀 레코드의 favoriteUserIds에 직접 더하고/빼서
 * teamOverrides에 저장한다 — 엑셀 Teams 시트를 다시 업로드하면 그 행이 다시 통째로 계산되어
 * (upsertTeamsFromRows) 여기서 설정한 값을 덮어쓴다("리셋 후 덮어쓰기").
 */
export async function toggleTeamFavoriteForUser(teamId: string, userId: string): Promise<void> {
  const team = (await getEffectiveTeams()).find((t) => t.id === teamId);
  if (!team) return;

  const current = new Set(team.favoriteUserIds ?? []);
  if (current.has(userId)) current.delete(userId);
  else current.add(userId);

  const existing = await teamOverrides.all();
  const byId = new Map(existing.map((t) => [t.id, t]));
  byId.set(teamId, { ...team, favoriteUserIds: [...current] });
  await overwriteCollection(teamOverrides, [...byId.values()]);
}

/** toggleTeamFavoriteForUser와 동일한 방식의 선수용 버전. */
export async function togglePlayerFavoriteForUser(playerId: string, userId: string): Promise<void> {
  const player = (await getEffectivePlayers()).find((p) => p.id === playerId);
  if (!player) return;

  const current = new Set(player.favoriteUserIds ?? []);
  if (current.has(userId)) current.delete(userId);
  else current.add(userId);

  const existing = await playerOverrides.all();
  const byId = new Map(existing.map((p) => [p.id, p]));
  byId.set(playerId, { ...player, favoriteUserIds: [...current] });
  await overwriteCollection(playerOverrides, [...byId.values()]);
}

/**
 * 지금까지 팀/선수 어딘가에 태그된 적 있는 user-id 전부 + 항상 기본으로 포함되는 'me'.
 * 설정 화면에서 "나/서연" 같은 체크박스 목록을 그리는 데 쓴다.
 */
export async function getKnownFavoriteUserIds(): Promise<string[]> {
  const [teams, players] = await Promise.all([getEffectiveTeams(), getEffectivePlayers()]);
  const ids = new Set<string>(['me']);
  teams.forEach((t) => t.favoriteUserIds?.forEach((id) => ids.add(id)));
  players.forEach((p) => p.favoriteUserIds?.forEach((id) => ids.add(id)));
  return [...ids].sort((a, b) => (a === 'me' ? -1 : b === 'me' ? 1 : a.localeCompare(b)));
}

/** userIds를 주면 그 사람들 중 한 명이라도 찜한 팀(합집합), 안 주면(undefined) 등록된 모든 사람의 즐겨찾기 팀id를 합쳐서 반환한다. */
export function getFavoriteTeamIds(teams: Team[], userIds?: string[]): string[] {
  return teams
    .filter((t) => {
      const tags = t.favoriteUserIds ?? [];
      return userIds ? tags.some((id) => userIds.includes(id)) : tags.length > 0;
    })
    .map((t) => t.id);
}

/** getFavoriteTeamIds의 선수 버전. */
export function getFavoritePlayerIds(players: Player[], userIds?: string[]): string[] {
  return players
    .filter((p) => {
      const tags = p.favoriteUserIds ?? [];
      return userIds ? tags.some((id) => userIds.includes(id)) : tags.length > 0;
    })
    .map((p) => p.id);
}
