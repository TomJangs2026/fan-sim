-- 향후 Supabase 프로젝트에 적용할 초안 스키마입니다. 지금 단계(로컬 저장)에서는 실행하지 않습니다.

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null,
  provider text not null,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id text primary key,
  sport text not null check (sport in ('baseball', 'soccer')),
  name text not null,
  short_name text not null,
  logo_url text,
  color_hex text not null
);

create table if not exists players (
  id text primary key,
  team_id text references teams(id),
  name text not null,
  position text,
  photo_url text
);

create table if not exists games (
  id text primary key,
  sport text not null,
  date date not null,
  time text not null,
  status text not null check (status in ('scheduled', 'live', 'finished')),
  live_label text,
  highlight text,
  home_team_id text references teams(id),
  away_team_id text references teams(id),
  home_score int,
  away_score int,
  home_starter_id text references players(id),
  away_starter_id text references players(id),
  text_broadcast_url text,
  tv_broadcast_name text,
  tv_broadcast_url text
);

create table if not exists standings (
  team_id text references teams(id),
  rank int not null,
  wins int not null,
  draws int not null,
  losses int not null,
  recent_form text[] not null,
  primary key (team_id)
);

create table if not exists favorites (
  user_id uuid references profiles(id) on delete cascade,
  team_id text references teams(id),
  player_id text references players(id),
  primary key (user_id, team_id, player_id)
);

create table if not exists appearance_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  background_id text not null default 'default',
  font_id text not null default 'jua',
  font_size int not null default 15
);

alter table favorites enable row level security;
create policy "favorites_owner_only" on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
