import type { FlavorTrend, PipelineStageStatus, QuickStatCard } from './types';

/**
 * Les 3 cartes de statistiques rapides fidèles à la maquette.
 */
export const QUICK_STATS: QuickStatCard[] = [
  {
    id: 'turnover',
    value: '70.1%',
    label: 'Turn over des trends',
    sublabel: 'ce mois vs mois précédent',
    dotColor: 'blue',
    points: [38, 25, 48, 78, 52, 68, 20],
    highlightIndex: 3,
  },
  {
    id: 'new-flavors',
    value: '4',
    label: 'Nouvelles saveurs en',
    sublabel: 'tendance ce mois ci',
    dotColor: 'blue',
    points: [38, 25, 48, 78, 52, 68, 20],
    highlightIndex: 3,
  },
  {
    id: 'perennity',
    value: '9.8%',
    label: 'Pérénité des tendances',
    sublabel: 'année en cours',
    dotColor: 'pink',
    points: [38, 25, 48, 78, 52, 68, 20],
    highlightIndex: 3,
  },
];

/**
 * Les 6 étapes modulaires de l'architecture Data/IA Givaudan.
 */
export const PIPELINE_STAGES: PipelineStageStatus[] = [
  {
    id: 'data_collection',
    label: '1. Data Collection',
    description:
      'Ingestion & normalisation multi-sources (TikTok, YouTube, Presse, Google)',
    metric: '4 sources synchronisées',
  },
  {
    id: 'trend_detection',
    label: '2. Trend Detection',
    description: 'Détection et qualification des signaux faibles et vélocité',
    metric: '7 arômes qualifiés',
  },
  {
    id: 'agent_simulation',
    label: '3. Agent Simulation',
    description: 'Simulation multi-agents basée sur le moteur MiroFish adapté',
    metric: '1 200 agents simulés',
  },
  {
    id: 'forecasting',
    label: '4. Forecasting',
    description: 'Calcul des trajectoires de pérennité à 12 mois',
    metric: 'Horizon +12 mois',
  },
  {
    id: 'backtesting',
    label: '5. Backtesting',
    description:
      'Validation historique sur 24 mois face aux observations réelles',
    metric: 'Précision moy. 91.4%',
  },
  {
    id: 'business_intelligence',
    label: '6. Business Intelligence',
    description:
      'Restitution CRM exploitable par les équipes R&D et Marketing Givaudan',
    metric: 'Rapports traçables',
  },
];

/**
 * Données des saveurs en tendance fidèles à la maquette, enrichies pour le rapport CRM.
 */
export const INITIAL_FLAVOR_TRENDS: FlavorTrend[] = [
  {
    id: 'bbq',
    name: 'BBQ',
    category: 'Produit apéro, sauces et condiments',
    market: 'Europe',
    overallPresencePercent: 15,
    mirofishPerennity: 99,
    tiktokPresence: 12,
    youtubePresence: 10,
    pressPresence: 0,
    googlePresence: 2,
    maturity: 'Established Trend',
    growthPotentialPercent: 18,
    summary:
      'Pilier aromatique indétrônable sur le segment salé. La simulation MiroFish confirme une rétention quasi-totale (99/100) portée par des déclinaisons fumées premium (Hickory, Korean BBQ, Chipotle doux).',
    favorableFactors: [
      'Rachat récurrent élevé en grande distribution européenne (84% de réachat simulé)',
      'Forte élasticité vers des sous-profils fumés régionaux (Texan, Coréen, Érable)',
      'Compatibilité optimale avec les matrices végétales et snacks extrudés',
    ],
    riskFactors: [
      'Saturation des références BBQ standardisées entrée de gamme',
      'Vigilance réglementaire européenne sur certains arômes de fumée primaires (SF-regulations)',
    ],
    consumerProfiles: [
      {
        segment: 'Foyers & Familles Mainstream',
        ageRange: '25–54 ans',
        affinityScore: 94,
        usageOccasion: 'Apéritif convivial, grillades, snacking partagé',
      },
      {
        segment: 'Jeunes actifs amateurs de Street Food',
        ageRange: '18–34 ans',
        affinityScore: 86,
        usageOccasion: 'Sauces dipping, burgers gourmet, chips striées',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Acheteurs fidèles GMS (MiroFish Cluster A)',
        sharePercent: 45,
        adoptionRate: 96,
        retentionRate: 99,
        verdict: 'Maintien systématique dans le panier apéritif',
      },
      {
        persona: 'Explorateurs Street-Food (MiroFish Cluster B)',
        sharePercent: 30,
        adoptionRate: 88,
        retentionRate: 92,
        verdict: 'Transition vers les variantes BBQ fumé-épicé',
      },
      {
        persona: 'Distributeurs & Category Managers (Cluster C)',
        sharePercent: 25,
        adoptionRate: 98,
        retentionRate: 99,
        verdict: 'Valeur refuge à faible risque de déréférencement',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 96.2,
      mae: 1.4,
      correlationR2: 0.95,
      validationSummary:
        'Sur les 24 derniers mois, le modèle MiroFish a prédit une stabilité entre 14% et 15.5% de part de voix, alignée à 96.2% avec les relevés linéaires et digitaux observés.',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 14.1,
          predicted: 13.9,
          lowerBound: 13.1,
          upperBound: 14.7,
        },
        {
          period: 'T2 N-1',
          observed: 14.8,
          predicted: 14.6,
          lowerBound: 13.8,
          upperBound: 15.4,
        },
        {
          period: 'T3 N-1',
          observed: 15.2,
          predicted: 15.0,
          lowerBound: 14.2,
          upperBound: 15.8,
        },
        {
          period: 'T4 N-1',
          observed: 14.6,
          predicted: 14.8,
          lowerBound: 14.0,
          upperBound: 15.6,
        },
        {
          period: 'Actuel',
          observed: 15.0,
          predicted: 15.1,
          lowerBound: 14.3,
          upperBound: 15.9,
        },
        {
          period: '+6 mois',
          predicted: 15.6,
          lowerBound: 14.6,
          upperBound: 16.6,
        },
        {
          period: '+12 mois',
          predicted: 16.2,
          lowerBound: 15.0,
          upperBound: 17.4,
        },
      ],
    },
    confidence: {
      overallScore: 95,
      sourceConvergence: 92,
      historicalBacktestScore: 96,
      agentConsensusScore: 97,
      justifications: [
        'Écart historique (MAE) inférieur à 1.5 point sur 8 trimestres consécutifs de backtesting',
        'Consensus élevé entre les clusters consommateurs et distributeurs dans MiroFish',
        'Présence globale dominante (15%) malgré une faible volatilité médiatique (0 presse)',
      ],
    },
    aisle3D: 'Rayon Sauces, Condiments & Snacks Salés (Allée A1)',
  },
  {
    id: 'cornichon',
    name: 'Cornichon',
    category: 'Produit apéro, sauces et condiments',
    market: 'Europe',
    overallPresencePercent: 10,
    mirofishPerennity: 90,
    tiktokPresence: 20,
    youtubePresence: 5,
    pressPresence: 0,
    googlePresence: 3,
    maturity: 'Growing Trend',
    growthPotentialPercent: 42,
    summary:
      'Initialement propulsé par la vague "Pickle mania" sur TikTok (20), le Cornichon (Dill Pickle) dépasse le simple phénomène viral pour s’installer durablement (score MiroFish : 90/100) grâce à son profil acide-umami recherché.',
    favorableFactors: [
      'Recherche croissante de profils acidulés et fermentés (tangy/briny) réduisant la perception de gras',
      'Fort taux de conversion entre l’essai viral Gen-Z et le réachat en chips et sauces burger',
      'Coût matière aromatique maîtrisé et excellente stabilité thermique',
    ],
    riskFactors: [
      'Polarisation gustative chez les consommateurs seniors (+55 ans)',
      'Dépendance actuelle à la visibilité TikTok (20) vs presse traditionnelle (0)',
    ],
    consumerProfiles: [
      {
        segment: 'Gen-Z & Millennials urbains',
        ageRange: '16–32 ans',
        affinityScore: 91,
        usageOccasion:
          'Chips saveur Dill Pickle, sauces ranch-cornichon, apéritif',
      },
      {
        segment: 'Amateurs de profils vinaigrés / fermentés',
        ageRange: '25–45 ans',
        affinityScore: 83,
        usageOccasion: 'Condiments premium, snacks salés croquants',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Early Adopters TikTok (MiroFish Cluster A)',
        sharePercent: 40,
        adoptionRate: 93,
        retentionRate: 86,
        verdict: 'Forte recommandation sociale et achat impulsif répété',
      },
      {
        persona: 'Consommateurs Snacks Salés (Cluster B)',
        sharePercent: 35,
        adoptionRate: 82,
        retentionRate: 91,
        verdict:
          'Adoption comme alternative fraîche au classique Sel & Vinaigre',
      },
      {
        persona: 'Acheteurs Retail GMS (Cluster C)',
        sharePercent: 25,
        adoptionRate: 85,
        retentionRate: 94,
        verdict: 'Extension des gammes saisonnières vers le permanent',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 91.5,
      mae: 2.1,
      correlationR2: 0.91,
      validationSummary:
        'Le backtesting sur la vague "Dill Pickle" nord-américaine puis européenne démontre que le modèle MiroFish a correctement distingué la rétention réelle (90) d’un simple feu de paille.',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 4.5,
          predicted: 4.8,
          lowerBound: 3.9,
          upperBound: 5.7,
        },
        {
          period: 'T2 N-1',
          observed: 6.2,
          predicted: 6.0,
          lowerBound: 5.1,
          upperBound: 6.9,
        },
        {
          period: 'T3 N-1',
          observed: 7.8,
          predicted: 8.1,
          lowerBound: 7.1,
          upperBound: 9.1,
        },
        {
          period: 'T4 N-1',
          observed: 9.1,
          predicted: 8.9,
          lowerBound: 7.9,
          upperBound: 9.9,
        },
        {
          period: 'Actuel',
          observed: 10.0,
          predicted: 9.8,
          lowerBound: 8.8,
          upperBound: 10.8,
        },
        {
          period: '+6 mois',
          predicted: 11.8,
          lowerBound: 10.5,
          upperBound: 13.1,
        },
        {
          period: '+12 mois',
          predicted: 13.4,
          lowerBound: 11.8,
          upperBound: 15.0,
        },
      ],
    },
    confidence: {
      overallScore: 89,
      sourceConvergence: 84,
      historicalBacktestScore: 92,
      agentConsensusScore: 90,
      justifications: [
        'Taux de rétention post-essai élevé dans la simulation multi-agents (90/100)',
        'Trajectoire historique conforme au modèle de transfert US → Europe observé en backtesting',
        'Validation sensorielle forte sur le segment "Acide & Fermenté"',
      ],
    },
    aisle3D: 'Rayon Sauces, Condiments & Snacks Salés (Allée A2)',
  },
  {
    id: 'pistache',
    name: 'Pistache',
    category: 'Préparation laitiere',
    market: 'Europe',
    overallPresencePercent: 7.2,
    mirofishPerennity: 88,
    tiktokPresence: 18,
    youtubePresence: 55,
    pressPresence: 10,
    googlePresence: 5,
    maturity: 'Growing Trend',
    growthPotentialPercent: 54,
    summary:
      'Portée par un écosystème média très équilibré (YouTube 55, TikTok 18, Presse 10), la Pistache torréfiée s’impose comme la signature "indulgence premium" dans les préparations laitières, desserts protéinés et boissons lactées.',
    favorableFactors: [
      'Puissant relais par les créateurs culinaires longs formats sur YouTube (score 55) et la presse gastronomique (10)',
      'Perception haut de gamme ("Mediterranean luxury") valorisant les gammes laitières et végétales',
      'Adoption transversale : yaourts grecs, mousses, lattes glacés et crèmes desserts',
    ],
    riskFactors: [
      'Tension inflationniste sur l’approvisionnement en pistache naturelle',
      'Besoin de formuler un profil aromatique authentique (notes grillées/pralinées) vs amande amère artificielle',
    ],
    consumerProfiles: [
      {
        segment: 'Gourmets & Premium Seekers',
        ageRange: '24–49 ans',
        affinityScore: 95,
        usageOccasion: 'Dessert lacté du soir, pause café gourmande',
      },
      {
        segment: 'Consommateurs Fitness & High-Protein',
        ageRange: '20–38 ans',
        affinityScore: 87,
        usageOccasion: 'Puddings protéinés et skyr aromatisé pistache',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Foodies & Créateurs YouTube (Cluster A)',
        sharePercent: 35,
        adoptionRate: 94,
        retentionRate: 90,
        verdict: 'Fort pouvoir prescripteur sur les recettes lactées crémeuses',
      },
      {
        persona: 'Acheteurs Produits Laitiers Premium (Cluster B)',
        sharePercent: 40,
        adoptionRate: 89,
        retentionRate: 88,
        verdict:
          'Consentement à payer +15% pour une signature pistache authentique',
      },
      {
        persona: 'R&D & Formulateurs Laitiers (Cluster C)',
        sharePercent: 25,
        adoptionRate: 86,
        retentionRate: 85,
        verdict:
          'Forte demande en arômes naturels Givaudan pour compenser le coût matière',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 93.8,
      mae: 0.45,
      correlationR2: 0.94,
      validationSummary:
        'Le modèle a anticipé dès N-1 l’accélération de la Pistache dans l’ultra-frais suite au croisement des signaux YouTube (55) et Presse (10).',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 3.8,
          predicted: 3.9,
          lowerBound: 3.4,
          upperBound: 4.4,
        },
        {
          period: 'T2 N-1',
          observed: 4.6,
          predicted: 4.7,
          lowerBound: 4.2,
          upperBound: 5.2,
        },
        {
          period: 'T3 N-1',
          observed: 5.5,
          predicted: 5.4,
          lowerBound: 4.9,
          upperBound: 5.9,
        },
        {
          period: 'T4 N-1',
          observed: 6.4,
          predicted: 6.3,
          lowerBound: 5.7,
          upperBound: 6.9,
        },
        {
          period: 'Actuel',
          observed: 7.2,
          predicted: 7.1,
          lowerBound: 6.5,
          upperBound: 7.7,
        },
        { period: '+6 mois', predicted: 8.9, lowerBound: 8.1, upperBound: 9.7 },
        {
          period: '+12 mois',
          predicted: 10.6,
          lowerBound: 9.5,
          upperBound: 11.7,
        },
      ],
    },
    confidence: {
      overallScore: 93,
      sourceConvergence: 94,
      historicalBacktestScore: 94,
      agentConsensusScore: 91,
      justifications: [
        'Convergence multi-canaux exemplaire : YouTube (55), TikTok (18), Presse (10) et Google (5)',
        'Validation historique R² = 0.94 sur le segment Préparation laitière',
        'Opportunité directe pour Givaudan : substitution aromatique à haute valeur ajoutée',
      ],
    },
    aisle3D: 'Rayon Produits Laitiers & Desserts Lactés (Allée B1)',
  },
  {
    id: 'pecan',
    name: 'Pécan',
    category: 'Chocolat, confiserie, glace',
    market: 'Europe',
    overallPresencePercent: 6,
    mirofishPerennity: 15,
    tiktokPresence: 50,
    youtubePresence: 16,
    pressPresence: 50,
    googlePresence: 50,
    maturity: 'Hype',
    growthPotentialPercent: -28,
    summary:
      'Cas d’école détecté par MiroFish : malgré un bruit médiatique massif (TikTok 50, Presse 50, Google 50) lié aux lancements saisonniers d’automne/hiver, la pérennité à un an chute à 15/100 en raison d’une forte saisonnalité et d’une fatigue rapide des consommateurs.',
    favorableFactors: [
      'Très forte visibilité médiatique court-terme (score 50 sur TikTok, Presse et Google)',
      'Excellente performance en éditions limitées automnales et fêtes de fin d’année',
    ],
    riskFactors: [
      'Effondrement du taux de réachat hors saison hivernale dans la simulation MiroFish (score 15/100)',
      'Saturation sucrée ("flavor fatigue") sur les glaces et chocolats très riches',
      'Cannibalisation par la Pistache et le Praliné Noisette sur les gammes permanentes',
    ],
    consumerProfiles: [
      {
        segment: 'Chasseurs d’Éditions Limitées',
        ageRange: '18–35 ans',
        affinityScore: 88,
        usageOccasion: 'Achat d’impulsion saisonnier (Octobre–Décembre)',
      },
      {
        segment: 'Amateurs de Glaces US Style',
        ageRange: '25–44 ans',
        affinityScore: 72,
        usageOccasion:
          'Crèmes glacées Butter Pecan & tablettes chocolat fourrées',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Chasseurs de Hype Réseaux Sociaux (Cluster A)',
        sharePercent: 50,
        adoptionRate: 89,
        retentionRate: 12,
        verdict: 'Essai unique pour la nouveauté puis abandon rapide',
      },
      {
        persona: 'Consommateurs Réguliers Chocolat/Glace (Cluster B)',
        sharePercent: 35,
        adoptionRate: 45,
        retentionRate: 18,
        verdict: 'Jugé trop sucré/lourd pour une consommation hebdomadaire',
      },
      {
        persona: 'Acheteurs GMS (Cluster C)',
        sharePercent: 15,
        adoptionRate: 60,
        retentionRate: 16,
        verdict:
          'Recommandé uniquement en In & Out promotionnel, pas en fond de rayon',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 89.4,
      mae: 1.8,
      correlationR2: 0.88,
      validationSummary:
        'Le backtesting met en évidence un cycle en cloche typique des "Hypes" saisonnières : pic médiatique suivi d’un repli de 70% des volumes au bout de 4 mois.',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 2.1,
          predicted: 2.3,
          lowerBound: 1.7,
          upperBound: 2.9,
        },
        {
          period: 'T2 N-1',
          observed: 1.8,
          predicted: 2.0,
          lowerBound: 1.4,
          upperBound: 2.6,
        },
        {
          period: 'T3 N-1',
          observed: 3.5,
          predicted: 3.8,
          lowerBound: 3.0,
          upperBound: 4.6,
        },
        {
          period: 'T4 N-1',
          observed: 7.4,
          predicted: 7.1,
          lowerBound: 6.2,
          upperBound: 8.0,
        },
        {
          period: 'Actuel',
          observed: 6.0,
          predicted: 5.8,
          lowerBound: 4.9,
          upperBound: 6.7,
        },
        { period: '+6 mois', predicted: 2.4, lowerBound: 1.6, upperBound: 3.2 },
        {
          period: '+12 mois',
          predicted: 1.5,
          lowerBound: 0.9,
          upperBound: 2.1,
        },
      ],
    },
    confidence: {
      overallScore: 88,
      sourceConvergence: 90,
      historicalBacktestScore: 89,
      agentConsensusScore: 86,
      justifications: [
        'Divergence flagrante entre le buzz média (50) et la rétention simulée des agents (15/100)',
        'Historique de backtesting confirmant une récurrence purement saisonnière (T4)',
        'Alerte stratégique Givaudan : orienter les clients vers des lancements "Édition Limitée" plutôt que permanents',
      ],
    },
    aisle3D: 'Rayon Chocolats, Confiseries & Glaces (Allée C1)',
  },
  {
    id: 'myrtilles',
    name: 'Myrtilles',
    category: 'Chocolat, confiserie, glace',
    market: 'Europe',
    overallPresencePercent: 3,
    mirofishPerennity: 10,
    tiktokPresence: 20,
    youtubePresence: 30,
    pressPresence: 50,
    googlePresence: 60,
    maturity: 'Hype',
    growthPotentialPercent: -35,
    summary:
      'Forte visibilité en recherches Google (60) et Presse (50), mais la simulation MiroFish révèle une faible pérennité à un an (10/100) sur la catégorie Chocolat/Confiserie/Glace où la Myrtille souffre d’un déficit de gourmandise face aux fruits rouges classiques.',
    favorableFactors: [
      'Halo santé (antioxydants, superfruit) très relayé par la presse (50) et les requêtes Google (60)',
      'Attrait visuel fort (teinte violette naturelle) sur les glaces et enrobages',
    ],
    riskFactors: [
      'Faible adéquation perçue avec le chocolat pur par les agents consommateurs (pérennité 10/100)',
      'Déception sensorielle fréquente (notes florales/chimiques si mal dosées)',
    ],
    consumerProfiles: [
      {
        segment: 'Consommateurs Bien-être & Superfruits',
        ageRange: '30–55 ans',
        affinityScore: 76,
        usageOccasion: 'Tablettes chocolat noir superfruits, sorbets',
      },
      {
        segment: 'Jeunes adultes curieux',
        ageRange: '18–29 ans',
        affinityScore: 64,
        usageOccasion: 'Confiseries gélifiées acidulées',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Lecteurs Presse Santé / Google (Cluster A)',
        sharePercent: 45,
        adoptionRate: 70,
        retentionRate: 14,
        verdict:
          'Intérêt informationnel élevé mais faible conversion en confiserie/chocolat',
      },
      {
        persona: 'Acheteurs Chocolat & Glace (Cluster B)',
        sharePercent: 40,
        adoptionRate: 32,
        retentionRate: 8,
        verdict:
          'Préfèrent la Framboise ou la Fraise pour le mariage chocolaté',
      },
      {
        persona: 'Distributeurs Spécialisés (Cluster C)',
        sharePercent: 15,
        adoptionRate: 40,
        retentionRate: 10,
        verdict: 'Rotation lente en linéaire confiserie/chocolat',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 88.0,
      mae: 0.9,
      correlationR2: 0.87,
      validationSummary:
        'Le backtesting confirme que les pics de requêtes Google (60) sur la Myrtille ne se traduisent pas en parts de marché durables dans le segment Chocolat/Confiserie.',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 2.4,
          predicted: 2.5,
          lowerBound: 2.0,
          upperBound: 3.0,
        },
        {
          period: 'T2 N-1',
          observed: 3.8,
          predicted: 3.6,
          lowerBound: 3.0,
          upperBound: 4.2,
        },
        {
          period: 'T3 N-1',
          observed: 4.1,
          predicted: 3.9,
          lowerBound: 3.3,
          upperBound: 4.5,
        },
        {
          period: 'T4 N-1',
          observed: 3.2,
          predicted: 3.3,
          lowerBound: 2.7,
          upperBound: 3.9,
        },
        {
          period: 'Actuel',
          observed: 3.0,
          predicted: 2.9,
          lowerBound: 2.3,
          upperBound: 3.5,
        },
        { period: '+6 mois', predicted: 1.8, lowerBound: 1.2, upperBound: 2.4 },
        {
          period: '+12 mois',
          predicted: 1.1,
          lowerBound: 0.6,
          upperBound: 1.6,
        },
      ],
    },
    confidence: {
      overallScore: 86,
      sourceConvergence: 82,
      historicalBacktestScore: 88,
      agentConsensusScore: 89,
      justifications: [
        'Décorrélation historique prouvée entre recherches Google "Myrtille" et ventes en Chocolat/Confiserie',
        'Consensus négatif des agents MiroFish sur le réachat (10/100) dans cette catégorie précise',
        'Recommandation Givaudan : repositionner la Myrtille sur les Boissons ou Préparations laitières plutôt que le Chocolat',
      ],
    },
    aisle3D: 'Rayon Chocolats, Confiseries & Glaces (Allée C2)',
  },
  {
    id: 'ananas',
    name: 'Ananas',
    category: 'Chocolat, confiserie, glace',
    market: 'Europe',
    overallPresencePercent: 2,
    mirofishPerennity: 50,
    tiktokPresence: 20,
    youtubePresence: 10,
    pressPresence: 10,
    googlePresence: 10,
    maturity: 'Emerging Signal',
    growthPotentialPercent: 34,
    summary:
      'Signal émergent stable (présence 2%, pérennité MiroFish 50/100) avec une distribution homogène des signaux (TikTok 20, YouTube 10, Presse 10, Google 10). Fort potentiel en association "Swicy" (Ananas-Piment / Ananas rôti caramélisé).',
    favorableFactors: [
      'Émergence des profils "Swicy" (Sweet & Spicy : Ananas-Habanero, Ananas-Gingembre) en confiserie et sorbets',
      'Base de signaux équilibrée sans surchauffe spéculative',
      'Fraîcheur aromatique très appréciée dans les sorbets et tablettes chocolat blanc/noir',
    ],
    riskFactors: [
      'Volume initial encore restreint (2% de présence globale)',
      'Risque de plafonnement si proposé uniquement en mono-arôme classique',
    ],
    consumerProfiles: [
      {
        segment: 'Explorateurs de saveurs exotiques & Swicy',
        ageRange: '18–34 ans',
        affinityScore: 84,
        usageOccasion: 'Confiseries acidulées/épicées, sorbets plein fruit',
      },
      {
        segment: 'Consommateurs de Chocolat Noir Fruité',
        ageRange: '35–60 ans',
        affinityScore: 74,
        usageOccasion: 'Dégustation chocolat noir pépites d’ananas caramélisé',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Explorateurs Exotiques (Cluster A)',
        sharePercent: 40,
        adoptionRate: 78,
        retentionRate: 62,
        verdict: 'Forte adhésion aux combinaisons Ananas rôti / Piment doux',
      },
      {
        persona: 'Acheteurs Sorbets & Confiserie (Cluster B)',
        sharePercent: 35,
        adoptionRate: 65,
        retentionRate: 48,
        verdict: 'Achat saisonnier printemps-été régulier',
      },
      {
        persona: 'Formulateurs R&D (Cluster C)',
        sharePercent: 25,
        adoptionRate: 58,
        retentionRate: 42,
        verdict: 'Potentiel de différenciation en co-aromatisation',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 87.5,
      mae: 0.35,
      correlationR2: 0.86,
      validationSummary:
        'Progression lente mais régulière sur 24 mois, caractéristique d’un "Emerging Signal" à consolider par une innovation de profil (Ananas rôti / Swicy).',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 1.1,
          predicted: 1.2,
          lowerBound: 0.8,
          upperBound: 1.6,
        },
        {
          period: 'T2 N-1',
          observed: 1.4,
          predicted: 1.4,
          lowerBound: 1.0,
          upperBound: 1.8,
        },
        {
          period: 'T3 N-1',
          observed: 1.8,
          predicted: 1.7,
          lowerBound: 1.3,
          upperBound: 2.1,
        },
        {
          period: 'T4 N-1',
          observed: 1.7,
          predicted: 1.8,
          lowerBound: 1.4,
          upperBound: 2.2,
        },
        {
          period: 'Actuel',
          observed: 2.0,
          predicted: 2.0,
          lowerBound: 1.5,
          upperBound: 2.5,
        },
        { period: '+6 mois', predicted: 2.4, lowerBound: 1.8, upperBound: 3.0 },
        {
          period: '+12 mois',
          predicted: 2.7,
          lowerBound: 2.0,
          upperBound: 3.4,
        },
      ],
    },
    confidence: {
      overallScore: 82,
      sourceConvergence: 85,
      historicalBacktestScore: 84,
      agentConsensusScore: 78,
      justifications: [
        'Stabilité des 4 capteurs digitaux (TikTok 20, YouTube 10, Presse 10, Google 10)',
        'Score MiroFish médian (50/100) reflétant un potentiel conditionné au mariage aromatique',
        'Faible volatilité historique sur les 8 derniers trimestres',
      ],
    },
    aisle3D: 'Rayon Chocolats, Confiseries & Glaces (Allée C3)',
  },
  {
    id: 'matcha',
    name: 'Matcha',
    category: 'Chocolat, confiserie, glace',
    market: 'Europe',
    overallPresencePercent: 1,
    mirofishPerennity: 50,
    tiktokPresence: 50,
    youtubePresence: 50,
    pressPresence: 50,
    googlePresence: 50,
    maturity: 'Emerging Signal',
    growthPotentialPercent: 68,
    summary:
      'Encore à 1% de présence linéaire en Chocolat/Confiserie/Glace, mais soutenu par un alignement maximal des 4 capteurs (TikTok 50, YouTube 50, Presse 50, Google 50) et une pérennité MiroFish de 50/100 qui grimpe à +82% chez les moins de 30 ans.',
    favorableFactors: [
      'Synchronisation parfaite des signaux digitaux et presse (50 sur chaque canal)',
      'Transfert rapide des coffee shops spécialisés vers la confiserie chocolatée (Matcha Latte, Chocolat blanc Matcha)',
      'Image naturelle, fonctionnelle (L-théanine) et esthétique très valorisée',
    ],
    riskFactors: [
      'Amertume végétale ("umami/herbacé") pouvant freiner les palais européens traditionnels',
      'Instabilité de la couleur verte naturelle à la lumière sans formulation adaptée Givaudan',
    ],
    consumerProfiles: [
      {
        segment: 'Gen-Z & Esthètes Urbains',
        ageRange: '16–28 ans',
        affinityScore: 96,
        usageOccasion:
          'Glaces mochi matcha, chocolat blanc matcha, pauses gourmandes',
      },
      {
        segment: 'Amateurs d’inspirations japonaises',
        ageRange: '25–42 ans',
        affinityScore: 85,
        usageOccasion: 'Pâtisserie fine, confiserie premium',
      },
    ],
    mirofishAgents: [
      {
        persona: 'Urbains Coffee-Shop & Gen-Z (Cluster A)',
        sharePercent: 45,
        adoptionRate: 92,
        retentionRate: 78,
        verdict:
          'Adoption enthousiaste dès que l’amertume est équilibrée par une note lactée/vanillée',
      },
      {
        persona: 'Consommateurs Traditionnels (Cluster B)',
        sharePercent: 35,
        adoptionRate: 28,
        retentionRate: 22,
        verdict: 'Frein gustatif sur les notes herbacées trop prononcées',
      },
      {
        persona: 'Marques Premium & Glaciers (Cluster C)',
        sharePercent: 20,
        adoptionRate: 75,
        retentionRate: 52,
        verdict:
          'Fort intérêt pour des duos Matcha-Fraise ou Matcha-Chocolat Blanc',
      },
    ],
    backtesting: {
      windowMonths: 24,
      directionalAccuracy: 90.2,
      mae: 0.25,
      correlationR2: 0.91,
      validationSummary:
        'Le backtesting confirme que la synchronisation des 4 sources à 50 précède historiquement de 6 à 9 mois le décollage en grande distribution sur les segments sucrés.',
      historicalSeries: [
        {
          period: 'T1 N-1',
          observed: 0.3,
          predicted: 0.4,
          lowerBound: 0.2,
          upperBound: 0.6,
        },
        {
          period: 'T2 N-1',
          observed: 0.5,
          predicted: 0.5,
          lowerBound: 0.3,
          upperBound: 0.7,
        },
        {
          period: 'T3 N-1',
          observed: 0.7,
          predicted: 0.7,
          lowerBound: 0.5,
          upperBound: 0.9,
        },
        {
          period: 'T4 N-1',
          observed: 0.8,
          predicted: 0.9,
          lowerBound: 0.6,
          upperBound: 1.2,
        },
        {
          period: 'Actuel',
          observed: 1.0,
          predicted: 1.1,
          lowerBound: 0.8,
          upperBound: 1.4,
        },
        { period: '+6 mois', predicted: 1.9, lowerBound: 1.4, upperBound: 2.4 },
        {
          period: '+12 mois',
          predicted: 2.8,
          lowerBound: 2.1,
          upperBound: 3.5,
        },
      ],
    },
    confidence: {
      overallScore: 90,
      sourceConvergence: 98,
      historicalBacktestScore: 90,
      agentConsensusScore: 82,
      justifications: [
        'Convergence multi-sources maximale (50/50/50/50 sur TikTok, YouTube, Presse et Google)',
        'Potentiel de croissance élevé (+68%) en combinant le Matcha à des notes rondes (Vanille, Fraise, Chocolat blanc)',
        'Modèle MiroFish validé sur la trajectoire historique des boissons infusées asiatiques',
      ],
    },
    aisle3D: 'Rayon Chocolats, Confiseries & Glaces (Allée C4)',
  },
];
