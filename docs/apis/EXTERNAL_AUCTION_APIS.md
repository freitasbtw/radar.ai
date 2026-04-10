# APIs Externas de Leilões - Radar.ai

## 1. Escopo

Este documento descreve as fontes externas de dados para o MVP do Radar.ai, com foco em:

- descoberta de oportunidades de leilão;
- ingestão automatizada;
- normalização para o modelo canônico do backend.

Validação técnica realizada em **10/04/2026**.

## 2. Fonte 1 - CAIXA (Imóveis)

### 2.1 Tipo de Integração

- Tipo: download de arquivo CSV.
- Acesso: público, sem autenticação.
- Cobertura: imóveis por UF e lista geral nacional.

### 2.2 Endpoints

- Página de seleção de lista:
  - `https://venda-imoveis.caixa.gov.br/sistema/download-lista.asp`
- Download direto por UF:
  - `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_SP.csv`
  - padrão: `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_<UF>.csv`
- Download geral:
  - `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_geral.csv`

### 2.3 Exemplo de Requisição

```bash
curl -L "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_SP.csv" -o Lista_imoveis_SP.csv
```

### 2.4 Formato e Parsing

- Formato: CSV delimitado por `;`.
- Encoding observado: **Windows-1252 / ANSI**.
- Primeira linha: metadado com data de geração.
- Segunda linha: cabeçalho de colunas.

Exemplo de cabeçalho:

```text
N° do imóvel;UF;Cidade;Bairro;Endereço;Preço;Valor de avaliação;Desconto;Financiamento;Descrição;Modalidade de venda;Link de acesso
```

### 2.5 Campos Relevantes para Normalização

| Campo CAIXA | Tipo | Mapeamento sugerido |
|---|---|---|
| N° do imóvel | string | `external_id` |
| UF | string | `state` |
| Cidade | string | `city` |
| Bairro | string | `district` (campo opcional interno) |
| Endereço | string | `address` |
| Preço | string monetária | `min_bid` (converter para decimal) |
| Valor de avaliação | string monetária | `appraisal_value` |
| Desconto | número | `discount_percent` |
| Financiamento | Sim/Não | `financing_allowed` |
| Descrição | string | `description` |
| Modalidade de venda | string | `sale_mode` |
| Link de acesso | URL | `lot_url` |

### 2.6 Regras de Transformação

- Remover espaços laterais dos campos.
- Converter valores monetários de `357.963,83` para decimal `357963.83`.
- Ignorar linhas vazias após cabeçalho.
- Definir `source = "caixa_imoveis"`.
- Definir `category = "real_estate"`.

### 2.7 Riscos e Cuidados

- Não há contrato público formal de API; estrutura de CSV pode mudar sem versionamento.
- Possível atualização assíncrona por UF, exigindo controle por arquivo.
- Recomenda-se armazenar hash de linha para detecção de alterações.

## 3. Fonte 2 - Receita Federal (SLE)

### 3.1 Tipo de Integração

- Tipo: endpoints JSON do portal público SLE.
- Acesso: público, sem autenticação para endpoints de consulta.
- Cobertura: editais e lotes de mercadorias apreendidas.

### 3.2 Base URL

- `https://www25.receita.fazenda.gov.br/sle-sociedade/`

### 3.3 Endpoints Validados

#### `GET /api/portal`

Resumo geral da home pública:

- timestamp de referência (`agora`);
- filtros;
- destaques;
- blocos de situação de editais.

URL completa:

- `https://www25.receita.fazenda.gov.br/sle-sociedade/api/portal`

#### `GET /api/portal/destaques`

Lista de lotes em destaque com informações resumidas.

URL completa:

- `https://www25.receita.fazenda.gov.br/sle-sociedade/api/portal/destaques`

#### `GET /api/editais-disponiveis`

Lista de editais agrupada por situação (próximos, abertos, etc.).

URL completa:

- `https://www25.receita.fazenda.gov.br/sle-sociedade/api/editais-disponiveis`

#### `GET /api/editais-disponiveis/unidadesExecutoras`

Lista de unidades executoras.

URL completa:

- `https://www25.receita.fazenda.gov.br/sle-sociedade/api/editais-disponiveis/unidadesExecutoras`

#### `GET /api/edital/{unidade}/{numero}/{exercicio}`

Detalhe de edital com `listaLotes`.

Exemplo validado:

- `https://www25.receita.fazenda.gov.br/sle-sociedade/api/edital/800100/4/2026`

### 3.4 Exemplo de Requisições

```bash
curl "https://www25.receita.fazenda.gov.br/sle-sociedade/api/editais-disponiveis"
```

```bash
curl "https://www25.receita.fazenda.gov.br/sle-sociedade/api/edital/800100/4/2026"
```

### 3.5 Estruturas de Resposta (Resumo)

#### `api/editais-disponiveis`

Campos principais por item de edital:

- `edital`
- `edle`
- `codigoSituacao`
- `permitePF`
- `tipo`
- `uaNm`
- `orgao`
- `cidade`
- `dataInicioPropostas`
- `dataFimPropostas`
- `dataAberturaLances`
- `lotes`

#### `api/edital/{...}`

Campos principais:

- dados do edital (`edital`, `edle`, `situacao`, datas, cidade, órgão);
- `listaLotes` com lote e metadados de imagem;
- valores de lote (`valorMinimo`, `valorAvaliacao`);
- permissões e flags de exibição.

### 3.6 Montagem do Endpoint de Detalhe

Use o campo `edle` retornado pelas listagens.

Exemplo:

- `edle = "800100/4/2026"`
- endpoint de detalhe: `/api/edital/800100/4/2026`

### 3.7 Endpoints que exigem contexto adicional

Alguns endpoints podem responder erro sem parâmetros/sessão adequados:

- `/api/lote/`
- `/api/favoritos`

No MVP, priorizar os endpoints listados na seção 3.3.

### 3.8 Riscos e Cuidados

- Endpoints não publicados em documentação formal de terceiros podem mudar.
- Controle de taxa e retries obrigatórios.
- Implementar fallback em dataset oficial de dados abertos.

## 4. Fallback Oficial da Receita (Dados Abertos)

Caso a API do portal SLE sofra alteração, usar dataset oficial:

- Página: `https://www.gov.br/receitafederal/dados/leiloes.csv/view`
- Download direto: `https://www.gov.br/receitafederal/dados/leiloes.csv/@@download/file`

Observação:

- Esse CSV é ótimo para histórico e continuidade operacional.
- O nível de detalhe de lote é menor que no endpoint SLE por edital.

## 5. Contrato Interno Recomendado para Adaptadores

Cada conector deve expor:

- `fetchIndex()`: lista editais/lotes resumidos.
- `fetchDetail(externalRef)`: detalhe por edital/lote.
- `normalize(record)`: mapeamento para schema canônico.
- `healthcheck()`: disponibilidade da fonte.

Saída canônica mínima por lote:

```json
{
  "source": "string",
  "external_id": "string",
  "title": "string",
  "category": "vehicle|real_estate|electronics|other",
  "status": "open|scheduled|closed|unknown",
  "city": "string|null",
  "state": "string|null",
  "auction_date": "ISO-8601|null",
  "min_bid": 0,
  "currency": "BRL",
  "lot_url": "string|null",
  "first_seen_at": "ISO-8601",
  "last_seen_at": "ISO-8601"
}
```

## 6. Estratégia de Polling (MVP)

- CAIXA:
  - frequência sugerida: a cada 12 horas.
  - estratégia: baixar `Lista_imoveis_SP.csv` (ou `geral`) e processar delta.
- Receita SLE:
  - frequência sugerida: a cada 15 minutos para índice (`api/editais-disponiveis`).
  - detalhe: atualizar apenas editais em situação ativa.

## 7. Observabilidade Obrigatória

- Log por execução com `source`, `run_id`, `duration_ms`, `fetched_count`, `upserted_count`, `error_count`.
- Métricas por fonte:
  - latência;
  - taxa de sucesso;
  - idade da última atualização.

## 8. Compliance e Uso Responsável

- Respeitar termos de uso dos portais públicos.
- Evitar carga excessiva (retries com backoff exponencial).
- Não armazenar dados pessoais além do necessário ao produto.
