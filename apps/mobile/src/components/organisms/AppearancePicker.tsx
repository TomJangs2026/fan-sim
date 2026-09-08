import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BACKGROUND_OPTIONS, FONT_OPTIONS, useAppStore } from '@fan-sim/core';
import AppText from '../atoms/AppText';

export default function AppearancePicker() {
  const appearance = useAppStore((s) => s.appearance);
  const setAppearance = useAppStore((s) => s.setAppearance);

  return (
    <View style={{ gap: 16 }}>
      <View>
        <AppText style={styles.label}>배경</AppText>
        <View style={styles.row}>
          {BACKGROUND_OPTIONS.map((bg) => (
            <TouchableOpacity
              key={bg.id}
              onPress={() => setAppearance({ backgroundId: bg.id })}
              style={[styles.swatch, { backgroundColor: bg.colors[0] }, appearance.backgroundId === bg.id && styles.swatchActive]}
            />
          ))}
        </View>
      </View>

      <View>
        <AppText style={styles.label}>폰트</AppText>
        <View style={styles.row}>
          {FONT_OPTIONS.map((font) => (
            <TouchableOpacity
              key={font.id}
              onPress={() => setAppearance({ fontId: font.id })}
              style={[styles.fontChip, appearance.fontId === font.id && styles.fontChipActive]}
            >
              <AppText style={{ fontFamily: font.fontFamily }}>{font.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View>
        <AppText style={styles.label}>글자 크기 ({appearance.fontSize}px)</AppText>
        <View style={styles.row}>
          <TouchableOpacity style={styles.sizeButton} onPress={() => setAppearance({ fontSize: Math.max(12, appearance.fontSize - 1) })}>
            <AppText>-</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sizeButton} onPress={() => setAppearance({ fontSize: Math.min(24, appearance.fontSize + 1) })}>
            <AppText>+</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: '#888', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#1D4ED8' },
  fontChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F4F4F4' },
  fontChipActive: { backgroundColor: '#DCE6FF' },
  sizeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
});
