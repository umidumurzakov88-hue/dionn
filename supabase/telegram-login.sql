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
drop table if exists public.phone_otps;
