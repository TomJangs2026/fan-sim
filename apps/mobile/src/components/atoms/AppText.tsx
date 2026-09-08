import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAppStore, FONT_OPTIONS } from '@fan-sim/core';

export default function AppText({ style, ...props }: TextProps) {
  const appearance = useAppStore((s) => s.appearance);
  const font = FONT_OPTIONS.find((f) => f.id === appearance.fontId) ?? FONT_OPTIONS[0];

  return (
    <Text {...props} style={[{ fontFamily: font.fontFamily, fontSize: appearance.fontSize, color: '#333' }, style]} />
  );
}
