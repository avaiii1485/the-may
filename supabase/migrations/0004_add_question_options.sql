-- Add new answer options to the question catalog:
--   how_was_it -> "Bad", where_eat -> "Outside".
-- value stays English (canonical, matches what meals store); labels localized.

insert into public.question_options (question_id, value, label_en, label_fa, display_order)
select q.id, v.value, v.label_en, v.label_fa, v.ord
from public.questions q
join (values
  ('how_was_it', 'Bad', 'Bad', 'بد بود', 3),
  ('where_eat', 'Outside', 'Outside', 'بیرون', 8)
) as v(qkey, value, label_en, label_fa, ord) on v.qkey = q.key
on conflict (question_id, value) do nothing;
