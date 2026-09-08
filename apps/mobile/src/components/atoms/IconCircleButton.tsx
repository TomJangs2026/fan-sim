import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Text } from 'react-native';

interface Props {
  icon: string;
  onPress: () => void;
  size?: number;
  backgroundColor?: string;
  style?: ViewStyle;
}

export default function IconCircleButton({ icon, onPress, size = 40, backgroundColor = '#1D4ED8', style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.45 }}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
