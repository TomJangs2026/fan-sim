import React from 'react';
import { View, StyleSheet } from 'react-native';
import NumericText from '../atoms/NumericText';

const COLOR: Record<'W' | 'D' | 'L', string> = { W: '#E11D48', D: '#9CA3AF', L: '#2563EB' };

export default function RecentFormDots({ form }: { form: ('W' | 'D' | 'L')[] }) {
  return (
    <View style={styles.row}>
      {form.map((r, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: COLOR[r] }]}>          
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 8, color: '#fff', fontWeight: '700' },
});
