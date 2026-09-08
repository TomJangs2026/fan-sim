import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import {
  Player,
  Team,
  getTeams,
  getPlayers,
  toggleTeamFavoriteForUser,
  togglePlayerFavoriteForUser,
  useAppStore,
} from '@fan-sim/core';
import AppText from '../atoms/AppText';
import TeamLogo from '../molecules/TeamLogo';

// "나"는 항상 존재하는 기본 프로필이라 보기 좋게 한글로 바꿔서 보여주고, 그 외 id(예: "seoyeon")는
// 엑셀/설정에서 입력한 값 그대로를 라벨로 쓴다.
function userLabel(userId: string): string {
  return userId === 'me' ? '나' : userId;
}

function UserCheckboxRow({
  knownUserIds,
  favoritedByUserIds,
  onToggle,
}: {
  knownUserIds: string[];
  favoritedByUserIds: string[];
  onToggle: (userId: string) => void;
}) {
  return (
    <View style={styles.checkboxRow}>
      {knownUserIds.map((userId) => {
        const active = favoritedByUserIds.includes(userId);
        return (
          <TouchableOpacity key={userId} style={[styles.checkbox, active && styles.checkboxActive]} onPress={() => onToggle(userId)}>
            <AppText style={[styles.checkboxText, active && styles.checkboxTextActive]}>{userLabel(userId)}</AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FavoriteTeamPicker() {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const knownUserIds = useAppStore((s) => s.knownUserIds);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  useEffect(() => {
    getTeams().then(setTeams);
  }, [dataVersion]);

  async function handleToggle(teamId: string, userId: string) {
    await toggleTeamFavoriteForUser(teamId, userId);
    bumpDataVersion(); // 설정 화면 변경도 "동적으로 반영"되도록, 이 화면 포함 전체에 새로고침 신호
  }

  const filtered = teams.filter((t) => t.name.includes(query) || t.shortName.includes(query));

  return (
    <View>
      <TextInput style={styles.search} placeholder="팀 이름 검색 (예: 삼성, 광주)" value={query} onChangeText={setQuery} />
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TeamLogo team={item} size={36} />
            <AppText style={styles.rowLabel} numberOfLines={1}>
              {item.shortName}
            </AppText>
            <UserCheckboxRow
              knownUserIds={knownUserIds}
              favoritedByUserIds={item.favoriteUserIds ?? []}
              onToggle={(userId) => handleToggle(item.id, userId)}
            />
          </View>
        )}
      />
    </View>
  );
}

export function FavoritePlayerPicker() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const knownUserIds = useAppStore((s) => s.knownUserIds);
  const dataVersion = useAppStore((s) => s.dataVersion);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  useEffect(() => {
    getPlayers().then(setPlayers);
  }, [dataVersion]);

  async function handleToggle(playerId: string, userId: string) {
    await togglePlayerFavoriteForUser(playerId, userId);
    bumpDataVersion();
  }

  const filtered = players.filter((p) => p.name.includes(query));

  return (
    <View>
      <TextInput style={styles.search} placeholder="선수 이름 검색 (예: 손흥민)" value={query} onChangeText={setQuery} />
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.playerPhoto}>
              <AppText style={styles.playerInitial}>{item.name.slice(0, 1)}</AppText>
            </View>
            <AppText style={styles.rowLabel} numberOfLines={1}>
              {item.name}
            </AppText>
            <UserCheckboxRow
              knownUserIds={knownUserIds}
              favoritedByUserIds={item.favoriteUserIds ?? []}
              onToggle={(userId) => handleToggle(item.id, userId)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', gap: 6 },
  checkbox: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  checkboxActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  checkboxText: { fontSize: 11, color: '#666' },
  checkboxTextActive: { color: '#fff', fontWeight: '700' },
  playerPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInitial: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
