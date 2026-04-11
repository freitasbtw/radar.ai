"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type DashboardLot = {
  id: number;
  source_key: string;
  title: string;
  category: string;
  status: string;
  city: string | null;
  state: string | null;
  min_bid: number | null;
  lot_url: string | null;
  auction_date: string | null;
  updated_at: string;
};

type PollState = {
  source_key: string;
  last_success_at: string | null;
  consecutive_failures: number;
  next_poll_at: string | null;
};

type LotFilters = {
  title: string;
  source_key: string;
  category: string;
  location: string;
  status: string;
};

const INITIAL_FILTERS: LotFilters = {
  title: "",
  source_key: "",
  category: "",
  location: "",
  status: "",
};

function currency(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function dateTime(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const PAGE_SIZE = 25;
const FILTER_KEYS = ["title", "source_key", "category", "location", "status"] as const;

function toLikePattern(value: string): string {
  const normalized = value.trim().replaceAll("%", "").replaceAll("_", "");
  return `%${normalized}%`;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const pollStateLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lots, setLots] = useState<DashboardLot[]>([]);
  const [pollState, setPollState] = useState<PollState[]>([]);
  const [totalLots, setTotalLots] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<keyof LotFilters | null>(null);
  const [filters, setFilters] = useState<LotFilters>({ ...INITIAL_FILTERS });
  const [filterDraft, setFilterDraft] = useState<LotFilters>({ ...INITIAL_FILTERS });

  useEffect(() => {
    async function loadDashboardData() {
      setError(null);

      if (!supabase) {
        setError("Variáveis do Supabase não configuradas no frontend.");
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/auth/login");
        return;
      }

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let lotsQuery = supabase
        .from("auction_lots")
        .select("id,source_key,title,category,status,city,state,min_bid,lot_url,auction_date,updated_at", {
          count: "exact",
        })
        .order("updated_at", { ascending: false });

      if (filters.title) lotsQuery = lotsQuery.ilike("title", toLikePattern(filters.title));
      if (filters.source_key) lotsQuery = lotsQuery.ilike("source_key", toLikePattern(filters.source_key));
      if (filters.category) lotsQuery = lotsQuery.ilike("category", toLikePattern(filters.category));
      if (filters.status) lotsQuery = lotsQuery.ilike("status", toLikePattern(filters.status));
      if (filters.location) {
        const locationLike = toLikePattern(filters.location);
        lotsQuery = lotsQuery.or(`city.ilike.${locationLike},state.ilike.${locationLike}`);
      }

      const lotsPromise = lotsQuery.range(from, to);

      const pollPromise = pollStateLoadedRef.current
        ? Promise.resolve({ data: null, error: null })
        : supabase
            .from("source_poll_state")
            .select("source_key,last_success_at,consecutive_failures,next_poll_at")
            .order("source_key", { ascending: true });

      const [lotsResponse, pollResponse] = await Promise.all([lotsPromise, pollPromise]);

      if (lotsResponse.error) {
        setError(lotsResponse.error.message);
        setLoading(false);
        return;
      }

      if (pollResponse.error) {
        setError(pollResponse.error.message);
        setLoading(false);
        return;
      }

      setLots((lotsResponse.data ?? []) as DashboardLot[]);
      if (!pollStateLoadedRef.current && pollResponse.data) {
        setPollState((pollResponse.data ?? []) as PollState[]);
        pollStateLoadedRef.current = true;
      }
      setTotalLots(lotsResponse.count ?? 0);
      setLoading(false);
    }

    loadDashboardData();
  }, [currentPage, filters, router, supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const failures = pollState.reduce((acc, item) => acc + item.consecutive_failures, 0);
  const latestSync = pollState
    .map((item) => item.last_success_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  const activeFiltersCount = FILTER_KEYS.filter((key) => filters[key]).length;
  const totalPages = Math.max(1, Math.ceil(totalLots / PAGE_SIZE));
  const pageStart = totalLots === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, totalLots);

  function toggleFilter(key: keyof LotFilters) {
    setActiveFilter((current) => (current === key ? null : key));
  }

  function applyFilter(key: keyof LotFilters) {
    setCurrentPage(1);
    setFilters((current) => ({ ...current, [key]: filterDraft[key].trim() }));
  }

  function clearFilter(key: keyof LotFilters) {
    setCurrentPage(1);
    setFilterDraft((current) => ({ ...current, [key]: "" }));
    setFilters((current) => ({ ...current, [key]: "" }));
  }

  function clearAllFilters() {
    setCurrentPage(1);
    setActiveFilter(null);
    setFilterDraft({ ...INITIAL_FILTERS });
    setFilters({ ...INITIAL_FILTERS });
  }

  function onFilterKeyDown(event: KeyboardEvent<HTMLInputElement>, key: keyof LotFilters) {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFilter(key);
      setActiveFilter(null);
    }
    if (event.key === "Escape") setActiveFilter(null);
  }

  function columnHeader(label: string, key: keyof LotFilters) {
    const isOpen = activeFilter === key;
    const hasValue = Boolean(filters[key]);

    return (
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <span>{label}</span>
            {hasValue ? <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">ativo</span> : null}
          </div>
          {isOpen ? (
            <div className="mt-2 flex items-center gap-1">
              <Input
                value={filterDraft[key]}
                onChange={(event) =>
                  setFilterDraft((current) => ({ ...current, [key]: event.target.value }))
                }
                onKeyDown={(event) => onFilterKeyDown(event, key)}
                className="w-28 h-7 text-[11px] normal-case bg-white px-2"
                placeholder="Pesquisar..."
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyFilter(key)}
                className="h-7 px-2 text-[11px] normal-case"
              >
                OK
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter(key)}
                className="h-7 px-2 text-[11px] normal-case"
              >
                Limpar
              </Button>
            </div>
          ) : null}
        </div>
        <button
          onClick={() => toggleFilter(key)}
          className={`rounded border p-1 ${hasValue ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"}`}
          aria-label={`Filtrar coluna ${label}`}
          title={`Filtrar ${label.toLowerCase()}`}
        >
          <Search size={12} />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-pulse">
            <div>
              <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
              <div className="h-10 w-64 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-96 bg-slate-200 rounded"></div>
            </div>
            <div className="h-12 w-24 bg-slate-200 rounded-xl"></div>
          </header>
          
          <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200">
                <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
                <div className="h-8 w-16 bg-slate-200 rounded"></div>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="px-5 py-4 border-b border-slate-200">
              <div className="h-6 w-64 bg-slate-200 rounded"></div>
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 w-full bg-slate-100 rounded"></div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="text-red-500" size={40} />
          </div>
          <h1 className="text-2xl font-black mb-3">Falha ao carregar</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold tracking-tight text-slate-800">RADAR<span className="text-blue-600">SP</span></span>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block">Painel de Controle</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Monitoramento de Lotes</h1>
          </div>

          <button
            onClick={signOut}
            className="text-sm text-slate-500 font-semibold hover:text-slate-900 transition-colors self-start md:self-center"
          >
            Encerrar Sessão
          </button>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de lotes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{totalLots}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lotes Exibidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{lots.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Última Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-slate-700">{dateTime(latestSync)}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status do Coletor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-lg font-bold ${failures > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {failures > 0 ? `${failures} falhas registradas` : 'Operante'}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Oportunidades Ativas</h2>
            {activeFiltersCount > 0 ? (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800"
              >
                Limpar {activeFiltersCount} Filtro{activeFiltersCount > 1 ? 's' : ''}
              </button>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 shadow-[inset_0_-1px_0_0_rgba(226,232,240,1)]">
                <tr>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">{columnHeader("Descrição", "title")}</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">{columnHeader("Origem", "source_key")}</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">{columnHeader("Setor", "category")}</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">{columnHeader("Região", "location")}</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">Em Atualização</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">Conferência</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">{columnHeader("Estado", "status")}</th>
                  <th className="px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">Sincronia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lots.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-24 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Search size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">Nenhum lote encontrado</h3>
                        <p className="mt-2 text-sm max-w-sm text-center">
                          Não encontramos nenhum leilão com os filtros atuais. Tente limpar a busca e tentar de novo.
                        </p>
                        {activeFiltersCount > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-xl transition-colors font-bold text-sm"
                          >
                            Limpar Filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-800 text-sm max-w-sm truncate" title={lot.title}>{lot.title}</td>
                      <td className="px-5 py-4">
                        <span className="bg-slate-100 text-slate-600 text-[10px] tracking-wider px-2 py-1 flex items-center w-max rounded font-bold uppercase">
                          {lot.source_key}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-slate-600 text-xs font-medium capitalize w-max flex items-center gap-1">
                          {lot.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {[lot.city, lot.state].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-5 py-4 text-emerald-700 font-bold text-sm">{currency(lot.min_bid)}</td>
                      <td className="px-5 py-4">
                        {lot.lot_url ? (
                          <a
                            href={lot.lot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                          >
                            Abrir Anúncio <Search size={12} />
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] tracking-wider px-2 py-1 rounded font-bold uppercase w-max flex items-center gap-1 ${lot.status === 'ACTIVE' || lot.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lot.status === 'ACTIVE' || lot.status === 'OPEN' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {lot.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-xs">{dateTime(lot.updated_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-slate-600 font-medium">
              Mostrando {pageStart} a {pageEnd} de {totalLots} lotes
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Anterior
              </button>
              <p className="text-sm font-semibold text-slate-700">
                Página {currentPage} de {totalPages}
              </p>
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
