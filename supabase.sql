-- The May — Supabase schema, RLS, and storage policies.
-- Paste this into Supabase SQL editor and run.

-- ============================================================
-- 1. Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_url text,
  text_content text,
  eaten_at timestamptz not null default now(),
  on_path boolean not null,
  note text,
  why_eat text[] not null default '{}',
  feeling smallint check (feeling between 0 and 4),
  ate_with text[] not null default '{}',
  how_was_it text check (how_was_it in ('Forgettable','Good')),
  where_eat text[] not null default '{}',
  how_made text check (how_made in ('Homemade','Restaurant','Fast Food','Bakery','Prepack','Raw')),
  made_me_feel text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists meals_user_eaten_at_idx
  on public.meals (user_id, eaten_at desc);

-- ============================================================
-- 2. Auto-create a profile row when a new auth user signs up
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
-- 3. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.meals enable row level security;

-- profiles: users see/modify only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- meals: users see/modify only their own
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
-- 4. Storage bucket for meal photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

-- Object path convention: <user_id>/<filename>
drop policy if exists "meal_photos_read_own" on storage.objects;
create policy "meal_photos_read_own" on storage.objects
  for select using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal_photos_upload_own" on storage.objects;
create policy "meal_photos_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal_photos_update_own" on storage.objects;
create policy "meal_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "meal_photos_delete_own" on storage.objects;
create policy "meal_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'meal-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 5. Realtime
-- ============================================================
alter publication supabase_realtime add table public.meals;

-- If you ran an earlier version of this file, add the new column without re-running everything:
alter table public.meals add column if not exists text_content text;
