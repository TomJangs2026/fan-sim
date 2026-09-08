import React from 'react';
import { TouchableOpacity, Linking, StyleSheet } from 'react-native';
import AppText from '../atoms/AppText';

export function TextBroadcastLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <TouchableOpacity style={styles.textLink} onPress={() => Linking.openURL(url)}>
      <AppText style={styles.textLinkLabel}>📡 문자중계</AppText>
    </TouchableOpacity>
  );
}

export function TvBroadcastLink({ name, url }: { name?: string; url?: string }) {
  if (!name || !url) return null;
  return (
    <TouchableOpacity style={styles.tvLink} onPress={() => Linking.openURL(url)}>
      <AppText style={styles.tvLinkLabel}>▶ {name}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  textLink: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F1F5F9', borderRadius: 8 },
  textLinkLabel: { fontSize: 11, color: '#334155' },
  tvLink: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#111827', borderRadius: 8 },
  tvLinkLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
