import React, { useState } from 'react';
import { TouchableOpacity, Alert, Platform, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import {
  upsertTeamsFromRows,
  upsertPlayersFromRows,
  upsertLeagueZonesFromRows,
  invalidateScheduleCache,
  getKnownFavoriteUserIds,
  useAppStore,
} from '@fan-sim/core';
import AppText from '../atoms/AppText';

/**
 * 팀/선수/리그 정보를 엑셀 한 파일(시트: "Teams", "Players", 선택적으로 "Leagues")로 업로드하는 버튼.
 * - Teams 시트 컬럼: team-id | team-name | short-name | naver-code | league-id (콤마로 여러 개 가능,
 *     UEFA 클럽대항전 출전팀은 소속 리그 뒤에 champs/europa/uecl을 덧붙인다 — 예: "GSoccer1,champs") |
 *     user-id(맨 끝, 선택, 콤마로 여러 명 가능)
 * - Players 시트 컬럼: player-id | player-name | player-position | is-starter | country | team-id | user-id(선택, 콤마로 여러 명 가능)
 * - Leagues 시트 컬럼(순위표 색깔 구간용, 선택): league-id | season(참고용) |
 *     ucl-start | ucl-end | ucl-p-start | ucl-p-end(챔스 예선, 예: 리그앙 3위) |
 *     uel-start | uel-end | uecl-start | uecl-end |
 *     playoff-start | playoff-end | relegation-start | relegation-end
 *   리그당 한 행. 구간이 없는 항목은 칸을 비워두면 된다 (예: 강등 플레이오프 없는 리그).
 * 같은 id로 다시 업로드하면 새 값으로 덮어써지고(upsert), 새 id는 추가된다.
 * user-id 칸은 그 행이 시트에 있는 한 항상 새로 계산되어 덮어써진다 — 그래서 설정 화면 체크박스로
 * 즐겨찾기를 바꿔뒀어도, 엑셀을 다시 올리면 그 안의 값이 우선한다("리셋 후 덮어쓰기").
 */
export default function TeamPlayerExcelUpload() {
  const [busy, setBusy] = useState(false);
  const bumpDataVersion = useAppStore((s) => s.bumpDataVersion);
  const mergeKnownUserIds = useAppStore((s) => s.mergeKnownUserIds);

  async function readWorkbook(): Promise<XLSX.WorkBook | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;

    const asset = result.assets[0];

    if (Platform.OS === 'web') {
      // 웹에서는 DocumentPicker 결과에 브라우저 File 객체가 함께 온다.
      const file = (asset as any).file as File | undefined;
      if (!file) throw new Error('웹에서 파일 데이터를 읽지 못했습니다.');
      const arrayBuffer = await file.arrayBuffer();
      return XLSX.read(arrayBuffer, { type: 'array' });
    }

    const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    return XLSX.read(base64, { type: 'base64' });
  }

  async function handleUpload() {
    setBusy(true);
    try {
      const workbook = await readWorkbook();
      if (!workbook) return; // 사용자가 취소함

      const teamsSheet = workbook.Sheets['Teams'];
      const playersSheet = workbook.Sheets['Players'];
      const leaguesSheet = workbook.Sheets['Leagues'];

      const teamRows = teamsSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(teamsSheet) : [];
      const playerRows = playersSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(playersSheet) : [];
      const leagueZoneRows = leaguesSheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(leaguesSheet) : [];

      if (teamRows.length === 0 && playerRows.length === 0 && leagueZoneRows.length === 0) {
        Alert.alert('업로드 실패', '"Teams", "Players", "Leagues" 시트에서 데이터를 찾지 못했습니다. 시트 이름을 확인해주세요.');
        return;
      }

      const [teamResult, playerResult, leagueZoneResult] = await Promise.all([
        upsertTeamsFromRows(teamRows),
        upsertPlayersFromRows(playerRows),
        upsertLeagueZonesFromRows(leagueZoneRows),
      ]);

      invalidateScheduleCache(); // 새 팀 기준으로 mock 일정/순위를 다시 만들도록
      mergeKnownUserIds(await getKnownFavoriteUserIds()); // 엑셀에 새 user-id가 있으면 프로필 목록에 자동 등록
      bumpDataVersion(); // 이미 열려있는 화면들도 다시 불러오도록 신호

      Alert.alert(
        '완료',
        `팀 ${teamResult.count}건, 선수 ${playerResult.count}건, 리그 설정 ${leagueZoneResult.count}건을 반영했습니다.`
      );
    } catch (e: any) {
      Alert.alert('업로드 실패', e?.message ?? '엑셀 파일을 읽는 중 문제가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={busy}>
      <AppText style={styles.label}>{busy ? '업로드 중...' : '📊 엑셀 업로드'}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  label: { fontSize: 12, color: '#3730A3', fontWeight: '600' },
});
