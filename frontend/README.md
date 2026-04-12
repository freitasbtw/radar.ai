# Radar.ai Frontend

Aplicação web do Radar.ai (Next.js) com:

- landing page
- login via Supabase Auth
- dashboard com lotes e filtros

## Requisitos

- Node.js 20+
- npm 10+

## Variáveis de ambiente

Crie `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
# opcional (legado)
# NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Observação: se alterar variáveis, reinicie o `npm run dev`.

## Executar localmente

```bash
cd frontend
npm install
npm run dev
```

App local: `http://localhost:3000`

## Scripts

- `npm run dev`: desenvolvimento
- `npm run build`: build de produção
- `npm run start`: executa build
- `npm run lint`: lint

## Deploy (Vercel)

Para funcionar em deploy, configure no projeto do Vercel as mesmas variáveis acima nos ambientes:

- `production`
- `preview`
- `development`
