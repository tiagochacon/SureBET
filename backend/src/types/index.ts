// ============================================================
// SureBet — Tipos centrais TypeScript
// ============================================================

/** Uma odd de um bookmaker para um outcome específico */
export interface BookmakerOdd {
  bookmaker: string;       // nome exato do bookmaker na odds-api.io (ex: 'Bet365')
  bookmakerName: string;   // nome exibível (mesmo que bookmaker nesta API)
  reliability: number;     // 1-5
  market: MarketType;
  outcome: string;         // ex: 'home', 'draw', 'away', 'over_2.5', 'under_2.5'
  odd: number;             // odd decimal (ex: 3.1)
  fetchedAt: Date;
}

/** Tipos de mercado suportados */
export type MarketType =
  | 'h2h'
  | 'totals'
  | 'btts'
  | 'double_chance'
  | 'handicap'
  | 'spread'
  | 'other';

/** Evento esportivo normalizado */
export interface SportEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: Date;
  bookmakerOdds: BookmakerOdd[];
  fetchedAt: Date;
}

/** Resultado de um outcome em uma oportunidade de arbitragem */
export interface ArbitrageOutcome {
  bookmaker: string;
  bookmakerName: string;
  market: MarketType;
  selection: string;       // texto exibível (ex: 'Over 2.5')
  odd: number;
  impliedProbability: number; // 1/odd
  stake: number;           // valor a apostar (calculado pelo StakeCalculator)
  expectedReturn: number;  // stake × odd
  oddFetchedAt: Date;
  oddChangedAlert: boolean; // true se odd mudou > 5% desde detecção
}

/** Oportunidade de arbitragem detectada */
export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  eventName: string;       // ex: 'Flamengo vs Corinthians'
  league: string;
  commenceTime: Date;
  marketType: MarketType;
  marketLabel: string;     // ex: 'Over/Under 2.5 Gols'
  arbitrageMargin: number; // ex: 0.0524 = 5.24%
  roi: number;             // mesmo que arbitrageMargin em %
  bankrollUsed: number;
  totalStake: number;      // soma de todos os stakes
  guaranteedProfit: number; // lucro mínimo garantido em R$
  outcomes: ArbitrageOutcome[];
  status: OpportunityStatus;
  detectedAt: Date;
  expiresAt: Date;         // detectedAt + 90s
}

export type OpportunityStatus = 'active' | 'stale' | 'expired' | 'invalidated';

/** Configuração de um bookmaker aprovado */
export interface BookmakerConfig {
  slug: string;
  name: string;
  license: string;
  reliability: number;  // 1-5
  region: string;
  minStake?: number;
  note?: string;
}

// ============================================================
// Tipos da odds-api.io v3
// ============================================================

/** Resposta do endpoint GET /arbitrage-bets */
export interface OddsApiV3ArbitrageOpportunity {
  id: string;
  eventId: number;
  event?: OddsApiV3EventInfo;    // incluído apenas com includeEventDetails=true
  market: OddsApiV3Market;
  legs: OddsApiV3ArbitrageLeg[];
  optimalStakes: OddsApiV3OptimalStake[];
  profitMargin: number;          // ex: 0.032 = 3.2% de lucro
  impliedProbability: number;    // soma de 1/odds (< 1 indica arbitragem)
  totalStake: number;
  updatedAt: string;             // ISO 8601
}

/** Detalhes do evento (presente apenas com includeEventDetails=true) */
export interface OddsApiV3EventInfo {
  home: string;
  away: string;
  date: string;      // ISO 8601
  sport: string;     // slug do esporte
  league: string;
}

/** Mercado de uma oportunidade de arbitragem */
export interface OddsApiV3Market {
  name: string;      // ex: 'ML', 'Over/Under', 'Both Teams to Score'
  hdp?: number;      // handicap line, se aplicável
}

/** Perna (leg) de uma oportunidade de arbitragem */
export interface OddsApiV3ArbitrageLeg {
  bookmaker: string;            // ex: 'Bet365', 'Betano'
  bookmakerFixtureId: string;
  side: string;                 // 'home', 'away', 'draw', 'over', 'under', 'yes', 'no'
  label: string;                // texto exibível da seleção
  odds: string;                 // odd decimal como string (ex: '2.10')
  href?: string;
  directLink?: string;
}

/** Stakes ótimas para cada bookmaker/seleção */
export interface OddsApiV3OptimalStake {
  bookmaker: string;
  side: string;
  stake: number;
  potentialReturn: number;
}

/** Resposta do endpoint GET /events */
export interface OddsApiV3Event {
  id: number;
  home: string;
  away: string;
  date: string;      // ISO 8601
  status: string;
  sport: { name: string; slug: string };
  league: { name: string; slug: string };
  bookmakers: Record<string, OddsApiV3BookmakerOdds[]>;
}

/** Odds de um bookmaker por mercado */
export interface OddsApiV3BookmakerOdds {
  name: string;      // nome do mercado (ex: 'ML', 'Over/Under')
  odds: Record<string, string>[];  // array de objetos com odds por seleção
  updatedAt: string;
}

// ============================================================
// Estado do sistema
// ============================================================

export interface SystemStatus {
  healthy: boolean;
  lastSuccessfulFetch: Date | null;
  nextScheduledFetch: Date | null;
  eventsMonitored: number;
  sportsMonitored: number;
  activeOpportunities: number;
  apiCallsRemaining: number | null;
  consecutiveErrors: number;
}

/** Evento WebSocket */
export type WsEventType =
  | 'opportunity:new'
  | 'opportunity:updated'
  | 'opportunity:expired'
  | 'system:no_opportunities'
  | 'system:api_error'
  | 'system:status';

export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  timestamp: string;
}
