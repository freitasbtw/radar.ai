# Radar.ai Documentation Hub

Este diretorio centraliza a documentacao tecnica e de produto.
Objetivo: manter uma fonte unica de verdade que acompanha a evolucao do projeto.

## Mapa Atual de Documentos

- `../README.md`
  - onboarding rapido, setup local e visao geral do repositorio.
- `STATUS_AND_ROADMAP.md`
  - snapshot do estado implementado hoje e proximo roadmap.
- `apis/`
  - fontes externas, contratos de integracao, parsing e normalizacao.
- `specs/`
  - product spec, tech spec e template de novas features.
- `db/migrations/`
  - historico versionado de schema SQL.
- `runbooks/`
  - operacao e troubleshooting (jobs, incidentes, rollback).

## Arquitetura Recomendada de Documentos

- `README` raiz
  - foco em "como rodar" e links para docs.
- `docs/STATUS_AND_ROADMAP.md`
  - documento vivo para acompanhar progresso real do codigo.
- `docs/specs/`
  - planejamento e contratos esperados (antes de implementar).
- `docs/apis/`
  - contratos e cuidados de fontes externas.
- `docs/db/migrations/`
  - mudancas de banco em SQL versionado.

Se o projeto crescer, adicionar:

- `docs/adr/`
  - registros curtos de decisoes arquiteturais (ADR).
- `docs/runbooks/`
  - operacao e troubleshooting (worker, incidentes, rollback).
- `docs/releases/`
  - notas de release por versao.

## Regra Simples para Manter Docs Atualizadas

Para cada PR, responder 4 perguntas:

1. Mudou comportamento de produto?
2. Mudou contrato de API/evento/dado?
3. Mudou fonte externa ou logica de ingestao?
4. Mudou schema de banco?

Se "sim" em qualquer item, atualizar os docs correspondentes no mesmo PR.

## Checklist Minimo por PR

- [ ] Atualizei `STATUS_AND_ROADMAP.md` se houve mudanca visivel.
- [ ] Atualizei `docs/specs/*` se contrato/escopo mudou.
- [ ] Atualizei `docs/apis/*` se adaptador/fonte mudou.
- [ ] Adicionei migration SQL em `docs/db/migrations/` se schema mudou.

## Cadencia Recomendada

- Semanal (10-15 min): revisar `STATUS_AND_ROADMAP.md`.
- A cada release: revisar `README` raiz e links quebrados.
- Mensal: limpar secoes obsoletas e consolidar decisoes em ADR.
