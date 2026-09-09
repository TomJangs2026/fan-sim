import React, { useEffect, useState } from 'react';
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { GameDetail, GameLineup, GameSchedule, Team, getGameDetail } from '@fan-sim/core';
import AppText from '../atoms/AppText';
import NumericText from '../atoms/NumericText';

interface Props {
  visible: boolean;
  game: GameSchedule;
  teamById: Map<string, Team>;
  onClose: () => void;
}

const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'];

function ScorersSection({ detail, homeName, awayName }: { detail: GameDetail; homeName: string; awayName: string }) {
  if (detail.scorers.length === 0) return null;
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>⚽ 득점자</AppText>
      {detail.scorers.map((s, i) => (
        <View key={i} style={styles.scorerRow}>
          <NumericText style={styles.scorerTime}>
            {s.minute}
            {s.addedTime > 0 ? `+${s.addedTime}` : ''}'
          </NumericText>
          <AppText style={styles.scorerName}>
            {s.playerName}
            {s.ownGoal ? ' (자책골)' : ''}
          </AppText>
          <AppText style={styles.scorerTeam}>{s.team === 'home' ? homeName : awayName}</AppText>
        </View>
      ))}
    </View>
  );
}

function LineupSection({ title, lineup }: { title: string; lineup?: GameLineup | null }) {
  if (!lineup || lineup.starters.length === 0) return null;

  // 포지션(GK/DF/MF/FW) 순서로 정렬해서 보여준다 — 네이버 응답은 포메이션 줄 순서라 이미 대체로 맞지만 확실히 해둔다.
  const sortedStarters = [...lineup.starters].sort(
    (a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
  );

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {lineup.manager && <AppText style={styles.managerText}>감독: {lineup.manager}</AppText>}

      {sortedStarters.map((p) => (
        <View key={p.playerId} style={styles.playerRow}>
          <NumericText style={styles.playerNumber}>{p.shirtNumber}</NumericText>
          <AppText style={styles.playerPos}>{p.position}</AppText>
          <AppText style={styles.playerName}>{p.name}</AppText>
          <View style={styles.playerBadges}>
            {p.goals > 0 && <AppText style={styles.badgeText}>⚽{p.goals > 1 ? `x${p.goals}` : ''}</AppText>}
            {p.assists > 0 && <AppText style={styles.badgeText}>👟{p.assists > 1 ? `x${p.assists}` : ''}</AppText>}
            {p.yellowCards > 0 && <AppText style={styles.badgeText}>🟨</AppText>}
            {p.redCards > 0 && <AppText style={styles.badgeText}>🟥</AppText>}
            {p.substituted && <AppText style={styles.badgeText}>🔄</AppText>}
          </View>
        </View>
      ))}

      {lineup.substitutes.length > 0 && (
        <>
          <AppText style={styles.subHeader}>교체 명단</AppText>
          {lineup.substitutes.map((p) => (
            <View key={p.playerId} style={styles.playerRow}>
              <NumericText style={styles.playerNumber}>{p.shirtNumber}</NumericText>
              <AppText style={styles.playerPos}>{p.position}</AppText>
              <AppText style={styles.playerName}>{p.name}</AppText>
              <View style={styles.playerBadges}>
                {p.goals > 0 && <AppText style={styles.badgeText}>⚽{p.goals > 1 ? `x${p.goals}` : ''}</AppText>}
                {p.assists > 0 && <AppText style={styles.badgeText}>👟{p.assists > 1 ? `x${p.assists}` : ''}</AppText>}
                {p.yellowCards > 0 && <AppText style={styles.badgeText}>🟨</AppText>}
                {p.redCards > 0 && <AppText style={styles.badgeText}>🟥</AppText>}
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

export default function GameDetailModal({ visible, game, teamById, onClose }: Props) {
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const naverGameId = game.id.startsWith('naver-') ? game.id.slice('naver-'.length) : null;

  useEffect(() => {
    if (!visible || !naverGameId || game.sport !== 'soccer') {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getGameDetail(naverGameId).then((d) => {
      if (cancelled) return;
      setDetail(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, naverGameId, game.sport]);

  const home = teamById.get(game.homeTeamId);
  const away = teamById.get(game.awayTeamId);
  const homeName = home?.shortName ?? game.homeTeamName ?? '홈';
  const awayName = away?.shortName ?? game.awayTeamName ?? '원정';

  const unavailableReason =
    game.sport !== 'soccer'
      ? '야구 경기는 아직 지원하지 않아요.'
      : !naverGameId
        ? '목업 경기라 상세 정보가 없어요.'
        : !loading && !detail
          ? '아직 득점자/라인업 정보가 없어요 (경기 시작 전이거나 데이터가 늦게 올라오는 경우가 있어요).'
          : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <AppText style={styles.title}>
            {homeName} {game.homeScore ?? '-'} : {game.awayScore ?? '-'} {awayName}
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading && <AppText style={styles.emptyText}>불러오는 중…</AppText>}
            {!loading && unavailableReason && <AppText style={styles.emptyText}>{unavailableReason}</AppText>}
            {!loading && detail && (
              <>
                <ScorersSection detail={detail} homeName={homeName} awayName={awayName} />
                <LineupSection title={`${homeName} 라인업`} lineup={detail.homeLineup} />
                <LineupSection title={`${awayName} 라인업`} lineup={detail.awayLineup} />
              </>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '85%' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 20, marginBottom: 20 },

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  managerText: { fontSize: 12, color: '#777', marginBottom: 8 },

  scorerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  scorerTime: { width: 40, fontSize: 12, color: '#1D4ED8', fontWeight: '700' },
  scorerName: { flex: 1, fontSize: 13, fontWeight: '600' },
  scorerTeam: { fontSize: 11, color: '#999' },

  playerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  playerNumber: { width: 22, fontSize: 12, color: '#999', textAlign: 'center' },
  playerPos: { width: 30, fontSize: 11, color: '#1D4ED8', fontWeight: '700' },
  playerName: { flex: 1, fontSize: 13, fontWeight: '600' },
  playerBadges: { flexDirection: 'row', gap: 4 },
  badgeText: { fontSize: 11 },
  subHeader: { fontSize: 12, fontWeight: '700', color: '#777', marginTop: 8, marginBottom: 4 },
});
