-- Supabase SQL Editor → New query → 붙여넣기 → Run
-- 모든 국가의 총 기부금·기부자 수를 0으로 초기화합니다.

update public.countries
set
  total_amount = 0,
  donor_count = 0,
  updated_at = now();

-- 확인
select
  count(*) as total_countries,
  sum(total_amount) as sum_amount,
  sum(donor_count) as sum_donors
from public.countries;
