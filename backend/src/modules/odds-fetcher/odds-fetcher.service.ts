import { OddsApiClient, OddsApiError } from './odds-api.client.js';
import { MONITORED_SPORTS } from '../../config/sports.js';
import { setWithTTL, getFromCache, ODDS_CACHE_TTL } from '../../cache/redis.js';
import { query } from '../../db/postgres.js';
import type {
  OddsApiV3ArbitrageOpportunity,
  ArbitrageOpportunity,
  ArbitrageOutcome,
  MarketType,
} from '../../types/index.js';
import { logger } from '../../server.js';
import { v4 as uuidv4 } from 'uuid';

const CIRCUIT_BREAKER_THRESHOLD = 3;
const BOOKMAKERS = (process.env.ODDS_API_BOOKMAKERS ?? 'Bet365,Betano').split(',');
const CACHE_KEY = 'odds:arbitrage-bets';

/** Mapa de nomes de mercado da odds-api.io para tipos internos */
const MARKET_MAP: Record<string, MarketType> = {
  'ML':                    'h2h',
  'Over/Under':            'totals',
  'Both Teams to Score':   'btts',
  'Double Chance':         'double_chance',
  'Asian Handicap':        'handicap',
  'Spread':                'spread',
};

export class OddsFetcherService {
  private readonly client: OddsApiClient;
  private consecutiveErrors = 0;
  private circuitOpen = false;
  private lastSuccessfulFetch: Date | null = null;
  private nextScheduledFetch: Date | null = null;
  private opportunityCount = 0;
  private cronJob: ReturnType<typeof setTimeout> | null = null;

  private onArbitrageReadyCallbacks: Array<(opportunities: ArbitrageOpportunity[]) => void> = [];
  private onErrorCallbacks: Array<(error: OddsApiError) => void> = [];

  constructor() {
    this.client = new OddsApiClient();
  }

  /** Registra callback chamado quando novas oportunidades de arbitragem chegam */
  onArbitrageReady(callback: (opportunities: ArbitrageOpportunity[]) => void): void {
    this.onArbitrageReadyCallbacks.push(callback);
  }

  onError(callback: (error: OddsApiError) => void): void {
    this.onErrorCallbacks.push(callback);
  }

  /** Inicia o polling agendado (1 request/minuto via /arbitrage-bets) */
  start(): void {
    const intervalSeconds = Number(process.env.POLLING_INTERVAL_SECONDS ?? 60);

    logger.info(
      { intervalSeconds, bookmakers: BOOKMAKERS, sportsCount: MONITORED_SPORTS.length },
      'OddsFetcherService iniciado — usando /arbitrage-bets (odds-api.io)',
    );

    void this.fetchAll();

    const scheduleNext = (): void => {
      this.cronJob = setTimeout(async () => {
        await this.fetchAll();
        scheduleNext();
      }, intervalSeconds * 1000);
    };

    scheduleNext();
  }

  stop(): void {
    if (this.cronJob !== null) clearTimeout(this.cronJob);
    logger.info('OddsFetcherService parado');
  }

  /**
   * Busca todas as oportunidades de arbitragem via 1 único request.
   * O endpoint /arbitrage-bets da odds-api.io retorna TODOS os esportes
   * e TODOS os mercados automaticamente para os bookmakers configurados.
   */
  async fetchAll(): Promise<ArbitrageOpportunity[]> {
    if (this.circuitOpen) {
      logger.warn('Circuit breaker aberto — pulando fetch de arbitragem');
      return [];
    }

    const intervalSeconds = Number(process.env.POLLING_INTERVAL_SECONDS ?? 60);
    this.nextScheduledFetch = new Date(Date.now() + intervalSeconds * 1000);

    // Verificar cache antes de chamar a API
    const cached = await getFromCache<ArbitrageOpportunity[]>(CACHE_KEY);
    if (cached) {
      logger.debug({ count: cached.length }, 'Oportunidades servidas do cache Redis');
      this.onArbitrageReadyCallbacks.forEach((cb) => cb(cached));
      return cached;
    }

    try {
      const rawOpportunities = await this.client.getArbitrageBets(BOOKMAKERS);

      const opportunities = rawOpportunities.map((raw) =>
        this.mapToInternalOpportunity(raw),
      );

      // Atualizar estado
      this.consecutiveErrors = 0;
      this.circuitOpen = false;
      this.lastSuccessfulFetch = new Date();
      this.opportunityCount = opportunities.length;

      logger.info(
        { opportunityCount: opportunities.length, bookmakers: BOOKMAKERS },
        'Fetch de arbitragem completo',
      );

      // Persistir para auditoria
      await this.persistArbitrageSnapshot(opportunities);

      // Cache com TTL
      await setWithTTL(CACHE_KEY, opportunities, ODDS_CACHE_TTL);

      this.onArbitrageReadyCallbacks.forEach((cb) => cb(opportunities));

      return opportunities;
    } catch (err) {
      if (err instanceof OddsApiError) {
        this.handleApiError(err);
        this.onErrorCallbacks.forEach((cb) => cb(err));
      } else {
        logger.error({ err }, 'Erro inesperado no fetch de arbitragem');
      }
      return [];
    }
  }

  /**
   * Converte uma oportunidade da odds-api.io v3 para o formato interno.
   * As stakes são normalizadas para o bankroll padrão (100).
   * O server.ts pode recalcular para o bankroll do usuário.
   */
  private mapToInternalOpportunity(
    raw: OddsApiV3ArbitrageOpportunity,
  ): ArbitrageOpportunity {
    const DEFAULT_BANKROLL = 100;
    const apiTotalStake = raw.totalStake > 0 ? raw.totalStake : 100;
    const scaleFactor = DEFAULT_BANKROLL / apiTotalStake;

    const detectedAt = new Date();

    const outcomes: ArbitrageOutcome[] = raw.legs.map((leg) => {
      const stakeInfo = raw.optimalStakes.find(
        (s) => s.bookmaker === leg.bookmaker && s.side === leg.side,
      );

      const oddValue = parseFloat(leg.odds) || 1;
      const rawStake = stakeInfo?.stake ?? apiTotalStake / raw.legs.length;
      const adjustedStake = rawStake * scaleFactor;

      return {
        bookmaker: leg.bookmaker,
        bookmakerName: leg.bookmaker,
        market: this.mapMarketType(raw.market.name),
        selection: leg.label || leg.side,
        odd: oddValue,
        impliedProbability: oddValue > 0 ? 1 / oddValue : 0,
        stake: Math.round(adjustedStake * 100) / 100,
        expectedReturn: Math.round(adjustedStake * oddValue * 100) / 100,
        oddFetchedAt: new Date(raw.updatedAt),
        oddChangedAlert: false,
      };
    });

    const eventName = raw.event
      ? `${raw.event.home} vs ${raw.event.away}`
      : `Evento #${raw.eventId}`;

    const marketLabel = this.buildMarketLabel(raw.market);

    return {
      id: raw.id || uuidv4(),
      eventId: String(raw.eventId),
      eventName,
      sport: raw.event?.sport ?? '',
      league: raw.event?.league ?? '',
      commenceTime: raw.event?.date ? new Date(raw.event.date) : new Date(),
      marketType: this.mapMarketType(raw.market.name),
      marketLabel,
      arbitrageMargin: raw.profitMargin,
      roi: raw.profitMargin,
      bankrollUsed: DEFAULT_BANKROLL,
      totalStake: DEFAULT_BANKROLL,
      guaranteedProfit: Math.round(DEFAULT_BANKROLL * raw.profitMargin * 100) / 100,
      outcomes,
      status: 'active',
      detectedAt,
      expiresAt: new Date(detectedAt.getTime() + 90_000),
    };
  }

  private mapMarketType(marketName: string): MarketType {
    return MARKET_MAP[marketName] ?? 'other';
  }

  private buildMarketLabel(market: { name: string; hdp?: number }): string {
    if (market.name === 'Over/Under' && market.hdp !== undefined) {
      return `Over/Under ${market.hdp}`;
    }
    if (market.name === 'Asian Handicap' && market.hdp !== undefined) {
      return `Asian Handicap ${market.hdp > 0 ? '+' : ''}${market.hdp}`;
    }
    return market.name;
  }

  private handleApiError(err: OddsApiError): void {
    this.consecutiveErrors++;
    logger.error(
      { consecutiveErrors: this.consecutiveErrors, message: err.message, statusCode: err.statusCode },
      'Erro ao buscar arbitragem da odds-api.io',
    );

    if (this.consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpen = true;
      logger.error('Circuit breaker ABERTO — muitos erros consecutivos. Polling suspenso.');
    }

    void query(
      `INSERT INTO api_error_logs (api_name, error_code, error_msg) VALUES ($1, $2, $3)`,
      ['odds_api_io', String(err.statusCode ?? 'unknown'), err.message],
    ).catch(() => {});
  }

  /** Persiste snapshot das oportunidades para auditoria */
  private async persistArbitrageSnapshot(
    opportunities: ArbitrageOpportunity[],
  ): Promise<void> {
    if (opportunities.length === 0) return;

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const opp of opportunities) {
      for (const outcome of opp.outcomes) {
        placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        values.push(
          opp.eventId,
          outcome.bookmaker,
          opp.marketType,
          outcome.selection,
          outcome.odd,
          outcome.oddFetchedAt,
        );
      }
    }

    await query(
      `INSERT INTO odds_snapshots (event_id, bookmaker, market, outcome, odd_value, fetched_at)
       VALUES ${placeholders.join(', ')}`,
      values,
    ).catch((err) => logger.error({ err }, 'Falha ao persistir snapshot de arbitragem'));
  }

  get status() {
    return {
      healthy: !this.circuitOpen && this.consecutiveErrors < CIRCUIT_BREAKER_THRESHOLD,
      lastSuccessfulFetch: this.lastSuccessfulFetch,
      nextScheduledFetch: this.nextScheduledFetch,
      eventsMonitored: this.opportunityCount,
      sportsMonitored: MONITORED_SPORTS.length,
      consecutiveErrors: this.consecutiveErrors,
      apiCallsRemaining: this.client.remainingApiRequests,
      bookmakers: BOOKMAKERS,
    };
  }
}
