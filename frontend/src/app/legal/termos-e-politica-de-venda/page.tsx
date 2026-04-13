import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termos de Servico e Politica de Venda | Radar.ai",
  description:
    "Base juridica do Radar.ai para prestacao de servico de curadoria de dados publicos e politica de assinatura.",
};

export default function LegalTermsAndSalesPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 md:px-8">
          <span className="text-xl font-black tracking-tight text-slate-800">
            RADAR<span className="text-blue-600">SP</span>
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Termos de Servico e Politica de Venda
          </h1>
          <p className="mt-3 text-sm text-slate-500">Ultima atualizacao: 13 de abril de 2026.</p>
          <p className="mt-6 text-sm leading-6 text-slate-700">
            Este documento estabelece as condicoes de uso da plataforma RadarSP para acesso SaaS,
            incluindo regras de assinatura e limites de responsabilidade.
          </p>

          <section id="termos-de-servico" className="mt-10 space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Termos de Servico</h2>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">1. Objeto</h3>
              <p className="text-sm leading-6 text-slate-700">
                O RadarSP presta servico de curadoria, organizacao e apresentacao de dados publicos
                relacionados a oportunidades de leilao, com finalidade informativa e de apoio a analise.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">2. Propriedade Intelectual</h3>
              <p className="text-sm leading-6 text-slate-700">
                Os dados de origem permanecem de titularidade de suas respectivas fontes oficiais. A
                organizacao, estrutura, classificacao, filtros, apresentacao e demais elementos da
                plataforma sao propriedade intelectual do RadarSP e nao podem ser copiados sem autorizacao.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">3. Limitacao de Responsabilidade</h3>
              <p className="text-sm leading-6 text-slate-700">
                O usuario reconhece que toda decisao de lance, arrematacao ou investimento e de sua inteira
                responsabilidade. A conferencia do edital oficial e obrigatoria antes de qualquer
                participacao em leilao.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">4. Proibicao de Web Scraping Reverso</h3>
              <p className="text-sm leading-6 text-slate-700">
                E proibido extrair, coletar, reproduzir, revender ou redistribuir o conteudo organizado da
                plataforma por meio automatizado (bots, scripts, crawlers, scraping reverso ou tecnicas
                equivalentes), salvo autorizacao formal e expressa.
              </p>
            </div>
          </section>

          <section id="politica-de-venda" className="mt-10 space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Politica de Venda e Assinatura</h2>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">1. Assinatura do Servico</h3>
              <p className="text-sm leading-6 text-slate-700">
                O acesso aos recursos pagos da plataforma depende de assinatura ativa, conforme plano e
                condicoes comerciais apresentados no momento da contratacao.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">2. Cancelamento e Direito de Arrependimento</h3>
              <p className="text-sm leading-6 text-slate-700">
                Compras realizadas fora de estabelecimento comercial podem ser canceladas no prazo legal de 7
                dias corridos, nos termos do Art. 49 do Codigo de Defesa do Consumidor (CDC). O pedido deve
                ser feito pelos canais oficiais de atendimento da plataforma.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">3. Aceite</h3>
              <p className="text-sm leading-6 text-slate-700">
                Ao utilizar a plataforma, o usuario declara ter lido e aceito integralmente estes Termos de
                Servico e a Politica de Venda e Assinatura.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
