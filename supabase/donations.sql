-- Supabase 대시보드 → SQL Editor → New query → 전체 붙여넣기 → Run
-- (결제 시 "Could not find the table public.donations" 오류 = 이 스크립트 미실행)

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null unique default gen_random_uuid(),
  country_code text,
  group_id uuid references public.groups (id),
  amount bigint not null,
  donor_name text not null default '익명의 기부자',
  created_at timestamptz not null default now()
);

create index if not exists donations_country_code_idx
  on public.donations (country_code);

create index if not exists donations_group_id_idx
  on public.donations (group_id);

create index if not exists donations_created_at_idx
  on public.donations (created_at desc);

alter table public.donations enable row level security;

drop policy if exists "누구나 기부 내역 읽기" on public.donations;

create policy "누구나 기부 내역 읽기"
  on public.donations
  for select
  using (true);

-- API는 service_role로 INSERT 하므로 별도 INSERT 정책 불필요 (RLS 우회)

-- 실시간 오픈 장부: Table Editor → donations → Realtime 켜기
-- (또는 Database → Publications → supabase_realtime 에 donations 추가)

-- PostgREST 스키마 캐시 갱신 (테이블 생성 직후 API가 테이블을 못 찾을 때)
notify pgrst, 'reload schema';