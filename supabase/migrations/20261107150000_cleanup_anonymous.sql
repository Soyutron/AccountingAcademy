-- 匿名ユーザーは最終活動から 90 日で削除する(docs/architecture.md 3.2)。本登録ユーザーは対象外
create extension if not exists pg_cron;

select cron.schedule(
  'delete-stale-anonymous-users',
  '0 18 * * *',  -- 毎日 03:00 JST
  $$
    delete from auth.users
    where is_anonymous
      and coalesce(last_sign_in_at, created_at) < now() - interval '90 days'
  $$
);
