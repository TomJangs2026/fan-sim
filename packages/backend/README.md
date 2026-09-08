# @fan-sim/backend (자리 표시 / 향후 Supabase + 실제 스포츠 API 연동용)

현재 앱은 `packages/core/src/services/sportsDataService.ts`를 통해 **mock 데이터**만 사용합니다.

## 전환 순서 (나중에 진행)

### 1. Supabase (사용자 데이터: 로그인, 즐겨찾기, 꾸미기 설정)
1. Supabase 프로젝트 생성 → `supabase/schema.sql` 실행
2. `@supabase/supabase-js` 설치, `src/supabaseClient.ts` 추가
3. `packages/core/src/db/localDb.ts`와 동일한 인터페이스를 갖는 `remoteDb.ts` 작성
4. SNS 로그인(카카오/구글/애플)을 Supabase Auth OAuth Provider로 교체

### 2. 실제 스포츠 데이터 (경기 일정/순위/스코어)
KBO(야구)는 공식 무료 실시간 API가 없고, K리그(축구)는 상용 API가 부분적으로 다룹니다.

**KBO는 `scraper-server/` 폴더에 1차 구현을 넣어뒀습니다** (`packages/backend/scraper-server`).
네이버 스포츠의 비공식 내부 API를 대신 호출하는 독립 Express 서버 + 20초 캐시 + 실패 시 앱이
자동으로 mock으로 폴백하는 구조입니다. 사용법과 법적 유의사항은 그 폴더의 README.md를 꼭 읽어보세요
(실제 엔드포인트 URL은 아직 채워야 하는 상태입니다).

권장 구조:
1. **API 키/크롤러는 절대 클라이언트(앱)에 두지 않는다.** 지금은 로컬 Express 서버지만,
   운영 단계에서는 Supabase Edge Function(또는 별도 Node 서버)으로 옮기고, 결과를 `games`/`standings`
   테이블에 주기적으로(cron) 적재하는 방식을 권장합니다.
2. 축구: [api-football.com](https://www.api-football.com) (RapidAPI 경유 가능) - K리그1 커버리지 확인 필요, 무료 티어는 호출 수 제한이 큼
3. 야구(KBO): 트래픽이 커지면 유료 데이터 제공사(Sportradar, LSports) 계약도 검토
4. 앱(`sportsDataService.ts`)은 이 백엔드가 만든 Supabase 테이블을 그냥 SELECT만 하도록 바꾸면 되고,
   함수 시그니처가 동일하므로 화면 코드는 수정이 필요 없다.
