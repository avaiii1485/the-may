-- The May — Option A question catalog (definitions only).
-- These tables define WHICH questions exist and their options; a user's ANSWERS
-- live on meals (core six as columns; future questions in meals.answers jsonb).
-- Seeding the current six lets the capture form become data-driven later without
-- changing how existing answers are stored — `value` matches the canonical
-- English string already persisted in meals (e.g. why_eat = '{Hungry}').

create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,                 -- e.g. 'why_eat' (maps to the meals column / answers key)
  type          text not null check (type in ('single','multi','scale')),
  prompt_en     text not null,
  prompt_fa     text not null,
  display_order int  not null default 0,
  active        boolean not null default true,
  is_core       boolean not null default false,       -- true = answers stored in a typed meals column, not answers jsonb
  created_at    timestamptz not null default now()
);

create table if not exists public.question_options (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions(id) on delete cascade,
  value         text not null,                        -- canonical key, stays English (matches meals storage)
  label_en      text not null,
  label_fa      text not null,
  display_order int  not null default 0,
  active        boolean not null default true,
  unique (question_id, value)
);

create index if not exists question_options_question_idx
  on public.question_options (question_id, display_order);

-- The catalog is global read-only reference data. Anyone authenticated may read;
-- writes are admin-only (service role bypasses RLS).
alter table public.questions        enable row level security;
alter table public.question_options enable row level security;

drop policy if exists "questions_read_all" on public.questions;
create policy "questions_read_all" on public.questions
  for select using (auth.role() = 'authenticated');

drop policy if exists "question_options_read_all" on public.question_options;
create policy "question_options_read_all" on public.question_options
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- Seed: the current six questions
-- ============================================================
insert into public.questions (key, type, prompt_en, prompt_fa, display_order, is_core) values
  ('why_eat',      'multi',  'Why did I eat?',            'چرا غذا خوردم؟',        1, true),
  ('feeling',      'scale',  'How are you feeling?',      'چه حسی داری؟',          2, true),
  ('ate_with',     'multi',  'Who did you eat with?',     'با کی غذا خوردی؟',      3, true),
  ('how_was_it',   'single', 'How was it?',               'چطور بود؟',             4, true),
  ('where_eat',    'multi',  'Where did you eat?',        'کجا غذا خوردی؟',        5, true),
  ('how_made',     'single', 'How was it made?',          'چطور تهیه شده بود؟',    6, true),
  ('made_me_feel', 'multi',  'How did it make you feel?', 'چه حسی بهت داد؟',       7, true)
on conflict (key) do nothing;

-- Options. value = canonical English (matches what meals already store).
insert into public.question_options (question_id, value, label_en, label_fa, display_order)
select q.id, v.value, v.label_en, v.label_fa, v.ord
from public.questions q
join (values
  -- why_eat
  ('why_eat','Hungry','Hungry','گرسنه بودم',1),
  ('why_eat','Social','Social','دورهمی بود',2),
  ('why_eat','It was time','It was time','وقتش بود',3),
  ('why_eat','Bored','Bored','حوصله‌ام سر رفته بود',4),
  ('why_eat','Stressed','Stressed','استرس داشتم',5),
  ('why_eat','Cravings','Cravings','هوس کرده بودم',6),
  ('why_eat','Tired','Tired','خسته بودم',7),
  ('why_eat','❤️ the taste','The taste','به‌خاطر مزه‌اش',8),
  ('why_eat','Why not?','Why not?','چرا که نه؟',9),
  ('why_eat','Other','Other','موردی دیگر',10),
  -- ate_with
  ('ate_with','Friends','Friends','دوستان',1),
  ('ate_with','Family','Family','خانواده',2),
  ('ate_with','Partner','Partner','پارتنر',3),
  ('ate_with','Colleagues','Colleagues','همکارها',4),
  ('ate_with','By myself','By myself','تنها',5),
  -- how_was_it
  ('how_was_it','Forgettable','Forgettable','معمولی بود',1),
  ('how_was_it','Good','Good','خوب بود',2),
  -- where_eat
  ('where_eat','Table','Table','سر میز',1),
  ('where_eat','TV','TV','جلوی تلویزیون',2),
  ('where_eat','Car','Car','توی ماشین',3),
  ('where_eat','Bed','Bed','توی رختخواب',4),
  ('where_eat','Work desk','Work desk','پشت میز کار',5),
  ('where_eat','Standing','Standing','ایستاده',6),
  ('where_eat','Couch','Couch','روی کاناپه',7),
  -- how_made
  ('how_made','Homemade','Homemade','خونگی',1),
  ('how_made','Restaurant','Restaurant','رستوران',2),
  ('how_made','Fast Food','Fast Food','فست‌فود',3),
  ('how_made','Bakery','Bakery','قنادی',4),
  ('how_made','Prepack','Prepack','حاضری',5),
  ('how_made','Raw','Raw','خام',6),
  -- made_me_feel
  ('made_me_feel','Satisfied','Satisfied','راضی',1),
  ('made_me_feel','Still hungry','Still hungry','سیر نشدم',2),
  ('made_me_feel','Stuffed','Stuffed','خیلی سنگین',3),
  ('made_me_feel','Happy','Happy','خوشحال',4),
  ('made_me_feel','Guilty','Guilty','عذاب وجدان',5),
  ('made_me_feel','Unsatisfied','Unsatisfied','ناراضی',6),
  ('made_me_feel','Sick','Sick','حالم بد شد',7)
) as v(qkey, value, label_en, label_fa, ord) on v.qkey = q.key
on conflict (question_id, value) do nothing;
