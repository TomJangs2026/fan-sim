export interface channel {
  id: string;
  name: string,
  webUrl: string;
  mobUrl: string;
};

export const CHANNELS: channel[] = [
{ id: 'kbs1', name: 'KBS1', webUrl: 'https://onair.kbs.co.kr', mobUrl: ''},
{ id: 'kbs2', name: 'KBS2', webUrl: 'https://onair.kbs.co.kr', mobUrl: ''},
{ id: 'kbsSports', name: 'KBS N SPORTS', webUrl: 'https://www.kbsn.co.kr/nsports/', mobUrl: ''},
{ id: 'mbc', name: 'MBC', webUrl: 'https://www.imbc.com', mobUrl: ''},
{ id: 'mbcSports', name: 'MBC SPORTS+', webUrl: 'https://m.imbc.com/onair/sports/imbc1', mobUrl: ''},
{ id: 'sbs', name: 'SBS', webUrl: 'https://www.sbs.co.kr/', mobUrl: ''},
{ id: 'sbsSports', name: 'SBS SPORTS', webUrl: 'https://sports.sbs.co.kr/', mobUrl: ''},
{ id: 'sbsGolf', name: 'SBS GOLF', webUrl: 'https://golf.sbs.co.kr/', mobUrl: ''},
{ id: 'spotv', name: 'SPOTV', webUrl: 'https://www.spotvnow.co.kr/login', mobUrl: ''},
{ id: 'spotvNow', name: 'SPOTV NOW', webUrl: 'https://www.spotvnow.co.kr/login', mobUrl: ''},
{ id: 'tvnSports', name: 'TVN SPORTS', webUrl: 'https://tvnsports.cjenm.com/ko/', mobUrl: ''},
{ id: 'enaSports', name: 'ENA SPORTS', webUrl: 'https://enasports.co.kr/', mobUrl: ''},
];


/*
export interface team {
  id: string;
  name: string,
  webUrl: string;
  mobUrl: string;
  logoUrl: string;
}*/

/*
export const TEAMS: team[] = [
{ id: 'kbs1', name: 'KBS1', webUrl: 'https://onair.kbs.co.kr', mobUrl: ''},
{ id: 'kbs2', name: 'KBS2', webUrl: 'https://onair.kbs.co.kr', mobUrl: ''},
{ id: 'kbsSports', name: 'KBS N SPORTS', webUrl: 'https://www.kbsn.co.kr/nsports/', mobUrl: ''},
{ id: 'mbc', name: 'MBC', webUrl: 'https://www.imbc.com', mobUrl: ''},*/


