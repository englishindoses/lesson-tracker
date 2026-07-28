-- ============================================================================
-- Lesson Tracker -- backup straight from the database
--
-- Dashboard -> SQL Editor -> New query -> paste this -> Run.
-- One row, one column, holding the whole backup as JSON.
-- Click the cell, copy it, and save it as a .json file.
--
-- The shape is exactly what Settings -> Your data -> Restore expects
-- (version 1: students, classes, class_students, entries), so a file made
-- this way can be fed back into the app. Restore is add-only, and it
-- re-stamps user_id with whoever is signed in.
--
-- Set the email below to the account you want. The SQL Editor runs as
-- postgres and ignores row-level security, so nothing else scopes this.
-- ============================================================================

with me as (
  select id from auth.users where email = 'englishindoses@gmail.com'
)

select jsonb_pretty(jsonb_build_object(
  'version',     1,
  'exported_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),

  'students', coalesce((
    select jsonb_agg(to_jsonb(s) order by s.name)
    from (
      select id, user_id, name, contact, level, needs, notes, archived,
             created_at, updated_at
      from students
      where user_id = (select id from me)
    ) s
  ), '[]'::jsonb),

  'classes', coalesce((
    select jsonb_agg(to_jsonb(c) order by c.name)
    from (
      select id, user_id, name, lesson_type, default_duration_min, pricing_mode,
             price_per_lesson, monthly_price, notes, archived,
             created_at, updated_at
      from classes
      where user_id = (select id from me)
    ) c
  ), '[]'::jsonb),

  'class_students', coalesce((
    select jsonb_agg(to_jsonb(cs))
    from (
      select class_id, student_id, user_id
      from class_students
      where user_id = (select id from me)
    ) cs
  ), '[]'::jsonb),

  'entries', coalesce((
    select jsonb_agg(to_jsonb(e) order by e.entry_date, e.due_date)
    from (
      select id, user_id, class_id, kind, entry_date, duration_min, presence,
             not_charged, lesson_notes, due_date, amount, paid, paid_date,
             extra_notes, created_at, updated_at
      from entries
      where user_id = (select id from me)
    ) e
  ), '[]'::jsonb)
)) as backup;


-- ----------------------------------------------------------------------------
-- Counts, if you want to check the file against the database afterwards.
-- ----------------------------------------------------------------------------
-- with me as (select id from auth.users where email = 'englishindoses@gmail.com')
-- select 'students' as what, count(*) from students where user_id = (select id from me)
-- union all select 'classes',        count(*) from classes        where user_id = (select id from me)
-- union all select 'class_students', count(*) from class_students where user_id = (select id from me)
-- union all select 'entries',        count(*) from entries        where user_id = (select id from me);
