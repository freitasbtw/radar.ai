"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, MapPin, Calendar, ExternalLink, LogOut } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  image_url: string | null;
  appraisal_value: number | null;
  description: string | null;
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
  orderBy: string;
};

const INITIAL_FILTERS: LotFilters = {
  title: "",
  source_key: "",
  category: "",
  location: "",
  status: "",
  orderBy: "recent",
};

function currency(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "R$ -";
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

const PAGE_SIZE = 24; 
const ORDER_BY_OPTIONS = [
  "recent",
  "min_bid_asc",
  "min_bid_desc",
  "appraisal_desc",
  "auction_date_asc",
  "auction_date_desc",
  "spread_desc",
  "spread_asc",
] as const;

type SearchParamsReader = {
  get(name: string): string | null;
};

function parseDashboardStateFromQuery(searchParams: SearchParamsReader): {
  page: number;
  filters: LotFilters;
} {
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const orderByCandidate = (searchParams.get("sort") ?? "recent").trim();
  const orderBy = ORDER_BY_OPTIONS.includes(orderByCandidate as (typeof ORDER_BY_OPTIONS)[number])
    ? orderByCandidate
    : "recent";

  return {
    page,
    filters: {
      title: (searchParams.get("title") ?? "").trim(),
      source_key: (searchParams.get("source") ?? "").trim(),
      category: (searchParams.get("category") ?? "").trim(),
      location: (searchParams.get("location") ?? "").trim(),
      status: (searchParams.get("status") ?? "").trim(),
      orderBy,
    },
  };
}

function buildDashboardQueryString(filters: LotFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.title.trim()) params.set("title", filters.title.trim());
  if (filters.source_key.trim()) params.set("source", filters.source_key.trim());
  if (filters.category.trim()) params.set("category", filters.category.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  if (filters.status.trim()) params.set("status", filters.status.trim());
  if (filters.orderBy !== "recent") params.set("sort", filters.orderBy);
  if (page > 1) params.set("page", String(page));

  return params.toString();
}

function areFiltersEqual(a: LotFilters, b: LotFilters): boolean {
  return (
    a.title === b.title &&
    a.source_key === b.source_key &&
    a.category === b.category &&
    a.location === b.location &&
    a.status === b.status &&
    a.orderBy === b.orderBy
  );
}

function hasActiveFilters(filters: LotFilters): boolean {
  return Boolean(
    filters.title.trim() ||
      filters.source_key.trim() ||
      filters.category.trim() ||
      filters.location.trim() ||
      filters.status.trim() ||
      filters.orderBy !== "recent"
  );
}

function toLikePattern(value: string): string {
  const normalized = value.trim().replaceAll("%", "").replaceAll("_", "");
  return `%${normalized}%`;
}

function calculateSpread(appraisal: number | null, bid: number | null): { percent: number; formatted: string } | null {
  if (!appraisal || !bid || appraisal <= 0 || bid >= appraisal) return null;
  const rawSpread = appraisal - bid;
  const percent = Math.round((rawSpread / bid) * 100);
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rawSpread);
  return { percent, formatted };
}

export default function DashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const pollStateLoadedRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);
  const resultsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const initialQueryState = useMemo(() => parseDashboardStateFromQuery(searchParams), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lots, setLots] = useState<DashboardLot[]>([]);
  const [pollState, setPollState] = useState<PollState[]>([]);
  const [totalLots, setTotalLots] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(initialQueryState.page);
  const [filters, setFilters] = useState<LotFilters>({ ...initialQueryState.filters });
  const [filterDraft, setFilterDraft] = useState<LotFilters>({ ...initialQueryState.filters });

  const syncUrlState = useCallback(
    (nextFilters: LotFilters, nextPage: number) => {
      const query = buildDashboardQueryString(nextFilters, nextPage);
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    },
    [pathname, router]
  );

  useEffect(() => {
    const nextState = parseDashboardStateFromQuery(searchParams);
    setCurrentPage((prev) => (prev === nextState.page ? prev : nextState.page));
    setFilters((prev) => (areFiltersEqual(prev, nextState.filters) ? prev : nextState.filters));
    setFilterDraft((prev) => (areFiltersEqual(prev, nextState.filters) ? prev : nextState.filters));
  }, [searchParams]);

  useEffect(() => {
    let isActive = true;

    async function loadDashboardData() {
      const isInitialLoad = !hasLoadedOnceRef.current;
      setError(null);
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        if (!supabase) {
          if (!isActive) return;
          setError(
            "Supabase não configurado no frontend. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em frontend/.env.local"
          );
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (!isActive) return;
        if (!sessionData.session) {
          router.replace("/auth/login");
          return;
        }

        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let lotsQuery = supabase
          .from("auction_lots")
          .select("id,source_key,title,category,status,city,state,min_bid,lot_url,auction_date,updated_at,image_url,appraisal_value,description", {
            count: "exact",
          });

        if (filters.orderBy === "min_bid_asc") {
          lotsQuery = lotsQuery.order("min_bid", { ascending: true, nullsFirst: false });
        } else if (filters.orderBy === "min_bid_desc") {
          lotsQuery = lotsQuery.order("min_bid", { ascending: false, nullsFirst: false });
        } else if (filters.orderBy === "appraisal_desc") {
          lotsQuery = lotsQuery.order("appraisal_value", { ascending: false, nullsFirst: false });
        } else if (filters.orderBy === "auction_date_asc") {
          lotsQuery = lotsQuery.order("auction_date", { ascending: true, nullsFirst: false });
        } else if (filters.orderBy === "auction_date_desc") {
          lotsQuery = lotsQuery.order("auction_date", { ascending: false, nullsFirst: false });
        } else if (filters.orderBy === "spread_desc") {
          lotsQuery = lotsQuery.order("spread_percent", { ascending: false, nullsFirst: false });
        } else if (filters.orderBy === "spread_asc") {
          lotsQuery = lotsQuery.order("spread_percent", { ascending: true, nullsFirst: false });
        } else {
          lotsQuery = lotsQuery.order("updated_at", { ascending: false });
        }

        if (filters.title) lotsQuery = lotsQuery.ilike("title", toLikePattern(filters.title));
        if (filters.source_key) lotsQuery = lotsQuery.ilike("source_key", toLikePattern(filters.source_key));
        if (filters.category) lotsQuery = lotsQuery.ilike("category", toLikePattern(filters.category));
        if (filters.status) lotsQuery = lotsQuery.ilike("status", toLikePattern(filters.status));
        if (filters.location) {
          if (filters.location.length === 2) {
             lotsQuery = lotsQuery.eq("state", filters.location);
          } else {
             const locationLike = toLikePattern(filters.location);
             lotsQuery = lotsQuery.or(`city.ilike.${locationLike},state.ilike.${locationLike}`);
          }
        }

        const lotsPromise = lotsQuery.range(from, to);

        const pollPromise = pollStateLoadedRef.current
          ? Promise.resolve({ data: null, error: null })
          : supabase
              .from("source_poll_state")
              .select("source_key,last_success_at,consecutive_failures,next_poll_at")
              .order("source_key", { ascending: true });

        const [lotsResponse, pollResponse] = await Promise.all([lotsPromise, pollPromise]);
        if (!isActive) return;

        if (lotsResponse.error) {
          setError(lotsResponse.error.message);
          return;
        }

        if (pollResponse.error) {
          setError(pollResponse.error.message);
          return;
        }

        setLots((lotsResponse.data ?? []) as DashboardLot[]);
        if (!pollStateLoadedRef.current && pollResponse.data) {
          setPollState((pollResponse.data ?? []) as PollState[]);
          pollStateLoadedRef.current = true;
        }
        setTotalLots(lotsResponse.count ?? 0);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Erro inesperado ao carregar os lotes.");
      } finally {
        if (!isActive) return;
        if (isInitialLoad) {
          setLoading(false);
          hasLoadedOnceRef.current = true;
        }
        setIsRefreshing(false);
      }
    }

    loadDashboardData();
    return () => {
      isActive = false;
    };
  }, [currentPage, filters, router, supabase]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  const totalPages = Math.max(1, Math.ceil(totalLots / PAGE_SIZE));

  function applyFilter() {
    const nextFilters: LotFilters = {
      ...filterDraft,
      title: filterDraft.title.trim(),
      source_key: filterDraft.source_key.trim(),
      category: filterDraft.category.trim(),
      location: filterDraft.location.trim(),
      status: filterDraft.status.trim(),
    };
    setCurrentPage(1);
    setFilterDraft(nextFilters);
    setFilters(nextFilters);
    syncUrlState(nextFilters, 1);
  }

  function clearAllFilters() {
    const nextFilters = { ...INITIAL_FILTERS };
    setCurrentPage(1);
    setFilterDraft(nextFilters);
    setFilters(nextFilters);
    syncUrlState(nextFilters, 1);
  }

  function goToPage(nextPage: number) {
    const boundedPage = Math.max(1, Math.min(totalPages, nextPage));
    if (boundedPage === currentPage) return;
    setCurrentPage(boundedPage);
    syncUrlState(filters, boundedPage);
    resultsHeadingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10 flex items-center justify-center">
         <div className="text-xl font-bold text-slate-500 animate-pulse">Carregando oportunidades…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center">
          <div className="text-red-500 mb-4 flex justify-center"><X size={48} /></div>
          <h1 className="text-2xl font-black mb-3">Falha ao carregar</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold">
            Tentar Novamente
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-800">
              RADAR<span className="text-blue-600">SP</span>
            </span>
          </div>
          <Button
            onClick={signOut}
            className="text-sm font-bold transition flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-300"
          >
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="relative">
            <label htmlFor="dashboard-search" className="sr-only">
              Buscar por título do lote
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              id="dashboard-search"
              name="title"
              autoComplete="off"
              className="h-14 bg-slate-50 text-lg pl-12 pr-4 w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 shadow-inner" 
              placeholder="Encontre sua próxima oportunidade (ex: apartamento em São Paulo)…" 
              value={filterDraft.title}
              onChange={(e) => setFilterDraft(f => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label htmlFor="dashboard-filter-location" className="text-xs font-semibold text-slate-500">
                Local
              </label>
              <select
                id="dashboard-filter-location"
                name="location"
                aria-label="Filtrar por local"
                className="h-12 w-full bg-slate-50 text-sm text-slate-700 px-4 outline-none ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none font-medium hover:bg-slate-100 transition-colors"
                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="%2364748b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>')`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                value={filterDraft.location}
                onChange={(e) => setFilterDraft((f) => ({ ...f, location: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              >
                <option value="">Qualquer Local</option>
                <option value="SP">São Paulo (SP)</option>
                <option value="RJ">Rio de Janeiro (RJ)</option>
                <option value="MG">Minas Gerais (MG)</option>
                <option value="PR">Paraná (PR)</option>
                <option value="RS">Rio Grande do Sul (RS)</option>
                <option value="SC">Santa Catarina (SC)</option>
                <option value="BA">Bahia (BA)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="dashboard-filter-source" className="text-xs font-semibold text-slate-500">
                Origem
              </label>
              <select
                id="dashboard-filter-source"
                name="source"
                aria-label="Filtrar por origem"
                className="h-12 w-full bg-slate-50 text-sm text-slate-700 px-4 outline-none ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none font-medium hover:bg-slate-100 transition-colors"
                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="%2364748b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>')`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                value={filterDraft.source_key}
                onChange={(e) => setFilterDraft((f) => ({ ...f, source_key: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              >
                <option value="">Todas as Origens</option>
                <option value="caixa">Caixa Econômica</option>
                <option value="receita">Receita Federal</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="dashboard-filter-sort" className="text-xs font-semibold text-slate-500">
                Ordenação
              </label>
              <select
                id="dashboard-filter-sort"
                name="sort"
                aria-label="Ordenar resultados"
                className="h-12 w-full bg-slate-50 text-sm text-slate-700 px-4 outline-none ring-1 ring-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none font-medium hover:bg-slate-100 transition-colors"
                style={{ backgroundImage: `url('data:image/svg+xml;charset=US-ASCII,<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><path d="M4 6l4 4 4-4" stroke="%2364748b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>')`, backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
                value={filterDraft.orderBy}
                onChange={(e) => setFilterDraft((f) => ({ ...f, orderBy: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              >
                <option value="recent">Mais Recentes</option>
                <option value="min_bid_asc">Menor Lance Inicial</option>
                <option value="min_bid_desc">Maior Lance Inicial</option>
                <option value="appraisal_desc">Maior Avaliação</option>
                <option value="auction_date_asc">Data mais próxima</option>
                <option value="auction_date_desc">Data mais distante</option>
                <option value="spread_desc">Maior Spread (Margem)</option>
                <option value="spread_asc">Menor Spread (Margem)</option>
              </select>
            </div>

            <div className="md:col-span-1 lg:col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold text-slate-500">Ações</span>
              <div className="flex gap-3 h-12">
                <Button
                  onClick={applyFilter}
                  disabled={isRefreshing}
                  aria-busy={isRefreshing}
                  className="h-full flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all"
                >
                  {isRefreshing ? "Atualizando…" : "Filtrar Resultados"}
                </Button>
                {hasActiveFilters(filters) && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    aria-label="Limpar todos os filtros"
                    title="Limpar todos os filtros"
                    className="h-full px-4 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-semibold"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">Limpar filtros</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-between items-end gap-4">
          <div>
            <h1 ref={resultsHeadingRef} className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              Oportunidades Encontradas
            </h1>
            <p className="text-sm text-slate-600 mt-1 tabular-nums">{totalLots} imóveis e bens disponíveis</p>
          </div>
          {isRefreshing && (
            <p role="status" aria-live="polite" className="text-sm font-semibold text-blue-700 animate-pulse">
              Atualizando resultados…
            </p>
          )}
        </div>

        {lots.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700">Nenhum lote encontrado</h2>
            <p className="text-slate-500 mt-2">Tente mudar seus filtros de busca para ver mais resultados.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lots.map((lot) => {
              const spread = calculateSpread(lot.appraisal_value, lot.min_bid);
              
              const defaultImage = lot.source_key.includes('receita') 
                ? "https://www25.receita.fazenda.gov.br/sle-sociedade/assets/logo_receita.jpeg" 
                : lot.source_key.includes('caixa') 
                  ? "https://i.pinimg.com/736x/ae/3d/94/ae3d9448e7a543b4ad94870b9a1dcfa9.jpg" 
                  : "https://placehold.co/400x300/e2e8f0/64748b?text=Sem+Foto";

              return (
                <div key={lot.id} className="bg-white group rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                  
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 uppercase tracking-widest">
                      {lot.category === 'real_estate' ? 'Imóvel' : lot.category === 'vehicle' ? 'Veículo' : 'Lote'}
                    </div>
                    {lot.image_url ? (
                      <img 
                        src={lot.image_url} 
                        alt={lot.title} 
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                           e.currentTarget.src = defaultImage;
                        }}
                      />
                    ) : (
                      <img 
                        src={defaultImage} 
                        alt={lot.title} 
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1 space-y-2">
                       <h2 className="font-bold text-slate-800 leading-snug line-clamp-2 text-balance" title={lot.title}>
                         {lot.title}
                       </h2>
                       
                       <div className="flex items-center text-xs text-slate-500 gap-1.5">
                         <MapPin className="w-3.5 h-3.5" />
                         <span className="truncate">{[lot.city, lot.state].filter(Boolean).join(" - ") || "Local não informado"}</span>
                       </div>

                       <div className="flex items-center text-xs text-slate-500 gap-1.5">
                         <Calendar className="w-3.5 h-3.5" />
                         <span>{lot.auction_date ? new Date(lot.auction_date).toLocaleDateString('pt-BR') : "Data indefinida"}</span>
                       </div>
                       
                       {lot.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                            {lot.description}
                          </p>
                       )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                       {lot.appraisal_value && lot.appraisal_value > (lot.min_bid || 0) && (
                         <div className="flex flex-col text-sm">
                           <span className="text-slate-500 font-medium">
                             Avaliado em <span className="font-bold text-slate-700">{currency(lot.appraisal_value)}</span>
                           </span>
                           {spread && (
                              <span className="text-emerald-700 font-bold mt-0.5 tabular-nums">
                                Margem / Spread: +{spread.percent}% ({spread.formatted})
                              </span>
                            )}
                         </div>
                       )}
                       <div className="flex items-center justify-between mt-1">
                         <div className="flex flex-col">
                            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wide">Lance Atual/Inicial</span>
                            <span className="text-lg font-black text-slate-900 tabular-nums">
                              {currency(lot.min_bid)}
                            </span>
                          </div>
                       </div>
                       
                       {lot.lot_url && (
                          <a 
                            href={lot.lot_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-3 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                          >
                            Ver Lote <ExternalLink className="w-4 h-4" />
                          </a>
                       )}
                    </div>

                  </div>
                </div>
              );
            })}
          </section>
        )}

        {totalLots > 0 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1 || isRefreshing}
              className="font-bold border-slate-300"
            >
              Anterior
            </Button>
            <span className="text-sm font-bold text-slate-600 tabular-nums">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isRefreshing}
              className="font-bold border-slate-300"
            >
              Próximo
            </Button>
          </div>
        )}

      </div>
    </main>
  );
}
