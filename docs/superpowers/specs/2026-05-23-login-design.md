# Login (Google OAuth) — Design Spec

**Date:** 2026-05-23
**Status:** Approved

---

## Overview

Adicionar autenticação via Google ao app Lista de Presentes. O app inteiro fica protegido — nenhum acesso sem login. Cada usuário que entra pela primeira vez tem sua `pessoa` criada automaticamente via database trigger. Cada usuário só edita a própria lista de presentes; todos os usuários autenticados podem ver todas as listas e marcar presentes como comprados.

O banco é resetado antes de aplicar o novo schema.

---

## Camada de dados

### Schema

`pessoas` ganha coluna `user_id`:

```sql
alter table public.pessoas
  add column user_id uuid references auth.users(id) unique;
```

Índice:

```sql
create index if not exists idx_pessoas_user_id on public.pessoas(user_id);
```

### Trigger — auto-criar pessoa no primeiro login

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.pessoas (nome, emoji, user_id)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    '🎁',
    new.id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

O `coalesce` garante que o nome caia para o e-mail se o Google não retornar `full_name`.

### RLS policies

Todas as policies anônimas são removidas. Novas policies para usuários autenticados:

**pessoas:**
- SELECT: `auth.role() = 'authenticated'`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`
- INSERT: bloqueado no cliente (só o trigger insere)

**presentes:**
- SELECT: `auth.role() = 'authenticated'`
- INSERT: `pessoa_id in (select id from public.pessoas where user_id = auth.uid())`
- UPDATE: mesma condição
- DELETE: mesma condição

---

## Fluxo de autenticação

### Inicialização

`App.jsx` verifica a sessão ao montar:

```js
const [session, setSession] = useState(null)
const [loadingAuth, setLoadingAuth] = useState(true)

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setSession(data.session)
    setLoadingAuth(false)
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
    setSession(s)
  })
  return () => subscription.unsubscribe()
}, [])

if (loadingAuth) return <TelaCarregando />
if (!session) return <TelaLogin />
```

### TelaLogin

Tela centralizada com:
- Ícone 🎁 e título "Lista de Presentes"
- Subtítulo "Faça login pra ver a lista da família"
- Botão "Entrar com Google" → `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`

O Supabase redireciona de volta ao app com a sessão ativa. O trigger já criou a `pessoa` nesse momento.

### Logout

Botão no header chama `supabase.auth.signOut()`. O `onAuthStateChange` seta `session = null` e a `TelaLogin` é exibida.

---

## Mudanças nos componentes

### App.jsx

- Remove `nomeViewer` / `localStorage` inteiramente
- Passa `session.user.id` como `userId` para os componentes relevantes
- Passa `session.user.user_metadata.full_name` como `nomeViewer` (somente leitura, não editável)
- Header exibe foto do Google (`session.user.user_metadata.avatar_url`) e nome do usuário + botão de logout

### PessoaSidebar

- Remove botão "+ Adicionar pessoa" — pessoas só são criadas via trigger
- Sem outras mudanças

### PresenteCard

- Recebe prop `isOwner: boolean`
- Botão "remover" só renderiza se `isOwner = true`
- `toggleComprado`: usa `nomeViewer` (vindo da sessão) diretamente, sem `window.prompt`

### PresenteForm

- Só renderiza se `isOwner = true`
- Sem outras mudanças

### App.jsx — cálculo de isOwner

```js
const isOwner = pessoaSelecionada?.user_id === session.user.id
```

---

## Configuração do Supabase

No painel do Supabase → Authentication → Providers → Google:
- Ativar Google
- Adicionar Client ID e Client Secret do Google Cloud Console
- Adicionar URL do app em "Redirect URLs" (localhost + produção)

No Google Cloud Console:
- Criar OAuth 2.0 Client ID (tipo: Web application)
- Authorized redirect URIs: `https://<projeto>.supabase.co/auth/v1/callback`

---

## Migração / Reset

O banco é resetado antes do deploy:
1. Deletar todas as linhas de `presentes` e `pessoas`
2. Aplicar `alter table` com a nova coluna `user_id`
3. Aplicar novas RLS policies
4. Criar a function e trigger

Alternativa mais limpa: drop e recreate completo via novo `supabase-schema.sql`.

---

## O que não muda

- Estrutura de `presentes` (colunas, índice)
- Layout geral do app (sidebar + grid de cards)
- Lógica de total estimado
- Lógica de ordenação (não comprados primeiro)
