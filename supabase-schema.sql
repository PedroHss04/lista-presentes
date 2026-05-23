-- =============================================================
-- Lista de Presentes - Schema do Supabase
-- Rode esse SQL inteiro no SQL Editor do Supabase (Database > SQL).
-- =============================================================

-- Tabela de pessoas (uma linha por familiar)
create table if not exists public.pessoas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  emoji       text default '🎁',
  created_at  timestamptz not null default now()
);

-- Tabela de presentes
create table if not exists public.presentes (
  id           uuid primary key default gen_random_uuid(),
  pessoa_id    uuid not null references public.pessoas(id) on delete cascade,
  nome         text not null,
  valor        numeric(10, 2),
  link         text,
  observacao   text,
  comprado     boolean not null default false,
  comprado_por text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_presentes_pessoa on public.presentes(pessoa_id);

-- =============================================================
-- Row Level Security
-- Como o MVP não tem login, liberamos leitura/escrita para o
-- papel "anon" (qualquer visitante do site). Pra uso familiar
-- em ambiente fechado isso está ok. Pra ambiente público,
-- adicione autenticação depois.
-- =============================================================
alter table public.pessoas   enable row level security;
alter table public.presentes enable row level security;

drop policy if exists "pessoas_all"   on public.pessoas;
drop policy if exists "presentes_all" on public.presentes;

create policy "pessoas_all"   on public.pessoas   for all to anon using (true) with check (true);
create policy "presentes_all" on public.presentes for all to anon using (true) with check (true);
