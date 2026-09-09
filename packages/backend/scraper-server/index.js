const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 배포 플랫폼(Render 등) 헬스체크용. 외부 API를 안 건드리고 그냥 살아있는지만 확인한다.
app.get('/health', (req, res) => res.status(200).json({ ok: true }));

const PORT = process.env.PORT || 5000;
const CACHE_TTL_MS = 20_000;
const scheduleCache = new Map(); // "leagueId:date" -> { at, data }

const STANDINGS_CACHE_TTL_MS = 5 * 60_000; // 순위는 경기 중에도 자주 안 바뀌니 넉넉하게 캐시
const SEASON_CACHE_TTL_MS = 60 * 60_000; // 시즌 코드는 하루에도 거의 안 바뀜
const standingsCache = new Map(); // leagueId -> { at, data }
const seasonCodeCache = new Map(); // categoryId -> { at, seasonCode }

const GAME_DETAIL_CACHE_TTL_MS = 20_000;
const gameDetailCache = new Map(); // gameId -> { at, data }

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 리그 ID 규칙 (사용자 정의):
 *   국가코드(1~2글자) + 스포츠명(영문) + 리그레벨(1이 최상위) + (여자리그면 W)
 *   예) KBaseball1 = 국내야구 1부, ESoccer1 = 잉글랜드 프리미어리그, KVolleyball1W = 국내 여자배구
 *
 * upperCategoryId가 'TODO'인 항목은 아직 실제 네이버 카테고리 값을 확인 못한 자리다.
 * 확인 방법: 브라우저에서 해당 종목 일정 페이지를 열고 F12 Network 탭에서
 *   .../schedule/games?...upperCategoryId=??? 요청을 찾아 그 값을 넣으면 된다.
 * 'TODO'인 리그는 /api/schedule 호출 시 안내 메시지와 함께 501을 반환한다.
 */
const SOCCER_FIELDS =
  'basic,schedule,matchRound,roundTournamentInfo,phaseCode,groupName,leg,hasPtSore,homePtScore,awayPtScore,league,leagueName,aggregateWinner,neutralGround,postponed,manualRelayUrl';
const BASEBALL_FIELDS = 'basic,schedule,baseball,manualRelayUrl';

const LEAGUE_REGISTRY = {
  KBaseball1: {
    sport: 'baseball',
    upperCategoryId: 'kbaseball',
    mainCategoryId: 'kbo', // 이 값이 아닌 항목(팬 편파중계 등)은 걸러낸다
    fields: BASEBALL_FIELDS,
    label: '국내야구(KBO)',
  },
  KSoccer1: {
    sport: 'soccer',
    upperCategoryId: 'kfootball',
    // upperCategoryId=kfootball 하나에 사우디리그/AFC컵 등 다른 대회도 섞여서 오는 걸 확인함.
    // categoryId==='kleague'가 K리그1, 'kleague2'가 K리그2.
    mainCategoryId: 'kleague',
    fields: SOCCER_FIELDS,
    label: '국내축구 K리그1',
  },
  KSoccer2: {
    sport: 'soccer',
    upperCategoryId: 'kfootball',
    mainCategoryId: 'kleague2',
    fields: SOCCER_FIELDS,
    label: '국내축구 K리그2',
  },

  // 해외축구: upperCategoryId='wfootball' 하나에 여러 리그가 섞여오므로 mainCategoryId로 구분.
  // 2026-08-22 응답으로 epl/primera/ligue1/england2/spl/eredivisie는 실제 game listing에서 확인됨.
  // mls/seria/denmark/bundesliga는 카테고리 아이콘만 확인되어 상대적으로 신뢰도가 낮음(그래도 등록은 해둠 —
  // categoryId가 틀려도 그냥 그 리그만 안 나올 뿐 에러는 안 남).
  ESoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'epl', fields: SOCCER_FIELDS, label: '프리미어리그' },
  ESoccer2: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'england2', fields: SOCCER_FIELDS, label: '잉글랜드 챔피언십' },
  SSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'primera', fields: SOCCER_FIELDS, label: '라리가' },
  FSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'ligue1', fields: SOCCER_FIELDS, label: '리그앙' },
  ScSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'spl', fields: SOCCER_FIELDS, label: '스코틀랜드 프리미어십' },
  NLSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'eredivisie', fields: SOCCER_FIELDS, label: '에레디비시' },
  USSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'mls', fields: SOCCER_FIELDS, label: 'MLS' },
  ISoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'seria', fields: SOCCER_FIELDS, label: '세리에A' },
  DKSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'denmark', fields: SOCCER_FIELDS, label: '덴마크 수페르리가' },
  GSoccer1: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'bundesliga', fields: SOCCER_FIELDS, label: '분데스리가' },

  // UEFA 클럽대항전. upperCategoryId는 소속 리그와 동일하게 'wfootball' 하나에 categoryId로만
  // 구분되는 걸 확인함(2026-09-07, fromDate/toDate 기반 games 조회로 phaseCode/matchDay 없이도 나옴).
  champs: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'champs', fields: SOCCER_FIELDS, label: 'UEFA 챔피언스리그' },
  europa: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'europa', fields: SOCCER_FIELDS, label: 'UEFA 유로파리그' },
  uecl: { sport: 'soccer', upperCategoryId: 'wfootball', mainCategoryId: 'uecl', fields: SOCCER_FIELDS, label: 'UEFA 컨퍼런스리그' },

  // 아직 categoryId 확인 전. 확인 방법: README 참고.
  PSoccer1: { sport: 'soccer', upperCategoryId: 'TODO', mainCategoryId: null, fields: SOCCER_FIELDS, label: '포르투갈 프리메이라리가' },
  KVolleyball1: { sport: 'volleyball', upperCategoryId: 'TODO', mainCategoryId: null, fields: 'basic,schedule', label: '국내 남자배구(V리그)' },
  KVolleyball1W: { sport: 'volleyball', upperCategoryId: 'TODO', mainCategoryId: null, fields: 'basic,schedule', label: '국내 여자배구(V리그)' },
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 종목마다 응답 필드가 조금씩 다르지만, basic/schedule 그룹은 공통으로 내려오는 걸 확인함(야구 기준).
// 축구/기타 종목도 같은 필드명을 쓸 것으로 예상하지만 100% 확인된 건 아니라서,
// 실제 응답을 보고 다르면 이 매핑 함수만 고치면 된다 (호출부는 안 건드려도 됨).
function refineGame(g) {
  return {
    gameId: g.gameId,
    categoryId: g.categoryId,
    dateTime: g.gameDateTime,
    stadium: g.stadium,
    status: g.statusCode,
    statusDesc: g.statusInfo,
    // 라운드/매치데이 번호(K리그는 숫자, 챔스는 문자열로 오는 등 타입이 섞여 있어서 문자열로 통일).
    round: g.matchRound != null && g.matchRound !== '' ? String(g.matchRound) : null,
    // 챔피언스리그 등 UEFA 대회에서 'LEAGUE'(리그 페이즈) 같은 값. 국내/유럽 개별 리그는 보통 null.
    phaseCode: g.phaseCode || null,
    homeTeamCode: g.homeTeamCode,
    homeTeamName: g.homeTeamName,
    homeScore: g.homeTeamScore ?? null,
    homeStarter: g.homeStarterName || null, // 야구 전용, 없으면 null
    homeEmblemUrl: g.homeTeamEmblemUrl || null,
    awayTeamCode: g.awayTeamCode,
    awayTeamName: g.awayTeamName,
    awayScore: g.awayTeamScore ?? null,
    awayStarter: g.awayStarterName || null,
    awayEmblemUrl: g.awayTeamEmblemUrl || null,
    broadcastChannel: g.broadChannel || null,
  };
}

async function getLeagueSchedule(leagueId, dateStr) {
  const league = LEAGUE_REGISTRY[leagueId];
  if (!league) {
    return { status: 404, body: { success: false, message: `등록되지 않은 leagueId: ${leagueId}` } };
  }
  if (league.upperCategoryId === 'TODO') {
    return {
      status: 501,
      body: {
        success: false,
        message: `${leagueId}(${league.label})의 실제 upperCategoryId가 아직 설정되지 않았습니다. README 참고해서 채워주세요.`,
      },
    };
  }

  const cacheKey = `${leagueId}:${dateStr}`;
  const cached = scheduleCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { status: 200, body: { success: true, leagueId, date: dateStr, cached: true, data: cached.data } };
  }

  try {
    const url =
      `https://api-gw.sports.naver.com/schedule/games` +
      `?fields=${encodeURIComponent(league.fields)}` +
      `&upperCategoryId=${encodeURIComponent(league.upperCategoryId)}` +
      `&fromDate=${dateStr}&toDate=${dateStr}&size=500`;

    const response = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
    const games = response.data?.result?.games ?? [];

    const filtered = league.mainCategoryId ? games.filter((g) => g.categoryId === league.mainCategoryId) : games;
    const refinedData = filtered.map(refineGame);

    scheduleCache.set(cacheKey, { at: Date.now(), data: refinedData });
    return { status: 200, body: { success: true, leagueId, date: dateStr, cached: false, data: refinedData } };
  } catch (error) {
    console.error(`[schedule:${leagueId}] fetch failed:`, error.message);
    return { status: 502, body: { success: false, message: '네이버 데이터를 가져오는데 실패했습니다.' } };
  }
}

/**
 * 순위표는 스케줄과 다른 API(네이버 "기록,순위" 페이지가 쓰는 statistics API)를 쓴다.
 * 카테고리(리그)의 시즌 목록에서 isSeason==='Y'인 항목의 seasonCode를 구한 뒤,
 * 그 seasonCode로 팀 순위를 가져오는 2단계 호출이 필요하다.
 * (2026-08-30 기준 EPL 2025/26 -> 실제로는 2026/27, seasonCode 'gMoc'로 확인됨)
 */
async function resolveCurrentSeasonCode(categoryId) {
  const cached = seasonCodeCache.get(categoryId);
  if (cached && Date.now() - cached.at < SEASON_CACHE_TTL_MS) return cached.seasonCode;

  const url = `https://api-gw.sports.naver.com/statistics/categories/${encodeURIComponent(categoryId)}/seasons`;
  const response = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
  const seasons = response.data?.result?.seasons ?? [];
  const current = seasons.find((s) => s.isSeason === 'Y') ?? seasons[seasons.length - 1];
  if (!current) return null;

  seasonCodeCache.set(categoryId, { at: Date.now(), seasonCode: current.seasonCode });
  return current.seasonCode;
}

// teamId가 곧 schedule API의 homeTeamCode/awayTeamCode와 같은 네이버 팀 코드라서
// 클라이언트(naverSportsAdapter.ts)가 이미 갖고 있는 naverCode 매핑을 그대로 재사용할 수 있다.
function refineStanding(t) {
  return {
    teamCode: t.teamId,
    teamName: t.teamName,
    rank: t.rank,
    matchesPlayed: t.matchesPlayed,
    wins: t.wins,
    draws: t.draws,
    losses: t.losses,
    points: t.points,
    goals: t.goals,
    goalsConceded: t.goalsConceded,
    goalsDifference: t.goalsDifference,
    recentForm: t.lastFiveGames || '', // 예: "WWDLW"
  };
}

async function getLeagueStandings(leagueId) {
  const league = LEAGUE_REGISTRY[leagueId];
  if (!league) {
    return { status: 404, body: { success: false, message: `등록되지 않은 leagueId: ${leagueId}` } };
  }
  if (!league.mainCategoryId) {
    return {
      status: 501,
      body: { success: false, message: `${leagueId}(${league.label})는 순위 API의 categoryId가 없어 아직 지원하지 않습니다.` },
    };
  }
  if (league.sport !== 'soccer') {
    // 이 statistics API는 야구(KBO)엔 rank/wins/draws/losses 같은 필드 없이 다른 모양으로 응답한다.
    // (파일 상단 주석 참고: KBO는 공식 무료 실시간 API가 없음 — 이 엔드포인트로 대체할 수 없다.)
    return { status: 501, body: { success: false, message: `${leagueId}(${league.label})는 순위 API를 지원하지 않습니다.` } };
  }

  const cached = standingsCache.get(leagueId);
  if (cached && Date.now() - cached.at < STANDINGS_CACHE_TTL_MS) {
    return { status: 200, body: { success: true, leagueId, cached: true, data: cached.data } };
  }

  try {
    const seasonCode = await resolveCurrentSeasonCode(league.mainCategoryId);
    if (!seasonCode) {
      return { status: 502, body: { success: false, message: '현재 시즌 정보를 찾지 못했습니다.' } };
    }

    const url =
      `https://api-gw.sports.naver.com/statistics/categories/${encodeURIComponent(league.mainCategoryId)}` +
      `/seasons/${encodeURIComponent(seasonCode)}/teams`;
    const response = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': UA } });
    const teams = response.data?.result?.seasonTeamStats ?? [];
    const refinedData = teams.map(refineStanding);

    standingsCache.set(leagueId, { at: Date.now(), data: refinedData });
    return { status: 200, body: { success: true, leagueId, cached: false, data: refinedData } };
  } catch (error) {
    console.error(`[standings:${leagueId}] fetch failed:`, error.message);
    return { status: 502, body: { success: false, message: '네이버 순위 데이터를 가져오는데 실패했습니다.' } };
  }
}

app.get('/api/standings', async (req, res) => {
  const leagueId = String(req.query.leagueId || '');
  const { status, body } = await getLeagueStandings(leagueId);
  res.status(status).json(body);
});

/**
 * 경기 상세(득점자 + 라인업). 축구 전용 — 네이버 게임센터가 쓰는 두 엔드포인트를 합쳐서 준다.
 *   - /schedule/games/{gameId}/game-polling : 스코어/득점자(scorers)
 *   - /schedule/games/{gameId}/lineup       : 선발/교체/감독
 * 선수는 네이버 playerId/이름을 그대로 내려준다 — 우리 팀/선수 로스터와 매칭하지 않는다
 * (상대팀 선수까지 전부 로스터에 등록해둘 수 없으므로).
 */
function refineLineupPlayer(p, isStarter) {
  return {
    playerId: String(p.playerId),
    name: p.name,
    shirtNumber: String(p.shirtNumber ?? ''),
    position: p.pos || '',
    isStarter,
    substituted: !!p.changed,
    goals: p.goal || 0,
    assists: p.assists || 0,
    yellowCards: p.yellowCardCnt || 0,
    redCards: p.redCardCnt || 0,
  };
}

function refineLineupSide(lineupSide, subsSide, managerName) {
  const starters = (lineupSide?.players || []).flat().map((p) => refineLineupPlayer(p, true));
  const substitutes = (subsSide || []).map((p) => refineLineupPlayer(p, false));
  if (starters.length === 0 && substitutes.length === 0) return null;
  return { manager: managerName || undefined, starters, substitutes };
}

async function getGameDetail(gameId) {
  const cached = gameDetailCache.get(gameId);
  if (cached && Date.now() - cached.at < GAME_DETAIL_CACHE_TTL_MS) {
    return { status: 200, body: { success: true, gameId, cached: true, data: cached.data } };
  }

  try {
    const [pollingRes, lineupRes] = await Promise.all([
      axios.get(`https://api-gw.sports.naver.com/schedule/games/${encodeURIComponent(gameId)}/game-polling`, {
        timeout: 5000,
        headers: { 'User-Agent': UA },
      }),
      axios
        .get(`https://api-gw.sports.naver.com/schedule/games/${encodeURIComponent(gameId)}/lineup`, {
          timeout: 5000,
          headers: { 'User-Agent': UA },
        })
        .catch(() => null), // 라인업이 아직 안 나왔을 수 있음(경기 전) — 실패해도 득점자 정보는 보여준다
    ]);

    const scorersRaw = pollingRes.data?.result?.game?.scorers || { home: [], away: [] };
    const scorers = [
      ...(scorersRaw.home || []).map((s) => ({ team: 'home', playerName: s.playerName, minute: s.time, addedTime: s.addedTime || 0, ownGoal: !!s.ownGoal })),
      ...(scorersRaw.away || []).map((s) => ({ team: 'away', playerName: s.playerName, minute: s.time, addedTime: s.addedTime || 0, ownGoal: !!s.ownGoal })),
    ].sort((a, b) => a.minute - b.minute || a.addedTime - b.addedTime);

    const lu = lineupRes?.data?.result?.lineUpData;
    const data = {
      gameId,
      scorers,
      homeLineup: lu ? refineLineupSide(lu.lineup?.home, lu.substitution?.home, lu.manager?.home) : null,
      awayLineup: lu ? refineLineupSide(lu.lineup?.away, lu.substitution?.away, lu.manager?.away) : null,
    };

    gameDetailCache.set(gameId, { at: Date.now(), data });
    return { status: 200, body: { success: true, gameId, cached: false, data } };
  } catch (error) {
    console.error(`[game-detail:${gameId}] fetch failed:`, error.message);
    return { status: 502, body: { success: false, message: '경기 상세 정보를 가져오는데 실패했습니다.' } };
  }
}

app.get('/api/game-detail', async (req, res) => {
  const gameId = String(req.query.gameId || '');
  if (!gameId) return res.status(400).json({ success: false, message: 'gameId가 필요합니다.' });
  const { status, body } = await getGameDetail(gameId);
  res.status(status).json(body);
});

app.get('/api/schedule', async (req, res) => {
  const leagueId = String(req.query.leagueId || '');
  const dateStr = (req.query.date && String(req.query.date)) || todayStr();
  const { status, body } = await getLeagueSchedule(leagueId, dateStr);
  res.status(status).json(body);
});

// 기존 코드/문서 호환용 (leagueId=KBaseball1 고정 별칭)
app.get('/api/kbo-schedule', async (req, res) => {
  const dateStr = (req.query.date && String(req.query.date)) || todayStr();
  const { status, body } = await getLeagueSchedule('KBaseball1', dateStr);
  res.status(status).json(body);
});

/**
 * 이미지 프록시. 네이버 CDN(sports-phinf.pstatic.net 등)이 Referer 기반 핫링크 방지를 걸어둔 경우
 * 브라우저에서 <img src="https://sports-phinf...">로 직접 요청하면 403이 떨어질 수 있다.
 * 서버가 대신 요청해서 그대로 응답을 흘려보내주면(Referer를 네이버로 세팅) 이 문제를 우회할 수 있다.
 */
app.get('/api/image-proxy', async (req, res) => {
  const url = String(req.query.url || '');
  if (!url.startsWith('https://sports-phinf.pstatic.net/')) {
    return res.status(400).send('허용되지 않은 이미지 URL입니다.');
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        'User-Agent': UA,
        Referer: 'https://sports.naver.com/',
      },
    });
    res.set('Content-Type', response.headers['content-type'] || 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(response.data);
  } catch (error) {
    res.status(502).send('이미지를 가져오지 못했습니다.');
  }
});

app.listen(PORT, () => console.log(`Sports schedule proxy running on port ${PORT}`));
