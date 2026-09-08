import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '@fan-sim/core';
import NumericText from '../atoms/NumericText';

export default function MonthSelector() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);

  const [year, month] = selectedDate.split('-').map(Number);
  const currentRealMonth = new Date().getMonth() + 1;
  const currentRealYear = new Date().getFullYear();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
        const isSelected = m === month;
        const isRealCurrent = m === currentRealMonth && year === currentRealYear;
        return (
          <TouchableOpacity
            key={m}
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => setSelectedDate(`${year}-${String(m).padStart(2, '0')}-01`)}
          >
            <NumericText style={[styles.text, isSelected && styles.textSelected, isRealCurrent && !isSelected && styles.textCurrent]}>
              {m}월
            </NumericText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, gap: 6 },
  item: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F4F4F4' },
  itemSelected: { backgroundColor: '#1D4ED8' },
  text: { fontSize: 13, color: '#666' },
  textSelected: { color: '#fff', fontWeight: '700' },
  textCurrent: { color: '#1D4ED8', fontWeight: '700' },
});
