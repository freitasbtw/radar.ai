# Radar.ai Docs Site

Portal de documentacao em Docusaurus para o projeto Radar.ai.

## Fonte de Conteudo

Este site usa como fonte principal os arquivos em `../docs` (raiz do repositorio).
Nao existe duplicacao de Markdown dentro do `docs-site`.

## Requisitos

- Node.js 20+
- npm 10+

## Desenvolvimento Local

```bash
cd docs-site
npm install
npm start
```

Site local padrao: `http://localhost:3000`

## Build de Producao

```bash
cd docs-site
npm run build
```

Saida estatica: `docs-site/build`

## Estrutura Relevante

- `docusaurus.config.ts`: config principal e plugins
- `sidebars.ts`: estrutura da navegacao lateral
- `src/pages/index.tsx`: home do portal
- `../docs`: conteudo versionado do projeto

## Fluxo de Atualizacao

1. atualize docs em `../docs`
2. valide localmente com `npm start`
3. rode `npm run build` antes de publicar
