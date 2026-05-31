-- The May — mirror the auth email onto profiles + record sign-in device history.
-- NOTE: passwords are intentionally NOT stored here. Supabase Auth already keeps
-- them securely hashed in auth.users; storing plaintext would be a security risk
-- with no legitimate use.

-- 1. Convenience mirror of the account email (canonical copy stays auth.users.email).
alter table public.profiles add column if not exists email text;

-- 2. One row per sign-in / sign-up, with the device it came from.
create table if not exists public.login_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  occurred_at  timestamptz not null default now(),
  event        text,          -- 'sign_in' | 'sign_up'
  platform     text,          -- 'ios' | 'android' | 'web'
  os_version   text,
  device_name  text,          -- e.g. user-set name, when available
  model_name   text,          -- e.g. 'Redmi Note 12'
  app_version  text,
  user_agent   text           -- web only
);

create index if not exists login_events_user_idx
  on public.login_events (user_id, occurred_at desc);

alter table public.login_events enable row level security;

drop policy if exists "login_events_select_own" on public.login_events;
create policy "login_events_select_own" on public.login_events
  for select using (auth.uid() = user_id);

drop policy if exists "login_events_insert_own" on public.login_events;
create policy "login_events_insert_own" on public.login_events
  for insert with check (auth.uid() = user_id);
