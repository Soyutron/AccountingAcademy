-- 学習者の進捗と回答。学習者は auth.users をそのまま使う(匿名ユーザーも本登録ユーザーも同じ ID)

create table public.unit_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  unit_id    text not null,
  status     text not null check (status in ('started', 'completed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);

create table public.attempts (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  unit_id          text not null,
  exercise_id      text not null,
  correct          boolean not null,
  misconception_id text,
  answer           jsonb not null,
  content_version  text not null,
  created_at       timestamptz not null default now()
);

create index attempts_user_created_idx on public.attempts (user_id, created_at desc);

alter table public.unit_progress enable row level security;
alter table public.attempts enable row level security;

-- 本人の行だけ読める。回答は追記のみ、進捗は本人が更新できる
create policy "own progress select" on public.unit_progress for select to authenticated using (user_id = (select auth.uid()));
create policy "own progress insert" on public.unit_progress for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own progress update" on public.unit_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own attempts select" on public.attempts for select to authenticated using (user_id = (select auth.uid()));
create policy "own attempts insert" on public.attempts for insert to authenticated with check (user_id = (select auth.uid()));
