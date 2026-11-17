create extension if not exists pgcrypto;

create type public.question_difficulty as enum ('easy', 'medium', 'hard');
create type public.question_type as enum ('multiple_choice', 'predict_output', 'identify_error', 'conceptual', 'code_based');
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired');

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  email text not null,
  group_id uuid not null references public.groups(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index students_email_unique on public.students (lower(email));
create index students_group_id_idx on public.students (group_id);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  passing_marks numeric(8,2) check (passing_marks is null or passing_marks >= 0),
  is_published boolean not null default false,
  allow_retake boolean not null default false,
  show_answers_after_submission boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_until is null or available_from is null or available_until > available_from)
);

create index quizzes_publication_window_idx on public.quizzes (is_published, available_from, available_until);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete restrict,
  question_text text not null unique,
  code_snippet text,
  difficulty public.question_difficulty not null default 'medium',
  question_type public.question_type not null default 'multiple_choice',
  marks numeric(8,2) not null default 1 check (marks > 0),
  explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_topic_difficulty_idx on public.questions (topic_id, difficulty);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  display_order integer not null check (display_order > 0),
  unique (question_id, display_order)
);

create unique index one_correct_option_per_question
  on public.question_options (question_id) where is_correct;

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  display_order integer not null check (display_order > 0),
  marks numeric(8,2) not null check (marks > 0),
  unique (quiz_id, question_id),
  unique (quiz_id, display_order)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  quiz_id uuid not null references public.quizzes(id) on delete restrict,
  score numeric(8,2),
  total_marks numeric(8,2) not null check (total_marks >= 0),
  percentage numeric(5,2),
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, quiz_id, id)
);

create index quiz_attempts_student_quiz_idx on public.quiz_attempts (student_id, quiz_id);

create table public.student_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_option_id uuid references public.question_options(id) on delete restrict,
  is_correct boolean,
  marks_obtained numeric(8,2),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.attempt_question_snapshots (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_text text not null,
  code_snippet text,
  options jsonb not null,
  correct_option_id uuid,
  marks numeric(8,2) not null check (marks > 0),
  unique (attempt_id, question_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
for each row execute function public.set_updated_at();

alter table public.admin_profiles enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.quizzes enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.student_answers enable row level security;
alter table public.attempt_question_snapshots enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where id = (select auth.uid()));
$$;

create policy "admins manage admin profiles" on public.admin_profiles for all to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "admins manage groups" on public.groups for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage students" on public.students for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage quizzes" on public.quizzes for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage topics" on public.topics for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage questions" on public.questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage question options" on public.question_options for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage quiz questions" on public.quiz_questions for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage attempts" on public.quiz_attempts for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage answers" on public.student_answers for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "admins manage snapshots" on public.attempt_question_snapshots for all to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into public.topics (name, description) values
  ('Introduction to Java', 'Java fundamentals, syntax, bytecode, and platform independence.'),
  ('JDK, JRE, and JVM', 'The Java development and runtime environment.'),
  ('Variables and Data Types', 'Primitive types, declarations, literals, and constants.'),
  ('Type Casting', 'Widening and narrowing conversions.'),
  ('Scanner Class', 'Reading input with java.util.Scanner.'),
  ('Format Specifiers and Escape Sequences', 'Formatted output and escaped characters.')
on conflict (name) do nothing;

insert into public.groups (name) values
  ('n2'), ('n3'), ('n4'), ('n5')
on conflict (name) do nothing;
