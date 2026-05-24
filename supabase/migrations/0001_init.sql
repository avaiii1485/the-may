-- The May — Option A schema (core tables).
-- Run order: 0001_init.sql, then 0002_questions_catalog.sql.
-- Design notes:
--   * Product option strings (how_made, how_was_it, why_eat[], ...) are NOT
--     constrained in SQL — the canonical vocabulary lives in the app so options
--     can be added/renamed without a migration. Only genuinely-closed sets
--     (feeling 0..4, lang) carry CHECKs.
--   * meals.user_id references public.profiles(id), NOT auth.users — this keeps
--     the data model independent of Supabase's auth schema so it ports elsewhere.
--   * answers/metadata jsonb are forward-compat escape hatches (dynamic questions
--     + experimental fields) so new data needs no ALTER TABLE.
--   * Soft delete (deleted_at) + updated_at support undo and offline sync.

create extension if not exists "pgcrypto";  -- gen_random_uuid()
create extension if not exists "citext";    -- case-insensitive handle

-- ============================================================
-- shared: keep updated_at fresh on every UPDATE
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. profiles — one row per user (identity, display, synced prefs)
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  preferred_name text,
  handle         citext unique,
  avatar_url     text,
  bio            text,
  phone_number   text,
  goal           text,
  lang           text not null default 'en' check (lang in ('en','fa')),
  prefs          jsonb not null default '{}'::jsonb,  -- pinned_insights[], seen_badges[], reminders, units, ...
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. meals — one row per logged meal
-- ============================================================
create table if not exists public.meals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  eaten_at      timestamptz not null default now(),
  on_path       boolean not null,
  note          text,
  photo_url     text,
  text_content  text,
  why_eat       text[] not null default '{}',
  feeling       smallint check (feeling between 0 and 4),
  ate_with      text[] not null default '{}',
  how_was_it    text,                 -- no CHECK: vocabulary owned by the app
  where_eat     text[] not null default '{}',
  how_made      text,                 -- no CHECK: vocabulary owned by the app
  made_me_feel  text[] not null default '{}',
  answers       jsonb not null default '{}'::jsonb,  -- dynamic-question answers (Option A)
  metadata      jsonb not null default '{}'::jsonb,  -- experimental fields before promotion
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz                          -- soft delete
);

-- Primary read pattern: a user's timeline, newest first, excluding deleted.
create index if not exists meals_user_eaten_at_idx
  on public.meals (user_id, eaten_at desc)
  where deleted_at is null;

drop trigger if exists meals_set_updated_at on public.meals;
create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

-- ============================================================
-- 3. Auto-create a profile row when a new auth user signs up
--    (Supabase-specific. Off Supabase, your signup endpoint inserts instead.)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Row Level Security
--    (auth.uid() is Supabase-specific. Off Supabase, drop these policies and
--     enforce `where user_id = <verified session id>` in the service layer.)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.meals    enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id);

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own" on public.meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 5. Storage buckets (private) — meal photos + avatars
--    Path convention: <user_id>/<filename>
-- ============================================================
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false), ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists "storage_read_own" on storage.objects;
create policy "storage_read_own" on storage.objects
  for select using (
    bucket_id in ('meal-photos','avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "storage_insert_own" on storage.objects;
create policy "storage_insert_own" on storage.objects
  for insert with check (
    bucket_id in ('meal-photos','avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "storage_update_own" on storage.objects;
create policy "storage_update_own" on storage.objects
  for update using (
    bucket_id in ('meal-photos','avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "storage_delete_own" on storage.objects;
create policy "storage_delete_own" on storage.objects
  for delete using (
    bucket_id in ('meal-photos','avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 6. Realtime (optional — client does not subscribe yet)
-- ============================================================
alter publication supabase_realtime add table public.meals;
