-- =============================================================
-- Lista de Presentes - Schema v2 (com autenticação)
-- RESET COMPLETO: apaga tudo e recria do zero.
-- Rode esse SQL inteiro no SQL Editor do Supabase.
-- =============================================================

-- Remover objetos existentes
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.presentes;
drop table if exists public.pessoas;

-- Tabela de pessoas
create table public.pessoas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  emoji         text default '🎁',
  user_id       uuid not null references auth.users(id) unique,
  amigo_secreto boolean not null default false,
  created_at    timestamptz not null default now()
);

create index idx_pessoas_user_id on public.pessoas(user_id);

-- Tabela de presentes
create table public.presentes (
  id           uuid primary key default gen_random_uuid(),
  pessoa_id    uuid not null references public.pessoas(id) on delete cascade,
  nome         text not null,
  valor        numeric(10, 2),
  link         text,
  observacao   text,
  comprado     boolean not null default false,
  comprado_por text,
  arquivado    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index idx_presentes_pessoa on public.presentes(pessoa_id);

-- RLS
alter table public.pessoas   enable row level security;
alter table public.presentes enable row level security;

-- Policies de pessoas
create policy "pessoas_select" on public.pessoas
  for select to authenticated using (true);

create policy "pessoas_update" on public.pessoas
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "pessoas_delete" on public.pessoas
  for delete to authenticated
  using (user_id = auth.uid());

create policy "pessoas_insert" on public.pessoas
  for insert to authenticated
  with check (user_id = auth.uid());

-- Policies de presentes
create policy "presentes_select" on public.presentes
  for select to authenticated using (true);

create policy "presentes_insert" on public.presentes
  for insert to authenticated
  with check (
    exists (select 1 from public.pessoas p where p.id = pessoa_id and p.user_id = auth.uid())
  );

create policy "presentes_update" on public.presentes
  for update to authenticated
  using (true)
  with check (true);

create policy "presentes_delete" on public.presentes
  for delete to authenticated
  using (
    exists (select 1 from public.pessoas p where p.id = pessoa_id and p.user_id = auth.uid())
  );

-- Trigger: cria pessoa automaticamente quando um novo usuário faz login pela 1ª vez
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.pessoas (nome, emoji, user_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Usuário'),
    '🎁',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer
set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Migrations para banco já existente (v2 → v3)
-- Execute no SQL Editor do Supabase se NÃO quiser fazer reset.
-- =============================================================
-- alter table public.pessoas  add column if not exists amigo_secreto boolean not null default false;
-- alter table public.presentes add column if not exists arquivado    boolean not null default false;
--
-- Habilitar Realtime nas tabelas (necessário para sync ao vivo):
-- alter publication supabase_realtime add table public.presentes;
-- alter publication supabase_realtime add table public.pessoas;
