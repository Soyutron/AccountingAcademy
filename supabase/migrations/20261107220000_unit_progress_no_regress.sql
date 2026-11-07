-- 進捗を後退させない(Issue #13)。開きっぱなしの古いタブや別の端末が、読込時の古い step / status で upsert しても、
-- 保存済みより step を下げず、completed を started に戻さない。書き込み経路がどこであれ DB 側で守る
create or replace function public.keep_unit_progress()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.step := greatest(new.step, old.step);
  if old.status = 'completed' then
    new.status := 'completed';
  end if;
  return new;
end;
$$;

create trigger keep_unit_progress
  before update on public.unit_progress
  for each row
  execute function public.keep_unit_progress();
