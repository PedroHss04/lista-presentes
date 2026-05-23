# 🎁 Lista de Presentes

MVP de uma lista de presentes compartilhada pela família. Cada pessoa cadastra os presentes que quer ganhar (nome, valor, link de compra e observação) e todos podem ver as listas dos outros e marcar quem vai dar cada presente.

Stack: **React + Vite + Tailwind + Supabase**.

---

## 🚀 Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar o projeto no Supabase

1. Vá em [supabase.com](https://supabase.com), crie uma conta e um novo projeto (escolha região mais próxima — São Paulo se possível).
2. Espere o projeto provisionar (~1 minuto).
3. No menu lateral, vá em **SQL Editor → New query**.
4. Cole todo o conteúdo do arquivo [`supabase-schema.sql`](./supabase-schema.sql) e clique em **Run**. Isso cria as tabelas `pessoas` e `presentes` e libera o acesso anônimo.

### 3. Pegar as credenciais

No painel do Supabase: **Project Settings → API**. Copie:

- **Project URL** → vai em `VITE_SUPABASE_URL`
- **anon public** key → vai em `VITE_SUPABASE_ANON_KEY`

### 4. Configurar o `.env`

Copie o arquivo exemplo e edite:

```bash
cp .env.example .env
```

Cole as credenciais que você copiou do Supabase.

### 5. Rodar

```bash
npm run dev
```

Abra http://localhost:5173.

---

## ☁️ Deploy na Vercel

1. Suba esse projeto no GitHub (privado se quiser).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. A Vercel detecta o Vite automaticamente. Não precisa mexer nas configurações de build.
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy**. Pronto — o site sobe em uma URL `*.vercel.app` que você pode compartilhar com a família.

> **Dica:** se mudar variáveis de ambiente depois do deploy, vá em **Deployments → ... → Redeploy** pra aplicar.

---

## 🎯 Funcionalidades do MVP

- Adicionar pessoas da família (com emoji)
- Cada pessoa tem sua lista de presentes
- Cada presente tem nome, valor, link e observação
- Marcar presente como comprado (e registrar quem comprou)
- Total estimado da lista de cada pessoa
- Tudo persiste no Supabase, todos veem em tempo real (basta recarregar)

## 🔒 Sobre segurança

Esse MVP não tem autenticação — qualquer pessoa com o link consegue editar tudo. Isso é ok pra **uso familiar fechado** (não divulgue a URL publicamente). Quando quiser, dá pra adicionar Supabase Auth (login com email/senha ou Google) e ajustar as RLS policies.

## 🛠️ Próximos passos sugeridos

- Adicionar login (Supabase Auth)
- Esconder "quem comprou" do dono da lista (modo amigo secreto)
- Realtime (Supabase channels) pra atualizações ao vivo sem F5
- Upload de imagem do presente
- Categorias / aniversário vs. Natal

---

## 📁 Estrutura

```
lista-presentes/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── PessoaSidebar.jsx
│   │   ├── PresenteCard.jsx
│   │   └── PresenteForm.jsx
│   ├── lib/
│   │   ├── format.js
│   │   └── supabase.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase-schema.sql
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```
