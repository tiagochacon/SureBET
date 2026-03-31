// ============================================================
// SureBet — Tipos centrais TypeScript
// ============================================================

/** Uma odd de um bookmaker para um outcome específico */
export interface BookmakerOdd {
  bookmaker: string;       // slug do bookmaker (ex: 'bet365')
  bookmakerName: string;   // nome exibível (ex: 'Bet365')
  reliability: number;     // 1-5
  market: MarketType;
  outcome: string;         // ex: 'home', 'draw', 'away', 'over_2.5', 'under_2.5'
  odd: number;             // odd decimal (ex: 3.1)
  fetchedAt: Date;
}

/** Tipos de mercado suportados */
export type MarketType = 'h2h' | 'totals' | 'btts' | 'double_chance';

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
  region: string;       // região da The Odds API (ex: 'eu', 'uk', 'eu,uk')
  minStake?: number;
  note?: string;
}

/** Resposta bruta da The Odds API — formato v4 */
export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;  // ISO 8601
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

export interface OddsApiMarket {
  key: string;          // 'h2h', 'totals', 'btts'
  last_update: string;
  outcomes: OddsApiOutcome[];
}

export interface OddsApiOutcome {
  name: string;         // ex: 'Home', 'Away', 'Draw', 'Over', 'Under'
  price: number;        // odd decimal
  point?: number;       // para totals: 2.5, 3.5...
}

/** Estado do sistema */
export interface SystemStatus {
  healthy: boolean;
  lastSuccessfulFetch: Date | null;
  nextScheduledFetch: Date | null;
  eventsMonitored: number;
  leaguesMonitored: number;
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
