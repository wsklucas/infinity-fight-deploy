# 🥊 Infinity Fight — Plataforma de Ensino de Muay Thai

## Como colocar no ar (passo a passo)

---

## PASSO 1 — Criar o banco de dados (Supabase)

1. Acesse **supabase.com** e clique em "Start for free"
2. Crie uma conta com seu email ou GitHub
3. Clique em **"New project"**
4. Preencha:
   - Name: `infinity-fight`
   - Database Password: crie uma senha forte e **GUARDE ela**
   - Region: South America (São Paulo)
5. Clique em **"Create new project"** e aguarde ~2 minutos
6. Quando terminar, clique em **"Project Settings"** (ícone de engrenagem)
7. Clique em **"Database"**
8. Copie a **"Connection string" (URI)** — começa com `postgresql://...`
   - Substitua `[YOUR-PASSWORD]` pela senha que você criou
   - **GUARDE essa string — você vai precisar dela**

---

## PASSO 2 — Subir o código no GitHub

1. Abra o **VS Code**
2. Pressione `Ctrl + `` ` para abrir o terminal
3. Digite os comandos abaixo um por um:

```bash
cd Desktop
git init infinity-fight
cd infinity-fight
```

4. Copie todos os arquivos desta pasta para dentro de `Desktop/infinity-fight`
5. De volta no terminal:

```bash
git add .
git commit -m "primeiro commit"
```

6. Acesse **github.com**, clique em **"New repository"**
7. Nome: `infinity-fight`
8. Deixe como **Private** e clique em **"Create repository"**
9. Copie os 2 comandos que o GitHub mostrar (começam com `git remote add...`)
10. Cole e execute no terminal do VS Code

---

## PASSO 3 — Publicar o backend (Render)

1. Acesse **render.com** e crie conta com GitHub
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório `infinity-fight`
4. Preencha:
   - Name: `infinity-fight-api`
   - Root Directory: `apps/api`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && node dist/server.js`
5. Clique em **"Advanced"** → **"Add Environment Variable"** e adicione:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (a string do Supabase que você copiou) |
| `JWT_SECRET` | (qualquer texto longo, ex: `infinity-fight-secret-2025`) |
| `WEB_URL` | (deixe em branco por enquanto) |
| `PORT` | `3001` |

6. Clique em **"Create Web Service"**
7. Aguarde o deploy (~5 minutos)
8. Quando terminar, copie a URL — algo como `https://infinity-fight-api.onrender.com`

---

## PASSO 4 — Publicar o frontend (Vercel)

1. Acesse **vercel.com** e crie conta com GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `infinity-fight`
4. Preencha:
   - Framework Preset: **Next.js**
   - Root Directory: `apps/web`
5. Clique em **"Environment Variables"** e adicione:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | (a URL do Render, ex: `https://infinity-fight-api.onrender.com`) |

6. Clique em **"Deploy"**
7. Aguarde ~3 minutos
8. Pronto! Sua URL vai ser algo como `https://infinity-fight.vercel.app`

---

## PASSO 5 — Voltar no Render e atualizar o WEB_URL

1. No Render, vá em **Environment** do seu serviço
2. Atualize `WEB_URL` com a URL da Vercel (ex: `https://infinity-fight.vercel.app`)
3. O Render vai fazer redeploy automático

---

## PASSO 6 — Popular o banco com os dados iniciais

1. No terminal do VS Code, dentro da pasta `infinity-fight`:

```bash
cd apps/api
npm install
```

2. Crie um arquivo `.env` com o conteúdo:
```
DATABASE_URL=cole_aqui_a_string_do_supabase
JWT_SECRET=infinity-fight-secret-2025
WEB_URL=https://infinity-fight.vercel.app
PORT=3001
```

3. Execute:
```bash
npx prisma migrate dev --name init
npm run db:seed
```

4. Isso cria todas as tabelas e os dados de teste

---

## PASSO 7 — Manter o backend acordado (evitar o delay de 30s)

1. Acesse **cron-job.org** e crie uma conta gratuita
2. Clique em **"Create cronjob"**
3. Preencha:
   - URL: `https://infinity-fight-api.onrender.com/health`
   - Schedule: Every 10 minutes
4. Salve — isso mantém o backend sempre acordado

---

## Acessar o app

Após todos os passos:

- **App:** `https://infinity-fight.vercel.app`
- **Login instrutor:** `instrutor@infinityfight.com` / `instructor123`
- **Login aluno:** `rafael@teste.com` / `aluno123`

---

## Estrutura do projeto

```
infinity-fight/
├── apps/
│   ├── web/          ← Frontend (Next.js) → Vercel
│   └── api/          ← Backend (Fastify) → Render
├── vercel.json       ← Configuração Vercel
├── render.yaml       ← Configuração Render
└── docker-compose.yml ← Para rodar local
```

---

## Rodar localmente (opcional)

```bash
# Terminal 1 — banco de dados
docker-compose up

# Terminal 2 — backend
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev
npm run db:seed
npm run dev

# Terminal 3 — frontend
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Acesse: `http://localhost:3000`
