-- =====================================================================
-- Individual (custom) orders: a customer sends photos of furniture,
-- the workshop replies with a price, the customer accepts or declines.
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- =====================================================================

create sequence if not exists public.custom_order_number_seq start 1;

create table if not exists public.custom_orders (
  id               uuid primary key default gen_random_uuid(),
  number           bigint unique not null default nextval('public.custom_order_number_seq'),
  user_id          uuid references auth.users(id) on delete set null,
  name             text not null,
  phone            text not null,
  description      text not null,
  dimensions       text,
  images           text[] not null default '{}',
  status           text not null default 'new' check (status in ('new','quoted','accepted','declined')),
  price            numeric(14,2),
  lead_time        text,
  admin_comment    text,
  telegram_chat_id bigint,
  locale           text not null default 'ru',
  quoted_at        timestamptz,
  answered_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists custom_orders_user_idx on public.custom_orders(user_id);
create index if not exists custom_orders_created_idx on public.custom_orders(created_at desc);

drop trigger if exists custom_orders_touch on public.custom_orders;
create trigger custom_orders_touch before update on public.custom_orders
  for each row execute function public.touch_updated_at();

-- Rows are created / answered by the server (service role).
-- Customers read their own; staff manage everything.
alter table public.custom_orders enable row level security;
drop policy if exists custom_orders_read on public.custom_orders;
drop policy if exists custom_orders_staff on public.custom_orders;
create policy custom_orders_read  on public.custom_orders for select using (user_id = auth.uid() or public.is_staff());
create policy custom_orders_staff on public.custom_orders for all using (public.is_staff()) with check (public.is_staff());
