import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';

export default function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: { fontSize: 14, color: '#555' },
});
