-- 匿名ユーザーの last_sign_in_at は最初のサインインから動かない(以後はトークンの refresh と回答の書き込みだけ)ので、
-- それを「最終活動」と見なすと毎日学習していても初回から 90 日で消える(Issue #133)。
-- 最終活動は public の進捗・回答の書き込み(unit_progress.updated_at / attempts.created_at)で判定する。docs/architecture.md 3.2
select cron.unschedule('delete-stale-anonymous-users');

select cron.schedule(
  'delete-stale-anonymous-users',
  '0 18 * * *',  -- 毎日 03:00 JST
  $$
    delete from auth.users u
    where u.is_anonymous
      and coalesce(u.last_sign_in_at, u.created_at) < now() - interval '90 days'
      and not exists (
        select 1 from public.unit_progress p
        where p.user_id = u.id and p.updated_at >= now() - interval '90 days'
      )
      and not exists (
        select 1 from public.attempts a
        where a.user_id = u.id and a.created_at >= now() - interval '90 days'
      )
  $$
);
