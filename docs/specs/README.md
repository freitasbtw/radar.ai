# Spec-Driven Development

Este diretório centraliza as especificações do Radar.ai para orientar implementação, validação e evolução de produto.

## Documentos

- `PRODUCT_SPEC_MVP.md`: visão de produto do MVP, escopo, requisitos e metas.
- `TECH_SPEC_MVP.md`: arquitetura, modelo de dados, contratos de API e fases técnicas.
- `SPEC_TEMPLATE.md`: template padrão para novas features.

## Fluxo Recomendado

1. Definir problema e escopo usando `SPEC_TEMPLATE.md`.
2. Revisar impacto técnico com base em `TECH_SPEC_MVP.md`.
3. Aprovar critérios de aceite antes de iniciar código.
4. Implementar por fases com checkpoints de teste.
5. Atualizar status da spec para `implemented` após validação.

## Convenções

- Use IDs estáveis (`RF-*`, `RNF-*`, `RB-*`, `CA-*`) para rastreabilidade.
- Evite iniciar desenvolvimento sem seção de critérios de aceite.
- Qualquer mudança de contrato deve atualizar a spec correspondente.
