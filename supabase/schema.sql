-- =====================================================================
-- DIONN — online furniture store. Full database schema for Supabase.
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: uses "if not exists" / "or replace" where possible.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  full_name        text,
  phone            text,
  role             text not null default 'customer' check (role in ('customer','manager','admin')),
  telegram_chat_id bigint,
  locale           text not null default 'ru',
  created_at       timestamptz not null default now()
);

-- Emails that automatically become admins on sign-up
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails(email) values ('umidumurzakov88@gmail.com') on conflict do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.phone,
    case when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email))
         then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: users who signed up before this script ran
insert into public.profiles (id, email, full_name, phone)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), u.phone
from auth.users u on conflict (id) do nothing;
update public.profiles p set role = 'admin'
where exists (select 1 from public.admin_emails a where lower(a.email) = lower(p.email));

-- Is the current user staff (admin or manager)?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','manager'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Users must not be able to promote themselves
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and not public.is_admin()
     and coalesce(auth.role(), '') <> 'service_role'
     and auth.uid() is not null then          -- SQL editor / server jobs have no auth.uid()
    new.role := old.role;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  parent_id  uuid references public.categories(id) on delete set null,
  name_ru    text not null,
  name_uz    text not null default '',
  name_en    text not null default '',
  image      text,
  sort       int not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  sku            text,
  category_id    uuid references public.categories(id) on delete set null,
  name_ru        text not null,
  name_uz        text not null default '',
  name_en        text not null default '',
  description_ru text not null default '',
  description_uz text not null default '',
  description_en text not null default '',
  price          numeric(14,2) not null default 0,       -- in UZS
  old_price      numeric(14,2),                          -- in UZS, for discounts
  images         text[] not null default '{}',
  specs          jsonb not null default '[]',            -- [{"ru":"Материал","uz":"Material","en":"Material","value":"Дуб"}]
  stock_status   text not null default 'in_stock' check (stock_status in ('in_stock','preorder','out_of_stock')),
  is_new         boolean not null default false,
  is_hit         boolean not null default false,
  is_active      boolean not null default true,
  installment    boolean not null default true,
  sort           int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);

create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  group_name text not null default 'color',   -- 'color' | 'size' | 'material' ...
  name_ru    text not null,
  name_uz    text not null default '',
  name_en    text not null default '',
  color_hex  text,
  price      numeric(14,2),                   -- overrides product price if set
  old_price  numeric(14,2),
  image      text,
  sku        text,
  stock      int not null default 0,
  sort       int not null default 0
);
create index if not exists variants_product_idx on public.product_variants(product_id);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  rating      int not null check (rating between 1 and 5),
  text        text not null default '',
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.banners (
  id          uuid primary key default gen_random_uuid(),
  title_ru    text not null default '',
  title_uz    text not null default '',
  title_en    text not null default '',
  subtitle_ru text not null default '',
  subtitle_uz text not null default '',
  subtitle_en text not null default '',
  image       text not null,
  link        text,
  sort        int not null default 0,
  is_active   boolean not null default true
);

-- ---------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  number           bigint unique not null default nextval('public.order_number_seq'),
  user_id          uuid references auth.users(id) on delete set null,
  customer_name    text not null,
  phone            text not null,
  email            text,
  city             text,
  address          text,
  comment          text,
  delivery_method  text not null default 'delivery' check (delivery_method in ('delivery','pickup')),
  payment_method   text not null default 'cash' check (payment_method in ('cash','card','click','payme','uzum','installment')),
  payment_status   text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status           text not null default 'new' check (status in ('new','confirmed','delivering','delivered','cancelled')),
  subtotal         numeric(14,2) not null default 0,
  discount         numeric(14,2) not null default 0,
  total            numeric(14,2) not null default 0,
  promo_code       text,
  usd_rate         numeric(12,2),
  locale           text not null default 'ru',
  admin_note       text,
  telegram_chat_id bigint,
  tg_token         uuid not null default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_phone_idx on public.orders(phone);

create table if not exists public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  variant_id   uuid references public.product_variants(id) on delete set null,
  name         text not null,
  variant_name text,
  image        text,
  price        numeric(14,2) not null,
  qty          int not null check (qty > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  code       text primary key,
  type       text not null default 'percent' check (type in ('percent','fixed')),
  value      numeric(14,2) not null,
  min_total  numeric(14,2) not null default 0,
  max_uses   int,
  used_count int not null default 0,
  expires_at timestamptz,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.callback_requests (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  comment    text,
  product_id uuid references public.products(id) on delete set null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key   text primary key,
  value jsonb not null
);
insert into public.settings(key, value) values
  ('usd_rate', '12800'),
  ('contacts', '{"phone":"+998 88 404 00 44","phone_raw":"+998884040044","hours_ru":"Ежедневно 9:00–20:00","hours_uz":"Har kuni 9:00–20:00","hours_en":"Daily 9:00–20:00","address_ru":"г. Ташкент","address_uz":"Toshkent sh.","address_en":"Tashkent","telegram":"https://t.me/Dionn_furniture_bot","instagram":"","facebook":"","youtube":""}')
on conflict (key) do nothing;

-- updated_at helpers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.admin_emails         enable row level security;
alter table public.categories           enable row level security;
alter table public.products             enable row level security;
alter table public.product_variants     enable row level security;
alter table public.reviews              enable row level security;
alter table public.banners              enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.promo_codes          enable row level security;
alter table public.callback_requests    enable row level security;
alter table public.settings             enable row level security;

do $$
declare r record;
begin
  -- drop old policies so the script can be re-run
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles
create policy profiles_self_read   on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
create policy profiles_admin_all   on public.profiles for delete using (public.is_admin());

-- admin_emails: admins only
create policy admin_emails_admin on public.admin_emails for all using (public.is_admin()) with check (public.is_admin());

-- public catalog read; staff write
create policy categories_read  on public.categories for select using (is_active or public.is_staff());
create policy categories_write on public.categories for all using (public.is_staff()) with check (public.is_staff());
create policy products_read    on public.products for select using (is_active or public.is_staff());
create policy products_write   on public.products for all using (public.is_staff()) with check (public.is_staff());
create policy variants_read    on public.product_variants for select using (true);
create policy variants_write   on public.product_variants for all using (public.is_staff()) with check (public.is_staff());
create policy banners_read     on public.banners for select using (is_active or public.is_staff());
create policy banners_write    on public.banners for all using (public.is_staff()) with check (public.is_staff());
create policy settings_read    on public.settings for select using (true);
create policy settings_write   on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- reviews: anyone reads approved; signed-in users submit (unapproved); staff moderate
create policy reviews_read   on public.reviews for select using (is_approved or public.is_staff() or user_id = auth.uid());
create policy reviews_insert on public.reviews for insert with check (auth.uid() is not null and user_id = auth.uid() and is_approved = false);
create policy reviews_staff  on public.reviews for all using (public.is_staff()) with check (public.is_staff());

-- orders: created by the server (service role). Customers read their own; staff manage.
create policy orders_read  on public.orders for select using (user_id = auth.uid() or public.is_staff());
create policy orders_staff on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy orders_del   on public.orders for delete using (public.is_admin());
create policy order_items_read on public.order_items for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy history_read on public.order_status_history for select using (
  public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy history_staff on public.order_status_history for insert with check (public.is_staff());

create policy promo_staff     on public.promo_codes for all using (public.is_staff()) with check (public.is_staff());
create policy callbacks_staff on public.callback_requests for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- Storage bucket for product / banner images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists media_public_read on storage.objects;
drop policy if exists media_staff_write on storage.objects;
drop policy if exists media_staff_update on storage.objects;
drop policy if exists media_staff_delete on storage.objects;
create policy media_public_read  on storage.objects for select using (bucket_id = 'media');
create policy media_staff_write  on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
create policy media_staff_update on storage.objects for update using (bucket_id = 'media' and public.is_staff());
create policy media_staff_delete on storage.objects for delete using (bucket_id = 'media' and public.is_staff());

-- ---------------------------------------------------------------------
-- Analytics helper for the admin dashboard (staff only)
-- ---------------------------------------------------------------------
create or replace function public.admin_revenue_by_day(days int default 30)
returns table(day date, revenue numeric, orders bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return query
    select d::date as day,
           coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as revenue,
           count(o.id) filter (where o.status <> 'cancelled') as orders
    from generate_series((now() at time zone 'Asia/Tashkent')::date - (days - 1),
                         (now() at time zone 'Asia/Tashkent')::date, interval '1 day') d
    left join public.orders o on (o.created_at at time zone 'Asia/Tashkent')::date = d::date
    group by d order by d;
end $$;

create or replace function public.admin_top_products(lim int default 5)
returns table(product_id uuid, name text, qty bigint, revenue numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return query
    select i.product_id, max(i.name), sum(i.qty)::bigint, sum(i.qty * i.price)
    from public.order_items i join public.orders o on o.id = i.order_id
    where o.status <> 'cancelled'
    group by i.product_id order by 4 desc limit lim;
end $$;

-- Customers with their order stats (staff only)
create or replace function public.admin_customers(search text default '', lim int default 50, off int default 0)
returns table(id uuid, email text, full_name text, phone text, role text, created_at timestamptz,
              orders_count bigint, total_spent numeric, last_order timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  return query
    select p.id, p.email, p.full_name, p.phone, p.role, p.created_at,
           count(o.id) as orders_count,
           coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0) as total_spent,
           max(o.created_at) as last_order
    from public.profiles p
    left join public.orders o on o.user_id = p.id
    where search = '' or p.email ilike '%'||search||'%' or p.full_name ilike '%'||search||'%' or p.phone ilike '%'||search||'%'
    group by p.id
    order by p.created_at desc
    limit lim offset off;
end $$;

-- Headline numbers for the dashboard (Tashkent time). Cancelled orders are excluded from revenue.
create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Tashkent')::date;
  r json;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select json_build_object(
    'revenue_today',  coalesce(sum(total) filter (where status <> 'cancelled' and (created_at at time zone 'Asia/Tashkent')::date = today), 0),
    'revenue_week',   coalesce(sum(total) filter (where status <> 'cancelled' and (created_at at time zone 'Asia/Tashkent')::date > today - 7), 0),
    'revenue_month',  coalesce(sum(total) filter (where status <> 'cancelled' and date_trunc('month', created_at at time zone 'Asia/Tashkent') = date_trunc('month', today::timestamp)), 0),
    'revenue_total',  coalesce(sum(total) filter (where status <> 'cancelled'), 0),
    'revenue_delivered', coalesce(sum(total) filter (where status = 'delivered'), 0),
    'orders_today',   count(*) filter (where (created_at at time zone 'Asia/Tashkent')::date = today),
    'orders_month',   count(*) filter (where date_trunc('month', created_at at time zone 'Asia/Tashkent') = date_trunc('month', today::timestamp)),
    'orders_total',   count(*),
    'orders_new',     count(*) filter (where status = 'new'),
    'orders_cancelled', count(*) filter (where status = 'cancelled'),
    'avg_check',      coalesce(avg(total) filter (where status <> 'cancelled'), 0),
    'customers_total', (select count(*) from public.profiles where role = 'customer'),
    'customers_month', (select count(*) from public.profiles where role = 'customer' and created_at > now() - interval '30 days'),
    'callbacks_open', (select count(*) from public.callback_requests where not handled),
    'reviews_pending', (select count(*) from public.reviews where not is_approved)
  ) into r from public.orders;
  return r;
end $$;

-- Telegram login requests (server-only: RLS on, no policies → only the service role can access)
create table if not exists public.tg_logins (
  token       text primary key,
  code_hash   text,
  chat_id     bigint,
  tg_user     jsonb,
  attempts    int not null default 0,
  sent_at     timestamptz,
  used        boolean not null default false,
  locale      text not null default 'ru',
  expires_at  timestamptz not null default now() + interval '15 minutes',
  created_at  timestamptz not null default now()
);
alter table public.tg_logins enable row level security;
