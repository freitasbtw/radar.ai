# Radar.ai - Product Spec (MVP)

## 1. Contexto

O Radar.ai resolve o problema de baixa eficiência na triagem de leilões para revenda. Hoje o processo é manual, disperso e sujeito a erro. A proposta é consolidar dados de fontes públicas de leilão em um único dashboard, com priorização por potencial de retorno.

## 2. Objetivo do Produto

Entregar uma aplicação web que:

1. Ingere dados de APIs públicas de leilão.
2. Normaliza e organiza os lotes em um formato único.
3. Exibe visualização clara para decisão rápida do usuário final.

## 3. Público-Alvo

- Revendedores (PF ou PJ) que compram em leilão para revenda.
- Usuários com pouco tempo para analisar editais e múltiplos portais.

## 4. Problemas a Resolver

- Falta de centralização dos lotes.
- Dificuldade para comparar oportunidades entre fontes.
- Baixa rastreabilidade de atualização dos dados.
- Pouca visibilidade de risco e potencial de retorno.

## 5. Escopo do MVP

### Incluído

- Cadastro de fontes de API públicas.
- Coleta periódica de lotes.
- Normalização e deduplicação básica.
- Dashboard com:
  - indicadores gerais;
  - tabela de oportunidades;
  - filtros por categoria, preço, localização e status.
- API backend para servir dados ao frontend.

### Fora de Escopo (MVP)

- Execução de lances.
- Automação de compra.
- Login multi-tenant avançado.
- Machine learning avançado para previsão de preço.

## 6. Metas de Negócio

- Reduzir tempo de análise de lotes por usuário em pelo menos 50%.
- Atingir atualização de dados em janela máxima de 60 minutos.
- Garantir base confiável para evolução de scoring de oportunidade.

## 7. Métricas de Sucesso (KPIs)

- `kpi_time_to_first_insight`: tempo até o usuário visualizar primeira oportunidade.
- `kpi_data_freshness_minutes`: minutos desde última atualização por fonte.
- `kpi_lot_coverage`: total de lotes ativos por fonte e categoria.
- `kpi_dashboard_engagement`: sessões com uso de filtros e ordenação.

## 8. Requisitos Funcionais

- `RF-001`: O sistema deve consumir APIs públicas de leilões de forma agendada.
- `RF-002`: O sistema deve normalizar lotes para um schema canônico único.
- `RF-003`: O sistema deve registrar fonte e timestamp de coleta por lote.
- `RF-004`: O sistema deve deduplicar lotes com estratégia determinística.
- `RF-005`: O sistema deve disponibilizar consulta paginada de lotes.
- `RF-006`: O sistema deve permitir filtro por categoria, faixa de preço, cidade e status.
- `RF-007`: O sistema deve mostrar no dashboard métricas agregadas (total, ativos, ticket médio).
- `RF-008`: O sistema deve exibir data/hora da última atualização global e por fonte.

## 9. Requisitos Não Funcionais

- `RNF-001`: Tempo de resposta da API em leitura menor que 500 ms (p95) em carga de MVP.
- `RNF-002`: Disponibilidade alvo do backend de 99,5% no horário comercial.
- `RNF-003`: Logs estruturados para rastreabilidade de erros de ingestão.
- `RNF-004`: Tolerância a falhas por fonte (falha em uma fonte não interrompe pipeline total).
- `RNF-005`: Versionamento de contrato de API para evitar quebra no frontend.

## 10. Restrições e Premissas

- Algumas fontes podem ter limitação de taxa, instabilidade ou indisponibilidade temporária.
- Cada fonte pode ter nomenclatura própria de categoria e status.
- A estratégia inicial prioriza velocidade de entrega e observabilidade sobre sofisticação de scoring.

## 11. Critérios de Aceite do MVP

- Coleta de ao menos 2 fontes públicas com atualização automatizada.
- Dashboard carregando dados reais com filtros funcionais.
- API documentada com contrato mínimo de listagem e detalhe.
- Histórico de execução da ingestão com sucesso/falha por fonte.

## 12. Roadmap de Evolução

- Fase 1: ingestão e normalização.
- Fase 2: dashboard operacional e filtros.
- Fase 3: scoring de oportunidade e risco.
- Fase 4: alertas e notificações personalizadas.
