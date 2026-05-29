-- Ejecuta esto en el SQL Editor de tu proyecto Supabase

create table if not exists collected_cards (
  dex_number integer primary key check (dex_number > 0),
  created_at timestamptz not null default now()
);

alter table collected_cards enable row level security;

create policy "Lectura pública"
  on collected_cards for select
  to anon, authenticated
  using (true);

create policy "Insertar cartas"
  on collected_cards for insert
  to anon, authenticated
  with check (true);

create policy "Eliminar cartas"
  on collected_cards for delete
  to anon, authenticated
  using (true);

create policy "Actualizar cartas"
  on collected_cards for update
  to anon, authenticated
  using (true)
  with check (true);
