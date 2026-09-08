import React from 'react';
import { ScrollView, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { getAllLeagues, getLeagueLogoUrl, getLeaguesByGroup, LEAGUE_GROUPS } from '@fan-sim/core';
import AppText from '../atoms/AppText';

interface Props {
  value: string | 'all';
  onChange: (leagueId: string | 'all') => void;
}

// 그룹(야구/국내축구/해외축구) 선택 시 value에 이 접두어를 붙여 "이 그룹에 속한 리그 전부"라는
// 의미를 나타낸다. home.tsx의 필터링 쪽에서 이 접두어를 보고 getLeaguesByGroup으로 풀어서 매칭한다.
export const GROUP_VALUE_PREFIX = 'group:';

export default function LeagueSelector({ value, onChange }: Props) {
  const leagues = getAllLeagues();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      persistentScrollbar
      contentContainerStyle={styles.row}
    >
      <TouchableOpacity style={[styles.chip, value === 'all' && styles.chipActive]} onPress={() => onChange('all')}>
        <AppText style={[styles.label, value === 'all' && styles.labelActive]}>전체</AppText>
      </TouchableOpacity>

      {LEAGUE_GROUPS.map((group) => {
        const groupValue = `${GROUP_VALUE_PREFIX}${group.id}`;
        const active = value === groupValue;
        if (getLeaguesByGroup(group.id).length === 0) return null;
        return (
          <TouchableOpacity
            key={group.id}
            style={[styles.chip, styles.groupChip, { borderColor: group.color }, active && { backgroundColor: group.color, borderColor: group.color }]}
            onPress={() => onChange(groupValue)}
          >
            <AppText style={[styles.label, { color: group.color }, active && styles.labelActive]}>{group.label}</AppText>
          </TouchableOpacity>
        );
      })}

      {leagues.map((league) => {
        const logoUrl = getLeagueLogoUrl(league.id);
        const active = value === league.id;
        return (
          <TouchableOpacity key={league.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(league.id)}>
            {logoUrl && <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="contain" />}
            <AppText style={[styles.label, active && styles.labelActive]}>{league.label}</AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 8, paddingBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
  },
  chipActive: { backgroundColor: '#1D4ED8' },
  groupChip: { backgroundColor: '#fff', borderWidth: 1.5 },
  logo: { width: 16, height: 16 },
  label: { fontSize: 12, color: '#666' },
  labelActive: { color: '#fff', fontWeight: '700' },
});
