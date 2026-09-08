import React from 'react';
import { View, TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import AppText from '../atoms/AppText';

const CHANNELS = [
  { id: 'kakao', icon: '💬' },
  { id: 'facebook', icon: 'f' },
  { id: 'x', icon: 'X' },
  { id: 'instagram', icon: '📷' },
] as const;

async function shareContent(text: string) {
  // TODO(추후): 채널별 실제 SDK 연동 (카카오톡: @react-native-kakao/share 등)
  if (Platform.OS === 'web') {
    if ((navigator as any).share) await (navigator as any).share({ text });
    else await navigator.clipboard.writeText(text);
    return;
  }
  await Share.share({ message: text });
}

export default function ShareButtonRow({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      {CHANNELS.map((c) => (
        <TouchableOpacity key={c.id} style={styles.button} onPress={() => shareContent(text)}>
          <AppText style={styles.icon}>{c.icon}</AppText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 15 },
});
