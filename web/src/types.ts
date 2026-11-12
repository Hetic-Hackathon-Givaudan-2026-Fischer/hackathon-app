/**
 * Niveaux de maturité d'une tendance aromatique selon le cadre Givaudan MVP.
 */
export type MaturityLevel =
  'Emerging Signal' | 'Hype' | 'Growing Trend' | 'Established Trend';

/**
 * Étapes de l'architecture modulaire Data / IA.
 */
export type PipelineStageId =
  | 'data_collection'
  | 'trend_detection'
  | 'agent_simulation'
  | 'forecasting'
  | 'backtesting'
  | 'business_intelligence';

export interface PipelineStageStatus {
  id: PipelineStageId;
  label: string;
  description: string;
  metric: string;
}

/**
 * Résultat d'un groupe d'agents dans la simulation MiroFish.
 */
export interface MiroFishAgentGroup {
  persona: string;
  sharePercent: number;
  adoptionRate: number;
  retentionRate: number;
  verdict: string;
}

/**
 * Point temporel pour le Backtesting historique et le Forecasting.
 */
export interface TimeSeriesPoint {
  period: string;
  observed?: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

/**
 * Métriques de validation du Backtesting historique.
 */
export interface BacktestingReport {
  windowMonths: number;
  directionalAccuracy: number;
  mae: number;
  correlationR2: number;
  historicalSeries: TimeSeriesPoint[];
  validationSummary: string;
}

/**
 * Profil de consommateur cible.
 */
export interface ConsumerProfile {
  segment: string;
  ageRange: string;
  affinityScore: number;
  usageOccasion: string;
}

/**
 * Justification traçable du niveau de confiance.
 */
export interface ConfidenceBreakdown {
  overallScore: number;
  sourceConvergence: number;
  historicalBacktestScore: number;
  agentConsensusScore: number;
  justifications: string[];
}

/**
 * Fiche complète d'une saveur en tendance (ligne du tableau + rapport CRM détaillé).
 */
export interface FlavorTrend {
  id: string;
  name: string;
  category: string;
  market: 'Europe' | 'Amérique du Nord' | 'Asie-Pacifique' | 'Global';
  overallPresencePercent: number;
  mirofishPerennity: number;
  tiktokPresence: number;
  youtubePresence: number;
  pressPresence: number;
  googlePresence: number;
  maturity: MaturityLevel;
  growthPotentialPercent: number;
  summary: string;
  favorableFactors: string[];
  riskFactors: string[];
  consumerProfiles: ConsumerProfile[];
  mirofishAgents: MiroFishAgentGroup[];
  backtesting: BacktestingReport;
  confidence: ConfidenceBreakdown;
  aisle3D: string;
}

/**
 * Carte KPI de la section "Quick statistics".
 */
export interface QuickStatCard {
  id: string;
  value: string;
  label: string;
  sublabel: string;
  dotColor: 'blue' | 'pink';
  points: number[];
  highlightIndex: number;
}

/**
 * Vues principales accessibles depuis la barre latérale gauche.
 */
export type ActiveView = 'dashboard' | 'saved' | 'store3d';
