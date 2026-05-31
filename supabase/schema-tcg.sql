-- Ejecuta esto en el SQL Editor de Supabase (módulo cartas TCG)

create table if not exists collected_tcg_cards (
  card_id text primary key,
  set_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists collected_tcg_cards_set_id_idx on collected_tcg_cards (set_id);

alter table collected_tcg_cards enable row level security;

create policy "TCG lectura pública"
  on collected_tcg_cards for select
  to anon, authenticated
  using (true);

create policy "TCG insertar"
  on collected_tcg_cards for insert
  to anon, authenticated
  with check (true);

create policy "TCG eliminar"
  on collected_tcg_cards for delete
  to anon, authenticated
  using (true);

create policy "TCG actualizar"
  on collected_tcg_cards for update
  to anon, authenticated
  using (true)
  with check (true);
