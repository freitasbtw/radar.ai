# Radar.ai

Plataforma para análise de oportunidades em leilões públicos e institucionais no estado de São Paulo.  
O objetivo é transformar a triagem de lotes em um processo orientado por dados, com foco em margem potencial, risco e velocidade de revenda.

## Status Atual

Este repositório está em fase inicial de desenvolvimento (MVP), com:

- `frontend` em Next.js com landing page e proposta de valor do produto.
- `backend` em Express com endpoint base para integração inicial.

## Arquitetura

O projeto está organizado como monorepo com duas aplicações independentes:

- `frontend`: interface web (Next.js 16 + React 19 + Tailwind CSS 4).
- `backend`: API HTTP (Express 5 + TypeScript).

Fluxo atual:

1. O frontend consome dados da API.
2. O backend expõe endpoints HTTP em `/api`.
3. A base atual serve como fundação para evoluir coleta, scoring e priorização de lotes.

## Stack Tecnológica

- Node.js
- TypeScript
- Next.js (App Router)
- React
- Tailwind CSS
- Express
- CORS e dotenv

## Estrutura de Pastas

```text
radar.ai/
|- backend/
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- middlewares/
|  |  |- models/
|  |  |- routes/
|  |  |- services/
|  |  |- app.ts
|  |  \- server.ts
|  |- package.json
|  \- tsconfig.json
|- frontend/
|  |- src/app/
|  |  |- layout.tsx
|  |  |- page.tsx
|  |  \- globals.css
|  |- public/
|  |- package.json
|  \- next.config.ts
\- README.md
```

## Pré-requisitos

- Node.js 20+ (recomendado)
- npm 10+ (ou versão compatível com Node 20+)

## Configuração de Ambiente

No backend, crie ou ajuste o arquivo `backend/.env` com:

```env
PORT=3333
NODE_ENV=development
```

## Como Rodar Localmente

### 1) Instalar dependências

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Subir o backend

```bash
cd backend
npx tsx src/server.ts
```

Servidor esperado: `http://localhost:3333`

### 3) Subir o frontend

```bash
cd frontend
npm run dev
```

Aplicação esperada: `http://localhost:3000`

## Scripts Disponíveis

### Frontend (`frontend/package.json`)

- `npm run dev`: inicia ambiente de desenvolvimento.
- `npm run build`: gera build de produção.
- `npm run start`: executa build em modo produção.
- `npm run lint`: executa lint com ESLint.

### Backend (`backend/package.json`)

- `npm test`: script placeholder (ainda não implementado).

Comando prático para desenvolvimento no backend:

```bash
npx tsx src/server.ts
```

## API Atual

### `GET /api`

Retorna payload de validação da API:

```json
{
  "message": "Hello from the Backend!"
}
```

## Especificações

A documentação orientada a especificações está em:

- `docs/specs/README.md`
- `docs/specs/PRODUCT_SPEC_MVP.md`
- `docs/specs/TECH_SPEC_MVP.md`
- `docs/specs/SPEC_TEMPLATE.md`

## Documentação de APIs

Documentação das fontes de dados e integrações:

- `docs/apis/README.md`
- `docs/apis/EXTERNAL_AUCTION_APIS.md`

## Próximos Passos Recomendados

- Estruturar scripts de execução no backend (`dev`, `build`, `start`).
- Definir contrato de API para lotes, comparáveis e métricas de oportunidade.
- Adicionar camada de persistência e serviço de coleta de dados.
- Implementar testes automatizados (unitários e integração).

## Licença

Definir licença do projeto antes de publicação externa.
