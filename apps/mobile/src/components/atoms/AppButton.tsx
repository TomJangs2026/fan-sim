import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import AppText from './AppText';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}

export default function AppButton({ label, onPress, variant = 'primary', style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.base, variant === 'primary' ? styles.primary : styles.ghost, style]}>
      <AppText style={variant === 'primary' ? styles.primaryText : styles.ghostText}>{label}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  primary: { backgroundColor: '#1D4ED8' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ddd' },
  primaryText: { color: '#fff', fontWeight: '600' },
  ghostText: { color: '#555' },
});
