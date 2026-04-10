# 🚀 Radar de Oportunidades de Leilão (SP)

**Radar de Oportunidades de Leilão (SP)** é uma plataforma de inteligência de dados focada em ajudar revendedores (pessoas físicas ou empresas) a encontrar, analisar e priorizar os lotes de leilão mais lucrativos no estado de São Paulo. A ideia central é automatizar a garimpagem de leilões e calcular o lucro potencial antes mesmo do usuário dar um lance, transformando compras governamentais/bancárias em uma decisão puramente matemática e baseada em dados reais.

---

## 🛑 O Problema que Resolve

Atualmente, quem compra em leilão para revender perde muito tempo lendo editais complexos, analisando lotes manualmente e pesquisando preços de mercado de forma inconsistente em diversas plataformas (como FIPE, Webmotors, ZAP Imóveis) apenas para saber se o lance inicial vale a pena ou não. É um processo lento, analógico e sujeito à emoção humana.

## 💡 A Solução

O projeto constrói um **Dashboard de Oportunidades** atualizado diariamente. O sistema atua como um "robô" inteligente que:

1. **Coleta de Dados:** Busca automaticamente os lotes de leilões disponíveis em fontes oficiais (Receita Federal, Detran-SP, CAIXA, etc.).
2. **Cruzamento de Preços:** Cruza o preço mínimo (lance inicial) exigido no leilão com os preços reais praticados no mercado para aquele mesmo bem (buscando dados em plataformas como FIPE, Mercado Livre, OLX, Webmotors).
3. **Ranqueamento (Scoring):** Analisa e ranqueia os lotes, exibindo para o usuário apenas os mais promissores e lucrativos nas categorias de Automóveis, Imóveis e Eletrônicos.

---

## ⚙️ A "Mágica" do Sistema (Métricas Core)

Para cada lote filtrado, o sistema calcula três indicadores vitais para o investidor/revendedor tomar uma decisão rápida:

* 💰 **Spread Bruto (Lucro Potencial):**
  A diferença financeira direta entre a **mediana de preço do mercado** e o **lance inicial** exigido no leilão.
  
* 🎯 **Score de Oportunidade (0 a 100):**
  Uma nota matemática rigorosa que avalia a viabilidade do lote, pesada da seguinte forma:
  * **60% - Tamanho do lucro** (Margem real esperada).
  * **25% - Confiança do Match** (Certeza de que o item encontrado no mercado é exatamente igual ao do leilão).
  * **15% - Liquidez** (Facilidade e velocidade de revenda do item).

* ⚠️ **Risco (Baixo, Médio, Alto):**
  Mede a segurança da operação baseado na variância de dados:
  * **Alto:** Se o sistema encontrou poucos comparáveis no mercado (menos de 3) ou se os preços encontrados variam de forma extrema.
  * **Baixo:** Se o sistema encontrou dezenas de itens similares com preços consistentes, indicando forte previsibilidade.

---

## 📂 Estrutura do Projeto

* `PRD/` - Documentações e Requisitos do Produto (Product Requirements Document).
* `prototype/` - MVP e protótipos em Python para coleta e análise inicial.
  * `data/` - Base de dados e mockups JSON de itens de mercado comparáveis.
  * `output/` - Dashboards e relatórios gerados pelo sistema sobre os lotes e editais (HTML e JSON).
