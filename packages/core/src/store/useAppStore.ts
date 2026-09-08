import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppearanceSettings, UserSession } from '../types';
import { DEFAULT_APPEARANCE } from '../theme/presets';
import { toLocalDateStr } from '../utils/date';

interface AppState {
  session: UserSession | null;
  setSession: (session: UserSession | null) => void;

  appearance: AppearanceSettings;
  setAppearance: (patch: Partial<AppearanceSettings>) => void;

  // 팀/선수 데이터(및 그 안의 즐겨찾기 user-id 태그)가 바뀔 때마다 올라가는 카운터.
  // 화면들은 이 값을 useEffect 의존성에 넣어서, 엑셀 재업로드 후 화면을 새로 열지 않아도
  // 자동으로 다시 불러오도록 한다 (teamPlayerStore.ts/sportsDataService.ts의 캐시 무효화와 짝을 이룸).
  dataVersion: number;
  bumpDataVersion: () => void;

  selectedDate: string; // YYYY-MM-DD, 홈 화면에서 보고 있는 날짜(월 선택 등에 사용)
  setSelectedDate: (date: string) => void;

  viewMode: 'team' | 'player'; // 1줄 오른쪽 팀/선수 토글
  setViewMode: (mode: 'team' | 'player') => void;

  // 등록된 프로필 id 목록(예: ['me','seoyeon']). 설정 화면에서 추가할 수 있고,
  // 엑셀 user-id 컬럼에 새 id가 나오면 업로드 시 자동으로 여기 합쳐진다(mergeKnownUserIds).
  knownUserIds: string[];
  addKnownUserId: (userId: string) => void;
  mergeKnownUserIds: (userIds: string[]) => void;

  // 메인 화면에서 지금 체크되어(보고 있는) 프로필들 — 여러 명 동시 선택 가능.
  // WeeklyBanner 등에서 "이 사람들의 즐겨찾기"를 합쳐서 보여줄 때 쓴다.
  activeUserIds: string[];
  toggleActiveUserId: (userId: string) => void;

  // 홈 화면 국적 탭에 보여줄 나라 목록(기본: 대한민국/아르헨티나). 설정 화면에서 추가 가능.
  // 선수의 Player.country와 매칭해서 "이 나라 선수가 나온 경기만" 필터링하는 데 쓴다.
  knownCountries: string[];
  addKnownCountry: (country: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      session: null,
      setSession: (session) => set({ session }),

      appearance: DEFAULT_APPEARANCE,
      setAppearance: (patch) => set({ appearance: { ...get().appearance, ...patch } }),

      dataVersion: 0,
      bumpDataVersion: () => set({ dataVersion: get().dataVersion + 1 }),

      selectedDate: toLocalDateStr(new Date()),
      setSelectedDate: (date) => set({ selectedDate: date }),

      viewMode: 'team',
      setViewMode: (mode) => set({ viewMode: mode }),

      knownUserIds: ['me', 'seoyeon'],
      addKnownUserId: (userId) => {
        const id = userId.trim();
        if (!id || get().knownUserIds.includes(id)) return;
        set({ knownUserIds: [...get().knownUserIds, id], activeUserIds: [...get().activeUserIds, id] });
      },
      mergeKnownUserIds: (userIds) => {
        const newOnes = userIds.filter((id) => !get().knownUserIds.includes(id));
        if (newOnes.length === 0) return;
        set({ knownUserIds: [...get().knownUserIds, ...newOnes], activeUserIds: [...get().activeUserIds, ...newOnes] });
      },

      activeUserIds: ['me', 'seoyeon'],
      toggleActiveUserId: (userId) => {
        const { activeUserIds } = get();
        const next = activeUserIds.includes(userId) ? activeUserIds.filter((id) => id !== userId) : [...activeUserIds, userId];
        set({ activeUserIds: next });
      },

      knownCountries: ['대한민국', '아르헨티나'],
      addKnownCountry: (country) => {
        const name = country.trim();
        if (!name || get().knownCountries.includes(name)) return;
        set({ knownCountries: [...get().knownCountries, name] });
      },
    }),
    {
      name: 'fan-sim-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        appearance: state.appearance,
        knownUserIds: state.knownUserIds,
        activeUserIds: state.activeUserIds,
        knownCountries: state.knownCountries,
      }),
    }
  )
);
