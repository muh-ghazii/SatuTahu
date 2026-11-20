-- SatuTahu: penyimpanan progres belajar per pengguna.
-- Jalankan sekali di Supabase Dashboard → SQL Editor (atau `supabase db push`).

create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  -- { "<slug-jalur>": ["<stageId>:<indexTopik>", ...], ... }
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint progress_data_size check (pg_column_size(data) < 100000)   -- batasi ±100 KB per pengguna
);

comment on table public.progress is 'Progres belajar SatuTahu (topik yang dicentang) per pengguna.';

-- updated_at otomatis
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

-- Row Level Security: setiap pengguna hanya dapat membaca & menulis barisnya sendiri.
-- WAJIB aktif — kunci publik Supabase memang terlihat di browser, keamanan bergantung pada RLS.
alter table public.progress enable row level security;

drop policy if exists "progress: baca milik sendiri" on public.progress;
create policy "progress: baca milik sendiri" on public.progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "progress: buat milik sendiri" on public.progress;
create policy "progress: buat milik sendiri" on public.progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress: ubah milik sendiri" on public.progress;
create policy "progress: ubah milik sendiri" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress: hapus milik sendiri" on public.progress;
create policy "progress: hapus milik sendiri" on public.progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Pengguna anonim tidak punya akses sama sekali.
revoke all on public.progress from anon;
grant select, insert, update, delete on public.progress to authenticated;
