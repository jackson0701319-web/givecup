-- Supabase 대시보드 → SQL Editor → New query → 전체 붙여넣기 → Run

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  flag_emoji text not null,
  country_code text not null unique,
  total_amount bigint not null default 0,
  donor_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists countries_total_amount_idx
  on public.countries (total_amount desc);

alter table public.countries enable row level security;

create policy "누구나 국가 순위 읽기"
  on public.countries
  for select
  using (true);

-- 실시간(Realtime) 사용: Table Editor에서 countries → Realtime 켜기
-- 또는 Database → Replication 에서 countries 추가

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique default gen_random_uuid(),
  country_code text not null,
  amount bigint not null,
  donor_name text not null default '익명의 기부자',
  created_at timestamptz not null default now()
);

create index if not exists donations_country_code_idx
  on public.donations (country_code);

create index if not exists donations_created_at_idx
  on public.donations (created_at desc);

alter table public.donations enable row level security;

drop policy if exists "누구나 기부 내역 읽기" on public.donations;

create policy "누구나 기부 내역 읽기"
  on public.donations
  for select
  using (true);

notify pgrst, 'reload schema';

insert into public.countries (name, flag_emoji, country_code, total_amount, donor_count)
values
  ('대한민국', '🇰🇷', 'KR', 0, 0),
  ('일본', '🇯🇵', 'JP', 0, 0),
  ('미국', '🇺🇸', 'US', 0, 0),
  ('독일', '🇩🇪', 'DE', 0, 0),
  ('영국', '🇬🇧', 'GB', 0, 0),
  ('프랑스', '🇫🇷', 'FR', 0, 0),
  ('캐나다', '🇨🇦', 'CA', 0, 0),
  ('호주', '🇦🇺', 'AU', 0, 0),
  ('네덜란드', '🇳🇱', 'NL', 0, 0),
  ('스웨덴', '🇸🇪', 'SE', 0, 0)
on conflict (country_code) do nothing;
