import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Team, getTeamLogoUrl } from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';

interface Props {
  team?: Team;
  size?: number;
  // team이 우리 로스터에 없을 때(예: 챔피언스리그 상대팀을 등록 안 한 경우) 실제 API가 준
  // 이름/엠블럼으로라도 보여주기 위한 폴백. GameScheduleItem.tsx의 homeTeamName 등 참고.
  fallbackName?: string;
  fallbackLogoUrl?: string;
}

// leagueRegistry 기준으로 로고 URL을 동적 계산하고, 없거나 로드에 실패하면
// 팀 상징색 원형 배지 + 이니셜로 폴백한다.
export default function TeamLogo({ team, size = 36, fallbackName, fallbackLogoUrl }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!team) {
    if (fallbackLogoUrl && !imageFailed) {
      return (
        <Image
          source={{ uri: fallbackLogoUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setImageFailed(true)}
          resizeMode="contain"
        />
      );
    }
    if (fallbackName) {
      return (
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#9CA3AF' }]}>
          <NumericText style={[styles.initial, { fontSize: size * 0.4 }]}>{fallbackName.slice(0, 1)}</NumericText>
        </View>
      );
    }
    return <View style={{ width: size, height: size }} />;
  }

  const logoUrl = getTeamLogoUrl(team);

  if (logoUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        onError={() => setImageFailed(true)}
        resizeMode="contain"
      />
    );
  }

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: team.colorHex }]}>
      <NumericText style={[styles.initial, { fontSize: size * 0.4 }]}>{team.shortName.slice(0, 1)}</NumericText>
    </View>
  );
}

export function TeamNameLabel({ team, fallbackName }: { team?: Team; fallbackName?: string }) {
  return <AppText style={styles.name}>{team?.shortName ?? fallbackName ?? '-'}</AppText>;
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 13, fontWeight: '600' },
});
