import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';

export type ScheduleTab = 'today' | 'yesterday' | 'past' | 'upcoming';

const TABS: { id: ScheduleTab; label: string }[] = [
  { id: 'today', label: '오늘' },
  { id: 'yesterday', label: '어제' },
  { id: 'past', label: '지난경기' },
  { id: 'upcoming', label: '예정경기' },
];

export default function ScheduleTabs({ value, onChange }: { value: ScheduleTab; onChange: (tab: ScheduleTab) => void }) {
  return (
    <View style={styles.row}>
      {TABS.map((t) => (
        <TouchableOpacity key={t.id} style={[styles.tab, value === t.id && styles.tabActive]} onPress={() => onChange(t.id)}>
          <AppText style={[styles.label, value === t.id && styles.labelActive]}>{t.label}</AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: '#F1F1F1', borderRadius: 12, padding: 3, marginVertical: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: '#1D4ED8' },
  label: { fontSize: 12, color: '#777' },
  labelActive: { color: '#fff', fontWeight: '700' },
});
