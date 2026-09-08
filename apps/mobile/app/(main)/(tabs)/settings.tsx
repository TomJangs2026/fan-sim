import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@fan-sim/core';
import AppearancePicker from '../../../src/components/organisms/AppearancePicker';
import SettingRow from '../../../src/components/molecules/SettingRow';
import ShareButtonRow from '../../../src/components/molecules/ShareButtonRow';
import AppButton from '../../../src/components/atoms/AppButton';
import AppText from '../../../src/components/atoms/AppText';

function CountryManager() {
  const knownCountries = useAppStore((s) => s.knownCountries);
  const addKnownCountry = useAppStore((s) => s.addKnownCountry);
  const [newCountry, setNewCountry] = useState('');

  function handleAdd() {
    const name = newCountry.trim();
    if (!name) return;
    addKnownCountry(name);
    setNewCountry('');
  }

  return (
    <View>
      <View style={styles.chipRow}>
        {knownCountries.map((country) => (
          <View key={country} style={styles.chip}>
            <AppText style={styles.chipText}>{country}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="새 국가 이름(예: 브라질)"
          value={newCountry}
          onChangeText={setNewCountry}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <AppText style={styles.addBtnText}>추가</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);

  function handleLogout() {
    setSession(null);
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <AppText style={styles.title}>일반설정</AppText>

        <SettingRow label="로그인 계정">
          <AppText>{session?.nickname ?? '-'}</AppText>
        </SettingRow>

        <View style={{ marginTop: 20 }}>
          <AppText style={styles.sectionTitle}>꾸미기</AppText>
          <AppearancePicker />
        </View>

        <View style={{ marginTop: 20 }}>
          <AppText style={styles.sectionTitle}>홈 화면 국적 탭</AppText>
          <CountryManager />
        </View>

        <View style={{ marginTop: 32 }}>
          <AppButton label="로그아웃" onPress={handleLogout} variant="ghost" />
        </View>
      </ScrollView>

      <View style={styles.shareFloat}>
        <ShareButtonRow text="팬심 앱으로 오늘 경기 일정을 확인해보세요! ⚾️⚽️" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  shareFloat: { position: 'absolute', right: 16, bottom: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 12, color: '#3730A3', fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: { flex: 1, backgroundColor: '#F4F4F4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
  addBtn: { paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8, backgroundColor: '#1D4ED8' },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
