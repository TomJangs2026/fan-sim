import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import NumericText from './NumericText';

interface Props {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function RoundLabel({ label, backgroundColor = '#EEF0F3', textColor = '#333', style }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <NumericText style={[styles.text, { color: textColor }]}>{label}</NumericText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});
