"use client";

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  ShieldCheck, 
  Search, 
  Car, 
  Home, 
  Smartphone, 
  ArrowRight, 
  Menu,
  X,
  Target,
  DollarSign
} from 'lucide-react';
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { ContactForm } from "@/components/ContactForm";
import { cn } from "@/lib/utils";

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
            <a href="#como-funciona" className="text-sm hover:text-blue-600 transition-colors">Como Funciona</a>
            <a href="#lucro" className="text-sm hover:text-blue-600 transition-colors">Setores</a>
            <Link
              href="/auth/login"
              className={cn(buttonVariants(), "rounded-xl shadow-sm text-sm")}
            >
              Acessar Agora
            </Link>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-bold mb-6 border border-slate-200 shadow-sm">
              <Target size={16} /> <span>Monitoramento inteligente de leilões</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-8 tracking-tight">
              Encontre os melhores leilões <br/> 
              <span className="text-blue-600">com base em dados.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Consolidamos informações dos principais leilões de São Paulo para que você possa focar apenas nas <span className="font-bold text-slate-900">melhores oportunidades</span>. 
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto rounded-xl text-md font-bold shadow-md hover:-translate-y-1 transition-all"
                )}
              >
                Acessar Plataforma <ArrowRight size={20} className="ml-2" />
              </Link>
              <Dialog>
                <DialogTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto rounded-xl text-md font-bold shadow-sm"
                  )}
                >
                  Fale Conosco
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Entre em contato</DialogTitle>
                    <DialogDescription>
                      Tem dúvidas sobre a plataforma? Envie uma mensagem e entraremos em contato o mais breve possível.
                    </DialogDescription>
                  </DialogHeader>
                  <ContactForm onSuccess={() => alert("Mensagem enviada com sucesso!")} />
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Visual do Dashboard */}
            <div className="mt-16 relative flex justify-center">
              <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
                <div className="p-6 md:p-10 bg-white overflow-x-auto">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Target className="text-blue-600" size={20} /> Lotes Recentes - SP
                    </h3>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Última atualização: 5 min</span>
                  </div>
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="pb-3 text-slate-500 text-xs uppercase font-bold tracking-wider">Descrição do Lote</th>
                        <th className="pb-3 text-slate-500 text-xs uppercase font-bold tracking-wider">Lance Atual</th>
                        <th className="pb-3 text-slate-500 text-xs uppercase font-bold tracking-wider">Valor de Mercado</th>
                        <th className="pb-3 text-slate-500 text-xs uppercase font-bold tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {[
                        { name: "Apartamento 80m² - Moema", source: "CAIXA", price: "R$ 420.000", profit: "R$ 600.000", chance: "Aberto" },
                        { name: "Toyota Corolla XEi 2024", source: "Detran-SP", price: "R$ 82.000", profit: "R$ 115.000", chance: "Hoje" },
                        { name: "Lote iPhones 15 Pro", source: "Receita Federal", price: "R$ 35.000", profit: "R$ 48.000", chance: "Aberto" }
                      ].map((item, i) => (
                        <tr key={i} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">{item.source}</div>
                          </td>
                          <td className="py-4 text-slate-600 font-medium">{item.price}</td>
                          <td className="py-4 font-semibold text-emerald-600">{item.profit}</td>
                          <td className="py-4 text-center">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
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
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Chega de perder tempo com leilão &quot;furado&quot;.</h2>
            <p className="text-slate-600 text-xl font-medium max-w-2xl mx-auto">Quem ganha dinheiro com leilão não fica lendo centenas de páginas de editais. Quem ganha dinheiro usa o Radar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <Card className="text-center p-8 border-none shadow-none bg-transparent">
              <CardHeader className="p-0 mb-8">
                <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-blue-600">
                  <Search size={40} />
                </div>
              </CardHeader>
              <CardTitle className="text-2xl font-black mb-4">Busca Automática</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-base">
                Nós lemos todos os leilões de SP por você. Separamos o ouro do lixo em segundos.
              </CardDescription>
            </Card>
            
            <Card className="text-center p-8 border-none shadow-none bg-transparent">
              <CardHeader className="p-0 mb-8">
                <div className="bg-emerald-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-emerald-600">
                  <DollarSign size={40} />
                </div>
              </CardHeader>
              <CardTitle className="text-2xl font-black mb-4">Cálculo de Lucro Real</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-base">
                Comparamos o preço do leilão com o preço real de venda no mercado. Você já entra sabendo quanto pode ganhar.
              </CardDescription>
            </Card>
            
            <Card className="text-center p-8 border-none shadow-none bg-transparent">
              <CardHeader className="p-0 mb-8">
                <div className="bg-amber-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-amber-600">
                  <ShieldCheck size={40} />
                </div>
              </CardHeader>
              <CardTitle className="text-2xl font-black mb-4">Segurança Total</CardTitle>
              <CardDescription className="text-slate-600 font-medium text-base">
                Nossa nota de segurança te diz se o negócio é arriscado ou se é uma oportunidade imperdível.
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="lucro" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-20 uppercase tracking-tighter">Onde está o dinheiro?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] hover:bg-blue-600 transition-all cursor-default">
              <Car size={32} className="mb-6 text-blue-400" />
              <h3 className="text-xl font-bold mb-3">Carros e Motos</h3>
              <p className="text-slate-400 font-medium mb-6 text-sm">Veículos com maior giro em SP. Identificamos aqueles abaixo da FIPE com precisão.</p>
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                VER LOTES <ArrowRight size={14} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
              <Home size={32} className="mb-6 text-emerald-400" />
              <h3 className="text-xl font-bold mb-3">Casas e Aptos</h3>
              <p className="text-slate-400 font-medium mb-6 text-sm">Imóveis da CAIXA e judiciais com cálculos automáticos de região.</p>
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                VER LOTES <ArrowRight size={14} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors cursor-default">
              <Smartphone size={32} className="mb-6 text-purple-400" />
              <h3 className="text-xl font-bold mb-3">Eletrônicos</h3>
              <p className="text-slate-400 font-medium mb-6 text-sm">Hardware e gadgets com avaliações de margem estruturadas.</p>
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                VER LOTES <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Decisões baseadas em dados</h2>
          <p className="text-slate-500 text-lg md:text-xl mb-10">
            Acesse o sistema e comece sua pesquisa profissional. Restrito para investidores convidados.
          </p>
          <div className="flex justify-center items-center">
            <Link href="/auth/login" className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:-translate-y-1">
              Acessar Sistema <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-800">RADAR<span className="text-blue-600">SP</span></span>
          </div>
          <div className="text-slate-500 text-sm font-medium">
            © 2026 Radar SP - Inteligência de Dados
          </div>
          <div className="flex gap-6 text-slate-500 font-medium text-sm">
            <Link href="/legal/termos-e-politica-de-venda#termos-de-servico" className="hover:text-blue-600 transition-colors">
              Termos
            </Link>
            <Link href="/legal/termos-e-politica-de-venda#politica-de-venda" className="hover:text-blue-600 transition-colors">
              Politica de Venda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
