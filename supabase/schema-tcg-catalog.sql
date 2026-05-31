-- Catálogo de expansiones permitidas (módulo Admin → Cartas TCG)

create table if not exists tcg_catalog_sets (
  set_id text primary key,
  name text not null,
  series text not null default '',
  release_date text not null default '',
  total integer not null default 0,
  logo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tcg_catalog_sets enable row level security;

create policy "Catálogo TCG lectura"
  on tcg_catalog_sets for select
  to anon, authenticated
  using (true);

create policy "Catálogo TCG insertar"
  on tcg_catalog_sets for insert
  to anon, authenticated
  with check (true);

create policy "Catálogo TCG eliminar"
  on tcg_catalog_sets for delete
  to anon, authenticated
  using (true);

create policy "Catálogo TCG actualizar"
  on tcg_catalog_sets for update
  to anon, authenticated
  using (true)
  with check (true);
