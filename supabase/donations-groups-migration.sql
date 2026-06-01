-- 국가 + 집단 기부 지원 (donations 테이블이 이미 있을 때 1회 실행)
-- 오류: "donations.country_code 가 NOT NULL" → 아래 SQL 실행

-- country_code 를 nullable 로 (집단 기부 시 country_code 없이 저장)
alter table public.donations
  alter column country_code drop not null;
-- group_id 컬럼 추가
alter table public.donations
  add column if not exists group_id uuid references public.groups (id);

create index if not exists donations_group_id_idx
  on public.donations (group_id);

-- 둘 중 하나는 반드시 있어야 함 (선택)
-- alter table public.donations
--   add constraint donations_target_check
--   check (
--     (country_code is not null and group_id is null)
--     or (country_code is null and group_id is not null)
--   );

notify pgrst, 'reload schema';
