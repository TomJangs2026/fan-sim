import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';

// 실제 광고 SDK(AdMob 등) 연동 전까지 쓰는 자리표시 배너.
// 연동 시 이 컴포넌트 내부만 <BannerAd .../>로 교체하면 된다.
export default function AdBannerPlaceholder() {
  return (
    <View style={styles.banner}>
      <AppText style={styles.text}>광고 배너 영역 (예시)</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 44,
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  text: { fontSize: 12, color: '#999' },
});
