# 스포츠 일정 스크래퍼 프록시 서버 (다종목 확장 가능)

네이버 스포츠의 (문서화되지 않은) 내부 API를 대신 호출해서, 우리 앱이 쓰기 편한 형태로 가공해주는
독립 Express 서버입니다. `packages/core`나 `apps/mobile`과는 별개로 **직접 실행**해야 합니다.

## 리그 ID 규칙

`국가코드(1~2글자) + 스포츠명(영문) + 리그레벨(1이 최상위) + (여자리그면 W)`

예: `KBaseball1`(국내야구 KBO), `ESoccer1`(잉글랜드 프리미어리그), `KVolleyball1W`(국내 여자배구)

`index.js`의 `LEAGUE_REGISTRY` 객체에서 리그를 관리합니다. 새 리그를 추가하려면:

1. 네이버 스포츠에서 해당 종목/리그의 일정 페이지를 열고 F12 → Network → Fetch/XHR
2. 특정 날짜를 클릭해서 `.../schedule/games?...upperCategoryId=???` 요청을 찾기
3. `LEAGUE_REGISTRY`에 그 리그 항목의 `upperCategoryId`를 `'TODO'`에서 찾은 값으로 교체
4. (선택) 특정 대회만 걸러야 하면 `mainCategoryId`도 응답의 `categoryId` 값으로 채우기
5. 클라이언트 쪽 `packages/core/src/services/naverSportsAdapter.ts`의 `LEAGUE_CLIENT_REGISTRY`에도
   같은 leagueId로 등록하고, 그 리그의 팀 코드 매핑(`teamCodeMap`)을
   `packages/core/src/services/mock/teamsAndPlayers.ts`에 추가해야 실제로 화면에 표시됩니다.

## ✅ 확인 완료된 리그

| leagueId | upperCategoryId | mainCategoryId | 상태 |
|---|---|---|---|
| `KBaseball1` (국내야구 KBO) | `kbaseball` | `kbo` | 완전 연동됨 |
| `KSoccer1` (국내축구 K리그1) | `kfootball` | `kleague` | 완전 연동됨 |
| `KSoccer2` (국내축구 K리그2) | `kfootball` | `kleague2` | 완전 연동됨 |
| `ESoccer1`(EPL), `ESoccer2`(챔피언십), `SSoccer1`(라리가), `FSoccer1`(리그앙), `ScSoccer1`(스코틀랜드), `NLSoccer1`(에레디비시) | `wfootball` | 각 리그 categoryId | 완전 연동됨 (2026-08-22 응답으로 확인) |
| `USSoccer1`(MLS), `ISoccer1`(세리에A), `DKSoccer1`(덴마크), `GSoccer1`(분데스리가) | `wfootball` | 각 리그 categoryId | 등록은 됐지만 실제 game listing으로 검증은 안 됨(카테고리 아이콘만 확인) |
| `PSoccer1`(포르투갈), `KVolleyball1`, `KVolleyball1W` | - | - | `upperCategoryId: 'TODO'` 자리표시 |

⚠️ `upperCategoryId=kfootball`/`wfootball`에는 여러 대회가 섞여서 옵니다. 반드시 `mainCategoryId`로 걸러야 합니다.

## 팀 데이터 추가하는 법

리그를 등록해도 **해당 리그의 팀이 `packages/core/src/services/mock/teamsAndPlayers.ts`의
`TEAMS_BY_LEAGUE`에 없으면 그 리그 경기는 화면에 안 나옵니다** (매칭 안 된 팀 코드는 안전하게
버려지도록 되어 있음). 실제 응답에서 보이는 `homeTeamCode`/`homeTeamName`을 그 리그 배열에
추가해주면 됩니다. 로고는 `leagueRegistry.ts`의 `teamLogoSegment` + 팀의 `naverCode`로 자동 생성되어
별도 URL을 넣을 필요가 없습니다.

나머지 리그(EPL, 라리가, 분데스리가 등)는 `upperCategoryId: 'TODO'` 상태로 자리만 만들어뒀습니다.

## 실행

이 폴더는 pnpm 워크스페이스 멤버로 등록되어 있어야 `pnpm install`이 제대로 동작합니다
(루트 `pnpm-workspace.yaml`에 `packages/backend/scraper-server`가 포함되어 있어야 함).

```bash
cd packages/backend/scraper-server
pnpm install
pnpm start
# http://localhost:5000/api/schedule?leagueId=KBaseball1&date=2026-08-15
# (기존 http://localhost:5000/api/kbo-schedule?date=... 도 KBaseball1 별칭으로 계속 동작함)
```

## 이미지 프록시 (팀 로고)

`GET /api/image-proxy?url=<pstatic.net 이미지 URL>` — 네이버 CDN이 Referer 기반 핫링크 방지를
걸어둔 경우 브라우저가 직접 요청하면 403이 날 수 있어서, 서버가 대신 요청해서 그대로 흘려보내
줍니다. `packages/core`의 팀 로고 URL이 이미 이 프록시를 거치도록 되어 있습니다.

## ⚠️ 법적/운영 유의사항

- 네이버가 공식 제공하는 **문서화된 오픈 API가 아닙니다.** 언제든 구조가 바뀌거나 막힐 수 있습니다.
- **개인/취미 프로젝트** 수준에서는 흔히 쓰는 방식이지만, **상업 서비스로 배포**하려면 네이버
  이용약관·저작권을 반드시 검토하세요. `packages/backend/README.md`의 유료 API 대안도 참고하세요.
- 일정 응답은 20초, 이미지는 1시간 캐시가 걸려 있어 네이버로 나가는 실제 요청 수를 줄여줍니다.
- User-Agent 스푸핑이 포함되어 있어 서버 측 차단 정책이 바뀌면 언제든 막힐 수 있습니다.

## 앱과 연결하기

`packages/core/src/services/naverSportsAdapter.ts`가 리그ID 기준으로 이 서버를 호출해서 앱의
`GameSchedule` 타입으로 변환합니다. `sportsDataService.ts`의 `USE_NAVER_PROXY`가 `true`로 켜져
있으면 야구는 실제 데이터로 나오고, 서버가 꺼져있거나 실패하면 자동으로 mock으로 대체됩니다.
