import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '@fan-sim/core';
import AppText from '../atoms/AppText';

// "나"는 항상 존재하는 기본 프로필이라 한글로 보여주고, 그 외 id(예: "seoyeon")는 그대로 라벨로 쓴다.
function userLabel(userId: string): string {
  return userId === 'me' ? '나' : userId;
}

/**
 * 메인 화면(CalendarHeader)의 팀/선수 토글 바로 밑에 들어가는 체크박스 줄.
 * 여기서 체크된 프로필들의 즐겨찾기를 합쳐서 SUPER WEEK 등에 보여준다(WeeklyBanner 참고).
 */
export default function ActiveUserCheckboxRow() {
  const knownUserIds = useAppStore((s) => s.knownUserIds);
  const activeUserIds = useAppStore((s) => s.activeUserIds);
  const toggleActiveUserId = useAppStore((s) => s.toggleActiveUserId);

  return (
    <View style={styles.row}>
      {knownUserIds.map((userId) => {
        const active = activeUserIds.includes(userId);
        return (
          <TouchableOpacity key={userId} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleActiveUserId(userId)}>
            <AppText style={[styles.chipText, active && styles.chipTextActive]}>{userLabel(userId)}</AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginTop: 4 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  chipText: { fontSize: 10, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
});
