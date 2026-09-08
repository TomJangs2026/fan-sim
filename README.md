# 팬심 FAN-SIM

좋아하는 야구/축구 팀·선수의 일정을 한눈에 보는 앱. diary-app과 동일한 스택(Expo 단일 코드베이스, pnpm 모노레포, Zustand, Atomic 디자인)을 사용합니다.

## 폴더 구조

```
fan-sim/
  apps/mobile/
    app/
      _layout.tsx / index.tsx
      (auth)/login.tsx
      (main)/(tabs)/home.tsx        # 1~4줄 + 일정 리스트
      (main)/(tabs)/news.tsx         # 뉴스 (스텁)
      (main)/(tabs)/preferences.tsx  # 선호설정 (팀/선수 검색+즐겨찾기)
      (main)/(tabs)/settings.tsx     # 일반설정 (꾸미기/로그아웃/SNS공유)
    src/components/
      atoms/       AppText, NumericText, AppButton, RoundLabel, IconCircleButton
      molecules/   TeamLogo, RecentFormDots, BroadcastLinks, ShareButtonRow, SettingRow
      organisms/   CalendarHeader, MonthSelector, WeeklyBanner, AdBannerPlaceholder,
                    GameScheduleItem, StandingsModal, FavoritesPicker, AppearancePicker
  packages/
    core/     타입, Zustand 스토어, 로컬 저장소, 테마, 스포츠 데이터 어댑터(mock)
    backend/  Supabase 전환 스키마 + 실제 스포츠 API 연동 가이드
```

## 1. 설치

```bash
corepack enable
pnpm install
```

## 2. 웹에서 테스트

```bash
pnpm mobile:web
```

## 3. 안드로이드 폰에서 테스트 (Expo Go, Mac 불필요)

1. 폰에 **Expo Go** 앱 설치, 컴퓨터와 같은 Wi-Fi 연결
2. `pnpm mobile` 실행 → QR코드를 Expo Go로 스캔

이 앱도 diary-app처럼 커스텀 네이티브 모듈이 없어서 Expo Go로 바로 됩니다. 나중에 카카오 로그인 SDK나 광고 SDK를 붙이는 시점부터 Dev Client 빌드가 필요해집니다.

## 4. 스포츠 데이터는 지금 전부 Mock입니다 (KBO는 스크래퍼 1차 구현 있음)

`packages/core/src/services/sportsDataService.ts`가 데이터 어댑터입니다. 기본은 `services/mock/`의
가짜 일정/순위를 반환합니다.

**KBO 실제 일정을 붙이고 싶다면** (`packages/backend/scraper-server` 참고):
```bash
cd packages/backend/scraper-server
pnpm install
cp .env.example .env   # README.md 순서대로 실제 엔드포인트 확인 후 채워넣기
pnpm dev                # http://localhost:5000, index.js 저장할 때마다 자동 재시작
```
그 다음 `packages/core/src/services/sportsDataService.ts` 상단의 `USE_NAVER_PROXY`를 `true`로 바꾸면
야구 일정은 이 서버에서, 축구는 계속 mock에서 가져옵니다. 서버가 꺼져 있거나 요청이 실패하면 자동으로
mock으로 폴백하니 개발 중 안전합니다. **실기기(Expo Go)로 테스트할 때는 `localhost` 대신 PC의 LAN IP를
써야 합니다** (`naverKboAdapter.ts`의 `SCRAPER_BASE_URL` 참고, `EXPO_PUBLIC_SCRAPER_URL` 환경변수로 지정 가능).

**실제 연동 시 참고 (2026년 기준 조사 결과)**
- KBO(야구): 공식 무료 실시간 API가 없습니다. 유료 데이터 제공사(Sportradar, LSports) 계약 또는 자체 크롤링 백엔드 구축(상업적 이용 시 KBO 이용약관/저작권 검토 필수) 중 선택해야 합니다.
- K리그(축구): API-SPORTS(api-football.com) 같은 상용 API가 부분적으로 다룹니다. 무료 티어는 호출 수 제한이 큽니다.
- **API 키와 크롤러는 앱(클라이언트)에 두지 말고 Supabase Edge Function 등 백엔드에 두세요.** 백엔드가 주기적으로(cron) 데이터를 가져와 DB에 적재하고, 앱은 그 DB를 조회만 하는 구조를 권장합니다. 자세한 내용은 `packages/backend/README.md` 참고.

## 5. 지금 목업으로 처리된 부분

| 기능 | 현재 상태 |
|---|---|
| 경기 일정/순위/스코어 | Mock 데이터 (위 3번 참고) |
| 팀 로고 / 선수 사진 | 이니셜 원형 배지로 대체 (실제 이미지는 `Team.logoUrl`/`Player.photoUrl` 채운 뒤 `Image`로 교체) |
| SNS 로그인 | 버튼 누르면 로컬 세션만 생성 |
| 광고 배너 | 자리표시 View (`AdBannerPlaceholder.tsx`) |
| AI 요약 | 규칙 기반 가짜 요약 (`packages/core/src/ai/summarize.ts`) |
| 뉴스 탭 | 빈 안내 문구만 표시 |

## 6. 트러블슈팅

diary-app에서 겪었던 아래 두 이슈는 이 프로젝트엔 **미리 반영**해뒀습니다 (그래도 재현되면 참고하세요).

- `Incompatible React versions` → 루트 `package.json`의 `pnpm.overrides`로 `react`/`react-dom` 18.2.0 고정 완료
- `Unable to resolve "@babel/runtime/..."` → `apps/mobile/package.json`에 `@babel/runtime` 명시적으로 포함됨

혹시 에러가 나면:
```bash
rm -rf node_modules apps/mobile/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
cd apps/mobile && npx expo start --web --clear
```

## 7. 집 밖에서도 폰으로 보기 (배포)

지금까지 방법(2, 3번)은 전부 **같은 Wi-Fi 안에서만** 됩니다. 컴퓨터를 안 켜놔도 폰에서 바로 되게
하려면 아래 두 가지가 **둘 다** 필요합니다 — 데이터 서버를 인터넷에 올리고, 앱을 설치 가능한 파일로
빌드해야 합니다. Supabase는 로그인/기기 간 동기화가 필요할 때나 쓰는 거라 지금 단계엔 필요 없습니다
(`packages/backend/README.md` 참고, 아직 스키마 초안만 있고 연결 안 됨).

### 7-1. 데이터 서버(scraper-server) 인터넷에 올리기 — Render 기준(무료, 카드 불필요)

1. 이 저장소를 GitHub에 올린다 (로컬 git 저장소는 이미 만들어뒀습니다):
   ```bash
   # GitHub 웹에서 빈 저장소를 하나 만든 뒤
   git remote add origin <저장소 URL>
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
2. [render.com](https://render.com) 가입 → **New +** → **Blueprint** → 방금 올린 GitHub 저장소 선택.
   저장소 루트의 `render.yaml`을 자동으로 읽어서 `packages/backend/scraper-server`를 배포합니다.
3. 몇 분 뒤 `https://fan-sim-scraper-XXXX.onrender.com` 같은 URL이 생깁니다 — 이게 앱이 실제로
   붙을 데이터 서버 주소입니다. (설정할 환경변수 없음 — `PORT`는 Render가 알아서 넣어줍니다.)
4. 무료 플랜은 15분 동안 요청이 없으면 잠들었다가 다음 요청에서 30~60초 걸려 깨어납니다 — 오랜만에
   열면 첫 로딩만 느릴 수 있습니다.

### 7-2. 앱을 폰에 설치 가능한 파일로 빌드하기 — EAS 기준

1. `apps/mobile/eas.json`에 있는 `EXPO_PUBLIC_SCRAPER_URL` 두 곳을 7-1에서 받은 실제 Render 주소로 바꾼다.
2. ```bash
   npm install -g eas-cli
   eas login                              # Expo 계정 필요(무료 가입, expo.dev)
   cd apps/mobile
   eas build:configure                    # 최초 1회 — projectId를 자동으로 만들어 app.config.js에 연결
   eas build --platform android --profile preview
   ```
3. 빌드가 끝나면 터미널/이메일로 오는 링크에서 APK를 받아 폰에 설치합니다
   ("출처를 알 수 없는 앱" 설치를 허용해야 할 수 있습니다).
4. 이제 컴퓨터를 꺼도 앱이 어디서든 (모바일 데이터, 다른 Wi-Fi 등) 그대로 동작합니다.

iOS는 애플 개발자 계정($99/년)이 있어야 폰에 설치 가능한 빌드를 만들 수 있어서(TestFlight 등록 또는
기기 UDID 등록 필요) 안드로이드보다 한 단계 더 필요합니다. 준비되면 `eas build --platform ios`로 동일하게 진행하면 됩니다.

## 8. 다음 단계 제안

1. 실제 팀 로고/선수 사진 이미지 연결
2. Supabase 연동 (`packages/backend/README.md`)
3. 실제 스포츠 데이터 백엔드 구축 (크롤링 or 유료 API)
4. 뉴스 탭에 실제 뉴스 API + AI 요약 연동
5. 광고 SDK(AdMob 등) 연동
