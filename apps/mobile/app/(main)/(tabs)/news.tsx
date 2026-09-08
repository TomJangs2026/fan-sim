import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../../../src/components/atoms/AppText';

/**
 * 지금은 목업 화면. 추후 실제 뉴스 API 연동 + AI 요약(packages/core/src/ai/summarize.ts)을
 * 붙이는 지점이다.
 */
export default function NewsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppText style={styles.title}>뉴스</AppText>
      <View style={styles.placeholder}>
        <AppText style={styles.placeholderText}>선호 팀/선수 관련 뉴스가 여기에 표시됩니다.{'\n'}(추후 뉴스 API 연동 예정)</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#999', textAlign: 'center', lineHeight: 20 },
});
