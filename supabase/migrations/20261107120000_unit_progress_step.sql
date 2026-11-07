-- 単元の途中から再開できるよう、最後に到達したステップ番号を持つ
alter table public.unit_progress add column step integer not null default 0;
