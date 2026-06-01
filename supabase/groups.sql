-- 참고용: groups 테이블이 아직 없다면 (이미 만들었다면 생략)

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  category text not null default 'community',
  total_amount bigint not null default 0,
  donor_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists groups_total_amount_idx
  on public.groups (total_amount desc);

alter table public.groups enable row level security;

-- RLS 예시 (읽기 공개 + 앱 API는 service_role로 INSERT)
-- drop policy if exists "누구나 집단 순위 읽기" on public.groups;
-- create policy "누구나 집단 순위 읽기"
--   on public.groups for select using (true);

-- 실시간 집단 랭킹: Table Editor → groups → Realtime 켜기
