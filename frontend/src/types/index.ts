export type MarketType =
  | 'h2h'
  | 'totals'
  | 'btts'
  | 'double_chance'
  | 'handicap'
  | 'spread'
  | 'other';

export type OpportunityStatus = 'active' | 'stale' | 'expired' | 'invalidated';

export type WsEventType =
  | 'opportunity:new'
  | 'opportunity:updated'
  | 'opportunity:expired'
  | 'system:no_opportunities'
  | 'system:api_error'
  | 'system:status';

export interface ArbitrageOutcome {
  bookmaker: string;
  bookmakerName: string;
  market: MarketType;
  selection: string;
  odd: number;
  impliedProbability: number;
  stake: number;
  expectedReturn: number;
  oddFetchedAt: string;
  oddChangedAlert: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  eventName: string;
  sport: string;        // ex: 'football', 'basketball', 'tennis'
  league: string;
  commenceTime: string;
  marketType: MarketType;
  marketLabel: string;
  arbitrageMargin: number;
  roi: number;
  bankrollUsed: number;
  totalStake: number;
  guaranteedProfit: number;
  outcomes: ArbitrageOutcome[];
  status: OpportunityStatus;
  detectedAt: string;
  expiresAt: string;
}

export interface SystemStatus {
  healthy: boolean;
  lastSuccessfulFetch: string | null;
  nextScheduledFetch: string | null;
  eventsMonitored: number;
  sportsMonitored: number;
  activeOpportunities: number;
  apiCallsRemaining: number | null;
  consecutiveErrors: number;
  bookmakers?: string[];
}

export interface WsMessage<T = unknown> {
  event: WsEventType;
  data: T;
  timestamp: string;
}

export interface BookmakerConfig {
  slug: string;
  name: string;
  license: string;
  reliability: number;
  region: string;
  note?: string;
}
