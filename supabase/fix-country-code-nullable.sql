-- ============================================================
-- 집단 기부 오류 해결: donations.country_code → NULL 허용
-- Supabase 대시보드 → SQL Editor → 붙여넣기 → Run
-- ============================================================

-- 1) country_code NOT NULL 제거 (집단 기부 시 country_code 없이 INSERT 가능)
alter table public.donations
  alter column country_code drop not null;

-- 2) group_id 컬럼이 없다면 추가
alter table public.donations
  add column if not exists group_id uuid references public.groups (id);

create index if not exists donations_group_id_idx
  on public.donations (group_id);

-- 3) API 스키마 캐시 갱신
notify pgrst, 'reload schema';

-- 확인 (is_nullable 이 YES 여야 함)
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'donations'
  and column_name in ('country_code', 'group_id');
