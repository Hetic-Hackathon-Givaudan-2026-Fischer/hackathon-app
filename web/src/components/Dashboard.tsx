import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { INITIAL_FLAVOR_TRENDS, PIPELINE_STAGES, QUICK_STATS } from '../data';
import type { FlavorTrend, MaturityLevel } from '../types';
import { BacktestChart, Sparkline } from './Charts';

type SortKey =
  | 'name'
  | 'category'
  | 'overallPresencePercent'
  | 'mirofishPerennity'
  | 'tiktokPresence'
  | 'youtubePresence'
  | 'pressPresence'
  | 'googlePresence';

interface DashboardProps {
  onEnter3D: () => void;
}

/**
 * Couleurs sémantiques de statut (Section 2.4 du Design System Givaudan).
 */
function maturityBadgeStyle(maturity: MaturityLevel): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (maturity) {
    case 'Established Trend':
      // Succès / Gagné : #ECFDF5 / #047857
      return { bg: '#ECFDF5', text: '#047857', dot: '#047857' };
    case 'Growing Trend':
      // En Cours / Lead : #EFF6FF / #1D4ED8
      return { bg: '#EFF6FF', text: '#1D4ED8', dot: '#1D4ED8' };
    case 'Hype':
      // Attention / Risque : #FFFBEB / #B45309
      return { bg: '#FFFBEB', text: '#B45309', dot: '#B45309' };
    case 'Emerging Signal':
      // Active Beauty / Signal Teal : #E6F2F1 / #008075
      return { bg: '#E6F2F1', text: '#008075', dot: '#008075' };
  }
}

/**
 * Badges de Catégorie & Division (Section 5.4 du Design System Givaudan).
 */
function categoryBadgeStyle(category: string): { bg: string; text: string } {
  const lower = category.toLowerCase();
  if (lower.includes('apéro') || lower.includes('sauce')) {
    // Division Flavours : #FEF3C7 / #D97706
    return { bg: '#FEF3C7', text: '#D97706' };
  }
  if (lower.includes('lait')) {
    // Active Beauty / Dairy Teal : #E6F2F1 / #008075
    return { bg: '#E6F2F1', text: '#008075' };
  }
  // Division Fragrances / Sweet Indulgence : #FDF2F8 / #DB2777
  return { bg: '#FDF2F8', text: '#DB2777' };
}

/**
 * Couleur de jauge MiroFish selon les tokens Givaudan (#008075, #C29B38, #C86D51).
 */
function perennityColor(score: number): string {
  if (score >= 80) return '#008075';
  if (score >= 45) return '#C29B38';
  return '#C86D51';
}

function formatPercent(val: number): string {
  return `${Number.isInteger(val) ? val : val.toFixed(1)}%`;
}

function buildFallbackInsight(trend: FlavorTrend, question: string): string {
  return `Synthèse MiroFish pour « ${trend.name} » (${trend.maturity}, pérennité ${trend.mirofishPerennity}/100) en réponse à "${question}" : Avec une présence globale de ${trend.overallPresencePercent}% et une précision de backtesting historique de ${trend.backtesting.directionalAccuracy}%, nous recommandons de cibler le segment "${trend.consumerProfiles[0]?.segment ?? 'Gourmets'}" en capitalisant sur "${trend.favorableFactors[0] ?? 'la signature aromatique naturelle'}".`;
}

const KPI_VARIATIONS: Record<string, { badge: string; positive: boolean }> = {
  turnover: { badge: '+12.4% vs mois dernier', positive: true },
  'new-flavors': { badge: '+2 signaux qualifiés', positive: true },
  perennity: { badge: 'Validé sur 24 mois (R² 0.91)', positive: true },
};

export function Dashboard({ onEnter3D }: DashboardProps) {
  const [subView, setSubView] = useState<'dashboard' | 'saved'>('dashboard');
  const [trends, setTrends] = useState<FlavorTrend[]>(INITIAL_FLAVOR_TRENDS);
  const [savedIds, setSavedIds] = useState<string[]>([
    'bbq',
    'pistache',
    'matcha',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMarket, setSelectedMarket] = useState('ALL');
  const [selectedMaturity, setSelectedMaturity] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('overallPresencePercent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const [runningPipelineStep, setRunningPipelineStep] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiStatusText, setApiStatusText] = useState(
    'MiroFish Multi-Agents · Actif',
  );
  const [aiCopilotQuestion, setAiCopilotQuestion] = useState('');
  const [aiCopilotAnswer, setAiCopilotAnswer] = useState<string | null>(null);
  const [aiCopilotLoading, setAiCopilotLoading] = useState(false);

  const [newFlavorName, setNewFlavorName] = useState('');
  const [newCategory, setNewCategory] = useState(
    'Produit apéro, sauces et condiments',
  );
  const [newMarket, setNewMarket] = useState<FlavorTrend['market']>('Europe');

  useEffect(() => {
    void fetch('/api/v1/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((status: { db?: string } | null) => {
        if (status?.db) {
          setApiStatusText(`API Connectée · ${status.db}`);
        }
      })
      .catch(() => undefined);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(trends.map((t) => t.category))),
    [trends],
  );

  const filteredTrends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base =
      subView === 'saved'
        ? trends.filter((t) => savedIds.includes(t.id))
        : trends;

    return base
      .filter((item) => {
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.maturity.toLowerCase().includes(q);
        const matchesCat =
          selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesMarket =
          selectedMarket === 'ALL' || item.market === selectedMarket;
        const matchesMaturity =
          selectedMaturity === 'ALL' || item.maturity === selectedMaturity;
        return matchesSearch && matchesCat && matchesMarket && matchesMaturity;
      })
      .sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        const cmp =
          typeof valA === 'string' && typeof valB === 'string'
            ? valA.localeCompare(valB, 'fr')
            : Number(valA) - Number(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [
    trends,
    subView,
    savedIds,
    searchQuery,
    selectedCategory,
    selectedMarket,
    selectedMaturity,
    sortKey,
    sortDir,
  ]);

  const selectedTrend = useMemo(
    () => trends.find((t) => t.id === selectedTrendId) ?? null,
    [trends, selectedTrendId],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function toggleBookmark(id: string) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleRunSimulation(e: FormEvent) {
    e.preventDefault();
    const flavorName = newFlavorName.trim();
    if (!flavorName) return;

    setIsModalOpen(false);
    setNewFlavorName('');
    let step = 0;
    setRunningPipelineStep(0);

    const timer = window.setInterval(() => {
      step += 1;
      if (step < PIPELINE_STAGES.length) {
        setRunningPipelineStep(step);
      } else {
        window.clearInterval(timer);
        setRunningPipelineStep(null);

        const id = `${flavorName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const created: FlavorTrend = {
          id,
          name: flavorName,
          category: newCategory,
          market: newMarket,
          overallPresencePercent: 4.5,
          mirofishPerennity: 82,
          tiktokPresence: 34,
          youtubePresence: 28,
          pressPresence: 18,
          googlePresence: 22,
          maturity: 'Growing Trend',
          growthPotentialPercent: 48,
          summary: `Analyse multi-agents MiroFish nouvellement générée pour ${flavorName} sur le marché ${newMarket}. Convergence solide des signaux digitaux et rétention simulée à 82/100 sur 12 mois.`,
          favorableFactors: [
            `Forte traction organique sur TikTok (34) et YouTube (28) pour ${flavorName}`,
            `Excellente complémentarité aromatique dans la catégorie ${newCategory}`,
          ],
          riskFactors: [
            'Nécessite un calibrage sensoriel précis pour garantir le réachat grand public',
          ],
          consumerProfiles: [
            {
              segment: 'Early Adopters & Explorateurs Aromatiques',
              ageRange: '20–38 ans',
              affinityScore: 90,
              usageOccasion: `Dégustation innovation ${newCategory.toLowerCase()}`,
            },
          ],
          mirofishAgents: [
            {
              persona: 'Explorateurs Digitaux (Cluster A)',
              sharePercent: 45,
              adoptionRate: 88,
              retentionRate: 84,
              verdict: 'Adoption rapide et recommandation élevée',
            },
            {
              persona: 'Consommateurs Réguliers (Cluster B)',
              sharePercent: 35,
              adoptionRate: 74,
              retentionRate: 80,
              verdict: 'Bonne rétention après ajustement du dosage aromatique',
            },
            {
              persona: 'Acheteurs Retail (Cluster C)',
              sharePercent: 20,
              adoptionRate: 79,
              retentionRate: 82,
              verdict:
                'Intérêt confirmé pour un référencement gamme permanente',
            },
          ],
          backtesting: {
            windowMonths: 24,
            directionalAccuracy: 91.0,
            mae: 0.6,
            correlationR2: 0.9,
            validationSummary: `Validation historique positive sur les arômes analogues de la famille ${flavorName} au cours des 24 derniers mois.`,
            historicalSeries: [
              {
                period: 'T1 N-1',
                observed: 1.8,
                predicted: 1.9,
                lowerBound: 1.4,
                upperBound: 2.4,
              },
              {
                period: 'T2 N-1',
                observed: 2.4,
                predicted: 2.5,
                lowerBound: 2.0,
                upperBound: 3.0,
              },
              {
                period: 'T3 N-1',
                observed: 3.1,
                predicted: 3.0,
                lowerBound: 2.4,
                upperBound: 3.6,
              },
              {
                period: 'T4 N-1',
                observed: 3.8,
                predicted: 3.9,
                lowerBound: 3.3,
                upperBound: 4.5,
              },
              {
                period: 'Actuel',
                observed: 4.5,
                predicted: 4.4,
                lowerBound: 3.8,
                upperBound: 5.0,
              },
              {
                period: '+6 mois',
                predicted: 5.6,
                lowerBound: 4.8,
                upperBound: 6.4,
              },
              {
                period: '+12 mois',
                predicted: 6.7,
                lowerBound: 5.7,
                upperBound: 7.7,
              },
            ],
          },
          confidence: {
            overallScore: 89,
            sourceConvergence: 90,
            historicalBacktestScore: 91,
            agentConsensusScore: 86,
            justifications: [
              'Signaux multi-plateformes cohérents sans anomalie spéculative',
              'Backtesting validé à 91% sur 8 trimestres glissants',
            ],
          },
          aisle3D: `Rayon Innovation ${newCategory} (Allée D1)`,
        };

        setTrends((prev) => [created, ...prev]);
        setSelectedTrendId(created.id);
      }
    }, 260);
  }

  async function handleAskAiCopilot(e: FormEvent) {
    e.preventDefault();
    if (!selectedTrend || !aiCopilotQuestion.trim()) return;
    const questionText = aiCopilotQuestion.trim();
    setAiCopilotLoading(true);

    try {
      const response = await fetch('/api/v1/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `[Contexte Givaudan - Arôme ${selectedTrend.name} (${selectedTrend.category}), Maturité: ${selectedTrend.maturity}, Pérennité MiroFish: ${selectedTrend.mirofishPerennity}/100] ${questionText}`,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { answer: string };
        setAiCopilotAnswer(data.answer);
      } else {
        setAiCopilotAnswer(buildFallbackInsight(selectedTrend, questionText));
      }
    } catch {
      setAiCopilotAnswer(buildFallbackInsight(selectedTrend, questionText));
    } finally {
      setAiCopilotLoading(false);
    }
  }

  const cardShadow =
    'shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_-1px_rgba(0,0,0,0.05)]';

  return (
    <div
      style={{
        fontFamily:
          "'Inter', 'Plus Jakarta Sans', 'Avenir Next', system-ui, -apple-system, sans-serif",
      }}
      className="fixed inset-0 z-30 flex overflow-hidden bg-[#FAFAFA] text-[#111111]"
    >
      {/* 4.1. Sidebar Gauche (256px fixe sur desktop, #111111 Noir Givaudan moderne) */}
      <aside
        aria-label="Navigation principale Givaudan CRM"
        className="flex w-[72px] shrink-0 flex-col justify-between bg-[#111111] text-white lg:w-[256px]"
      >
        <div>
          {/* Identité de marque Givaudan */}
          <div className="flex h-[64px] items-center gap-3 border-b border-white/10 px-4 lg:px-6">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#008075] text-[15px] font-semibold tracking-tight text-white">
              G
            </span>
            <div className="hidden flex-col lg:flex">
              <span className="text-[15px] leading-tight font-semibold tracking-tight text-white">
                GIVAUDAN
              </span>
              <span className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                Taste & Wellbeing CRM
              </span>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="px-3 pt-6">
            <div className="mb-2 hidden px-3 text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase lg:block">
              Intelligence Arômes
            </div>
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setSubView('dashboard')}
                className={`flex h-10 w-full cursor-pointer items-center gap-3 rounded-[6px] px-3 text-[14px] font-medium transition ${
                  subView === 'dashboard'
                    ? 'bg-[#008075] text-white'
                    : 'text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white'
                }`}
                title="Saveurs en tendance & KPI"
              >
                <svg
                  className="size-[18px] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" />
                </svg>
                <span className="hidden truncate lg:inline">
                  Tendances & Signaux
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('saved')}
                className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-[6px] px-3 text-[14px] font-medium transition ${
                  subView === 'saved'
                    ? 'bg-[#008075] text-white'
                    : 'text-[#A1A1AA] hover:bg-[#1F1F1F] hover:text-white'
                }`}
                title="Rapports & Saveurs sauvegardés"
              >
                <span className="flex items-center gap-3 truncate">
                  <svg
                    className="size-[18px] shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="hidden truncate lg:inline">
                    Portefeuille Favoris
                  </span>
                </span>
                <span
                  className={`hidden rounded-full px-2 py-0.5 text-[11px] font-medium lg:inline-block ${
                    subView === 'saved'
                      ? 'bg-white/20 text-white'
                      : 'bg-[#1F1F1F] text-[#A1A1AA]'
                  }`}
                >
                  {savedIds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={onEnter3D}
                className="mt-2 flex h-10 w-full cursor-pointer items-center justify-between rounded-[6px] border border-white/15 bg-[#1F1F1F]/60 px-3 text-[14px] font-medium text-white transition hover:border-[#008075] hover:bg-[#1F1F1F]"
                title="Basculer vers l'expérience Magasin 3D"
              >
                <span className="flex items-center gap-3 truncate">
                  <svg
                    className="size-[18px] shrink-0 text-[#008075]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 9l1.5-5h15L21 9" />
                    <path d="M3 9c0 1.657 1.343 3 3 3s3-1.343 3-3c0 1.657 1.343 3 3 3s3-1.343 3-3c0 1.657 1.343 3 3 3s3-1.343 3-3" />
                    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
                  </svg>
                  <span className="hidden truncate lg:inline">
                    Expérience Magasin 3D
                  </span>
                </span>
                <span className="hidden rounded-full bg-[#E6F2F1] px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-[#008075] uppercase lg:inline-block">
                  3D
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Pied de Sidebar : Statut moteur MiroFish */}
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="rounded-[8px] bg-[#1F1F1F] p-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-white">
              <span className="size-2 rounded-full bg-[#008075]" />
              <span className="truncate">{apiStatusText}</span>
            </div>
            <p className="mt-1 text-[11px] leading-[1.4] text-[#71717A]">
              Simulation multi-agents & Backtesting historique sur 24 mois.
            </p>
          </div>
        </div>
      </aside>

      {/* Colonne principale : Topbar 64px + Zone de contenu scrollable */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 4.1. Topbar (Hauteur 64px, fond #FFFFFF, bordure #E5E7EB) */}
        <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 lg:px-8">
          {/* Fil d'Ariane (Breadcrumb) */}
          <div className="flex items-center gap-2 text-[14px]">
            <span className="text-[#71717A]">Divisions</span>
            <span className="text-[#71717A]">/</span>
            <span className="text-[#71717A]">Flavours</span>
            <span className="text-[#71717A]">/</span>
            <span className="font-medium text-[#18181B]">
              {subView === 'saved'
                ? 'Portefeuille Favoris'
                : 'Détection & Pérennité des Arômes'}
            </span>
          </div>

          {/* Barre de recherche globale & Actions utilisateur */}
          <div className="flex items-center gap-4">
            <div className="relative w-[260px] sm:w-[340px]">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une formulation, un arôme, une catégorie…"
                aria-label="Rechercher une saveur"
                className="h-9 w-full rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] pr-9 pl-3.5 text-[14px] text-[#18181B] placeholder-[#71717A] transition outline-none focus:border-[#008075] focus:ring-2 focus:ring-[#008075]/20"
              />
              <svg
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#71717A]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.2" y2="16.2" />
              </svg>
            </div>

            <button
              type="button"
              className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] text-[#3F3F46] transition hover:bg-[#F4F4F5]"
              title="Alertes de signaux émergents"
            >
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#C86D51]" />
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 border-l border-[#E5E7EB] pl-4">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#E6F2F1] text-[12px] font-semibold text-[#008075]">
                MT
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <span className="text-[12px] leading-tight font-medium text-[#18181B]">
                  Maxence Tari
                </span>
                <span className="text-[11px] text-[#71717A]">
                  Product Manager · HETIC
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 4.1. Zone de Contenu Principale (Padding 32px PC / 16px Mobile, Max-width 1600px centré) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="mx-auto max-w-[1600px] space-y-8">
            {/* En-tête de page (Heading 1 : 24px SemiBold #111111) */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-medium tracking-[0.05em] text-[#008075] uppercase">
                  Givaudan Flavours Division · Intelligence Multi-Agents
                </span>
                <h1 className="mt-1 text-[24px] leading-[1.3] font-semibold text-[#111111]">
                  Quick statistics & Détection des Tendances
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onEnter3D}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-4 text-[14px] font-medium text-[#3F3F46] transition hover:bg-[#F4F4F5]"
                >
                  <span>Explorer en 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[6px] bg-[#008075] px-4 text-[14px] font-medium text-white transition hover:bg-[#006960]"
                >
                  <span>+ Lancer une simulation MiroFish</span>
                </button>
              </div>
            </div>

            {/* 5.1. Cartes KPI (Quick statistics) : Bordure sup 3px #008075, Display 32px SemiBold */}
            <section aria-labelledby="quick-stats-heading">
              <h2 id="quick-stats-heading" className="sr-only">
                Quick statistics
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {QUICK_STATS.map((card, index) => {
                  const variation = KPI_VARIATIONS[card.id];
                  const topAccent =
                    index === 2
                      ? 'border-t-[#C86D51]'
                      : index === 1
                        ? 'border-t-[#C29B38]'
                        : 'border-t-[#008075]';

                  return (
                    <article
                      key={card.id}
                      className={`flex items-center justify-between gap-4 rounded-[8px] border border-[#E5E7EB] border-t-[3px] ${topAccent} bg-[#FFFFFF] p-6 ${cardShadow}`}
                    >
                      <div className="flex flex-col justify-between">
                        <span className="text-[12px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                          {card.label}
                        </span>
                        <div className="mt-2 text-[32px] leading-[1.2] font-semibold text-[#18181B]">
                          {card.value}
                        </div>
                        <span className="mt-1 text-[12px] text-[#3F3F46]">
                          {card.sublabel}
                        </span>
                        {variation && (
                          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-medium text-[#047857]">
                            {variation.badge}
                          </span>
                        )}
                      </div>
                      <Sparkline card={card} />
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Architecture modulaire (6 briques Data/IA) */}
            <section
              aria-label="Architecture modulaire Data & IA"
              className="grid grid-cols-2 gap-3 lg:grid-cols-6"
            >
              {PIPELINE_STAGES.map((stage, idx) => {
                const isRunning = runningPipelineStep === idx;
                return (
                  <div
                    key={stage.id}
                    className={`rounded-[8px] border p-3.5 transition ${cardShadow} ${
                      isRunning
                        ? 'border-[#008075] bg-[#E6F2F1]/60'
                        : 'border-[#E5E7EB] bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                      {stage.label}
                    </div>
                    <div className="mt-1 text-[14px] font-semibold text-[#008075]">
                      {stage.metric}
                    </div>
                    <div className="mt-1 text-[12px] leading-[1.4] text-[#3F3F46]">
                      {stage.description}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 5.2 & 5.3. Section Saveurs en tendance : Filtres facettés + CRM Data Table */}
            <section
              aria-labelledby="trends-heading"
              className={`rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] ${cardShadow}`}
            >
              {/* En-tête de table et filtres facettés */}
              <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2
                      id="trends-heading"
                      className="text-[18px] leading-[1.4] font-medium text-[#18181B]"
                    >
                      {subView === 'saved'
                        ? `Portefeuille de Saveurs Sauvegardées (${filteredTrends.length})`
                        : 'Saveurs en tendance'}
                    </h2>
                    <p className="mt-0.5 text-[12px] text-[#71717A]">
                      Sélectionnez une ligne pour consulter le rapport complet :
                      simulation multi-agents MiroFish, backtesting historique
                      et profils consommateurs.
                    </p>
                  </div>

                  {/* Sélecteurs de filtrage (Inputs #FFFFFF, bordure #E4E4E7, focus #008075) */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      aria-label="Filtrer par catégorie alimentaire"
                      className="h-9 cursor-pointer rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[12px] font-medium text-[#3F3F46] outline-none focus:border-[#008075] focus:ring-2 focus:ring-[#008075]/20"
                    >
                      <option value="ALL">Toutes les catégories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedMarket}
                      onChange={(e) => setSelectedMarket(e.target.value)}
                      aria-label="Filtrer par marché"
                      className="h-9 cursor-pointer rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[12px] font-medium text-[#3F3F46] outline-none focus:border-[#008075] focus:ring-2 focus:ring-[#008075]/20"
                    >
                      <option value="ALL">Marché : Global</option>
                      <option value="Europe">Marché : Europe</option>
                      <option value="Amérique du Nord">
                        Marché : Amérique du Nord
                      </option>
                      <option value="Asie-Pacifique">
                        Marché : Asie-Pacifique
                      </option>
                    </select>
                  </div>
                </div>

                {/* 5.3. Filtres Facettés (Pills sélectionnables par niveau de maturité) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                    Maturité :
                  </span>
                  {(
                    [
                      ['ALL', 'Tous les signaux'],
                      ['Established Trend', 'Established Trend'],
                      ['Growing Trend', 'Growing Trend'],
                      ['Hype', 'Hype'],
                      ['Emerging Signal', 'Emerging Signal'],
                    ] as const
                  ).map(([val, label]) => {
                    const active = selectedMaturity === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedMaturity(val)}
                        className={`cursor-pointer rounded-full px-3 py-1 text-[12px] font-medium transition ${
                          active
                            ? 'bg-[#008075] text-white'
                            : 'bg-[#F4F4F5] text-[#3F3F46] hover:bg-[#E4E4E7]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5.2. Tableau de Données CRM (Header #FAFAFA, 12px Medium #71717A uppercase, Lignes 52px+, hover #F9F9FB) */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                      {(
                        [
                          ['name', 'Saveurs'],
                          ['category', 'Catégories de produit'],
                          [
                            'overallPresencePercent',
                            'Présence toute source confondue',
                          ],
                          ['mirofishPerennity', 'Pérennité à un an (mirofish)'],
                          ['tiktokPresence', 'Présence tiktok'],
                          ['youtubePresence', 'Présence youtube'],
                          ['pressPresence', 'Présence presse'],
                          ['googlePresence', 'Présence google'],
                        ] as const
                      ).map(([key, label]) => (
                        <th
                          key={key}
                          onClick={() => toggleSort(key)}
                          className="cursor-pointer px-4 py-3.5 text-[12px] font-medium tracking-[0.05em] text-[#71717A] uppercase select-none hover:text-[#18181B]"
                        >
                          <div className="flex items-center gap-1">
                            <span>{label}</span>
                            {sortKey === key && (
                              <span className="text-[#008075]">
                                {sortDir === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-[14px]">
                    {filteredTrends.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-[14px] text-[#71717A]"
                        >
                          Aucune saveur ne correspond aux critères sélectionnés.
                        </td>
                      </tr>
                    ) : (
                      filteredTrends.map((item) => {
                        const isSelected = selectedTrendId === item.id;
                        const isSaved = savedIds.includes(item.id);
                        const matStyle = maturityBadgeStyle(item.maturity);
                        const catStyle = categoryBadgeStyle(item.category);

                        return (
                          <tr
                            key={item.id}
                            onClick={() => {
                              setSelectedTrendId(item.id);
                              setAiCopilotAnswer(null);
                            }}
                            className={`h-[56px] cursor-pointer transition ${
                              isSelected
                                ? 'bg-[#E6F2F1]/50'
                                : 'hover:bg-[#F9F9FB]'
                            }`}
                          >
                            {/* Saveur + Favori + Badge de maturité */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(item.id);
                                  }}
                                  title={
                                    isSaved
                                      ? 'Retirer du portefeuille'
                                      : 'Ajouter au portefeuille'
                                  }
                                  className={`cursor-pointer text-base leading-none transition ${
                                    isSaved
                                      ? 'text-[#C29B38]'
                                      : 'text-[#E4E4E7] hover:text-[#71717A]'
                                  }`}
                                >
                                  ★
                                </button>
                                <div>
                                  <div className="font-medium text-[#18181B]">
                                    {item.name}
                                  </div>
                                  <span
                                    style={{
                                      backgroundColor: matStyle.bg,
                                      color: matStyle.text,
                                    }}
                                    className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.05em] uppercase"
                                  >
                                    <span
                                      style={{ backgroundColor: matStyle.dot }}
                                      className="size-1.5 rounded-full"
                                    />
                                    {item.maturity}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Catégorie de produit (Badge Section 5.4) */}
                            <td className="px-4 py-3">
                              <span
                                style={{
                                  backgroundColor: catStyle.bg,
                                  color: catStyle.text,
                                }}
                                className="inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium"
                              >
                                {item.category}
                              </span>
                            </td>

                            {/* Présence toute source confondue */}
                            <td className="px-4 py-3 font-medium text-[#18181B]">
                              {formatPercent(item.overallPresencePercent)}
                            </td>

                            {/* Pérennité à un an (MiroFish) */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <span className="w-7 font-semibold text-[#18181B]">
                                  {item.mirofishPerennity}
                                </span>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F4F4F5]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${item.mirofishPerennity}%`,
                                      backgroundColor: perennityColor(
                                        item.mirofishPerennity,
                                      ),
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Capteurs par source */}
                            <td className="px-4 py-3 text-[#3F3F46]">
                              {item.tiktokPresence}
                            </td>
                            <td className="px-4 py-3 text-[#3F3F46]">
                              {item.youtubePresence}
                            </td>
                            <td className="px-4 py-3 text-[#3F3F46]">
                              {item.pressPresence}
                            </td>
                            <td className="px-4 py-3 text-[#3F3F46]">
                              {item.googlePresence}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Drawer latéral CRM : Rapport complet d'analyse de tendance (Style Minimaliste Suisse) */}
      {selectedTrend && (
        <div
          onClick={() => setSelectedTrendId(null)}
          className="fixed inset-0 z-50 flex justify-end bg-[#111111]/40 backdrop-blur-[1px]"
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            aria-label={`Rapport détaillé ${selectedTrend.name}`}
            className="flex h-screen w-[680px] max-w-[94vw] flex-col overflow-hidden border-l border-[#E5E7EB] bg-[#FFFFFF]"
          >
            {/* En-tête du Drawer */}
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] bg-[#FAFAFA] px-6 py-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-medium tracking-[0.05em] text-[#008075] uppercase">
                    Rapport d&apos;Intelligence Aromatique
                  </span>
                  <span className="text-[#E4E4E7]">•</span>
                  <span className="text-[12px] text-[#71717A]">
                    Marché {selectedTrend.market}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <h2 className="text-[24px] leading-[1.3] font-semibold text-[#111111]">
                    {selectedTrend.name}
                  </h2>
                  <span
                    style={{
                      backgroundColor: maturityBadgeStyle(
                        selectedTrend.maturity,
                      ).bg,
                      color: maturityBadgeStyle(selectedTrend.maturity).text,
                    }}
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.05em] uppercase"
                  >
                    {selectedTrend.maturity}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[#3F3F46]">
                  Catégorie : <strong>{selectedTrend.category}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrendId(null);
                    onEnter3D();
                  }}
                  className="h-8 cursor-pointer rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[12px] font-medium text-[#3F3F46] transition hover:bg-[#F4F4F5]"
                >
                  Voir en Rayon 3D
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTrendId(null)}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] text-[14px] text-[#3F3F46] transition hover:bg-[#F4F4F5]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps du rapport CRM */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {/* 1. Cartes métriques du rapport */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] p-3.5">
                  <div className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                    Présence globale
                  </div>
                  <div className="mt-1 text-[22px] font-semibold text-[#18181B]">
                    {formatPercent(selectedTrend.overallPresencePercent)}
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] p-3.5">
                  <div className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                    Pérennité MiroFish
                  </div>
                  <div
                    className="mt-1 text-[22px] font-semibold"
                    style={{
                      color: perennityColor(selectedTrend.mirofishPerennity),
                    }}
                  >
                    {selectedTrend.mirofishPerennity}/100
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] p-3.5">
                  <div className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                    Potentiel 12 mois
                  </div>
                  <div
                    className={`mt-1 text-[22px] font-semibold ${
                      selectedTrend.growthPotentialPercent >= 0
                        ? 'text-[#047857]'
                        : 'text-[#B91C1C]'
                    }`}
                  >
                    {selectedTrend.growthPotentialPercent > 0 ? '+' : ''}
                    {selectedTrend.growthPotentialPercent}%
                  </div>
                </div>

                <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] p-3.5">
                  <div className="text-[11px] font-medium tracking-[0.05em] text-[#71717A] uppercase">
                    Indice Confiance
                  </div>
                  <div className="mt-1 text-[22px] font-semibold text-[#18181B]">
                    {selectedTrend.confidence.overallScore}%
                  </div>
                </div>
              </div>

              {/* Synthèse exécutive */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[15px] font-medium text-[#18181B]">
                    Diagnostic Exécutif Givaudan
                  </h3>
                  <span className="text-[12px] text-[#71717A]">
                    {selectedTrend.aisle3D}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.5] text-[#3F3F46]">
                  {selectedTrend.summary}
                </p>
              </section>

              {/* 2. Backtesting Historique (24 mois) & Forecasting */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[15px] font-medium text-[#18181B]">
                    Backtesting Historique (
                    {selectedTrend.backtesting.windowMonths} mois) & Forecasting
                  </h3>
                  <span className="rounded-full bg-[#E6F2F1] px-2.5 py-0.5 text-[11px] font-medium text-[#008075]">
                    Observé (#C86D51) vs Prédit (#008075)
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-6 rounded-[6px] bg-[#FAFAFA] px-3.5 py-2 text-[12px] text-[#3F3F46]">
                  <span>
                    Précision directionnelle :{' '}
                    <strong className="text-[#18181B]">
                      {selectedTrend.backtesting.directionalAccuracy}%
                    </strong>
                  </span>
                  <span>
                    Erreur absolue (MAE) :{' '}
                    <strong className="text-[#18181B]">
                      ±{selectedTrend.backtesting.mae} pt
                    </strong>
                  </span>
                  <span>
                    Corrélation (R²) :{' '}
                    <strong className="text-[#18181B]">
                      {selectedTrend.backtesting.correlationR2}
                    </strong>
                  </span>
                </div>

                <BacktestChart
                  series={selectedTrend.backtesting.historicalSeries}
                />

                <p className="mt-2 text-[12px] leading-[1.4] text-[#71717A]">
                  {selectedTrend.backtesting.validationSummary}
                </p>
              </section>

              {/* 3. Simulation Multi-Agents MiroFish */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-medium text-[#18181B]">
                    Simulation Multi-Agents (Moteur MiroFish)
                  </h3>
                  <span className="text-[12px] font-medium text-[#008075]">
                    3 clusters simulés
                  </span>
                </div>
                <div className="space-y-2.5">
                  {selectedTrend.mirofishAgents.map((agent) => (
                    <div
                      key={agent.persona}
                      className="rounded-[6px] border border-[#E5E7EB] bg-[#FAFAFA] p-3"
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-[13px] font-medium text-[#18181B]">
                        <span>
                          {agent.persona} ({agent.sharePercent}% du panel)
                        </span>
                        <span className="text-[#008075]">
                          Essai : {agent.adoptionRate}% · Rétention 1 an :{' '}
                          <strong>{agent.retentionRate}%</strong>
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#3F3F46]">
                        {agent.verdict}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Profils consommateurs */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <h3 className="mb-3 text-[15px] font-medium text-[#18181B]">
                  Profils de consommateurs concernés
                </h3>
                <div className="space-y-2.5">
                  {selectedTrend.consumerProfiles.map((cp) => (
                    <div
                      key={cp.segment}
                      className="rounded-[6px] border border-[#E5E7EB] bg-[#FAFAFA] p-3"
                    >
                      <div className="flex justify-between text-[13px] font-medium text-[#18181B]">
                        <span>
                          {cp.segment} ({cp.ageRange})
                        </span>
                        <span className="text-[#C86D51]">
                          Affinité : {cp.affinityScore}/100
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[#3F3F46]">
                        Occasions : {cp.usageOccasion}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Facteurs favorables & Risques */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <h3 className="mb-3 text-[15px] font-medium text-[#18181B]">
                  Facteurs favorables & Risques identifiés
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[6px] bg-[#ECFDF5]/60 p-3">
                    <div className="mb-2 text-[12px] font-semibold tracking-[0.05em] text-[#047857] uppercase">
                      Facteurs favorables
                    </div>
                    <ul className="space-y-1.5 text-[12px] leading-[1.4] text-[#3F3F46]">
                      {selectedTrend.favorableFactors.map((f) => (
                        <li key={f} className="flex gap-2">
                          <span className="font-bold text-[#047857]">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-[6px] bg-[#FEF2F2]/60 p-3">
                    <div className="mb-2 text-[12px] font-semibold tracking-[0.05em] text-[#B91C1C] uppercase">
                      Risques & Points de vigilance
                    </div>
                    <ul className="space-y-1.5 text-[12px] leading-[1.4] text-[#3F3F46]">
                      {selectedTrend.riskFactors.map((r) => (
                        <li key={r} className="flex gap-2">
                          <span className="font-bold text-[#B91C1C]">!</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* 6. Traçabilité & Niveau de confiance */}
              <section className="rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-4">
                <h3 className="mb-3 text-[15px] font-medium text-[#18181B]">
                  Traçabilité & Justification du Niveau de Confiance (
                  {selectedTrend.confidence.overallScore}%)
                </h3>
                <div className="mb-3 flex flex-wrap gap-6 rounded-[6px] bg-[#FAFAFA] px-3.5 py-2 text-[12px] text-[#3F3F46]">
                  <span>
                    Convergence sources :{' '}
                    <strong className="text-[#18181B]">
                      {selectedTrend.confidence.sourceConvergence}%
                    </strong>
                  </span>
                  <span>
                    Validation Backtest :{' '}
                    <strong className="text-[#18181B]">
                      {selectedTrend.confidence.historicalBacktestScore}%
                    </strong>
                  </span>
                  <span>
                    Consensus Agents :{' '}
                    <strong className="text-[#18181B]">
                      {selectedTrend.confidence.agentConsensusScore}%
                    </strong>
                  </span>
                </div>
                <ul className="space-y-1.5 text-[12px] leading-[1.4] text-[#3F3F46]">
                  {selectedTrend.confidence.justifications.map((j) => (
                    <li key={j} className="flex gap-2">
                      <span className="font-bold text-[#008075]">•</span>
                      <span>{j}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 7. Copilote IA Formulation & R&D */}
              <section className="rounded-[8px] border border-[#008075]/30 bg-[#E6F2F1]/50 p-4">
                <div className="text-[13px] font-medium text-[#18181B]">
                  Assistant IA Formulation & R&D — « {selectedTrend.name} »
                </div>
                <form
                  onSubmit={(e) => void handleAskAiCopilot(e)}
                  className="mt-2.5 flex gap-2"
                >
                  <input
                    type="text"
                    value={aiCopilotQuestion}
                    onChange={(e) => setAiCopilotQuestion(e.target.value)}
                    placeholder={`Ex: Quelle recommandation R&D pour ${selectedTrend.name} ?`}
                    required
                    className="h-9 flex-1 rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[13px] text-[#18181B] placeholder-[#71717A] outline-none focus:border-[#008075]"
                  />
                  <button
                    type="submit"
                    disabled={aiCopilotLoading}
                    className="h-9 cursor-pointer rounded-[6px] bg-[#008075] px-4 text-[13px] font-medium text-white transition hover:bg-[#006960]"
                  >
                    {aiCopilotLoading ? 'Analyse…' : 'Interroger'}
                  </button>
                </form>
                {aiCopilotAnswer && (
                  <div className="mt-3 rounded-[6px] border border-[#E5E7EB] bg-[#FFFFFF] p-3 text-[13px] leading-[1.5] text-[#3F3F46]">
                    {aiCopilotAnswer}
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      )}

      {/* Modal de lancement d'une nouvelle simulation MiroFish */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/45 backdrop-blur-[1px]">
          <div
            className={`w-[480px] max-w-[92vw] rounded-[8px] border border-[#E5E7EB] bg-[#FFFFFF] p-6 ${cardShadow}`}
          >
            <span className="text-[11px] font-medium tracking-[0.05em] text-[#008075] uppercase">
              Moteur Multi-Agents MiroFish
            </span>
            <h2 className="mt-1 text-[18px] font-medium text-[#18181B]">
              Lancer une nouvelle simulation de tendance
            </h2>
            <p className="mt-1 mb-5 text-[12px] leading-[1.4] text-[#71717A]">
              Sélectionnez un arôme, une catégorie alimentaire et un marché pour
              exécuter le pipeline complet (Collecte, Détection, MiroFish,
              Forecasting & Backtesting).
            </p>
            <form onSubmit={handleRunSimulation} className="space-y-4">
              <div>
                <label
                  htmlFor="sim-flavor"
                  className="mb-1.5 block text-[12px] font-medium text-[#3F3F46]"
                >
                  Arôme / Ingrédient à évaluer
                </label>
                <input
                  id="sim-flavor"
                  type="text"
                  value={newFlavorName}
                  onChange={(e) => setNewFlavorName(e.target.value)}
                  placeholder="Ex: Yuzu, Sésame Noir, Piment Chipotle, Fleur de Sureau…"
                  required
                  className="h-9 w-full rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[14px] text-[#18181B] outline-none focus:border-[#008075] focus:ring-2 focus:ring-[#008075]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="sim-category"
                  className="mb-1.5 block text-[12px] font-medium text-[#3F3F46]"
                >
                  Catégorie alimentaire
                </label>
                <select
                  id="sim-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-9 w-full rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[14px] text-[#18181B] outline-none focus:border-[#008075]"
                >
                  <option value="Produit apéro, sauces et condiments">
                    Produit apéro, sauces et condiments
                  </option>
                  <option value="Préparation laitiere">
                    Préparation laitiere
                  </option>
                  <option value="Chocolat, confiserie, glace">
                    Chocolat, confiserie, glace
                  </option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="sim-market"
                  className="mb-1.5 block text-[12px] font-medium text-[#3F3F46]"
                >
                  Marché cible
                </label>
                <select
                  id="sim-market"
                  value={newMarket}
                  onChange={(e) =>
                    setNewMarket(e.target.value as FlavorTrend['market'])
                  }
                  className="h-9 w-full rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-3 text-[14px] text-[#18181B] outline-none focus:border-[#008075]"
                >
                  <option value="Europe">Europe</option>
                  <option value="Amérique du Nord">Amérique du Nord</option>
                  <option value="Asie-Pacifique">Asie-Pacifique</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2.5 border-t border-[#E5E7EB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 cursor-pointer rounded-[6px] border border-[#E4E4E7] bg-[#FFFFFF] px-4 text-[13px] font-medium text-[#3F3F46] hover:bg-[#F4F4F5]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-9 cursor-pointer rounded-[6px] bg-[#008075] px-4 text-[13px] font-medium text-white hover:bg-[#006960]"
                >
                  Exécuter la simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
