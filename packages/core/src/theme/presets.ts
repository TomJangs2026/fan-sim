import { FontOption } from '../types';

export const FONT_OPTIONS: FontOption[] = [
  { id: 'gaegu', label: '개구체', fontFamily: 'Gaegu_400Regular' },
  { id: 'gamja', label: '감자꽃체', fontFamily: 'GamjaFlower_400Regular' },
  { id: 'jua', label: '주아체', fontFamily: 'Jua_400Regular' },
  { id: 'nanum-pen', label: '나눔손글씨', fontFamily: 'NanumPenScript_400Regular' },
];

export interface BackgroundOption {
  id: string;
  label: string;
  colors: [string, string];
}

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { id: 'default', label: '기본', colors: ['#FAFAFA', '#F1F1F1'] },
  { id: 'sky', label: '스카이', colors: ['#E3F1FF', '#C9E4FF'] },
  { id: 'field', label: '그라운드', colors: ['#E7FFE3', '#CDFFC5'] },
  { id: 'night', label: '나이트', colors: ['#26263A', '#161622'] },
];

export const DEFAULT_APPEARANCE = {
  backgroundId: 'default',
  fontId: 'jua',
  fontSize: 15,
};
