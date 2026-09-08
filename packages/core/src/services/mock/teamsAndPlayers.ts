import { Team, Player } from '../../types';
import { LEAGUE_REGISTRY } from '../leagueRegistry';

interface TeamDef {
  id: string;
  name: string;
  shortName: string;
  naverCode: string;
  colorHex: string;
  favoriteUserIds?: string[]; // 기본 데모용 즐겨찾기 시드값. 실제 서비스에선 엑셀 Teams 시트의 user-id 컬럼으로 채운다.
}

// 리그ID로 먼저 묶고 그 안에 팀을 나열하는 구조. naverCode는 실제 API 응답에서 확인된 값만 채웠다.
// 이 파일은 "기본값"이다 — 엑셀 업로드로 더 채워 넣으면 teamPlayerStore.ts에서 이 기본값 위에
// 덮어써서(upsert) 최종 목록을 만든다.
const TEAMS_BY_LEAGUE: Record<string, TeamDef[]> = {
  KBaseball1: [
    { id: 't-samsung', name: '삼성', shortName: '삼성', naverCode: 'SS', colorHex: '#074CA1' },
    { id: 't-lg', name: 'LG', shortName: 'LG', naverCode: 'LG', colorHex: '#C30452' },
    { id: 't-doosan', name: '두산', shortName: '두산', naverCode: 'OB', colorHex: '#131230', favoriteUserIds: ['me'] },
    { id: 't-kt', name: 'KT', shortName: 'KT', naverCode: 'KT', colorHex: '#000000' },
    { id: 't-hanwha', name: '한화', shortName: '한화', naverCode: 'HH', colorHex: '#FF6600', favoriteUserIds: ['me'] },
    { id: 't-kia', name: 'KIA', shortName: 'KIA', naverCode: 'HT', colorHex: '#EA0029' },
    { id: 't-lotte', name: '롯데', shortName: '롯데', naverCode: 'LT', colorHex: '#041E42' },
    { id: 't-nc', name: 'NC', shortName: 'NC', naverCode: 'NC', colorHex: '#315288' },
    { id: 't-ssg', name: 'SSG', shortName: 'SSG', naverCode: 'SK', colorHex: '#CE0E2D' },
    { id: 't-kiwoom', name: '키움', shortName: '키움', naverCode: 'WO', colorHex: '#570514' },
  ],
  KSoccer1: [
    { id: 't-ulsan', name: '울산', shortName: '울산', naverCode: '01', colorHex: '#0C3C7E' },
    { id: 't-gangwon', name: '강원', shortName: '강원', naverCode: '21', colorHex: '#F37321' },
    { id: 't-incheon', name: '인천', shortName: '인천', naverCode: '18', colorHex: '#00338D' },
    { id: 't-gimcheon', name: '김천', shortName: '김천', naverCode: '35', colorHex: '#000000' },
    { id: 't-bucheon', name: '부천', shortName: '부천', naverCode: '26', colorHex: '#FFD200' },
    { id: 't-jeonbuk', name: '전북', shortName: '전북', naverCode: '05', colorHex: '#00522F' },
    { id: 't-gwangju', name: '광주FC', shortName: '광주FC', naverCode: '', colorHex: '#FFCC00' },
  ],
  KSoccer2: [
    { id: 't-daegu', name: '대구', shortName: '대구', naverCode: '17', colorHex: '#0064B1' },
    { id: 't-chungnam-asan', name: '충남아산', shortName: '충남아산', naverCode: '34', colorHex: '#0B4DA1' },
    { id: 't-seoul-e', name: '서울E', shortName: '서울E', naverCode: '31', colorHex: '#004B93' },
    { id: 't-ansan', name: '안산', shortName: '안산', naverCode: '32', colorHex: '#0C2340' },
    { id: 't-gimpo', name: '김포', shortName: '김포', naverCode: '36', colorHex: '#8A1538' },
    { id: 't-cheonan', name: '천안', shortName: '천안', naverCode: '38', colorHex: '#00A651' },
    { id: 't-paju', name: '파주', shortName: '파주', naverCode: '40', colorHex: '#003876' },
    { id: 't-seongnam', name: '성남', shortName: '성남', naverCode: '08', colorHex: '#000000' },
  ],
  ESoccer1: [
    { id: 't-arsenal', name: '아스널', shortName: '아스널', naverCode: '1006', colorHex: '#EF0107' },
    { id: 't-coventry', name: '코벤트리', shortName: '코벤트리', naverCode: '5AgVZc', colorHex: '#78D0F7' },
    { id: 't-hull', name: '헐 시티', shortName: '헐시티', naverCode: 'Y8fTUn', colorHex: '#F18A01' },
    { id: 't-man-utd', name: '맨유', shortName: '맨유', naverCode: '12', colorHex: '#DA291C' },
    { id: 't-nottingham', name: '노팅엄', shortName: '노팅엄', naverCode: '15', colorHex: '#DD0000' },
    { id: 't-leeds', name: '리즈', shortName: '리즈', naverCode: 'Sa0VaD', colorHex: '#FFCD00' },
    { id: 't-everton', name: '에버턴', shortName: '에버턴', naverCode: '8', colorHex: '#003399' },
    { id: 't-crystal-palace', name: '크리스털 팰리스', shortName: '크리스털', naverCode: '5', colorHex: '#1B458F' },
    { id: 't-ipswich', name: '입스위치', shortName: '입스위치', naverCode: '27', colorHex: '#0033A0' },
    { id: 't-sunderland', name: '선덜랜드', shortName: '선덜랜드', naverCode: 'TTwjJb', colorHex: '#EB172B' },
    { id: 't-tottenham', name: '토트넘', shortName: '토트넘', naverCode: '', colorHex: '#132257' },
  ],
  ESoccer2: [
    { id: 't-millwall', name: '밀월', shortName: '밀월', naverCode: 'lIHBmQ', colorHex: '#001B2E' },
    { id: 't-norwich', name: '노리치', shortName: '노리치', naverCode: '6HuShJ', colorHex: '#00A650' },
    { id: 't-lincoln', name: '링컨', shortName: '링컨', naverCode: '7FZbvg', colorHex: '#C8102E' },
    { id: 't-portsmouth', name: '포츠머스', shortName: '포츠머스', naverCode: '1vXEXm', colorHex: '#001489' },
    { id: 't-birmingham', name: '버밍엄', shortName: '버밍엄', naverCode: 'setG4n', colorHex: '#0000FF' },
    { id: 't-bristol-city', name: '브리스톨 C', shortName: '브리스톨C', naverCode: 'e3EMHv', colorHex: '#E21C21' },
    { id: 't-preston', name: '프레스턴', shortName: '프레스턴', naverCode: 'qxi5zw', colorHex: '#1D4487' },
    { id: 't-wolves', name: '울버햄튼', shortName: '울버햄튼', naverCode: '44', colorHex: '#FDB913' },
    { id: 't-west-ham', name: '웨스트햄', shortName: '웨스트햄', naverCode: '43', colorHex: '#7A263A' },
    { id: 't-charlton', name: '찰튼', shortName: '찰튼', naverCode: 'sl0e24', colorHex: '#D4021D' },
    { id: 't-derby', name: '더비 카운티', shortName: '더비', naverCode: 'BArJcK', colorHex: '#FFFFFF' },
    { id: 't-cardiff', name: '카디프', shortName: '카디프', naverCode: 'OFnDxu', colorHex: '#0070B5' },
    { id: 't-blackburn', name: '블랙번', shortName: '블랙번', naverCode: 'aNNpSq', colorHex: '#009EE0' },
    { id: 't-middlesbrough', name: '미들즈브러', shortName: '미들즈브러', naverCode: 'lDjhBV', colorHex: '#E21A23' },
    { id: 't-swansea', name: '스완지', shortName: '스완지', naverCode: 'wKNxf8', colorHex: '#121212' },
    { id: 't-sheffield', name: '셰필드', shortName: '셰필드', naverCode: 'fhArtk', colorHex: '#EE2737' },
    { id: 't-wrexham', name: '렉섬', shortName: '렉섬', naverCode: '3WjwdJ', colorHex: '#C8102E' },
    { id: 't-watford', name: '왓퍼드', shortName: '왓퍼드', naverCode: '11FENF', colorHex: '#FBEE23' },
    { id: 't-southampton', name: '사우샘프턴', shortName: '사우샘프턴', naverCode: '18', colorHex: '#D71920' },
    { id: 't-stoke', name: '스토크', shortName: '스토크', naverCode: 's3alqz', colorHex: '#E03A3E' },
    { id: 't-qpr', name: 'QPR', shortName: 'QPR', naverCode: 'jJ3a4b', colorHex: '#1D5BA4' },
    { id: 't-bolton', name: '볼튼', shortName: '볼튼', naverCode: '6Q1eVF', colorHex: '#263C7E' },
  ],
  SSoccer1: [
    { id: 't-betis', name: '베티스', shortName: '베티스', naverCode: '26314', colorHex: '#00954C' },
    { id: 't-sociedad', name: '소시에다드', shortName: '소시에다드', naverCode: '26308', colorHex: '#0066B3' },
    { id: 't-mallorca', name: '마요르카', shortName: '마요르카', naverCode: '', colorHex: '#A5122B' },
    { id: 't-atletico', name: '아틀레티코 마드리드', shortName: '아틀레티코', naverCode: '', colorHex: '#CB3524' },
  ],
  FSoccer1: [
    { id: 't-marseille', name: '마르세유', shortName: '마르세유', naverCode: '26344', colorHex: '#2FAEE0' },
    { id: 't-strasbourg', name: '스트라스부르', shortName: '스트라스부르', naverCode: '26354', colorHex: '#0072CE' },
  ],
  ScSoccer1: [
    { id: 't-rangers', name: '레인저스', shortName: '레인저스', naverCode: '101', colorHex: '#1B458F' },
    { id: 't-st-mirren', name: '세인트 미렌', shortName: '세인트미렌', naverCode: '102', colorHex: '#000000' },
    { id: 't-st-johnstone', name: '세인트 존스턴', shortName: '세인트존스턴', naverCode: 'JVVaaR', colorHex: '#004B9E' },
    { id: 't-celtic', name: '셀틱', shortName: '셀틱', naverCode: '94', colorHex: '#018749' },
  ],
  NLSoccer1: [
    { id: 't-fortuna-sittard', name: '시타르트', shortName: '시타르트', naverCode: 'MKaLml', colorHex: '#F8DE00' },
    { id: 't-az', name: '알크마르', shortName: 'AZ알크마르', naverCode: '26464', colorHex: '#DA1A1A' },
  ],
};

export const DEFAULT_TEAMS: Team[] = Object.entries(TEAMS_BY_LEAGUE).flatMap(([leagueId, defs]) =>
  defs.map(
    (def): Team => ({
      id: def.id,
      leagueIds: [leagueId],
      sport: LEAGUE_REGISTRY[leagueId]?.sport ?? 'soccer',
      name: def.name,
      shortName: def.shortName,
      naverCode: def.naverCode,
      colorHex: def.colorHex,
      favoriteUserIds: def.favoriteUserIds,
    })
  )
);

export const DEFAULT_PLAYERS: Player[] = [
  { id: 'p-lee-kangin', teamId: 't-atletico', name: '이강인', position: 'MF', isStarter: true, country: '대한민국', favoriteUserIds: ['me'] },
  { id: 'p-son-heungmin', teamId: 't-tottenham', name: '손흥민', position: 'FW', isStarter: true, country: '대한민국', favoriteUserIds: ['me'] },
  { id: 'p-ki-sungyueng', teamId: 't-jeonbuk', name: '기성용', position: 'MF', isStarter: false, country: '대한민국' },
  { id: 'p-lee-seungwoo', teamId: 't-gwangju', name: '이승우', position: 'FW', isStarter: true, country: '대한민국' },
  { id: 'p-ryu-hyunjin', teamId: 't-hanwha', name: '류현진', position: '선발투수', isStarter: true, country: '대한민국' },
  { id: 'p-kwak-bin', teamId: 't-doosan', name: '곽빈', position: '선발투수', isStarter: true, country: '대한민국' },
];
