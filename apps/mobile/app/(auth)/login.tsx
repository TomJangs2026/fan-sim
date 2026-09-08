import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore, AuthProvider } from '@fan-sim/core';
import AppText from '../../src/components/atoms/AppText';
import AppButton from '../../src/components/atoms/AppButton';

function mockLogin(provider: AuthProvider) {
  return {
    id: `${provider}-${Date.now()}`,
    provider,
    nickname: provider === 'kakao' ? '카카오팬' : provider === 'google' ? '구글팬' : '애플팬',
  };
}

export default function LoginScreen() {
  const setSession = useAppStore((s) => s.setSession);

  function handleLogin(provider: AuthProvider) {
    setSession(mockLogin(provider));
    router.replace('/(main)/home');
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>팬심 FAN-SIM ⚾️⚽️</AppText>
      <AppText style={styles.subtitle}>내 팀, 내 선수의 일정을 한눈에</AppText>

      <View style={{ gap: 10, marginTop: 40, width: '100%' }}>
        <AppButton label="카카오로 시작하기" onPress={() => handleLogin('kakao')} style={{ backgroundColor: '#FEE500' }} />
        <AppButton label="구글로 시작하기" onPress={() => handleLogin('google')} variant="ghost" />
        <AppButton label="애플로 시작하기" onPress={() => handleLogin('apple')} variant="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
});
