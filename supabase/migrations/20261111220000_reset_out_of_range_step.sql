-- ステップを減らした単元では保存済みの step が範囲外のまま残り、後退防止(Issue #13)のせいで upsert でも下げられない(Issue #197)。
-- 範囲外の行だけを 0 に戻す関数を用意し、その中でだけ後退防止を通す。範囲内の step と completed は従来どおり守る
create or replace function public.keep_unit_progress()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_setting('app.reset_out_of_range_step', true) is distinct from 'on' then
    new.step := greatest(new.step, old.step);
  end if;
  if old.status = 'completed' then
    new.status := 'completed';
  end if;
  return new;
end;
$$;

create or replace function public.reset_out_of_range_step(p_unit_id text, p_step_count integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform set_config('app.reset_out_of_range_step', 'on', true);
  update public.unit_progress
    set step = 0, updated_at = now()
    where user_id = (select auth.uid()) and unit_id = p_unit_id and step >= p_step_count;
  perform set_config('app.reset_out_of_range_step', 'off', true);
end;
$$;

revoke execute on function public.reset_out_of_range_step(text, integer) from public, anon;
grant execute on function public.reset_out_of_range_step(text, integer) to authenticated;
