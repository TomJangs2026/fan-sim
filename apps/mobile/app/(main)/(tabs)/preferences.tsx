import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@fan-sim/core';
import AppText from '../../../src/components/atoms/AppText';
import { FavoriteTeamPicker, FavoritePlayerPicker } from '../../../src/components/organisms/FavoritesPicker';
import TeamPlayerExcelUpload from '../../../src/components/organisms/TeamPlayerExcelUpload';

function userLabel(userId: string): string {
  return userId === 'me' ? '나' : userId;
}

function ProfileManager() {
  const knownUserIds = useAppStore((s) => s.knownUserIds);
  const addKnownUserId = useAppStore((s) => s.addKnownUserId);
  const [newId, setNewId] = useState('');

  function handleAdd() {
    const id = newId.trim();
    if (!id) return;
    addKnownUserId(id);
    setNewId('');
  }

  return (
    <View style={styles.profileSection}>
      <AppText style={styles.sectionTitle}>프로필</AppText>
      <View style={styles.profileChips}>
        {knownUserIds.map((id) => (
          <View key={id} style={styles.profileChip}>
            <AppText style={styles.profileChipText}>{userLabel(id)}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.profileAddRow}>
        <TextInput
          style={styles.profileInput}
          placeholder="새 프로필 이름(예: 민준)"
          value={newId}
          onChangeText={setNewId}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.profileAddBtn} onPress={handleAdd}>
          <AppText style={styles.profileAddBtnText}>추가</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PreferencesScreen() {
  const [tab, setTab] = useState<'team' | 'player'>('team');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppText style={styles.title}>선호설정</AppText>

      <ProfileManager />

      <View style={styles.topRow}>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'team' && styles.tabBtnActive]} onPress={() => setTab('team')}>
            <AppText style={[styles.tabText, tab === 'team' && styles.tabTextActive]}>팀</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'player' && styles.tabBtnActive]} onPress={() => setTab('player')}>
            <AppText style={[styles.tabText, tab === 'player' && styles.tabTextActive]}>선수</AppText>
          </TouchableOpacity>
        </View>

        <TeamPlayerExcelUpload />
      </View>

      {tab === 'team' ? <FavoriteTeamPicker /> : <FavoritePlayerPicker />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#F1F1F1', borderRadius: 16, padding: 3 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 14 },
  tabBtnActive: { backgroundColor: '#1D4ED8' },
  tabText: { fontSize: 13, color: '#777' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  profileSection: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 8 },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  profileChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#EEF2FF' },
  profileChipText: { fontSize: 12, color: '#3730A3', fontWeight: '600' },
  profileAddRow: { flexDirection: 'row', gap: 8 },
  profileInput: { flex: 1, backgroundColor: '#F4F4F4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  profileAddBtn: { paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8, backgroundColor: '#1D4ED8' },
  profileAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
