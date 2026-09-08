import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

// 점수/시간/순위 등 숫자 중심 콘텐츠는 장식 폰트(AppText)를 쓰지 않는다.
// 귀여운 손글씨 폰트는 숫자 글리프가 다듬어져 있지 않아 작은 크기에서 읽기 어려워지기 때문.
export default function NumericText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: { fontVariant: ['tabular-nums'], color: '#222' },
});
