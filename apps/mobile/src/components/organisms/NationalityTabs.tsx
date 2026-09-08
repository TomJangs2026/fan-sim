import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '@fan-sim/core';
import AppText from '../atoms/AppText';

interface Props {
  value: string | 'all';
  onChange: (country: string | 'all') => void;
}

/** 광고 배너와 리그 선택 줄 사이에 들어가는 국적 탭. 선택하면 그 나라 선수가 뛰는 팀의 경기만 걸러 보여준다. */
export default function NationalityTabs({ value, onChange }: Props) {
  const knownCountries = useAppStore((s) => s.knownCountries);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator persistentScrollbar contentContainerStyle={styles.row}>
      <TouchableOpacity style={[styles.chip, value === 'all' && styles.chipActive]} onPress={() => onChange('all')}>
        <AppText style={[styles.label, value === 'all' && styles.labelActive]}>전체</AppText>
      </TouchableOpacity>

      {knownCountries.map((country) => {
        const active = value === country;
        return (
          <TouchableOpacity key={country} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(country)}>
            <AppText style={[styles.label, active && styles.labelActive]}>{country}</AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F1F1F1' },
  chipActive: { backgroundColor: '#1D4ED8' },
  label: { fontSize: 12, color: '#666' },
  labelActive: { color: '#fff', fontWeight: '700' },
});
