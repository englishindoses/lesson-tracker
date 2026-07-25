-- ============================================================================
-- Lesson Tracker -- database schema
--
-- Run this once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- It is safe to re-run: everything is "if not exists" / "drop policy if exists".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type pricing_mode as enum ('per_lesson', 'monthly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entry_kind as enum ('lesson', 'payment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type presence as enum (
    'present',
    'no_show',
    'cancellation',
    'late_cancellation',
    'teacher_cancellation',
    'reschedule'
  );
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
create table if not exists students (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  contact     text,
  lesson_type text,
  level       text,
  needs       text,
  notes       text,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists students_user_idx on students (user_id, archived, name);


-- ---------------------------------------------------------------------------
-- Classes
--
-- A class is the billing unit: it holds any number of students, and the price
-- belongs to the class, not to the individual students.
-- ---------------------------------------------------------------------------
create table if not exists classes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  name                 text not null,
  lesson_type          text,
  default_duration_min integer not null default 60,
  pricing_mode         pricing_mode not null default 'per_lesson',
  price_per_lesson     numeric(10, 2),
  monthly_price        numeric(10, 2),
  notes                text,
  archived             boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists classes_user_idx on classes (user_id, archived, name);


-- ---------------------------------------------------------------------------
-- Class roster (many students <-> many classes)
-- ---------------------------------------------------------------------------
create table if not exists class_students (
  class_id   uuid not null references classes (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  primary key (class_id, student_id)
);

create index if not exists class_students_student_idx on class_students (student_id);


-- ---------------------------------------------------------------------------
-- Entries -- the rows of the tracker table.
--
-- One table holds both row types so they can be sorted and filtered together:
--
--   kind = 'lesson'   uses entry_date, duration_min, presence, lesson_notes,
--                     extra_notes, not_charged, amount (optional override of
--                     the class price for this one lesson)
--
--   kind = 'payment'  uses due_date, amount, paid, paid_date, extra_notes
--                     For a monthly-package class this row IS the monthly
--                     invoice: it is the charge as well as the receipt.
-- ---------------------------------------------------------------------------
create table if not exists entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  class_id     uuid not null references classes (id) on delete cascade,
  kind         entry_kind not null,

  entry_date   date,          -- lesson date
  duration_min integer,       -- lesson length, defaults from the class
  presence     presence,
  not_charged  boolean not null default false,  -- the strike-through checkbox
  lesson_notes text,

  due_date     date,          -- payment: when it is owed
  amount       numeric(10, 2),
  paid         boolean not null default false,
  paid_date    date,

  extra_notes  text,
  sort_key     date generated always as (coalesce(entry_date, due_date)) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists entries_class_idx on entries (class_id, sort_key);
create index if not exists entries_user_idx on entries (user_id, sort_key);


-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array['students', 'classes', 'entries'] loop
    execute format('drop trigger if exists touch_%1$s on %1$s', t);
    execute format(
      'create trigger touch_%1$s before update on %1$s
       for each row execute function touch_updated_at()', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This is what actually protects the data. The anon key shipped in the browser
-- can only ever see rows whose user_id matches the logged-in account.
-- ---------------------------------------------------------------------------
alter table students       enable row level security;
alter table classes        enable row level security;
alter table class_students enable row level security;
alter table entries        enable row level security;

do $$
declare t text;
begin
  foreach t in array array['students', 'classes', 'class_students', 'entries'] loop
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id)', t);
  end loop;
end $$;
