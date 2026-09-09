import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useAppStore } from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';
import ActiveUserCheckboxRow from '../molecules/ActiveUserCheckboxRow';
import TeamPlayerExcelUpload from './TeamPlayerExcelUpload';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatToday(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일 ${WEEKDAYS[d.getDay()]}`;
}

export default function CalendarHeader() {
  const selectedDate = useAppStore((s) => s.selectedDate);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);

  const [pickerOpen, setPickerOpen] = useState(false);
  const year = Number(selectedDate.slice(0, 4));

  const today = new Date();

  function handleSelectYearMonth(y: number, m: number) {
    // 해당 연/월의 1일로 이동 (일정 조회 기준일로 사용)
    setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
    setPickerOpen(false);
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.dateArea} onPress={() => setPickerOpen(true)}>
        <NumericText style={styles.year}>{year}</NumericText>
        <AppText style={styles.today}>{formatToday(today)}</AppText>
        <AppText style={styles.calendarIcon}>📅</AppText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshBtn} onPress={() => bumpDataVersion()} hitSlop={8}>
        <AppText style={styles.refreshIcon}>🔄</AppText>
      </TouchableOpacity>

      <View style={styles.rightGroup}>
        <View>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'team' && styles.toggleBtnActive]}
              onPress={() => setViewMode('team')}
            >
              <AppText style={[styles.toggleText, viewMode === 'team' && styles.toggleTextActive]}>팀</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'player' && styles.toggleBtnActive]}
              onPress={() => setViewMode('player')}
            >
              <AppText style={[styles.toggleText, viewMode === 'player' && styles.toggleTextActive]}>선수</AppText>
            </TouchableOpacity>
          </View>
          <ActiveUserCheckboxRow />
        </View>
        <TeamPlayerExcelUpload />
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={styles.pickerCard}>
            <AppText style={styles.pickerTitle}>연/월 선택</AppText>
            <FlatList
              horizontal
              data={[year - 1, year, year + 1]}
              keyExtractor={(y) => String(y)}
              renderItem={({ item: y }) => (
                <View style={styles.yearColumn}>
                  <NumericText style={styles.yearHeader}>{y}</NumericText>
                  <View style={styles.monthGrid}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <TouchableOpacity key={m} style={styles.monthCell} onPress={() => handleSelectYearMonth(y, m)}>
                        <NumericText>{m}월</NumericText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dateArea: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  year: { fontSize: 13, color: '#999' },
  today: { fontSize: 15, fontWeight: '700' },
  calendarIcon: { fontSize: 14 },
  refreshBtn: { padding: 6 },
  refreshIcon: { fontSize: 16 },
  toggleGroup: { flexDirection: 'row', backgroundColor: '#F1F1F1', borderRadius: 16, padding: 2 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  toggleBtnActive: { backgroundColor: '#1D4ED8' },
  toggleText: { fontSize: 12, color: '#777' },
  toggleTextActive: { color: '#fff', fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  pickerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: 340 },
  pickerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  yearColumn: { width: 220, marginRight: 12 },
  yearHeader: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthCell: { width: 60, height: 40, borderRadius: 8, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
});
