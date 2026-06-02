-- 토스페이먼츠 결제 주문 (결제 승인 전 pending → paid)
-- Supabase SQL Editor에서 실행
--
-- groups.id 가 bigint 인 DB용 (uuid 이면 payment_orders-uuid.sql 사용)

drop table if exists public.payment_orders;

create table public.payment_orders (
  order_id text primary key,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount_krw integer not null check (amount_krw >= 100),
  donation_amount_usd numeric not null check (donation_amount_usd > 0),
  tip_amount_usd numeric not null default 0 check (tip_amount_usd >= 0),
  donor_name text not null,
  country_code text,
  group_id bigint references public.groups (id),
  order_name text not null,
  target_label text not null,
  payment_key text,
  receipt_id uuid,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists payment_orders_status_idx
  on public.payment_orders (status);

create index if not exists payment_orders_created_at_idx
  on public.payment_orders (created_at desc);

alter table public.payment_orders enable row level security;

notify pgrst, 'reload schema';
