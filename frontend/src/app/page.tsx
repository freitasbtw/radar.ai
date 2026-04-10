"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  TrendingUp, 
  Search, 
  Car, 
  Home, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Zap,
  Menu,
  X,
  Target,
  DollarSign
} from 'lucide-react';

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navegação */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">RADAR<span className="text-blue-600">SP</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-bold text-slate-600">
            <a href="#como-funciona" className="hover:text-blue-600 transition-colors">Como Funciona</a>
            <a href="#lucro" className="hover:text-blue-600 transition-colors">Onde está o Lucro?</a>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 active:scale-95">
              Acessar Agora
            </button>
          </div>

          <button className="md:hidden text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-emerald-200 shadow-sm animate-bounce">
              <DollarSign size={16} /> <span>Pare de perder dinheiro em leilões ruins</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-8 tracking-tight">
              Saiba exatamente quais leilões <br/> 
              <span className="text-blue-600">valem o seu lance.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
              Nós vasculhamos os leilões de São Paulo e te entregamos apenas o que tem <span className="font-black text-slate-900">margem real de revenda</span>. 
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl text-xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 hover:-translate-y-1">
                QUERO VER AS OPORTUNIDADES <ArrowRight size={24} />
              </button>
            </div>
            
            {/* Visual do Dashboard */}
            <div className="mt-16 relative flex justify-center">
              <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(8,_112,_184,_0.2)] border border-slate-200 bg-white">
                <div className="p-6 md:p-10 bg-white overflow-x-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Target className="text-blue-600" /> Oportunidades de Hoje em SP
                    </h3>
                    <span className="text-slate-400 text-sm font-bold">Atualizado há 5 min</span>
                  </div>
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b-2 border-slate-100">
                        <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">O que é?</th>
                        <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest">Lance Mínimo</th>
                        <th className="pb-4 font-black text-slate-900 text-xs uppercase tracking-widest underline decoration-emerald-400 decoration-4">Ganho Estimado</th>
                        <th className="pb-4 font-black text-slate-400 text-xs uppercase tracking-widest text-center">Chance de Venda</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {[
                        { name: "Apartamento em Moema", source: "CAIXA", price: "R$ 420 mil", profit: "R$ 180 mil", chance: "Alta" },
                        { name: "Toyota Corolla 2021", source: "Detran-SP", price: "R$ 62 mil", profit: "R$ 38 mil", chance: "Muito Alta" },
                        { name: "Lote iPhones 14", source: "Receita Federal", price: "R$ 22 mil", profit: "R$ 15 mil", chance: "Instantânea" }
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-blue-50 transition-colors">
                          <td className="py-6">
                            <div className="font-black text-lg text-slate-800">{item.name}</div>
                            <div className="text-xs text-blue-600 font-bold uppercase">{item.source}</div>
                          </td>
                          <td className="py-6 text-slate-600 text-lg">{item.price}</td>
                          <td className="py-6 font-black text-2xl text-emerald-600">{item.profit}</td>
                          <td className="py-6 text-center">
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-black uppercase">
                              {item.chance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Logos Oficiais */}
      <section className="py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-slate-400 text-sm font-black uppercase tracking-[0.3em] mb-16">Analisamos diariamente dados oficiais de:</p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32">
            <img 
              src="https://images.seeklogo.com/logo-png/62/2/detran-logo-png_seeklogo-622008.png" 
              alt="Detran SP" 
              className="h-24 md:h-44 w-auto object-contain hover:scale-110 transition-transform cursor-pointer"
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Logo_Receita_Federal_do_Brasil.svg" 
              alt="Receita Federal" 
              className="h-20 md:h-40 w-auto object-contain hover:scale-110 transition-transform cursor-pointer"
            />
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Caixa_Econ%C3%B4mica_Federal_logo.svg/3840px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png" 
              alt="Caixa" 
              className="h-10 md:h-16 w-auto object-contain opacity-50 hover:opacity-100 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Chega de perder tempo com leilão "furado".</h2>
            <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">Quem ganha dinheiro com leilão não fica lendo centenas de páginas de editais. Quem ganha dinheiro usa o Radar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black mb-4">Busca Automática</h3>
              <p className="text-slate-600 font-medium">Nós lemos todos os leilões de SP por você. Separamos o ouro do lixo em segundos.</p>
            </div>
            <div className="text-center">
              <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-600">
                <DollarSign size={40} />
              </div>
              <h3 className="text-2xl font-black mb-4">Cálculo de Lucro Real</h3>
              <p className="text-slate-600 font-medium">Comparamos o preço do leilão com o preço real de venda no mercado. Você já entra sabendo quanto pode ganhar.</p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-amber-600">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black mb-4">Segurança Total</h3>
              <p className="text-slate-600 font-medium">Nossa nota de segurança te diz se o negócio é arriscado ou se é uma oportunidade imperdível.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="lucro" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-20 uppercase tracking-tighter">Onde está o dinheiro?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-blue-600 transition-all cursor-default">
              <Car size={48} className="mb-6" />
              <h3 className="text-2xl font-black mb-4">Carros e Motos</h3>
              <p className="text-slate-300 font-medium mb-6">Os veículos com maior giro em SP. Identificamos aqueles que estão muito abaixo da tabela FIPE.</p>
              <div className="text-blue-300 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                VER LOTES ATIVOS <ArrowRight size={16} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-blue-600 transition-all cursor-default">
              <Home size={48} className="mb-6" />
              <h3 className="text-2xl font-black mb-4">Casas e Aptos</h3>
              <p className="text-slate-300 font-medium mb-6">Imóveis da CAIXA e judiciais. Calculamos o valor por metro quadrado do bairro para garantir seu lucro.</p>
              <div className="text-blue-300 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                VER LOTES ATIVOS <ArrowRight size={16} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-blue-600 transition-all cursor-default">
              <Smartphone size={48} className="mb-6" />
              <h3 className="text-2xl font-black mb-4">Eletrônicos</h3>
              <p className="text-slate-300 font-medium mb-6">Lotes da Receita Federal. iPhones, notebooks e hardware com margens impressionantes.</p>
              <div className="text-blue-300 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                VER LOTES ATIVOS <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8">O próximo grande negócio está aqui.</h2>
              <p className="text-blue-100 text-xl md:text-2xl mb-12 font-medium">
                Aproveite o acesso gratuito à nossa ferramenta enquanto estamos em fase de testes. 
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <input 
                  type="email" 
                  placeholder="Seu melhor e-mail" 
                  className="w-full sm:w-96 px-8 py-5 rounded-2xl focus:outline-none text-slate-800 text-lg font-bold"
                />
                <button className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl active:scale-95 uppercase">
                  COMEÇAR AGORA
                </button>
              </div>
              <p className="mt-8 text-blue-200 text-sm font-bold uppercase tracking-widest">
                Sem cartões. Sem taxas. Apenas oportunidades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-800">RADAR<span className="text-blue-600">SP</span></span>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            © 2024 RADAR SP - INTELIGÊNCIA EM LEILÕES
          </div>
          <div className="flex gap-8 text-slate-500 font-bold text-sm uppercase">
            <a href="#" className="hover:text-blue-600 transition-colors">Aviso Legal</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
